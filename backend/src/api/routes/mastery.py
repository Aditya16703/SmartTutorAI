import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.services.mastery_service import (
    update_concept_mastery,
    diagnose_quiz_misconception,
    get_mastery_breakdown,
)
from src.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()


class RecordAttemptRequest(BaseModel):
    user_id: str
    learning_space_id: str
    concept_name: str
    is_correct: bool
    misconception: Optional[str] = None


class DiagnoseMisconceptionRequest(BaseModel):
    user_id: str
    learning_space_id: str
    question_text: str
    chosen_answer: str
    correct_answer: str
    explanation: str
    topic: str


@router.post("/record-attempt")
async def record_attempt(request: RecordAttemptRequest):
    """
    Records a student's answer attempt for a concept, updates EWMA mastery score,
    and schedules next review using SM-2 Spaced Repetition.
    """
    try:
        updated = update_concept_mastery(
            user_id=request.user_id,
            learning_space_id=request.learning_space_id,
            concept_name=request.concept_name,
            is_correct=request.is_correct,
            misconception=request.misconception,
        )
        return {"success": True, "mastery": updated}
    except Exception as e:
        logger.error(f"Error recording mastery attempt: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/diagnose")
async def diagnose(request: DiagnoseMisconceptionRequest):
    """
    Diagnoses an incorrect quiz answer, extracts the underlying concept and misconception,
    generates actionable 1-sentence remediation advice, and updates the concept mastery graph.
    """
    try:
        # 1. AI diagnostic
        diagnostic = diagnose_quiz_misconception(
            question_text=request.question_text,
            chosen_answer=request.chosen_answer,
            correct_answer=request.correct_answer,
            explanation=request.explanation,
            topic=request.topic,
        )

        # 2. Update student's concept mastery score as incorrect with misconception
        updated_mastery = update_concept_mastery(
            user_id=request.user_id,
            learning_space_id=request.learning_space_id,
            concept_name=diagnostic.concept_name,
            is_correct=False,
            misconception=diagnostic.misconception,
        )

        # 3. Log diagnostic to database for student review
        try:
            supabase_service.client.table("misconception_logs").insert([{
                "user_id": request.user_id,
                "learning_space_id": request.learning_space_id,
                "concept_name": diagnostic.concept_name,
                "question_text": request.question_text,
                "chosen_answer": request.chosen_answer,
                "correct_answer": request.correct_answer,
                "diagnosed_misconception": diagnostic.misconception,
                "remediation_advice": diagnostic.remediation_advice,
            }]).execute()
        except Exception as log_err:
            logger.warning(f"Could not log misconception: {log_err}")

        return {
            "success": True,
            "concept_name": diagnostic.concept_name,
            "misconception": diagnostic.misconception,
            "remediation_advice": diagnostic.remediation_advice,
            "mastery": updated_mastery,
        }

    except Exception as e:
        logger.error(f"Error diagnosing misconception: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/breakdown/{learning_space_id}/{user_id}")
async def breakdown(learning_space_id: str, user_id: str):
    """
    Retrieves the concept mastery breakdown for a student in a learning space.
    """
    try:
        result = get_mastery_breakdown(user_id=user_id, learning_space_id=learning_space_id)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error fetching mastery breakdown: {e}")
        raise HTTPException(status_code=500, detail=str(e))
