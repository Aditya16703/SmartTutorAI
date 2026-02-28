import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import FlashcardList
from src.services.supabase_service import supabase_service

# ------- Agent Node - Flashcards ---------------
logger = logging.getLogger(__name__)

def run_node_flashcards(state: AgentState):
    """LLM call to generate interactive flashcards based on summary content"""

    logger.info('node_flashcards is running')

    prompt_template = ChatPromptTemplate([
        ("system", """ 
        You are a helpful academic tutor. Use these instructions to create a deck of interactive flashcards based on the notes provided by the user:
        
        Student Profile:
            - Class Level: {grade_level}
            - Language: {language} 
            - Gender: {gender}
        
        Flashcard Requirements:
        1. Create 10-15 high-quality flashcards.
        2. Each card should have a 'front' (the question or term) and a 'back' (the answer or explanation).
        3. The content should focus on active recall - testing the user's understanding of key concepts, dates, formulas, or definitions.
        4. Clear and concise: The front should be a single question/term, and the back should be a crisp explanation.
        5. Adapt the complexity based on the student's grade level.
        6. Provide content in {language} ONLY. This is a CRITICAL REQUIREMENT. 
        7. If the source material is in a different language, TRANSLATE EVERYTHING to {language}.
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
        logger.warning("No summary notes found, falling back to topic for flashcards")
        summary_text = state['user_prompt']['topic']

    try:
        from src.utils.llm_utils import invoke_with_retry
        
        # High speed 2.0-flash with low temperature
        model = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0.1, max_retries=2).with_structured_output(FlashcardList)
    
        chain = prompt_template | model
        
        target_lang = state['student_profile'].get("language", "English")
        logger.info(f"🎯 FLASHCARDS NODE - Target language: '{target_lang}'")
    
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
    
        flashcards_data = response.model_dump()
        
        # Update in supabase database
        supabase_service.update_learning_space(
            state["learning_space_id"], 
            {"flashcards": flashcards_data}
        )
        
        return {"flashcards": flashcards_data}

    except Exception as e:
        logger.exception(f"🔥 CRITICAL FAILURE in node_flashcards: {str(e)}")
        return {}
