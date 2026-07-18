from __future__ import annotations

import os
import re
from pathlib import Path


def _expand(value: str) -> str:
    def repl(match: re.Match[str]) -> str:
        inner = match.group(1)
        if ":" in inner:
            name, default = inner.split(":", 1)
            return os.environ.get(name, default)
        return os.environ.get(inner, "")

    return re.sub(r"\$\{([^}]+)\}", repl, value)


class SidecarConfig:
    def __init__(self) -> None:
        root = Path(__file__).resolve().parents[1]
        props = root / "application.properties"
        raw: dict[str, str] = {}
        if props.exists():
            for line in props.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                raw[key.strip()] = _expand(value.strip())

        self.port = int(raw.get("server.port", "8091"))
        self.mode = raw.get("gcul.mode", "demo").strip().lower()
        self.project = raw.get("gcul.project", "")
        self.location = raw.get("gcul.location", "us-central1")
        self.endpoint = raw.get("gcul.endpoint", "")
        self.service_account_file = raw.get("gcul.service.account.file", "")
        self.host = raw.get("gcul.host", "universalledger.googleapis.com")

    @property
    def live_ready(self) -> bool:
        return self.mode == "live" and bool(self.project) and bool(self.endpoint)


config = SidecarConfig()
