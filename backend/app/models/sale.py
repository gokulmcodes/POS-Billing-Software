from datetime import datetime
from typing import Literal

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from app.models.base import utcnow


class SaleItem(BaseModel):
    product_id: PydanticObjectId | None = None
    variant_sku: str | None = None
    name: str
    sku: str | None = None
    qty: int = 1
    unit_price: float = 0.0
    discount: float = 0.0
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    line_total: float = 0.0


class Sale(Document):
    invoice_no: Indexed(str, unique=True)  # type: ignore[valid-type]
    items: list[SaleItem] = Field(default_factory=list)
    subtotal: float = 0.0
    discount: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    payment_method: Literal["cash", "card", "upi", "split"] = "cash"
    split_cash: float = 0.0
    split_card: float = 0.0
    amount_paid: float = 0.0
    change_due: float = 0.0
    customer_id: PydanticObjectId | None = None
    customer_name: str | None = None
    cashier_id: PydanticObjectId | None = None
    cashier_name: str | None = None
    status: Literal["completed", "voided", "returned"] = "completed"
    note: str | None = None
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "sales"
