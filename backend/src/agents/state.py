# ----
# This file contains the State of the agent
# ----

# Student profile type definition
from typing import Optional, TypedDict
class StudentProfile(TypedDict):
    gender: str
    grade_level: str  # e.g., "class 6", "12th", "undergrad", "postgrad"
    language: str     # e.g., "hindi", "english", "marathi"


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
    recommendations: str
    study_plan: str
