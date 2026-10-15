from datetime import datetime
from typing import Literal

from beanie import Document, Indexed
from pydantic import EmailStr, Field

from app.models.base import utcnow


class User(Document):
    name: str
    email: Indexed(EmailStr, unique=True)  # type: ignore[valid-type]
    username: Indexed(str, unique=True)  # type: ignore[valid-type]
    password_hash: str
    role: Literal["admin", "staff"] = "staff"
    phone: str | None = None
    active: bool = True
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "users"
