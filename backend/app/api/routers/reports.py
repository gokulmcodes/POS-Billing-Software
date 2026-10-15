from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.core.deps import require_admin
from app.models.user import User
from app.services import reports as reports_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
async def summary(_: User = Depends(require_admin)) -> dict:
    return await reports_service.summary()


@router.get("/daily-sales")
async def daily_sales(days: int = Query(default=14, ge=1, le=90), _: User = Depends(require_admin)) -> list[dict]:
    return await reports_service.daily_sales(days)


@router.get("/top-products")
async def top_products(limit: int = Query(default=5, ge=1, le=50), _: User = Depends(require_admin)) -> list[dict]:
    return await reports_service.top_products(limit)


@router.get("/payment-breakdown")
async def payment_breakdown(_: User = Depends(require_admin)) -> list[dict]:
    return await reports_service.payment_breakdown()


@router.get("/low-stock")
async def low_stock(_: User = Depends(require_admin)) -> list[dict]:
    return await reports_service.low_stock()


@router.get("/sales")
async def sales_report(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    _: User = Depends(require_admin),
) -> dict:
    return await reports_service.sales_report(start, end)
