"""In-memory store for demo / Cloud Run ephemeral instances."""

from __future__ import annotations

import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class UserRecord:
    id: str
    full_name: str
    email: str
    mobile_number: str
    password_hash: str
    terms_accepted: bool
    created_at: str
    kyc: dict[str, Any] = field(default_factory=dict)
    wallet: dict[str, Any] | None = None


class Store:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.users_by_email: dict[str, UserRecord] = {}
        self.users_by_id: dict[str, UserRecord] = {}

    def add_user(self, user: UserRecord) -> None:
        with self._lock:
            self.users_by_email[user.email.lower()] = user
            self.users_by_id[user.id] = user

    def get_by_email(self, email: str) -> UserRecord | None:
        return self.users_by_email.get(email.lower())

    def get_by_id(self, user_id: str) -> UserRecord | None:
        return self.users_by_id.get(user_id)

    def update_user(self, user: UserRecord) -> None:
        with self._lock:
            self.users_by_email[user.email.lower()] = user
            self.users_by_id[user.id] = user


store = Store()
