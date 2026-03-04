"""
Sidequest — Cultural Context Agent

Adds India-specific localization beyond translation: timing nuances, dress codes,
transport hacks, social norms, safety info.
Uses Perplexity sonar-pro for deeper cultural reasoning.
"""

import json
from datetime import datetime

from state.schemas import AgentState
from utils.perplexity import acall_perplexity, FAST_MODEL


CULTURAL_CONTEXT_SYSTEM_PROMPT = """You are a cultural context agent for Sidequest (India travel platform).

For each experience, return ONE sentence per field:
- timing: Best time to visit + local peak hours
- tip: Most important local/transport/etiquette tip
- solo_note: Solo-friendliness in one sentence

Return JSON with key "cultural_context" where each key is the experience name.
Example: {"cultural_context": {"Place Name": {"timing": "...", "tip": "...", "solo_note": "..."}}}
Respond ONLY with valid JSON."""


async def run_cultural_context(state: AgentState) -> AgentState:
    """
    Execute the Cultural Context Agent.

    Takes discovered experiences and enriches them with India-specific
    cultural annotations.
    """
    start_time = datetime.now()

    try:
        experiences = state.get("discovered_experiences", [])
        if not experiences:
            state["cultural_context"] = {}
            state["agent_trace"].append({
                "agent": "cultural_context",
                "status": "skipped",
                "reason": "No experiences to contextualize",
                "latency_ms": 0,
            })
            return state

        # Cap at 3 experiences with slim fields to keep output within token limits
        slim_experiences = [
            {"name": e.get("name"), "category": e.get("category"), "location": e.get("location"), "description": e.get("description", "")[:100]}
            for e in experiences[:3]
        ]

        user_prompt = f"""Add cultural context for these experiences in {state['city']}:

Experiences:
{json.dumps(slim_experiences, indent=2)}

City: {state['city']}
Solo Visitor: {state.get('solo_preference', True)}

Be concise — 1-2 sentences per field only.
"""

        response_text = await acall_perplexity(CULTURAL_CONTEXT_SYSTEM_PROMPT, user_prompt, model=FAST_MODEL)
        result = json.loads(response_text)
        state["cultural_context"] = result.get("cultural_context", {})

        state["agent_trace"].append({
            "agent": "cultural_context",
            "status": "success",
            "contexts_added": len(state["cultural_context"]),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
            "timestamp": start_time.isoformat(),
        })

    except Exception as e:
        state["errors"].append({
            "agent": "cultural_context",
            "error": str(e),
            "timestamp": start_time.isoformat(),
        })
        state["agent_trace"].append({
            "agent": "cultural_context",
            "status": "error",
            "error": str(e),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
        })
        if not state.get("cultural_context"):
            state["cultural_context"] = {}

    return state
