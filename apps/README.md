# GCUL Insurance App

Mobile-first Lloyds-style (LBG green) onboarding + marketplace.

## Microservices (primary)

| Service | Port | Role |
|---------|------|------|
| `apps/services/kyc-service` | 8081 | Register, login, KYC, digital wallet |
| `apps/services/policy-service` | 8082 | Products, quotes, Stripe checkout, vendors |
| `apps/services/payment-service` | 8083 | Payment ledger |
| `apps/services/notification-service` | 8084 | Notifications |
| `apps/services/claims-service` | 8085 | Claims workflow |
| `apps/services/parametric-claim-service` | 8086 | Parametric triggers |
| `apps/services/premium-deposit-service` | 8087 | Premium deposits |
| `apps/services/blockchain-orchestrator-service` | 8088 | Blockchain orchestration |
| `apps/services/chatbot-assistance-service` | 8090 | RAG chatbot (FAISS/Pinecone) |
| `apps/services/gcul-sidecar` | 8091 | Python bridge to GCUL SDK |
| `packages/gcul-sdk` | — | Universal Ledger Python SDK |
| `apps/web` | 5173 | Customer React UI |
| `apps/admin` | 5174 | Admin console |

Details: [`apps/services/README.md`](services/README.md)

### Quick start

```powershell
# Terminal 1 — KYC
cd C:\projects\gcul\apps\services\kyc-service
.\mvnw.cmd spring-boot:run

# Terminal 2 — Policy
cd C:\projects\gcul\apps\services\policy-service
.\mvnw.cmd spring-boot:run

# Optional — Claims (and other platform services)
cd C:\projects\gcul\apps\services\claims-service
.\mvnw.cmd spring-boot:run

# Terminal 3 — UI
cd C:\projects\gcul\apps\web
npm run dev
```

Open http://localhost:5173

Vite proxies auth/KYC/wallet → `:8081`, products/quotes/Stripe → `:8082`, and the new platform APIs → `:8083`–`:8088`.

Demo password after register: `ChangeMe123!`

## Legacy Python API

`apps/api` (FastAPI on 8080) remains available; the UI now targets the Java microservices.
