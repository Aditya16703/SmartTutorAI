import time
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from src.services.agent_workflow import invoke_agent_workflow
from src.services.supabase_service import supabase_service
from src.services.text_to_speech import generate_tts
from src.agents.nodes.node_quiz import run_node_quiz
from src.agents.nodes.node_flashcards import run_node_flashcards
from src.agents.nodes.node_recommendation import run_node_recommendation

logger = logging.getLogger(__name__)

router = APIRouter()

# Define request body model


# Define request body model
class WorkflowRequest(BaseModel):
    learning_space_id: str
    user_id: str
    language: str | None = None  # Optional language override


# --- JOB MANAGEMENT ---
class JobManager:
    """Manages background jobs to allow cancellation and prioritize/limit concurrency."""
    MAX_CONCURRENT_JOBS_PER_USER = 2

    def __init__(self):
        self.active_user_jobs = {} # {user_id: [cancel_flag_list]}
        self.active_invokes = {}   # {user_id: count}

    def register_user_job(self, user_id: str):
        """Registers a cancelable flag for a user (bulk jobs). returns the flag."""
        cancel_flag = {"cancelled": False}
        if user_id not in self.active_user_jobs:
            self.active_user_jobs[user_id] = []
        self.active_user_jobs[user_id].append(cancel_flag)
        return cancel_flag

    def cancel_all_user_jobs(self, user_id: str):
        """Cancels all currently running background jobs for a user."""
        if user_id in self.active_user_jobs:
            logger.info(f"🛑 Cancelling {len(self.active_user_jobs[user_id])} bulk jobs for user {user_id}")
            for flag in self.active_user_jobs[user_id]:
                flag["cancelled"] = True
            self.active_user_jobs[user_id] = []

    def can_start_invoke(self, user_id: str) -> bool:
        """Check if user has reached the max concurrent individual jobs."""
        count = self.active_invokes.get(user_id, 0)
        return count < self.MAX_CONCURRENT_JOBS_PER_USER

    def register_invoke(self, user_id: str):
        self.active_invokes[user_id] = self.active_invokes.get(user_id, 0) + 1

    def unregister_invoke(self, user_id: str):
        if user_id in self.active_invokes and self.active_invokes[user_id] > 0:
            self.active_invokes[user_id] -= 1

job_manager = JobManager()


