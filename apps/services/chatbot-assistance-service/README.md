# GCUL Chatbot Assistance Service (Python)

RAG chatbot for insurance Q&A with a **pluggable vector store**.

## Switch FAISS ↔ Pinecone

Edit `application.properties`:

```properties
# Local (default)
vector.store=faiss

# Or Pinecone
vector.store=pinecone
pinecone.api.key=${PINECONE_API_KEY:}
pinecone.index.name=gcul-insurance-rag
```

## Knowledge ingested

- `knowledge/products.md` — marketplace products & quotes
- `knowledge/claims.md` — how to claim & statuses
- `knowledge/insurance_types.md` — types of insurance

## Run

```powershell
cd C:\projects\gcul\apps\services\chatbot-assistance-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8090
```

- Health: http://127.0.0.1:8090/health
- Ask: `POST /api/chatbot/ask` `{"message":"How do I make a claim?"}`
- Re-ingest: `POST /api/chatbot/ingest`

Optional: set `OPENAI_API_KEY` for LLM-polished answers (otherwise extractive RAG).
