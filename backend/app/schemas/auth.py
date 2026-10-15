from app.schemas.common import ORMModel
from app.schemas.user import UserOut


class LoginRequest(ORMModel):
    username: str
    password: str


class TokenResponse(ORMModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
