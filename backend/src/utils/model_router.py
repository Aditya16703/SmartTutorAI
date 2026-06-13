# -----------------------------------------------------------------------
# model_router.py
# Central routing utility: picks the right LLM for each educational task
# and provides Gemini Flash as the universal fallback.
#
# ADDED: ProviderHealthTracker — Circuit Breaker pattern.
# If a provider fails 3× within a 5-min window it is marked DEGRADED and
# call_with_fallback() skips straight to Gemini, avoiding redundant calls.
# -----------------------------------------------------------------------

import os
import logging
import time
from typing import Any, Type, Optional
from pydantic import BaseModel
from src.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

def log_provider_health(provider: str, task: str, success: bool, latency: float, error: str = None):
    """Logs provider health to Supabase for observability dashboard."""
    try:
        supabase_service.client.table("ai_provider_logs").insert([{
            "provider": provider,
            "task": task,
            "success": success,
            "latency": latency,
            "error_message": error,
            "created_at": "now()"
        }]).execute()
    except Exception as e:
        logger.warning(f"Failed to log provider health: {e}")


# ── Routing table ──────────────────────────────────────────────────────
TASK_MODEL_MAP: dict[str, str] = {
    "summary":           "gemini",
    "quiz":              "groq",
    "flashcard":         "mistral",
    "recommendation":    "groq",
    "chat":              "groq",
    "audio":             "groq",
    "verification":      "gemini",
    "document_analysis": "gemini",
    "fallback":          "gemini",
}


# ── Circuit Breaker: Provider Health Tracker ───────────────────────────

class ProviderHealthTracker:
    """
    Tracks per-provider failure counts.
    If a provider exceeds FAILURE_THRESHOLD failures within WINDOW_SECONDS,
    it is marked DEGRADED and bypassed until the window resets.
    """

    FAILURE_THRESHOLD = 3        # failures before marking degraded
    WINDOW_SECONDS    = 300      # 5-minute rolling window
    COOLDOWN_SECONDS  = 120      # 2-minute cooldown before re-attempting

    def __init__(self):
        # provider → {"failures": int, "window_start": float, "degraded_since": float|None}
        self._state: dict[str, dict] = {}

    def _ensure(self, provider: str):
        if provider not in self._state:
            self._state[provider] = {
                "failures":       0,
                "window_start":   time.monotonic(),
                "degraded_since": None,
            }

    def record_failure(self, provider: str):
        self._ensure(provider)
        s = self._state[provider]
        now = time.monotonic()

        # Reset window if expired
        if now - s["window_start"] > self.WINDOW_SECONDS:
            s["failures"]     = 0
            s["window_start"] = now
            s["degraded_since"] = None

        s["failures"] += 1
        if s["failures"] >= self.FAILURE_THRESHOLD and s["degraded_since"] is None:
            s["degraded_since"] = now
            logger.warning(
                f"[CircuitBreaker] 🔴 Provider '{provider}' marked DEGRADED after "
                f"{s['failures']} failures in {self.WINDOW_SECONDS}s."
            )

    def record_success(self, provider: str):
        self._ensure(provider)
        s = self._state[provider]
        # Reset failure counter on success
        s["failures"]       = 0
        s["window_start"]   = time.monotonic()
        s["degraded_since"] = None

    def is_degraded(self, provider: str) -> bool:
        self._ensure(provider)
        s = self._state[provider]
        if s["degraded_since"] is None:
            return False
        # Check if cooldown has elapsed → allow one retry probe
        elapsed = time.monotonic() - s["degraded_since"]
        if elapsed > self.COOLDOWN_SECONDS:
            logger.info(
                f"[CircuitBreaker] 🟡 Provider '{provider}' cooldown elapsed "
                f"({elapsed:.0f}s). Allowing probe request."
            )
            s["degraded_since"] = None   # reset; next failure will re-degrade
            s["failures"]       = 0
            return False
        return True


# Singleton instance shared across all requests in the process lifetime
health_tracker = ProviderHealthTracker()


# ── Lazy model builders ────────────────────────────────────────────────

def get_gemini_llm(temperature: float = 0.1, structured_schema: Optional[Type[BaseModel]] = None):
    """Returns Gemini 2.5 Flash (latest model)."""
    from langchain_google_genai import ChatGoogleGenerativeAI
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=temperature,
        max_retries=2,
    )
    if structured_schema:
        return llm.with_structured_output(structured_schema)
    return llm


