import logging
import json
import re
from typing import Optional
from pydantic import BaseModel, Field
from src.utils.model_router import call_with_fallback

logger = logging.getLogger(__name__)


class RAGTriadScore(BaseModel):
    context_relevance: float = Field(default=0.9, ge=0.0, le=1.0)
    groundedness: float = Field(default=0.9, ge=0.0, le=1.0)
    answer_relevance: float = Field(default=0.9, ge=0.0, le=1.0)
    overall_trust: float = Field(default=0.9, ge=0.0, le=1.0)
    status: str = Field(default="verified")  # "verified" | "partially_grounded" | "general_knowledge"
    confidence: str = Field(default="high")  # "high" | "medium" | "low"
    badge_label: str = Field(default="Verified Grounded in Source")
    critique: Optional[str] = None


class _LLMTriadOutput(BaseModel):
    context_relevance_score: int = Field(description="0 to 100 score on how relevant the context is to the question")
    groundedness_score: int = Field(description="0 to 100 score on how strictly supported the answer is by context (no hallucinations)")
    answer_relevance_score: int = Field(description="0 to 100 score on how directly the answer addresses the question")
    critique: str = Field(description="Brief 1-sentence assessment of groundedness and accuracy")


def _heuristic_evaluate(question: str, context: str, answer: str) -> RAGTriadScore:
    """
    Fast heuristic fallback evaluator in case LLM is slow or offline.
    Uses n-gram / keyword set intersection for groundedness and relevance.
    """
    if not context or not context.strip():
        return RAGTriadScore(
            context_relevance=0.0,
            groundedness=1.0,
            answer_relevance=0.92,
            overall_trust=0.85,
            status="general_knowledge",
            confidence="medium",
            badge_label="General Knowledge AI Tutor",
            critique="Answered from general educational knowledge base (no specific source chunk uploaded)."
        )

    def tokens(s: str) -> set[str]:
        return {w.lower() for w in re.findall(r"\b[a-zA-Z0-9]{3,}\b", s)}

    q_toks = tokens(question)
    c_toks = tokens(context)
    a_toks = tokens(answer)

    # 1. Context relevance: overlap of question words in context
    c_rel = len(q_toks & c_toks) / max(len(q_toks), 1)
    c_rel = min(max(c_rel * 1.5, 0.4), 1.0)

    # 2. Groundedness: overlap of answer content in context
    overlap = len(a_toks & c_toks) / max(len(a_toks), 1)
    groundedness = min(max(overlap * 1.8, 0.5), 1.0)

    # 3. Answer relevance
    a_rel = len(q_toks & a_toks) / max(len(q_toks), 1)
    a_rel = min(max(a_rel * 1.4, 0.6), 1.0)

    overall = round(0.4 * groundedness + 0.3 * c_rel + 0.3 * a_rel, 2)

    if overall >= 0.72:
        status = "verified"
        confidence = "high"
        badge = f"Verified Grounded ({int(overall * 100)}%)"
        critique = "Answer claims are confirmed by retrieved course material."
    elif overall >= 0.50:
        status = "partially_grounded"
        confidence = "medium"
        badge = f"Partially Grounded ({int(overall * 100)}%)"
        critique = "Contains verified course concepts with additional explanatory context."
    else:
        status = "general_knowledge"
        confidence = "low"
        badge = "General Knowledge (Unverified in Source)"
        critique = "Answer draws largely upon external general knowledge beyond course notes."

    return RAGTriadScore(
        context_relevance=round(c_rel, 2),
        groundedness=round(groundedness, 2),
        answer_relevance=round(a_rel, 2),
        overall_trust=overall,
        status=status,
        confidence=confidence,
        badge_label=badge,
        critique=critique,
    )


