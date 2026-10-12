import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from langchain_core.prompts import ChatPromptTemplate
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback

# Doubt Solver route
# Primary model: Groq Llama 3  |  Fallback: Gemini Flash
# RAG: Hybrid vector + BM25 grounded answers with citations

logger = logging.getLogger(__name__)

router = APIRouter()


class DoubtRequest(BaseModel):
    learning_space_id: str
    user_id: str
    question: str
    language: Optional[str] = None


class Citation(BaseModel):
    label: str          # "Page 12", "2:34", "Section 3"
    url: Optional[str]  # deep link to source
    excerpt: str        # short snippet from source
    score: float        # relevance score 0-1


class DoubtResponse(BaseModel):
    answer: str
    success: bool
    citations: list[Citation] = []
    rag_grounded: bool = False   # True if answer used retrieved chunks


@router.post("/ask", response_model=DoubtResponse)
async def ask_doubt(request: DoubtRequest):
    """
    AI Doubt Solver: Answers a student's follow-up question.
    
    v2 Enhancements:
      - Hybrid RAG retrieval (pgvector + BM25) for source-grounded answers
      - Per-response citations with page numbers / YouTube timestamps
      - Graceful fallback to summary-notes context if RAG not available
      - Multi-turn chat history for follow-up comprehension
    
    Primary: Groq Llama 3 | Fallback: Gemini Flash
    """
    try:
        # 1. Fetch learning space data
        learning_space = supabase_service.get_learning_space(request.learning_space_id)
        if not learning_space:
            raise HTTPException(status_code=404, detail="Learning space not found.")

        # 2. Fetch student profile
        student_profile = supabase_service.get_student_profile(request.user_id)

        # 3. Determine language and grade level
        target_lang = (
            request.language
            or (learning_space.get("language") or "").strip()
            or (student_profile or {}).get("language", "English")
        )
        grade_level = (student_profile or {}).get("grade_level", "general")
        topic = learning_space.get("topic", "the current topic")

        # 4. Fetch recent chat history for multi-turn context (last 6 messages)
        history_context = ""
        try:
            history_response = (
                supabase_service.client
                .table("doubt_messages")
                .select("role, content")
                .eq("learning_space_id", request.learning_space_id)
                .eq("user_id", request.user_id)
                .order("created_at", desc=True)
                .limit(6)
                .execute()
            )
            if history_response.data:
                history_msgs = history_response.data[::-1]  # chronological order
                history_context = "\n".join(
                    [f"{m['role'].capitalize()}: {m['content']}" for m in history_msgs]
                )
        except Exception as h_err:
            logger.warning(f"Could not fetch doubt history: {h_err}")

        # 5. ── RAG RETRIEVAL ─────────────────────────────────────────────────
        retrieved_chunks = []
        rag_context = ""
        citations: list[Citation] = []
        rag_grounded = False

        try:
            from src.services.rag_service import (
                retrieve,
                save_citations,
                build_rag_context,
                has_indexed_chunks,
            )

            if has_indexed_chunks(request.learning_space_id):
                retrieved_chunks = retrieve(
                    learning_space_id=request.learning_space_id,
                    query=request.question,
                    top_k=6,
                )

                if retrieved_chunks:
                    rag_context = build_rag_context(retrieved_chunks, max_chars=10000)
                    rag_grounded = True

                    # Build citation objects for API response
                    for chunk in retrieved_chunks[:4]:  # top 4 citations max
                        if chunk.similarity >= 0.35:  # relevance threshold
                            citations.append(Citation(
                                label=chunk.citation_label,
                                url=chunk.citation_url,
                                excerpt=chunk.content[:200].strip() + "...",
                                score=round(chunk.similarity, 3),
                            ))

                    logger.info(
                        f"[RAG] Retrieved {len(retrieved_chunks)} chunks, "
                        f"{len(citations)} citations above threshold"
                    )

                    # Persist citation records for analytics
                    save_citations(
                        learning_space_id=request.learning_space_id,
                        user_id=request.user_id,
                        query=request.question,
                        chunks=retrieved_chunks,
                        response_type="doubt",
                    )
                else:
                    logger.info("[RAG] No relevant chunks found for query")
            else:
                logger.info("[RAG] Space has no indexed chunks yet, using summary context")

        except ImportError:
            logger.warning("[RAG] rag_service not available, using summary fallback")
        except Exception as rag_err:
            logger.warning(f"[RAG] Retrieval failed (non-fatal): {rag_err}")

        # 6. Fallback context: use summary notes if no RAG context
        if not rag_context:
            raw_summary = learning_space.get("summary_notes", "")
            if isinstance(raw_summary, dict):
                fallback_context = raw_summary.get("summary", str(raw_summary))
            else:
                fallback_context = str(raw_summary) if raw_summary else ""
            # Limit to 8000 chars for prompt safety
            rag_context = fallback_context[:8000]

        # 7. ── BUILD PROMPT ───────────────────────────────────────────────────
        if rag_grounded:
            context_instruction = (
                "You have access to VERIFIED SOURCE PASSAGES from the student's learning materials. "
                "ALWAYS ground your answer in these passages. "
                "When citing a source passage, mention the label (e.g., 'As stated on Page 12...' or 'At 2:34 in the video...'). "
                "If the passages do not contain enough information, say so and provide general knowledge."
            )
        else:
            context_instruction = (
                "Use the summary notes below as your primary context. "
                "If the question goes beyond the notes, use your general knowledge while staying on topic."
            )

        prompt_template = ChatPromptTemplate([
            ("system", f"""You are a warm, patient, and encouraging academic tutor.

Student Profile:
- Grade Level: {{grade_level}}
- Language: {{language}}

Topic: "{{topic}}"

{context_instruction}

Source Context:
---
{{context}}
---

Recent Conversation History:
---
{{history}}
---

Rules:
1. Answer the student's doubt clearly and simply, appropriate for {{grade_level}}.
2. Use examples, analogies, and relatable real-world scenarios.
3. ALWAYS respond in {{language}}. This is CRITICAL.
4. If the doubt is unrelated to the topic, gently redirect them back.
5. Keep your answer concise (under 400 words) but thorough.
6. Be encouraging — use phrases like "Great question!" in {{language}}.
7. Use Conversation History to understand follow-up questions.
8. If you cite a source, format it as: [Source: <label>]
"""),
            ("user", "{question}")
        ])

        logger.info(
            f"Doubt Solver: answering in {target_lang} for space {request.learning_space_id} "
            f"[RAG grounded: {rag_grounded}, history: {bool(history_context)}, "
            f"citations: {len(citations)}]"
        )

        # 8. Call LLM with Gemini fallback
        response = call_with_fallback(
            task="chat",
            chain_fn=lambda llm: prompt_template | llm,
            input_data={
                "grade_level": grade_level,
                "language": target_lang,
                "topic": topic,
                "context": rag_context or "No context available.",
                "history": history_context or "No previous history.",
                "question": request.question,
            },
            structured_schema=None,
            temperature=0.3,
        )

        answer_text = response.content if hasattr(response, "content") else str(response)

        # 9. Save conversation to Supabase
        try:
            supabase_service.client.table("doubt_messages").insert([
                {
                    "learning_space_id": request.learning_space_id,
                    "user_id": request.user_id,
                    "role": "user",
                    "content": request.question,
                },
                {
                    "learning_space_id": request.learning_space_id,
                    "user_id": request.user_id,
                    "role": "assistant",
                    "content": answer_text,
                },
            ]).execute()
            logger.info("Saved doubt conversation to database")
        except Exception as db_err:
            logger.warning(f"Failed to save doubt messages: {db_err}")

        return DoubtResponse(
            answer=answer_text,
            success=True,
            citations=citations,
            rag_grounded=rag_grounded,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in doubt solver: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to answer doubt: {str(e)}")


@router.get("/history/{learning_space_id}/{user_id}")
async def get_doubt_history(learning_space_id: str, user_id: str):
    """Fetch chat history for a learning space."""
    try:
        response = (
            supabase_service.client
            .table("doubt_messages")
            .select("*")
            .eq("learning_space_id", learning_space_id)
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .limit(50)
            .execute()
        )
        return {"messages": response.data or [], "success": True}
    except Exception as e:
        logger.error(f"Error fetching doubt history: {str(e)}")
        return {"messages": [], "success": False}


@router.get("/rag-status/{learning_space_id}")
async def get_rag_status(learning_space_id: str):
    """
    Check if a learning space has RAG-indexed document chunks.
    Useful for frontend to show/hide citation UI.
    """
    try:
        from src.services.rag_service import has_indexed_chunks
        indexed = has_indexed_chunks(learning_space_id)
        
        if indexed:
            result = supabase_service.client.table("document_chunks").select(
                "source_type, id", count="exact"
            ).eq("learning_space_id", learning_space_id).execute()
            
            source_types = list({r["source_type"] for r in (result.data or [])})
            return {
                "indexed": True,
                "chunk_count": result.count or 0,
                "source_types": source_types,
            }
        return {"indexed": False, "chunk_count": 0, "source_types": []}
    except Exception as e:
        logger.error(f"Error checking RAG status: {e}")
        return {"indexed": False, "chunk_count": 0, "source_types": []}
