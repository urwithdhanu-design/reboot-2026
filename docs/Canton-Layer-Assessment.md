# Canton Layer Assessment — Reboot 2026 Insurance Platform

**Document purpose:** Reference assessment of the current Canton/Daml integration, known problems, and recommended improvements.

**Date:** July 2026  
**Scope:** Local sandbox, blockchain-orchestrator, policy/claims integration, admin UI

---

## 1. Executive summary

The platform has a **working demo path**: Daml sandbox → blockchain-orchestrator → policy mint → claims verify, with **simulated fallback** when Canton is unavailable. This keeps demos running but creates **integrity gaps** where policies and claims can appear “Canton-verified” without a real on-ledger contract.

Production readiness (and alignment with LBG-style commercial banking on Canton) requires: honest mint/verify modes, correct Daml exercise paths, security on internal APIs, direct Canton health monitoring, and reconciliation between ledger state and application databases.

**Canton’s role in this platform:** programmable ownership, compliance gates, and atomic settlement infrastructure — **not** a replacement for insurer, SPV, regulated market, or legal contract.

---

## 2. Current architecture

### 2.1 Service map (local)

| Component | Port | Role |
|-----------|------|------|
| Canton JSON Ledger API | 7575 | Daml create/query (local Docker) |
| blockchain-orchestrator | 8088 | Mint, verify, settle, Canton status |
| policy-service | 8082 | Issues policies, calls mint API |
| claims-service | 8085 | Canton verify on claim intake/approve |
| parametric-claim-service | 8086 | Canton verify before auto-settle |
| gcul-sidecar | 8091 | GBP transfers (not on Canton) |
| Customer / Admin UI | 5174 / 5175 | Via Firebase rewrites to orchestrator |

**Cloud:** Java services use port 8080 internally; `gcul-canton` exposes JSON API on 8080 (not 7575). Orchestrator wired via `GCUL_CANTON_JSON_API_URL`.

### 2.2 Data flow

1. **Policy mint** — policy-service → `POST /api/blockchain/internal/policy-nft/mint`
2. **Ledger selection** — `LedgerAdapterRegistry.resolveMintAdapter()` uses Canton if reachable; else **simulated**
3. **Canton I/O** — `CantonJsonApiClient` → Daml JSON API (`/v1/parties`, `/v1/create`, `/v1/query`)
4. **Claims verify** — `GET /api/blockchain/internal/policy-nft/{policyId}/verify`
5. **Claim settlement** — Sidecar/wallet transfer + optional Canton `ClaimSettlement` create (best-effort)
6. **GBP money** — **Not on Canton**; wallet-service and sidecar handle real/demo GBP movement

### 2.3 Key code locations

| Area | Path |
|------|------|
| Daml templates | `canton/daml/daml/Gcul/InsurancePolicy.daml` |
| Canton Docker | `canton/docker/docker-compose.yml`, `scripts/local/start-canton.ps1` |
| JSON API client | `apps/services/blockchain-orchestrator-service/.../canton/CantonJsonApiClient.java` |
| Mint adapter registry | `apps/services/blockchain-orchestrator-service/.../ledger/LedgerAdapterRegistry.java` |
| Claims verify client | `apps/services/claims-service/.../BlockchainValidationClient.java` |
| Policy mint client | `apps/services/policy-service/.../BlockchainMintClient.java` |
| Admin Canton UI | `apps/admin/src/pages/TokenizationPage.tsx`, `SmartContractsPage.tsx` |
| Capital market docs (static) | `apps/admin/src/pages/InsuranceCapitalMarketPage.tsx`, `CantonCapitalBlueprintPage.tsx`, `CantonEnterpriseChallengesPage.tsx` |

---

## 3. What is real vs simulated

| Concern | Real Canton (demo) | Simulated / offline |
|---------|-------------------|---------------------|
| Policy mint | Daml sandbox + `/v1/create` on `InsurancePolicy` | `SimulatedLedgerAdapter` → fake token_id |
| Verify | Query ledger by `policyReferenceHash` | Returns `verified=false`; claims may bypass |
| Claim settlement on Canton | `ClaimSettlement` template (best-effort) | Skipped or `deferred` |
| GBP payouts | wallet-service / sidecar | Same |
| Insurance chain in admin | H2 PoA blocks in orchestrator (audit mirror) | Not Daml state |
| Network model | Single-node sandbox | Not Canton Network (no synchronizers/domains) |

---

## 4. Current problems

### 4.1 Integrity — “minted on Canton” can be misleading

**Silent simulated fallback**

When Canton is down, `LedgerAdapterRegistry` falls back to `SimulatedLedgerAdapter`. Policies still show `mintStatus=MINTED` with a synthetic `token_id`.

**Claims verify bypass**

In `BlockchainValidationClient.assertVerifiedOnCanton()`: if Canton verify fails but `mint_status=MINTED` and `token_id` exists, verification is **forced to pass** without ledger proof. Simulated mints can file claims while UI/evaluation trail may still imply Canton attestation.

**Verify adapter mismatch**

Verify uses `primaryAdapter()` (Canton only). Simulated mints fail orchestrator verify, then claims bypass via the rule above.

**Impact:** Customer claim evaluation can show “Canton policy verification — Passed” without a Daml contract.

### 4.2 Daml contract vs Java implementation mismatch

Daml defines insurer-controlled mint via **`InsurerMintAuthority.MintPolicy`**.

Java `mintPolicy()` calls **`POST /v1/create`** directly on `InsurancePolicy` and passes `mintedAt` as ISO **string**; Daml expects **`Time`**.

