import asyncio
import random
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password  # noqa: E402
from app.db.session import init_db  # noqa: E402
from app.models import (  # noqa: E402
    ALL_DOCUMENTS,
    Category,
    Customer,
    LedgerEntry,
    Product,
    ProductVariant,
    Purchase,
    PurchaseItem,
    Sale,
    SaleItem,
    SalesReturn,
    Supplier,
    User,
)
from app.models.base import utcnow  # noqa: E402
from app.services import ledger, numbering  # noqa: E402

random.seed(42)


CATEGORIES = [
    ("Shirts", "Men's formal and casual shirts"),
    ("Sarees", "Traditional sarees"),
    ("Jeans", "Denim jeans and trousers"),
    ("T-Shirts", "Casual t-shirts and polos"),
    ("Fabrics", "Raw fabric sold by the meter"),
    ("Ethnic Wear", "Kurtas and ethnic clothing"),
    ("Accessories", "Shawls, dupattas and accessories"),
]

SUPPLIERS = [
    ("Sri Balaji Textiles", "Ramesh Kumar", "9840012345", "sales@sribalaji.example", "12, Textile Market, Erode", "33AAACS1234F1Z5"),
    ("Chennai Fabrics Pvt Ltd", "Priya Nair", "9840099887", "orders@chennaifabrics.example", "45, Ring Road, Chennai", "33AABCC5678G1Z2"),
    ("Global Threads", "Arun Prasad", "9840077665", "hello@globalthreads.example", "88, Cotton Street, Coimbatore", "33AACCG4321H1Z9"),
]

PRODUCTS = [
    {
        "name": "Premium Cotton Shirt",
        "sku": "SHIRT-001",
        "barcode": "8901234500011",
        "category": "Shirts",
        "fabric": "Cotton",
        "cost_price": 550,
        "selling_price": 999,
        "tax_rate": 5,
        "reorder_level": 5,
        "variants": [("S", "White"), ("M", "White"), ("L", "Blue"), ("XL", "Blue")],
    },
    {
        "name": "Kanchipuram Silk Saree",
        "sku": "SARE-B001",
        "barcode": "8901234500028",
        "category": "Sarees",
        "fabric": "Silk",
        "cost_price": 3200,
        "selling_price": 5499,
        "tax_rate": 5,
        "reorder_level": 3,
        "variants": [("Free", "Maroon"), ("Free", "Green")],
    },
    {
        "name": "Slim Fit Denim Jeans",
        "sku": "JEAN-D001",
        "barcode": "8901234500035",
        "category": "Jeans",
        "fabric": "Denim",
        "cost_price": 700,
        "selling_price": 1299,
        "tax_rate": 5,
        "reorder_level": 5,
        "variants": [("30", "Blue"), ("32", "Blue"), ("34", "Black"), ("36", "Black")],
    },
    {
        "name": "Polo T-Shirt",
        "sku": "POLO-T001",
        "barcode": "8901234500042",
        "category": "T-Shirts",
        "fabric": "Cotton",
        "cost_price": 260,
        "selling_price": 499,
        "tax_rate": 5,
        "reorder_level": 10,
        "variants": [("M", "Navy"), ("L", "Navy"), ("L", "Grey")],
    },
    {
        "name": "Cotton Fabric (per meter)",
        "sku": "FABR-C001",
        "barcode": "8901234500059",
        "category": "Fabrics",
        "fabric": "Cotton",
        "unit": "meter",
        "cost_price": 90,
        "selling_price": 160,
        "tax_rate": 5,
        "reorder_level": 20,
        "variants": [],
    },
    {
        "name": "Designer Kurta",
        "sku": "KURT-E001",
        "barcode": "8901234500066",
        "category": "Ethnic Wear",
        "fabric": "Rayon",
        "cost_price": 480,
        "selling_price": 899,
        "tax_rate": 5,
        "reorder_level": 5,
        "variants": [("M", "Mustard"), ("L", "Teal")],
    },
    {
        "name": "Kids Casual T-Shirt",
        "sku": "KIDS-T001",
        "barcode": "8901234500073",
        "category": "T-Shirts",
        "fabric": "Cotton",
        "cost_price": 140,
        "selling_price": 299,
        "tax_rate": 5,
        "reorder_level": 10,
        "variants": [("4Y", "Red"), ("6Y", "Yellow")],
    },
    {
        "name": "Woolen Shawl",
        "sku": "SHAW-A001",
        "barcode": "8901234500080",
        "category": "Accessories",
        "fabric": "Wool",
        "cost_price": 420,
        "selling_price": 799,
        "tax_rate": 5,
        "reorder_level": 4,
        "variants": [],
    },
]


