"""Example: generate a P-256 key pair for a new GCUL account."""

from __future__ import annotations

from pathlib import Path

from gcul import generate_p256_keypair


def main() -> None:
    out = Path("keys")
    out.mkdir(exist_ok=True)
    pair = generate_p256_keypair()
    (out / "account.pem").write_bytes(pair.private_key_pem_bytes())
    (out / "account.pub.pem").write_bytes(pair.public_key_pem_bytes())
    print(f"wrote {out / 'account.pem'} and {out / 'account.pub.pem'}")
    print("Register the public key via CreateAccount (KEY_FORMAT_PEM_EC_P256_SHA256).")


if __name__ == "__main__":
    main()
