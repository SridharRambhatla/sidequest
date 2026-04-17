"""Initial schema — users, itineraries, saved_experiences, subscriptions, booking_clicks

Revision ID: 001
Revises: None
Create Date: 2026-04-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("image", sa.String(), nullable=True),
        sa.Column("provider", sa.String(), server_default="email"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "itineraries",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("query", sa.Text(), nullable=False),
        sa.Column("city", sa.String(), nullable=False, index=True),
        sa.Column("num_days", sa.Integer(), server_default="1"),
        sa.Column("is_public", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("narrative_itinerary", sa.Text(), server_default=""),
        sa.Column("experiences", sa.JSON(), server_default="[]"),
        sa.Column("cultural_context", sa.JSON(), server_default="{}"),
        sa.Column("budget_breakdown", sa.JSON(), nullable=True),
        sa.Column("social_scaffolding", sa.JSON(), server_default="{}"),
        sa.Column("collision_suggestion", sa.JSON(), nullable=True),
        sa.Column("agent_trace", sa.JSON(), server_default="[]"),
        sa.Column("session_id", sa.String(), server_default=""),
        sa.Column("request_params", sa.JSON(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "saved_experiences",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("experience_data", sa.JSON(), nullable=False),
        sa.Column("source", sa.String(), server_default="discover"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("plan", sa.String(), server_default="free"),
        sa.Column("status", sa.String(), server_default="active"),
        sa.Column("razorpay_subscription_id", sa.String(), nullable=True),
        sa.Column("generations_used", sa.Integer(), server_default="0"),
        sa.Column("generations_limit", sa.Integer(), server_default="3"),
        sa.Column("billing_cycle_start", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "booking_clicks",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("itinerary_id", sa.String(), sa.ForeignKey("itineraries.id"), nullable=True),
        sa.Column("experience_name", sa.String(), nullable=False),
        sa.Column("link_type", sa.String(), server_default="google_maps"),
        sa.Column("link_url", sa.String(), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("booking_clicks")
    op.drop_table("subscriptions")
    op.drop_table("saved_experiences")
    op.drop_table("itineraries")
    op.drop_table("users")
