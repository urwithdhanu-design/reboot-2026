# Blockchain Orchestrator Service

Java orchestration API for ledger transactions, **insurer-only policy mint**, and claim settlements.

**Design (payment → mint → policy certificate):** [`docs/MINT-DEPOSITS-CLAIMS.md`](../../../docs/MINT-DEPOSITS-CLAIMS.md)

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

## Canton

The service mints policy certificates through the configured Canton JSON API.


## Run

```powershell
.\mvnw.cmd spring-boot:run
```
