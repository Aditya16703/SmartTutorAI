# import modules
import logging
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import SummaryNoteOutput
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback
from src.utils.pdf_extractor import extract_text_with_pages, describe_pdf_visuals, extract_text_from_url
from src.utils.youtube_extractor import fetch_youtube_transcript_with_timestamps, fetch_youtube_transcript

# -------------- Agent Node - Notes Summary ----------------
# Primary model: DeepSeek  |  Fallback: Gemini Flash
#
# RAG Integration:
#   1. PDFs → extract_text_with_pages  → ingest with page boundaries
#   2. YouTube → fetch_with_timestamps → ingest with timestamp boundaries
#   3. Topic  → ingest as single "topic" chunk (enables Q&A grounding later)

logger = logging.getLogger(__name__)


def run_node_summary_notes(state: AgentState):
    """
    LLM call to generate summary notes for student (DeepSeek → Gemini fallback).

    Enhancements over v1:
      - Full-document extraction (no 25k char truncation for RAG mode)
      - Page-level / timestamp-level ingestion into pgvector for citations
      - Falls back gracefully if RAG ingestion fails (still generates summary)
    """

    logger.info("node_summary_notes running.... [primary: DeepSeek | RAG enabled]")

    target_lang = state['student_profile'].get("language", "english")

    # ── Source extraction ──────────────────────────────────────────────────
    url = (state['user_prompt'].get('file_url') or '').strip()
    extracted_content = ""
    rag_ingested = False

    if url:
        try:
            from src.services.rag_service import (
                ingest_document,
                has_indexed_chunks,
            )

            learning_space_id = state["learning_space_id"]
            already_indexed = has_indexed_chunks(learning_space_id)

            if "youtube.com" in url or "youtu.be" in url:
                logger.info("🎬 Processing YouTube Source (with timestamps)...")

                if already_indexed:
                    # Re-use transcript text for summary, skip re-ingestion
                    from src.utils.youtube_extractor import fetch_youtube_transcript
                    extracted_content = fetch_youtube_transcript(url)
                    rag_ingested = True
                    logger.info("[RAG] Re-using existing YouTube chunks")
                else:
                    full_text, segments = fetch_youtube_transcript_with_timestamps(url)
                    extracted_content = full_text

                    if full_text and segments:
                        try:
                            n = ingest_document(
                                learning_space_id=learning_space_id,
                                text=full_text,
                                source_type="youtube",
                                source_url=url,
                                timestamp_boundaries=segments,
                            )
                            rag_ingested = n > 0
                            logger.info(f"[RAG] YouTube: ingested {n} chunks")
                        except Exception as rag_err:
                            logger.warning(f"[RAG] YouTube ingestion failed (non-fatal): {rag_err}")
                    elif not full_text:
                        # No captions — fall back to legacy extractor
                        logger.warning("[YouTube] No transcript found, using topic-only summary")
                        extracted_content = ""

            else:
                logger.info("📄 Processing PDF Source (with page tracking)...")

                if already_indexed:
                    # Use legacy extractor for summary context, skip re-ingestion
                    extracted_content = extract_text_from_url(url)
                    rag_ingested = True
                    logger.info("[RAG] Re-using existing PDF chunks")
                else:
                    full_text, page_boundaries, _ = extract_text_with_pages(url)

                    if full_text:
                        # Use up to 80k chars for the summary prompt (much better than 25k)
                        extracted_content = full_text[:80000]

                        try:
                            n = ingest_document(
                                learning_space_id=learning_space_id,
                                text=full_text,
                                source_type="pdf",
                                source_url=url,
                                page_boundaries=page_boundaries,
                            )
                            rag_ingested = n > 0
                            logger.info(f"[RAG] PDF: ingested {n} chunks")
                        except Exception as rag_err:
                            logger.warning(f"[RAG] PDF ingestion failed (non-fatal): {rag_err}")
                    else:
                        logger.warning("[PDF] No text extracted. Trying legacy extractor...")
                        extracted_content = extract_text_from_url(url)

        except ImportError:
            # RAG service not available — fall back to legacy extraction
            logger.warning("[RAG] rag_service not importable, using legacy extraction")
            if "youtube.com" in url or "youtu.be" in url:
                extracted_content = fetch_youtube_transcript(url)
            else:
                extracted_content = extract_text_from_url(url)
        except Exception as e:
            logger.error(f"[RAG] Source ingestion pipeline error: {e}")
            # Final fallback
            if "youtube.com" in url or "youtu.be" in url:
                extracted_content = fetch_youtube_transcript(url)
            else:
                extracted_content = extract_text_from_url(url)

    else:
        logger.info("🧠 No file provided — topic research mode")

    # ── Build user content for summary LLM call ───────────────────────────
    user_text = f"Topic: {state['user_prompt']['topic']}"
    user_text += f"\n\nIMPORTANT: Generate the summary in {target_lang} ONLY."

    if extracted_content:
        # Use first 80k chars for context (model context window dependent)
        context_slice = extracted_content[:80000]
        user_text += f"\n\nSource Material:\n{context_slice}"

        if rag_ingested:
            user_text += (
                "\n\n[Note: The full document has been indexed for Q&A grounding. "
                "Students can ask detailed follow-up questions grounded in the source.]"
            )
    else:
        if url:
            user_text += f"\n\nReference source URL: {url}"

    # ── Prompt template ───────────────────────────────────────────────────
    prompt_template = ChatPromptTemplate([
        ("system", """You are an expert academic tutor. Create personalized educational content following these guidelines:
            
            Student Profile:
            - Class Level: {grade_level}
            - Language: {language} 
            - Gender: {gender}
            - Style: {adaptivity_style}
            
            Content Requirements:
            1. Create concise, well-structured summary notes on the topic.
            2. {style_instructions}
            3. Use bullet points and simple language appropriate for {grade_level}.
            4. Include practical examples and analogies.
            5. Provide content in {language} ONLY. This is a CRITICAL REQUIREMENT. 
            6. If the source material or topic title is in a different language, you MUST TRANSLATE EVERYTHING to {language}.
            7. DO NOT use any other language than {language} in your output.
            8. VISUAL LEARNING: Include at least one Mermaid.js diagram (graph TD or mindmap) to visualize the core concepts, relationship flows, or processes described. Use the language `mermaid` for the code block.
            9. Ensure the Mermaid diagram labels are also in {language}.
            10. MATHEMATICAL & SCIENTIFIC NOTATION: Whenever formulas, physics laws, chemical reactions, or quantitative equations appear, ALWAYS write them using standard LaTeX notation ($...$ for inline equations, $$...$$ for display equations) so they render with crystal-clear mathematical typography.
            """),
        ("user", "{user_content}")
    ])

    try:
        response = call_with_fallback(
            task="summary",
            chain_fn=lambda llm: prompt_template | llm,
            input_data={
                "grade_level": state['student_profile'].get("grade_level", "general"),
                "language": target_lang,
                "gender": state['student_profile'].get("gender", ""),
                "adaptivity_style": state['student_profile'].get("adaptivity_level", "standard"),
                "style_instructions": (
                    "EXPLAIN LIKE I'M 5: Use extreme simplicity, very basic words, and 2x more analogies than usual."
                    if state['student_profile'].get("adaptivity_level") == "simple"
                    else "ACADEMIC ADVANCED: Use rigorous terminology, assume basic knowledge, and provide deeper conceptual insights."
                    if state['student_profile'].get("adaptivity_level") == "advanced"
                    else "Standard academic explanation appropriate for the grade level."
                ),
                "user_content": user_text,
            },
            structured_schema=SummaryNoteOutput,
            temperature=0.1,
        )

        logger.info(f"Summary generated in {target_lang}")

        # Extract summary text from response (handle both dict and object)
        summary_text = ""
        if isinstance(response, dict):
            summary_text = response.get("summary", "")
        elif hasattr(response, "summary"):
            summary_text = response.summary
        else:
            summary_text = str(response)

        logger.info(f"Summary text extracted, length: {len(summary_text)}")

        # Save summary to database
        if summary_text:
            supabase_service.update_learning_space(
                state["learning_space_id"],
                {"summary_notes": summary_text}
            )
            logger.info("✅ Summary notes saved to database")
        else:
            logger.warning("⚠️ No summary text found to save")

        return {
            "summary_notes": summary_text,
            "raw_source_text": extracted_content,
        }

    except Exception as e:
        logger.error(f"Failed to generate summary notes: {e}")
        return {}
