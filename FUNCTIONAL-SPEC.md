# CRM Sync — Functional Specification & UAT Release Plan

**Document ID:** CRM-FUNC-SPEC-001
**Version:** 1.0
**Date:** 2026-05-14
**Status:** Draft — Pending DPO & PMO Review
**Classification:** Internal — Confidential

---

## Document Control

| Role | Name | Signature | Date |
|---|---|---|---|
| **DPO** (Data Protection Officer) | _________________________ | _________________________ | __________ |
| **PMO** (Project Management Office) | _________________________ | _________________________ | __________ |
| **Engineering Lead** | _________________________ | _________________________ | __________ |
| **QA Lead** | _________________________ | _________________________ | __________ |

### Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-05-14 | Engineering | Initial functional spec with UAT test plan |

---

## 1. Executive Summary

CRM Sync is a server-side customer relationship management system that synchronizes user identity, consent, segmentation, and campaign tags across six integrated services. The system operates as a Cloudflare Worker with tri-directional data flow between Shopify (commerce), Xano (database), Webflow CMS (content), Google Analytics GA4 (measurement), Resend (transactional email), and a Webflow-embedded frontend.

### 1.1 Business Objectives

- Centralized consent management with auditable provenance
- Real-time CRM tag synchronization across all customer-facing channels
- GDPR/CCPA-compliant data handling with right-to-erasure and data portability
- Server-side analytics that respect user consent state
- Self-service user control panel (UCP) for consent and preference management

### 1.2 Deployment Environment

| Component | Platform | Identifier |
|---|---|---|
| Backend Worker | Cloudflare Workers | `cf-worker-crm-sync` |
| Database | Xano | `xerb-qpd6-hd8t.n7.xano.io` |
| Commerce | Shopify Admin API | `hx-stage.myshopify.com` |
| CMS | Webflow CMS API v2 | `omenphase1-1.webflow.io` |
| Analytics | GA4 Measurement Protocol | `G-S7QGFWPZ8X` |
| Email | Resend API | `story-story.ai` domain |
| Config Store | Cloudflare KV | `CRM_STATE` |

---

## 2. System Architecture

### 2.1 Tri-Directional Sync Model

```
                    ┌──────────────────┐
                    │   UCP Dashboard  │
                    │  (User-Facing)   │
                    └────────┬─────────┘
                             │ POST /ucp/tags
                             ▼
┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│   Webflow   │◄───►│  Cloudflare   │◄───►│   Shopify   │
│    CMS      │     │   Worker      │     │   Admin     │
│             │     │   + Xano DB   │     │             │
└──────┬──────┘     └───────┬───────┘     └──────┬──────┘
       │                    │                    │
       │              ┌─────┴─────┐              │
       │              │           │              │
       │              ▼           ▼              │
       │           GA4 MP      Resend            │
       │          (Events)    (Email)            │
       └────────────────────────────────────────-┘
              All paths converge at Xano (source of truth)
```

### 2.2 Data Flow Directions

| # | Direction | Trigger | Path |
|---|---|---|---|
| 1 | Shopify → Xano → Webflow → GA4 | Cron (`*/15 * * * *`) or `POST /webhooks/customer-update` | Customer data pulled from Shopify, upserted to Xano, pushed to Webflow CMS + GA4 user properties |
| 2 | Webflow → Xano → Shopify → GA4 | `POST /webhooks/webflow-item-changed` (auto-registered) | CMS item edited, fields synced to Xano, tags/metafields pushed to Shopify + GA4 |
| 3 | UCP → Xano → Shopify + Webflow → GA4 | `POST /ucp/tags` or `POST /tags/user` | User self-service tag/consent change flows through all channels |
| 4 | Form Bridge → UCP → All | Any `data-crm-form` form submission | Auto-tags, consent logging, GA4 event, full channel flow |

### 2.3 Config Precedence

```
KV Store (crm_config) > wrangler.toml [vars] > Wrangler Secrets
```

---

## 3. Functional Requirements

### 3.1 Authentication (FR-AUTH)

