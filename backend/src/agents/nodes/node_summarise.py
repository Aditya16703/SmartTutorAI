# import modules
import time

import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import SummaryNoteOutput
from src.services.supabase_service import supabase_service

# -------------- Agent Node - Notes Summary ----------------

logger = logging.getLogger(__name__)


def run_node_summary_notes(state: AgentState):
    """LLM call to generate summary notes for student"""

    logger.info("node_summary_notes running....")
    logger.info(state)

    # generate the chat prompt

    # Build human message content dynamically
    target_lang = state['student_profile'].get("language", "english")
    user_content = [
        {"type": "text", "text": f"Topic: {state['user_prompt']['topic']}. \n\nIMPORTANT: Generate the summary in {target_lang} ONLY."}]

    # Add file only if it exists
    if state['user_prompt']['file_url'] and state['user_prompt']['file_url'].strip():
        user_content.append({
            "type": "file",
            "url": state['user_prompt']['file_url'],
            "source_type": "url"
        })

    prompt_template = ChatPromptTemplate([
        ("system", """You are an expert academic tutor. Create personalized educational content following these guidelines:
            
            Student Profile:
            - Class Level: {grade_level}
            - Language: {language} 
            - Gender: {gender}
            
            Content Requirements:
            1. Use the audio/image/pdf if provided by the user to generate concise summary notes
            2. Use bullet points and simple language appropriate for {grade_level}
            3. Include practical examples and analogies
            4. Make it engaging and easy to understand
            5. Provide content in {language} ONLY. This is a CRITICAL REQUIREMENT. 
            6. If the source material or topic title is in a different language, you MUST TRANSLATE EVERYTHING to {language}.
            7. DO NOT use any other language than {language} in your output.
            
            """),
        ("user", user_content)
    ])

    # init a new model with structured output
    try:
        from src.utils.llm_utils import invoke_with_retry
        
        # Switched to 2.0-flash with low temperature for maximum speed
        model = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0.1, max_retries=2).with_structured_output(SummaryNoteOutput)
    
        chain = prompt_template | model
        
        # Log the language we are generating for
        target_lang = state['student_profile'].get("language", "English")
        logger.info(f"Generating summary in language: {target_lang} using gemini-flash-latest")
    
        response = invoke_with_retry(
            chain.invoke,
            {
                "grade_level": state['student_profile'].get("grade_level", "general"),
                "language": target_lang,
                "gender": state['student_profile'].get("gender", ""),
            },
            max_retries=5,
            initial_delay=2.0 
        )
    
        # update in supabase database
        # supabase_response = (
        #     supabase.table("learning_space")
        #     .update({"summary_notes": response.model_dump()})
        #     .eq("id", state["learning_space_id"])
        #     .execute()
        # )
    
        logger.info("Completed LLM response step")
    
        supabase_service.update_learning_space(state["learning_space_id"], {
                                            "summary_notes": response.model_dump()})
    
        return {"summary_notes": response}

    except Exception as e:
        logger.error(f"Failed to generate summary notes: {e}")
        # Return empty dict to avoid overwriting existing data in state
        return {}
