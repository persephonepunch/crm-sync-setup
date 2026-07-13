---
title: "Shopify Token Management"
description: "App Automation Tokens are for CI/CD only. They authenticate shopify app deploy in pipelines. They cannot be used for Admin API calls and are rejected by the CRM worker."
canonical: https://persephonepunch.github.io/crm-sync-setup/docs/SHOPIFY-TOKEN-MANAGEMENT.md
category: "General"
date: 2026-07-13
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/docs/SHOPIFY-TOKEN-MANAGEMENT.md
---
# Shopify Token Management

## Shopify Dev Dashboard Token Model

Per current Shopify guidelines, there are three distinct token types:

| Token Type | Purpose | Lifetime | How to Get |
|---|---|---|---|
| **Client Credentials Token** | Admin API access for own stores (server-to-server) | 24 hours | `grant_type=client_credentials` with Client ID + Client Secret |
| **Authorization Code Token** | Admin API access for merchant-installed apps | Configurable (expiring with refresh) | OAuth redirect flow with `expiring=1` |
| **App Automation Token** | CI/CD deployment only (`shopify app deploy`) | 1, 3, or 6 months | Dev Dashboard → Settings → Create token |

### Where to Find Credentials

All credentials live in the **Dev Dashboard** (developers.shopify.com):
- **Client ID + Client Secret**: Dev Dashboard → your app → **Settings** → Credentials
- **App Automation Token**: Dev Dashboard → your app → **Settings** → App automation token

> **App Automation Tokens are for CI/CD only.** They authenticate `shopify app deploy` in pipelines. They cannot be used for Admin API calls and are rejected by the CRM worker.

---

## Architecture

### Client Credentials Grant (Primary — Own Store)

The simplest path for server-to-server API access on stores you own. No OAuth redirect, no merchant interaction.

```
Client ID + Client Secret
        │
        ▼
POST https://{shop}/admin/oauth/access_token
  grant_type=client_credentials
  client_id={id}
  client_secret={secret}
        │
        ▼
┌─────────────────────────────────────┐
│  access_token   (24h TTL)           │
│  scope          (granted scopes)    │
│  expires_in     (86399 seconds)     │
└──────────────┬──────────────────────┘
               │
               ▼
        KV Store (tenant:{shop})
        ├── shopify_admin_token
        └── shopify_token_expires_at
               │
               │  Before expiry (5-min buffer)
               ▼
        Re-request with same credentials
        (no refresh token — just call again)
```

### Authorization Code Grant (Merchant-Installed Apps)

For apps installed by other merchants via the Shopify app store.

```
Merchant installs app → OAuth redirect → Authorization code
        │
        ▼
POST https://{shop}/admin/oauth/access_token
  client_id={id}&client_secret={secret}&code={code}&expiring=1
        │
        ▼
┌─────────────────────────────────────┐
│  access_token   (expiring)          │
│  refresh_token  (single-use)        │
│  expires_in     (seconds)           │
│  refresh_token_expires_in (seconds) │
└──────────────┬──────────────────────┘
               │
               ▼
        KV Store (tenant:{shop})
        ├── shopify_admin_token
        ├── shopify_refresh_token
        ├── shopify_token_expires_at
        └── shopify_refresh_token_expires_at
               │
               │  Before expiry (5-min buffer)
               ▼
POST /admin/oauth/access_token (grant_type=refresh_token)
        → New access_token + new refresh_token (old one dies)
```

### Token Resolution Priority

The cron and API handlers use this priority:

1. **Refresh token exists** → use refresh token grant (authorization code flow)
2. **No refresh token, Client Secret set** → use client credentials grant (24h token)
3. **No Client Secret** → skip (log warning)

### Three Token Surfaces

| Surface | What it does | When |
|---|---|---|
| **CRM Worker cron** (`*/15 * * * *`) | Auto-provisions via client credentials grant, or refreshes existing token | Every 15 minutes |
| **Shopify App loader** (`app/routes/app.tsx`) | Sends `session.accessToken` to worker (skipped if refresh token exists) | Every time merchant opens app |
| **Settings page** | Manual trigger: Get Token, Force Refresh, OAuth Install, Test API | On demand |

### Multi-Tenant Token Storage

Each tenant's tokens are stored independently in KV under `tenant:{shop}`:

```json
{
  "shopify_admin_token": "<access_token>",
  "shopify_refresh_token": "<refresh_token_if_auth_code_flow>",
  "shopify_token_expires_at": "2026-05-22T09:00:00.000Z",
  "shopify_refresh_token_expires_at": "2026-08-19T09:00:00.000Z",
  "shopify_store_domain": "hx-stage.myshopify.com",
  "shopify_app_secret": "<client_secret>"
}
```

---

## Implementation Reference

