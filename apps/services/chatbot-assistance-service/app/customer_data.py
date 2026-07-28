from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import config

SETTLED_STATUSES = frozenset(
    {"settled", "paid", "paid_out", "approved", "payment_pending"}
)


def _year_from_iso(value: str | None) -> int | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).year
    except ValueError:
        return None


def fetch_customer_policies(token: str) -> list[dict[str, Any]]:
    url = f"{config.policy_service_url.rstrip('/')}/api/policies/me"
    with httpx.Client(timeout=20.0) as client:
        res = client.get(url, headers={"Authorization": f"Bearer {token}"})
        res.raise_for_status()
        data = res.json()
    policies = data.get("policies") if isinstance(data, dict) else None
    if not isinstance(policies, list):
        return []
    return [p for p in policies if isinstance(p, dict)]


def fetch_all_claims() -> list[dict[str, Any]]:
    url = f"{config.claims_service_url.rstrip('/')}/api/claims"
    with httpx.Client(timeout=20.0) as client:
        res = client.get(url)
        res.raise_for_status()
        data = res.json()
    items = data.get("claims") if isinstance(data, dict) else data
    if not isinstance(items, list):
        return []
    return [c for c in items if isinstance(c, dict)]


def policy_card(policy: dict[str, Any]) -> dict[str, Any]:
    return {
        "policy_id": policy.get("policy_id"),
        "policy_number": policy.get("policy_number"),
        "product_title": policy.get("product_title"),
        "status": policy.get("status"),
        "issued_at": policy.get("issued_at"),
        "product_category": policy.get("product_category"),
        "mint_status": policy.get("mint_status"),
    }


def split_policies_by_year(policies: list[dict[str, Any]]) -> tuple[list[dict], list[dict]]:
    now = datetime.now(timezone.utc).year
    this_year: list[dict[str, Any]] = []
    last_year: list[dict[str, Any]] = []
    for policy in policies:
        year = _year_from_iso(str(policy.get("issued_at") or ""))
        if year == now:
            this_year.append(policy)
        elif year == now - 1:
            last_year.append(policy)
    return this_year, last_year


def match_policy(
    policies: list[dict[str, Any]], hint: str | None, policy_id: str | None
) -> dict[str, Any] | None:
    if policy_id:
        for policy in policies:
            if str(policy.get("policy_id")) == policy_id:
                return policy
    if not hint:
        return None
    needle = hint.strip().lower()
    for policy in policies:
        if needle in str(policy.get("policy_number", "")).lower():
            return policy
        if needle in str(policy.get("policy_id", "")).lower():
            return policy
        if needle in str(policy.get("product_title", "")).lower():
            return policy
    return None


def policy_refs_for(policy: dict[str, Any]) -> set[str]:
    refs: set[str] = set()
    for key in ("policy_id", "policy_number", "policy_reference_hash"):
        value = policy.get(key)
        if value:
            refs.add(str(value))
    return refs


def filter_claims_for_customer(
    claims: list[dict[str, Any]], policies: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    refs: set[str] = set()
    for policy in policies:
        refs.update(policy_refs_for(policy))
    return [c for c in claims if str(c.get("policy_ref") or "") in refs]


def claims_for_policy(
    claims: list[dict[str, Any]], policy: dict[str, Any], settled_only: bool = True
) -> list[dict[str, Any]]:
    refs = policy_refs_for(policy)
    rows: list[dict[str, Any]] = []
    for claim in claims:
        ref = str(claim.get("policy_ref") or "")
        if ref not in refs:
            continue
        if settled_only:
            status = str(claim.get("status") or "").lower()
            if status not in SETTLED_STATUSES:
                continue
        rows.append(claim)
    return rows


def split_claims_by_year(claims: list[dict[str, Any]]) -> tuple[list[dict], list[dict]]:
    now = datetime.now(timezone.utc).year
    this_year: list[dict[str, Any]] = []
    last_year: list[dict[str, Any]] = []
    for claim in claims:
        year = _year_from_iso(str(claim.get("created_at") or claim.get("updated_at") or ""))
        if year == now:
            this_year.append(claim)
        elif year == now - 1:
            last_year.append(claim)
    return this_year, last_year


def format_policy_summary(policies: list[dict[str, Any]]) -> str:
    this_year, last_year = split_policies_by_year(policies)
    lines = ["Here are your policies from our records:"]
    if this_year:
        lines.append(f"\n**This year ({datetime.now(timezone.utc).year})** — {len(this_year)} policy(s)")
        for p in this_year:
            lines.append(_policy_line(p))
    else:
        lines.append(f"\n**This year ({datetime.now(timezone.utc).year})** — no policies issued.")
    if last_year:
        lines.append(f"\n**Last year ({datetime.now(timezone.utc).year - 1})** — {len(last_year)} policy(s)")
        for p in last_year:
            lines.append(_policy_line(p))
    else:
        lines.append(f"\n**Last year ({datetime.now(timezone.utc).year - 1})** — no policies issued.")
    other = [
        p
        for p in policies
        if p not in this_year and p not in last_year
    ]
    if other:
        lines.append("\n**Other years**")
        for p in other:
            lines.append(_policy_line(p))
    return "\n".join(lines)


def _policy_line(policy: dict[str, Any]) -> str:
    title = policy.get("product_title") or "Policy"
    number = policy.get("policy_number") or policy.get("policy_id")
    status = policy.get("status") or "unknown"
    issued = policy.get("issued_at") or "—"
    return f"• {title} ({number}) — status: {status}, issued: {issued}"


def format_claims_summary(policy: dict[str, Any], claims: list[dict[str, Any]]) -> str:
    title = policy.get("product_title") or policy.get("policy_number") or "your policy"
    if not claims:
        return (
            f"I found no settled or paid claims on **{title}** for this year or last year. "
            "If you expected a payout, it may still be in review."
        )
    this_year, last_year = split_claims_by_year(claims)
    lines = [f"Settled claims for **{title}** ({policy.get('policy_number')}):"]
    if this_year:
        lines.append(f"\n**This year** — {len(this_year)} claim(s)")
        for c in this_year:
            lines.append(_claim_line(c))
    else:
        lines.append("\n**This year** — no settled claims.")
    if last_year:
        lines.append(f"\n**Last year** — {len(last_year)} claim(s)")
        for c in last_year:
            lines.append(_claim_line(c))
    else:
        lines.append("\n**Last year** — no settled claims.")
    return "\n".join(lines)


def _claim_line(claim: dict[str, Any]) -> str:
    status = claim.get("status") or "unknown"
    amount = claim.get("approved_amount") or claim.get("amount_claimed")
    created = claim.get("created_at") or "—"
    ref = claim.get("id") or "—"
    amount_txt = f"£{amount:.2f}" if isinstance(amount, (int, float)) else str(amount)
    return f"• Claim {ref} — {status}, amount: {amount_txt}, filed: {created}"
