from __future__ import annotations

from typing import Any

import httpx

from app.config import config
from app.ingest import load_knowledge
from app.vector_store import VectorStore, build_store


class RagPipeline:
    def __init__(self) -> None:
        self.store: VectorStore = build_store()

    def ingest(self) -> dict[str, Any]:
        chunks = load_knowledge(config.knowledge_dir)
        count = self.store.upsert(chunks)
        return {
            "ingested": count,
            "vector_store": config.vector_store,
            "sources": sorted({c.source for c in chunks}),
        }

    def ask(self, question: str) -> dict[str, Any]:
        hits = self.store.search(question, config.top_k)
        filtered = [h for h in hits if float(h.get("score") or 0) >= config.min_score]
        if not filtered and hits:
            filtered = hits[:2]
        answer = self._compose_answer(question, filtered)
        return {
            "answer": answer,
            "sources": [
                {
                    "title": h.get("title"),
                    "source": h.get("source"),
                    "category": h.get("category"),
                    "score": round(float(h.get("score") or 0), 4),
                }
                for h in filtered
            ],
            "vector_store": config.vector_store,
        }

    def _compose_answer(self, question: str, hits: list[dict[str, Any]]) -> str:
        if not hits:
            return (
                "I could not find matching insurance guidance yet. "
                "Try asking about products (home, car, pet), how to claim, "
                "or types of insurance. You can also open Claims or the Marketplace in the app."
            )
        context = "\n\n".join(str(h.get("text") or "") for h in hits)
        if config.openai_api_key:
            try:
                return self._openai_answer(question, context)
            except Exception:
                pass
        # Extractive fallback: lead with best chunk, keep concise
        best = str(hits[0].get("text") or "").strip()
        lines = [ln.strip() for ln in best.splitlines() if ln.strip()]
        body = " ".join(lines[1:] if lines and lines[0].startswith("#") else lines)
        if len(body) > 700:
            body = body[:700].rsplit(" ", 1)[0] + "…"
        title = hits[0].get("title") or "Insurance guidance"
        extra = ""
        if len(hits) > 1:
            extra = f" Related topics: {', '.join(str(h.get('title')) for h in hits[1:3])}."
        return f"{title}: {body}{extra}"

    def _openai_answer(self, question: str, context: str) -> str:
        prompt = (
            "You are the Lloyds Banking Group insurance assistant. "
            "Answer clearly using only the context. If unsure, say so.\n\n"
            f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
        )
        with httpx.Client(timeout=30) as client:
            res = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": config.openai_model,
                    "messages": [
                        {"role": "system", "content": "Helpful insurance support assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                },
            )
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()


pipeline = RagPipeline()
