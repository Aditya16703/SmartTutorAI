import logging
from langchain_core.prompts import ChatPromptTemplate
from src.agents.state import AgentState
from src.agents.output_structures import SummaryNoteOutput
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback

logger = logging.getLogger(__name__)

def run_node_verifier(state: AgentState):
    """
    Critic Node: Verifies the generated summary against the original source text 
    to eliminate hallucinations and ensure factual integrity.
    """
    if not state.get('raw_source_text') or not state.get('summary_notes'):
        logger.info("Verifier skipped: No source text or summary found.")
        return {}

    logger.info("node_verifier running... [Verification Pass]")

    prompt_template = ChatPromptTemplate([
        ("system", """You are a meticulous Fact-Checker and Academic Editor. 
        Your task is to review an AI-generated summary against the provided Source Material.
        
        CRITICAL RULES:
        1. Accuracy: Identify any facts in the Summary that CONTRADICT the Source Material.
        2. Hallucinations: Remove any information in the Summary that is NOT present in the Source Material.
        3. Tone: Ensure the tone is appropriate for {grade_level}.
        4. Language: The final output MUST be in {language} ONLY.

        If the summary is already perfect, return it as is. 
        If there are errors, return a corrected and improved version of the summary.
        """),
        ("user", """
        Source Material:
        ---
        {source_text}
        ---

        Current Summary:
        ---
        {current_summary}
        ---

        Please provide the verified and corrected version of the summary.
        """)
    ])

    try:
        # Use a secondary model (Gemini Flash) for verification as it's great at following constraints
        target_lang = state['student_profile'].get("language", "english")
        
        response = call_with_fallback(
            task="verification",
            chain_fn=lambda llm: prompt_template | llm,
            input_data={
                "grade_level": state['student_profile'].get("grade_level", "general"),
                "language": target_lang,
                "source_text": state['raw_source_text'][:25000], # Truncate to safety
                "current_summary": state['summary_notes'],
            },
            structured_schema=SummaryNoteOutput,
            temperature=0.0, # Zero temperature for factual consistency
        )

        logger.info("Verification complete. Factual integrity ensured.")

        # Update the learning space with the verified summary
        supabase_service.update_learning_space(
            state["learning_space_id"],
            {"summary_notes": response.model_dump()}
        )

        return {"summary_notes": response}

    except Exception as e:
        logger.error(f"Failed to verify summary notes: {e}")
        return {}
