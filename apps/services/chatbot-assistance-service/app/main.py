from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import config
from app.rag import get_pipeline
from app.stallion import assistant


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = None
    policy_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict[str, Any]]
    vector_store: str
    action: str | None = None
    policies: list[dict[str, Any]] = Field(default_factory=list)
    claims: list[dict[str, Any]] = Field(default_factory=list)
    requires_login: bool = False


@asynccontextmanager
async def lifespan(_: FastAPI):
    if config.auto_ingest:
        try:
            store = get_pipeline().store
            if store.count() == 0:
                get_pipeline().ingest()
        except Exception as exc:  # noqa: BLE001 — startup should not crash hard
            print(f"[stallion] ingest skipped: {exc}")
    yield


app = FastAPI(title="Stallion — GCUL Chatbot Assistance", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.strip().split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip() or None
    return None


@app.get("/health")
def health() -> dict[str, Any]:
    docs = 0
    ingest_error: str | None = None
    try:
        docs = get_pipeline().store.count()
    except Exception as exc:  # noqa: BLE001 — health should stay up if FAISS/embeddings fail
        ingest_error = str(exc)
    payload: dict[str, Any] = {
        "status": "ok" if ingest_error is None else "degraded",
        "service": "chatbot-assistance-service",
        "assistant": "Stallion",
        "vector_store": config.vector_store,
        "documents_indexed": docs,
    }
    if ingest_error:
        payload["ingest_error"] = ingest_error
    return payload


@app.post("/api/chatbot/ingest")
def ingest() -> dict[str, Any]:
    return get_pipeline().ingest()


@app.post("/api/chatbot/ask", response_model=ChatResponse)
def ask(
    body: ChatRequest,
    authorization: str | None = Header(default=None),
) -> ChatResponse:
    token = _extract_token(authorization)
    result = assistant.ask(
        body.message.strip(),
        token=token,
        session_id=body.session_id,
        policy_id=body.policy_id,
    )
    return ChatResponse(**result)


@app.get("/api/chatbot/config")
def chatbot_config() -> dict[str, Any]:
    return {
        "assistant_name": "Stallion",
        "vector_store": config.vector_store,
        "embedding_model": config.embedding_model,
        "top_k": config.top_k,
        "documents_indexed": get_pipeline().store.count(),
        "llm_enabled": bool(config.openai_api_key),
        "policy_service_url": config.policy_service_url,
        "claims_service_url": config.claims_service_url,
    }
