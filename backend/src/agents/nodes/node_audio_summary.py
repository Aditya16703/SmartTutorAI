import logging
import json
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import AudioTask
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback

# ----- Agent Node - Audio Summary -----
# Script generation: Groq Llama 3  |  Fallback: Gemini Flash

logger = logging.getLogger(__name__)


def run_node_audio_overview(state: AgentState):
    """LLM call to generate audio script (Groq Llama 3 → Gemini fallback)."""

    logging.info("Running node_audio_overview.... [primary: Groq Llama 3]")

    prompt_template = ChatPromptTemplate([
        ("system", """
        ## 🔊 TASK: AUDIO
        ### INPUT:
        Text content for study summary: {topic_summary}

        ### RULES:
        * Text must be clean and natural for speech
        * Remove symbols, markdown, emojis, asterisks (*), hashtags (#)
        * Keep sentences short and clear
        * Output MUST be valid JSON: {{ "task": "audio", "data": {{ "text": "..." }} }}
        * Provide content in {language} ONLY. 
        * Academic Level: {grade_level}
        """),
        ("user", "Summarized Study Material: {topic_summary}. \n\nIMPORTANT: Generate clean script in {language} ONLY.")
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
        logger.warning("No summary notes found, falling back to topic for audio summary")
        summary_text = state['user_prompt']['topic']

    target_lang = state['student_profile'].get("language", "English")
    logger.info(f"Generating audio script in '{target_lang}' | Primary: Groq Llama 3")

    try:
        response = call_with_fallback(
            task="audio",
            chain_fn=lambda llm: prompt_template | llm,
            input_data={
                "grade_level": state['student_profile'].get("grade_level", "general"),
                "language": target_lang,
                "topic_summary": summary_text,
            },
            structured_schema=AudioTask,
            temperature=0.2,
        )

        script_cleaned = response.data.text
        logger.info("Audio script generation completed [Strict Protocol]")

        supabase_service.update_learning_space(
            state["learning_space_id"],
            {"audio_script": script_cleaned}
        )

        return {"podcast_script": script_cleaned}

    except Exception as e:
        logger.warning(f"Failed to generate audio script: {e}")
        return {"podcast_script": None}
