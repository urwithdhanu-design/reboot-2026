"""Digital wallet routes backed by GCUL key material."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.services.gcul_wallet import create_wallet
from app.services.security import current_user
from app.store import UserRecord, store

router = APIRouter()


@router.get("")
def get_wallet(user: UserRecord = Depends(current_user)) -> dict:
    if not user.wallet:
        return {"status": "disconnected", "address": None}
    return {
        "status": user.wallet["status"],
        "address": user.wallet["address"],
        "provider": user.wallet.get("provider", "secure_wallet"),
        "mode": user.wallet.get("mode", "demo"),
    }


@router.post("/create")
def provision_wallet(user: UserRecord = Depends(current_user)) -> dict:
    if user.wallet and user.wallet.get("status") == "connected":
        return {
            "status": user.wallet["status"],
            "address": user.wallet["address"],
            "provider": user.wallet.get("provider"),
            "mode": user.wallet.get("mode"),
            "reused": True,
        }

    if user.kyc.get("status") != "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete KYC verification before creating a wallet",
        )

    wallet = create_wallet(user.id, user.email)
    user.wallet = wallet
    store.update_user(user)
    return {
        "status": wallet["status"],
        "address": wallet["address"],
        "provider": wallet["provider"],
        "mode": wallet["mode"],
        "reused": False,
        "note": wallet.get("note"),
    }