| ID | Requirement | Method | Status |
|---|---|---|---|
| FR-AUTH-01 | Email/password registration with bcrypt hashing | `POST /auth/signup` | Implemented |
| FR-AUTH-02 | Email/password login with JWT issuance | `POST /auth/login` | Implemented |
| FR-AUTH-03 | Google OAuth 2.0 (authorization code flow) | `GET /auth/google/login` → callback | Implemented |
| FR-AUTH-04 | Shopify Customer Account OAuth (PKCE, no secret) | `GET /auth/shopify/login` → callback | Implemented |
| FR-AUTH-05 | JWT-based session with configurable max age | `httpOnly` cookie, default 7 days | Implemented |
| FR-AUTH-06 | Idle timeout with pre-logout warning | Configurable: 30min idle, 5min warning | Implemented |
| FR-AUTH-07 | Password reset via email (Resend) | `POST /auth/forgot-password` → `POST /auth/reset-password` | Implemented |
| FR-AUTH-08 | Profile update (name, language) | `POST /auth/profile` | Implemented |
| FR-AUTH-09 | Account deletion (self-service) | `POST /auth/delete-account` | Implemented |
| FR-AUTH-10 | Auth method toggles (admin-configurable) | KV config: `authMethods.email/google/shopify` | Implemented |

### 3.2 Consent Management (FR-CONSENT)

| ID | Requirement | Status |
|---|---|---|
| FR-CONSENT-01 | TOS consent required on signup (configurable) | Implemented |
| FR-CONSENT-02 | Cookie consent banner with accept/reject | Implemented |
| FR-CONSENT-03 | Marketing opt-in (configurable) | Implemented |
| FR-CONSENT-04 | CCPA sale-of-data opt-out | Implemented |
| FR-CONSENT-05 | Newsletter subscription consent | Implemented |
| FR-CONSENT-06 | Dynamic consent types from form bridge (any key) | Implemented |
| FR-CONSENT-07 | All consent changes logged to `consent_records` audit trail | Implemented |
| FR-CONSENT-08 | Known consent types written to `user_claims` table | Implemented |
| FR-CONSENT-09 | Consent state visible in UCP Dashboard | Implemented |
| FR-CONSENT-10 | Consent state synced to Shopify tags (`accepts_*` / `rejects_*`) | Implemented |
| FR-CONSENT-11 | Consent state pushed to GA4 user properties | Implemented |

### 3.3 Tag System (FR-TAGS)

| ID | Requirement | Status |
|---|---|---|
| FR-TAGS-01 | Structured tags with categories: status, tier, segment, campaign, consent, marketing | Implemented |
| FR-TAGS-02 | Tag auto-creation with category inference (`inferTagCategory`) | Implemented |
| FR-TAGS-03 | Join table architecture (`crm_tags` + `user_tag_map`) | Implemented |
| FR-TAGS-04 | Flat array on `storefront_users.tags` for backward compatibility | Implemented |
| FR-TAGS-05 | Tags flow through full channel on every mutation | Implemented |
| FR-TAGS-06 | Default tag seed: 17 tags across 6 categories | Implemented |
| FR-TAGS-07 | Date-stamped campaign tags from form bridge (`{type}_YYYY-MM-DD`) | Implemented |

### 3.4 CRM Sync (FR-SYNC)

| ID | Requirement | Status |
|---|---|---|
| FR-SYNC-01 | Shopify → Xano customer upsert (by GID or email match) | Implemented |
| FR-SYNC-02 | Xano → Webflow CMS item upsert (by email match) | Implemented |
| FR-SYNC-03 | Xano → Shopify metafields + tagsAdd | Implemented |
| FR-SYNC-04 | Webflow CMS → Xano → Shopify (webhook-driven) | Implemented |
| FR-SYNC-05 | Cron sync every 15 minutes with timestamp cursor | Implemented |
| FR-SYNC-06 | Single-user sync on webhook (not full batch) | Implemented |
| FR-SYNC-07 | Tag reference field linking Customers → CRM Tags collections | Implemented |
| FR-SYNC-08 | Webflow collection auto-detect/create on init | Implemented |

### 3.5 Analytics Integration (FR-GA4)

| ID | Requirement | Status |
|---|---|---|
| FR-GA4-01 | Server-side GA4 Measurement Protocol push | Implemented |
| FR-GA4-02 | User properties: `crm_status`, `crm_tier`, `crm_segment`, `crm_tags`, `crm_campaign`, `consent_marketing`, `consent_tos` | Implemented |
| FR-GA4-03 | Events: `crm_tags_updated`, `crm_sync`, `crm_form_submit` | Implemented |
| FR-GA4-04 | Client ID format: `crm-sync.{userId}` for server-originated events | Implemented |
| FR-GA4-05 | `engagement_time_msec` > 0 for event visibility in reports | Implemented |
| FR-GA4-06 | DataLayer push from form bridge for GTM tag pickup | Implemented |

