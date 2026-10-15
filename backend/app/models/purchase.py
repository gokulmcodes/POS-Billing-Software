from datetime import datetime

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field

from app.models.base import utcnow


class PurchaseItem(BaseModel):
    product_id: PydanticObjectId | None = None
    variant_sku: str | None = None
    name: str
    qty: int = 0
    unit_cost: float = 0.0
    line_total: float = 0.0


class Purchase(Document):
    purchase_no: str
    supplier_id: PydanticObjectId | None = None
    supplier_name: str | None = None
    items: list[PurchaseItem] = Field(default_factory=list)
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    amount_paid: float = 0.0
    payment_status: str = "paid"
    notes: str | None = None
    created_by_id: PydanticObjectId | None = None
    created_by_name: str | None = None
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "purchases"
