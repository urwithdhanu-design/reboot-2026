from __future__ import annotations

import json
import threading
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Any

from app.config import config


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ObservabilityStore:
    def append_trace(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    def append_event(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    def upsert_service_health(self, service_id: str, payload: dict[str, Any]) -> None:
        raise NotImplementedError

    def list_traces(self, limit: int = 100, service_id: str | None = None) -> list[dict[str, Any]]:
        raise NotImplementedError

    def list_events(self, limit: int = 100, flow: str | None = None) -> list[dict[str, Any]]:
        raise NotImplementedError

    def list_service_health(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    def dashboard(self) -> dict[str, Any]:
        raise NotImplementedError


class InMemoryObservabilityStore(ObservabilityStore):
    def __init__(self) -> None:
        self._traces: deque[dict[str, Any]] = deque(maxlen=3000)
        self._events: deque[dict[str, Any]] = deque(maxlen=3000)
        self._health: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()

    def append_trace(self, payload: dict[str, Any]) -> dict[str, Any]:
        row = dict(payload)
        row.setdefault("id", str(uuid.uuid4()))
        row.setdefault("occurred_at", _now_iso())
        with self._lock:
            self._traces.appendleft(row)
        return row

    def append_event(self, payload: dict[str, Any]) -> dict[str, Any]:
        row = dict(payload)
        row.setdefault("id", str(uuid.uuid4()))
        row.setdefault("occurred_at", _now_iso())
        with self._lock:
            self._events.appendleft(row)
        return row

    def upsert_service_health(self, service_id: str, payload: dict[str, Any]) -> None:
        with self._lock:
            self._health[service_id] = dict(payload)

    def list_traces(self, limit: int = 100, service_id: str | None = None) -> list[dict[str, Any]]:
        with self._lock:
            rows = list(self._traces)
        if service_id:
            rows = [r for r in rows if r.get("service_id") == service_id]
        return rows[:limit]

    def list_events(self, limit: int = 100, flow: str | None = None) -> list[dict[str, Any]]:
        with self._lock:
            rows = list(self._events)
        if flow:
            rows = [r for r in rows if r.get("flow_category") == flow]
        return rows[:limit]

    def list_service_health(self) -> list[dict[str, Any]]:
        with self._lock:
            return list(self._health.values())

    def dashboard(self) -> dict[str, Any]:
        with self._lock:
            traces = list(self._traces)
            events = list(self._events)
            health = list(self._health.values())
        errors = [t for t in traces if int(t.get("status_code", 200)) >= 400]
        degraded = [h for h in health if h.get("status") != "ok"]
        return {
            "trace_count": len(traces),
            "event_count": len(events),
            "error_traces_1h": len(errors),
            "services_total": len(health),
            "services_degraded": len(degraded),
            "storage_backend": "memory",
            "firestore_enabled": False,
        }


class FirestoreObservabilityStore(ObservabilityStore):
    def __init__(self, project_id: str, collection: str) -> None:
        from google.cloud import firestore  # lazy import

        self._db = firestore.Client(project=project_id)
        self._root = collection

    def _col(self, name: str):
        return self._db.collection(self._root).document("data").collection(name)

    def append_trace(self, payload: dict[str, Any]) -> dict[str, Any]:
        row = dict(payload)
        row.setdefault("occurred_at", _now_iso())
        ref = self._col("api_traces").document()
        ref.set(row)
        row["id"] = ref.id
        return row

    def append_event(self, payload: dict[str, Any]) -> dict[str, Any]:
        row = dict(payload)
        row.setdefault("occurred_at", _now_iso())
        ref = self._col("domain_events").document()
        ref.set(row)
        row["id"] = ref.id
        return row

    def upsert_service_health(self, service_id: str, payload: dict[str, Any]) -> None:
        self._col("service_health").document(service_id).set(payload)

    def list_traces(self, limit: int = 100, service_id: str | None = None) -> list[dict[str, Any]]:
        query = self._col("api_traces").order_by(
            "occurred_at", direction="DESCENDING"
        ).limit(min(limit, 500))
        if service_id:
            query = query.where("service_id", "==", service_id)
        return [{**doc.to_dict(), "id": doc.id} for doc in query.stream()]

    def list_events(self, limit: int = 100, flow: str | None = None) -> list[dict[str, Any]]:
        query = self._col("domain_events").order_by(
            "occurred_at", direction="DESCENDING"
        ).limit(min(limit, 500))
        if flow:
            query = query.where("flow_category", "==", flow)
        return [{**doc.to_dict(), "id": doc.id} for doc in query.stream()]

    def list_service_health(self) -> list[dict[str, Any]]:
        return [
            {**doc.to_dict(), "service_id": doc.id}
            for doc in self._col("service_health").stream()
        ]

    def dashboard(self) -> dict[str, Any]:
        health = self.list_service_health()
        degraded = [h for h in health if h.get("status") != "ok"]
        return {
            "trace_count": len(self.list_traces(200)),
            "event_count": len(self.list_events(200)),
            "error_traces_1h": len(
                [t for t in self.list_traces(200) if int(t.get("status_code", 200)) >= 400]
            ),
            "services_total": len(health),
            "services_degraded": len(degraded),
            "storage_backend": "firestore",
            "firestore_enabled": True,
            "firestore_project": config.firestore_project,
            "firestore_collection": config.firestore_collection,
        }


_store: ObservabilityStore | None = None


def get_store() -> ObservabilityStore:
    global _store
    if _store is None:
        if config.firestore_enabled:
            try:
                _store = FirestoreObservabilityStore(
                    config.firestore_project, config.firestore_collection
                )
                # smoke write
                _store.append_event(
                    {
                        "event_type": "ObservabilityStarted",
                        "flow_category": "system",
                        "source_event_type": "ObservabilityStarted",
                    }
                )
            except Exception as exc:
                print(f"[observability] Firestore unavailable ({exc}); using in-memory store")
                _store = InMemoryObservabilityStore()
        else:
            _store = InMemoryObservabilityStore()
    return _store


def summarize_payload(payload: dict[str, Any], max_len: int = 4000) -> str:
    try:
        text = json.dumps(payload, default=str)
    except Exception:
        text = str(payload)
    if len(text) > max_len:
        return text[:max_len] + "…"
    return text
