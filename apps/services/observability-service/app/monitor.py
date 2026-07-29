from __future__ import annotations

import asyncio
from typing import Any

import httpx

from app.config import config
from app.store import get_store


async def poll_service_health(client: httpx.AsyncClient, service: dict[str, str]) -> dict[str, Any]:
    service_id = service["id"]
    url = service["health_url"]
    started = asyncio.get_event_loop().time()
    try:
        res = await client.get(url, timeout=5.0)
        latency_ms = round((asyncio.get_event_loop().time() - started) * 1000, 1)
        body: dict[str, Any] = {}
        try:
            if res.content:
                body = res.json()
        except Exception:
            body = {"raw": res.text[:500]}
        status = "ok"
        if res.status_code >= 500:
            status = "down"
        elif res.status_code >= 400 or body.get("status") == "degraded":
            status = "degraded"
        return {
            "service_id": service_id,
            "status": status,
            "http_status": res.status_code,
            "latency_ms": latency_ms,
            "health_url": url,
            "detail": body.get("status", body.get("service", "")),
            "checked_at": _iso_now(),
            "payload": body,
        }
    except Exception as exc:
        latency_ms = round((asyncio.get_event_loop().time() - started) * 1000, 1)
        return {
            "service_id": service_id,
            "status": "down",
            "http_status": 0,
            "latency_ms": latency_ms,
            "health_url": url,
            "detail": str(exc),
            "checked_at": _iso_now(),
            "payload": {},
        }


def _iso_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


async def monitor_loop() -> None:
    store = get_store()
    while True:
        if not config.monitor_services:
            await asyncio.sleep(config.monitor_interval)
            continue
        async with httpx.AsyncClient() as client:
            results = await asyncio.gather(
                *[poll_service_health(client, svc) for svc in config.monitor_services]
            )
        for row in results:
            store.upsert_service_health(row["service_id"], row)
        await asyncio.sleep(config.monitor_interval)