@router.get("/status/{workflow_id}")
async def workflow_status(workflow_id: str):
    try:
        return {"message": "Workflow started successfully", "workflow_id": workflow_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def _invoke_with_tracking(learning_space_id: str, user_id: str, language: str | None):
    try:
        invoke_agent_workflow(learning_space_id, user_id, language)
    finally:
        job_manager.unregister_invoke(user_id)

@router.post("/invoke")
async def workflow_invoke(request: WorkflowRequest, background_tasks: BackgroundTasks):
    try:
        # 1. Cancel any background bulk regenerations for this user to prioritize this space
        job_manager.cancel_all_user_jobs(request.user_id)
        
        # 2. Check concurrency limit
        if not job_manager.can_start_invoke(request.user_id):
            raise HTTPException(
                status_code=429, 
                detail="You have too many AI generations running simultaneously. Please wait for them to finish."
            )
        
        job_manager.register_invoke(request.user_id)

        # 3. Invoke the workflow
        background_tasks.add_task(
            _invoke_with_tracking, request.learning_space_id, request.user_id, request.language)
        
        return {"message": "Workflow started successfully.", "learning_space_id": request.learning_space_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class RegenerateAllRequest(BaseModel):
    user_id: str
    language: str | None = None


def _regenerate_all_spaces_sequentially(user_id: str, language: str | None, cancel_flag: dict):
    """Process all learning spaces sequentially with cancellation support."""
    try:
        spaces = supabase_service.client.table("learning_space") \
            .select("id") \
            .eq("user_id", user_id) \
            .execute()

        if not spaces.data:
            logger.info(f"No learning spaces found for user {user_id}")
            return

        total = len(spaces.data)
        logger.info(f"🔄 Starting background regeneration of {total} spaces for user {user_id}")

        for i, space in enumerate(spaces.data):
            # Check if this job has been cancelled by a newer request
            if cancel_flag.get("cancelled"):
                logger.info(f"🛑 Bulk regeneration CANCELLED for user {user_id} at space {i+1}/{total}")
                return

            space_id = space["id"]
            logger.info(f"⚡ Regenerating space {i+1}/{total}: {space_id}")
            
            try:
                invoke_agent_workflow(space_id, user_id, language)
            except Exception as inner_e:
                logger.error(f"Failed to regenerate space {space_id}: {str(inner_e)}")

            if i < total - 1:
                # Optimized delay for Flash models (Higher RPM, faster response)
                wait_time = 5 
                logger.info(f"⏳ Waiting {wait_time}s before next space...")
                
                # Sleep in small increments to respond to cancellation quickly
                for _ in range(wait_time):
                    if cancel_flag.get("cancelled"):
                        logger.info(f"🛑 Bulk regeneration CANCELLED during wait for user {user_id}")
                        return
                    time.sleep(1)

        logger.info(f"✅ Finished background regeneration for user {user_id}")
    except Exception as e:
        logger.error(f"Critical error in background regeneration: {str(e)}")


@router.post("/regenerate-all")
async def regenerate_all(request: RegenerateAllRequest, background_tasks: BackgroundTasks):
    try:
        # 1. Cancel any existing jobs for this user first
        job_manager.cancel_all_user_jobs(request.user_id)
        
        # 2. Register a new cancellation flag for this specific run
        cancel_flag = job_manager.register_user_job(request.user_id)

        # 3. Get space count for response
        spaces = supabase_service.client.table("learning_space") \
            .select("id") \
            .eq("user_id", request.user_id) \
            .execute()

        count = len(spaces.data) if spaces.data else 0

        if count == 0:
            return {"message": "No learning spaces to regenerate.", "count": 0}

        # 4. Start sequential background task
        background_tasks.add_task(
            _regenerate_all_spaces_sequentially, request.user_id, request.language, cancel_flag)

        return {
            "message": f"Started background regeneration for {count} spaces. New creations will prioritize over this task.",
            "count": count,
            "success": True
        }
    except Exception as e:
        logger.error(f"Error initiating regenerate-all: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/audio-summary")
async def audio_summary(request: WorkflowRequest):
    try:
        # Cancel background bulk jobs to prioritize this manual request
        job_manager.cancel_all_user_jobs(request.user_id)
        
        # get the learning space
        learning_space = supabase_service.get_learning_space(
            request.learning_space_id)
        student_profile = supabase_service.get_student_profile(request.user_id)

        audio_script = learning_space.get('audio_script') if learning_space else None

        # If no audio script, try to generate one from summary notes
        if not audio_script:
            summary_notes = learning_space.get('summary_notes') if learning_space else None
            if not summary_notes:
                return {
                    "message": "No summary notes available yet. Please wait for the AI workflow to finish generating content first.",
                    "learning_space_id": request.learning_space_id,
                    "success": False
                }

            # Sanitize and limit context length for LLM stability
            context_summary = summary_notes[:15000] # Safety limit
            
            target_lang = request.language or (student_profile or {}).get("language", "English")
            grade_level = (student_profile or {}).get("grade_level", "general")
            gender = (student_profile or {}).get("gender", "neutral")

            prompt_template = ChatPromptTemplate([
                ("system", """
                 You are an expert academic female tutor. Your goal is to generate engaging, informative, and personalized educational summaries for students.

                    Student Profile:
                    - Class Level: {grade_level}
                    - Target Language: {language}
                    - Preferred Pronouns: {gender}

                    Requirements:
                    1. Generate a conversational podcast-style script.
                    2. Tone: Enthusiastic, clear, and academic.
                    3. Structure: Intro, Content, Key takeaways, Outro.
                    4. Provide content in {language} only.
                """),
                ("user", "Create an audio summary for: {topic_summary}. Respond in {language} ONLY.")
            ])

            model = ChatGoogleGenerativeAI(
                model="gemini-flash-latest", 
                temperature=0.2, 
                max_retries=3
            ).with_structured_output(PodcastContent)

            chain = prompt_template | model
            try:
                response = invoke_with_retry(
                    chain.invoke,
                    {
                        "grade_level": grade_level,
                        "language": target_lang,
                        "gender": gender,
                        "topic_summary": context_summary,
                    },
                    max_retries=3
                )
                audio_script = response.script.replace("*", "").replace("#", "").replace("**", "")
            except Exception as script_err:
                logger.error(f"Failed to generate audio script: {script_err}")
                return {
                    "success": False,
                    "message": "Failed to generate audio script. Please try again in a moment."
                }

            # Save the generated script to the database
            supabase_service.update_learning_space(
                request.learning_space_id, {"audio_script": audio_script}
            )
            logger.info("Audio script generated and saved on-demand")

        # Determine language for TTS from learning space or profile
        space_lang = (learning_space.get('language') or '').strip() if learning_space else ''
        profile_lang = ((student_profile or {}).get('language') or '').strip()
        # Use space language first, then profile, then default to English
        tts_language = space_lang or profile_lang or 'english'
        tts = generate_tts(audio_script, tts_language)

        supabase_service.update_learning_space(
            request.learning_space_id, {'audio_overview': tts['public_url']})
        return {
            'success': True,
            'audio_url': tts['public_url']
        }

    except Exception as e:
        logger.error(f"Error in audio-summary: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


def _build_node_state(learning_space, student_profile, request):
    """Build a minimal AgentState for running a single node."""
    target_lang = request.language or (student_profile or {}).get('language', 'English')
    
    # Extract summary_notes - could be JSON object or string
    raw_summary = learning_space.get('summary_notes', '') if learning_space else ''
    if isinstance(raw_summary, dict):
        summary_notes = raw_summary.get('summary', str(raw_summary))
    elif isinstance(raw_summary, str):
        try:
            import json
            parsed = json.loads(raw_summary)
            summary_notes = parsed.get('summary', raw_summary) if isinstance(parsed, dict) else raw_summary
        except (json.JSONDecodeError, TypeError):
            summary_notes = raw_summary
    else:
        summary_notes = str(raw_summary)

    return {
        "learning_space_id": request.learning_space_id,
        "student_profile": {
            "gender": (student_profile or {}).get('gender', ''),
            "grade_level": (student_profile or {}).get('grade_level', 'general'),
            "language": target_lang.capitalize() if target_lang else 'English',
        },
        "user_prompt": {
            "topic": learning_space.get('topic', 'Untitled') if learning_space else 'Untitled',
            "file_url": learning_space.get('pdf_source', '') if learning_space else '',
        },
        "summary_notes": summary_notes,
    }


@router.post("/generate-quiz")
async def generate_quiz(request: WorkflowRequest):
    try:
        # Cancel background bulk jobs to prioritize this manual request
        job_manager.cancel_all_user_jobs(request.user_id)
        
        learning_space = supabase_service.get_learning_space(request.learning_space_id)
        student_profile = supabase_service.get_student_profile(request.user_id)

        if not learning_space or not learning_space.get('summary_notes'):
            return {"success": False, "message": "No summary notes available yet. Please wait for the summary to be generated first."}

        state = _build_node_state(learning_space, student_profile, request)
        result = run_node_quiz(state)

        if not result or not result.get("quiz"):
            return {"success": False, "message": "Quiz generation failed. This may be due to API rate limits — please try again in a minute."}

        return {"success": True, "quiz": result.get("quiz")}
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate-flashcards")
async def generate_flashcards(request: WorkflowRequest):
    try:
        # Cancel background bulk jobs to prioritize this manual request
        job_manager.cancel_all_user_jobs(request.user_id)
        
        learning_space = supabase_service.get_learning_space(request.learning_space_id)
        student_profile = supabase_service.get_student_profile(request.user_id)
 
        if not learning_space or not learning_space.get('summary_notes'):
            return {"success": False, "message": "No summary notes available yet. Please wait for the summary to be generated first."}
 
        state = _build_node_state(learning_space, student_profile, request)
        result = run_node_flashcards(state)
 
        if not result or not result.get("flashcards"):
            return {"success": False, "message": "Flashcards generation failed. This may be due to API rate limits — please try again in a minute."}
 
        return {"success": True, "flashcards": result.get("flashcards")}
    except Exception as e:
        logger.error(f"Error generating flashcards: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate-recommendations")
async def generate_recommendations(request: WorkflowRequest):
    try:
        # Cancel background bulk jobs to prioritize this manual request
        job_manager.cancel_all_user_jobs(request.user_id)
        
        learning_space = supabase_service.get_learning_space(request.learning_space_id)
        student_profile = supabase_service.get_student_profile(request.user_id)

        if not learning_space or not learning_space.get('summary_notes'):
            return {"success": False, "message": "No summary notes available yet. Please wait for the summary to be generated first."}

        state = _build_node_state(learning_space, student_profile, request)
        result = run_node_recommendation(state)

        if not result or not result.get("recommendations"):
            return {"success": False, "message": "Recommendations generation failed. This may be due to API rate limits — please try again in a minute."}

        return {"success": True, "recommendations": result.get("recommendations")}
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))