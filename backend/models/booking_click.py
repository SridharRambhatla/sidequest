import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from db.session import Base


class BookingClick(Base):
    __tablename__ = "booking_clicks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    itinerary_id: Mapped[str | None] = mapped_column(String, ForeignKey("itineraries.id"), nullable=True)
    experience_name: Mapped[str] = mapped_column(String, nullable=False)
    link_type: Mapped[str] = mapped_column(String, default="google_maps")  # google_maps, website, phone
    link_url: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
