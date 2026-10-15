from datetime import datetime

from app.schemas.common import ObjectIdStr, ORMModel


class PurchaseItemIn(ORMModel):
    product_id: ObjectIdStr | None = None
    variant_sku: str | None = None
    name: str
    qty: int = 0
    unit_cost: float = 0.0
    update_stock: bool = True


class PurchaseItemOut(ORMModel):
    product_id: ObjectIdStr | None = None
    variant_sku: str | None = None
    name: str
    qty: int
    unit_cost: float
    line_total: float


class PurchaseCreate(ORMModel):
    supplier_id: ObjectIdStr | None = None
    items: list[PurchaseItemIn]
    tax: float = 0.0
    amount_paid: float = 0.0
    payment_status: str = "paid"
    notes: str | None = None


class PurchaseOut(ORMModel):
    id: ObjectIdStr
    purchase_no: str
    supplier_id: ObjectIdStr | None = None
    supplier_name: str | None = None
    items: list[PurchaseItemOut]
    subtotal: float
    tax: float
    total: float
    amount_paid: float
    payment_status: str
    notes: str | None = None
    created_by_name: str | None = None
    created_at: datetime
