from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_user
from app.models.base import utcnow
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleOut
from app.services import inventory, ledger, numbering

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("", response_model=list[SaleOut])
async def list_sales(
    status: str | None = Query(default=None),
    _: User = Depends(get_current_user),
) -> list[Sale]:
    query = Sale.find_all()
    sales = await query.to_list()
    if status:
        sales = [s for s in sales if s.status == status]
    sales.sort(key=lambda s: s.created_at, reverse=True)
    return sales


@router.post("", response_model=SaleOut, status_code=201)
async def create_sale(payload: SaleCreate, user: User = Depends(get_current_user)) -> Sale:
    if not payload.items:
        raise HTTPException(status_code=400, detail="Sale must contain at least one item")

    items: list[SaleItem] = []
    subtotal = 0.0
    discount_total = 0.0
    tax_total = 0.0

    for line in payload.items:
        product = await Product.get(PydanticObjectId(line.product_id))
        if product is None:
            raise HTTPException(status_code=400, detail="Product not found")
        if product.variants and not line.variant_sku:
            raise HTTPException(status_code=400, detail=f"Select a variant for {product.name}")

        available = inventory.available_stock(product, line.variant_sku)
        if line.qty > available:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name} (available: {available})")

        unit_price = line.unit_price if line.unit_price is not None else product.selling_price
        line_base = round(line.qty * unit_price, 2)
        line_disc = round(min(line.discount, line_base), 2)
        line_taxable = line_base - line_disc
        line_tax = round(line_taxable * (product.tax_rate or 0.0) / 100.0, 2)
        line_total = round(line_taxable + line_tax, 2)

        subtotal += line_base
        discount_total += line_disc
        tax_total += line_tax

        items.append(
            SaleItem(
                product_id=product.id,
                variant_sku=line.variant_sku,
                name=product.name,
                sku=product.sku,
                qty=line.qty,
                unit_price=unit_price,
                discount=line_disc,
                tax_rate=product.tax_rate or 0.0,
                tax_amount=line_tax,
                line_total=line_total,
            )
        )
        inventory.adjust_stock(product, line.variant_sku, -line.qty)
        product.updated_at = utcnow()
        await product.save()

    discount_total = round(discount_total + payload.discount, 2)
    subtotal = round(subtotal, 2)
    tax_total = round(tax_total, 2)
    total = round(subtotal - discount_total + tax_total, 2)

    if payload.payment_method == "split":
        amount_paid = round(payload.split_cash + payload.split_card, 2)
    else:
        amount_paid = round(payload.amount_paid if payload.amount_paid is not None else total, 2)
    change_due = round(max(0.0, amount_paid - total), 2)

    sale = Sale(
        invoice_no=await numbering.next_invoice_no(),
        items=items,
        subtotal=subtotal,
        discount=discount_total,
        tax=tax_total,
        total=total,
        payment_method=payload.payment_method,
        split_cash=payload.split_cash,
        split_card=payload.split_card,
        amount_paid=amount_paid,
        change_due=change_due,
        customer_id=PydanticObjectId(payload.customer_id) if payload.customer_id else None,
        customer_name=payload.customer_name,
        cashier_id=user.id,
        cashier_name=user.name,
        note=payload.note,
    )
    await sale.insert()

    await ledger.add_entry(
        type="sale",
        description=f"Sale {sale.invoice_no}",
        credit=total,
        ref_type="sale",
        ref_id=sale.id,
        created_by_name=user.name,
    )
    return sale


@router.get("/{sale_id}", response_model=SaleOut)
async def get_sale(sale_id: str, _: User = Depends(get_current_user)) -> Sale:
    sale = await Sale.get(PydanticObjectId(sale_id))
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/{sale_id}/void", response_model=SaleOut)
async def void_sale(sale_id: str, user: User = Depends(get_current_user)) -> Sale:
    sale = await Sale.get(PydanticObjectId(sale_id))
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    if sale.status != "completed":
        raise HTTPException(status_code=400, detail="Only completed sales can be voided")
    for item in sale.items:
        if item.product_id:
            product = await Product.get(item.product_id)
            if product is not None:
                inventory.adjust_stock(product, item.variant_sku, item.qty)
                await product.save()
    sale.status = "voided"
    await sale.save()
    await ledger.add_entry(
        type="adjustment",
        description=f"Void sale {sale.invoice_no}",
        debit=sale.total,
        ref_type="sale",
        ref_id=sale.id,
        created_by_name=user.name,
    )
    return sale
