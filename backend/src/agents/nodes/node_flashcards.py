import logging
import json
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import FlashcardTask
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback

# ------- Agent Node - Flashcards ---------------
# Primary model: Mistral AI  |  Fallback: Gemini Flash

logger = logging.getLogger(__name__)


def run_node_flashcards(state: AgentState):
    """LLM call to generate interactive flashcards (Mistral AI → Gemini fallback)."""

    logger.info("node_flashcards is running [primary: Mistral AI]")

    prompt_template = ChatPromptTemplate([
        ("system", """ 
        ## 📚 TASK: FLASHCARD
        ### INPUT:
        Text content on a topic: {topic_summary}

        ### RULES:
        * Generate 5–10 flashcards
        * Questions must be clear and concise ('question' key)
        * Answers must be short (1–2 lines) ('answer' key)
        * NO extra text, NO explanations
        * Output MUST be valid JSON wrapping data in a 'data' array
        * Provide content in {language} ONLY. This is a CRITICAL REQUIREMENT. 
        * Student Level: {grade_level}
        """),
        ("user", "Summarized Study Material: {topic_summary}. \n\nIMPORTANT: Generate content in {language} ONLY.")
    ])

    # Robustly extract summary text from state
    summary_data = state.get("summary_notes")
    summary_text = ""

    if summary_data:
        if isinstance(summary_data, str):
            try:
                parsed = json.loads(summary_data)
                summary_text = parsed.get("summary", summary_data)
            except Exception:
                summary_text = summary_data
        elif hasattr(summary_data, "summary"):
            summary_text = summary_data.summary
        else:
            summary_text = str(summary_data)

    if not summary_text:
        logger.warning("No summary notes found, falling back to topic for flashcards")
        summary_text = state['user_prompt']['topic']

    target_lang = state['student_profile'].get("language", "English")
    logger.info(f"🎯 FLASHCARDS NODE - Target language: '{target_lang}' | Primary: Mistral AI")

    try:
        response = call_with_fallback(
            task="flashcard",
            chain_fn=lambda llm: prompt_template | llm,
            input_data={
                "grade_level": state['student_profile'].get("grade_level", "general"),
                "language": target_lang,
                "topic_summary": summary_text,
            },
            structured_schema=FlashcardTask,
            temperature=0.1,
        )

        flashcards_data = response.model_dump()

        supabase_service.update_learning_space(
            state["learning_space_id"],
            {"flashcards": flashcards_data}
        )

        return {"flashcards": flashcards_data}

    except Exception as e:
        logger.exception(f"🔥 CRITICAL FAILURE in node_flashcards: {str(e)}")
        return {}
