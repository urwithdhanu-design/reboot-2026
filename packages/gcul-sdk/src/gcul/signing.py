"""Transaction signing helpers for GCUL."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from google.cloud.universalledger.v1 import common_pb2, types_pb2

from gcul.keys import KeyPair


@dataclass(frozen=True)
class Signer:
    """Signs client transactions for a ledger account."""

    account_id: str
    key_pair: KeyPair
    key_slot: common_pb2.KeySlot = common_pb2.KEY_SLOT_PRIMARY

    def sign_bytes(self, payload: bytes) -> bytes:
        return self.key_pair.sign(payload)


def sha256_hex(data: bytes) -> str:
    """Return the lowercase hex SHA-256 digest of ``data``."""
    return hashlib.sha256(data).hexdigest()


def sign_client_transaction(
    client_tx: types_pb2.ClientTransaction,
    signer: Signer,
    *,
    other_signers: list[Signer] | None = None,
) -> tuple[types_pb2.SignedTransaction, bytes, str]:
    """Serialize, sign, and wrap a ``ClientTransaction``.

    Returns ``(signed_tx, serialized_signed_tx, transaction_digest_hex)``.
    The digest matches what ``SubmitTransaction`` returns: SHA-256 of the
    serialized ``SignedTransaction`` bytes.
    """
    serialized_client = client_tx.SerializeToString()
    sender_signature = signer.sign_bytes(serialized_client)

    signed = types_pb2.SignedTransaction(
        serialized_client_transaction=serialized_client,
        sender_signature=sender_signature,
        sender_signing_key_slot=signer.key_slot,
    )

    if other_signers:
        for other in other_signers:
            signed.other_signatures.append(other.sign_bytes(serialized_client))
            signed.other_signing_key_slots.append(other.key_slot)

    serialized_signed = signed.SerializeToString()
    digest_hex = sha256_hex(serialized_signed)
    return signed, serialized_signed, digest_hex
