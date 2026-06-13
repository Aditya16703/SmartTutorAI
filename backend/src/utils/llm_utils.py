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
            
            # Detect "limit: 0" which means no access at all (Gemini specific)
            if "limit: 0" in error_str:
                logger.error(f"❌ Quota is 0 for this model. Failing immediately.")
                raise e
                
            # For most API errors (429, 5xx, timeouts), we should retry
            # Some client errors like 400 (Bad Request) or 401 (Unauthorized) shouldn't be retried
            if "400" in error_str or "401" in error_str or "403" in error_str:
                logger.error(f"❌ Unrecoverable LLM error (auth/bad request): {str(e)}")
                raise e
                
            if i < max_retries:
                # Apply jitter to the delay
                jitter = random.uniform(0, 0.1 * delay)
                sleep_time = delay + jitter
                
                logger.warning(f"⚠️ LLM Error hit ({str(e)[:50]}...). Retry {i+1}/{max_retries} in {sleep_time:.2f}s...")
                time.sleep(sleep_time)
                
                # Increase delay for next retry
                delay = min(delay * backoff_factor, max_delay)
            else:
                logger.error(f"❌ LLM Error hit and exhausted all {max_retries} retries.")
                raise e

    raise last_exception
