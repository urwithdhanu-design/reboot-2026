# GCUL Insurance App

Mobile-first Lloyds-style (LBG green) onboarding + marketplace.

## Local development (recommended)

**Full guide:** [`services/LOCAL-DEV.md`](services/LOCAL-DEV.md)

### 1. Start all backend APIs

```cmd
cd C:\projects\gcul
scripts\start-local-apis.cmd
scripts\status-local-apis.cmd
```

### 2. Choose where the UI sends `/api/*`

| Target | Command / file |
|--------|----------------|
| **Cloud Run** on GCP (default) | `scripts\set-api-target.cmd cloud` or `.local-dev\api-target.env` → `VITE_API_TARGET=cloud` |
| **Local** Java on your PC | `scripts\set-api-target.cmd local` or `VITE_API_TARGET=local` |

Restart Vite after changing the flag.

### 3. Run the apps

```cmd
cd apps\web
npm run dev
```

- Customer: http://localhost:5173  
- Admin: `cd apps\admin` → `npm run dev` → http://localhost:5174  

Demo password after register: **`ChangeMe123!`**

Script reference: [`../scripts/README.md`](../scripts/README.md)

---

## Microservices

| Service | Port | Role |
|---------|------|------|
| `kyc-service` | 8081 | Register, login, KYC |
| `wallet-service` | 8089 | Digital wallet |
| `policy-service` | 8082 | Products, quotes, Stripe, vendors |
| `payment-service` | 8083 | Payment ledger |
| `notification-service` | 8084 | Notifications |
| `claims-service` | 8085 | Claims workflow |
| `parametric-claim-service` | 8086 | Parametric triggers |
| `premium-deposit-service` | 8087 | Premium deposits |
| `blockchain-orchestrator-service` | 8088 | Blockchain orchestration |
| `chatbot-assistance-service` | 8090 | RAG chatbot (optional) |
| `gcul-sidecar` | 8091 | GCUL SDK bridge (optional) |
| `apps/web` | 5173 | Customer React UI |
| `apps/admin` | 5174 | Admin console |

Details: [`services/README.md`](services/README.md)

### Manual start (single service)

```cmd
cd apps\services\kyc-service
mvnw.cmd spring-boot:run
```

## Legacy Python API

`apps/api` (FastAPI on 8080) remains available; the UI targets the Java microservices.
