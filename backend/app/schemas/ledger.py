from datetime import datetime
from typing import Literal

from app.schemas.common import ObjectIdStr, ORMModel

LedgerType = Literal["sale", "purchase", "return", "expense", "payment", "adjustment"]


class LedgerCreate(ORMModel):
    type: LedgerType = "expense"
    description: str = ""
    debit: float = 0.0
    credit: float = 0.0
    date: datetime | None = None
    ref_type: str | None = None


class LedgerOut(ORMModel):
    id: ObjectIdStr
    date: datetime
    type: str
    ref_type: str | None = None
    ref_id: ObjectIdStr | None = None
    description: str
    debit: float
    credit: float
    balance: float
    created_by_name: str | None = None
    created_at: datetime