### 3.6 GDPR / Privacy (FR-GDPR)

| ID | Requirement | Status |
|---|---|---|
| FR-GDPR-01 | Customer redaction — anonymize PII across all Xano tables | Implemented |
| FR-GDPR-02 | Data portability — compile all user data on request | Implemented |
| FR-GDPR-03 | Shop redaction — acknowledge Shopify shop deletion | Implemented |
| FR-GDPR-04 | Consent audit trail — append-only `consent_records` with timestamps | Implemented |
| FR-GDPR-05 | Consent provenance — source, session ID, IP logged per change | Implemented |
| FR-GDPR-06 | Right to deletion — `POST /auth/delete-account` (self-service) | Implemented |

### 3.7 Form Bridge (FR-FORM)

| ID | Requirement | Status |
|---|---|---|
| FR-FORM-01 | Generic `data-crm-form` attribute on any HTML form | Implemented |
| FR-FORM-02 | Auto-derives tag slug from attribute value | Implemented |
| FR-FORM-03 | Creates `{type}_subscribed` + `{type}_YYYY-MM-DD` tags | Implemented |
| FR-FORM-04 | Logs consent with form type as dynamic key | Implemented |
| FR-FORM-05 | Fires `crm_form_submit` dataLayer event with form metadata | Implemented |
| FR-FORM-06 | Programmatic API: `window._crmForms.submit()` | Implemented |

---

## 4. Data Model

### 4.1 Xano Tables

| Table | ID | Purpose | PII |
|---|---|---|---|
| `storefront_users` | 180 | User profiles, auth, tags | Yes — email, name, avatar |
| `user_claims` | 181 | Consent flags, auth provider details | Yes — OAuth tokens, consent state |
| `user_extras` | 182 | Flexible per-user data | Potentially |
| `consent_records` | 183 | Append-only audit log | Yes — user_id, IP, session |
| `crm_tags` | Dynamic | Tag definitions (name, slug, category) | No |
| `user_tag_map` | Dynamic | User ↔ Tag join table (source, timestamp) | No (references user_id) |

### 4.2 Shopify Customer Metafields

| Namespace | Key | Type | Source |
|---|---|---|---|
| `custom` | `crm_status` | `single_line_text_field` | status-category tag |
| `custom` | `crm_tier` | `single_line_text_field` | tier-category tag |
| `custom` | `crm_segment` | `single_line_text_field` | segment-category tag |
| `custom` | `crm_tags` | `list.single_line_text_field` | All tag slugs |
| `custom` | `crm_consent_marketing` | `boolean` | `accepts_marketing` tag presence |
| `custom` | `crm_consent_tos` | `boolean` | `accepts_tou` tag presence |

### 4.3 Webflow CMS Collections

| Collection | Fields | Auto-Created |
|---|---|---|
| **CRM Tags** | Name, Slug, Category, Source | Yes (init step) |
| **Customers** | Name, Email, First/Last Name, Provider, Status, Language, Tags, Orders, Amount Spent, Consent (TOS/Privacy/Cookie/Marketing), Subscriptions, Shopify ID, Country, Tag Refs | Yes (init step) |

### 4.4 KV Store Keys

| Key | Contents | Sensitivity |
|---|---|---|
| `crm_config` | Full site config (credentials, toggles) | High — contains API keys |
| `tag_table_ids` | Xano table IDs for crm_tags + user_tag_map | Low |
| `webflow_tags_collection_id` | Webflow CRM Tags collection ID | Low |
| `sync:customers:last_run` | ISO timestamp of last cron sync | Low |
| `pkce:{state}` | PKCE code_verifier (TTL, auto-expires) | Medium — OAuth state |

---

## 5. Security Controls

### 5.1 Authentication Security

| Control | Implementation |
|---|---|
| Password hashing | bcrypt (via Web Crypto API) |
| Session tokens | JWT with `HS256`, configurable expiry |
| Token delivery | `httpOnly`, `Secure`, `SameSite=None` cookie |
| OAuth state | Random nonce verified on callback |
| PKCE | S256 code challenge (Shopify Customer Account) |
| Idle timeout | Client-side timer with server-validated token expiry |

### 5.2 API Security

