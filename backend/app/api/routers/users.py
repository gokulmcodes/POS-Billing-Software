from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def list_users(
    role: str | None = Query(default=None),
    search: str | None = Query(default=None),
    _: User = Depends(require_admin),
) -> list[User]:
    users = await User.find_all().to_list()
    if role:
        users = [u for u in users if u.role == role]
    if search:
        term = search.lower()
        users = [u for u in users if term in u.name.lower() or term in u.email.lower() or term in u.username.lower()]
    users.sort(key=lambda u: u.created_at, reverse=True)
    return users


@router.post("", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreate, _: User = Depends(require_admin)) -> User:
    exists = await User.find_one({"$or": [{"email": payload.email.lower()}, {"username": payload.username.lower()}]})
    if exists:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        username=payload.username.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        phone=payload.phone,
    )
    await user.insert()
    return user


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str, _: User = Depends(require_admin)) -> User:
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate, _: User = Depends(require_admin)) -> User:
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    password = data.pop("password", None)
    if "email" in data and data["email"]:
        data["email"] = data["email"].lower()
    if "username" in data and data["username"]:
        data["username"] = data["username"].lower()
    for key, value in data.items():
        setattr(user, key, value)
    if password:
        user.password_hash = hash_password(password)
    await user.save()
    return user


@router.delete("/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(require_admin)) -> dict:
    if str(admin.id) == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    await user.delete()
    return {"ok": True}
