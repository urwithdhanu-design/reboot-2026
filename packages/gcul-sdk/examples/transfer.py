"""Example: query an account and submit a signed transfer.

Prerequisites:
  - GCP project with Universal Ledger access
  - Application Default Credentials or a service account JSON
  - Env vars below set to your values

Usage:
  set GCUL_PROJECT=my-project
  set GCUL_LOCATION=us-central1
  set GCUL_ENDPOINT=main
  set GCUL_SENDER_ID=acct_...
  set GCUL_SENDER_KEY=./sender.pem
  set GCUL_BENEFICIARY_ID=acct_...
  python examples/transfer.py
"""

from __future__ import annotations

import os
import sys

from gcul import Signer, UniversalLedgerClient, load_private_key_pem


def main() -> int:
    project = os.environ["GCUL_PROJECT"]
    location = os.environ.get("GCUL_LOCATION", "us-central1")
    endpoint = os.environ["GCUL_ENDPOINT"]
    sender_id = os.environ["GCUL_SENDER_ID"]
    beneficiary_id = os.environ["GCUL_BENEFICIARY_ID"]
    key_path = os.environ["GCUL_SENDER_KEY"]
    amount = int(os.environ.get("GCUL_AMOUNT", "1"))

    signer = Signer(
        account_id=sender_id,
        key_pair=load_private_key_pem(key_path),
    )

    with UniversalLedgerClient(
        project=project,
        location=location,
        endpoint=endpoint,
        service_account_file=os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
    ) as client:
        print(f"endpoint: {client.endpoint}")
        account = client.query_account(sender_id)
        print(f"sequence_number: {account.sequence_number}")
        if account.HasField("user_details"):
            print(f"balance (minor units): {account.user_details.balance.value}")

        digest = client.transfer(
            signer=signer,
            sequence_number=account.sequence_number,
            beneficiary_id=beneficiary_id,
            amount_minor_units=amount,
            wait=True,
        )
        print(f"submitted transfer digest: {digest}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyError as exc:
        print(f"missing required env var: {exc}", file=sys.stderr)
        raise SystemExit(2) from exc
