"""ECDSA P-256 key helpers for GCUL account signing.

GCUL accepts public keys in ``KEY_FORMAT_PEM_EC_P256_SHA256`` (PEM-encoded
P-256) and requires DER-encoded ECDSA signatures over SHA-256 digests.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import Prehashed

from gcul.exceptions import SigningError


@dataclass(frozen=True)
class KeyPair:
    """An ECDSA P-256 key pair used to sign GCUL transactions."""

    private_key: ec.EllipticCurvePrivateKey

    @property
    def public_key(self) -> ec.EllipticCurvePublicKey:
        return self.private_key.public_key()

    def public_key_pem_bytes(self) -> bytes:
        """Return the SubjectPublicKeyInfo PEM bytes for ledger registration."""
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

    def private_key_pem_bytes(self, *, password: bytes | None = None) -> bytes:
        """Serialize the private key as PEM (optionally encrypted)."""
        encryption: serialization.KeySerializationEncryption
        if password is None:
            encryption = serialization.NoEncryption()
        else:
            encryption = serialization.BestAvailableEncryption(password)
        return self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption,
        )

    def sign(self, message: bytes) -> bytes:
        """Sign ``message`` with ECDSA-P256-SHA256 and return a DER signature."""
        try:
            digest = hashes.Hash(hashes.SHA256())
            digest.update(message)
            digest_bytes = digest.finalize()
            return self.private_key.sign(
                digest_bytes,
                ec.ECDSA(Prehashed(hashes.SHA256())),
            )
        except Exception as exc:  # noqa: BLE001 - wrap crypto failures
            raise SigningError(f"failed to sign message: {exc}") from exc


def generate_p256_keypair() -> KeyPair:
    """Generate a new ECDSA P-256 key pair."""
    return KeyPair(ec.generate_private_key(ec.SECP256R1()))


def load_private_key_pem(
    pem: bytes | str | Path,
    *,
    password: bytes | None = None,
) -> KeyPair:
    """Load a PEM-encoded PKCS#8 (or traditional) EC private key."""
    if isinstance(pem, Path):
        data = pem.read_bytes()
    elif isinstance(pem, str):
        # Treat bare PEM text as data; paths that exist are loaded from disk.
        path = Path(pem)
        data = path.read_bytes() if path.exists() and "BEGIN" not in pem else pem.encode()
    else:
        data = pem

    try:
        key = serialization.load_pem_private_key(data, password=password)
    except Exception as exc:  # noqa: BLE001
        raise SigningError(f"failed to load private key: {exc}") from exc

    if not isinstance(key, ec.EllipticCurvePrivateKey):
        raise SigningError("private key must be an elliptic-curve key")
    if not isinstance(key.curve, ec.SECP256R1):
        raise SigningError("private key must use the P-256 (secp256r1) curve")
    return KeyPair(key)
