from __future__ import annotations

from typing import Any

from app.customer_data import (
    claims_for_policy,
    fetch_all_claims,
    fetch_customer_policies,
    filter_claims_for_customer,
    format_claims_summary,
    format_policy_summary,
    match_policy,
    policy_card,
)
from app.intent import (
    is_auth_required_intent,
    is_claims_settled_intent,
    is_policy_details_intent,
)
from app.config import config
from app.rag import get_pipeline

LOGIN_PROMPT = (
    "To view your personal policy and claim details, please **log in** or **create an account**. "
    "I can still help with general insurance questions — products, cover types, and how claims work."
)

_sessions: dict[str, dict[str, Any]] = {}


def _session(session_id: str | None) -> dict[str, Any]:
    key = session_id or "default"
    if key not in _sessions:
        _sessions[key] = {}
    return _sessions[key]


class StallionAssistant:
    def ask(
        self,
        message: str,
        token: str | None = None,
        session_id: str | None = None,
        policy_id: str | None = None,
    ) -> dict[str, Any]:
        text = message.strip()
        session = _session(session_id)
        pipeline = get_pipeline()

        if token and policy_id:
            try:
                policies = fetch_customer_policies(token)
                all_claims = filter_claims_for_customer(fetch_all_claims(), policies)
            except Exception as exc:
                return self._error(f"I could not load claims data right now ({exc}).", pipeline)
            selected = match_policy(policies, None, policy_id)
            if selected:
                session.pop("awaiting_policy_selection", None)
                settled = claims_for_policy(all_claims, selected, settled_only=True)
                return {
                    "answer": format_claims_summary(selected, settled),
                    "sources": [],
                    "vector_store": config.vector_store,
                    "action": None,
                    "policies": [policy_card(selected)],
                    "claims": settled,
                    "requires_login": False,
                }
            return self._error("I could not find that policy on your account.", pipeline)

        if is_policy_details_intent(text):
            if not token:
                return self._login_required()
            try:
                policies = fetch_customer_policies(token)
            except Exception as exc:
                return self._error(f"I could not load your policies right now ({exc}).", pipeline)
            if not policies:
                return {
                    "answer": "You have no policies on your account yet. Browse the marketplace to get a quote.",
                    "sources": [],
                    "vector_store": config.vector_store,
                    "action": None,
                    "policies": [],
                    "claims": [],
                    "requires_login": False,
                }
            session.pop("awaiting_policy_selection", None)
            return {
                "answer": format_policy_summary(policies),
                "sources": [],
                "vector_store": config.vector_store,
                "action": None,
                "policies": [policy_card(p) for p in policies],
                "claims": [],
                "requires_login": False,
            }

        if is_claims_settled_intent(text) or session.get("awaiting_policy_selection"):
            if not token:
                return self._login_required()
            try:
                policies = fetch_customer_policies(token)
                all_claims = filter_claims_for_customer(fetch_all_claims(), policies)
            except Exception as exc:
                return self._error(f"I could not load claims data right now ({exc}).", pipeline)

            selected = match_policy(
                policies,
                text if session.get("awaiting_policy_selection") else None,
                policy_id,
            )
            if selected:
                session.pop("awaiting_policy_selection", None)
                settled = claims_for_policy(all_claims, selected, settled_only=True)
                return {
                    "answer": format_claims_summary(selected, settled),
                    "sources": [],
                    "vector_store": config.vector_store,
                    "action": None,
                    "policies": [policy_card(selected)],
                    "claims": settled,
                    "requires_login": False,
                }

            if not policies:
                return {
                    "answer": "You have no policies to show claims against. Take out cover first from the marketplace.",
                    "sources": [],
                    "vector_store": config.vector_store,
                    "action": None,
                    "policies": [],
                    "claims": [],
                    "requires_login": False,
                }

            session["awaiting_policy_selection"] = True
            cards = [policy_card(p) for p in policies]
            return {
                "answer": (
                    "Select a policy below to see settled claims for **this year** and **last year**, "
                    "or type your policy number."
                ),
                "sources": [],
                "vector_store": config.vector_store,
                "action": "select_policy",
                "policies": cards,
                "claims": [],
                "requires_login": False,
            }

        if is_auth_required_intent(text) and not token:
            return self._login_required()

        result = pipeline.ask(text)
        result["action"] = None
        result["policies"] = []
        result["claims"] = []
        result["requires_login"] = False
        return result

    def _login_required(self) -> dict[str, Any]:
        return {
            "answer": LOGIN_PROMPT,
            "sources": [],
            "vector_store": config.vector_store,
            "action": None,
            "policies": [],
            "claims": [],
            "requires_login": True,
        }

    def _error(self, message: str, pipeline: Any) -> dict[str, Any]:
        return {
            "answer": message,
            "sources": [],
            "vector_store": config.vector_store,
            "action": None,
            "policies": [],
            "claims": [],
            "requires_login": False,
        }


assistant = StallionAssistant()
