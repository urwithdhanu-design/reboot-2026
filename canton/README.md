# Canton Local Sandbox

GCUL uses a Canton local sandbox (Daml ledger) for on-chain policy minting in local development.

## Quick start

```powershell
# From repo root
local-dev.cmd canton          # build + start Docker sandbox
local-dev.cmd start           # starts Canton (if script wired) + APIs + UI
```

Or start everything in one step:

```powershell
local-dev.cmd start
```

## Endpoints

| Service | URL |
|---------|-----|
| JSON Ledger API | http://127.0.0.1:7575 |
| gRPC Ledger API | 127.0.0.1:6865 |

## Daml contracts

- `Gcul.InsurancePolicy:InsurerMintAuthority` — insurer-controlled mint authority (insurer signs)
- `Gcul.InsurancePolicy:InsurancePolicy` — on-ledger policy certificate

## Configuration (blockchain-orchestrator)

| Env var | Default |
|---------|---------|
| `GCUL_LEDGER_BACKEND` | `canton` |
| `GCUL_CANTON_ENABLED` | `true` |
| `GCUL_CANTON_JSON_API_URL` | `http://127.0.0.1:7575` |
| `GCUL_CANTON_INSURER_PARTY` | `GCUL_Insurer` |

When Canton is offline, the orchestrator falls back to simulated minting so the rest of the flow still works.

## E2E test flow

1. Register customer → complete KYC
2. Link wallet (0x address stored on Canton contract)
3. Get quote → pay premium (Stripe or wallet)
4. Policy issued → orchestrator exercises `MintPolicy` on Canton (insurer signs)
5. Customer UI shows minted contract ID; Admin Tokenization page shows Daml/Canton registry

## Commands

```powershell
local-dev.cmd canton status
local-dev.cmd canton stop
docker logs gcul-canton-sandbox
```