def get_groq_llm(temperature: float = 0.1, structured_schema: Optional[Type[BaseModel]] = None):
    """Returns Groq Llama3 model. Falls back to Gemini on error."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY not set — falling back to Gemini.")
        return get_gemini_llm(temperature, structured_schema)
    try:
        from langchain_groq import ChatGroq
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=temperature,
            api_key=api_key,
            max_retries=2,
        )
        if structured_schema:
            return llm.with_structured_output(structured_schema)
        return llm
    except Exception as e:
        logger.warning(f"Groq init failed ({e}) — falling back to Gemini.")
        return get_gemini_llm(temperature, structured_schema)


def get_deepseek_llm(temperature: float = 0.1, structured_schema: Optional[Type[BaseModel]] = None):
    """
    Returns a DeepSeek model via OpenAI-compatible endpoint.
    Falls back to Gemini on error.
    """
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        logger.warning("DEEPSEEK_API_KEY not set — falling back to Gemini.")
        return get_gemini_llm(temperature, structured_schema)
    try:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            model="deepseek-chat",
            openai_api_key=api_key,
            openai_api_base="https://api.deepseek.com/v1",
            temperature=temperature,
            max_retries=2,
        )
        if structured_schema:
            return llm.with_structured_output(structured_schema)
        return llm
    except Exception as e:
        logger.warning(f"DeepSeek init failed ({e}) — falling back to Gemini.")
        return get_gemini_llm(temperature, structured_schema)


def get_mistral_llm(temperature: float = 0.1, structured_schema: Optional[Type[BaseModel]] = None):
    """Returns Mistral AI model. Falls back to Gemini on error."""
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        logger.warning("MISTRAL_API_KEY not set — falling back to Gemini.")
        return get_gemini_llm(temperature, structured_schema)
    try:
        from langchain_mistralai import ChatMistralAI
        llm = ChatMistralAI(
            model="mistral-large-latest",
            temperature=temperature,
            api_key=api_key,
            max_retries=2,
        )
        if structured_schema:
            return llm.with_structured_output(structured_schema)
        return llm
    except Exception as e:
        logger.warning(f"Mistral init failed ({e}) — falling back to Gemini.")
        return get_gemini_llm(temperature, structured_schema)


# ── Provider name lookup ───────────────────────────────────────────────

_TASK_TO_PROVIDER = {
    "groq":     "groq",
    "deepseek": "deepseek",
    "mistral":  "mistral",
    "gemini":   "gemini",
}

_MODEL_BUILDERS = {
    "groq":     get_groq_llm,
    "deepseek": get_deepseek_llm,
    "mistral":  get_mistral_llm,
    "gemini":   get_gemini_llm,
}


# ── Public helpers ────────────────────────────────────────────────────

def get_model_for_task(task: str, temperature: float = 0.1,
                       structured_schema: Optional[Type[BaseModel]] = None):
    """
    Returns the appropriate LangChain LLM for a given task name.
    Respects the Circuit Breaker: if the primary provider is DEGRADED,
    returns Gemini Flash immediately.
    """
    model_name = TASK_MODEL_MAP.get(task, "gemini")
    provider   = _TASK_TO_PROVIDER.get(model_name, "gemini")

    if health_tracker.is_degraded(provider):
        logger.warning(
            f"[Router] 🔴 Provider '{provider}' is DEGRADED — "
            f"using Gemini Flash directly for task '{task}'."
        )
        return get_gemini_llm(temperature, structured_schema)

    logger.info(f"[Router] Task='{task}' → Provider='{provider}'")
    builder = _MODEL_BUILDERS.get(model_name, get_gemini_llm)
    return builder(temperature=temperature, structured_schema=structured_schema)


def call_with_fallback(
    task: str,
    chain_fn,          # callable that accepts an LLM and returns a chain
    input_data: dict,
    structured_schema: Optional[Type[BaseModel]] = None,
    temperature: float = 0.1,
) -> Any:
    """
    Enhanced with timing and health logging for Observability.
    """
    from src.utils.llm_utils import invoke_with_retry

    model_name = TASK_MODEL_MAP.get(task, "gemini")
    provider   = _TASK_TO_PROVIDER.get(model_name, "gemini")
    start_time = time.time()

    # --- Primary model ---
    if not health_tracker.is_degraded(provider):
        try:
            primary_llm = get_model_for_task(task, temperature, structured_schema)
            chain = chain_fn(primary_llm)
            result = invoke_with_retry(chain.invoke, input_data, max_retries=1, initial_delay=2.0)
            
            # Health Logging (Success)
            latency = time.time() - start_time
            health_tracker.record_success(provider)
            log_provider_health(provider, task, True, latency)
            
            logger.info(f"[Router] ✅ Task '{task}' succeeded with '{provider}' ({latency:.2f}s).")
            return result
        except Exception as primary_err:
            latency = time.time() - start_time
            health_tracker.record_failure(provider)
            log_provider_health(provider, task, False, latency, str(primary_err))
            
            logger.warning(f"[Router] ⚠️ Provider '{provider}' failed: {primary_err}. Fallback starting.")
    
    # --- Gemini fallback ---
    start_fallback = time.time()
    try:
        fallback_llm = get_gemini_llm(temperature, structured_schema)
        chain = chain_fn(fallback_llm)
        result = invoke_with_retry(chain.invoke, input_data, max_retries=5, initial_delay=2.0)
        
        latency = time.time() - start_fallback
        log_provider_health("gemini_fallback", task, True, latency)
        
        logger.info(f"[Router] ✅ Task '{task}' succeeded with Gemini fallback ({latency:.2f}s).")
        return result
    except Exception as fallback_err:
        latency = time.time() - start_fallback
        log_provider_health("gemini_fallback", task, False, latency, str(fallback_err))
        raise fallback_err

