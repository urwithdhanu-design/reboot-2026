from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import config
from app.rag import get_pipeline


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict[str, Any]]
    vector_store: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    if config.auto_ingest:
        try:
            store = get_pipeline().store
            if store.count() == 0:
                get_pipeline().ingest()
        except Exception as exc:  # noqa: BLE001 — startup should not crash hard
            print(f"[chatbot] ingest skipped: {exc}")
    yield


app = FastAPI(title="GCUL Chatbot Assistance Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "chatbot-assistance-service",
        "vector_store": config.vector_store,
        "documents_indexed": get_pipeline().store.count(),
    }


@app.post("/api/chatbot/ingest")
def ingest() -> dict[str, Any]:
    return get_pipeline().ingest()


@app.post("/api/chatbot/ask", response_model=ChatResponse)
def ask(body: ChatRequest) -> ChatResponse:
    result = get_pipeline().ask(body.message.strip())
    return ChatResponse(**result)


@app.get("/api/chatbot/config")
def chatbot_config() -> dict[str, Any]:
    return {
        "vector_store": config.vector_store,
        "embedding_model": config.embedding_model,
        "top_k": config.top_k,
        "documents_indexed": get_pipeline().store.count(),
        "llm_enabled": bool(config.openai_api_key),
    }
