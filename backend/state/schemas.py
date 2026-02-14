"""
Sidequest State Schemas

Pydantic models for API requests/responses and TypedDict for LangGraph agent state.
"""

from typing import Optional, Any, Annotated
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


# ──────────────────────────────────────────────
# API Request / Response Models (Pydantic)
# ──────────────────────────────────────────────

class ItineraryRequest(BaseModel):
    """Request body for itinerary generation."""

    query: str = Field(
        ...,
        description="User's natural language query or experience description",
        examples=["Solo-friendly pottery workshop for complete beginners in Bangalore"],
    )
    social_media_urls: list[str] = Field(
        default_factory=list,
        description="Instagram Reel or YouTube URLs to extract experiences from",
    )
    city: str = Field(
        default="Bangalore",
        description="Target city for experiences",
    )
    budget_min: int = Field(
        default=200,
        description="Minimum budget in INR",
    )
    budget_max: int = Field(
        default=5000,
        description="Maximum budget in INR",
    )
    num_people: int = Field(
        default=1,
        description="Number of people",
    )
    solo_preference: bool = Field(
        default=True,
        description="Whether to prioritize solo-friendly experiences",
    )
    interest_pods: list[str] = Field(
        default_factory=list,
        description="User's interest categories",
        examples=[["food_nerd", "craft_explorer", "heritage_walker"]],
    )
    crowd_preference: str = Field(
        default="relatively_niche",
        description="Crowd preference: crowded, relatively_niche, super_niche",
    )
    start_date: Optional[str] = Field(
        default=None,
        description="Trip start date (YYYY-MM-DD)",
    )
    end_date: Optional[str] = Field(
        default=None,
        description="Trip end date (YYYY-MM-DD)",
    )


class ExperienceItem(BaseModel):
    """A single discovered experience."""

    name: str
    category: str
    timing: str
    budget: int
    location: str
    solo_friendly: bool = False
    source: str = ""
    lore: str = ""
    description: str = ""


class BudgetBreakdown(BaseModel):
    """Cost breakdown for an itinerary."""

    total_estimate: int
    breakdown: list[dict[str, Any]]
    deals: list[str] = Field(default_factory=list)
    within_budget: bool = True


class CollisionSuggestion(BaseModel):
    """Cross-pod experience recommendation."""

    title: str
    experiences: list[str]
    why: str


class ItineraryResponse(BaseModel):
    """Response body for itinerary generation."""

    narrative_itinerary: str = Field(
        description="Plot-first narrative itinerary with story arc"
    )
    experiences: list[ExperienceItem] = Field(
        default_factory=list,
        description="Discovered experiences used in the itinerary"
    )
    cultural_context: dict[str, Any] = Field(
        default_factory=dict,
        description="Cultural context annotations per experience"
    )
    budget_breakdown: Optional[BudgetBreakdown] = None
    social_scaffolding: dict[str, Any] = Field(
        default_factory=dict,
        description="Solo-sure and social scaffolding info"
    )
    collision_suggestion: Optional[CollisionSuggestion] = None
    agent_trace: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Agent execution trace for demo visualization"
    )
    session_id: str = Field(
        default="",
        description="Session ID for trace retrieval"
    )


# ──────────────────────────────────────────────
# LangGraph Agent State (TypedDict)
# ──────────────────────────────────────────────

class AgentState(TypedDict):
    """Shared state flowing through the LangGraph agent pipeline."""

    # User inputs
    user_query: str
    social_media_urls: list[str]
    city: str
    budget_range: tuple[int, int]
    num_people: int
    solo_preference: bool
    interest_pods: list[str]
    crowd_preference: str
    start_date: str
    end_date: str

    # Agent outputs
    discovered_experiences: list[dict[str, Any]]
    cultural_context: dict[str, Any]
    narrative_itinerary: str
    budget_breakdown: dict[str, Any]
    social_scaffolding: dict[str, Any]
    collision_suggestion: dict[str, Any]

    # Metadata
    agent_trace: list[dict[str, Any]]
    errors: list[dict[str, Any]]
    session_id: str