### Core Functions

| Function | Grant Type | Purpose |
|---|---|---|
| `getTokenViaClientCredentials()` | Client credentials | Get 24h API token for own store |
| `refreshShopifyTokenIfNeeded()` | Refresh token OR client credentials | Auto-selects based on refresh token presence |
| `migrateToExpiringToken()` | Token exchange | Convert legacy non-expiring token (one-time) |

### Where Token Management Is Called

| Call site | Trigger |
|---|---|
| `shopifyAdminGql()` | Before every Admin API GraphQL call |
| `createShopifyCustomerIfMissing()` | Before customer creation |
| `scheduled()` cron handler | Per-tenant: auto-provision or refresh |
| `POST /admin/shopify-client-credentials` | Manual: get token via client credentials |
| `POST /admin/shopify-refresh` | Manual: force refresh |
| `POST /admin/shopify-migrate-token` | Manual: legacy token migration |

### OAuth Install Flow

`/auth/install` → redirect to Shopify OAuth → `/auth/callback`

The callback handler:
1. Exchanges authorization `code` for tokens with `expiring: "1"`
2. Stores `access_token`, `refresh_token`, `expires_at` in tenant KV
3. Registers the tenant via `registerTenant()`
4. Auto-registers `CUSTOMERS_CREATE` and `CUSTOMERS_UPDATE` webhooks

### Shopify App Session Sync

`app/routes/app.tsx` loader:
1. Authenticates the admin session via `shopify.authenticate.admin()`
2. Sends `session.accessToken` to CRM worker via `POST /config?shop=`
3. **Skipped** if the tenant already has a refresh token (prevents overwriting OAuth tokens)
4. Provisions a Storefront API token if not already present

---

## CI/CD Deployment

App Automation Tokens are used for `shopify app deploy` only:

```bash
export SHOPIFY_APP_AUTOMATION_TOKEN="your-token"
shopify app deploy --config=shopify.app.crm-sync.toml --allow-updates
```

- Created in Dev Dashboard → Settings → App automation token
- Scoped to a single app — cannot access other apps
- Token is only visible at creation time — copy immediately
- Rotation: create new token, update CI/CD, revoke old token

---

## Required Scopes

Declared in `shopify.app.crm-sync.toml` under `[access_scopes]`:

| Scope | Purpose |
|---|---|
| `read_customers` | Customer sync, identity lookup |
| `write_customers` | Customer creation, tag/metafield writes |
| `read_products` | Shop embed product grid |
| `read_orders` | Order history in dashboard |

Deploy scope changes with:

```bash
export SHOPIFY_APP_AUTOMATION_TOKEN="your-token"
shopify app deploy --config=shopify.app.crm-sync.toml --allow-updates
```

---

## Diagnostics

### Settings Page Indicators

The `/settings` admin page shows:

- **Connection**: Connected / Expired / Not Connected
- **Token Type**: `OAuth (auto-refresh)` if refresh token present, `Token present (no refresh)` otherwise
- **Refresh Token**: Active / None
- **Access Token Expires**: ISO timestamp

### Manual Actions

| Button | Endpoint | What it does |
|---|---|---|
| Get Token (Client Credentials) | `POST /admin/shopify-client-credentials` | Exchanges Client ID + Secret for 24h API token |
| Force Refresh | `POST /admin/shopify-refresh` | Refreshes immediately (refresh grant or client credentials) |
| OAuth Install (merchants) | `GET /auth/install?shop=` | Full OAuth redirect for merchant-installed apps |
| Test API | `GET /admin/shopify-test` | Calls Shop API and returns status |

### Common Failures

| Symptom | Cause | Fix |
|---|---|---|
| `403: Non-expiring access tokens` | Legacy non-expiring token | Get Token via client credentials or Re-install OAuth |
| `401: Invalid API key` | Token expired / invalid | Check Client Secret, click Get Token |
| Client credentials grant fails | Client Secret not set or wrong | Copy from Dev Dashboard → Settings → Credentials → Secret |
| Refresh returns 400 | Refresh token already used (rotated) | Get Token via client credentials or Re-install OAuth |
| No token auto-provisioned | No Client Secret in tenant config | Set Client Secret in settings |

---

## Operational Checklist

- [ ] Client Secret copied from Dev Dashboard → Settings → Credentials → Secret
- [ ] Client Secret saved in CRM Settings (or tenant KV `shopify_app_secret`)
- [ ] "Get Token (Client Credentials)" returns OK on settings page
- [ ] Cron trigger `*/15 * * * *` is active in `wrangler.toml`
- [ ] `shopify.app.crm-sync.toml` declares all required scopes
- [ ] Protected customer data access request submitted in Dev Dashboard
- [ ] App Automation Token created for CI/CD (separate from API tokens)
