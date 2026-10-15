from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user, require_admin
from app.models.ledger import LedgerEntry
from app.models.user import User
from app.schemas.ledger import LedgerCreate, LedgerOut
from app.services import ledger as ledger_service

router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.get("", response_model=list[LedgerOut])
async def list_entries(
    type: str | None = Query(default=None),
    _: User = Depends(get_current_user),
) -> list[LedgerEntry]:
    entries = await LedgerEntry.find_all().to_list()
    if type:
        entries = [e for e in entries if e.type == type]
    entries.sort(key=lambda e: (e.date, e.created_at), reverse=True)
    return entries


@router.post("", response_model=LedgerOut, status_code=201)
async def create_entry(payload: LedgerCreate, user: User = Depends(require_admin)) -> LedgerEntry:
    return await ledger_service.add_entry(
        type=payload.type,
        description=payload.description,
        debit=payload.debit,
        credit=payload.credit,
        date=payload.date,
        ref_type=payload.ref_type,
        created_by_name=user.name,
    )
