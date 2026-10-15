from datetime import datetime

from app.schemas.common import ObjectIdStr, ORMModel


class SupplierCreate(ORMModel):
    name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    gstin: str | None = None
    notes: str | None = None
    active: bool = True


class SupplierUpdate(ORMModel):
    name: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    gstin: str | None = None
    notes: str | None = None
    active: bool | None = None


class SupplierOut(ORMModel):
    id: ObjectIdStr
    name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    gstin: str | None = None
    notes: str | None = None
    active: bool
    created_at: datetime