| Control | Implementation |
|---|---|
| Protected endpoints | JWT verification required for `/ucp/*`, `/auth/me`, `/auth/profile`, `/auth/delete-account`, `/tags/user`, `/segment/*` |
| CORS | Origin whitelist via `auth_redirect_origin` config |
| Secret masking | `GET /config` masks all credentials (first 4 + last 4 chars) |
| Webhook validation | Shopify HMAC verification on customer webhooks |
| Config isolation | KV > env var precedence prevents accidental secret exposure |

### 5.3 Data Protection

| Control | Implementation |
|---|---|
| Encryption in transit | HTTPS enforced (Cloudflare edge) |
| Encryption at rest | Cloudflare KV encryption, Xano managed encryption |
| PII minimization | GA4 receives tag categories, not raw PII |
| Data retention | Consent records: append-only, no TTL (audit requirement) |
| Right to erasure | Full PII anonymization across all tables on redact |
| Data portability | `POST /gdpr/data-request` compiles complete user record |

---

## 6. Consent Architecture

### 6.1 Consent Flow

```
User Action (toggle, form, signup)
  │
  ├─► consent_records (append-only audit entry)
  │     └─ user_id, type, granted/revoked, timestamp, source, session_id, ip
  │
  ├─► user_claims (known columns only: tos, privacy, cookie, marketing, newsletter)
  │
  ├─► Shopify tags (accepts_{type} / rejects_{type})
  │
  └─► GA4 user properties (consent_marketing, consent_tos)
```

### 6.2 Consent Types

| Type | Storage Column | Shopify Tag | GA4 Property | Configurable |
|---|---|---|---|---|
| TOS | `consent_tos` | `accepts_tou` | `consent_tos` | Yes |
| Privacy | `consent_privacy` | `accepts_privacy` | — | Yes |
| Cookie | `consent_cookie` | `accepts_cookie` | — | Yes |
| Marketing | `consent_marketing` | `accepts_marketing` | `consent_marketing` | Yes |
| Newsletter | `consent_newsletter` | `newsletter_subscribed` | — | Yes |
| CCPA | `consent_ccpa` | — | — | Yes |
| Dynamic (form) | Audit trail only | `accepts_{type}` | — | Automatic |

### 6.3 Audit Trail Schema (`consent_records`)

| Field | Type | Description |
|---|---|---|
| `user_id` | integer | Foreign key to storefront_users |
| `consent_type` | string | e.g., `tos`, `marketing`, `waitlist` |
| `granted` | boolean | true = granted, false = revoked |
| `source` | string | `signup`, `ucp`, `form_bridge`, `api` |
| `session_id` | string | GA4 session ID (if available) |
| `ip_address` | string | Request IP (for legal provenance) |
| `created_at` | timestamp | Immutable creation time |

---

## 7. UAT Test Plan

### 7.1 Test Environment

| Item | Value |
|---|---|
| Worker URL | `https://cf-worker-crm-sync.yoonsunlee150.workers.dev` |
| Test Site | `https://omenphase1-1.webflow.io` |
| Shopify Store | `hx-stage.myshopify.com` |
| GA4 Property | `G-S7QGFWPZ8X` |
| Test Date | 2026-05-____ |
| Tester | _________________________ |

### 7.2 Pre-UAT Checklist

| # | Item | Status | Notes |
|---|---|---|---|
| PRE-01 | Worker deployed and `/health` returns `{"status":"ok"}` | [ ] | |
| PRE-02 | All config credentials populated (`GET /config`, no empty values) | [ ] | |
| PRE-03 | `google_client_id` format valid (contains `-` after project number) | [ ] | |
| PRE-04 | `shopify_admin_token` prefix is `shpua_` (not `atkn_`) | [ ] | |
| PRE-05 | `webflow_collection_id` points to Customers collection (not Tags) | [ ] | |
| PRE-06 | GA4 Measurement ID format `G-XXXXXXXXXX` | [ ] | |
| PRE-07 | GTM container installed on Webflow site | [ ] | |
| PRE-08 | Webflow webhook registered (`collection_item_changed`) | [ ] | |

### 7.3 Authentication Tests

