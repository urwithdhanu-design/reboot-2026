# Blockchain Orchestrator Service

Java orchestration API for ledger transactions, **insurer-only policy mint**, and claim settlements.

**Design (payment → mint → token id, Alchemy, MetaMask, GCUL):** [`docs/BLOCKCHAIN-INSURER-MINT.md`](../../../docs/BLOCKCHAIN-INSURER-MINT.md)

## GCUL integration

Does **not** embed the Python SDK. Instead it calls the **gcul-sidecar**:

```
blockchain-orchestrator (:8088)
        │  HTTP
        ▼
gcul-sidecar (:8091)
        │  Python import
        ▼
packages/gcul-sdk
```

Config (`application.properties`):

```properties
gcul.sidecar.enabled=true
gcul.sidecar.url=http://127.0.0.1:8091
```

See `apps/services/gcul-sidecar/README.md` and `packages/gcul-sdk/README.md`.

## Ethereum (Alchemy + web3j)

Set in `application.properties` (insurer backend only):

```properties
gcul.ledger.backend=ethereum
gcul.ethereum.enabled=true
gcul.ethereum.rpc-url=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
gcul.ethereum.chain-id=11155111
gcul.ethereum.insurer-private-key=${INSURER_MINT_PRIVATE_KEY}
```

Mint + policy token link API is documented in `docs/BLOCKCHAIN-INSURER-MINT.md` (to be wired after Stripe webhook).

## Run

```powershell
.\mvnw.cmd spring-boot:run
```
