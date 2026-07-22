# GCUL Microservices

**Local dev:** [`LOCAL-DEV.md`](LOCAL-DEV.md) · **Scripts:** [`../../scripts/README.md`](../../scripts/README.md)

**Start all Java APIs:** `scripts\start-local-apis.cmd` from repo root.

| Service | Port | Responsibility |
|---------|------|----------------|
| `kyc-service` | 8081 | Register, login, KYC |
| `wallet-service` | 8089 | Digital wallet (create / view address) |
| `policy-service` | 8082 | Products, quotes, Stripe checkout, vendors |
| `payment-service` | 8083 | Payment ledger & settlement records (`/api/payment-ledger`) |
| `notification-service` | 8084 | Email / in-app notifications (`/api/notifications`) |
| `claims-service` | 8085 | Claim intake & status workflow (`/api/claims`) |
| `parametric-claim-service` | 8086 | Parametric rules & auto-triggers (`/api/parametric`) |
| `premium-deposit-service` | 8087 | Premium deposits & release (`/api/premium-deposits`) |
| `blockchain-orchestrator-service` | 8088 | GCUL ledger orchestration (`/api/blockchain`) |
| `gcul-sidecar` | 8091 | Python bridge to `packages/gcul-sdk` |
| `chatbot-assistance-service` | 8090 | RAG chatbot FAISS/Pinecone (`/api/chatbot`) |
| `apps/web` | 5173 | Customer React UI |
| `apps/admin` | 5174 | Admin console |

Stripe card checkout remains on **policy-service** (`/api/payments`) for the demo; **payment-service** holds the platform payment ledger.

## Database

Each service uses **H2 (file)** by default under `./data/`.

## Run core pair

```powershell
cd C:\projects\gcul\apps\services\kyc-service
.\mvnw.cmd spring-boot:run

cd C:\projects\gcul\apps\services\policy-service
.\mvnw.cmd spring-boot:run
```

## Run new platform services

```powershell
cd C:\projects\gcul\apps\services\payment-service; .\mvnw.cmd spring-boot:run
cd C:\projects\gcul\apps\services\notification-service; .\mvnw.cmd spring-boot:run
cd C:\projects\gcul\apps\services\claims-service; .\mvnw.cmd spring-boot:run
cd C:\projects\gcul\apps\services\parametric-claim-service; .\mvnw.cmd spring-boot:run
cd C:\projects\gcul\apps\services\premium-deposit-service; .\mvnw.cmd spring-boot:run
cd C:\projects\gcul\apps\services\blockchain-orchestrator-service; .\mvnw.cmd spring-boot:run
```

### Chatbot assistance (Python RAG)

```powershell
cd C:\projects\gcul\apps\services\chatbot-assistance-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8090
```

Switch vector store in `application.properties`: `vector.store=faiss` or `vector.store=pinecone`.

### GCUL sidecar (Python → Universal Ledger SDK)

```powershell
cd C:\projects\gcul\apps\services\gcul-sidecar
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -e ..\..\..\packages\gcul-sdk
uvicorn app.main:app --host 127.0.0.1 --port 8091
```

`blockchain-orchestrator-service` calls this sidecar for transfers (`gcul.sidecar.url`).

Health checks: `http://localhost:8083/health` … `http://localhost:8088/health`, chatbot `:8090`, GCUL sidecar `:8091`

## Run UI

```powershell
cd C:\projects\gcul\apps\web
npm run dev
```

Open http://localhost:5173

Demo password after register: `ChangeMe123!`
