import logging
import datetime
from typing import Optional
from pydantic import BaseModel
from src.services.supabase_service import supabase_service
from src.utils.model_router import call_with_fallback
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)


class MisconceptionDiagnostic(BaseModel):
    concept_name: str
    misconception: str
    remediation_advice: str


def calculate_sm2(quality: int, repetition: int, efactor: float, interval_days: int) -> tuple[int, float, int]:
    """
    SuperMemo SM-2 Spaced Repetition Algorithm.
    quality: 0-5 scale (5 = perfect, 3 = pass with effort, 1 = total blackout)
    Returns: (new_repetition, new_efactor, new_interval_days)
    """
    new_repetition = repetition
    new_interval = interval_days
    new_efactor = efactor

    if quality >= 3:
        if repetition == 0:
            new_interval = 1
        elif repetition == 1:
            new_interval = 6
        else:
            new_interval = int(round(interval_days * efactor))
        new_repetition += 1
    else:
        new_repetition = 0
        new_interval = 1

    new_efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_efactor = max(1.3, round(new_efactor, 2))

    return new_repetition, new_efactor, max(1, new_interval)


def update_concept_mastery(
    user_id: str,
    learning_space_id: str,
    concept_name: str,
    is_correct: bool,
    misconception: Optional[str] = None,
) -> dict:
    """
    Updates a student's concept mastery score using Exponentially Weighted Moving Average
    and schedules their next review date using SM-2 Spaced Repetition.
    """
    try:
        # 1. Fetch current mastery record if exists
        res = (
            supabase_service.client
            .table("concept_mastery")
            .select("*")
            .eq("user_id", user_id)
            .eq("learning_space_id", learning_space_id)
            .eq("concept_name", concept_name)
            .execute()
        )

        existing = res.data[0] if (res.data and len(res.data) > 0) else None

        current_score = existing.get("mastery_score", 0.5) if existing else 0.5
        attempts = existing.get("attempts_count", 0) if existing else 0
        corrects = existing.get("correct_count", 0) if existing else 0
        efactor = existing.get("efactor", 2.5) if existing else 2.5
        interval = existing.get("interval_days", 1) if existing else 1
        repetition = existing.get("repetition", 0) if existing else 0
        misconceptions_list = existing.get("misconceptions", []) if existing else []

        # 2. EWMA Mastery Score update
        weight = 0.35  # recent evidence weight
        observed_value = 1.0 if is_correct else 0.0
        new_score = round(current_score * (1.0 - weight) + observed_value * weight, 3)

        # 3. Status determination
        if new_score >= 0.8:
            status = "mastered"
        elif new_score < 0.5:
            status = "struggling"
        else:
            status = "developing"

        # 4. SM-2 Spaced Repetition
        quality = 5 if is_correct else 1
        new_rep, new_ef, new_int = calculate_sm2(quality, repetition, efactor, interval)

        now = datetime.datetime.now(datetime.timezone.utc)
        next_review = now + datetime.timedelta(days=new_int)

        # Append misconception if diagnosed
        if misconception and misconception not in misconceptions_list:
            misconceptions_list.append(misconception)

        record_data = {
            "user_id": user_id,
            "learning_space_id": learning_space_id,
            "concept_name": concept_name,
            "mastery_score": new_score,
            "attempts_count": attempts + 1,
            "correct_count": corrects + (1 if is_correct else 0),
            "status": status,
            "misconceptions": misconceptions_list,
            "efactor": new_ef,
            "interval_days": new_int,
            "repetition": new_rep,
            "last_reviewed_at": now.isoformat(),
            "next_review_at": next_review.isoformat(),
            "updated_at": now.isoformat(),
        }

        # 5. Upsert into database
        supabase_service.client.table("concept_mastery").upsert(
            record_data, on_conflict="user_id, learning_space_id, concept_name"
        ).execute()

        logger.info(
            f"[Mastery] Updated '{concept_name}' for user {user_id}: "
            f"score={new_score} ({status}), next review in {new_int}d"
        )
        return record_data

    except Exception as e:
        logger.warning(f"[Mastery] Failed to persist mastery update: {e}")
        # Fallback in-memory return
        return {
            "concept_name": concept_name,
            "mastery_score": 0.5 if not is_correct else 0.8,
            "status": "struggling" if not is_correct else "mastered",
        }


