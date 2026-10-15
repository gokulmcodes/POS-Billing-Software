from datetime import datetime

from beanie import Document
from pydantic import Field

from app.models.base import utcnow


class Customer(Document):
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    loyalty_points: int = 0
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "customers"
