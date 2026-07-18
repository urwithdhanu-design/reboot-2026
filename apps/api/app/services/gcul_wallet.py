"""Wallet provisioning via GCUL SDK (live) or local demo ledger."""

from __future__ import annotations

import hashlib
import secrets
from typing import Any

from app.config import settings
from gcul import generate_p256_keypair


def _demo_address(seed: str) -> str:
    digest = hashlib.sha256(seed.encode()).hexdigest()
    return f"0x{digest[:4]}...{digest[-6:]}"


def create_wallet(user_id: str, email: str) -> dict[str, Any]:
    """Create a signing keypair and wallet record for the user.

    In ``live`` mode (GCUL_PROJECT + GCUL_ENDPOINT set), this still generates
    the local key material and records metadata for a subsequent
    CreateAccount submission by an account manager. Full on-ledger account
    creation requires privileged operator keys.
    """
    key_pair = generate_p256_keypair()
    public_pem = key_pair.public_key_pem_bytes().decode()
    address = _demo_address(f"{user_id}:{email}:{secrets.token_hex(4)}")

    record: dict[str, Any] = {
        "address": address,
        "status": "connected",
        "provider": "secure_wallet",
        "public_key_pem": public_pem,
        "ledger": "gcul",
        "mode": settings.gcul_mode,
    }

    if settings.gcul_mode == "live" and settings.gcul_project and settings.gcul_endpoint:
        record["endpoint"] = (
            f"projects/{settings.gcul_project}/locations/"
            f"{settings.gcul_location}/endpoints/{settings.gcul_endpoint}"
        )
        record["note"] = (
            "Key material ready for GCUL CreateAccount via account manager."
        )
    else:
        record["note"] = "Demo wallet backed by GCUL P-256 key material."

    return record
