from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_user, require_admin
from app.models.base import utcnow
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate, StockAdjust

router = APIRouter(prefix="/products", tags=["products"])


async def _resolve_category_name(category_id: str | None) -> tuple[PydanticObjectId | None, str | None]:
    if not category_id:
        return None, None
    category = await Category.get(PydanticObjectId(category_id))
    if category is None:
        raise HTTPException(status_code=400, detail="Category not found")
    return category.id, category.name


@router.get("", response_model=list[ProductOut])
async def list_products(
    search: str | None = Query(default=None),
    category_id: str | None = Query(default=None),
    active: bool | None = Query(default=None),
    low_stock: bool = Query(default=False),
    _: User = Depends(get_current_user),
) -> list[Product]:
    products = await Product.find_all().to_list()
    if search:
        term = search.lower()
        products = [
            p
            for p in products
            if term in p.name.lower() or term in p.sku.lower() or (p.barcode and term in p.barcode.lower())
        ]
    if category_id:
        products = [p for p in products if p.category_id and str(p.category_id) == category_id]
    if active is not None:
        products = [p for p in products if p.active == active]
    if low_stock:
        products = [p for p in products if p.stock_qty <= p.reorder_level]
    products.sort(key=lambda p: p.name.lower())
    return products


@router.get("/barcode/{code}", response_model=ProductOut)
async def get_by_barcode(code: str, _: User = Depends(get_current_user)) -> Product:
    product = await Product.find_one({"$or": [{"barcode": code}, {"sku": code}]})
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(payload: ProductCreate, _: User = Depends(require_admin)) -> Product:
    if await Product.find_one(Product.sku == payload.sku):
        raise HTTPException(status_code=400, detail="SKU already exists")
    category_id, category_name = await _resolve_category_name(payload.category_id)
    data = payload.model_dump(exclude={"category_id"})
    variants = data.pop("variants", [])
    product = Product(
        **data,
        category_id=category_id,
        category_name=category_name,
    )
    product.variants = variants  # type: ignore[assignment]
    if variants:
        product.stock_qty = sum(int(v.get("stock_qty", 0)) for v in variants)
    await product.insert()
    return product


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, _: User = Depends(get_current_user)) -> Product:
    product = await Product.get(PydanticObjectId(product_id))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, payload: ProductUpdate, _: User = Depends(require_admin)) -> Product:
    product = await Product.get(PydanticObjectId(product_id))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        category_id, category_name = await _resolve_category_name(data.pop("category_id"))
        product.category_id = category_id
        product.category_name = category_name
    if "sku" in data and data["sku"] and data["sku"] != product.sku:
        if await Product.find_one(Product.sku == data["sku"]):
            raise HTTPException(status_code=400, detail="SKU already exists")
    if "variants" in data and data["variants"] is not None:
        product.variants = data.pop("variants")  # type: ignore[assignment]
        product.stock_qty = sum(int(v.get("stock_qty", 0)) for v in product.variants)
    for key, value in data.items():
        setattr(product, key, value)
    product.updated_at = utcnow()
    await product.save()
    return product


@router.post("/{product_id}/stock", response_model=ProductOut)
async def adjust_stock(product_id: str, payload: StockAdjust, _: User = Depends(require_admin)) -> Product:
    product = await Product.get(PydanticObjectId(product_id))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    product.stock_qty = max(0, product.stock_qty + payload.quantity)
    product.updated_at = utcnow()
    await product.save()
    return product


@router.delete("/{product_id}")
async def delete_product(product_id: str, _: User = Depends(require_admin)) -> dict:
    product = await Product.get(PydanticObjectId(product_id))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    await product.delete()
    return {"ok": True}
