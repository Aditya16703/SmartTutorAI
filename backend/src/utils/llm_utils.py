import time
import random
import logging
from typing import Any, Callable, TypeVar, Generic

logger = logging.getLogger(__name__)

T = TypeVar('T')

def invoke_with_retry(
    chain_invoke_fn: Callable[..., T],
    input_data: dict,
    max_retries: int = 5,
    initial_delay: float = 2.0,
    max_delay: float = 30.0,
    backoff_factor: float = 2.0
) -> T:
    """
    Invokes a LangChain chain with exponential backoff and jitter.
    
    Args:
        chain_invoke_fn: The invoke function of the chain/model.
        input_data: The input dictionary for the chain.
        max_retries: Maximum number of retries.
        initial_delay: Initial delay in seconds.
        max_delay: Maximum delay in seconds.
        backoff_factor: Factor by which the delay increases.
        
    Returns:
        The result of the chain invocation.
        
    Raises:
        Exception: The last exception encountered if all retries fail.
    """
    delay = initial_delay
    last_exception = None

    for i in range(max_retries + 1):
        try:
            return chain_invoke_fn(input_data)
        except Exception as e:
            last_exception = e
            error_str = str(e).lower()
            
            # Check if it's a rate limit error (429)
            if "429" in error_str or "quota" in error_str:
                # Detect "limit: 0" which means no access at all
                if "limit: 0" in error_str:
                    logger.error(f"❌ Gemini Quota is 0 for this model. Failing immediately.")
                    raise e
                    
                if i < max_retries:
                    # Apply jitter to the delay
                    jitter = random.uniform(0, 0.1 * delay)
                    sleep_time = delay + jitter
                    
                    logger.warning(f"⚠️ Gemini Rate Limit (429) hit. Retry {i+1}/{max_retries} in {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                    
                    # Increase delay for next retry
                    delay = min(delay * backoff_factor, max_delay)
                else:
                    logger.error(f"❌ Gemini Rate Limit hit and exhausted all {max_retries} retries.")
                    raise e
            else:
                # For other errors, log and raise immediately or retry once if transient
                logger.error(f"❌ LLM error: {str(e)}")
                raise e

    raise last_exception
