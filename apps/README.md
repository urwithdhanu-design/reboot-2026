# GCUL Insurance App

Mobile-first Lloyds-style (LBG green) onboarding + marketplace.

## Local development (recommended)

```cmd
cd C:\projects\gcul
local-dev.cmd setup
local-dev.cmd start
```

| App | URL |
|-----|-----|
| Customer | http://localhost:5174 |
| Admin | http://localhost:5175 |

**Cloud demo** (UI only, APIs on GCP): `local-dev.cmd cloud`

Full guide: [`../scripts/local/README.md`](../scripts/local/README.md) · Scripts index: [`../scripts/README.md`](../scripts/README.md)

Demo password after register: **`ChangeMe123!`**

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
| `apps/web` | 5174 | Customer React UI |
| `apps/admin` | 5175 | Admin console |

Details: [`services/README.md`](services/README.md)

### Manual start (single service)

```cmd
cd apps\services\kyc-service
mvnw.cmd spring-boot:run
```

## Legacy Python API

`apps/api` (FastAPI on 8080) remains available; the UI targets the Java microservices.
