from datetime import datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field

from app.models.base import utcnow


class ReturnItem(BaseModel):
    product_id: PydanticObjectId | None = None
    variant_sku: str | None = None
    name: str
    qty: int = 0
    unit_price: float = 0.0
    line_total: float = 0.0


class SalesReturn(Document):
    return_no: str
    sale_id: PydanticObjectId | None = None
    invoice_no: str | None = None
    items: list[ReturnItem] = Field(default_factory=list)
    refund_amount: float = 0.0
    reason: str | None = None
    resolution: Literal["refund", "exchange"] = "refund"
    restock: bool = True
    processed_by_id: PydanticObjectId | None = None
    processed_by_name: str | None = None
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "returns"
