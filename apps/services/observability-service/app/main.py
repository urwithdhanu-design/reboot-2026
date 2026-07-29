from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.auth import require_platform_admin
from app.config import config
from app.monitor import monitor_loop
from app.store import get_store, summarize_payload


class TraceIngest(BaseModel):
    service_id: str
    method: str
    path: str
    status_code: int = 200
    duration_ms: float = 0.0
    trace_id: str | None = None
    customer_id: str | None = None
    query_string: str | None = None
    request_summary: str | None = None
    response_summary: str | None = None
    error: str | None = None


class EventIngest(BaseModel):
    event_type: str
    source_event_type: str | None = None
    source_publisher: str | None = None
    source_topic: str | None = None
    flow_category: str | None = None
    customer_id: str | None = None
    policy_id: str | None = None
    claim_id: str | None = None
    quote_id: str | None = None
    event_id: str | None = None
    timestamp: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(monitor_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="GCUL Platform Observability", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def trace_self_requests(request, call_next):
    import time

    if request.url.path in {"/health", "/favicon.ico"}:
        return await call_next(request)
    started = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - started) * 1000, 1)
    if request.url.path.startswith("/api/"):
        try:
            get_store().append_trace(
                {
                    "service_id": "gcul-observability",
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "query_string": str(request.url.query)[:500],
                }
            )
        except Exception:
            pass
    return response


@app.get("/health")
def health() -> dict[str, Any]:
    store = get_store()
    dash = store.dashboard()
    return {
        "status": "ok",
        "service": "observability-service",
        "storage": dash.get("storage_backend"),
        "firestore_enabled": dash.get("firestore_enabled"),
        "monitored_services": len(config.monitor_services),
    }


@app.post("/api/internal/observability/traces")
def ingest_trace(body: TraceIngest) -> dict[str, Any]:
    row = get_store().append_trace(body.model_dump())
    return {"ok": True, "id": row.get("id")}


@app.post("/api/internal/observability/events")
def ingest_event(body: EventIngest) -> dict[str, Any]:
    data = body.model_dump()
    payload = data.pop("payload", {})
    if payload:
        data["payload_json"] = summarize_payload(payload)
    row = get_store().append_event(data)
    return {"ok": True, "id": row.get("id")}


@app.get("/api/admin/observability/dashboard")
def admin_dashboard(_: None = Depends(require_platform_admin)) -> dict[str, Any]:
    store = get_store()
    dash = store.dashboard()
    dash["services"] = store.list_service_health()
    dash["recent_errors"] = [
        t for t in store.list_traces(50)
        if int(t.get("status_code", 200)) >= 400
    ][:10]
    return dash


@app.get("/api/admin/observability/traces")
def admin_traces(
    limit: int = 100,
    service_id: str | None = None,
    _: None = Depends(require_platform_admin),
) -> dict[str, Any]:
    rows = get_store().list_traces(min(limit, 500), service_id)
    return {"traces": rows, "count": len(rows)}


@app.get("/api/admin/observability/events")
def admin_events(
    limit: int = 100,
    flow: str | None = None,
    _: None = Depends(require_platform_admin),
) -> dict[str, Any]:
    rows = get_store().list_events(min(limit, 500), flow)
    return {
        "events": rows,
        "count": len(rows),
        "flows": ["kyc", "wallet", "policy", "payment", "claims", "blockchain", "system"],
    }


@app.get("/api/admin/observability/services")
def admin_services(_: None = Depends(require_platform_admin)) -> dict[str, Any]:
    rows = get_store().list_service_health()
    return {"services": rows, "count": len(rows)}
