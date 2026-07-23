# GCUL Insurance Chain

Insurance-specific **proof-of-authority** blockchain implemented in `blockchain-orchestrator-service`. It is not a public L1; it anchors policy, claims, identity, document hashes, workflows, and audit events for the GCUL platform.

## Capabilities

| Area | Implementation |
|------|----------------|
| Blocks & chain | `chain_blocks` — SHA-256 block hash, previous-hash link, Merkle root of tx hashes |
| Transactions | `chain_transactions` — typed payloads, per-tx hash + validator signature |
| Cryptography | SHA-256 (`ChainCrypto`), HMAC-SHA256 validator signatures (`ChainValidatorSigner`) |
| Consensus | Single validator PoA (configurable validator id + secret) |
| Ledgers | `POLICY`, `CLAIMS`, `IDENTITY`, `AUDIT`, `WORKFLOW` (`ChainLedger`) |
| Document verification | Optional `document_hash` or content hashed at ingest |
| Fraud scoring | Heuristic `ChainFraudScorer` on each transaction |
| P2P / mesh | Logical peer list (`gcul.chain.peers`) for network metadata |
| Smart workflows | `WORKFLOW_STEP`, `POLICY_ISSUED`, `CLAIM_*`, `SETTLEMENT`, etc. |

## HTTP API (orchestrator)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/blockchain/chain` | Linked-list view: network, validation, blocks + txs |
| GET | `/api/blockchain/chain/network` | Network metadata |
| GET | `/api/blockchain/chain/validate` | Chain integrity check |
| GET | `/api/blockchain/chain/capabilities` | Feature matrix |
| GET | `/api/blockchain/chain/transactions` | All chain transactions |
| POST | `/api/blockchain/chain/transactions` | Append a chain transaction (admin/tools) |

Legacy sidecar ledger APIs remain under `/api/blockchain/transactions` (orchestrator DB + GCUL sidecar).

## Configuration

```properties
gcul.chain.validator-id=${GCUL_CHAIN_VALIDATOR_ID:gcul-validator-primary}
gcul.chain.validator-secret=${GCUL_CHAIN_VALIDATOR_SECRET:...}
gcul.chain.peers=${GCUL_CHAIN_PEERS:gcul-policy,gcul-claims,...}
```

Set **`GCUL_CHAIN_VALIDATOR_SECRET`** in Cloud Run for production.

## Admin UI

**Blockchain Ledger** (`/blockchain`) loads `GET /api/blockchain/chain` and renders a horizontal **linked list** of blocks (genesis → tip) plus a transaction table.

## Event hooks

- **Policy mint** (`PolicyMintService`) — records `WORKFLOW_STEP` + `POLICY_ISSUED` on the policy ledger.
- **Orchestrator submit** (`BlockchainOrchestratorService`) — records claim/settlement transactions on the claims/workflow ledger.

Genesis and an initial audit transaction are created on startup via `InsuranceChainBootstrap`.

## Deploy

Redeploy `gcul-blockchain-orchestrator` after changes. Firebase Hosting rewrites `/api/blockchain/**` to this service (see `deploy/api-rewrites.json`).