`findAuthorityContractId()` exists but is **not used** in the active mint path.

**Risk:** Works on permissive sandbox; may fail on stricter Canton Network deployments.

### 4.3 Configuration fragility

- Hardcoded Daml **package ID** in `application.properties` — changes on every Daml rebuild
- Local JSON API **7575** vs Cloud Run Canton **8080**
- **Double mint risk:** policy-service may publish `PolicyMintRequested` and call mint HTTP immediately (cloud Pub/Sub + direct call)

### 4.4 Security (not production-ready)

- Internal blockchain APIs lack service-to-service authentication
- Firebase rewrites expose `/api/blockchain/**` in cloud
- Canton sandbox: unsigned JWTs + `--allow-insecure-tokens`
- Cloud: `gcul-canton` may be deployed with `--allow-unauthenticated`
- On-ledger: `customerId`, `walletAddress`, `metadataUri` — privacy model undocumented

### 4.5 Settlement and reconciliation

- GBP payouts are off-Canton (by design); `ClaimSettlement` on Daml is best-effort (`deferred` on failure)
- Claim settlement may send `amountGbp` as string vs Daml `Decimal`
- Admin Blockchain Ledger page shows internal chain, not Daml contracts — ops confusion risk
- Policy DB (policy-service H2) vs orchestrator H2 vs Canton sandbox can drift after restarts

### 4.6 Observability and local dev

- Observability monitors orchestrator :8088, **not** Canton :7575
- No metrics for simulated fallback rate or mint failures
- Canton Docker sandbox is **ephemeral** — restart wipes ledger while DB still says MINTED
- `local-dev.cmd start` may boot APIs before Canton healthy → first mints simulate silently
- First Canton start slow (Daml compile in Docker)

### 4.7 Gap vs enterprise Canton (e.g. LBG commercial banking)

| LBG-style production | Current stack |
|----------------------|---------------|
| Tokenised deposit + DvP + off-chain reconciliation | Mint + verify; weak proof when simulated |
| Own validator node, bank controls | Single sandbox, insurer admin JWT |
| Legal/security wrapper explicit | Demo Daml + open internal APIs |
| Sub-transaction privacy | Full policy fields on template |
| Oracle-governed triggers | Parametric off-chain; cat triggers not on Daml |

Admin **capital market** pages describe target architecture; **runtime Canton layer** remains policy NFT demo + fallback.

---

## 5. Recommended improvements

### Phase A — Trust and honesty (high impact, ~1–2 weeks)

1. Expose `ledger_type` / `ledger_mode`: `canton` | `simulated` | `failed` on policy and claim APIs
2. UI: never show “Canton verified” when mode is simulated
3. Narrow or remove claims verify bypass — require `verified=true` for Canton-attested claims in strict mode
4. Config: `GCUL_CANTON_STRICT=true` — no simulated mint in production paths
5. Policy-service: check Canton status before mint; queue retry if offline

### Phase B — Correct Daml integration (~2–4 weeks)

6. Mint via **`InsurerMintAuthority.MintPolicy`** exercise, not raw `/v1/create`
7. Fix payload types (`Time`, `Decimal`) for JSON API
8. Auto-resolve package ID at startup or from build artifact
9. Single mint path — avoid Pub/Sub + HTTP race

### Phase C — Security and operations (parallel)

10. Internal API authentication (service token or mTLS)
11. Restrict Canton JSON API in cloud (not public unauthenticated)
12. Signed JWTs / participant credentials for non-sandbox
13. Monitor Canton health separately from orchestrator :8088

### Phase D — Insurance capital market alignment (roadmap)

14. Daml templates: `InsuranceLinkedNote`, `InvestorEligibility`, DvP settlement
15. Privacy: portfolio-level on-ledger data; no policy PII on shared templates
16. Reconciliation jobs: Canton contract IDs ↔ policy DB ↔ wallet balances
17. Oracle service for catastrophe triggers → `TriggerLoss` choice

### Quick wins

| Change | Effect |
|--------|--------|
| Expose `ledger_mode` on policy APIs | Truthful UI and evaluation trail |
| Fix `assertVerifiedOnCanton` for strict mode | Stops fake Canton attestation |
| Use `InsurerMintAuthority` in mint path | Matches Daml design |
| Canton tile on observability / admin dashboard | Ops sees sandbox down early |
| Tokenization banner: simulated vs Canton | Aligns with enterprise challenges page |

---

## 6. What Canton does not solve

- Legal validity of instruments
- SPV / regulatory product classification
- Actuarial correctness
- Market liquidity and investor demand
- Oracle data truth
- Regulatory permission for secondary trading

Canton is the **technology layer**. Legal, regulatory, actuarial, capital markets, and insurance expertise remain mandatory.

---

## 7. Related admin documentation pages

| Page | Route | Content |
|------|-------|---------|
| Insurance capital market | `/capital-market` | ILS reference, home/motor/health tabs |
| Canton blueprint | `/capital-market/blueprint` | Animated implementation guide |
| Canton enterprise challenges | `/capital-market/enterprise` | LBG context, adoption barriers, solve order |

---

## 8. Health check endpoints (local)

- Orchestrator: `GET http://127.0.0.1:8088/health` — `ledger.live`, `ledger.mode`, adapters
- Canton status: `GET http://127.0.0.1:8088/api/blockchain/canton/status`
- Canton direct: `GET http://127.0.0.1:7575/v1/parties` (with JWT)

---

## 9. Document control

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | Initial assessment from codebase review |

*This document is for internal reference. Regulatory and legal perimeter must be validated with UK counsel and relevant authorities for any production issuance.*
