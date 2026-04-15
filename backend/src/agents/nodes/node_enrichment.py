import logging
from src.agents.state import AgentState
from src.services.supabase_service import supabase_service
from src.utils.pdf_extractor import describe_pdf_visuals

# -------------- Agent Node - Visual Enrichment ----------------
# This node runs in the background to add slow multimodal context 
# (Diagrams, formulas, charts) after the initial summary is visible.

logger = logging.getLogger(__name__)

def run_node_enrichment(state: AgentState):
    """Background task to enrich the summary with visual context/diagrams."""
    
    url = state['user_prompt'].get('file_url', '').strip()
    if not url or "youtube.com" in url or "youtu.be" in url:
        logger.info("Skipping visual enrichment (No PDF detected).")
        return {}

    logger.info("🎨 Running node_enrichment for deep visual analysis...")

    try:
        # 1. Perform slow multimodal analysis
        visual_descriptions = describe_pdf_visuals(url)
        
        if not visual_descriptions:
            logger.info("No meaningful visuals found to enrich.")
            return {}

        # 2. Extract current summary to update it
        current_summary = state.get("summary_notes")
        if not current_summary:
            logger.warning("Enrichment failed: No existing summary notes to append to.")
            return {}

        # 3. Update the summary with visuals
        # We append the visuals to the end of the summary for the DB
        # If it's a Pydantic object, we handle it
        import json
        
        updated_notes = current_summary
        if hasattr(current_summary, "summary"):
            updated_notes.summary = f"{current_summary.summary}\n\n{visual_descriptions}"
            data_to_store = updated_notes.model_dump()
        else:
            # Fallback if it's raw text
            updated_notes = f"{current_summary}\n\n{visual_descriptions}"
            data_to_store = {"summary": updated_notes}

        # 4. Push to Supabase to trigger frontend update
        supabase_service.update_learning_space(
            state["learning_space_id"],
            {"summary_notes": data_to_store}
        )
        
        logger.info("🎨 Visual enrichment complete and pushed to DB.")
        return {"summary_notes": updated_notes}

    except Exception as e:
        logger.error(f"🔥 Visual enrichment failed: {e}")
        return {}
