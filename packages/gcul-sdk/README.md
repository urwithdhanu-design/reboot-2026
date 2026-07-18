# Google Cloud Universal Ledger (GCUL) — Python SDK

Reusable Python client for [Google Cloud Universal Ledger](https://cloud.google.com/application/web3/universal-ledger).

This package lives at `packages/gcul-sdk` inside the monorepo. The insurance apps call it through **`apps/services/gcul-sidecar`**, which the Java **blockchain-orchestrator-service** uses over HTTP.

Built on the public API protos in [`google.cloud.universalledger.v1`](https://github.com/googleapis/googleapis/tree/master/google/cloud/universalledger/v1).

## Features

- gRPC client with Application Default Credentials / service account auth
- ECDSA P-256 (PEM) key generation and DER signatures (`KEY_FORMAT_PEM_EC_P256_SHA256`)
- Transaction builders: transfer, mint, burn, create account, create/invoke contract
- Submit + poll helpers (`wait_for_transaction`)
- Generated protobuf stubs vendored from googleapis

## Install

From the monorepo root:

```powershell
cd C:\projects\gcul\packages\gcul-sdk
pip install -e ".[dev]"
```

## Quick start

```python
from gcul import Signer, UniversalLedgerClient, load_private_key_pem

signer = Signer(
    account_id="YOUR_ACCOUNT_ID",
    key_pair=load_private_key_pem("sender.pem"),
)

with UniversalLedgerClient(
    project="YOUR_GCP_PROJECT",
    location="us-central1",
    endpoint="YOUR_ENDPOINT_ID",
) as client:
    account = client.query_account(signer.account_id)
    digest = client.transfer(
        signer=signer,
        sequence_number=account.sequence_number,
        beneficiary_id="BENEFICIARY_ACCOUNT_ID",
        amount_minor_units=100,
        wait=True,
    )
    print(digest)
```

Generate a key pair:

```powershell
python examples/generate_keys.py
```

## Package layout

| Path | Description |
|------|-------------|
| `src/gcul` | SDK source |
| `src/google` | Vendored protobuf stubs (if present) |
| `protos` | Proto sources |
| `examples` | Sample scripts |
| `tests` | Pytest suite |
| `scripts` | Codegen / tooling |

## Resource names

```text
projects/{project}/locations/{location}/endpoints/{endpoint}
```

Use `gcul.endpoint_path(...)` or pass the three parts into `UniversalLedgerClient`.
