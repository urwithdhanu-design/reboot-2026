"""Unit tests for GCUL signing and transaction builders."""

from __future__ import annotations

import hashlib

from google.cloud.universalledger.v1 import (
    accounts_pb2,
    common_pb2,
    transactions_pb2,
    types_pb2,
)

from gcul.keys import generate_p256_keypair, load_private_key_pem
from gcul.signing import Signer, sign_client_transaction
from gcul.transactions import TransactionBuilder


def test_generate_and_roundtrip_pem() -> None:
    pair = generate_p256_keypair()
    pem = pair.private_key_pem_bytes()
    loaded = load_private_key_pem(pem)
    message = b"gcul-test-message"
    assert loaded.sign(message)  # DER signature is non-empty
    assert pair.public_key_pem_bytes().startswith(b"-----BEGIN PUBLIC KEY-----")


def test_sign_transfer_digest_is_sha256_of_signed_bytes() -> None:
    keys = generate_p256_keypair()
    signer = Signer(account_id="acct_sender", key_pair=keys)
    builder = TransactionBuilder("acct_sender", sequence_number=0)
    client_tx = builder.transfer(beneficiary_id="acct_recv", amount_minor_units=250)

    signed, serialized, digest = sign_client_transaction(client_tx, signer)

    assert digest == hashlib.sha256(serialized).hexdigest()
    assert signed.serialized_client_transaction == client_tx.SerializeToString()
    assert signed.sender_signature
    assert signed.sender_signing_key_slot == common_pb2.KEY_SLOT_PRIMARY

    # Re-parse and confirm transfer payload survives serialization.
    parsed = types_pb2.ClientTransaction()
    parsed.ParseFromString(signed.serialized_client_transaction)
    assert parsed.sender_id == "acct_sender"
    assert parsed.sequence_number == 0
    assert parsed.transfer_transaction.beneficiary_id == "acct_recv"
    assert parsed.transfer_transaction.amount.value == 250


def test_create_account_uses_pem_key_format() -> None:
    keys = generate_p256_keypair()
    builder = TransactionBuilder("acct_mgr", sequence_number=3)
    tx = builder.create_account(
        public_key=keys,
        roles=[accounts_pb2.ROLE_PAYER, accounts_pb2.ROLE_RECEIVER],
        token_manager_id="tm_1",
        account_comment="demo",
    )
    create = tx.create_account_transaction
    assert create.key_format == transactions_pb2.KEY_FORMAT_PEM_EC_P256_SHA256
    assert create.public_key.startswith(b"-----BEGIN PUBLIC KEY-----")
    assert list(create.roles) == [
        accounts_pb2.ROLE_PAYER,
        accounts_pb2.ROLE_RECEIVER,
    ]
    assert create.token_manager_id == "tm_1"


def test_endpoint_path_helpers() -> None:
    from gcul.paths import endpoint_path, location_path

    assert location_path("p", "us-central1") == "projects/p/locations/us-central1"
    assert (
        endpoint_path("p", "us-central1", "main")
        == "projects/p/locations/us-central1/endpoints/main"
    )