def diagnose_quiz_misconception(
    question_text: str,
    chosen_answer: str,
    correct_answer: str,
    explanation: str,
    topic: str,
) -> MisconceptionDiagnostic:
    """
    AI pedagogical diagnosis: Identifies what conceptual confusion caused the student
    to pick this specific distractor, providing a targeted 1-sentence remediation.
    """
    prompt = ChatPromptTemplate([
        ("system", """You are an expert cognitive learning scientist and diagnostic tutor.
Analyze this student's incorrect quiz answer and diagnose their exact cognitive misconception.

Topic: "{topic}"
Question: "{question}"
Correct Answer: "{correct_answer}"
Explanation: "{explanation}"
Student's Chosen Wrong Answer: "{chosen_answer}"

Output Requirements:
1. concept_name: The precise underlying scientific/academic concept (2-4 words, e.g. "Newton's Second Law", "Mitochondrial Respiration", "Fraction Division").
2. misconception: The exact confusion or fallacy that led them to pick the wrong option (1 short sentence, e.g. "Confused speed with rate of change of speed (acceleration)").
3. remediation_advice: A memorable, targeted 1-sentence insight or rule-of-thumb to instantly dispel this misconception.
"""),
        ("user", "Diagnose the misconception.")
    ])

    try:
        response = call_with_fallback(
            task="verification",
            chain_fn=lambda llm: prompt | llm,
            input_data={
                "topic": topic,
                "question": question_text,
                "correct_answer": correct_answer,
                "explanation": explanation,
                "chosen_answer": chosen_answer,
            },
            structured_schema=MisconceptionDiagnostic,
            temperature=0.1,
        )

        if isinstance(response, MisconceptionDiagnostic):
            return response
        elif hasattr(response, "concept_name"):
            return MisconceptionDiagnostic(
                concept_name=response.concept_name,
                misconception=response.misconception,
                remediation_advice=response.remediation_advice,
            )
        else:
            return MisconceptionDiagnostic(
                concept_name=topic,
                misconception="Misapplied key formula or definition",
                remediation_advice=explanation[:200] if explanation else "Review the core definition.",
            )
    except Exception as e:
        logger.warning(f"[Diagnostic] AI misconception diagnosis failed ({e})")
        return MisconceptionDiagnostic(
            concept_name=topic,
            misconception="Concept misunderstanding",
            remediation_advice=explanation[:200] if explanation else "Carefully re-read the topic explanation.",
        )


def get_mastery_breakdown(user_id: str, learning_space_id: str) -> dict:
    """
    Fetches a student's concept mastery breakdown for a given learning space.
    """
    try:
        res = (
            supabase_service.client
            .table("concept_mastery")
            .select("*")
            .eq("user_id", user_id)
            .eq("learning_space_id", learning_space_id)
            .order("mastery_score", desc=False)
            .execute()
        )

        concepts = res.data or []
        if not concepts:
            return {
                "concepts": [],
                "overall_score": 0.5,
                "struggling_count": 0,
                "developing_count": 0,
                "mastered_count": 0,
                "needs_review_count": 0,
            }

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        needs_review = [c for c in concepts if c.get("next_review_at", "") <= now_iso]

        total_score = sum(c.get("mastery_score", 0.5) for c in concepts)
        avg_score = round(total_score / len(concepts), 2)

        struggling = sum(1 for c in concepts if c.get("status") == "struggling")
        developing = sum(1 for c in concepts if c.get("status") == "developing")
        mastered = sum(1 for c in concepts if c.get("status") == "mastered")

        return {
            "concepts": concepts,
            "overall_score": avg_score,
            "struggling_count": struggling,
            "developing_count": developing,
            "mastered_count": mastered,
            "needs_review_count": len(needs_review),
        }
    except Exception as e:
        logger.warning(f"[Mastery] Failed to fetch breakdown: {e}")
        return {
            "concepts": [],
            "overall_score": 0.5,
            "struggling_count": 0,
            "developing_count": 0,
            "mastered_count": 0,
            "needs_review_count": 0,
        }
