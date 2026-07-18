from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import config
from app.ledger import query_account, submit_transfer

app = FastAPI(title="GCUL Sidecar", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TransferRequest(BaseModel):
    from_wallet: str = Field(default="gcul:treasury")
    to_wallet: str
    amount: float = 0
    amount_minor_units: int | None = None
    asset: str = "GBP"
    reference: str = "transfer"
    type: str = "transfer"


class AccountRequest(BaseModel):
    account_id: str


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "gcul-sidecar",
        "mode": config.mode,
        "live_ready": config.live_ready,
        "sdk_package": "packages/gcul-sdk",
    }


@app.post("/api/gcul/transfer")
def transfer(body: TransferRequest) -> dict[str, Any]:
    minor = body.amount_minor_units
    if minor is None:
        # Treat decimal amount as major units → minor (x100) for demo GBP/pence
        minor = int(round(body.amount * 100))
    return submit_transfer(
        from_wallet=body.from_wallet,
        to_wallet=body.to_wallet,
        amount_minor_units=minor,
        asset=body.asset,
        reference=body.reference or body.type,
    )


@app.post("/api/gcul/account")
def account(body: AccountRequest) -> dict[str, Any]:
    return query_account(body.account_id)
