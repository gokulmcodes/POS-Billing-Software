from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user, require_admin
from app.models.base import utcnow
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.purchase import PurchaseCreate, PurchaseOut
from app.services import ledger, numbering

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.get("", response_model=list[PurchaseOut])
async def list_purchases(_: User = Depends(get_current_user)) -> list[Purchase]:
    purchases = await Purchase.find_all().to_list()
    purchases.sort(key=lambda p: p.created_at, reverse=True)
    return purchases


@router.post("", response_model=PurchaseOut, status_code=201)
async def create_purchase(payload: PurchaseCreate, user: User = Depends(require_admin)) -> Purchase:
    supplier = None
    if payload.supplier_id:
        supplier = await Supplier.get(PydanticObjectId(payload.supplier_id))
        if supplier is None:
            raise HTTPException(status_code=400, detail="Supplier not found")

    items: list[PurchaseItem] = []
    subtotal = 0.0
    for line in payload.items:
        line_total = round(line.qty * line.unit_cost, 2)
        subtotal += line_total
        items.append(
            PurchaseItem(
                product_id=PydanticObjectId(line.product_id) if line.product_id else None,
                variant_sku=line.variant_sku,
                name=line.name,
                qty=line.qty,
                unit_cost=line.unit_cost,
                line_total=line_total,
            )
        )
        if line.update_stock and line.product_id:
            product = await Product.get(PydanticObjectId(line.product_id))
            if product is not None:
                if line.variant_sku and product.variants:
                    for variant in product.variants:
                        if variant.sku == line.variant_sku:
                            variant.stock_qty += line.qty
                    product.stock_qty = sum(v.stock_qty for v in product.variants)
                else:
                    product.stock_qty += line.qty
                product.updated_at = utcnow()
                await product.save()

    subtotal = round(subtotal, 2)
    total = round(subtotal + payload.tax, 2)
    purchase = Purchase(
        purchase_no=await numbering.next_purchase_no(),
        supplier_id=supplier.id if supplier else None,
        supplier_name=supplier.name if supplier else None,
        items=items,
        subtotal=subtotal,
        tax=payload.tax,
        total=total,
        amount_paid=payload.amount_paid,
        payment_status=payload.payment_status,
        notes=payload.notes,
        created_by_id=user.id,
        created_by_name=user.name,
    )
    await purchase.insert()

    await ledger.add_entry(
        type="purchase",
        description=f"Stock purchase {purchase.purchase_no}" + (f" from {supplier.name}" if supplier else ""),
        debit=total,
        ref_type="purchase",
        ref_id=purchase.id,
        created_by_name=user.name,
    )
    return purchase


@router.get("/{purchase_id}", response_model=PurchaseOut)
async def get_purchase(purchase_id: str, _: User = Depends(get_current_user)) -> Purchase:
    purchase = await Purchase.get(PydanticObjectId(purchase_id))
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase
