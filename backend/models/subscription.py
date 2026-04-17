import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.session import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False)
    plan: Mapped[str] = mapped_column(String, default="free")  # free, pro
    status: Mapped[str] = mapped_column(String, default="active")  # active, cancelled, expired
    razorpay_subscription_id: Mapped[str | None] = mapped_column(String, nullable=True)
    generations_used: Mapped[int] = mapped_column(Integer, default=0)
    generations_limit: Mapped[int] = mapped_column(Integer, default=3)  # free tier
    billing_cycle_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="subscription")
