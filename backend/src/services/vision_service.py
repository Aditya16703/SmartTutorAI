import logging
import re
import json
from typing import Optional
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage
from src.utils.model_router import get_gemini_llm

logger = logging.getLogger(__name__)


class VisionHomeworkResponse(BaseModel):
    extracted_problem: str = Field(description="Exact transcription/OCR of the question, equation, or diagram problem")
    concept_topic: str = Field(description="Primary topic or concept name, e.g. 'Calculus: Chain Rule Differentiation'")
    step_by_step_solution: str = Field(description="Thorough step-by-step solution using KaTeX formatted equations ($ and $$)")
    final_answer: str = Field(description="Concise final numerical, algebraic, or conceptual answer")
    key_formulas: list[str] = Field(default=[], description="Core formulas or laws used in the solution, formatted in KaTeX")
    probing_question: str = Field(description="Socratic check-your-understanding follow-up question for the student")
    success: bool = True


async def solve_homework_image(
    image_base64: str,
    user_instruction: Optional[str] = None,
    language: str = "English",
    grade_level: str = "general",
) -> VisionHomeworkResponse:
    """
    Multimodal Vision Homework Solver:
    Extracts handwritten/printed equations, diagrams, and questions from an image
    and returns a structured, pedagogical step-by-step solution formatted with KaTeX math.
    """
    # 1. Clean and normalize base64 image string
    mime_type = "image/jpeg"
    clean_b64 = image_base64

    if "," in image_base64 and "data:" in image_base64:
        header, clean_b64 = image_base64.split(",", 1)
        mime_match = re.search(r"data:([^;]+);", header)
        if mime_match:
            mime_type = mime_match.group(1)

    clean_b64 = clean_b64.strip()

    # 2. Build multimodal instruction prompt
    system_instruction = f"""You are an elite AI STEM & Humanities Tutor specializing in visual problem solving.
Analyze the provided image containing a homework problem, handwritten equation, science diagram, or textbook question.

Your task:
1. Transcribe the exact problem statement, math expression, or diagram description into 'extracted_problem'.
2. Identify the academic subject and topic ('concept_topic').
3. Solve the problem thoroughly step-by-step ('step_by_step_solution').
   CRITICAL MATH FORMATTING RULES:
   - Wrap ALL inline mathematical expressions, variables, units, and symbols in single dollar signs: $x$, $\\theta$, $9.8\\text{{ m/s}}^2$.
   - Wrap ALL display/block equations in double dollar signs on their own lines:
     $$\\int_a^b f(x)\\,dx = F(b) - F(a)$$
   - Never use raw bracket notation like \\[ \\] or \\( \\).
4. State the final answer clearly in 'final_answer'.
5. List 1 to 3 key formulas or theorems utilized in 'key_formulas' (formatted with KaTeX).
6. Create an engaging Socratic follow-up question in 'probing_question' to test the student's mastery.
7. Language requirement: The explanation must be in {language} and tailored for {grade_level} student level.
"""

    user_text = user_instruction or "Please solve this homework problem step-by-step with clear explanations and formulas."

    message = HumanMessage(
        content=[
            {"type": "text", "text": f"{system_instruction}\n\nStudent Note/Request:\n{user_text}"},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{clean_b64}"},
            },
        ]
    )

    try:
        llm = get_gemini_llm(temperature=0.2, structured_schema=VisionHomeworkResponse)
        response = await llm.ainvoke([message])

        if isinstance(response, VisionHomeworkResponse):
            return response

        # Fallback if raw message returned
        text = response.content if hasattr(response, "content") else str(response)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            return VisionHomeworkResponse(**data)

        return VisionHomeworkResponse(
            extracted_problem="Problem identified in uploaded image",
            concept_topic="STEM Problem Solving",
            step_by_step_solution=text,
            final_answer="See solution steps above",
            key_formulas=[],
            probing_question="Can you explain how the first step was derived?",
            success=True,
        )

    except Exception as e:
        logger.error(f"Vision homework solver failed: {e}")
        # Try raw non-structured fallback
        try:
            raw_llm = get_gemini_llm(temperature=0.2)
            raw_res = await raw_llm.ainvoke([message])
            raw_text = raw_res.content if hasattr(raw_res, "content") else str(raw_res)
            return VisionHomeworkResponse(
                extracted_problem="Problem from uploaded image",
                concept_topic="General Problem Solving",
                step_by_step_solution=raw_text,
                final_answer="Refer to detailed steps above",
                key_formulas=[],
                probing_question="Would you like to try solving a similar practice problem?",
                success=True,
            )
        except Exception as raw_err:
            logger.error(f"Raw vision fallback failed: {raw_err}")
            return VisionHomeworkResponse(
                extracted_problem="Could not clearly read image.",
                concept_topic="Image Processing Error",
                step_by_step_solution=f"We encountered an issue analyzing the image: {str(e)}. Please ensure the photo is well-lit and the writing is clear.",
                final_answer="N/A",
                key_formulas=[],
                probing_question="Could you re-take the photo or type the question manually?",
                success=False,
            )
