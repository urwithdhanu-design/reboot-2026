"""Insurance Support Assistant copy per screen."""

from __future__ import annotations

from fastapi import APIRouter, Query

router = APIRouter()

MESSAGES = {
    "register": "Welcome! Let's create your insurance experience.",
    "login": "Good to see you again! Your policies are safe and secure.",
    "kyc": "We will need your valid documents. All verified securely.",
    "wallet": "Your account is ready. Keep your details safe.",
    "marketplace": "Browse cover that fits your life. Ask if you need help choosing.",
}


@router.get("/message")
def assistant_message(screen: str = Query(default="register")) -> dict:
    key = screen.lower().strip()
    return {
        "title": "Insurance Support Assistant",
        "message": MESSAGES.get(key, MESSAGES["register"]),
        "screen": key,
    }
