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


class AppConfig:
    def __init__(self, path: Path | None = None) -> None:
        root = Path(__file__).resolve().parents[1]
        props_path = path or root / "application.properties"
        raw: dict[str, str] = {}
        if props_path.exists():
            for line in props_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                raw[key.strip()] = _expand(value.strip())

        self.root = root
        self.port = int(os.environ.get("PORT", raw.get("server.port", "8093")))
        self.jwt_secret = os.environ.get(
            "GCUL_JWT_SECRET", raw.get("gcul.jwt.secret", "gcul-dev-jwt-secret-change-me-32chars-min")
        )
        self.firestore_project = os.environ.get(
            "GCUL_FIRESTORE_PROJECT", raw.get("firestore.project.id", "insure360-83a36")
        )
        self.firestore_collection = os.environ.get(
            "GCUL_OBSERVABILITY_COLLECTION", raw.get("firestore.collection", "gcul_observability")
        )
        self.firestore_enabled = (
            os.environ.get("GCUL_FIRESTORE_ENABLED", raw.get("firestore.enabled", "true")).lower()
            == "true"
        )
        self.monitor_interval = int(
            os.environ.get("OBS_MONITOR_INTERVAL", raw.get("monitor.interval.seconds", "30"))
        )
        services_raw = os.environ.get(
            "OBS_MONITOR_SERVICES", raw.get("monitor.services", "")
        )
        self.monitor_services = _parse_services(services_raw)


def _parse_services(raw: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for part in raw.split(","):
        part = part.strip()
        if not part or ":" not in part:
            continue
        sid, port = part.split(":", 1)
        sid = sid.strip()
        port = port.strip()
        items.append(
            {
                "id": f"gcul-{sid}" if not sid.startswith("gcul-") else sid,
                "health_url": f"http://127.0.0.1:{port}/health",
            }
        )
    return items


config = AppConfig()
