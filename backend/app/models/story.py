import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Story(Base):
    __tablename__ = "stories"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String, nullable=False, default="Our Story")
    subtitle: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    style: Mapped[str] = mapped_column(String, default="ROMANTIC")  # ROMANTIC, EMOTIONAL, ELEGANT, FUNNY, TRADITIONAL
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class StoryTimelineItem(Base):
    __tablename__ = "story_timeline_items"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    story_id: Mapped[str] = mapped_column(String, ForeignKey("stories.id"), nullable=False, index=True)
    year_label: Mapped[str] = mapped_column(String, nullable=False)  # "2018", "2021"
    title: Mapped[str] = mapped_column(String, nullable=False)  # "First Meeting"
    description: Mapped[Text] = mapped_column(Text, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
