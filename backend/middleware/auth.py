import os
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from models.user import User
from models.subscription import Subscription

NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET", "")


async def decode_token(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    token_data: dict = Depends(decode_token),
    db: AsyncSession = Depends(get_db),
) -> User:
    email = token_data.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Token missing email")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            name=token_data.get("name"),
            image=token_data.get("picture"),
            provider=token_data.get("provider", "google"),
        )
        db.add(user)
        sub = Subscription(user_id=user.id, plan="free", generations_limit=3)
        db.add(sub)
        await db.commit()
        await db.refresh(user)

    return user


async def optional_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token_data = await decode_token(authorization)
        return await get_current_user(token_data, db)
    except HTTPException:
        return None
