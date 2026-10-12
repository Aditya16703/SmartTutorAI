import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.services.vision_service import solve_homework_image, VisionHomeworkResponse
from src.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()


class VisionHomeworkRequest(BaseModel):
    image_base64: str
    question: Optional[str] = None
    learning_space_id: Optional[str] = None
    user_id: Optional[str] = None
    language: Optional[str] = "English"


@router.post("/solve-homework", response_model=VisionHomeworkResponse)
async def solve_homework(request: VisionHomeworkRequest):
    """
    Multimodal Vision Homework Solver:
    Extracts math, science, or handwritten homework from an image and provides
    a structured step-by-step solution formatted with KaTeX math equations.
    """
    if not request.image_base64 or len(request.image_base64.strip()) < 20:
        raise HTTPException(status_code=400, detail="A valid base64 image is required.")

    grade_level = "general"
    if request.user_id:
        try:
            profile = supabase_service.get_student_profile(request.user_id)
            if profile:
                grade_level = profile.get("grade_level", "general")
        except Exception as e:
            logger.warning(f"Failed to fetch student profile for vision solver: {e}")

    try:
        solution = await solve_homework_image(
            image_base64=request.image_base64,
            user_instruction=request.question,
            language=request.language or "English",
            grade_level=grade_level,
        )

        # Optionally save to doubt messages history if learning_space_id is provided
        if request.learning_space_id and request.user_id:
            try:
                user_msg_content = f"📷 [Uploaded Homework Image]\n{request.question or 'Please solve this homework problem.'}"
                ai_msg_content = f"### 📝 {solution.concept_topic}\n\n**Problem:**\n{solution.extracted_problem}\n\n**Step-by-Step Solution:**\n{solution.step_by_step_solution}\n\n**Final Answer:**\n{solution.final_answer}\n\n**Self-Test:**\n{solution.probing_question}"

                supabase_service.client.table("doubt_messages").insert([
                    {
                        "learning_space_id": request.learning_space_id,
                        "user_id": request.user_id,
                        "role": "user",
                        "content": user_msg_content,
                    },
                    {
                        "learning_space_id": request.learning_space_id,
                        "user_id": request.user_id,
                        "role": "assistant",
                        "content": ai_msg_content,
                    },
                ]).execute()
                logger.info("Saved vision homework solution to doubt messages")
            except Exception as db_err:
                logger.warning(f"Could not persist vision message: {db_err}")

        return solution

    except Exception as e:
        logger.error(f"Error solving vision homework: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze homework image: {str(e)}")
