#!/usr/bin/env python3
"""Gera um par de chaves VAPID (P-256) e imprime prontinho pro .env.

Uso:
    python scraper/gen_vapid_keys.py

Saída (exemplo):
    VAPID_PUBLIC_KEY=BPvK...
    VAPID_PRIVATE_KEY=<base64url der private key>
    VITE_VAPID_PUBLIC_KEY=BPvK...
"""
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64


def b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def main():
    key = ec.generate_private_key(ec.SECP256R1())
    pub = key.public_key().public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    priv = key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_b64 = b64url(pub)
    priv_b64 = b64url(priv)
    print("# Cole estas variáveis no seu .env (raiz) e no .env do scraper:\n")
    print(f"VAPID_PUBLIC_KEY={pub_b64}")
    print(f"VAPID_PRIVATE_KEY={priv_b64}")
    print(f"VITE_VAPID_PUBLIC_KEY={pub_b64}")


if __name__ == "__main__":
    main()
