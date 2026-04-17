from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
async def get_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = user.subscription
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "image": user.image,
        "provider": user.provider,
        "subscription": {
            "plan": sub.plan if sub else "free",
            "status": sub.status if sub else "active",
            "generations_used": sub.generations_used if sub else 0,
            "generations_limit": sub.generations_limit if sub else 3,
        },
        "created_at": user.created_at.isoformat(),
    }
