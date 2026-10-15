from datetime import datetime

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from app.models.base import utcnow


class ProductVariant(BaseModel):
    size: str | None = None
    color: str | None = None
    sku: str
    stock_qty: int = 0


class Product(Document):
    name: str
    sku: Indexed(str, unique=True)  # type: ignore[valid-type]
    barcode: str | None = None
    category_id: PydanticObjectId | None = None
    category_name: str | None = None
    fabric: str | None = None
    unit: str = "pcs"
    cost_price: float = 0.0
    selling_price: float = 0.0
    tax_rate: float = 0.0
    stock_qty: int = 0
    reorder_level: int = 0
    image_url: str | None = None
    active: bool = True
    variants: list[ProductVariant] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "products"
