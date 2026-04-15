# ----
# This file contains the State of the agent
# ----

# Student profile type definition
from typing import Optional, TypedDict
class StudentProfile(TypedDict):
    gender: str
    grade_level: str  # e.g., "class 6", "12th", "undergrad", "postgrad"
    language: str     # e.g., "hindi", "english", "marathi"
    adaptivity_level: Optional[str] # "simple", "standard", "advanced"


class UserPrompt(TypedDict):
    topic: str
    file_url: Optional[str]


class AgentState(TypedDict):
    learning_space_id: str
    student_profile: StudentProfile
    user_prompt: UserPrompt
    summary_notes: str
    podcast_script: str
    quiz: str
    flashcards: str
    recommendations: str
    study_plan: str
    raw_source_text: str  # Original text from PDF or YouTube Transcript
