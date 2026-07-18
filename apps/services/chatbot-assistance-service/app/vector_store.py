from __future__ import annotations

import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

import faiss
import numpy as np

from app.config import config
from app.embeddings import embed_query, embed_texts
from app.ingest import DocumentChunk


class VectorStore(ABC):
    @abstractmethod
    def upsert(self, chunks: list[DocumentChunk]) -> int:
        ...

    @abstractmethod
    def search(self, query: str, top_k: int) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    def count(self) -> int:
        ...


class FaissStore(VectorStore):
    def __init__(self) -> None:
        self.index_path = Path(config.faiss_index_path)
        self.meta_path = Path(config.faiss_meta_path)
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        self.meta: list[dict[str, Any]] = []
        self.index: faiss.Index | None = None
        self._load()

    def _load(self) -> None:
        if self.index_path.exists() and self.meta_path.exists():
            self.index = faiss.read_index(str(self.index_path))
            self.meta = json.loads(self.meta_path.read_text(encoding="utf-8"))
        else:
            self.index = None
            self.meta = []

    def _save(self) -> None:
        if self.index is None:
            return
        faiss.write_index(self.index, str(self.index_path))
        self.meta_path.write_text(json.dumps(self.meta, indent=2), encoding="utf-8")

    def upsert(self, chunks: list[DocumentChunk]) -> int:
        if not chunks:
            return 0
        vectors = embed_texts([c.text for c in chunks])
        dim = vectors.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(vectors)
        self.meta = [
            {
                "id": c.id,
                "text": c.text,
                "source": c.source,
                "title": c.title,
                "category": c.category,
            }
            for c in chunks
        ]
        self._save()
        return len(chunks)

    def search(self, query: str, top_k: int) -> list[dict[str, Any]]:
        if self.index is None or not self.meta:
            return []
        q = embed_query(query).reshape(1, -1)
        scores, idxs = self.index.search(q, min(top_k, len(self.meta)))
        results: list[dict[str, Any]] = []
        for score, idx in zip(scores[0], idxs[0], strict=False):
            if idx < 0:
                continue
            item = dict(self.meta[int(idx)])
            item["score"] = float(score)
            results.append(item)
        return results

    def count(self) -> int:
        return len(self.meta)


class PineconeStore(VectorStore):
    def __init__(self) -> None:
        if not config.pinecone_api_key:
            raise RuntimeError(
                "vector.store=pinecone but pinecone.api.key / PINECONE_API_KEY is empty"
            )
        from pinecone import Pinecone, ServerlessSpec

        self.pc = Pinecone(api_key=config.pinecone_api_key)
        existing = {idx["name"] for idx in self.pc.list_indexes()}
        if config.pinecone_index_name not in existing:
            # dimension for all-MiniLM-L6-v2
            self.pc.create_index(
                name=config.pinecone_index_name,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud=config.pinecone_cloud,
                    region=config.pinecone_region,
                ),
            )
        self.index = self.pc.Index(config.pinecone_index_name)
        self.namespace = config.pinecone_namespace
        self._count = 0

    def upsert(self, chunks: list[DocumentChunk]) -> int:
        if not chunks:
            return 0
        vectors = embed_texts([c.text for c in chunks])
        payload = []
        for chunk, vector in zip(chunks, vectors, strict=False):
            payload.append(
                {
                    "id": chunk.id,
                    "values": vector.tolist(),
                    "metadata": {
                        "text": chunk.text[:3500],
                        "source": chunk.source,
                        "title": chunk.title,
                        "category": chunk.category,
                    },
                }
            )
        # batch upsert
        batch = 50
        for i in range(0, len(payload), batch):
            self.index.upsert(vectors=payload[i : i + batch], namespace=self.namespace)
        self._count = len(chunks)
        return len(chunks)

    def search(self, query: str, top_k: int) -> list[dict[str, Any]]:
        q = embed_query(query).tolist()
        res = self.index.query(
            vector=q,
            top_k=top_k,
            include_metadata=True,
            namespace=self.namespace,
        )
        results: list[dict[str, Any]] = []
        for match in res.get("matches", []):
            meta = match.get("metadata") or {}
            results.append(
                {
                    "id": match.get("id"),
                    "text": meta.get("text", ""),
                    "source": meta.get("source", ""),
                    "title": meta.get("title", ""),
                    "category": meta.get("category", ""),
                    "score": float(match.get("score") or 0),
                }
            )
        return results

    def count(self) -> int:
        stats = self.index.describe_index_stats()
        namespaces = stats.get("namespaces") or {}
        ns = namespaces.get(self.namespace) or {}
        return int(ns.get("vector_count") or self._count or 0)


def build_store() -> VectorStore:
    if config.vector_store == "pinecone":
        return PineconeStore()
    if config.vector_store != "faiss":
        raise RuntimeError(
            f"Unsupported vector.store={config.vector_store}. Use faiss or pinecone."
        )
    return FaissStore()
