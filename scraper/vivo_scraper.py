"""
Scraper Vivo Empresas — coleta consumo de linhas e grava no Supabase.

ARQUITETURA
-----------
- `vivo_scraper.py`: módulo ISOLADO que sabe logar no portal e ler o consumo.
  Hoje tem um placeholder (VivoPortalScraper simula dados). Quando você tiver
  as credenciais e a URL reais, substitua APENAS este arquivo — o resto do
  sistema (scheduler, gravação no banco, alertas) não muda.
- `main.py`: scheduler que roda a cada N minutos, chama o scraper, grava
  snapshots no Supabase, checa limiares e dispara alertas.
- `push.py`: envia push notifications via VAPID (web-push).

COMO PLUGAR O SCRAPER REAL
--------------------------
1. Abra o portal Vivo Empresas no navegador, faça login, vá até a página de
   consumo de uma linha.
2. Inspecione os seletores (F12): campo de CPF/CNPJ, senha, botão de login,
   tabela/cards de consumo.
3. Edite `vivo_scraper.py`:
   - `VIVO_PORTAL_URL` (constante)
   - `_login()` com os seletores reais
   - `_scrape_line()` com os seletores do card de consumo
4. Lide com 2FA: a Vivo costuma pedir OTP por SMS. Opções:
   a) Pedir o OTP uma vez, salvar o storage (cookies + localStorage) em
      `/data/storage.json` e reutilizar — recarrega só quando expirar.
   b) Receber o OTP por SMS via API (Twilio/Z-API) e digitar automaticamente.
   O esqueleto já salva/carrega storage em /data/storage.json.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, BrowserContext, Page

log = logging.getLogger("vivo_scraper")

VIVO_PORTAL_URL = os.getenv("VIVO_PORTAL_URL", "https://login.vivo.com.br/login")
STORAGE_PATH = Path(os.getenv("SCRAPER_STORAGE_PATH", "/data/storage.json"))


@dataclass
class LineConsumption:
    """Resultado do scrape de uma linha."""
    number: str
    used_gb: float
    total_gb: float
    status: str  # ativa | reduzida | bloqueada_fatura | bloqueada_pagamento | aguardando
    vivo_line_id: Optional[str] = None


class VivoPortalScraper:
    """
    Scraper do portal Vivo Empresas.

    PLACEHOLDER: gera dados simulados. Substitua _login() e _scrape_line()
    pelos seletores reais do portal. Veja o docstring do módulo.
    """

    def __init__(self, username: str, password: str, headless: bool = True):
        self.username = username
        self.password = password
        self.headless = headless
        self._context: Optional[BrowserContext] = None

    async def __aenter__(self) -> "VivoPortalScraper":
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(headless=self.headless)
        self._context = await self._browser.new_context(
            viewport={"width": 1366, "height": 900},
            locale="pt-BR",
        )
        await self._load_storage()
        return self

    async def __aexit__(self, *exc):
        await self._save_storage()
        if self._context:
            await self._context.close()
        await self._browser.close()
        await self._pw.stop()

    # ---- storage persistente (cookies/localStorage) pra sobreviver a 2FA ----
    async def _load_storage(self):
        if STORAGE_PATH.exists():
            try:
                await self._context.storage_state(path=str(STORAGE_PATH))
                log.info("Storage carregado de %s", STORAGE_PATH)
            except Exception as e:
                log.warning("Falha ao carregar storage: %s", e)

    async def _save_storage(self):
        if self._context:
            STORAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
            await self._context.storage_state(path=str(STORAGE_PATH))

    # ---- login ----
    async def _login(self, page: Page) -> None:
        """
        Faz login no portal Vivo Empresas.

        PLACEHOLDER: ajuste os seletores. Estrutura típica:
            await page.goto(VIVO_PORTAL_URL)
            await page.fill('input[name="usuario"]', self.username)
            await page.fill('input[name="senha"]', self.password)
            await page.click('button[type="submit"]')
            # 2FA: aguardar SMS — ver docstring
            await page.wait_for_url("**/dashboard**", timeout=60000)
        """
        log.warning("SCRAPER EM MODO PLACEHOLDER — gerando dados simulados.")
        # Não navega de verdade; em produção, descomente o bloco acima.
        return

    # ---- listagem de linhas ----
    async def list_lines(self) -> list[str]:
        """
        Retorna os números das linhas disponíveis na conta.

        PLACEHOLDER: retorna vazio — o scheduler usa as linhas cadastradas no
        banco. Em produção, leia da tabela do portal.
        """
        return []

    # ---- consumo de uma linha ----
    async def _scrape_line(self, page: Page, number: str) -> LineConsumption:
        """
        Lê o consumo de UMA linha no portal.

        PLACEHOLDER: gera consumo aleatório estável por número (hash).
        Em produção: navegue até a linha, leia os seletores do card de
        consumo (GB usados / GB total) e do status.
        """
        h = sum(ord(c) for c in number)
        total = 50.0 if h % 2 == 0 else 130.0
        # consumo entre 30% e 99% (pra testar alertas)
        used = round(total * (0.30 + (h % 70) / 100), 2)
        status = "ativa"
        if used / total >= 0.98:
            status = "reduzida"
        return LineConsumption(
            number=number,
            used_gb=used,
            total_gb=total,
            status=status,
            vivo_line_id=f"vivo-{h}",
        )

    async def scrape_all(self, numbers: list[str]) -> list[LineConsumption]:
        """Scrape de várias linhas numa única sessão logada."""
        page = await self._context.new_page()
        try:
            await self._login(page)
            results: list[LineConsumption] = []
            for n in numbers:
                try:
                    c = await self._scrape_line(page, n)
                    results.append(c)
                    log.info("Linha %s: %.2f/%.2f GB (%s)", n, c.used_gb, c.total_gb, c.status)
                except Exception as e:
                    log.error("Erro ao raspar linha %s: %s", n, e)
            return results
        finally:
            await page.close()