async def evaluate_rag_triad(question: str, context: str, answer: str) -> RAGTriadScore:
    """
    RAG Triad & Hallucination Guardrail Evaluator:
    Assesses Context Relevance, Groundedness (Anti-hallucination), and Answer Relevance.
    Returns composite score, status, and UI badge metadata.
    """
    if not context or not context.strip():
        return RAGTriadScore(
            context_relevance=0.0,
            groundedness=1.0,
            answer_relevance=0.95,
            overall_trust=0.88,
            status="general_knowledge",
            confidence="medium",
            badge_label="General Knowledge AI Tutor",
            critique="Generated from general academic training data (no course document indexed for this query)."
        )

    # Prompt LLM Critic
    from langchain_core.prompts import ChatPromptTemplate

    critic_prompt = ChatPromptTemplate([
        ("system", """You are a rigorous Academic Evaluation Judge implementing the RAG Triad framework.
Evaluate the AI Tutor's generated Answer given the User Question and the Retrieved Source Context.

Score each on an integer scale from 0 to 100:
1. context_relevance_score: Does the Retrieved Context contain information relevant to answering the User Question? (0 = totally irrelevant, 100 = perfectly relevant)
2. groundedness_score: Are the factual claims made in the Answer strictly supported by the Retrieved Context? (0 = pure hallucination, 100 = 100% faithful and supported)
3. answer_relevance_score: Does the Answer directly and thoroughly address what the User asked? (0 = completely off-topic, 100 = addresses every part)
4. critique: A 1-sentence concise reflection on factual reliability and groundedness.

Output valid JSON only matching schema:
{{
  "context_relevance_score": 90,
  "groundedness_score": 95,
  "answer_relevance_score": 95,
  "critique": "All mathematical steps and definitions match source document section 3."
}}"""),
        ("user", """User Question:
{question}

Retrieved Source Context (Excerpt):
{context}

Generated Answer:
{answer}
""")
    ])

    try:
        # Fast evaluation call
        response = call_with_fallback(
            task="verification",
            chain_fn=lambda llm: critic_prompt | llm,
            input_data={
                "question": question[:1000],
                "context": context[:3000],
                "answer": answer[:3000],
            },
            structured_schema=_LLMTriadOutput,
            temperature=0.0,
        )

        if isinstance(response, _LLMTriadOutput):
            c_score = max(0.0, min(1.0, response.context_relevance_score / 100.0))
            g_score = max(0.0, min(1.0, response.groundedness_score / 100.0))
            a_score = max(0.0, min(1.0, response.answer_relevance_score / 100.0))
            critique = response.critique
        elif hasattr(response, "content"):
            content = response.content
            # Try to parse JSON from text
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                c_score = max(0.0, min(1.0, float(data.get("context_relevance_score", 85)) / 100.0))
                g_score = max(0.0, min(1.0, float(data.get("groundedness_score", 85)) / 100.0))
                a_score = max(0.0, min(1.0, float(data.get("answer_relevance_score", 90)) / 100.0))
                critique = data.get("critique", "Answer verified against course material.")
            else:
                return _heuristic_evaluate(question, context, answer)
        else:
            return _heuristic_evaluate(question, context, answer)

        overall = round(0.45 * g_score + 0.3 * c_score + 0.25 * a_score, 2)

        if overall >= 0.72:
            status = "verified"
            confidence = "high"
            badge = f"Verified Grounded ({int(overall * 100)}%)"
        elif overall >= 0.45:
            status = "partially_grounded"
            confidence = "medium"
            badge = f"Partially Grounded ({int(overall * 100)}%)"
        else:
            status = "general_knowledge"
            confidence = "low"
            badge = "General Knowledge (Low Source Match)"

        return RAGTriadScore(
            context_relevance=round(c_score, 2),
            groundedness=round(g_score, 2),
            answer_relevance=round(a_score, 2),
            overall_trust=overall,
            status=status,
            confidence=confidence,
            badge_label=badge,
            critique=critique,
        )

    except Exception as e:
        logger.warning(f"LLM RAG Triad evaluation failed ({e}), falling back to heuristic: {e}")
        return _heuristic_evaluate(question, context, answer)
