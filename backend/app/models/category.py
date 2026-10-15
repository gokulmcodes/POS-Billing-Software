from datetime import datetime

from beanie import Document, Indexed
from pydantic import Field

from app.models.base import utcnow


class Category(Document):
    name: Indexed(str, unique=True)  # type: ignore[valid-type]
    description: str | None = None
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "categories"