| ID | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| UAT-AUTH-01 | Email signup | 1. Visit site 2. Click login 3. Switch to signup 4. Enter email/password 5. Accept TOS | Account created, JWT cookie set, user appears in Xano | [ ] | |
| UAT-AUTH-02 | Email login | 1. Click login 2. Enter credentials | JWT issued, nav shows user name/avatar | [ ] | |
| UAT-AUTH-03 | Google OAuth | 1. Click "Sign in with Google" 2. Complete Google consent | User created/linked, redirected to site | [ ] | |
| UAT-AUTH-04 | Shopify PKCE login | 1. Click "Sign in with Shopify" 2. Authorize on Shopify | User created/linked via PKCE flow | [ ] | |
| UAT-AUTH-05 | Password reset | 1. Click "Forgot password" 2. Enter email 3. Check inbox 4. Click link 5. Set new password | Email received, password changed, can login | [ ] | |
| UAT-AUTH-06 | Idle timeout | 1. Login 2. Wait for idle timeout 3. Observe warning | Warning appears at configured time, logout after expiry | [ ] | |
| UAT-AUTH-07 | Profile update | 1. Login 2. Go to Account page 3. Change name 4. Save | Name updated in Xano + nav display | [ ] | |
| UAT-AUTH-08 | Account deletion | 1. Login 2. Account page 3. Delete account 4. Confirm | Account deleted, logged out, cannot login | [ ] | |

### 7.4 Consent Tests

| ID | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| UAT-CON-01 | TOS consent on signup | 1. Signup without checking TOS | Signup blocked with error | [ ] | |
| UAT-CON-02 | Cookie banner | 1. Visit site (new session) | Cookie banner appears | [ ] | |
| UAT-CON-03 | Cookie accept | 1. Click accept on banner | Banner dismissed, `consent_cookie: granted` in audit trail | [ ] | |
| UAT-CON-04 | Cookie reject | 1. Click reject on banner | Banner dismissed, `consent_cookie: revoked` in audit trail | [ ] | |
| UAT-CON-05 | Marketing opt-in | 1. Login 2. Dashboard 3. Toggle marketing on | Consent logged, Shopify tag `accepts_marketing` added | [ ] | |
| UAT-CON-06 | Marketing opt-out | 1. Toggle marketing off | Consent logged as revoked, Shopify tag removed | [ ] | |
| UAT-CON-07 | Consent audit trail | 1. Make consent changes 2. Check `/ucp/consent-history` | All changes listed with timestamps, source, session | [ ] | |
| UAT-CON-08 | CCPA opt-out | 1. Visit compliance page 2. Toggle "Do Not Sell" | CCPA consent logged | [ ] | |

### 7.5 Tag Channel Tests

| ID | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| UAT-TAG-01 | Add tag from UCP | 1. Login 2. Dashboard 3. Add "new_campaign" tag | Tag appears in: Xano join table, Shopify customer tags, Webflow CMS, GA4 user properties | [ ] | |
| UAT-TAG-02 | Remove tag from UCP | 1. Remove tag from Dashboard | Tag removed from all channels | [ ] | |
| UAT-TAG-03 | Tag auto-creation | 1. Add tag with unknown slug (e.g., "summer_sale") | Tag created in `crm_tags` with category "campaign" | [ ] | |
| UAT-TAG-04 | Tag category inference | 1. Add "vip" tag | Category assigned as "tier" (not "campaign") | [ ] | |
| UAT-TAG-05 | Cron sync | 1. Add tag in Shopify Admin 2. Wait 15 min (or manual trigger) | Tag appears in Xano + Webflow CMS | [ ] | |
| UAT-TAG-06 | Shopify webhook → Xano + Webflow | 1. Edit customer tags in Shopify | Webhook fires, tags synced to Xano join table + Webflow CMS item | [ ] | |
| UAT-TAG-07 | Webflow CMS → Xano + Shopify | 1. Edit customer tags in Webflow CMS | Webhook fires, tags synced to Xano + Shopify metafields | [ ] | |

### 7.6 Form Bridge Tests

| ID | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| UAT-FORM-01 | Newsletter form | 1. Add `data-crm-form="newsletter"` form to page 2. Submit with email | Tags created: `newsletter_subscribed` + `newsletter_2026-05-14`. Consent logged. DataLayer event fired. | [ ] | |
| UAT-FORM-02 | Waitlist form | 1. Add `data-crm-form="waitlist"` form 2. Submit | Tags: `waitlist_subscribed` + `waitlist_2026-05-14` | [ ] | |
| UAT-FORM-03 | Custom form type | 1. Add `data-crm-form="demo_request"` 2. Submit | Tags: `demo_request_subscribed` + date tag. Dynamic consent logged. | [ ] | |
| UAT-FORM-04 | GTM event pickup | 1. Submit any CRM form 2. Check GTM debug mode | `crm_form_submit` event with `form_type`, `email`, `session_id` parameters | [ ] | |
| UAT-FORM-05 | Unauthenticated form | 1. Submit form without being logged in | DataLayer event fires, no CRM tag creation (graceful skip) | [ ] | |

