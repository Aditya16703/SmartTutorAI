
# import modules
import time

import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import QuizOutput
from src.services.supabase_service import supabase_service

# ---------------- Agent Node - Quiz ---------------
logger = logging.getLogger(__name__)


def run_node_quiz(state: AgentState):
    """LLM call to generate quiz based on summary content"""

    logger.info('node_quiz is running')

    # generate the chat prompt

    """Create a personalized prompt based on student profile"""

    prompt_template = ChatPromptTemplate([
        ("system", """ 
        You are a helpful academic tutor. Use these instructions to create a quiz on the notes provided by the user:
        
        Student Profile:
            - Class Level: {grade_level}
            - Language: {language} 
            - Gender: {gender}
        
        1. Questions should be in MCQ format with 4 options each.
        2. Create 10 quality questions which tests fundamentals and analytical thinking of the user. 
        3. Adapt your language and complexity based on the student's profile provided.
        4. Respond in JSON format which can be used to render a quiz UI.
        5. Include correct answer, hint and explanation with each question.
        6. Provide content in {language} ONLY. This is a CRITICAL REQUIREMENT. 
        7. If the source material or topic title is in a different language, you MUST TRANSLATE EVERYTHING to {language}.
        8. DO NOT use any other language than {language} in your output.
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
        logger.warning("No summary notes found, falling back to topic for quiz generation")
        summary_text = state['user_prompt']['topic']

    try:
        from src.utils.llm_utils import invoke_with_retry
        
        # Switched to 2.0-flash with low temperature for maximum speed
        model = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0.1, max_retries=2).with_structured_output(QuizOutput)
    
        chain = prompt_template | model
        
        target_lang = state['student_profile'].get("language", "English")
        logger.info(f"🎯 QUIZ NODE - Target language: '{target_lang}', Using gemini-flash-latest")
    
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
    
        logger.info("Completed LLM response step")
    
        quiz_data = response.model_dump()
        
        # Update in supabase database
        supabase_service.update_learning_space(
            state["learning_space_id"], 
            {"quiz": quiz_data}
        )
        
        return {"quiz": quiz_data}

    except Exception as e:
        logger.error(f"Failed to generate quiz: {e}")
        # Return empty dict to preserve existing state instead of overwriting with None
        return {}
