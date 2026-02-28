# Orchestrate the agent workflow

import logging
from src.services.supabase_service import supabase_service
from src.agents.graph import AgentGraphWorkflow

logger = logging.getLogger(__name__)


def invoke_agent_workflow(learning_space_id: str, user_id: str, language: str | None = None):
    """Orchestrate the agent workflow with error handling."""
    logger.info(f"Starting agent workflow for space {learning_space_id} with language override: {language}")
    
    # get the input data from supabase
    student_profile = supabase_service.get_student_profile(user_id)
    learning_space = supabase_service.get_learning_space(learning_space_id)

    if not learning_space:
        logger.error(f"Learning space not found: {learning_space_id}")
        return None
    
    # Concurrency check: If already generating, avoid parallel runs unless it's been stuck a long time
    current_status = learning_space.get('status')
    if current_status == 'generating':
        logger.warning(f"Workflow already in progress for space {learning_space_id}. Skipping to avoid collision.")
        return None

    # Try to set status to 'generating' immediately
    supabase_service.update_learning_space(learning_space_id, {"status": "generating"})
    
    try:
        if not student_profile:
            logger.error(f"Student profile not found for user {user_id}")
            supabase_service.update_learning_space(learning_space_id, {"status": "failed"})
            return None

        # Determine target language: override > space_stored > profile > default English
        space_language = learning_space.get('language')
        profile_language = student_profile.get('language')
        
        target_language = 'English' # Default
        if language:
            target_language = language
        elif space_language:
            target_language = space_language
        elif profile_language:
            target_language = profile_language
            
        # Ensure target_language is formatted correctly (e.g. 'English', 'Hindi')
        target_language = target_language.capitalize() if target_language else 'English'

        # CRITICAL: Always sync the language back to the database to ensure all items generated use it
        logger.info(f"Syncing target language '{target_language}' to space {learning_space_id}")
        supabase_service.update_learning_space(learning_space_id, {"language": target_language})
        
        # prepare the initial state for agent
        initial_state = {
            "learning_space_id": learning_space_id,
            "student_profile": {
                "gender": student_profile.get('gender', ''),
                "grade_level": student_profile.get('grade_level', 'general'),
                "language": target_language
            },
            "user_prompt": {
                "topic": learning_space.get('topic', 'Untitled'),
                "file_url": learning_space.get('pdf_source', '')
            },
            # Load existing data (should be null if cleared by frontend)
            "summary_notes": learning_space.get('summary_notes', ''),
            "quiz": learning_space.get('quiz', None),
            "flashcards": learning_space.get('flashcards', None),
            "recommendations": learning_space.get('recommendations', None),
            "podcast_script": learning_space.get('audio_script', '')
        }

        # invoke the agent
        agent_workflow = AgentGraphWorkflow
        response = agent_workflow.invoke(initial_state)
        
        # Check if any content was generated
        if not response or (not response.get("summary_notes") and not response.get("quiz") and not response.get("flashcards")):
            logger.warning(f"Workflow completed but no content generated for {learning_space_id}")
            supabase_service.update_learning_space(learning_space_id, {"status": "failed"})
            return response

        # Set status back to normal
        supabase_service.update_learning_space(learning_space_id, {"status": "normal"})
        logger.info(f"Successfully completed agent workflow for space {learning_space_id}")
        return response

    except Exception as e:
        logger.error(f"Error in agent workflow for space {learning_space_id}: {str(e)}")
        supabase_service.update_learning_space(learning_space_id, {"status": "failed"})
        return None
