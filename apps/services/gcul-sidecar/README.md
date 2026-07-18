# GCUL Sidecar — thin Python HTTP bridge to the Universal Ledger SDK

Runs beside `blockchain-orchestrator-service` (Java). The orchestrator calls this
sidecar over HTTP; the sidecar uses `packages/gcul-sdk`.

## Modes

| `gcul.mode` | Behaviour |
|-------------|-----------|
| `demo` (default) | Simulated digests — no GCP credentials needed |
| `live` | Uses `UniversalLedgerClient` from the SDK |

## Run

```powershell
cd C:\projects\gcul\apps\services\gcul-sidecar
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -e ..\..\..\packages\gcul-sdk
uvicorn app.main:app --host 127.0.0.1 --port 8091
```

Health: http://127.0.0.1:8091/health
