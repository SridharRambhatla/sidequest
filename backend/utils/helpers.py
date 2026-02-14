"""
Sidequest — Utility Helpers

Error handling, retry logic, and logging utilities for agent execution.
"""

import time
import logging
from datetime import datetime
from typing import Callable, Any
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger("sidequest")


def agent_execution_wrapper(agent_fn: Callable, max_retries: int = 3):
    """
    Decorator that wraps agent functions with retry logic and error handling.

    Usage:
        @agent_execution_wrapper
        async def run_my_agent(state):
            ...
    """
    @wraps(agent_fn)
    async def wrapper(state: dict, *args, **kwargs) -> dict:
        for attempt in range(max_retries):
            try:
                result = await agent_fn(state, *args, **kwargs)
                return result
            except Exception as e:
                error_name = type(e).__name__
                if "rate" in error_name.lower() or "quota" in str(e).lower():
                    wait_time = 2 ** attempt
                    logger.warning(
                        f"Rate limit hit for {agent_fn.__name__}, "
                        f"retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})"
                    )
                    time.sleep(wait_time)
                else:
                    logger.error(
                        f"Error in {agent_fn.__name__} (attempt {attempt + 1}/{max_retries}): {e}"
                    )
                    if attempt == max_retries - 1:
                        log_error(e, state, agent_fn.__name__)
                        return state
        return state

    return wrapper


def log_error(error: Exception, state: dict, agent_name: str):
    """Log agent errors with context."""
    logger.error(
        f"Agent {agent_name} failed after all retries: {error}",
        extra={
            "agent": agent_name,
            "error_type": type(error).__name__,
            "query": state.get("user_query", ""),
            "city": state.get("city", ""),
        },
    )


def log_agent_decision(agent_name: str, input_summary: str, output_summary: str, latency_ms: float):
    """Log agent decisions for observability."""
    logger.info(
        f"🤖 {agent_name} | {latency_ms:.0f}ms | "
        f"Input: {input_summary[:100]} | Output: {output_summary[:100]}"
    )


def timer():
    """Simple timer context for measuring agent latency."""
    class Timer:
        def __init__(self):
            self.start_time = None
            self.end_time = None

        def __enter__(self):
            self.start_time = datetime.now()
            return self

        def __exit__(self, *args):
            self.end_time = datetime.now()

        @property
        def elapsed_ms(self) -> float:
            if self.start_time and self.end_time:
                return (self.end_time - self.start_time).total_seconds() * 1000
            return 0.0

    return Timer()
