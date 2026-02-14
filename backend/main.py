"""
Sidequest Backend — FastAPI Entry Point

API server for the Sidequest experience discovery platform.
Uses Vertex AI Gemini models via LangGraph supervisor pattern.
"""

import uuid
import asyncio
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from state.schemas import (
    ItineraryRequest,
    ItineraryResponse,
    DiscoverRequest,
    DiscoverResponse,
    DiscoveryExperienceResponse,
    ExperienceLocation,
    ExperienceTiming,
    ExperienceBudget,
    SoloFriendly,
    CrowdLevel,
    WeatherSuitability,
    Availability,
    Coordinates,
)
from agents.coordinator import run_workflow
from agents.discovery_agent import run_discovery_agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Vertex AI on startup."""
    import google.cloud.aiplatform as aiplatform

    if settings.google_cloud_project:
        aiplatform.init(
            project=settings.google_cloud_project,
            location=settings.google_cloud_location,
        )
        print(f"✅ Vertex AI initialized: project={settings.google_cloud_project}, "
              f"location={settings.google_cloud_location}")
    else:
        print("⚠️  GOOGLE_CLOUD_PROJECT not set — Vertex AI calls will fail. "
              "Set it in .env for full functionality.")
    yield


app = FastAPI(
    title="Sidequest API",
    description="Plot-first experience discovery powered by Vertex AI agents",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "sidequest-api"}


# ──────────────────────────────────────────────
# Core API: Itinerary Generation
# ──────────────────────────────────────────────

@app.post("/api/generate-itinerary", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest):
    """
    Generate a plot-first narrative itinerary.

    Orchestrates 5 Vertex AI agents:
    1. Discovery Agent — finds experiences
    2. Cultural Context Agent — adds localization
    3. Plot-Builder Agent — crafts narrative arc
    4. Budget Optimizer Agent — cost breakdown
    5. Community Agent — solo-sure filtering
    """
    try:
        result = await run_workflow(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Itinerary generation failed: {str(e)}"
        )


# ──────────────────────────────────────────────
# Discovery API (for Explore page)
# ──────────────────────────────────────────────

# Category mapping from discovery agent to frontend categories
CATEGORY_MAPPING = {
    "food": "Food & Drink",
    "craft": "Craft Workshop",
    "heritage": "Heritage Walk",
    "nature": "Nature",
    "art": "Art & Culture",
    "music": "Nightlife",
    "fitness": "Fitness",
    "shopping": "Shopping",
    "networking": "Networking",
}

# Default images by category (Unsplash)
DEFAULT_IMAGES = {
    "Food & Drink": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&h=400&fit=crop",
    "Craft Workshop": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop",
    "Heritage Walk": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop",
    "Nature": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop",
    "Art & Culture": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&h=400&fit=crop",
    "Nightlife": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop",
    "Fitness": "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&h=400&fit=crop",
    "Shopping": "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&h=400&fit=crop",
    "Networking": "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=600&h=400&fit=crop",
}


def transform_to_discovery_experience(
    raw_exp: dict,
    index: int
) -> DiscoveryExperienceResponse:
    """
    Transform discovery agent output to DiscoveryExperienceResponse format.
    
    Args:
        raw_exp: Raw experience dict from discovery agent
        index: Index for generating unique ID
    
    Returns:
        DiscoveryExperienceResponse matching frontend expectations
    """
    # Map category
    raw_category = raw_exp.get("category", "").lower()
    category = CATEGORY_MAPPING.get(raw_category, raw_exp.get("category", "Food & Drink"))
    
    # Extract coordinates (from geocoding or default to Bangalore center)
    coords = raw_exp.get("coordinates", {})
    lat = coords.get("lat", 12.9716) if coords else 12.9716
    lng = coords.get("lng", 77.5946) if coords else 77.5946
    
    # Determine timing type from raw timing string
    timing_str = raw_exp.get("timing", "").lower()
    time_of_day = raw_exp.get("time_of_day", "flexible")
    
    timing_type = "flexible"
    if "book" in timing_str or "reserve" in timing_str:
        timing_type = "scheduled"
    elif "limited" in timing_str or "sells out" in timing_str:
        timing_type = "time_sensitive"
    
    # Parse operating days
    operating_days = raw_exp.get("operating_days", ["daily"])
    if isinstance(operating_days, str):
        operating_days = [operating_days]
    
    # Determine if indoor/outdoor from description
    desc = raw_exp.get("description", "").lower()
    is_indoor = any(word in desc for word in ["indoor", "cafe", "restaurant", "workshop", "gallery", "museum"])
    is_outdoor = any(word in desc for word in ["outdoor", "park", "garden", "walk", "lake", "trek"])
    if not is_indoor and not is_outdoor:
        is_indoor = True  # Default to indoor
    
    # Parse budget - handle various formats
    budget_raw = raw_exp.get("budget", 500)
    if isinstance(budget_raw, dict):
        budget_min = budget_raw.get("min", 100)
        budget_max = budget_raw.get("max", budget_raw.get("min", 500) * 2)
    else:
        budget_val = int(budget_raw) if budget_raw else 500
        budget_min = max(0, budget_val - 200)
        budget_max = budget_val + 200
    
    return DiscoveryExperienceResponse(
        id=f"exp-{str(uuid.uuid4())[:8]}",
        name=raw_exp.get("name", "Unnamed Experience"),
        category=category,
        description_short=raw_exp.get("description", "An interesting experience awaits.")[:200],
        image_url=DEFAULT_IMAGES.get(category, DEFAULT_IMAGES["Food & Drink"]),
        location=ExperienceLocation(
            neighborhood=raw_exp.get("location", "Bangalore"),
            coordinates=Coordinates(lat=lat, lng=lng)
        ),
        timing=ExperienceTiming(
            type=timing_type,
            duration_hours=float(raw_exp.get("duration_hours", 2)),
            advance_booking_required=timing_type in ["scheduled", "time_sensitive"],
            advance_days_minimum=1 if timing_type == "scheduled" else None
        ),
        operating_days=operating_days,
        operating_hours=raw_exp.get("operating_hours"),
        budget=ExperienceBudget(
            min=budget_min,
            max=budget_max,
            currency="INR"
        ),
        solo_friendly=SoloFriendly(
            is_solo_sure=raw_exp.get("solo_friendly", True),
            confidence_score=0.85 if raw_exp.get("solo_friendly", True) else 0.5
        ),
        crowd_level=CrowdLevel(
            current="moderate",
            updated_at=datetime.now().isoformat()
        ),
        weather_suitability=WeatherSuitability(
            indoor=is_indoor,
            outdoor=is_outdoor,
            current_match="good"
        ),
        availability=Availability(
            status="available",
            urgency_level="low"
        ),
        rating=4.5,  # Default rating
        review_count=100,  # Default review count
        bookmarked=False
    )


@app.post("/api/discover", response_model=DiscoverResponse)
async def discover_experiences(request: DiscoverRequest):
    """
    Discover experiences for the explore page.
    
    This endpoint runs the Discovery Agent to find experiences based on
    optional filters. Returns experiences in the format expected by the
    frontend DiscoveryCard component.
    """
    try:
        # Build query from request parameters
        query_parts = []
        
        if request.query:
            query_parts.append(request.query)
        
        if request.categories:
            query_parts.append(f"in categories: {', '.join(request.categories)}")
        
        if request.time_of_day:
            query_parts.append(f"for {request.time_of_day}")
        
        if request.solo_friendly_only:
            query_parts.append("solo-friendly")
        
        # Default query if none provided
        user_query = " ".join(query_parts) if query_parts else "Find unique local experiences"
        
        # Prepare state for discovery agent
        agent_state = {
            "user_query": user_query,
            "city": request.city,
            "budget_range": f"{request.budget_min}-{request.budget_max}",
            "interest_pods": [],  # Could map categories to pods
        }
        
        # Run discovery agent (in thread pool to avoid blocking)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            run_discovery_agent,
            agent_state
        )
        
        # Transform results
        raw_experiences = result.get("discovered_experiences", [])
        
        experiences = [
            transform_to_discovery_experience(exp, idx)
            for idx, exp in enumerate(raw_experiences[:request.limit])
        ]
        
        # Apply post-filters
        if request.solo_friendly_only:
            experiences = [e for e in experiences if e.solo_friendly.is_solo_sure]
        
        if request.categories:
            experiences = [e for e in experiences if e.category in request.categories]
        
        return DiscoverResponse(
            experiences=experiences,
            total_count=len(experiences),
            filters_applied={
                "query": request.query,
                "city": request.city,
                "categories": request.categories,
                "budget_range": [request.budget_min, request.budget_max],
                "time_of_day": request.time_of_day,
                "solo_friendly_only": request.solo_friendly_only,
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Discovery failed: {str(e)}"
        )


# ──────────────────────────────────────────────
# Agent Trace (for demo/observability)
# ──────────────────────────────────────────────

@app.get("/api/agent-trace/{session_id}")
async def get_agent_trace(session_id: str):
    """Retrieve agent execution trace for demo visualization."""
    # TODO: Implement trace storage/retrieval
    return {
        "session_id": session_id,
        "trace": [],
        "message": "Trace storage not yet implemented"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True,
    )
