from __future__ import annotations

import re

AUTH_REQUIRED_PATTERNS = [
    r"\bmy\s+polic",
    r"\bmy\s+claim",
    r"\bgive\s+me\s+my",
    r"\bshow\s+me\s+my",
    r"\bpolicy\s+details",
    r"\bpolicies\s+taken",
    r"\bclaims?\s+settled",
    r"\bsettled\s+claims?",
    r"\bmy\s+cover",
    r"\bmy\s+wallet",
    r"\baccount\s+polic",
]

POLICY_DETAIL_PATTERNS = [
    r"\bmy\s+polic",
    r"\bpolicy\s+details",
    r"\bpolicies\s+taken",
    r"\bgive\s+me\s+my\s+polic",
    r"\bshow\s+my\s+polic",
    r"\blist\s+my\s+polic",
    r"\bwhat\s+policies\s+do\s+i\s+have",
]

CLAIMS_SETTLED_PATTERNS = [
    r"\bclaims?\s+settled",
    r"\bsettled\s+claims?",
    r"\bshow\s+me\s+claims?\s+settled",
    r"\bclaims?\s+on\s+(the\s+)?polic",
    r"\bpayouts?\s+on\s+my\s+polic",
]


def _matches(text: str, patterns: list[str]) -> bool:
    lowered = text.lower().strip()
    return any(re.search(p, lowered) for p in patterns)


def is_auth_required_intent(message: str) -> bool:
    return _matches(message, AUTH_REQUIRED_PATTERNS)


def is_policy_details_intent(message: str) -> bool:
    return _matches(message, POLICY_DETAIL_PATTERNS)


def is_claims_settled_intent(message: str) -> bool:
    return _matches(message, CLAIMS_SETTLED_PATTERNS)