### 7.7 GA4 Integration Tests

| ID | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| UAT-GA4-01 | User properties on tag change | 1. Add tags 2. Check GA4 DebugView | User properties (`crm_status`, `crm_tier`, etc.) appear | [ ] | |
| UAT-GA4-02 | crm_tags_updated event | 1. Add/remove tag 2. Check GA4 DebugView | Event with `tags_added`/`tags_removed` params | [ ] | |
| UAT-GA4-03 | crm_sync event (cron) | 1. Trigger manual sync 2. Check GA4 | `crm_sync` event with `source: shopify_cron` | [ ] | |
| UAT-GA4-04 | crm_form_submit event (GTM) | 1. Submit CRM form 2. Check GA4 Realtime | Event with form_type, email hash | [ ] | |
| UAT-GA4-05 | Consent in user properties | 1. Grant marketing consent 2. Check GA4 | `consent_marketing: granted` in user properties | [ ] | |

### 7.8 GDPR / Privacy Tests

| ID | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| UAT-GDPR-01 | Customer redaction | 1. `POST /gdpr/customer-redact` with email | All PII anonymized: email → `redacted_{id}@redacted.local`, name cleared, tokens cleared, status → "redacted" | [ ] | |
| UAT-GDPR-02 | Data request | 1. `POST /gdpr/data-request` with email | Complete JSON export: user profile, claims, extras, consent records, tags | [ ] | |
| UAT-GDPR-03 | Shop redaction | 1. `POST /gdpr/shop-redact` | Acknowledged response | [ ] | |
| UAT-GDPR-04 | Audit trail immutability | 1. Redact user 2. Check consent_records | Consent records preserved (not deleted) after user redaction | [ ] | |
| UAT-GDPR-05 | Self-service deletion | 1. Login 2. Account → Delete 3. Confirm | Account removed, session cleared, login fails | [ ] | |
| UAT-GDPR-06 | Consent history access | 1. Login 2. `GET /ucp/consent-history` | Full audit trail returned for authenticated user | [ ] | |

### 7.9 Sync Integration Tests

| ID | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| UAT-SYNC-01 | Full cron cycle | 1. `POST /sync/customers` | Customers synced: Shopify → Xano → Webflow → GA4. Response includes `synced` count. | [ ] | |
| UAT-SYNC-02 | New customer from Shopify | 1. Create customer in Shopify 2. Trigger sync | Customer appears in Xano + Webflow CMS | [ ] | |
| UAT-SYNC-03 | Webflow → Shopify tag sync | 1. Edit customer tags in Webflow CMS 2. Check Shopify customer | Tags + metafields updated on Shopify customer | [ ] | |
| UAT-SYNC-04 | Shopify → Webflow tag sync | 1. Add tag in Shopify Admin 2. Trigger sync | Tag appears in Webflow CMS customer item | [ ] | |
| UAT-SYNC-05 | Collection auto-creation | 1. Delete Customers collection 2. Run `POST /admin/init-tag-system?step=webflow` | Customers collection re-created with all fields, ID saved to config | [ ] | |

### 7.10 Security Tests

| ID | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| UAT-SEC-01 | Unauthenticated UCP access | 1. `GET /ucp/consent-history` without JWT | `401 unauthorized` | [ ] | |
| UAT-SEC-02 | Invalid JWT | 1. Send request with tampered JWT | `401 unauthorized` | [ ] | |
| UAT-SEC-03 | Config secrets masked | 1. `GET /config` | All API keys/tokens show `xxxx••••xxxx` format | [ ] | |
| UAT-SEC-04 | CORS enforcement | 1. Request from unauthorized origin | CORS headers restrict response | [ ] | |
| UAT-SEC-05 | Password not stored in plain text | 1. Check Xano user record | `password_hash` field contains bcrypt hash, no plaintext | [ ] | |

---

## 8. Known Limitations & Risks

