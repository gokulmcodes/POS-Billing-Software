from datetime import datetime

from beanie import Document
from pydantic import Field

from app.models.base import utcnow


class Supplier(Document):
    name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    gstin: str | None = None
    notes: str | None = None
    active: bool = True
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "suppliers"
