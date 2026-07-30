# Vivo Gestão de Linhas

Sistema de gestão de linhas da Vivo com painel do cliente (PWA instalável, consumo em tempo real, alertas por push) e painel admin do vendedor (todas as linhas, limiares, bloqueio semiautomático). Um scraper Python/Playwright coleta o consumo no portal Vivo Empresas a cada 5 minutos e grava no banco.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  Seu VPS (Docker Compose)                                   │
│                                                             │
│  ┌──────────┐   ┌──────────────────┐   ┌────────────────┐   │
│  │  web     │   │  Supabase        │   │  scraper       │   │
│  │  (PWA +  │──▶│  self-host       │◀──│  Playwright    │   │
│  │  admin)  │   │  Postgres+Auth+  │   │  a cada 5 min  │   │
│  │  :3000   │   │  REST+Studio     │   │                │   │
│  └──────────┘   └────────┬─────────┘   └───────┬────────┘   │
│                          │                     │            │
│                          │   ┌─────────────────▼──────┐    │
│                          │   │  Portal Vivo Empresas  │    │
│                          │   │  (scraping via browser)│    │
│                          │   └────────────────────────┘    │
└──────────────────────────┼────────────────────────────────┘
                           │
            clientes acessam via navegador (PWA)
```

| Container | Função | Porta |
|---|---|---|
| `vivo-web` | App TanStack Start (PWA cliente + painel admin) | 3000 |
| `vivo-scraper` | Scraper Playwright + scheduler + push | — |
| `supabase-*` | Postgres, Auth (GoTrue), REST, Studio, Kong | 8000 (API), 3001 (Studio) |

## Deploy (passo a passo)

### 1. Pré-requisitos
- VPS com Docker + Docker Compose v2
- Domínio (opcional, mas recomendado pra HTTPS — push notifications exigem HTTPS ou localhost)

### 2. Configurar `.env`
```bash
cp .env.example .env
# Gere senhas/chaves fortes:
openssl rand -base64 32   # POSTGRES_PASSWORD, JWT_SECRET, SECRET_KEY_BASE, VAULT_ENC_KEY
```

Preencha no `.env`:
- Todas as variáveis do Supabase (copie também o `.env` do `supabase-selfhost/` se quiser rodar só ele isolado).
- `ANON_KEY` e `SERVICE_ROLE_KEY`: **gere com o JWT_SECRET que você definiu**. Use https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys ou o script abaixo. As chaves de exemplo do `.env` do Supabase só funcionam com o `JWT_SECRET` de exemplo — se trocou o secret, regere as chaves.
- `VITE_SUPABASE_URL`: URL **pública** que o navegador do cliente usa (ex: `https://api.seudominio.com`). Se não tem domínio, use `http://SEU_IP:8000`.
- `VAPID_*`: gere com `python scraper/gen_vapid_keys.py` (ou dentro do container).

### 3. Gerar chaves VAPID (uma vez)
```bash
docker compose run --rm scraper python scraper/gen_vapid_keys.py
# cole a saída no .env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY)
```

### 4. Subir tudo
```bash
docker compose up -d --build
```

### 5. Aplicar o schema do banco
O Supabase sobe com o banco vazio. Aplique a migration:
```bash
# Opção A: pelo Studio (http://SEU_IP:3001 → SQL Editor → cole o conteúdo de supabase/migrations/0001_init.sql)
# Opção B: pelo psql
docker compose exec db psql -U supabase_admin -d postgres -f /docker-entrypoint-initdb.d/0001_init.sql
# (ou copie o arquivo para dentro do container e rode)
```

### 6. Criar o usuário admin (vendedor)
1. Acesse o app em `http://SEU_IP:3000/login` e crie uma conta (SignUp).
2. Confirme o email (no self-host, o Studio pode confirmar manualmente, ou desative a confirmação em Auth → Settings).
3. Promova a admin via SQL:
   ```sql
   update public.profiles set is_admin = true where id = '<seu-user-id>';
   ```
   (pegue o ID em Auth → Users no Studio)
4. Acesse `http://SEU_IP:3000/admin`.