| # | Item | Impact | Mitigation |
|---|---|---|---|
| 1 | Cloudflare Workers 50-subrequest limit per invocation | Init tag system split into 3 steps; cron pages at 50 customers | Batch operations stay under limit |
| 2 | Xano Meta API schema quirks (POST /field returns 404) | Schema updates require PUT with full schema array | Documented in INTERNAL-SETUP.md |
| 3 | GA4 Measurement Protocol events are server-side | No browser session stitching without GTM | `user_id` matching bridges server + client events |
| 4 | Webflow CMS API rate limits | High-volume syncs may be throttled | Cron pages at 100 users per sync |
| 5 | Single-file worker architecture (~5000 lines) | Maintenance complexity | Acceptable for current scope; refactor if adding major features |
| 6 | KV eventual consistency | Config changes may take seconds to propagate | Edge-level consistency acceptable for config updates |

---

## 9. Compliance Matrix

### 9.1 GDPR Article Mapping

| Article | Requirement | Implementation |
|---|---|---|
| Art. 6 | Lawful basis for processing | Consent-based: explicit opt-in for each processing purpose |
| Art. 7 | Conditions for consent | Granular toggles per type, freely withdrawable |
| Art. 12 | Transparent information | UCP Dashboard shows all consent states and audit history |
| Art. 15 | Right of access | `POST /gdpr/data-request` returns complete user data |
| Art. 17 | Right to erasure | `POST /gdpr/customer-redact` anonymizes all PII |
| Art. 20 | Right to data portability | `POST /gdpr/data-request` returns structured JSON |
| Art. 25 | Data protection by design | Consent required before data processing; audit trail immutable |
| Art. 30 | Records of processing | `consent_records` table with source, timestamp, IP |
| Art. 33 | Breach notification | Cloudflare incident response + KV audit trail |

### 9.2 CCPA Compliance

| Requirement | Implementation |
|---|---|
| Right to know | Data request endpoint |
| Right to delete | Customer redaction endpoint |
| Right to opt-out of sale | CCPA toggle in consent settings |
| Non-discrimination | No feature gating based on privacy choices |

---

## 10. Release Criteria

### 10.1 Go/No-Go Checklist

| # | Criterion | Required | Status |
|---|---|---|---|
| 1 | All PRE-UAT checks pass | Yes | [ ] |
| 2 | All UAT-AUTH tests pass | Yes | [ ] |
| 3 | All UAT-CON tests pass | Yes | [ ] |
| 4 | All UAT-TAG tests pass (at least 5/7) | Yes | [ ] |
| 5 | All UAT-GDPR tests pass | Yes | [ ] |
| 6 | All UAT-SEC tests pass | Yes | [ ] |
| 7 | UAT-GA4 tests pass (at least 3/5) | Yes | [ ] |
| 8 | UAT-SYNC tests pass (at least 3/5) | Yes | [ ] |
| 9 | UAT-FORM tests pass (at least 3/5) | No — depends on GTM setup | [ ] |
| 10 | No critical or high-severity defects open | Yes | [ ] |
| 11 | DPO sign-off on consent architecture | Yes | [ ] |
| 12 | PMO sign-off on release scope | Yes | [ ] |

### 10.2 Defect Severity Classification

| Severity | Definition | Release Impact |
|---|---|---|
| **Critical** | Data loss, security breach, PII exposure | Blocks release |
| **High** | Core flow broken (auth, consent, sync fails) | Blocks release |
| **Medium** | Feature degraded but workaround exists | Release with known issue |
| **Low** | Cosmetic, non-functional, minor UX | Release acceptable |

---

## 11. Sign-Off

### DPO Approval

I have reviewed the consent architecture, GDPR compliance controls, audit trail implementation, and data protection measures described in this specification. The system meets the requirements for lawful data processing under GDPR and CCPA.

| | |
|---|---|
| **Name** | _________________________ |
| **Title** | Data Protection Officer |
| **Signature** | _________________________ |
| **Date** | _________________________ |
| **Conditions** | _________________________ |

### PMO Approval

I have reviewed the functional requirements, test plan, release criteria, and known limitations. The system is approved for UAT testing and subsequent production release.

| | |
|---|---|
| **Name** | _________________________ |
| **Title** | Project Management Office |
| **Signature** | _________________________ |
| **Date** | _________________________ |
| **Conditions** | _________________________ |

---

*Document generated 2026-05-14. Reflects CRM Sync worker version `5078883c` deployed to `cf-worker-crm-sync.yoonsunlee150.workers.dev`.*
