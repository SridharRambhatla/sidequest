from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from middleware.auth import get_current_user
from models.user import User
from models.subscription import Subscription


async def check_generation_limit(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()

    if not sub:
        sub = Subscription(user_id=user.id, plan="free", generations_limit=3)
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    if sub.plan == "free" and sub.generations_used >= sub.generations_limit:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "generation_limit_reached",
                "message": f"Free plan limited to {sub.generations_limit} itineraries per month. Upgrade to Pro for unlimited.",
                "used": sub.generations_used,
                "limit": sub.generations_limit,
            },
        )

    return sub


async def increment_generation_count(
    user: User,
    db: AsyncSession,
):
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.generations_used += 1
        await db.commit()
