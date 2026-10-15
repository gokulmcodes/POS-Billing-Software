from datetime import datetime

from app.schemas.common import ObjectIdStr, ORMModel


class VariantIn(ORMModel):
    size: str | None = None
    color: str | None = None
    sku: str
    stock_qty: int = 0


class VariantOut(ORMModel):
    size: str | None = None
    color: str | None = None
    sku: str
    stock_qty: int = 0


class ProductCreate(ORMModel):
    name: str
    sku: str
    barcode: str | None = None
    category_id: ObjectIdStr | None = None
    fabric: str | None = None
    unit: str = "pcs"
    cost_price: float = 0.0
    selling_price: float = 0.0
    tax_rate: float = 0.0
    stock_qty: int = 0
    reorder_level: int = 0
    image_url: str | None = None
    active: bool = True
    variants: list[VariantIn] = []


class ProductUpdate(ORMModel):
    name: str | None = None
    sku: str | None = None
    barcode: str | None = None
    category_id: ObjectIdStr | None = None
    fabric: str | None = None
    unit: str | None = None
    cost_price: float | None = None
    selling_price: float | None = None
    tax_rate: float | None = None
    stock_qty: int | None = None
    reorder_level: int | None = None
    image_url: str | None = None
    active: bool | None = None
    variants: list[VariantIn] | None = None


class StockAdjust(ORMModel):
    quantity: int
    note: str | None = None


class ProductOut(ORMModel):
    id: ObjectIdStr
    name: str
    sku: str
    barcode: str | None = None
    category_id: ObjectIdStr | None = None
    category_name: str | None = None
    fabric: str | None = None
    unit: str
    cost_price: float
    selling_price: float
    tax_rate: float
    stock_qty: int
    reorder_level: int
    image_url: str | None = None
    active: bool
    variants: list[VariantOut] = []
    created_at: datetime
    updated_at: datetime
