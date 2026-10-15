from datetime import datetime
from typing import Literal

from beanie import PydanticObjectId

from app.models.base import utcnow
from app.models.ledger import LedgerEntry


async def add_entry(
    *,
    type: Literal["sale", "purchase", "return", "expense", "payment", "adjustment"],
    description: str,
    debit: float = 0.0,
    credit: float = 0.0,
    ref_type: str | None = None,
    ref_id: PydanticObjectId | None = None,
    date: datetime | None = None,
    created_by_name: str | None = None,
) -> LedgerEntry:
    entry = LedgerEntry(
        type=type,
        description=description,
        debit=round(debit, 2),
        credit=round(credit, 2),
        ref_type=ref_type,
        ref_id=ref_id,
        date=date or utcnow(),
        created_by_name=created_by_name,
    )
    await entry.insert()
    await recompute_balances()
    refreshed = await LedgerEntry.get(entry.id)
    return refreshed or entry


async def recompute_balances() -> None:
    entries = await LedgerEntry.find_all().to_list()
    entries.sort(key=lambda e: (e.date, e.created_at))
    balance = 0.0
    for entry in entries:
        balance += (entry.credit or 0.0) - (entry.debit or 0.0)
        entry.balance = round(balance, 2)
        await entry.save()
