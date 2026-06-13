# -----------------------------------------------------------------------
# orchestrator.py
# Standalone AI Orchestrator endpoint
# POST /api/orchestrator/route
#
# Routing rules:
#   chat            → Groq Llama 3
#   summary         → DeepSeek
#   quiz            → DeepSeek
#   flashcard       → Mistral AI
#   recommendation  → Groq Llama 3
#   audio           → Groq Llama 3 (script only, no TTS here)
#   document_analysis → multi-model chained
#   fallback        → Gemini Flash
# -----------------------------------------------------------------------

import logging
import hashlib
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from langchain_core.prompts import ChatPromptTemplate

from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback, TASK_MODEL_MAP
from src.agents.output_structures import (
    SummaryNoteOutput, QuizOutput, FlashcardList, RecommendationList
)

# Cache versioning: Incrementing this forces a full cache refresh
VERSION_ID = "v2" 

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response schemas ─────────────────────────────────────────

class OrchestratorRequest(BaseModel):
    task_type: Optional[str] = None        # If omitted, auto-detected from content
    content: str                           # User's input / topic / document text
    student_profile: Optional[dict] = None # {grade_level, language, gender}


class OrchestratorResponse(BaseModel):
    task: str
    model: str
    output: Any


# ── Task Detection ─────────────────────────────────────────────────────

def detect_task(content: str, hint: Optional[str]) -> str:
    """Classify content into a task type."""
    if hint and hint.lower() in TASK_MODEL_MAP:
        return hint.lower()

    lower = content.lower()
    if any(k in lower for k in ["quiz", "mcq", "test me", "question"]):
        return "quiz"
    if any(k in lower for k in ["flashcard", "flash card", "term", "definition"]):
        return "flashcard"
    if any(k in lower for k in ["summarize", "summarise", "summary", "notes"]):
        return "summary"
    if any(k in lower for k in ["recommend", "resource", "book", "lecture", "article"]):
        return "recommendation"
    if any(k in lower for k in ["audio", "podcast", "listen", "speak"]):
        return "audio"
    if any(k in lower for k in ["document", "pdf", "analyze", "analyse", "extract"]):
        return "document_analysis"
    return "chat"


# ── Individual task generators ─────────────────────────────────────────

def _run_summary(content: str, profile: dict) -> dict:
    prompt = ChatPromptTemplate([
        ("system", "You are an expert academic tutor. Create a concise, structured summary note for a {grade_level} student in {language}. Use bullet points."),
        ("user", "Topic/Content:\n{content}\n\nIMPORTANT: Respond in {language} ONLY.")
    ])
    result = call_with_fallback(
        task="summary",
        chain_fn=lambda llm: prompt | llm,
        input_data={**profile, "content": content},
        structured_schema=SummaryNoteOutput,
    )
    return result.model_dump()


def _run_quiz(content: str, profile: dict) -> dict:
    prompt = ChatPromptTemplate([
        ("system", """You are a helpful academic tutor. Create 5–10 MCQ questions for a {grade_level} student in {language}.
Include: question, 4 options (A/B/C/D), correct answer, hint, explanation.
Be thorough and test analytical thinking."""),
        ("user", "Topic/Content:\n{content}\n\nIMPORTANT: Respond in {language} ONLY.")
    ])
    result = call_with_fallback(
        task="quiz",
        chain_fn=lambda llm: prompt | llm,
        input_data={**profile, "content": content},
        structured_schema=QuizOutput,
    )
    return result.model_dump()


def _run_flashcards(content: str, profile: dict) -> list:
    prompt = ChatPromptTemplate([
        ("system", "You are a helpful academic tutor. Create 10–15 high-quality flashcards for a {grade_level} student in {language}. Each flashcard: front (question/term) and back (answer/explanation)."),
        ("user", "Topic/Content:\n{content}\n\nIMPORTANT: Respond in {language} ONLY.")
    ])
    result = call_with_fallback(
        task="flashcard",
        chain_fn=lambda llm: prompt | llm,
        input_data={**profile, "content": content},
        structured_schema=FlashcardList,
    )
    return result.model_dump().get("flashcards", [])


def _run_recommendations(content: str, profile: dict) -> list:
    prompt = ChatPromptTemplate([
        ("system", "You are a helpful academic tutor. Provide up to 10 personalized learning recommendations (books, articles, lectures) for a {grade_level} student in {language}."),
        ("user", "Topic/Content:\n{content}\n\nIMPORTANT: Respond in {language} ONLY.")
    ])
    result = call_with_fallback(
        task="recommendation",
        chain_fn=lambda llm: prompt | llm,
        input_data={**profile, "content": content},
        structured_schema=RecommendationList,
    )
    return result.model_dump().get("recommendations", [])


def _run_chat(content: str, profile: dict) -> str:
    prompt = ChatPromptTemplate([
        ("system", "You are a warm, knowledgeable academic tutor. Respond in {language}. Keep answers concise, clear, and appropriate for {grade_level}."),
        ("user", "{content}")
    ])
    result = call_with_fallback(
        task="chat",
        chain_fn=lambda llm: prompt | llm,
        input_data={**profile, "content": content},
        structured_schema=None,
        temperature=0.3,
    )
    return result.content if hasattr(result, 'content') else str(result)


