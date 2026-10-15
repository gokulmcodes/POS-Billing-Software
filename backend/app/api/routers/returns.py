from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.models.base import utcnow
from app.models.product import Product
from app.models.return_ import ReturnItem, SalesReturn
from app.models.sale import Sale
from app.models.user import User
from app.schemas.return_ import ReturnCreate, ReturnOut
from app.services import inventory, ledger, numbering

router = APIRouter(prefix="/returns", tags=["returns"])


@router.get("", response_model=list[ReturnOut])
async def list_returns(_: User = Depends(get_current_user)) -> list[SalesReturn]:
    returns = await SalesReturn.find_all().to_list()
    returns.sort(key=lambda r: r.created_at, reverse=True)
    return returns


def _already_returned(returns: list[SalesReturn], product_id: str, variant_sku: str | None) -> int:
    total = 0
    for ret in returns:
        for item in ret.items:
            if str(item.product_id) == product_id and (item.variant_sku or None) == (variant_sku or None):
                total += item.qty
    return total


@router.post("", response_model=ReturnOut, status_code=201)
async def create_return(payload: ReturnCreate, user: User = Depends(get_current_user)) -> SalesReturn:
    sale = await Sale.get(PydanticObjectId(payload.sale_id))
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    if sale.status == "voided":
        raise HTTPException(status_code=400, detail="Cannot return a voided sale")

    existing = await SalesReturn.find(SalesReturn.sale_id == sale.id).to_list()

    items: list[ReturnItem] = []
    refund = 0.0
    for line in payload.items:
        sale_item = next(
            (
                si
                for si in sale.items
                if str(si.product_id) == line.product_id and (si.variant_sku or None) == (line.variant_sku or None)
            ),
            None,
        )
        if sale_item is None:
            raise HTTPException(status_code=400, detail="Item not found in the original sale")
        remaining = sale_item.qty - _already_returned(existing, line.product_id, line.variant_sku)
        if line.qty <= 0 or line.qty > remaining:
            raise HTTPException(status_code=400, detail=f"Invalid return quantity for {sale_item.name} (remaining: {remaining})")
        line_total = round(line.qty * sale_item.unit_price, 2)
        refund += line_total
        items.append(
            ReturnItem(
                product_id=sale_item.product_id,
                variant_sku=line.variant_sku,
                name=sale_item.name,
                qty=line.qty,
                unit_price=sale_item.unit_price,
                line_total=line_total,
            )
        )
        if payload.restock and sale_item.product_id:
            product = await Product.get(sale_item.product_id)
            if product is not None:
                inventory.adjust_stock(product, line.variant_sku, line.qty)
                product.updated_at = utcnow()
                await product.save()

    refund = round(refund, 2)
    sales_return = SalesReturn(
        return_no=await numbering.next_return_no(),
        sale_id=sale.id,
        invoice_no=sale.invoice_no,
        items=items,
        refund_amount=refund,
        reason=payload.reason,
        resolution=payload.resolution,
        restock=payload.restock,
        processed_by_id=user.id,
        processed_by_name=user.name,
    )
    await sales_return.insert()

    fully_returned = True
    for sale_item in sale.items:
        returned = _already_returned(existing + [sales_return], str(sale_item.product_id), sale_item.variant_sku)
        if returned < sale_item.qty:
            fully_returned = False
            break
    if fully_returned:
        sale.status = "returned"
        await sale.save()

    await ledger.add_entry(
        type="return",
        description=f"Return {sales_return.return_no} against {sale.invoice_no}",
        debit=refund,
        ref_type="return",
        ref_id=sales_return.id,
        created_by_name=user.name,
    )
    return sales_return
