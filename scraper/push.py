"""Envio de push notifications (web-push, VAPID) para inscrições no banco."""

from __future__ import annotations

import base64
import json
import logging
import os
from dataclasses import dataclass

import httpx
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

log = logging.getLogger("push")

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:admin@example.com")


@dataclass
class PushSubscription:
    endpoint: str
    p256dh: str
    auth: str


def _b64url_decode(s: str) -> bytes:
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _load_private_key() -> ec.EllipticCurvePrivateKey:
    raw = _b64url_decode(VAPID_PRIVATE_KEY)
    return serialization.load_der_private_key(raw, password=None)


def _vapid_jwt(aud_origin: str) -> str:
    """JWT ECDSA P-256 ES256 simplificado para VAPID (RFC 8292)."""
    import time
    header = {"typ": "JWT", "alg": "ES256"}
    payload = {
        "aud": aud_origin,
        "exp": int(time.time()) + 12 * 3600,
        "sub": VAPID_SUBJECT,
    }
    def b64(obj: dict) -> str:
        return base64.urlsafe_b64encode(json.dumps(obj, separators=(",", ":")).encode()).rstrip(b"=").decode()
    signing_input = f"{b64(header)}.{b64(payload)}".encode()
    key = _load_private_key()
    der = key.sign(signing_input, ec.ECDSA(hashes.SHA256()))
    # converter DER -> r||s raw (64 bytes)
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
    r, s = decode_dss_signature(der)
    sig = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    return f"{signing_input.decode()}.{base64.urlsafe_b64encode(sig).rstrip(b'=').decode()}"


def _aesgcm_encrypt(payload: bytes, sub: PushSubscription) -> tuple[bytes, bytes]:
    """Encrypt payload com aes128gcm (RFC 8188) — formato moderno."""
    # Derivar chave de cliente (ECDH + HKDF)
    user_pub = ec.EllipticCurvePublicKey.from_encoded_point(
        ec.SECP256R1(), _b64url_decode(sub.p256dh)
    )
    server_key = ec.generate_private_key(ec.SECP256R1())
    shared = server_key.exchange(ec.ECDH(), user_pub)

    auth_secret = _b64url_decode(sub.auth)
    info = b"WebPush: info\0" + server_key.public_key().public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    ) + _b64url_decode(sub.p256dh)
    ikm = shared + auth_secret
    prk = HKDF(algorithm=hashes.SHA256(), length=32, salt=auth_secret, info=b"").derive(ikm)
    cek_info = b"Content-Encoding: aes128gcm\0"
    nonce_info = b"Content-Encoding: nonce\0"
    cek = HKDF(algorithm=hashes.SHA256(), length=16, salt=prk, info=cek_info).derive(b"")
    nonce = HKDF(algorithm=hashes.SHA256(), length=12, salt=prk, info=nonce_info).derive(b"")

    # Record: header + ciphertext + tag + padding
    server_pub = server_key.public_key().public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    aesgcm = AESGCM(cek)
    # padding: 1 byte 0x02 (último record)
    padded = payload + b"\x02"
    ciphertext = aesgcm.encrypt(nonce, padded, None)

    # RFC 8188 record header (21 bytes) + ciphertext
    rs = len(ciphertext) + 16  # record size (inclui tag)
    header = rs.to_bytes(4, "big") + len(server_pub).to_bytes(1, "big") + server_pub
    return header + ciphertext, b""


def send_push(sub: PushSubscription, payload: dict) -> bool:
    """Envia uma notificação. Retorna True se ok."""
    if not VAPID_PRIVATE_KEY:
        log.warning("VAPID_PRIVATE_KEY não configurado — pulando push")
        return False
    try:
        from urllib.parse import urlparse
        origin = urlparse(sub.endpoint).scheme + "://" + urlparse(sub.endpoint).netloc
        jwt = _vapid_jwt(origin)
        body, _ = _aesgcm_encrypt(json.dumps(payload).encode(), sub)
        r = httpx.post(
            sub.endpoint,
            content=body,
            headers={
                "Authorization": f"vapid t={jwt}, k={VAPID_PUBLIC_KEY}",
                "Content-Encoding": "aes128gcm",
                "TTL": "86400",
                "Content-Type": "application/octet-stream",
            },
            timeout=15,
        )
        if r.status_code in (200, 201):
            return True
        log.warning("Push falhou %s: %s %s", sub.endpoint, r.status_code, r.text[:200])
        return False
    except Exception as e:
        log.error("Erro ao enviar push: %s", e)
        return False
