from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass
class DocumentChunk:
    id: str
    text: str
    source: str
    title: str
    category: str


def _split_markdown(text: str, source: str) -> list[DocumentChunk]:
    parts = re.split(r"\n(?=## )", text.strip())
    chunks: list[DocumentChunk] = []
    doc_title = source.replace(".md", "").replace("_", " ").title()
    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
        first_line = part.splitlines()[0].lstrip("# ").strip()
        title = first_line if part.startswith("#") else doc_title
        category = "general"
        lower = source.lower()
        if "product" in lower:
            category = "products"
        elif "claim" in lower:
            category = "claims"
        elif "type" in lower:
            category = "insurance_types"
        chunk_id = f"{source}::{i}"
        chunks.append(
            DocumentChunk(
                id=chunk_id,
                text=part,
                source=source,
                title=title,
                category=category,
            )
        )
    return chunks


def load_knowledge(knowledge_dir: Path) -> list[DocumentChunk]:
    if not knowledge_dir.exists():
        return []
    chunks: list[DocumentChunk] = []
    for path in sorted(knowledge_dir.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        chunks.extend(_split_markdown(text, path.name))
    return chunks
