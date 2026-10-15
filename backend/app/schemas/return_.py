from datetime import datetime
from typing import Literal

from app.schemas.common import ObjectIdStr, ORMModel


class ReturnItemIn(ORMModel):
    product_id: ObjectIdStr
    variant_sku: str | None = None
    qty: int = 0


class ReturnItemOut(ORMModel):
    product_id: ObjectIdStr | None = None
    variant_sku: str | None = None
    name: str
    qty: int
    unit_price: float
    line_total: float


class ReturnCreate(ORMModel):
    sale_id: ObjectIdStr
    items: list[ReturnItemIn]
    reason: str | None = None
    resolution: Literal["refund", "exchange"] = "refund"
    restock: bool = True


class ReturnOut(ORMModel):
    id: ObjectIdStr
    return_no: str
    sale_id: ObjectIdStr | None = None
    invoice_no: str | None = None
    items: list[ReturnItemOut]
    refund_amount: float
    reason: str | None = None
    resolution: str
    restock: bool
    processed_by_name: str | None = None
    created_at: datetime
