from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    auth,
    categories,
    customers,
    ledger,
    products,
    purchases,
    reports,
    returns,
    sales,
    suppliers,
    users,
)
from app.core.config import settings
from app.db.session import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth.router,
    users.router,
    categories.router,
    products.router,
    suppliers.router,
    customers.router,
    purchases.router,
    sales.router,
    returns.router,
    ledger.router,
    reports.router,
):
    app.include_router(router, prefix="/api")


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "app": settings.app_name}
