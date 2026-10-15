from datetime import datetime

from app.schemas.common import ObjectIdStr, ORMModel


class CategoryCreate(ORMModel):
    name: str
    description: str | None = None


class CategoryUpdate(ORMModel):
    name: str | None = None
    description: str | None = None


class CategoryOut(ORMModel):
    id: ObjectIdStr
    name: str
    description: str | None = None
    created_at: datetime
