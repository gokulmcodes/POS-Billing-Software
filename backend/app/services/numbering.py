from datetime import datetime

from app.models.purchase import Purchase
from app.models.return_ import SalesReturn
from app.models.sale import Sale


def _stamp() -> str:
    return datetime.now().strftime("%Y%m%d")


async def next_invoice_no() -> str:
    count = await Sale.find_all().count()
    return f"INV-{_stamp()}-{count + 1:04d}"


async def next_purchase_no() -> str:
    count = await Purchase.find_all().count()
    return f"PO-{_stamp()}-{count + 1:04d}"


async def next_return_no() -> str:
    count = await SalesReturn.find_all().count()
    return f"RET-{_stamp()}-{count + 1:04d}"
