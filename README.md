# Google Cloud Universal Ledger (GCUL) monorepo

Insurance platform (`apps/`) plus the reusable Universal Ledger Python SDK (`packages/gcul-sdk`).

## Layout

| Path | Description |
|------|-------------|
| `packages/gcul-sdk` | Python GCUL SDK (client, signing, protos, examples, tests) |
| `apps/web` | Customer React app |
| `apps/admin` | Admin console |
| `apps/services/*` | Java microservices + Python sidecars |
| `apps/services/gcul-sidecar` | Thin HTTP bridge from Java orchestrator → GCUL SDK |
| `apps/services/blockchain-orchestrator-service` | Ledger orchestration API (calls sidecar) |
| `apps/api` | Legacy FastAPI API (optional; install SDK from `packages/gcul-sdk`) |

**Canton policy minting:** [`docs/MINT-DEPOSITS-CLAIMS.md`](docs/MINT-DEPOSITS-CLAIMS.md)

**Minting, deposits & claim processing:** [`docs/MINT-DEPOSITS-CLAIMS.md`](docs/MINT-DEPOSITS-CLAIMS.md)

**Domain events (Pub/Sub):** [`docs/EVENT-CATALOG.md`](docs/EVENT-CATALOG.md)

## Install the SDK

```powershell
cd C:\projects\gcul\packages\gcul-sdk
pip install -e ".[dev]"
```

See [`packages/gcul-sdk/README.md`](packages/gcul-sdk/README.md).

## Run insurance apps

**Hosted apps (URLs + login):** [`docs/HOSTING-ACCESS.md`](docs/HOSTING-ACCESS.md)

**Local dev:** run `local-dev.cmd setup` then `local-dev.cmd start` from repo root.  
**New machine setup (step-by-step):** [`docs/LOCAL-SETUP.md`](docs/LOCAL-SETUP.md)  
**Deploy to Cloud Run (Windows + Mac):** [`docs/CLOUD-RUN-DEPLOY.md`](docs/CLOUD-RUN-DEPLOY.md)  
**Full Windows guide:** [`scripts/local/README.md`](scripts/local/README.md) · Short reference: [`apps/services/LOCAL-DEV.md`](apps/services/LOCAL-DEV.md)

```cmd
cd C:\projects\gcul
local-dev.cmd setup
local-dev.cmd start
```

See also [`apps/README.md`](apps/README.md) and [`scripts/README.md`](scripts/README.md).

### GCUL wire-up (orchestrator + sidecar)

```powershell
# Terminal A — Python sidecar (uses packages/gcul-sdk)
cd C:\projects\gcul\apps\services\gcul-sidecar
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -e ..\..\..\packages\gcul-sdk
uvicorn app.main:app --host 127.0.0.1 --port 8091

# Terminal B — Java orchestrator
cd C:\projects\gcul\apps\services\blockchain-orchestrator-service
.\mvnw.cmd spring-boot:run
```

Default sidecar mode is `demo` (no GCP credentials). Set `gcul.mode=live` plus project/endpoint for real GCUL.
