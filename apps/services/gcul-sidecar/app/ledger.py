from __future__ import annotations

import hashlib
import secrets
import time
from typing import Any

from app.config import config


def _demo_digest(payload: str) -> str:
    raw = f"{payload}:{time.time_ns()}:{secrets.token_hex(4)}"
    return hashlib.sha256(raw.encode()).hexdigest()


def submit_transfer(
    *,
    from_wallet: str,
    to_wallet: str,
    amount_minor_units: int,
    asset: str,
    reference: str,
) -> dict[str, Any]:
    """Submit a transfer via GCUL SDK (live) or return a demo digest."""
    if not config.live_ready:
        digest = _demo_digest(f"{from_wallet}->{to_wallet}:{amount_minor_units}:{asset}")
        return {
            "mode": "demo",
            "status": "confirmed",
            "digest": digest,
            "from_wallet": from_wallet,
            "to_wallet": to_wallet,
            "amount_minor_units": amount_minor_units,
            "asset": asset,
            "reference": reference,
            "message": "Demo ledger transfer (set gcul.mode=live + project/endpoint for real GCUL)",
        }

    # Live path — SDK must be installed: pip install -e packages/gcul-sdk
    from gcul import UniversalLedgerClient  # type: ignore

    kwargs: dict[str, Any] = {
        "project": config.project,
        "location": config.location,
        "endpoint": config.endpoint,
        "host": config.host,
    }
    if config.service_account_file:
        kwargs["service_account_file"] = config.service_account_file

    # Full signed transfer needs operator signer keys; expose submit hook metadata for now.
    # Operators can extend this to call client.transfer(...) with a loaded Signer.
    with UniversalLedgerClient(**kwargs) as client:
        endpoint = client.endpoint
    digest = _demo_digest(f"live-pending:{endpoint}:{from_wallet}:{to_wallet}")
    return {
        "mode": "live",
        "status": "accepted",
        "digest": digest,
        "endpoint": endpoint,
        "from_wallet": from_wallet,
        "to_wallet": to_wallet,
        "amount_minor_units": amount_minor_units,
        "asset": asset,
        "reference": reference,
        "message": (
            "Connected to GCUL endpoint. Wire Signer + sequence_number to complete "
            "client.transfer() for production settlements."
        ),
    }


def query_account(account_id: str) -> dict[str, Any]:
    if not config.live_ready:
        return {
            "mode": "demo",
            "account_id": account_id,
            "sequence_number": 1,
            "status": "active",
            "message": "Demo account view",
        }

    from gcul import UniversalLedgerClient  # type: ignore

    kwargs: dict[str, Any] = {
        "project": config.project,
        "location": config.location,
        "endpoint": config.endpoint,
        "host": config.host,
    }
    if config.service_account_file:
        kwargs["service_account_file"] = config.service_account_file

    with UniversalLedgerClient(**kwargs) as client:
        account = client.query_account(account_id)
    return {
        "mode": "live",
        "account_id": account_id,
        "sequence_number": getattr(account, "sequence_number", None),
        "raw_type": type(account).__name__,
        "status": "active",
    }
