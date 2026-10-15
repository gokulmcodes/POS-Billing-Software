from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_user
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerOut

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerOut])
async def list_customers(search: str | None = Query(default=None), _: User = Depends(get_current_user)) -> list[Customer]:
    customers = await Customer.find_all().to_list()
    if search:
        term = search.lower()
        customers = [c for c in customers if term in c.name.lower() or (c.phone and term in c.phone)]
    customers.sort(key=lambda c: c.name.lower())
    return customers


@router.post("", response_model=CustomerOut, status_code=201)
async def create_customer(payload: CustomerCreate, _: User = Depends(get_current_user)) -> Customer:
    customer = Customer(**payload.model_dump())
    await customer.insert()
    return customer


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: str, _: User = Depends(get_current_user)) -> Customer:
    customer = await Customer.get(PydanticObjectId(customer_id))
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
