from datetime import datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field

from app.models.base import utcnow


class LedgerEntry(Document):
    date: datetime = Field(default_factory=utcnow)
    type: Literal["sale", "purchase", "return", "expense", "payment", "adjustment"] = "sale"
    ref_type: str | None = None
    ref_id: PydanticObjectId | None = None
    description: str = ""
    debit: float = 0.0
    credit: float = 0.0
    balance: float = 0.0
    created_by_name: str | None = None
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "ledger_entries"
