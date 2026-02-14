"""
Sidequest — Discovery Agent

Finds experiences from social media, community platforms, and hyperlocal sources.
Uses Gemini Flash via Vertex AI for speed.
"""

import json
from datetime import datetime
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, SystemMessage

from config import settings, AGENT_MODEL_CONFIG
from state.schemas import AgentState


DISCOVERY_SYSTEM_PROMPT = """You are the Discovery Agent for Sidequest, a plot-first experience discovery platform.

Your role is to find compelling, unique experiences based on the user's query and preferences.

Given the user's input, discover and return 5-10 relevant experiences. Focus on:
1. Hyperlocal gems not easily found on Google Maps
2. Artisan workshops, heritage walks, cultural immersions
3. Solo-friendly activities with social scaffolding potential
4. Experiences with story potential (lore, provenance, friction)

For each experience, provide:
- name: Experience name
- category: One of [food, craft, heritage, nature, art, music, fitness, shopping, networking]
- timing: Best time to visit
- budget: Estimated cost in INR
- location: Neighborhood/area in the city
- solo_friendly: Whether it works well for solo visitors
- source: Where you found this (instagram, blog, local_knowledge, etc.)
- description: 2-3 sentence vivid description

Return your response as a JSON object with key "discovered_experiences" containing an array of experiences.
Respond ONLY with valid JSON, no markdown formatting."""


def get_discovery_model() -> ChatVertexAI:
    """Create a Vertex AI model instance for the Discovery Agent."""
    config = AGENT_MODEL_CONFIG["discovery"]
    return ChatVertexAI(
        model_name=config["model_name"],
        temperature=config["temperature"],
        max_output_tokens=config["max_output_tokens"],
        project=settings.google_cloud_project,
        location=settings.google_cloud_location,
    )


async def run_discovery(state: AgentState) -> AgentState:
    """
    Execute the Discovery Agent.

    Searches for experiences based on user query, social media URLs,
    city, budget, and preferences.
    """
    start_time = datetime.now()

    try:
        model = get_discovery_model()

        # Build the user prompt
        user_prompt = f"""Find experiences for the following request:

Query: {state['user_query']}
City: {state['city']}
Budget Range: ₹{state['budget_range'][0]} - ₹{state['budget_range'][1]}
Number of People: {state['num_people']}
Solo Preference: {state['solo_preference']}
Interest Pods: {', '.join(state.get('interest_pods', [])) or 'open to anything'}
Crowd Preference: {state.get('crowd_preference', 'relatively_niche')}
"""

        if state.get('social_media_urls'):
            user_prompt += f"\nSocial Media URLs to extract from: {', '.join(state['social_media_urls'])}"

        messages = [
            SystemMessage(content=DISCOVERY_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ]

        response = await model.ainvoke(messages)

        # Parse the JSON response
        response_text = response.content.strip()
        # Handle potential markdown code block wrapping
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()

        result = json.loads(response_text)
        experiences = result.get("discovered_experiences", [])

        # Update state
        state["discovered_experiences"] = experiences
        state["agent_trace"].append({
            "agent": "discovery",
            "status": "success",
            "experiences_found": len(experiences),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
            "timestamp": start_time.isoformat(),
        })

    except Exception as e:
        state["errors"].append({
            "agent": "discovery",
            "error": str(e),
            "timestamp": start_time.isoformat(),
        })
        state["agent_trace"].append({
            "agent": "discovery",
            "status": "error",
            "error": str(e),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
        })
        # Fallback: empty experiences list
        if not state.get("discovered_experiences"):
            state["discovered_experiences"] = []

    return state
