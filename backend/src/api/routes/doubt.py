import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from langchain_core.prompts import ChatPromptTemplate
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback

# Doubt Solver route
# Primary model: Groq Llama 3  |  Fallback: Gemini Flash

logger = logging.getLogger(__name__)

router = APIRouter()


class DoubtRequest(BaseModel):
    learning_space_id: str
    user_id: str
    question: str
    language: Optional[str] = None


class DoubtResponse(BaseModel):
    answer: str
    success: bool


@router.post("/ask", response_model=DoubtResponse)
async def ask_doubt(request: DoubtRequest):
    """
    AI Doubt Solver: Answers a student's follow-up question
    grounded in their learning space's summary notes.
    Primary: Groq Llama 3 | Fallback: Gemini Flash
    """
    try:
        # 1. Fetch learning space data
        learning_space = supabase_service.get_learning_space(request.learning_space_id)
        if not learning_space:
            raise HTTPException(status_code=404, detail="Learning space not found.")

        # 2. Fetch student profile
        student_profile = supabase_service.get_student_profile(request.user_id)

        # 3. Extract summary notes as context
        raw_summary = learning_space.get("summary_notes", "")
        if isinstance(raw_summary, dict):
            context = raw_summary.get("summary", str(raw_summary))
        else:
            context = str(raw_summary) if raw_summary else ""

        topic = learning_space.get("topic", "the current topic")

        # 4. Determine language
        target_lang = (
            request.language
            or (learning_space.get("language") or "").strip()
            or (student_profile or {}).get("language", "English")
        )
        grade_level = (student_profile or {}).get("grade_level", "general")

        # 5. Fetch recent chat history for context (last 5 messages)
        history_context = ""
        try:
            history_response = (
                supabase_service.client
                .table("doubt_messages")
                .select("role, content")
                .eq("learning_space_id", request.learning_space_id)
                .eq("user_id", request.user_id)
                .order("created_at", desc=True)
                .limit(5)
                .execute()
            )
            if history_response.data:
                # Reverse to get chronological order
                history_msgs = history_response.data[::-1]
                history_context = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history_msgs])
        except Exception as h_err:
            logger.warning(f"Could not fetch history for context: {h_err}")

        # 6. Build the prompt
        prompt_template = ChatPromptTemplate([
            ("system", """You are a warm, patient, and encouraging academic tutor helping a rural Indian student.

Student Profile:
- Grade Level: {grade_level}
- Language: {language}

You are helping the student with the topic: "{topic}"

Here are the study notes the student has been learning from:
---
{context}
---

Recent Conversation History (for context):
---
{history}
---

Rules:
1. Answer the student's doubt clearly and simply, appropriate for {grade_level}.
2. Use examples, analogies, and relatable real-world scenarios.
3. ALWAYS respond in {language}. This is CRITICAL.
4. If the doubt is unrelated to the topic, gently redirect them back.
5. Keep your answer concise (under 300 words) but thorough.
6. Be encouraging — use phrases like "Great question!" in {language}.
7. Use the Conversation History to understand follow-up questions (e.g., "What does that mean?").
"""),
            ("user", "{question}")
        ])

        logger.info(
            f"Doubt Solver: answering in {target_lang} for space {request.learning_space_id} "
            f"[history found: {bool(history_context)}]"
        )

        # 7. Call LLM with Gemini fallback
        response = call_with_fallback(
            task="chat",
            chain_fn=lambda llm: prompt_template | llm,
            input_data={
                "grade_level": grade_level,
                "language": target_lang,
                "topic": topic,
                "context": context[:8000],
                "history": history_context or "No previous history.",
                "question": request.question,
            },
            structured_schema=None,
            temperature=0.3,
        )

        answer_text = response.content if hasattr(response, 'content') else str(response)

        # 7. Save conversation to Supabase
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
                }
            ]).execute()
            logger.info("Saved doubt conversation to database")
        except Exception as db_err:
            logger.warning(f"Failed to save doubt messages: {db_err}")

        return DoubtResponse(answer=answer_text, success=True)

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
