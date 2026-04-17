from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from middleware.auth import get_current_user, optional_user
from models.user import User
from models.itinerary import Itinerary
from state.schemas import ItineraryResponse

router = APIRouter(prefix="/api/itineraries", tags=["itineraries"])


@router.get("")
async def list_itineraries(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Itinerary)
        .where(Itinerary.user_id == user.id)
        .order_by(Itinerary.created_at.desc())
    )
    itineraries = result.scalars().all()
    return {
        "itineraries": [
            {
                "id": it.id,
                "title": it.title,
                "city": it.city,
                "num_days": it.num_days,
                "query": it.query,
                "is_public": it.is_public,
                "created_at": it.created_at.isoformat(),
                "experience_count": len(it.experiences) if it.experiences else 0,
            }
            for it in itineraries
        ]
    }


@router.get("/{itinerary_id}")
async def get_itinerary(
    itinerary_id: str,
    user: Optional[User] = Depends(optional_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Itinerary).where(Itinerary.id == itinerary_id))
    it = result.scalar_one_or_none()
    if not it:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    if not it.is_public and (not user or user.id != it.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this itinerary")

    return {
        "id": it.id,
        "title": it.title,
        "query": it.query,
        "city": it.city,
        "num_days": it.num_days,
        "is_public": it.is_public,
        "narrative_itinerary": it.narrative_itinerary,
        "experiences": it.experiences,
        "cultural_context": it.cultural_context,
        "budget_breakdown": it.budget_breakdown,
        "social_scaffolding": it.social_scaffolding,
        "collision_suggestion": it.collision_suggestion,
        "agent_trace": it.agent_trace,
        "session_id": it.session_id,
        "request_params": it.request_params,
        "created_at": it.created_at.isoformat(),
    }


@router.post("")
async def save_itinerary(
    data: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    experiences = data.get("experiences", [])
    first_exp = experiences[0]["name"] if experiences else "Unnamed"
    title = data.get("title", f"{data.get('city', 'Trip').title()} — {first_exp}")

    it = Itinerary(
        user_id=user.id,
        title=title[:200],
        query=data.get("query", ""),
        city=data.get("city", ""),
        num_days=data.get("num_days", 1),
        narrative_itinerary=data.get("narrative_itinerary", ""),
        experiences=experiences,
        cultural_context=data.get("cultural_context", {}),
        budget_breakdown=data.get("budget_breakdown"),
        social_scaffolding=data.get("social_scaffolding", {}),
        collision_suggestion=data.get("collision_suggestion"),
        agent_trace=data.get("agent_trace", []),
        session_id=data.get("session_id", ""),
        request_params=data.get("request_params", {}),
    )
    db.add(it)
    await db.commit()
    await db.refresh(it)
    return {"id": it.id, "title": it.title}


@router.patch("/{itinerary_id}")
async def update_itinerary(
    itinerary_id: str,
    data: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Itinerary).where(Itinerary.id == itinerary_id))
    it = result.scalar_one_or_none()
    if not it or it.user_id != user.id:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    for field in ["title", "is_public", "experiences", "narrative_itinerary"]:
        if field in data:
            setattr(it, field, data[field])

    await db.commit()
    return {"id": it.id, "updated": True}


@router.delete("/{itinerary_id}")
async def delete_itinerary(
    itinerary_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Itinerary).where(Itinerary.id == itinerary_id))
    it = result.scalar_one_or_none()
    if not it or it.user_id != user.id:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    await db.delete(it)
    await db.commit()
    return {"deleted": True}


@router.get("/{itinerary_id}/public")
async def get_public_itinerary(
    itinerary_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Itinerary).where(Itinerary.id == itinerary_id))
    it = result.scalar_one_or_none()
    if not it or not it.is_public:
        raise HTTPException(status_code=404, detail="Itinerary not found or not public")

    return {
        "id": it.id,
        "title": it.title,
        "city": it.city,
        "num_days": it.num_days,
        "narrative_itinerary": it.narrative_itinerary,
        "experiences": it.experiences,
        "cultural_context": it.cultural_context,
        "budget_breakdown": it.budget_breakdown,
        "social_scaffolding": it.social_scaffolding,
        "created_at": it.created_at.isoformat(),
    }
