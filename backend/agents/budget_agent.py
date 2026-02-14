"""
Sidequest — Budget Optimizer Agent

Cost transparency, deals discovery, and booking timeline recommendations.
Uses Gemini Flash via Vertex AI for fast numerical analysis.
"""

import json
from datetime import datetime
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, SystemMessage

from config import settings, AGENT_MODEL_CONFIG
from state.schemas import AgentState
from utils.helpers import strip_markdown_json
from logging_system import AgentLogger, get_log_writer, get_log_config

# Initialize Agent Logger with global log writer
_agent_logger = AgentLogger("budget_agent", log_writer=get_log_writer(), config=get_log_config())


BUDGET_SYSTEM_PROMPT = """You are the Budget Optimizer Agent for Sidequest.

Your role is to provide cost transparency and smart budget recommendations for experiences.

CRITICAL BUDGET RULE:
- The user has a maximum budget. You MUST ensure total_estimate does NOT exceed this maximum.
- If the experiences would exceed the budget, EITHER:
  1. Suggest cheaper alternatives for some experiences, OR
  2. Recommend dropping the most expensive non-essential items
- Set within_budget to TRUE only if total_estimate <= user's maximum budget

For each experience, calculate:
1. **Entry/ticket cost**: Actual fees
2. **Average spend**: Food, drinks, materials
3. **Transport cost**: Auto/metro/walk between experiences
4. **Hidden costs**: Parking, tips, extras

Also provide:
- Deals: Early bird pricing, group discounts, BNPL options
- Booking urgency: "Book 3 days ahead (sells out)" or "Walk-in available"
- Budget alternatives: Cheaper options if over budget
- Cost-saving tips: "Take metro instead of auto, save ₹200"

Return JSON with key "budget_breakdown":
{
  "budget_breakdown": {
    "total_estimate": 1250,
    "breakdown": [
      {"experience": "Name", "cost": 800, "type": "workshop", "booking_required": "2 days ahead"},
      {"experience": "Transport", "cost": 300, "type": "transport"}
    ],
    "deals": ["BNPL available via Simpl for workshop"],
    "tips": ["Take metro from MG Road to save ₹150"],
    "within_budget": true
  }
}

All costs in INR (₹). Be realistic with Bangalore/Indian city pricing.
Respond ONLY with valid JSON, no markdown formatting."""


def get_budget_model() -> ChatVertexAI:
    """Create a Vertex AI model instance for the Budget Agent."""
    config = AGENT_MODEL_CONFIG["budget"]
    return ChatVertexAI(
        model_name=config["model_name"],
        temperature=config["temperature"],
        max_output_tokens=config["max_output_tokens"],
        project=settings.google_cloud_project,
        location=settings.google_cloud_location,
    )


@_agent_logger.log_execution
async def run_budget_optimizer(state: AgentState) -> AgentState:
    """
    Execute the Budget Optimizer Agent.

    Analyzes costs, finds deals, and checks budget fit.
    """
    start_time = datetime.now()

    try:
        experiences = state.get("discovered_experiences", [])
        if not experiences:
            state["budget_breakdown"] = {
                "total_estimate": 0,
                "breakdown": [],
                "deals": [],
                "within_budget": True,
            }
            state["agent_trace"].append({
                "agent": "budget",
                "status": "skipped",
                "reason": "No experiences to price",
                "latency_ms": 0,
            })
            return state

        model = get_budget_model()

        budget_min, budget_max = state['budget_range']
        
        user_prompt = f"""Analyze budget for these experiences:

Experiences:
{json.dumps(experiences, indent=2)}

City: {state['city']}
Budget Range: ₹{budget_min} - ₹{budget_max}
MAXIMUM BUDGET: ₹{budget_max} (CRITICAL: total_estimate MUST NOT exceed this)
Number of People: {state['num_people']}

Provide realistic INR pricing for {state['city']}.
IMPORTANT: Ensure total_estimate ≤ ₹{budget_max}. If experiences exceed budget, suggest alternatives."""

        messages = [
            SystemMessage(content=BUDGET_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ]

        response = await model.ainvoke(messages)

        response_text = strip_markdown_json(response.content)
        result = json.loads(response_text)
        budget_breakdown = result.get("budget_breakdown", {})
        
        # Post-processing validation: Ensure within_budget is correctly set
        total_estimate = budget_breakdown.get("total_estimate", 0)
        budget_min, budget_max = state['budget_range']
        
        # Override LLM's within_budget if it's incorrect
        actual_within_budget = total_estimate <= budget_max
        if budget_breakdown.get("within_budget") != actual_within_budget:
            budget_breakdown["within_budget"] = actual_within_budget
            # Add a tip if over budget
            if not actual_within_budget:
                tips = budget_breakdown.get("tips", [])
                overage = total_estimate - budget_max
                tips.insert(0, f"⚠️ Over budget by ₹{overage}. Consider dropping or substituting some experiences.")
                budget_breakdown["tips"] = tips
        
        state["budget_breakdown"] = budget_breakdown

        state["agent_trace"].append({
            "agent": "budget",
            "status": "success",
            "total_estimate": total_estimate,
            "budget_max": budget_max,
            "within_budget": actual_within_budget,
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
            "timestamp": start_time.isoformat(),
        })

    except Exception as e:
        state["errors"].append({
            "agent": "budget",
            "error": str(e),
            "timestamp": start_time.isoformat(),
        })
        state["agent_trace"].append({
            "agent": "budget",
            "status": "error",
            "error": str(e),
            "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
        })
        if not state.get("budget_breakdown"):
            state["budget_breakdown"] = {}

    return state
