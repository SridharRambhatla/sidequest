from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from middleware.auth import optional_user
from models.user import User
from models.booking_click import BookingClick

router = APIRouter(prefix="/api", tags=["booking"])


class TrackClickRequest(BaseModel):
    experience_name: str
    link_type: str = "google_maps"
    link_url: str = ""
    itinerary_id: str | None = None


@router.post("/track-click")
async def track_click(
    req: TrackClickRequest,
    user: User | None = Depends(optional_user),
    db: AsyncSession = Depends(get_db),
):
    click = BookingClick(
        user_id=user.id if user else None,
        itinerary_id=req.itinerary_id,
        experience_name=req.experience_name,
        link_type=req.link_type,
        link_url=req.link_url,
    )
    db.add(click)
    await db.commit()
    return {"tracked": True}
