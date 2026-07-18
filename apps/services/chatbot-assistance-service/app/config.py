from __future__ import annotations

import os
import re
from pathlib import Path


def _expand(value: str) -> str:
    """Expand ${ENV:default} placeholders."""

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
        self.port = int(raw.get("server.port", "8090"))
        self.vector_store = raw.get("vector.store", "faiss").strip().lower()
        self.faiss_index_path = root / raw.get("faiss.index.path", "./data/faiss.index")
        self.faiss_meta_path = root / raw.get("faiss.meta.path", "./data/faiss_meta.json")
        self.pinecone_api_key = raw.get("pinecone.api.key", "")
        self.pinecone_index_name = raw.get("pinecone.index.name", "gcul-insurance-rag")
        self.pinecone_cloud = raw.get("pinecone.cloud", "aws")
        self.pinecone_region = raw.get("pinecone.region", "us-east-1")
        self.pinecone_namespace = raw.get("pinecone.namespace", "insurance")
        self.embedding_model = raw.get(
            "embedding.model", "sentence-transformers/all-MiniLM-L6-v2"
        )
        self.top_k = int(raw.get("rag.top.k", "4"))
        self.min_score = float(raw.get("rag.min.score", "0.15"))
        knowledge = raw.get("knowledge.dir", "./knowledge")
        self.knowledge_dir = (root / knowledge).resolve()
        self.openai_api_key = raw.get("openai.api.key", "")
        self.openai_model = raw.get("openai.model", "gpt-4o-mini")
        self.auto_ingest = raw.get("chatbot.auto.ingest", "true").lower() == "true"


config = AppConfig()
