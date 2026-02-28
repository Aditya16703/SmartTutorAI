# import modules
import time

import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import RecommendationList
from src.services.supabase_service import supabase_service

# ----- Agent Node : Recommendation ----

logger = logging.getLogger(__name__)


def run_node_recommendation(state: AgentState):
    """LLM call to generate recommendation based on summary content"""

    logger.info("node_recommendation running....")

    # generate the chat prompt

    """Create a personalized prompt based on student profile"""

    prompt_template = ChatPromptTemplate([
        ("system", """ 
        You are a helpful academic tutor. Use these instructions to create a recommendation list based on the notes provided by the user:
        
        Student Profile:
        - Class Level: {grade_level}
        - Language: {language} 
        - Gender: {gender}
        
        1. The recommendation should include all the necessary resources to learn the topic.
        2. Create uptp 10 quality recommendations with a mixture of books, online lectures, articles etc. 
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
                import json
                parsed = json.loads(summary_data)
                summary_text = parsed.get("summary", summary_data)
            except:
                summary_text = summary_data
        elif hasattr(summary_data, "summary"):
            summary_text = summary_data.summary
        else:
            summary_text = str(summary_data)

    if not summary_text:
        logger.warning("No summary notes found, falling back to topic for recommendations")
        summary_text = state['user_prompt']['topic']

    try:
        from src.utils.llm_utils import invoke_with_retry
        
        # Switched to 2.0-flash with low temperature for maximum speed
        model = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0.1, max_retries=2).with_structured_output(RecommendationList)
    
        chain = prompt_template | model

        target_lang = state['student_profile'].get("language", "English")
        logger.info(f"Generating recommendations in language: {target_lang} using gemini-flash-latest")
    
        response = invoke_with_retry(
            chain.invoke,
            {
                "grade_level": state['student_profile'].get("grade_level", "general"),
                "language": target_lang,
                "gender": state['student_profile'].get("gender", ""),
                "topic_summary": summary_text
            },
            max_retries=5,
            initial_delay=2.0
        )
    
        logger.info('LLM response completed.')
        recommendations = response.model_dump()

        # update in supabase database
        result = supabase_service.update_learning_space(state["learning_space_id"], {
                                            "recommendations": recommendations})
        if not result:
            logger.warning("Recommendations update failed, but continuing workflow")
        else:
            logger.info("Recommendations successfully saved to database")

        return {"recommendations": recommendations}

    except Exception as e:
        logger.warning(f"Failed to generate recommendations: {e}")
        # Return empty dict to preserve existing state instead of overwriting with None
        return {}