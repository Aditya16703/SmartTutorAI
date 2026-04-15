# import modules
import logging
import json
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import RecommendationList
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback

# ----- Agent Node : Recommendation ----
# Primary model: Groq Llama 3  |  Fallback: Gemini Flash

logger = logging.getLogger(__name__)


def run_node_recommendation(state: AgentState):
    """LLM call to generate recommendations (Groq Llama 3 → Gemini fallback)."""

    logger.info("node_recommendation running.... [primary: Groq Llama 3]")

    prompt_template = ChatPromptTemplate([
        ("system", """ 
        You are a helpful academic tutor. Use these instructions to create a recommendation list based on the notes provided by the user:
        
        Student Profile:
        - Class Level: {grade_level}
        - Language: {language} 
        - Gender: {gender}
        
        1. The recommendation should include all the necessary resources to learn the topic.
        2. Create up to 10 quality recommendations with a mixture of books, online lectures, articles etc. 
        3. Adapt your language and complexity based on the student's profile provided and add proper contextual description and url if available with each source.
        4. Respond in JSON format which can be used to render a UI.
        5. Provide content in {language} ONLY. This is a CRITICAL REQUIREMENT. 
        6. If the source material or topic title is in a different language, you MUST TRANSLATE EVERYTHING to {language}.
        7. DO NOT use any other language than {language} in your output.
        """),
        ("user", "Topic Summary {topic_summary}. \n\nIMPORTANT: Generate the content in {language} ONLY.")
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
        logger.warning("No summary notes found, falling back to topic for recommendations")
        summary_text = state['user_prompt']['topic']

    target_lang = state['student_profile'].get("language", "English")
    logger.info(f"Generating recommendations in '{target_lang}' | Primary: Groq Llama 3")

    try:
        response = call_with_fallback(
            task="recommendation",
            chain_fn=lambda llm: prompt_template | llm,
            input_data={
                "grade_level": state['student_profile'].get("grade_level", "general"),
                "language": target_lang,
                "gender": state['student_profile'].get("gender", ""),
                "topic_summary": summary_text,
            },
            structured_schema=RecommendationList,
            temperature=0.1,
        )

        logger.info("Recommendations completed")
        recommendations = response.model_dump()

        result = supabase_service.update_learning_space(
            state["learning_space_id"],
            {"recommendations": recommendations}
        )
        if not result:
            logger.warning("Recommendations update failed, but continuing workflow")
        else:
            logger.info("Recommendations successfully saved to database")

        return {"recommendations": recommendations}

    except Exception as e:
        logger.warning(f"Failed to generate recommendations: {e}")
        return {}