# CRM Sync — Key Management Lifecycle

**Version:** 1.0
**Date:** 2026-05-26
**Scope:** Dev → Stage → Prod key management, consulting team workflow, stakeholder publish

---

## 1. Environments

| Environment | Worker Name | Domain | Shopify Store | Purpose |
|---|---|---|---|---|
| **Dev** | local (`wrangler dev`) | `localhost:8787` | — | Local development, no real secrets |
| **Stage** | `cf-worker-crm-sync` | `crm.story-story.ai` | `hx-stage.myshopify.com` | Integration testing, client demos |
| **Prod** | `cf-worker-crm-sync-prod` *(or client's worker)* | `crm.{client-domain}` | `{client}.myshopify.com` | Live customer traffic |

---

## 2. Key Types

| Key | Storage | Scope | Rotatable via API | Env-specific |
|---|---|---|---|---|
| **Root ADMIN_KEY** | Cloudflare secret | Worker-wide | No (CLI only) | Yes — different per env |
| **Rotatable admin key** | KV `admin_key:rotatable` | Worker-wide | Yes (`POST /admin/rotate-key`) | Yes — lives in env's KV |
| **Tenant token** (`crm_t_*`) | KV `tenant_token:{token}` | Shop-scoped | Provision/revoke via API | Yes — lives in env's KV |
| **JWT_SECRET** | Cloudflare secret | Session signing | No (CLI only) | Yes — different per env |
| **GOOGLE_CLIENT_SECRET** | Cloudflare secret | OAuth | No (CLI only) | Yes — per Google project |
| **SHOPIFY_ADMIN_TOKEN** | KV (per-tenant config) | Shop-scoped | Auto-rotated (expiring tokens) | Yes — per Shopify app |
| **XANO_API_KEY** | Cloudflare secret or KV | Database access | No | Yes — per Xano workspace |
| **RESEND_API_KEY** | Cloudflare secret | Transactional email | No | Yes — per Resend account |
| **GA4_API_SECRET** | Cloudflare secret or KV | Analytics | No | Yes — per GA4 property |
| **WEBFLOW_CMS_TOKEN** | KV (auto-set by OAuth) | CMS writes | Auto-set by Webflow OAuth | Yes — per Webflow site |

---

## 3. Dev Environment

**Who:** Engineering team (Persona A)

```bash
# Start local dev
cd workers/crm-sync
wrangler dev --config wrangler.toml
```

**Key rules:**
- Use `.dev.vars` file for local secrets (never committed)
- Generate throwaway keys: `openssl rand -hex 16`
- No real Shopify/Google/Xano credentials — use test accounts
- KV is local (miniflare) — tenant tokens and rotatable keys are ephemeral

**`.dev.vars` example:**
```
ADMIN_KEY=dev-only-throwaway-key-1234567890
JWT_SECRET=dev-jwt-secret-not-for-production
XANO_API_KEY=xano-dev-key
GOOGLE_CLIENT_SECRET=google-dev-secret
RESEND_API_KEY=re_test_xxxxx
```

**Extension dev:**
```bash
cd extensions/crm-auth
npm run dev    # webflow extension serve 1338 + tsc --watch
```

---

## 4. Stage Environment

**Who:** Engineering + consulting team
**Worker:** `cf-worker-crm-sync` on `crm.story-story.ai`
**Store:** `hx-stage.myshopify.com`

### 4.1 Initial Stage Setup

```bash
# Set stage secrets (one-time)
cd workers/crm-sync
openssl rand -hex 24 | wrangler secret put ADMIN_KEY --config wrangler.toml
openssl rand -hex 24 | wrangler secret put JWT_SECRET --config wrangler.toml
wrangler secret put GOOGLE_CLIENT_SECRET --config wrangler.toml   # from Google Console
wrangler secret put XANO_API_KEY --config wrangler.toml           # from Xano stage workspace
wrangler secret put RESEND_API_KEY --config wrangler.toml         # from Resend (test mode)
```

### 4.2 Stage Key Inventory

| Key | Value Source | Who Holds It |
|---|---|---|
| Root ADMIN_KEY | Generated at deploy | Engineering lead only |
| Rotatable key | Created via API for consulting team | Consulting team lead |
| Tenant token (`crm_t_*`) | Provisioned per demo client | Consulting team member |
| Google OAuth | `story-story` Google project | Engineering lead |
| Shopify Admin | Auto-set by OAuth install on hx-stage | Worker (KV) |

### 4.3 Consulting Team Stage Access

```bash
# Engineering lead creates rotatable key for consulting team
curl -X POST https://crm.story-story.ai/admin/rotate-key \
  -H "Authorization: Bearer $ROOT_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key":"consulting-stage-key-minimum-20chars"}'

# Consulting team uses this key for all stage admin operations
# They CANNOT access root key or CLI — only API-level operations
```

**Consulting team can:**
- Access `/setup`, `/settings`, `/onboarding` with their key
- Provision tenant tokens for demo clients
- Read/write config for any shop on the stage worker
- Rotate their own key if compromised

**Consulting team cannot:**
- Access Cloudflare dashboard or CLI
- Change root ADMIN_KEY
- Modify worker code or deploy
- Access other Cloudflare secrets (JWT_SECRET, etc.)

---

## 5. Prod Environment

**Who:** Depends on stakeholder tier

### 5.1 Persona A (App Creator) — Prod Deploy

```bash
# Create production worker (separate from stage)
cd workers/crm-sync
cp wrangler.toml wrangler.prod.toml
# Edit wrangler.prod.toml: name = "cf-worker-crm-sync-prod", new KV namespace ID

# Set production secrets
openssl rand -hex 32 | wrangler secret put ADMIN_KEY --config wrangler.prod.toml
openssl rand -hex 32 | wrangler secret put JWT_SECRET --config wrangler.prod.toml
wrangler secret put GOOGLE_CLIENT_SECRET --config wrangler.prod.toml
wrangler secret put XANO_API_KEY --config wrangler.prod.toml
wrangler secret put RESEND_API_KEY --config wrangler.prod.toml

# Deploy
wrangler deploy --config wrangler.prod.toml

# Set up custom domain
# (via Cloudflare Workers Custom Domains API or dashboard)
```

### 5.2 Persona B (Shared) — Prod Onboarding

```bash
# A provisions tenant token for B's store
curl -X POST https://crm.{prod-domain}/admin/provision-token \
  -H "Authorization: Bearer $PROD_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "client-store.myshopify.com",
    "label": "client-name",
    "scopes": ["config:read", "config:write"]
  }'
# → Returns: crm_t_xxxx

# B receives ONLY:
#   1. Tenant token (crm_t_xxxx)
#   2. Worker URL (https://crm.{prod-domain})
#   3. Extension auto-fills the URL
# B never sees: root key, Cloudflare secrets, KV internals
```

### 5.3 Persona C (Private Worker) — Prod Handoff

```bash
# C deploys their own worker from the source code license
cd workers/crm-sync
wrangler deploy --config wrangler.toml   # their own Cloudflare account

# C sets their own root key
openssl rand -hex 32 | wrangler secret put ADMIN_KEY --config wrangler.toml

# C creates a rotatable key for day-to-day operations
curl -X POST https://their-worker.their-domain.com/admin/rotate-key \
  -H "Authorization: Bearer $THEIR_ROOT_KEY" \
  -H "Content-Type: application/json" -d '{}'
# → Returns auto-generated rotatable key

# C provisions tenant tokens for each of their Shopify stores
curl -X POST https://their-worker.their-domain.com/admin/provision-token \
  -H "Authorization: Bearer $ROTATABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"shop":"store-1.myshopify.com","label":"store-1"}'

curl -X POST https://their-worker.their-domain.com/admin/provision-token \
  -H "Authorization: Bearer $ROTATABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"shop":"store-2.myshopify.com","label":"store-2"}'
```

---

## 6. Consulting Team → Live Deploy Workflow

### 6.1 Pre-Deploy Checklist

| # | Task | Environment | Who |
|---|---|---|---|
| 1 | Verify all integrations on stage | Stage | Consulting team |
| 2 | Document client's required OAuth scopes | Stage | Consulting team |
| 3 | Request prod deploy from engineering | — | Consulting team → A |
| 4 | Create prod worker or provision on shared | Prod | A (engineering) |
| 5 | Set prod secrets | Prod | A (engineering) |
| 6 | Create consulting rotatable key for prod | Prod | A → consulting team |
| 7 | Provision client tenant token | Prod | Consulting team |
| 8 | Client installs Shopify app (OAuth flow) | Prod | Client (B) |
| 9 | Client connects Google OAuth in extension | Prod | Client (B) |
| 10 | Verify end-to-end auth flow | Prod | Consulting team |
| 11 | Rotate consulting key (remove team access) | Prod | A or consulting lead |

### 6.2 Key Handoff Matrix

```
                    ┌─────────────────────────────────────────────┐
                    │           ENGINEERING (A)                    │
                    │  Root ADMIN_KEY (prod)                       │
                    │  All Cloudflare secrets                      │
                    │  Google Console, Xano, Resend accounts       │
                    └────────────┬────────────────────────────────┘
                                 │
                    Creates rotatable key
                                 │
                    ┌────────────▼────────────────────────────────┐
                    │        CONSULTING TEAM                       │
                    │  Rotatable admin key (prod)                  │
                    │  Can: provision tokens, manage config,       │
                    │       access setup/settings, rotate own key  │
                    │  Cannot: deploy, change secrets, root access │
                    └────────────┬────────────────────────────────┘
                                 │
                    Provisions tenant token
                                 │
              ┌──────────────────┼──────────────────┐
              │                                      │
   ┌──────────▼──────────┐              ┌────────────▼───────────┐
   │    CLIENT (B)        │              │    CLIENT (C)           │
   │  Tenant token only   │              │  Full source + own key  │
   │  crm_t_xxxx          │              │  Root + rotatable       │
   │  Extension auto-fill │              │  Own infra, own deploy  │
   │  No admin access     │              │  Multi-tenant capable   │
   └──────────────────────┘              └────────────────────────┘
```

### 6.3 Post-Launch Key Rotation

After consulting team completes handoff:

```bash
# Option 1: Rotate consulting key (new key, team retains support access)
curl -X POST https://crm.{prod-domain}/admin/rotate-key \
  -H "Authorization: Bearer $CONSULTING_KEY" \
  -H "Content-Type: application/json" -d '{}'
# Old consulting key instantly invalid, new key for ongoing support

# Option 2: Revoke consulting key entirely (root-only)
curl -X DELETE https://crm.{prod-domain}/admin/rotate-key \
  -H "Authorization: Bearer $ROOT_ADMIN_KEY"
# Only root key valid — consulting team fully cut off

# Option 3: Issue new consulting key with different holder
curl -X POST https://crm.{prod-domain}/admin/rotate-key \
  -H "Authorization: Bearer $ROOT_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key":"new-support-team-key-at-least-20"}'
```

---

## 7. Stakeholder Publish — Key Inventory

### 7.1 What Each Stakeholder Receives at Publish

| Credential | A (Creator) | B (Shared) | C (Private) |
|---|---|---|---|
| Root ADMIN_KEY | ✅ Generated + held | ❌ Never | ✅ They generate |
| Rotatable key | ✅ Optional | ❌ Never | ✅ Self-service |
| Tenant token | N/A (is the admin) | ✅ `crm_t_*` | ✅ For sub-tenants |
| Worker URL | Own domain | Provided (auto-fill) | Own domain |
| Extension URL | `/extension/` on own worker | Same (A's worker) | `/extension/` on own worker |
| Google Client ID | Own project | Shared (A's) | Own project |
| Google Client Secret | Own project | ❌ Never | Own project |
| Shopify Admin Token | Auto via OAuth | Auto via OAuth | Auto via OAuth |
| Xano API Key | Own workspace | ❌ Never | Own workspace |
| Cloudflare dashboard | ✅ Full access | ❌ Never | ✅ Own account |
| Source code | ✅ Full repo | ❌ Never | ✅ Licensed copy |

### 7.2 Publish Ceremony (Per Stakeholder)

**Stakeholder B publish:**
1. A provisions `crm_t_*` token scoped to B's shop
2. A sends B: tenant token + worker URL
3. B installs Webflow extension → auto-fills worker URL
4. B enters tenant token in Config tab
5. B installs Shopify app (OAuth flow auto-provisions admin token)
6. B connects Google login via extension Auth tab
7. Done — B operates entirely through extension UI

**Stakeholder C publish:**
1. A delivers licensed source code repo
2. C deploys to their Cloudflare account (`wrangler deploy`)
3. C sets root ADMIN_KEY via CLI
4. C creates rotatable key via API (for team operations)
5. C sets up their own: Google project, Xano workspace, Resend account
6. C registers their Shopify app in Partners
7. C updates Webflow extension URL to their worker domain
8. C provisions tenant tokens per Shopify store
9. C sets `plan: "private"` in config
10. Done — C is fully independent, A has no access

---

## 8. Security Policies

### 8.1 Key Rotation Schedule

| Key | Rotation Frequency | Who Rotates | Method |
|---|---|---|---|
| Root ADMIN_KEY | Annually or on personnel change | A (engineering) | `wrangler secret put` |
| Rotatable key | Quarterly or on team change | Key holder | `POST /admin/rotate-key` |
| Tenant tokens | On client offboarding or breach | A or consulting team | `POST /admin/revoke-token` |
| JWT_SECRET | Annually (invalidates all sessions) | A (engineering) | `wrangler secret put` |
| Google Client Secret | On suspected compromise | A (engineering) | Google Console + `wrangler secret put` |
| Shopify Admin Token | Auto-rotated (expiring tokens) | Worker (cron) | Automatic |

### 8.2 Incident Response — Key Compromise

| Scenario | Immediate Action | Recovery |
|---|---|---|
| Root key leaked | `wrangler secret put ADMIN_KEY` with new value | Rotate all dependent keys, audit KV access logs |
| Rotatable key leaked | `POST /admin/rotate-key` (self-rotation) | Audit what was accessed, notify affected clients |
| Tenant token leaked | `POST /admin/revoke-token` + provision new | Notify affected client, review shop config for tampering |
| JWT_SECRET leaked | `wrangler secret put JWT_SECRET` | All user sessions invalidated — users must re-login |
| Consulting key leaked | `DELETE /admin/rotate-key` (root revoke) | Audit operations during exposure window |

### 8.3 Environment Isolation Rules

- **Never** use prod keys in stage or dev
- **Never** share root keys via email, Slack, or any unencrypted channel
- **Never** commit secrets to git (use `.dev.vars` locally, `wrangler secret put` remotely)
- Stage and prod use **separate** KV namespaces — no cross-contamination
- Consulting team gets **rotatable key only** — never root, never CLI access
- Client (B) gets **tenant token only** — no admin access of any kind
