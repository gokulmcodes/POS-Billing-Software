from datetime import datetime
from typing import Literal

from app.schemas.common import ObjectIdStr, ORMModel


class SaleItemIn(ORMModel):
    product_id: ObjectIdStr
    variant_sku: str | None = None
    qty: int = 1
    unit_price: float | None = None
    discount: float = 0.0


class SaleItemOut(ORMModel):
    product_id: ObjectIdStr | None = None
    variant_sku: str | None = None
    name: str
    sku: str | None = None
    qty: int
    unit_price: float
    discount: float
    tax_rate: float
    tax_amount: float
    line_total: float


class SaleCreate(ORMModel):
    items: list[SaleItemIn]
    discount: float = 0.0
    payment_method: Literal["cash", "card", "upi", "split"] = "cash"
    split_cash: float = 0.0
    split_card: float = 0.0
    amount_paid: float | None = None
    customer_id: ObjectIdStr | None = None
    customer_name: str | None = None
    note: str | None = None


class SaleOut(ORMModel):
    id: ObjectIdStr
    invoice_no: str
    items: list[SaleItemOut]
    subtotal: float
    discount: float
    tax: float
    total: float
    payment_method: str
    split_cash: float
    split_card: float
    amount_paid: float
    change_due: float
    customer_id: ObjectIdStr | None = None
    customer_name: str | None = None
    cashier_id: ObjectIdStr | None = None
    cashier_name: str | None = None
    status: str
    note: str | None = None
    created_at: datetime
