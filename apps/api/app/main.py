"""GCUL Insurance API — FastAPI service for LBG-themed onboarding."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import assistant, auth, kyc, products, wallet

app = FastAPI(
    title="GCUL Insurance API",
    version="0.1.0",
    description="Onboarding, KYC, wallet (Universal Ledger), and marketplace APIs",
)

_allow_all = "*" in settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else settings.cors_origins,
    allow_credentials=not _allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(kyc.router, prefix="/api/kyc", tags=["kyc"])
app.include_router(wallet.router, prefix="/api/wallet", tags=["wallet"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
