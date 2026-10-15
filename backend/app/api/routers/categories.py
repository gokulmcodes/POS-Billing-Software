from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user, require_admin
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(_: User = Depends(get_current_user)) -> list[Category]:
    categories = await Category.find_all().to_list()
    categories.sort(key=lambda c: c.name.lower())
    return categories


@router.post("", response_model=CategoryOut, status_code=201)
async def create_category(payload: CategoryCreate, _: User = Depends(require_admin)) -> Category:
    if await Category.find_one(Category.name == payload.name):
        raise HTTPException(status_code=400, detail="Category already exists")
    category = Category(name=payload.name, description=payload.description)
    await category.insert()
    return category


@router.put("/{category_id}", response_model=CategoryOut)
async def update_category(category_id: str, payload: CategoryUpdate, _: User = Depends(require_admin)) -> Category:
    category = await Category.get(PydanticObjectId(category_id))
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    for key, value in data.items():
        setattr(category, key, value)
    await category.save()
    return category


@router.delete("/{category_id}")
async def delete_category(category_id: str, _: User = Depends(require_admin)) -> dict:
    category = await Category.get(PydanticObjectId(category_id))
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    in_use = await Product.find_one(Product.category_id == category.id)
    if in_use:
        raise HTTPException(status_code=400, detail="Category is used by products")
    await category.delete()
    return {"ok": True}
