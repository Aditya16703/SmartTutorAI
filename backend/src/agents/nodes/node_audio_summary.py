
# import modules
import time

import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import PodcastContent
from src.services.supabase_service import supabase_service
from datetime import datetime
import re

# ----- Agent Node - Audio Summary

logger = logging.getLogger(__name__)


def run_node_audio_overview(state: AgentState):
    """LLM call to generate aduio overview based on summary content"""

    # generate the chat prompt

    logging.info('Running node_audio_overview ....')

    """Create a personalized prompt based on student profile"""

    prompt_template = ChatPromptTemplate([
        ("system", """
         You are an expert academic female tutor. Your goal is to generate engaging, informative, and personalized educational summaries for students.

            Student Profile:
            - Class Level: {grade_level}
            - Target Language: {language} (Provide content in this language.)
            - Preferred Pronouns: {gender} 

            Podcast Content Requirements:
            1.  Comprehensive Summary: Generate a detailed and well-structured summary of the user-provided topic. This summary should serve as the core script for a 7-10 minute audio podcast episode within a 3000 character limit.
            2.  Academic Appropriateness: Tailor the depth, complexity, and vocabulary of the content precisely to the specified {grade_level}. Assume the student has foundational knowledge typical for their level, but introduce new concepts clearly.
            3.  Engaging Delivery Style:
                - Write in a conversational, accessible, and enthusiastic tone.
                - Incorporate brief, relatable examples or analogies where helpful.
                - Include a brief, friendly introduction and conclusion suitable for a podcast.
            4.  Structure: Your summary should implicitly or explicitly follow a logical podcast flow:
                - Introduction: Hook the listener, introduce the topic.
                - Main Content: Break down the topic into digestible segments.
                - Key Takeaways/Recap: Briefly summarize the main points.
                - Call to Action/Further Exploration:** Encourage continued learning.
            5. Strictly use the 3000 characters limit, if the script goes beyond this, self edit it to adhere to the character limit.
            6. Provide content in {language} only. CRITICAL: unexpected language will be rejected.
            7. If the source material is in a different language, TRANSLATE the content to {language}.
                """),

        ("user",
         "Create a audio summary for the topic summary: {topic_summary}. \n\nIMPORTANT: Generate the script in {language} ONLY.")
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
        logger.warning("No summary notes found, falling back to topic for audio summary")
        summary_text = state['user_prompt']['topic']

    try:
        from src.utils.llm_utils import invoke_with_retry
        
        # init a new model with structured output
        model = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0.2, max_retries=2).with_structured_output(PodcastContent)
    
        chain = prompt_template | model
        
        target_lang = state['student_profile'].get("language", "English")
        logger.info(f"Generating audio script in language: {target_lang} using gemini-flash-latest")
    
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
    
        script_cleaned = response.script.replace(
            "*", "").replace("#", "").replace("**", "")
        print(script_cleaned)
    
        logger.info("LLM response completed.")
    
        supabase_service.update_learning_space(state["learning_space_id"], {
                                            "audio_script": script_cleaned})
    
        return {"podcast_script": script_cleaned}

    except Exception as e:
        logger.warning(f"Failed to update audio script in database: {e}")
        # Continue execution anyway - don't crash the workflow
        return {"podcast_script": None}
