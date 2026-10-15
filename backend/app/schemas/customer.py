from datetime import datetime

from app.schemas.common import ObjectIdStr, ORMModel


class CustomerCreate(ORMModel):
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    loyalty_points: int = 0


class CustomerOut(ORMModel):
    id: ObjectIdStr
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    loyalty_points: int
    created_at: datetime