### 7. Cadastrar linhas e clientes
No Studio (SQL Editor) ou pelo admin (futuro: CRUD de linhas na UI):
```sql
-- criar um cliente (Auth → Add user no Studio) e vincular linhas:
insert into public.lines (number, user_id, plan, total_gb, cycle_closing_day, cycle_renewal_day, vivo_portal_url)
values ('(31) 97115-7584', '<id-do-cliente>', 'SmartVoz 50GB', 50, 1, 2, 'https://vivo.com.br/linha/xxx');

-- limiar de alerta (default 98%):
insert into public.thresholds (line_id, warn_pct) values ('<line-id>', 98);
```

## ⚠️ Onde plugar o scraper REAL

O scraper hoje roda em **modo placeholder** (gera dados simulados). Para coletar consumo real do portal Vivo Empresas, edite **apenas** [`scraper/vivo_scraper.py`](scraper/vivo_scraper.py):

1. **Abra o portal no navegador**, faça login, vá até a página de consumo de uma linha.
2. **Inspecione os seletores** (F12):
   - Campos de CPF/CNPJ e senha, botão de login.
   - Card/tabela de consumo (GB usados / GB total).
   - Indicador de status (ativa/bloqueada/reduzida).
3. **Edite `vivo_scraper.py`**:
   - `VIVO_PORTAL_URL` (constante no topo).
   - `_login()`: descomente e ajuste os seletores de login.
   - `_scrape_line()`: ajuste os seletores do card de consumo.
4. **Lide com 2FA** (a Vivo costuma pedir OTP por SMS):
   - O esqueleto já **salva/carrega storage** (cookies + localStorage) em `/data/storage.json` entre runs — faça login manual uma vez num browser visível (`headless=False`), salve o storage, e o scraper reutiliza até expirar.
   - Para automatizar 100%: receba o OTP por SMS via API (Twilio, Z-API, Evolution) e digite automaticamente no campo.

> **Honestidade:** ninguém consegue garantir que um scraper de portal fechado funciona sem ver os seletores reais. O módulo é isolado justamente pra você (ou eu, numa sessão onde eu puder abrir o portal) ajustar só essa parte — o scheduler, a gravação no banco e os alertas não mudam.

## Bloqueio de linha (semiautomático)

O sistema **não bloqueia a linha na Vivo automaticamente** (decisão de segurança — um scraper que erra o seletor pode bloquear a linha errada). O fluxo é:
1. No painel admin, você muda o status da linha (ex: `bloqueada_fatura`).
2. O sistema avisa o cliente (push + marca no painel dele).
3. Você clica no botão **Portal** (configure `vivo_portal_url` por linha) e bloqueia na Vivo com 1 clique.

Se no futuro quiser bloqueio 100% automático, é só adicionar um método `block_line()` no `vivo_scraper.py` e chamá-lo no `main.py` quando o status mudar — mas avalie o risco.

## Desenvolvimento local

```bash
npm install
npm run dev          # app em http://localhost:3000
# scraper (outra janela):
cd scraper && pip install -r requirements.txt && playwright install chromium
python -m scraper.main --once
```

## Estrutura

```
.
├── docker-compose.yml          # raiz: supabase + web + scraper
├── Dockerfile                  # app TanStack Start
├── .env.example
├── src/
│   ├── routes/
│   │   ├── index.tsx           # PWA do cliente (UI original + dados reais)
│   │   ├── login.tsx           # login/signup
│   │   ├── admin.tsx           # painel do vendedor
│   │   └── __root.tsx          # shell + manifest PWA
│   ├── lib/
│   │   ├── api/lines.functions.ts  # server functions (linhas, alertas, admin)
│   │   └── push.ts             # registro SW + push VAPID
│   └── integrations/supabase/  # client + tipos
├── supabase/migrations/0001_init.sql  # schema + RLS
├── scraper/
│   ├── vivo_scraper.py         # ⚠️ ajustar seletores aqui (placeholder)
│   ├── main.py                 # scheduler + alertas + push
│   ├── push.py                 # web-push VAPID
│   ├── supabase_client.py
│   ├── gen_vapid_keys.py
│   └── Dockerfile
├── public/
│   ├── manifest.webmanifest
│   └── sw.js                   # service worker (PWA + push)
└── supabase-selfhost/          # docker-compose oficial do Supabase
```

## Próximos passos sugeridos
- [ ] CRUD de linhas/clientes na UI do admin (hoje é via SQL/Studio)
- [ ] Histórico de consumo com gráfico real (já tem `consumption_snapshots`)
- [ ] Bloqueio automático opcional (com confirmação dupla)
- [ ] Migrar PWA pra app nativo (Expo) reaproveitando a UI
