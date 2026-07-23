# Insurer-only flow: payment → policy mint → token link

This describes how **consumer payment**, **policy NFT/token mint**, and **policy ↔ token id** fit the GCUL monorepo, using **Ethereum (Alchemy + web3j)** and/or **Google Cloud Universal Ledger (GCUL)**.

## Business rule

**Only the insurer platform may mint** and bind a token to a policy. The customer:

- Pays (Stripe checkout).
- Connects **MetaMask** (wallet address on file).
- Never calls mint directly.

```text
Customer                    Insurer (GCP / Spring Boot)              Chain
────────                    ───────────────────────────              ─────
Stripe checkout  ──►  policy-service (payment confirmed)
                           │
                           │  internal event / admin approval
                           ▼
                      policy-service OR blockchain-orchestrator
                           │  insurer credentials only
                           ▼
                      Mint ERC-721 (or GCUL mint) 
                           │
                           ▼
                      DB: policyId ↔ tokenId ↔ txHash ↔ walletAddress
```

| Step | Service today | Target |
|------|----------------|--------|
| Consumer payment | `policy-service` — `/api/payments/checkout`, session status | Stripe **webhook** → mark quote/policy **PAID** |
| Policy mint | `blockchain-orchestrator` + demo `gcul-sidecar` | **Insurer-only** mint API (not exposed to customer JWT) |
| Token link | Not persisted yet | Table in `blockchain-orchestrator` or `policy-service`: `policy_id`, `token_id`, `tx_hash`, `chain_id`, `wallet_address` |
| Customer wallet | `wallet-service` — demo address | **MetaMask** connect + signed message → store `0x…` address |

---

## Path A — Ethereum testnet (Alchemy + MetaMask + web3j)

### 1. Alchemy (RPC URL)

1. Register at [alchemy.com](https://www.alchemy.com/).
2. Create an app → network **Ethereum Sepolia** (testnet).
3. Copy HTTPS URL: `https://eth-sepolia.g.alchemy.com/v2/<API_KEY>`.

Store the API key in **Secret Manager** (Cloud Run) or local env — never commit it.

### 2. MetaMask (customer)

- Wallets are created **in the browser** (MetaMask extension), not on the server.
- `apps/web`: use `window.ethereum` (e.g. ethers/viem/wagmi) → **Connect wallet**.
- `wallet-service`: add `POST /api/wallet/link` with address + **SIWE** or personal_sign proof (replace demo `POST /api/wallet/create` for production).

### 3. web3j (Spring Boot — insurer mint)

Implemented in **`blockchain-orchestrator-service`** (config only until contract is wired):

| Property | Purpose |
|----------|---------|
| `gcul.ethereum.enabled` | `true` to create `Web3j` bean |
| `gcul.ethereum.rpc-url` | Alchemy HTTPS URL |
| `gcul.ethereum.chain-id` | `11155111` (Sepolia) |
| `gcul.ethereum.insurer-private-key` | Hot wallet for mint txs (Secret Manager) |

```properties
# apps/services/blockchain-orchestrator-service — see application.properties
gcul.ethereum.enabled=false
gcul.ethereum.rpc-url=${ALCHEMY_RPC_URL:}
gcul.ethereum.chain-id=11155111
gcul.ethereum.insurer-private-key=${INSURER_MINT_PRIVATE_KEY:}
```

Insurer flow (to implement):

1. After payment webhook, `policy-service` calls orchestrator **internal** endpoint (mTLS / service account / admin role).
2. Orchestrator uses web3j + insurer key → `mint(to, tokenURI)` on your ERC-721 contract.
3. Persist `tokenId` + `transactionHash` linked to `policyId` and customer `walletAddress`.

Dependencies: `org.web3j:core` in `blockchain-orchestrator-service/pom.xml`.

---

## Path B — GCP Universal Ledger (not Ethereum / not MetaMask)

Google’s **Universal Ledger** is a separate product from public Ethereum.

1. Enable Universal Ledger in a GCP project → you receive **project**, **location**, **endpoint id** (a GCP API endpoint, not an Alchemy URL).
2. Run **`gcul-sidecar`** with `GCUL_MODE=live`, `GCUL_PROJECT`, `GCUL_ENDPOINT`.
3. **`blockchain-orchestrator`** → HTTP → sidecar → `packages/gcul-sdk` (gRPC).

See [`packages/gcul-sdk/README.md`](../packages/gcul-sdk/README.md) and [`apps/services/gcul-sidecar/README.md`](../apps/services/gcul-sidecar/README.md).

Use this path if the insurer ledger is **GCUL**, not public ERC-721. You can support **both** behind `gcul.ledger.backend=ethereum|gcul` later.

---

## Insurer-only enforcement

| Layer | Mechanism |
|-------|-----------|
| API | Mint routes under `/api/blockchain/internal/*` or `/api/admin/*` — **no** customer Bearer token |
| Auth | Cloud Run IAM between services, or admin JWT / API key for insurer ops |
| Keys | Mint signing key only on server (Alchemy key + insurer private key in Secret Manager) |
| Customer | May only `GET /api/wallet`, `POST /api/wallet/link`, pay via Stripe |

---

## Suggested implementation order

1. Stripe webhook on `policy-service` → policy/quote status **PAID**.
2. MetaMask connect in `apps/web` + `wallet-service` link endpoint.
3. Deploy ERC-721 on Sepolia; configure Alchemy + web3j in orchestrator; internal mint + DB link.
4. (Optional) GCUL live sidecar for Google ledger mint in parallel.

---

## Related docs

- [`apps/services/blockchain-orchestrator-service/README.md`](../apps/services/blockchain-orchestrator-service/README.md)
- [`apps/services/wallet-service`](../apps/services/wallet-service)
- [`deploy/GCP-PROJECTS.md`](../deploy/GCP-PROJECTS.md)
