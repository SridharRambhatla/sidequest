import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.session import Base


class Itinerary(Base):
    __tablename__ = "itineraries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False, index=True)
    num_days: Mapped[int] = mapped_column(Integer, default=1)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)

    narrative_itinerary: Mapped[str] = mapped_column(Text, default="")
    experiences: Mapped[dict] = mapped_column(JSON, default=list)
    cultural_context: Mapped[dict] = mapped_column(JSON, default=dict)
    budget_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    social_scaffolding: Mapped[dict] = mapped_column(JSON, default=dict)
    collision_suggestion: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    agent_trace: Mapped[dict] = mapped_column(JSON, default=list)
    session_id: Mapped[str] = mapped_column(String, default="")

    request_params: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="itineraries")
