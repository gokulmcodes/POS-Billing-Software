from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.common import ObjectIdStr, ORMModel


class UserCreate(ORMModel):
    name: str
    email: EmailStr
    username: str
    password: str = Field(min_length=4)
    role: Literal["admin", "staff"] = "staff"
    phone: str | None = None


class UserUpdate(ORMModel):
    name: str | None = None
    email: EmailStr | None = None
    username: str | None = None
    password: str | None = None
    role: Literal["admin", "staff"] | None = None
    phone: str | None = None
    active: bool | None = None


class UserOut(ORMModel):
    id: ObjectIdStr
    name: str
    email: EmailStr
    username: str
    role: Literal["admin", "staff"]
    phone: str | None = None
    active: bool
    created_at: datetime
