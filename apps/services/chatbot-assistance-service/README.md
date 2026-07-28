# Stallion — GCUL Chatbot Assistance Service

**Stallion, your assistant** — RAG chatbot for insurance Q&A with **FAISS** in-memory vector search for guests, and live **policy / claims** data when the user is logged in.

## Features

| Audience | Capability |
|----------|------------|
| **Guests** | Generic answers from markdown knowledge (products, claims process, business rules) via FAISS |
| **Logged in** | `Give me my policy details` — policies grouped by this year / last year |
| **Logged in** | `Show me claims settled on the policy` — pick a policy card, settled claims by year |
| **Guests (personal)** | Clear prompt to log in or register |

## Knowledge ingested (FAISS)

- `knowledge/products.md` — marketplace products & quotes
- `knowledge/claims.md` — how to claim & statuses
- `knowledge/insurance_types.md` — types of insurance
- `knowledge/enterprise_guide.md` — business rules & category guidance

## Configuration

`application.properties`:

```properties
vector.store=faiss
policy.service.url=${POLICY_SERVICE_URL:http://127.0.0.1:8082}
claims.service.url=${CLAIMS_SERVICE_URL:http://127.0.0.1:8085}
chatbot.auto.ingest=true
```

Optional: `OPENAI_API_KEY` for LLM-polished generic answers (otherwise extractive RAG).

## Run locally

**Recommended** (from repo root, with Java APIs on 8081–8089):

```powershell
local-dev.cmd apis          # starts Stallion on :8090 automatically
# or full stack:
local-dev.cmd start
```

Manual:

```powershell
cd C:\projects\gcul\apps\services\chatbot-assistance-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8090
```

First run may download the embedding model (`sentence-transformers/all-MiniLM-L6-v2`) and build the FAISS index — allow 1–2 minutes. If ingest fails, `/health` returns `degraded` but `/api/chatbot/ask` still works for logged-in policy/claims queries.

Requires **policy-service** (`8082`) and **claims-service** (`8085`) for logged-in queries.

### API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health + FAISS doc count |
| `POST /api/chatbot/ingest` | Re-index knowledge into FAISS |
| `POST /api/chatbot/ask` | Ask Stallion (`Authorization: Bearer <jwt>` optional) |
| `GET /api/chatbot/config` | Config summary |

**Ask body:**

```json
{
  "message": "Give me my policy details",
  "session_id": "optional-session",
  "policy_id": "optional-when-selecting-policy-card"
}
```

## Cloud Run

Deployed as **`gcul-chatbot`**. Firebase Hosting rewrites `/api/chatbot` → Cloud Run.

```powershell
$env:GCP_PROJECT = "insure360-83a36"
.\deploy\deploy-cloud-run.ps1 -ServiceIds gcul-chatbot
```

Post-deploy, `deploy-cloud-run.ps1` sets `POLICY_SERVICE_URL`, `CLAIMS_SERVICE_URL`, and `CHATBOT_AUTO_INGEST=true`.

If the index is empty after deploy:

```powershell
curl -X POST "https://gcul-chatbot-XXXX.us-central1.run.app/api/chatbot/ingest"
```

## Frontend

Customer app (`apps/web`) proxies `/api/chatbot` to this service (local `:8090` or Cloud Run via Firebase).
