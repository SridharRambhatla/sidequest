import os
import hmac
import hashlib
import logging

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from db.session import get_db
from middleware.auth import get_current_user
from models.user import User
from models.subscription import Subscription

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_PLAN_ID = os.getenv("RAZORPAY_PLAN_ID", "")

client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


class CreateSubscriptionResponse(BaseModel):
    subscription_id: str
    short_url: str
    razorpay_key: str


@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "currency": "INR",
                "features": [
                    "3 itineraries per month",
                    "Basic experience discovery",
                    "WhatsApp sharing",
                ],
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 199,
                "currency": "INR",
                "period": "monthly",
                "features": [
                    "Unlimited itineraries",
                    "Real-time venue data",
                    "PDF export",
                    "Priority AI agents",
                    "Save & revisit trips",
                    "Public share links",
                ],
            },
        ]
    }


@router.post("/subscribe")
async def create_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not client or not RAZORPAY_PLAN_ID:
        raise HTTPException(status_code=503, detail="Payment system not configured")

    try:
        rz_sub = client.subscription.create({
            "plan_id": RAZORPAY_PLAN_ID,
            "total_count": 12,
            "quantity": 1,
            "notes": {"user_id": user.id, "email": user.email},
        })

        return CreateSubscriptionResponse(
            subscription_id=rz_sub["id"],
            short_url=rz_sub.get("short_url", ""),
            razorpay_key=RAZORPAY_KEY_ID,
        )
    except Exception as e:
        logger.error(f"Razorpay subscription creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription")


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if RAZORPAY_KEY_SECRET:
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode(), body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

    payload = await request.json()
    event = payload.get("event", "")
    entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})

    user_id = entity.get("notes", {}).get("user_id")
    if not user_id:
        return {"status": "ignored"}

    result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    sub = result.scalar_one_or_none()
    if not sub:
        return {"status": "user_not_found"}

    if event == "subscription.activated":
        sub.plan = "pro"
        sub.status = "active"
        sub.razorpay_subscription_id = entity.get("id")
        sub.generations_limit = 999999
        sub.billing_cycle_start = datetime.now(timezone.utc)
    elif event == "subscription.cancelled":
        sub.status = "cancelled"
    elif event == "subscription.completed":
        sub.status = "expired"
        sub.plan = "free"
        sub.generations_limit = 3

    await db.commit()
    return {"status": "processed"}


@router.get("/status")
async def subscription_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = user.subscription
    if not sub:
        return {"plan": "free", "generations_used": 0, "generations_limit": 3}

    return {
        "plan": sub.plan,
        "status": sub.status,
        "generations_used": sub.generations_used,
        "generations_limit": sub.generations_limit,
        "billing_cycle_start": sub.billing_cycle_start.isoformat() if sub.billing_cycle_start else None,
    }