def _run_audio_script(content: str, profile: dict) -> str:
    prompt = ChatPromptTemplate([
        ("system", """You are an expert academic female tutor. Generate a 7–10 minute podcast script (max 3000 characters) in {language} for a {grade_level} student.
Structure: Introduction → Main Content → Key Takeaways → Call to Action.
Keep it conversational and engaging."""),
        ("user", "Topic/Content:\n{content}\n\nIMPORTANT: Respond in {language} ONLY.")
    ])
    result = call_with_fallback(
        task="audio",
        chain_fn=lambda llm: prompt | llm,
        input_data={**profile, "content": content},
        structured_schema=None,
        temperature=0.2,
    )
    text = result.content if hasattr(result, 'content') else str(result)
    return {"text": text}


# ── Main Route ─────────────────────────────────────────────────────────

@router.post("/route", response_model=OrchestratorResponse)
async def orchestrate(request: OrchestratorRequest):
    """
    AI Orchestrator endpoint.
    Detects task type, routes to the appropriate model, and returns
    a strict JSON envelope: { task, model, output }.
    """
    # 1. Detect task
    task = detect_task(request.content, request.task_type)

    # 2. Build student profile (defaults if not provided)
    raw_profile = request.student_profile or {}
    user_id = raw_profile.get("user_id") or request.content # Fallback for detection
    
    # --- PHASE 2: ADAPTIVE LEARNING ---
    adaptivity_level = "standard"
    if user_id:
        try:
            recent_attempts = (
                supabase_service.client
                .table("quiz_attempts")
                .select("score, total_questions")
                .eq("user_id", user_id)
                .order("completed_at", desc=True)
                .limit(3)
                .execute()
            )
            if recent_attempts.data:
                avg_score = sum(a['score'] / a['total_questions'] for a in recent_attempts.data if a['total_questions'] > 0) / len(recent_attempts.data)
                if avg_score < 0.6:
                    adaptivity_level = "simple"
                elif avg_score > 0.9:
                    adaptivity_level = "advanced"
                logger.info(f"[Adaptive] Avg Score: {avg_score:.2f} -> Level: {adaptivity_level}")
        except Exception:
            pass

    profile = {
        "grade_level": raw_profile.get("grade_level", "general"),
        "language":    raw_profile.get("language", "English"),
        "gender":      raw_profile.get("gender", ""),
        "adaptivity_level": adaptivity_level,
    }

    # 3. Determine model name for the response envelope
    model_name = TASK_MODEL_MAP.get(task, "gemini")
    MODEL_DISPLAY = {
        "groq":     "Groq Llama 3",
        "deepseek": "DeepSeek",
        "mistral":  "Mistral AI",
        "gemini":   "Gemini Flash",
        "multi":    "Multi-Model",
    }
    display_model = MODEL_DISPLAY.get(model_name, "Gemini Flash")

    logger.info(f"[Orchestrator] task='{task}' → model='{display_model}'")

    # 4. Resilience: Content Caching
    # Skip caching for 'chat' as it's stateful and usually low-cost
    cache_key = ""
    if task != "chat":
        content_for_hash = f"{VERSION_ID}:{task}:{request.content}:{json.dumps(profile, sort_keys=True)}"
        cache_key = hashlib.sha256(content_for_hash.encode()).hexdigest()
        
        try:
            cached_result = (
                supabase_service.client
                .table("content_cache")
                .select("output")
                .eq("cache_key", cache_key)
                .single()
                .execute()
            )
            if cached_result.data:
                logger.info(f"[Orchestrator] Cache HIT for key {cache_key[:8]}...")
                return OrchestratorResponse(
                    task=task, 
                    model=f"{display_model} (Cached)", 
                    output=cached_result.data["output"]
                )
        except Exception:
            # Table might not exist or other DB error, proceed to generation
            pass

    try:
        # 5. Route to task handler
        if task == "summary":
            output = _run_summary(request.content, profile)

        elif task == "quiz":
            output = _run_quiz(request.content, profile)

        elif task == "flashcard":
            output = _run_flashcards(request.content, profile)

        elif task == "recommendation":
            output = _run_recommendations(request.content, profile)

        elif task == "audio":
            output = _run_audio_script(request.content, profile)
            display_model = "Groq Llama 3"

        elif task == "document_analysis":
            # Multi-model chained run
            display_model = "Multi-Model"
            summary_data = _run_summary(request.content, profile)
            summary_text = summary_data.get("summary", request.content)
            output = {
                "summary":         summary_data,
                "quiz":            _run_quiz(summary_text, profile),
                "flashcards":      _run_flashcards(summary_text, profile),
                "recommendations": _run_recommendations(summary_text, profile),
            }

        else:
            # Default: chat
            task = "chat"
            output = _run_chat(request.content, profile)

        # Save to cache if applicable
        if cache_key:
            try:
                supabase_service.client.table("content_cache").upsert({
                    "cache_key": cache_key,
                    "task": task,
                    "output": output,
                    "created_at": "now()"
                }).execute()
            except Exception:
                pass

        return OrchestratorResponse(task=task, model=display_model, output=output)

    except Exception as e:
        logger.error(f"[Orchestrator] Fatal error for task '{task}': {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Orchestrator failed for task '{task}': {str(e)}"
        )
