"""KYC verification routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.services.security import current_user
from app.store import UserRecord, store, utcnow

router = APIRouter()


class KycSubmitRequest(BaseModel):
    document_type: str = Field(pattern="^(passport|driving_licence|national_id)$")
    document_uploaded: bool = True
    selfie_captured: bool = True


@router.post("/submit")
def submit_kyc(
    body: KycSubmitRequest,
    user: UserRecord = Depends(current_user),
) -> dict:
    progress = {
        "identity": "done",
        "verify": "done" if body.document_uploaded else "pending",
        "liveness": "done" if body.selfie_captured else "pending",
        "complete": "done" if body.document_uploaded and body.selfie_captured else "pending",
    }
    status = (
        "verified"
        if progress["complete"] == "done"
        else "in_progress"
    )
    user.kyc = {
        "status": status,
        "document_type": body.document_type,
        "progress": progress,
        "submitted_at": utcnow(),
    }
    store.update_user(user)
    return {"status": status, "progress": progress}


@router.get("/status")
def kyc_status(user: UserRecord = Depends(current_user)) -> dict:
    if not user.kyc:
        return {
            "status": "not_started",
            "progress": {
                "identity": "pending",
                "verify": "pending",
                "liveness": "pending",
                "complete": "pending",
            },
        }
    return {
        "status": user.kyc.get("status", "not_started"),
        "progress": user.kyc.get("progress", {}),
        "document_type": user.kyc.get("document_type"),
    }
