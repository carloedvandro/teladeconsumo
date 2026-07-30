"""Cliente Supabase usado pelo scraper (Python)."""

from __future__ import annotations

import os
from typing import Any

import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


class SupabaseClient:
    """Cliente REST mínimo pro PostgREST do Supabase (service role, bypassa RLS)."""

    def __init__(self, base_url: str = SUPABASE_URL, key: str = SUPABASE_SERVICE_ROLE_KEY):
        self.base = base_url
        self.key = key
        if not base_url or not key:
            raise RuntimeError("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios")

    def _url(self, table: str) -> str:
        return f"{self.base}/rest/v1/{table}"

    def select(self, table: str, columns: str = "*", query: str = "") -> list[dict[str, Any]]:
        url = f"{self._url(table)}?select={columns}"
        if query:
            url += f"&{query}"
        r = httpx.get(url, headers=_headers(), timeout=30)
        r.raise_for_status()
        return r.json()

    def insert(self, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        r = httpx.post(
            self._url(table),
            headers={**_headers(), "Prefer": "return=representation"},
            json=rows,
            timeout=30,
        )
        r.raise_for_status()
        return r.json()

    def update(
        self, table: str, payload: dict[str, Any], query: str
    ) -> list[dict[str, Any]]:
        url = f"{self._url(table)}?{query}"
        r = httpx.patch(
            url,
            headers={**_headers(), "Prefer": "return=representation"},
            json=payload,
            timeout=30,
        )
        r.raise_for_status()
        return r.json()

    def rpc(self, fn: str, params: dict[str, Any]) -> Any:
        r = httpx.post(
            f"{self.base}/rest/v1/rpc/{fn}",
            headers=_headers(),
            json=params,
            timeout=30,
        )
        r.raise_for_status()
        return r.json()
