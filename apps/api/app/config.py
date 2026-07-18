"""Application settings."""

from __future__ import annotations

import os
from dataclasses import dataclass, field


def _split_origins(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


@dataclass
class Settings:
    cors_origins: list[str] = field(
        default_factory=lambda: _split_origins(
            os.getenv(
                "CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            )
        )
    )
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-gcul-insurance-secret-change-me")
    gcul_project: str | None = os.getenv("GCUL_PROJECT")
    gcul_location: str = os.getenv("GCUL_LOCATION", "us-central1")
    gcul_endpoint: str | None = os.getenv("GCUL_ENDPOINT")
    gcul_mode: str = os.getenv("GCUL_MODE", "demo")  # demo | live


settings = Settings()