def build_variants(raw: list[tuple[str, str]], base_sku: str) -> list[ProductVariant]:
    variants = []
    for index, (size, color) in enumerate(raw, start=1):
        variants.append(
            ProductVariant(
                size=size,
                color=color,
                sku=f"{base_sku}-{size}-{color[:3].upper()}",
                stock_qty=random.randint(8, 30),
            )
        )
    return variants


async def clear_all() -> None:
    for document in ALL_DOCUMENTS:
        try:
            await document.get_motor_collection().drop()
        except Exception:  # noqa: BLE001
            pass


async def main() -> None:
    await init_db()
    await clear_all()

    admin = User(
        name="Store Admin",
        email="admin@posshop.com",
        username="admin",
        password_hash=hash_password("Admin@123"),
        role="admin",
        phone="9000000001",
    )
    staff = User(
        name="Ravi Cashier",
        email="staff@posshop.com",
        username="staff",
        password_hash=hash_password("Staff@123"),
        role="staff",
        phone="9000000002",
    )
    staff2 = User(
        name="Deepa Cashier",
        email="deepa@posshop.com",
        username="deepa",
        password_hash=hash_password("Deepa@123"),
        role="staff",
        phone="9000000003",
    )
    await admin.insert()
    await staff.insert()
    await staff2.insert()

    categories: dict[str, Category] = {}
    for name, description in CATEGORIES:
        category = Category(name=name, description=description)
        await category.insert()
        categories[name] = category

    products: list[Product] = []
    for item in PRODUCTS:
        category = categories.get(item["category"])
        variants = build_variants(item["variants"], item["sku"])
        stock = sum(v.stock_qty for v in variants) if variants else random.randint(30, 120)
        product = Product(
            name=item["name"],
            sku=item["sku"],
            barcode=item["barcode"],
            category_id=category.id if category else None,
            category_name=category.name if category else None,
            fabric=item["fabric"],
            unit=item.get("unit", "pcs"),
            cost_price=item["cost_price"],
            selling_price=item["selling_price"],
            tax_rate=item["tax_rate"],
            stock_qty=stock,
            reorder_level=item["reorder_level"],
            variants=variants,
        )
        await product.insert()
        products.append(product)

    suppliers: list[Supplier] = []
    for name, contact, phone, email, address, gstin in SUPPLIERS:
        supplier = Supplier(
            name=name,
            contact_person=contact,
            phone=phone,
            email=email,
            address=address,
            gstin=gstin,
        )
        await supplier.insert()
        suppliers.append(supplier)

    customers = [
        Customer(name="Walk-in Customer", phone=None),
        Customer(name="Anitha R", phone="9876500011", loyalty_points=120),
        Customer(name="Suresh K", phone="9876500022", loyalty_points=45),
    ]
    for customer in customers:
        await customer.insert()

    # Stock purchase from supplier
    purchase_supplier = suppliers[0]
    purchase_items = []
    purchase_subtotal = 0.0
    for product in products[:3]:
        qty = 12
        line_total = round(qty * product.cost_price, 2)
        purchase_subtotal += line_total
        purchase_items.append(
            PurchaseItem(
                product_id=product.id,
                name=product.name,
                qty=qty,
                unit_cost=product.cost_price,
                line_total=line_total,
            )
        )
        product.stock_qty += qty
        await product.save()
    purchase = Purchase(
        purchase_no=await numbering.next_purchase_no(),
        supplier_id=purchase_supplier.id,
        supplier_name=purchase_supplier.name,
        items=purchase_items,
        subtotal=round(purchase_subtotal, 2),
        tax=0.0,
        total=round(purchase_subtotal, 2),
        amount_paid=round(purchase_subtotal, 2),
        payment_status="paid",
        created_by_id=admin.id,
        created_by_name=admin.name,
        created_at=utcnow() - timedelta(days=12),
    )
    await purchase.insert()
    await ledger.add_entry(
        type="purchase",
        description=f"Stock purchase {purchase.purchase_no} from {purchase_supplier.name}",
        debit=purchase.total,
        ref_type="purchase",
        ref_id=purchase.id,
        date=purchase.created_at,
        created_by_name=admin.name,
    )

    # Historical sales
    cashiers = [staff, staff2, admin]
    for day_offset in range(11, -1, -1):
        sale_count = random.randint(2, 5)
        for _ in range(sale_count):
            chosen = random.sample(products, random.randint(1, 3))
            sale_items: list[SaleItem] = []
            subtotal = 0.0
            tax_total = 0.0
            for product in chosen:
                qty = random.randint(1, 3)
                variant_sku = None
                if product.variants and product.stock_qty > qty:
                    variant = random.choice(product.variants)
                    variant_sku = variant.sku
                    variant.stock_qty = max(0, variant.stock_qty - qty)
                    product.stock_qty = sum(v.stock_qty for v in product.variants)
                elif product.stock_qty > qty:
                    product.stock_qty -= qty
                else:
                    continue
                await product.save()
                line_base = round(qty * product.selling_price, 2)
                line_tax = round(line_base * product.tax_rate / 100.0, 2)
                subtotal += line_base
                tax_total += line_tax
                sale_items.append(
                    SaleItem(
                        product_id=product.id,
                        variant_sku=variant_sku,
                        name=product.name,
                        sku=product.sku,
                        qty=qty,
                        unit_price=product.selling_price,
                        discount=0.0,
                        tax_rate=product.tax_rate,
                        tax_amount=line_tax,
                        line_total=round(line_base + line_tax, 2),
                    )
                )
            if not sale_items:
                continue
            subtotal = round(subtotal, 2)
            tax_total = round(tax_total, 2)
            total = round(subtotal + tax_total, 2)
            method = random.choice(["cash", "card", "upi"])
            cashier = random.choice(cashiers)
            created = utcnow() - timedelta(days=day_offset, hours=random.randint(0, 8))
            sale = Sale(
                invoice_no=await numbering.next_invoice_no(),
                items=sale_items,
                subtotal=subtotal,
                discount=0.0,
                tax=tax_total,
                total=total,
                payment_method=method,
                amount_paid=total,
                change_due=0.0,
                customer_name=customers[0].name,
                cashier_id=cashier.id,
                cashier_name=cashier.name,
                created_at=created,
            )
            await sale.insert()
            await ledger.add_entry(
                type="sale",
                description=f"Sale {sale.invoice_no}",
                credit=total,
                ref_type="sale",
                ref_id=sale.id,
                date=created,
                created_by_name=cashier.name,
            )

    # One product return
    recent_sale = await Sale.find_all().to_list()
    recent_sale = sorted(recent_sale, key=lambda s: s.created_at, reverse=True)
    if recent_sale:
        target = recent_sale[0]
        first_item = target.items[0]
        returned = SalesReturn(
            return_no=await numbering.next_return_no(),
            sale_id=target.id,
            invoice_no=target.invoice_no,
            items=[
                {
                    "product_id": first_item.product_id,
                    "variant_sku": first_item.variant_sku,
                    "name": first_item.name,
                    "qty": 1,
                    "unit_price": first_item.unit_price,
                    "line_total": first_item.unit_price,
                }
            ],
            refund_amount=first_item.unit_price,
            reason="Size did not fit",
            resolution="exchange",
            restock=True,
            processed_by_id=admin.id,
            processed_by_name=admin.name,
        )
        await returned.insert()
        await ledger.add_entry(
            type="return",
            description=f"Return {returned.return_no} against {target.invoice_no}",
            debit=first_item.unit_price,
            ref_type="return",
            ref_id=returned.id,
            created_by_name=admin.name,
        )

    await ledger.recompute_balances()

    print("Seed complete.")
    print("Admin login: admin@posshop.com / Admin@123")
    print("Staff login: staff@posshop.com / Staff@123")


if __name__ == "__main__":
    asyncio.run(main())
