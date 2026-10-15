from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_user, require_admin
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierOut, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=list[SupplierOut])
async def list_suppliers(
    search: str | None = Query(default=None),
    _: User = Depends(get_current_user),
) -> list[Supplier]:
    suppliers = await Supplier.find_all().to_list()
    if search:
        term = search.lower()
        suppliers = [
            s
            for s in suppliers
            if term in s.name.lower() or (s.phone and term in s.phone) or (s.contact_person and term in s.contact_person.lower())
        ]
    suppliers.sort(key=lambda s: s.name.lower())
    return suppliers


@router.post("", response_model=SupplierOut, status_code=201)
async def create_supplier(payload: SupplierCreate, _: User = Depends(require_admin)) -> Supplier:
    supplier = Supplier(**payload.model_dump())
    await supplier.insert()
    return supplier


@router.get("/{supplier_id}", response_model=SupplierOut)
async def get_supplier(supplier_id: str, _: User = Depends(get_current_user)) -> Supplier:
    supplier = await Supplier.get(PydanticObjectId(supplier_id))
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}", response_model=SupplierOut)
async def update_supplier(supplier_id: str, payload: SupplierUpdate, _: User = Depends(require_admin)) -> Supplier:
    supplier = await Supplier.get(PydanticObjectId(supplier_id))
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for key, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(supplier, key, value)
    await supplier.save()
    return supplier


@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: str, _: User = Depends(require_admin)) -> dict:
    supplier = await Supplier.get(PydanticObjectId(supplier_id))
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    await supplier.delete()
    return {"ok": True}
