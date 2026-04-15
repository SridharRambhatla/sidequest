"""
Sidequest — Cultural Context Agent

Adds India-specific localization beyond translation: timing nuances, dress codes,
transport hacks, social norms, safety info.
Uses Gemini via Vertex AI for cultural reasoning.
"""

import json
import os
from datetime import datetime

from state.schemas import AgentState
from utils.llm_caller import call_llm


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
    cultural annotations. Optionally enriches with Reddit community insights.
    """
    start_time = datetime.now()
    city = state.get("city", "unknown")

    try:
        experiences = state.get("discovered_experiences", [])
        if not experiences:
            state["cultural_context"] = {}
            state["agent_trace"].append({
                "agent": "cultural_context",
                "city": city,
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

        # Optional: Fetch Reddit posts for enrichment
        reddit_context = ""
        sources = []
        
        if os.getenv("ENABLE_REDDIT_ENRICHMENT", "false").lower() == "true":
            try:
                from data_sources.reddit_simple import SimpleRedditClient, format_reddit_context
                
                reddit = SimpleRedditClient()
                posts = reddit.get_posts(city, f"things to do {city}", limit=5)
                reddit_context = format_reddit_context(posts)
                sources = [
                    {
                        "title": p["title"], 
                        "url": p["url"], 
                        "source_label": p["source_label"]
                    } 
                    for p in posts
                ]
            except Exception as e:
                print(f"[Cultural Context Agent] Reddit enrichment failed for city={city}: {e}")

        user_prompt = f"""Add cultural context for these experiences in {state['city']}:

Experiences:
{json.dumps(slim_experiences, indent=2)}

City: {state['city']}
Solo Visitor: {state.get('solo_preference', True)}

{reddit_context}

Be concise — 1-2 sentences per field only.
"""

        response_text = await call_llm(CULTURAL_CONTEXT_SYSTEM_PROMPT, user_prompt)
        result = json.loads(response_text)
        cultural_context = result.get("cultural_context", {})
        
        # Attach sources to each experience if available
        if sources:
            for exp_name in cultural_context:
                cultural_context[exp_name]["sources"] = sources[:3]
        
        state["cultural_context"] = cultural_context

        print(f"[Cultural Context Agent] Added cultural context for {len(cultural_context)} experiences in city={city}")

        state["agent_trace"].append({
            "agent": "cultural_context",
            "city": city,
            "status": "success",
            "contexts_added": len(state["cultural_context"]),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
            "timestamp": start_time.isoformat(),
        })

    except Exception as e:
        print(f"[Cultural Context Agent] Error for city={city}: {str(e)}")
        state["errors"].append({
            "agent": "cultural_context",
            "city": city,
            "error": str(e),
            "timestamp": start_time.isoformat(),
        })
        state["agent_trace"].append({
            "agent": "cultural_context",
            "city": city,
            "status": "error",
            "error": str(e),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
        })
        if not state.get("cultural_context"):
            state["cultural_context"] = {}

    return state
