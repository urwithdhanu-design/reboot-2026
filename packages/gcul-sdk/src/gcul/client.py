"""gRPC client for Google Cloud Universal Ledger."""

from __future__ import annotations

import time
from collections.abc import Sequence
from typing import Any

import grpc
from google.auth.transport.grpc import secure_authorized_channel
from google.auth.transport.requests import Request
from google.cloud.universalledger.v1 import (
    query_pb2,
    types_pb2,
    universalledger_pb2,
    universalledger_pb2_grpc,
)
from google.oauth2 import service_account

from gcul.exceptions import AuthenticationError, TransactionError, TransactionTimeoutError
from gcul.paths import endpoint_path
from gcul.signing import Signer, sign_client_transaction
from gcul.transactions import TransactionBuilder

DEFAULT_HOST = "universalledger.googleapis.com"
DEFAULT_SCOPES = ("https://www.googleapis.com/auth/cloud-platform",)


class UniversalLedgerClient:
    """High-level client for submitting and querying GCUL transactions.

    Example::

        client = UniversalLedgerClient(
            project="my-project",
            location="us-central1",
            endpoint="main",
        )
        account = client.query_account("acct_123")
        digest = client.transfer(
            signer=signer,
            sequence_number=account.sequence_number,
            beneficiary_id="acct_456",
            amount_minor_units=100,
        )
    """

    def __init__(
        self,
        *,
        project: str,
        location: str,
        endpoint: str,
        credentials: Any | None = None,
        service_account_file: str | None = None,
        host: str = DEFAULT_HOST,
        channel: grpc.Channel | None = None,
    ):
        self.project = project
        self.location = location
        self.endpoint_id = endpoint
        self.endpoint = endpoint_path(project, location, endpoint)
        self.host = host

        if channel is not None:
            self._channel = channel
            self._owns_channel = False
        else:
            creds = credentials
            if creds is None and service_account_file is not None:
                creds = service_account.Credentials.from_service_account_file(
                    service_account_file, scopes=DEFAULT_SCOPES
                )
            if creds is None:
                try:
                    import google.auth

                    creds, _ = google.auth.default(scopes=DEFAULT_SCOPES)
                except Exception as exc:  # noqa: BLE001
                    raise AuthenticationError(
                        "could not load Google Cloud credentials; "
                        "pass credentials= or service_account_file=, "
                        "or run `gcloud auth application-default login`"
                    ) from exc

            # Refresh once so the channel starts with a valid token.
            if hasattr(creds, "refresh"):
                creds.refresh(Request())

            self._channel = secure_authorized_channel(
                creds, Request(), host
            )
            self._owns_channel = True

        self._stub = universalledger_pb2_grpc.UniversalLedgerStub(self._channel)

    def close(self) -> None:
        if self._owns_channel:
            self._channel.close()

    def __enter__(self) -> UniversalLedgerClient:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    # --- Endpoint discovery -------------------------------------------------

    def list_endpoints(
        self, *, page_size: int | None = None, page_token: str | None = None
    ) -> universalledger_pb2.ListEndpointsResponse:
        request = universalledger_pb2.ListEndpointsRequest(
            parent=f"projects/{self.project}/locations/{self.location}"
        )
        if page_size is not None:
            request.page_size = page_size
        if page_token:
            request.page_token = page_token
        return self._stub.ListEndpoints(request)

    def get_endpoint(
        self, name: str | None = None
    ) -> universalledger_pb2.Endpoint:
        return self._stub.GetEndpoint(
            universalledger_pb2.GetEndpointRequest(name=name or self.endpoint)
        )

    # --- Queries ------------------------------------------------------------

    def query_account(
        self,
        account_id: str,
        *,
        round_id: int | None = None,
    ) -> query_pb2.Account:
        request = universalledger_pb2.QueryAccountRequest(
            endpoint=self.endpoint,
            account_id=account_id,
        )
        if round_id is not None:
            request.round_id = round_id
        response = self._stub.QueryAccount(request)
        return response.account

    def query_transaction_state(
        self, transaction_digest_hex: str
    ) -> Sequence[types_pb2.TransactionAttempt]:
        response = self._stub.QueryTransactionState(
            universalledger_pb2.QueryTransactionStateRequest(
                endpoint=self.endpoint,
                transaction_digest_hex=transaction_digest_hex,
            )
        )
        return list(response.transaction_attempts)

    # --- Submit -------------------------------------------------------------

    def submit_signed_bytes(self, serialized_signed_transaction: bytes) -> str:
        """Submit a pre-serialized ``SignedTransaction`` and return its digest."""
        response = self._stub.SubmitTransaction(
            universalledger_pb2.SubmitTransactionRequest(
                endpoint=self.endpoint,
                serialized_signed_transaction=serialized_signed_transaction,
            )
        )
        return response.transaction_digest_hex

    def submit_client_transaction(
        self,
        client_tx: types_pb2.ClientTransaction,
        signer: Signer,
        *,
        other_signers: list[Signer] | None = None,
    ) -> str:
        """Sign and submit a ``ClientTransaction``; return digest hex."""
        _, serialized, digest = sign_client_transaction(
            client_tx, signer, other_signers=other_signers
        )
        submitted = self.submit_signed_bytes(serialized)
        return submitted or digest

    def submit_operational_signed_bytes(
        self, serialized_signed_operational_transaction: bytes
    ) -> str:
        response = self._stub.SubmitOperationalTransaction(
            universalledger_pb2.SubmitOperationalTransactionRequest(
                endpoint=self.endpoint,
                serialized_signed_operational_transaction=(
                    serialized_signed_operational_transaction
                ),
            )
        )
        return response.transaction_digest_hex

    # --- Convenience builders -----------------------------------------------

    def transfer(
        self,
        *,
        signer: Signer,
        sequence_number: int,
        beneficiary_id: str,
        amount_minor_units: int,
        wait: bool = False,
        timeout_s: float = 60.0,
    ) -> str:
        builder = TransactionBuilder(signer.account_id, sequence_number)
        tx = builder.transfer(
            beneficiary_id=beneficiary_id,
            amount_minor_units=amount_minor_units,
        )
        digest = self.submit_client_transaction(tx, signer)
        if wait:
            self.wait_for_transaction(digest, timeout_s=timeout_s)
        return digest

    def mint(
        self,
        *,
        signer: Signer,
        sequence_number: int,
        beneficiary_id: str,
        amount_minor_units: int,
        wait: bool = False,
        timeout_s: float = 60.0,
    ) -> str:
        builder = TransactionBuilder(signer.account_id, sequence_number)
        tx = builder.mint(
            beneficiary_id=beneficiary_id,
            amount_minor_units=amount_minor_units,
        )
        digest = self.submit_client_transaction(tx, signer)
        if wait:
            self.wait_for_transaction(digest, timeout_s=timeout_s)
        return digest

    def create_account(
        self,
        *,
        signer: Signer,
        sequence_number: int,
        public_key_pem: bytes,
        roles: list[int] | None = None,
        token_manager_id: str | None = None,
        account_comment: str | None = None,
        wait: bool = False,
        timeout_s: float = 60.0,
    ) -> str:
        builder = TransactionBuilder(signer.account_id, sequence_number)
        tx = builder.create_account(
            public_key=public_key_pem,
            roles=roles,
            token_manager_id=token_manager_id,
            account_comment=account_comment,
        )
        digest = self.submit_client_transaction(tx, signer)
        if wait:
            self.wait_for_transaction(digest, timeout_s=timeout_s)
        return digest

    def wait_for_transaction(
        self,
        transaction_digest_hex: str,
        *,
        timeout_s: float = 60.0,
        poll_interval_s: float = 1.0,
        require_finalized: bool = True,
    ) -> types_pb2.TransactionAttempt:
        """Poll until a transaction attempt is present (and optionally finalized)."""
        deadline = time.monotonic() + timeout_s

        while time.monotonic() < deadline:
            attempts = self.query_transaction_state(transaction_digest_hex)
            if attempts:
                last = attempts[-1]
                if (
                    last.status
                    == types_pb2.TransactionAttempt.TRANSACTION_STATUS_UNSPECIFIED
                ):
                    time.sleep(poll_interval_s)
                    continue

                if last.status == types_pb2.TransactionAttempt.PENDING:
                    if not require_finalized:
                        return last
                    time.sleep(poll_interval_s)
                    continue

                if last.status == types_pb2.TransactionAttempt.FINALIZED:
                    proof = last.proof_of_inclusion
                    effects = proof.transaction_certificate.transaction_effects
                    status = effects.status
                    if status.code != 0:
                        message = status.message.decode(
                            "utf-8", errors="replace"
                        )
                        raise TransactionError(
                            message
                            or f"transaction failed with code {status.code}",
                            code=status.code,
                            digest=transaction_digest_hex,
                        )
                    return last

            time.sleep(poll_interval_s)

        raise TransactionTimeoutError(
            f"timed out waiting for transaction {transaction_digest_hex}"
        )
