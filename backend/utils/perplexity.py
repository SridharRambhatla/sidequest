"""
Shared Perplexity API caller for all Sidequest agents.

Model tiers:
  FAST_MODEL  — sonar        (budget, community: structured JSON, fast)
  PRO_MODEL   — sonar-pro    (plot_builder, cultural_context, discovery: deeper reasoning)
"""

import os
import re
import requests
import aiohttp
import json
import logging

logger = logging.getLogger(__name__)

FAST_MODEL = "sonar"
PRO_MODEL = "sonar-pro"


def _get_api_key() -> str:
    key = os.environ.get("PERPLEXITY_API_KEY", "")
    if not key:
        raise ValueError("PERPLEXITY_API_KEY not set in environment")
    return key


def _strip_fences(text: str) -> str:
    """Remove markdown code fences and inline citation markers from LLM response."""
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    cleaned = match.group(1) if match else text
    # Perplexity sonar models inject [1], [2] citation markers that break JSON
    cleaned = re.sub(r"\[\d+\]", "", cleaned)
    return cleaned


def call_perplexity(system_prompt: str, user_prompt: str, model: str = PRO_MODEL) -> str:
    """Synchronous Perplexity call. Returns raw response text."""
    response = requests.post(
        "https://api.perplexity.ai/chat/completions",
        headers={
            "Authorization": f"Bearer {_get_api_key()}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.4,
            "max_tokens": 8192,
        },
        timeout=60,
    )
    response.raise_for_status()
    return _strip_fences(response.json()["choices"][0]["message"]["content"])


async def acall_perplexity(system_prompt: str, user_prompt: str, model: str = PRO_MODEL) -> str:
    """Async Perplexity call. Returns raw response text."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {_get_api_key()}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.4,
                "max_tokens": 8192,
            },
            timeout=aiohttp.ClientTimeout(total=90),
        ) as resp:
            resp.raise_for_status()
            data = await resp.json()
            return _strip_fences(data["choices"][0]["message"]["content"])
