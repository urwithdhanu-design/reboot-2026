from __future__ import annotations

from fastapi import Header, HTTPException, status
import jwt

from app.config import config


def require_platform_admin(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, config.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    role = str(payload.get("role", "")).lower()
    if role not in {"platform_admin", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Platform admin required")
