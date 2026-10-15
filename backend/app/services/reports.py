from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.models.base import utcnow
from app.models.product import Product
from app.models.return_ import SalesReturn
from app.models.sale import Sale


def _day_key(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime("%Y-%m-%d")


async def summary() -> dict:
    sales = await Sale.find(Sale.status == "completed").to_list()
    returns = await SalesReturn.find_all().to_list()
    products = await Product.find_all().to_list()

    total_revenue = round(sum(s.total for s in sales), 2)
    total_discount = round(sum(s.discount for s in sales), 2)
    total_tax = round(sum(s.tax for s in sales), 2)
    total_refunds = round(sum(r.refund_amount for r in returns), 2)
    today = _day_key(utcnow())
    todays_sales = [s for s in sales if _day_key(s.created_at) == today]
    cost_by_id = {str(p.id): p.cost_price for p in products}
    profit = 0.0
    for s in sales:
        for item in s.items:
            if item.product_id:
                cost = cost_by_id.get(str(item.product_id))
                if cost is not None:
                    profit += item.line_total - (cost * item.qty)
    stock_value = round(sum(p.cost_price * p.stock_qty for p in products), 2)
    low_stock = [
        p for p in products if p.active and p.stock_qty <= p.reorder_level
    ]

    return {
        "total_revenue": total_revenue,
        "total_discount": total_discount,
        "total_tax": total_tax,
        "total_refunds": total_refunds,
        "total_transactions": len(sales),
        "avg_order_value": round(total_revenue / len(sales), 2) if sales else 0.0,
        "todays_revenue": round(sum(s.total for s in todays_sales), 2),
        "todays_transactions": len(todays_sales),
        "estimated_profit": round(profit, 2),
        "stock_value": stock_value,
        "low_stock_count": len(low_stock),
        "total_products": len(products),
    }


async def daily_sales(days: int = 14) -> list[dict]:
    since = utcnow() - timedelta(days=days - 1)
    sales = await Sale.find(Sale.status == "completed").to_list()
    buckets: dict[str, dict] = {}
    cursor = since
    for _ in range(days):
        key = _day_key(cursor)
        buckets[key] = {"date": key, "revenue": 0.0, "count": 0}
        cursor += timedelta(days=1)
    for s in sales:
        key = _day_key(s.created_at)
        if key in buckets:
            buckets[key]["revenue"] = round(buckets[key]["revenue"] + s.total, 2)
            buckets[key]["count"] += 1
    return list(buckets.values())


async def top_products(limit: int = 5) -> list[dict]:
    sales = await Sale.find(Sale.status == "completed").to_list()
    agg: dict[str, dict] = {}
    for s in sales:
        for item in s.items:
            key = str(item.product_id) if item.product_id else item.name
            entry = agg.setdefault(key, {"name": item.name, "qty": 0, "revenue": 0.0})
            entry["qty"] += item.qty
            entry["revenue"] = round(entry["revenue"] + item.line_total, 2)
    ranked = sorted(agg.values(), key=lambda x: x["qty"], reverse=True)
    return ranked[:limit]


async def payment_breakdown() -> list[dict]:
    sales = await Sale.find(Sale.status == "completed").to_list()
    agg: dict[str, dict] = {}
    for s in sales:
        entry = agg.setdefault(s.payment_method, {"method": s.payment_method, "total": 0.0, "count": 0})
        entry["total"] = round(entry["total"] + s.total, 2)
        entry["count"] += 1
    return list(agg.values())


async def low_stock(limit: int = 20) -> list[dict]:
    products = await Product.find(Product.active == True).to_list()  # noqa: E712
    low = [p for p in products if p.stock_qty <= p.reorder_level]
    low.sort(key=lambda p: p.stock_qty)
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "sku": p.sku,
            "stock_qty": p.stock_qty,
            "reorder_level": p.reorder_level,
        }
        for p in low[:limit]
    ]


async def sales_report(start: datetime | None = None, end: datetime | None = None) -> dict:
    sales = await Sale.find(Sale.status == "completed").to_list()
    if start:
        sales = [s for s in sales if s.created_at >= start]
    if end:
        sales = [s for s in sales if s.created_at <= end]
    total = round(sum(s.total for s in sales), 2)
    by_day: dict[str, dict] = {}
    for s in sales:
        key = _day_key(s.created_at)
        entry = by_day.setdefault(key, {"date": key, "revenue": 0.0, "count": 0})
        entry["revenue"] = round(entry["revenue"] + s.total, 2)
        entry["count"] += 1
    return {
        "start": start.isoformat() if start else None,
        "end": end.isoformat() if end else None,
        "total_revenue": total,
        "total_transactions": len(sales),
        "by_day": sorted(by_day.values(), key=lambda x: x["date"]),
    }
