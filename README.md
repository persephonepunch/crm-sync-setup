# CRM Sync

A tri-directional CRM system that synchronizes customer identity, consent, segmentation, and campaign tags across Shopify, Webflow CMS, Xano, and Google Analytics GA4 — with GDPR/CCPA-compliant consent management and real-time tag channel flow.

## Documents

| Document | Description |
|---|---|
| [Setup Wizard](https://cf-worker-crm-sync.yoonsunlee150.workers.dev/setup) | Interactive guided setup — 8 steps with live status checks |
| [Setup Guide](#setup-guide) | Detailed reference for all six services |
| [Functional Spec & UAT](FUNCTIONAL-SPEC.md) | Requirements, test plan, compliance matrix, DPO/PMO sign-off |

## How to Use

### For Strategy / Positioning

This system provides a **unified customer data platform** across commerce (Shopify), content (Webflow), and analytics (GA4). Key capabilities:

- **Tri-directional sync** — changes in any channel (Shopify Admin, Webflow CMS, or UCP Dashboard) propagate to all others automatically
- **Consent-first architecture** — every data processing action is gated by auditable consent with full provenance (timestamp, source, session, IP)
- **Generic form bridge** — add `data-crm-form="type"` to any form to auto-tag users, log consent, and fire GA4 events with zero custom code
- **Server-side analytics** — GA4 Measurement Protocol pushes user properties and events from the worker, independent of ad blockers

### For Application Submission

The [Functional Spec](FUNCTIONAL-SPEC.md) contains:
- Complete API surface (35+ endpoints)
- GDPR Article mapping (Art. 6, 7, 12, 15, 17, 20, 25, 30, 33)
- CCPA compliance matrix
- 49 UAT test cases across 10 categories
- DPO and PMO signature blocks

### For Development / QA

1. Start with the [Setup Wizard](https://cf-worker-crm-sync.yoonsunlee150.workers.dev/setup) or follow the [Setup Guide](#setup-guide) below
2. Run the Pre-UAT checklist in the [Functional Spec](FUNCTIONAL-SPEC.md#72-pre-uat-checklist)
3. Execute UAT test cases in order (Auth → Consent → Tags → Forms → GA4 → GDPR → Sync → Security)
4. Obtain DPO and PMO sign-off before production release

### Quick Test

```bash
# Health check
curl https://cf-worker-crm-sync.yoonsunlee150.workers.dev/health

# View config (secrets masked)
curl https://cf-worker-crm-sync.yoonsunlee150.workers.dev/config

# List all CRM tags
curl https://cf-worker-crm-sync.yoonsunlee150.workers.dev/tags

# Manual sync trigger
curl -X POST https://cf-worker-crm-sync.yoonsunlee150.workers.dev/sync/customers
```

---

# Setup Guide

Everything you need to get your CRM system running. Complete each section in order — each one builds on the last.

> **What is CRM Sync?** It connects six services together: a **server** (Cloudflare Worker) that runs your auth and sync logic, a **database** (Xano) that stores users and tag relationships, a **store** (Shopify) for customer sync, **analytics** (Google GA4) for tracking consent and user segments, **email** (Resend) for transactional emails, and a **CMS** (Webflow) that displays user data and manages campaigns. You configure each one, then the Webflow App ties them together.

---

## Tab 1: Cloudflare Worker

### What is this?

The Cloudflare Worker is your **backend server**. It handles:

- **User authentication** — signup, login, password reset, OAuth (Google + Shopify)
- **Consent management** — cookie banners, TOS acceptance, GDPR compliance
- **Customer sync** — bidirectional tag sync between Shopify, Xano, Webflow CMS, and GA4
- **Tag system** — structured CRM tags with categories (status, tier, segment, campaign, consent, marketing)
- **GA4 integration** — pushes user properties and events to Google Analytics via Measurement Protocol
- **Serving UI** — the login modal, consent banner, account page, and UCP dashboard are all served from here

**Why Cloudflare?** It's fast (runs at the edge, close to your users), has a generous free tier, and includes KV storage for caching config and session data.

<details>
<summary><strong>Setup Steps</strong></summary>

#### Prerequisites
- Cloudflare account ([sign up free](https://dash.cloudflare.com/sign-up))
- Node.js 20 or newer ([download](https://nodejs.org/))
- Wrangler CLI — Cloudflare's command-line tool

Install Wrangler:
```bash
npm i -g wrangler
```

#### Step 1 — Log in to Cloudflare

```bash
wrangler login
```
This opens a browser window. Log in and authorize Wrangler.

#### Step 2 — Create a KV Namespace

KV (Key-Value) is a simple storage system. The worker uses it to store session data, tag table IDs, and configuration from the Webflow App.

```bash
wrangler kv namespace create CRM_STATE
```

You'll see output like:
```
{ binding = "CRM_STATE", id = "abc123..." }
```
Copy the `id` value — you'll need it in the next step.

#### Step 3 — Configure `wrangler.toml`

Open `workers/crm-sync/wrangler.toml` and fill in your values:

```toml
name = "your-crm-worker"
main = "src/index.ts"
compatibility_date = "2025-04-21"
workers_dev = true

[[kv_namespaces]]
binding = "CRM_STATE"
id = "<paste your KV namespace id here>"

[vars]
XANO_BASE_URL = "https://your-instance.xano.io/api:YOUR_API"
XANO_WORKSPACE_ID = "4"
AUTH_REDIRECT_ORIGIN = "https://your-site.webflow.io"
GOOGLE_CLIENT_ID = ""
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID = ""
SHOPIFY_SHOP_ID = ""
SHOPIFY_STORE_DOMAIN = "your-store.myshopify.com"
RESEND_FROM_EMAIL = "Your Brand <noreply@yourdomain.com>"

[triggers]
crons = ["*/15 * * * *"]
```

> The cron trigger runs customer sync every 15 minutes (Shopify → Xano → Webflow CMS → GA4).

> Don't worry about filling in every field right now. You'll get these values as you complete the other tabs. You can also set them later from the Webflow App.

#### Step 4 — Set Secrets

Secrets are sensitive values (API keys, tokens) that shouldn't be in your config file. Set each one:

```bash
cd workers/crm-sync

wrangler secret put JWT_SECRET
# When prompted, paste a random string. Generate one with: openssl rand -hex 32

wrangler secret put XANO_API_KEY
# Paste your Xano Meta API key (see Tab 2)

wrangler secret put GOOGLE_CLIENT_SECRET
# Paste from Google Cloud Console (see Tab 4)

wrangler secret put SHOPIFY_ADMIN_TOKEN
# Paste your shpua_ token (see Tab 3)

wrangler secret put RESEND_API_KEY
# Paste from resend.com/api-keys

wrangler secret put GA4_API_SECRET
# Paste from GA4 Admin > Data Streams > Measurement Protocol API secrets (see Tab 4)
```

#### Step 5 — Deploy

```bash
npm install
npx wrangler deploy --config wrangler.toml
```

Your worker will be live at: `https://your-crm-worker.<your-account>.workers.dev`

#### Step 6 — Verify

```bash
curl https://your-crm-worker.<your-account>.workers.dev/health
```

You should see:
```json
{"status":"ok","service":"crm-sync"}
```

</details>

### Alternative: Skip the CLI

If you install the CRM Sync Webflow extension, you can set all credentials from the **Config** tab in the Webflow Designer panel. Values saved there override `wrangler.toml` — so after the initial deploy, you never need the command line again.

---

## Tab 2: Xano (Database)

### What is this?

Xano is your **database**. It stores all your user accounts, consent records, profile data, and the CRM tag system. The CRM Worker talks to Xano using the **Meta API**.

**What gets stored:**
- **User accounts** — email, name, password hash, login provider, Shopify/Google IDs
- **Consent preferences** — which policies each user accepted, when, and how
- **Consent audit log** — a timestamped record of every consent change (required for GDPR)
- **CRM tags** — structured tags with name, slug, and category
- **User-tag assignments** — a join table linking users to tags with source attribution
- **User extras** — a flexible table for any additional data

<details>
<summary><strong>Setup Steps</strong></summary>

#### Prerequisites
- Xano account ([sign up](https://www.xano.com/) — free tier works)
- A workspace created in Xano

#### Step 1 — Create Your Tables

Create these 6 tables in Xano. The field names must match exactly.

##### Table: `storefront_users`

This is your main users table.

| Field | Type | What it stores |
|---|---|---|
| id | integer | Auto-generated unique ID |
| email | text | User's email (must be unique) |
| password_hash | text | Encrypted password (empty for Google/Shopify users) |
| full_name | text | Display name |
| first_name | text | First name |
| last_name | text | Last name |
| avatar_url | text | Profile picture URL |
| provider | text | How they signed up: `email`, `google`, or `shopify` |
| google_sub | text | Google account ID (auto-filled on Google login) |
| shopify_customer_gid | text | Shopify customer ID (auto-filled on sync) |
| status | text | `active`, `deleted`, or `suspended` |
| language_pref | text | Preferred language: `en`, `es`, `fr`, etc. |
| tags | json | Customer tags (synced with Shopify, flat array for backward compat) |
| number_of_orders | integer | Order count from Shopify |
| amount_spent | float | Total spend from Shopify |
| email_subscription_status | text | Shopify email marketing status |
| sms_subscription_status | text | Shopify SMS marketing status |
| country | text | Country from Shopify default address |
| last_login_at | timestamp | Last login time |
| updated_at | timestamp | Last update time |

##### Table: `user_claims`

Stores each user's consent choices and auth provider details.

| Field | Type | What it stores |
|---|---|---|
| id | integer | Auto-generated unique ID |
| user_id | integer | Links to the user in `storefront_users` |
| consent_tos | boolean | Accepted Terms of Service? |
| consent_privacy | boolean | Accepted Privacy Policy? |
| consent_cookie | boolean | Accepted analytics cookies? |
| consent_marketing | boolean | Opted into marketing? |
| consent_version | text | Which version of your policies (e.g., `1.0`) |
| oidc_provider | text | OAuth provider: `google` or `shopify` |
| shopify_oidc_sub | text | Shopify OAuth subject ID |
| google_sub | text | Google OAuth subject ID |
| shopify_customer_access_token | text | Shopify Customer Account API token |
| segment_id | text | A/B test segment label |
| language | text | Display language preference |
| updated_at | timestamp | Last update time |

##### Table: `user_extras`

A flexible table for any extra data you want per user. Starts empty — add fields as needed.

| Field | Type | What it stores |
|---|---|---|
| id | integer | Auto-generated unique ID |
| user_id | integer | Links to the user in `storefront_users` |
| updated_at | timestamp | Last update time |

##### Table: `consent_records`

An **audit log** of every consent change. Required by GDPR.

| Field | Type | What it stores |
|---|---|---|
| id | integer | Auto-generated unique ID |
| user_id | integer | Links to the user in `storefront_users` |
| consent_type | text | Which consent: `tos`, `privacy`, `cookie`, or `marketing` |
| action | text | What happened: `granted` or `revoked` |
| method | text | How it happened: `banner`, `signup`, `compliance-page`, etc. |
| consent_version | text | Policy version at the time |
| consent_id | text | Groups simultaneous changes |
| user_agent | text | Browser info (for audit trail) |
| ga_session_id | text | Google Analytics session (for attribution) |
| timestamp | text | When the user clicked (client time) |
| created_at | timestamp | When the server recorded it |

##### Table: `crm_tags`

Stores the tag definitions used across Shopify, Webflow CMS, and GA4.

| Field | Type | What it stores |
|---|---|---|
| id | integer | Auto-generated unique ID |
| name | text | Display name (e.g., "VIP", "New Campaign") |
| slug | text | URL-safe key (e.g., `vip`, `new_campaign`) |
| category | text | Tag category: `status`, `tier`, `segment`, `campaign`, `consent`, `marketing` |
| created_at | timestamp | When the tag was created |

##### Table: `user_tag_map`

Join table linking users to tags — the core of the CRM tag system.

| Field | Type | What it stores |
|---|---|---|
| id | integer | Auto-generated unique ID |
| user_id | integer | Links to `storefront_users` |
| tag_id | integer | Links to `crm_tags` |
| assigned_at | timestamp | When the tag was assigned |
| source | text | Where the tag came from: `shopify`, `ucp`, `admin`, `system` |

> **Shortcut:** Instead of creating `crm_tags` and `user_tag_map` manually, you can use the admin endpoint after deploying the worker:
> ```bash
> curl -X POST https://your-worker.workers.dev/admin/init-tag-system?step=xano
> ```
> This auto-creates both tables and seeds the 17 default tags.

#### Step 2 — Get Your API Credentials

1. Go to your Xano workspace
2. Navigate to **Settings > API Keys**
3. Click **Create a Meta API key** with full access
4. Note these values:

| Value | Where to find it | Example |
|---|---|---|
| Instance URL | Your Xano dashboard URL | `https://your-instance.xano.io` |
| API path | In your API group URL | `api:1Zsx4CNw` |
| Workspace ID | In the browser URL bar | `4` |
| API Key | Shown after creating | `eyJhbG...` (long string) |

#### Step 3 — Enter in Worker

The full `XANO_BASE_URL` combines your instance URL and API path:
```
https://your-instance.xano.io/api:YOUR_API_PATH
```

Enter this in the Webflow App > Config tab, or in `wrangler.toml` under `[vars]`.

#### Step 4 — Verify

Test the connection by creating a test user:
```bash
curl -s -X POST https://your-worker.workers.dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","first_name":"Test","last_name":"User","consent_tos":true,"consent_privacy":true}'
```

A `201` response with a `token` means Xano is connected and working.

</details>

---

## Tab 3: Shopify (Store Integration)

### What is this?

The Shopify integration does three things:

1. **Admin API** — Syncs customer data between your CRM and Shopify. Tags, metafields, consent status, and order data are all kept in sync via a 15-minute cron job. Also handles GDPR data requests.

2. **Customer Account OAuth** — Lets users sign in with their Shopify account using PKCE (no client secret needed).

3. **CRM Tag Sync** — Tags added from the UCP dashboard flow to Shopify as both customer tags (for Shopify Segments/Flows) and structured metafields (for custom reporting).

**You need three things from Shopify:** a Dev Dashboard app (for Admin API token + app secret), a Headless channel (for OAuth login), and GDPR webhook URLs.

<details>
<summary><strong>Setup Steps: Dev Dashboard App (Admin API)</strong></summary>

The Admin API token lets the worker read and write customer data in your Shopify store. Tokens are obtained via OAuth through the Dev Dashboard (the legacy "Develop apps" flow in Shopify Admin is deprecated).

#### Step 1 — Create a Dev App

1. Go to [Shopify Dev Dashboard](https://dev.shopify.com/) (partners.shopify.com > Apps)
2. Click **Create App**
3. Name it (e.g., "CRM Sync")
4. Set the App URL to your worker: `https://your-worker.workers.dev`

#### Step 2 — Set Permissions

In your `shopify.app.crm-sync.toml`:

```toml
[access_scopes]
scopes = "read_customers,write_customers,customer_read_customers,customer_write_customers"
```

#### Step 3 — Configure OAuth Redirect URLs

Add your worker's callback URL:

```toml
[auth]
redirect_urls = [
  "https://your-worker.workers.dev/auth/callback"
]
```

Deploy the app config:
```bash
npx shopify app deploy
```

#### Step 4 — Install the App (Get Token)

1. Visit `https://your-worker.workers.dev/auth/install?shop=your-store.myshopify.com`
2. Approve the OAuth prompt in Shopify
3. The worker exchanges the code for an `shpua_` access token and stores it in KV

#### Step 5 — Set the App Secret

Copy the **Client Secret** from Dev Dashboard > App > Settings (starts with `shpss_`).

Enter it in the Webflow App > Config > **App Client Secret** field, or:
```bash
wrangler secret put SHOPIFY_ADMIN_TOKEN
```

> The app secret is used for OAuth code exchange. The `shpua_` access token is obtained automatically via the install flow.

#### Shopify Metafields (Automatic)

When you initialize the tag system (`POST /admin/init-tag-system?step=shopify`), the worker creates these customer metafield definitions:

| Metafield | Type | What it stores |
|---|---|---|
| `custom.crm_status` | Single-line text | Active, Inactive, etc. |
| `custom.crm_tier` | Single-line text | VIP, Prospect, etc. |
| `custom.crm_segment` | Single-line text | High Value, At Risk, etc. |
| `custom.crm_tags` | List (text) | All CRM tag slugs |
| `custom.crm_consent_marketing` | Boolean | Marketing consent status |
| `custom.crm_consent_tos` | Boolean | TOS consent status |

These are queryable in Shopify Segments: `customer.metafield.custom.crm_segment = "high_value"`.

</details>

<details>
<summary><strong>Setup Steps: "Sign in with Shopify" (OAuth)</strong></summary>

This lets your customers log in using their existing Shopify account — no separate password needed.

#### Step 1 — Set Up Headless Channel

1. In Shopify Admin, go to **Sales channels** (left sidebar)
2. Click **Headless** (if not installed, add it from the sales channels list)
3. Click **Create storefront** or select your existing headless storefront

#### Step 2 — Get Client ID and Shop ID

1. On the Headless channel page, under **Manage API access**, click **Manage** next to **Customer Account API**
2. Copy the **Client ID** — a UUID like `890afa5e-c87b-496e-...`
3. Copy the **Shop ID** — a number like `64312475691`

#### Step 3 — Add Redirect URL

On the same Customer Account API page, add your Worker's callback URL:

```
https://your-crm-worker.<account>.workers.dev/auth/shopify/callback
```

#### Step 4 — Enter in Worker

| Config Field | Value |
|---|---|
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` | The Client ID (UUID) |
| `SHOPIFY_SHOP_ID` | The numeric Shop ID |
| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` |

Set these in the Webflow App > Config tab, or in `wrangler.toml`.

</details>

<details>
<summary><strong>Setup Steps: GDPR Compliance Webhooks</strong></summary>

If you plan to list on the Shopify App Store, you must register GDPR webhook endpoints.

In your `shopify.app.crm-sync.toml`:

```toml
[webhooks]
api_version = "2026-07"

  [[webhooks.subscriptions]]
  uri = "/api/webhooks"
  compliance_topics = [ "customers/data_request", "customers/redact", "shop/redact" ]
```

The worker has handlers at:
- `POST /gdpr/customer-redact` — deletes/anonymizes user data
- `POST /gdpr/data-request` — compiles all stored data for a user
- `POST /gdpr/shop-redact` — acknowledges shop-level data removal

</details>

---

## Tab 4: Google (Analytics, OAuth & GA4 Segments)

### What is this?

The Google integration has three parts:

1. **Google OAuth** — "Sign in with Google" button via OpenID Connect.

2. **GA4 Consent Mode** — Connects your CRM consent banner to Google Analytics. When a user accepts or rejects cookies, GA4 is updated to respect their choice.

3. **GA4 Measurement Protocol** — Server-side push of CRM user properties to GA4. Every tag change (from the UCP dashboard, Shopify sync, or admin API) pushes structured user properties to GA4, making them available for GA4 audiences, Google Ads audience sharing, and Looker Studio.

**GA4 User Properties pushed by the worker:**

| Property | Source | Example Value |
|---|---|---|
| `crm_status` | Status category tags | `active` |
| `crm_tier` | Tier category tags | `vip` |
| `crm_segment` | Segment category tags | `high_value,returning` |
| `crm_campaign` | Campaign category tags | `new_campaign,summer_2026` |
| `crm_tags` | All tag slugs | `active,vip,new_campaign` |
| `consent_marketing` | Consent tags | `granted` or `denied` |
| `consent_tos` | Consent tags | `granted` or `denied` |

**Events sent:**
- `crm_tags_updated` — fired when a user adds/removes tags from the dashboard (includes `tags_added`, `tags_removed`, `campaign_tags` params)
- `crm_sync` — fired during the 15-minute cron sync from Shopify (includes `source: shopify_cron`)

<details>
<summary><strong>Setup Steps: Google OAuth ("Sign in with Google")</strong></summary>

#### Step 1 — Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Application type: **Web application**
6. Name it anything (e.g., "CRM Auth")

#### Step 2 — Set Redirect URI

Under **Authorized redirect URIs**, add:
```
https://your-crm-worker.<account>.workers.dev/auth/google/callback
```

#### Step 3 — Set JavaScript Origin

Under **Authorized JavaScript origins**, add your Webflow site:
```
https://your-site.webflow.io
```

#### Step 4 — Copy Credentials

You'll get two values:
- **Client ID**: looks like `123456789-xxxx.apps.googleusercontent.com`
- **Client Secret**: looks like `GOCSPX-xxxx`

Enter the Client ID in the Webflow App > Config (or `wrangler.toml`).

Set the Client Secret as a Wrangler secret:
```bash
wrangler secret put GOOGLE_CLIENT_SECRET
```

#### Step 5 — Enable Google Identity API

In Google Cloud Console > **APIs & Services > Library**, search for and enable **Google Identity**.

</details>

<details>
<summary><strong>Setup Steps: GA4 Measurement Protocol (Server-Side Segments)</strong></summary>

This sends CRM tag data directly to GA4 as user properties — available for audiences, remarketing, and reporting.

#### Step 1 — Get Your Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Navigate to **Admin > Data Streams > Web**
3. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`)

#### Step 2 — Create an API Secret

1. In the same Data Stream, scroll to **Measurement Protocol API secrets**
2. Click **Create**
3. Name it (e.g., "CRM Sync Server")
4. Copy the secret value

#### Step 3 — Enter in Worker

Set both values in the Webflow App > Config > **Google Analytics (GA4)** section:
- **Measurement ID**: `G-XXXXXXXXXX`
- **Measurement Protocol API Secret**: the secret you created

Or via CLI:
```bash
wrangler secret put GA4_API_SECRET
```
And add to `wrangler.toml`:
```toml
GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"
```

#### Step 4 — Create User-Scoped Custom Dimensions in GA4

To build audiences from CRM tags:

1. Go to **GA4 Admin > Custom definitions > Create custom dimension**
2. Add these as **User-scoped** dimensions:

| Dimension name | User property | Scope |
|---|---|---|
| CRM Status | `crm_status` | User |
| CRM Tier | `crm_tier` | User |
| CRM Segment | `crm_segment` | User |
| CRM Campaign | `crm_campaign` | User |
| CRM Tags | `crm_tags` | User |
| Marketing Consent | `consent_marketing` | User |
| TOS Consent | `consent_tos` | User |

#### Step 5 — Build GA4 Audiences

Once user properties flow in, create audiences:

1. Go to **GA4 Admin > Audiences > New Audience**
2. Examples:
   - **VIP Customers**: `crm_tier contains "vip"`
   - **Campaign Targets**: `crm_campaign contains "summer_2026"`
   - **Marketing Opted-In**: `consent_marketing equals "granted"`
   - **At-Risk Segment**: `crm_segment contains "at_risk"`

These audiences automatically sync to Google Ads for remarketing.

</details>

<details>
<summary><strong>Setup Steps: GA4 Consent Mode (Client-Side)</strong></summary>

This connects your consent banner to GA4 so tracking respects user choices.

#### Step 1 — Add GA4 to Your Webflow Site

Go to **Webflow Site Settings > Custom Code > Head Code** and paste:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted',
    'wait_for_update': 500
  });

  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with your Measurement ID.

> This must go **before** the CRM Footer Code so that `gtag` is defined when the consent banner loads.

#### Step 2 — Add the Consent Bridge Script

In **Webflow Site Settings > Custom Code > Footer Code**, paste this **after** the CRM Footer embed:

```html
<!-- CRM Consent > GA4 Consent Mode bridge -->
<script>
(function() {
  function updateGa4Consent(flags) {
    if (typeof gtag !== 'function') return;

    gtag('consent', 'update', {
      'analytics_storage': flags.cookie ? 'granted' : 'denied',
      'ad_storage': flags.marketing ? 'granted' : 'denied',
      'ad_user_data': flags.marketing ? 'granted' : 'denied',
      'ad_personalization': flags.marketing ? 'granted' : 'denied'
    });

    gtag('event', 'consent_update', {
      'consent_tos': flags.tos,
      'consent_privacy': flags.privacy,
      'consent_cookie': flags.cookie,
      'consent_marketing': flags.marketing,
      'consent_method': 'banner'
    });
  }

  var stored = window._crmConsent && window._crmConsent.getConsent();
  if (stored) updateGa4Consent(stored);

  if (window._crmConsent) {
    var origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, val) {
      origSetItem(key, val);
      if (key === 'crm_consent') {
        try { updateGa4Consent(JSON.parse(val)); } catch(e) {}
      }
    };
  }
})();
</script>
```

#### Step 3 — (Optional) Event-Scoped Custom Dimensions

For consent event reporting in GA4:

| Dimension name | Event parameter | Scope |
|---|---|---|
| Consent TOS | `consent_tos` | Event |
| Consent Privacy | `consent_privacy` | Event |
| Consent Cookie | `consent_cookie` | Event |
| Consent Marketing | `consent_marketing` | Event |
| Consent Method | `consent_method` | Event |

</details>

<details>
<summary><strong>Alternative: GTM Setup (Google Tag Manager)</strong></summary>

If you prefer managing tags through Google Tag Manager instead of hardcoding gtag.js, use this approach. GTM gives you a visual interface to manage all your tags, triggers, and consent settings.

#### Step 1 — Create a GTM Container

1. Go to [tagmanager.google.com](https://tagmanager.google.com/)
2. Click **Create Account**
3. Name it (e.g., "OMEN Site")
4. Container name: your domain (e.g., `omenphase1-1.webflow.io`)
5. Target platform: **Web**
6. Copy your **Container ID** (looks like `GTM-XXXXXXX`)

#### Step 2 — Install GTM on Your Webflow Site

**Head Code** (Webflow Site Settings > Custom Code > Head Code):

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->

<!-- Consent defaults (MUST be before GTM loads GA4) -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'functionality_storage': 'granted',
  'security_storage': 'granted',
  'wait_for_update': 500
});
</script>
```

**Body Code** (immediately after `<body>` — Webflow doesn't have a body slot, so add this to Head Code as well):

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

Replace `GTM-XXXXXXX` with your Container ID.

#### Step 3 — Create GTM Tags

In GTM, create these tags:

##### Tag 1: GA4 Configuration

| Setting | Value |
|---|---|
| Tag Type | Google Tag |
| Tag ID | `G-XXXXXXXXXX` (your GA4 Measurement ID) |
| Trigger | Consent Initialization - All Pages |

> Use **Consent Initialization** trigger (not All Pages) so consent defaults are set before GA4 loads.

##### Tag 2: GA4 — Consent Update Event

| Setting | Value |
|---|---|
| Tag Type | GA4 Event |
| Event Name | `consent_update` |
| Configuration Tag | (your GA4 tag from above) |
| Event Parameters | `consent_tos`, `consent_privacy`, `consent_cookie`, `consent_marketing`, `consent_method` |
| Trigger | Custom Event: `consent_update` |

##### Tag 3: GA4 — Newsletter Signup Event

| Setting | Value |
|---|---|
| Tag Type | GA4 Event |
| Event Name | `newsletter_signup` |
| Configuration Tag | (your GA4 tag from above) |
| Event Parameters | `email` → `{{DLV - email}}`, `session_id` → `{{DLV - session_id}}`, `signup_timestamp` → `{{DLV - signup_timestamp}}`, `consent_marketing` → `{{DLV - consent_marketing}}`, `crm_user_id` → `{{DLV - crm_user_id}}`, `source_page` → `{{Page Path}}` |
| Trigger | Custom Event: `newsletter_signup` |

##### Tag 4: GA4 — CRM Tags Updated Event

| Setting | Value |
|---|---|
| Tag Type | GA4 Event |
| Event Name | `crm_tags_updated` |
| Configuration Tag | (your GA4 tag from above) |
| Event Parameters | `tags_added` → `{{DLV - tags_added}}`, `tags_removed` → `{{DLV - tags_removed}}`, `campaign_tags` → `{{DLV - campaign_tags}}` |
| Trigger | Custom Event: `crm_tags_updated` |

#### Step 4 — Create Data Layer Variables

In GTM > Variables > User-Defined Variables, create these **Data Layer Variables**:

| Variable Name | Data Layer Variable Name |
|---|---|
| DLV - email | `email` |
| DLV - session_id | `session_id` |
| DLV - signup_timestamp | `signup_timestamp` |
| DLV - consent_marketing | `consent_marketing` |
| DLV - crm_user_id | `crm_user_id` |
| DLV - tags_added | `tags_added` |
| DLV - tags_removed | `tags_removed` |
| DLV - campaign_tags | `campaign_tags` |
| DLV - consent_tos | `consent_tos` |
| DLV - consent_privacy | `consent_privacy` |
| DLV - consent_cookie | `consent_cookie` |
| DLV - consent_method | `consent_method` |

#### Step 5 — Create Triggers

| Trigger Name | Type | Event Name |
|---|---|---|
| Consent Update | Custom Event | `consent_update` |
| Newsletter Signup | Custom Event | `newsletter_signup` |
| CRM Tags Updated | Custom Event | `crm_tags_updated` |

#### Step 6 — Publish

Click **Submit** in GTM to publish your container.

</details>

<details>
<summary><strong>CRM Form Bridge: E2E Event Tracking (Any Form Type)</strong></summary>

The CRM Footer embed includes a **generic form bridge** that auto-tags, logs consent, and fires GA4 events for any form — newsletter, waitlist, demo request, contact, quiz, etc. No extra scripts needed.

#### How It Works

Add a `data-crm-form` attribute to any Webflow form. The attribute value becomes the tag name:

```html
<!-- Newsletter -->
<form data-crm-form="newsletter">
  <input type="email" name="email" placeholder="you@example.com" />
  <button type="submit">Subscribe</button>
</form>

<!-- Waitlist -->
<form data-crm-form="waitlist">
  <input type="email" name="email" />
  <button type="submit">Join Waitlist</button>
</form>

<!-- Demo Request -->
<form data-crm-form="demo_request">
  <input type="email" name="email" />
  <button type="submit">Book Demo</button>
</form>
```

In Webflow Designer: select the form block → Settings panel → Custom Attributes → add `data-crm-form` with the form type as the value.

#### Data Flow

```
User submits form (data-crm-form="waitlist")
  → dataLayer.push({ event: 'crm_form_submit', form_type: 'waitlist', ... })
  → GTM fires GA4 event tag
  → POST /ucp/tags (adds 'waitlist_subscribed' + 'waitlist_2026-05-14' tags)
  → POST /auth/consent-sync (logs waitlist + marketing consent with GA4 session)
  → Worker channel flow:
      1. Xano crm_tags — auto-creates tag (category: campaign)
      2. Xano user_tag_map — join entry (source: ucp)
      3. Shopify — tagsAdd + metafields
      4. Webflow CMS — Tags collection item (if new)
      5. GA4 — user properties + crm_tags_updated event
  → consent_records — audit entry with session ID + timestamp
```

#### What Gets Created Per Form Type

| Form Attribute | Tags Created | Consent Logged | Shopify Tag |
|---|---|---|---|
| `data-crm-form="newsletter"` | `newsletter_subscribed`, `newsletter_2026-05-14` | `newsletter: granted` | `accepts_newsletter` |
| `data-crm-form="waitlist"` | `waitlist_subscribed`, `waitlist_2026-05-14` | `waitlist: granted` | `accepts_waitlist` |
| `data-crm-form="demo_request"` | `demo_request_subscribed`, `demo_request_2026-05-14` | `demo_request: granted` | `accepts_demo_request` |
| `data-crm-form="contact"` | `contact_subscribed`, `contact_2026-05-14` | `contact: granted` | `accepts_contact` |

The date-stamped tag gives you temporal segmentation — see which campaign day drove signups.

#### GTM Tag Setup

In GTM, create one tag for all form types:

##### Tag: GA4 — CRM Form Submit

| Setting | Value |
|---|---|
| Tag Type | GA4 Event |
| Event Name | `crm_form_submit` |
| Event Parameters | `form_type` → `{{DLV - form_type}}`, `email` → `{{DLV - email}}`, `session_id` → `{{DLV - session_id}}`, `submit_timestamp` → `{{DLV - submit_timestamp}}`, `consent_marketing` → `{{DLV - consent_marketing}}`, `crm_user_id` → `{{DLV - crm_user_id}}`, `source_page` → `{{Page Path}}` |
| Trigger | Custom Event: `crm_form_submit` |

##### Data Layer Variables

| Variable Name | Data Layer Variable Name |
|---|---|
| DLV - form_type | `form_type` |
| DLV - email | `email` |
| DLV - session_id | `session_id` |
| DLV - submit_timestamp | `submit_timestamp` |
| DLV - consent_marketing | `consent_marketing` |
| DLV - crm_user_id | `crm_user_id` |

#### GA4 Custom Dimensions

In GA4 Admin, add these event-scoped custom dimensions:

| Dimension name | Event parameter | Scope |
|---|---|---|
| Form Type | `form_type` | Event |
| Form Email | `email` | Event |
| GA4 Session ID | `session_id` | Event |
| Submit Timestamp | `submit_timestamp` | Event |
| Source Page | `source_page` | Event |

#### Build GA4 Audiences

Examples:

| Audience | Condition |
|---|---|
| Newsletter Subscribers | `crm_tags contains "newsletter_subscribed"` |
| Waitlist Signups | `crm_tags contains "waitlist_subscribed"` |
| Demo Requests | Event: `crm_form_submit` where `form_type = "demo_request"` |
| All Form Submitters | Event: `crm_form_submit` (any type) |

These audiences auto-sync to Google Ads for remarketing.

#### Dashboard Visibility

After form submission, the user's UCP Dashboard shows:

| Card | What appears |
|---|---|
| **Consent Status** | "Newsletter: Granted" (or whichever form type maps to a known consent column) |
| **Consent History** | Timestamped row: `waitlist — granted — waitlist_form — 5/14/2026` |
| **Customer Tags** | `newsletter_subscribed`, `waitlist_subscribed`, date tags |
| **Retarget Channels** | Email, SMS, Ads, Push light up (marketing consent granted) |
| **A/B Segment** | Campaign tags shown under "GA4 Synced" |

#### Manual / Programmatic Use

For non-Webflow forms or custom integrations:

```javascript
// Submit programmatically
window._crmForms.submit('newsletter', 'user@example.com', formElement);
window._crmForms.submit('waitlist', 'user@example.com');
window._crmForms.submit('demo_request', 'user@example.com', document.getElementById('my-form'));
```

#### Verify E2E

1. Open your Webflow site with a `data-crm-form` form
2. Open Chrome DevTools > **Network** tab
3. Submit the form with a test email
4. Check:
   - Console: `dataLayer.filter(e => e.event === 'crm_form_submit')` — shows form_type, email, session_id
   - Network: `POST /ucp/tags` with `{form_type}_subscribed` tag
   - Network: `POST /auth/consent-sync` with `method: {form_type}_form`
   - GTM Preview: `crm_form_submit` trigger fires
   - GA4 DebugView: `crm_form_submit` event with all parameters
   - Shopify Admin > Customers: user has `accepts_{form_type}` tag

#### Session Continuity

The GA4 session ID (`_ga_` cookie) is captured at submit time and attached to:
- The GTM dataLayer event (client-side)
- The consent_records audit entry (server-side, stored in Xano)
- The GA4 Measurement Protocol push (server-side)

This lets you join client-side GA4 sessions with server-side CRM events in BigQuery for full journey analysis.

</details>

---

## Tab 5: Webflow CMS (Customer Data & Tags)

### What is this?

Webflow CMS stores a read-friendly copy of your customer data and CRM tags. This lets you build Webflow pages that display customer profiles, filter by tags, and create dynamic content based on CRM segments.

**Two collections are used:**
1. **Customers** — synced from Xano on every cron run (name, email, provider, consent status, order data, tags)
2. **CRM Tags** — the tag definitions with categories, referenced by the Customers collection via MultiReference

<details>
<summary><strong>Setup Steps</strong></summary>

#### Step 1 — Get a Webflow CMS API Token

1. Go to **Webflow Site Settings > Integrations > API Access**
2. Click **Generate API Token**
3. Required scopes: **CMS read/write**
4. Copy the token

#### Step 2 — Create the Customers Collection

Create a CMS collection called "Customers" with these fields:

| Field | Type | Slug |
|---|---|---|
| Name | Plain Text | `name` |
| Email | Email | `email` |
| First Name | Plain Text | `first-name` |
| Last Name | Plain Text | `last-name` |
| Provider | Plain Text | `provider` |
| Status | Plain Text | `status` |
| Language | Plain Text | `language` |
| Tags | Plain Text | `tags` |
| Number of Orders | Number | `number-of-orders` |
| Amount Spent | Number | `amount-spent` |
| Consent TOS | Plain Text | `consent-tos` |
| Consent Privacy | Plain Text | `consent-privacy` |
| Consent Cookie | Plain Text | `consent-cookie` |
| Consent Marketing | Plain Text | `consent-marketing` |
| Email Subscription | Plain Text | `email-subscription` |
| SMS Subscription | Plain Text | `sms-subscription` |
| Shopify Customer ID | Plain Text | `shopify-customer-id` |
| Country | Plain Text | `country` |
| Tag Refs | Multi-Reference → CRM Tags | `tag-refs` |

Copy the **Collection ID** from the collection settings.

#### Step 3 — Initialize Tag System (Creates CRM Tags Collection)

```bash
curl -X POST https://your-worker.workers.dev/admin/init-tag-system?step=webflow
```

This creates the CRM Tags collection and populates it with the 17 default tags.

#### Step 4 — Enter in Worker

Set in the Webflow App > Config tab:
- **CMS API Token**: the token from Step 1
- **Customers Collection ID**: from Step 2

</details>

### Campaign Tags from Dashboard

When a user adds a tag like "new campaign" from the UCP dashboard, it immediately:
1. Creates the tag in Xano (`crm_tags` table, category: `campaign`)
2. Assigns it to the user in the join table (`user_tag_map`)
3. Pushes it to Shopify as a customer tag + metafield
4. Creates it in the Webflow CRM Tags collection
5. Pushes it to GA4 as a `crm_campaign` user property

No cron wait — the full channel flow happens in one request.

---

## Tab 6: Email (Resend)

### What is this?

Resend handles **transactional emails** — specifically, the password reset email. When a user clicks "Forgot password?" on your site, the worker sends them an email with a secure reset link.

<details>
<summary><strong>Setup Steps</strong></summary>

#### Step 1 — Create a Resend Account

1. Go to [resend.com](https://resend.com/) and sign up
2. Verify your sending domain

> You must verify the domain in Resend before you can send from it.

#### Step 2 — Get Your API Key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy it — it starts with `re_`

#### Step 3 — Enter in Worker

Set the API key:
```bash
wrangler secret put RESEND_API_KEY
```

Set the "from" email in `wrangler.toml` or the Webflow App > Config:
```
RESEND_FROM_EMAIL = "Your Brand <noreply@yourdomain.com>"
```

The format is: `Display Name <email@verified-domain.com>`

</details>

---

## Tab 7: Webflow Extension (Config UI)

### What is this?

The CRM Sync Webflow extension adds a configuration panel to the Webflow Designer. It lets you manage all credentials, auth settings, consent toggles, and embed codes without touching the CLI.

**Config tab** — Worker URL, Shopify credentials, Google OAuth, Xano, Resend, Webflow CMS, GA4
**Auth tab** — Toggle auth methods (email/Google/Shopify), session settings, consent & privacy toggles
**Embeds tab** — Copy-paste embed codes for footer loader, account page, dashboard, compliance page
**Status tab** — Health check, endpoint testing, redirect URIs, privacy API tests, GDPR handler tests

### Embed Codes

The extension generates four embed snippets:

| Embed | Where to paste | What it renders |
|---|---|---|
| **CRM Footer Loader** | Site Settings > Footer Code | Login modal, consent banner, session management |
| **Account Page** | Account page embed block | User profile view/edit |
| **UCP Dashboard** | Dashboard page embed block | Consent status, retarget channels, A/B segment, tags, translation, consent history |
| **Compliance / Privacy** | Privacy page embed block | Communication preferences, third-party disclosures, data rights |

---

## Quick Reference

All credentials in one place. Use the Webflow App Config tab or `wrangler.toml` / `wrangler secret put`.

| What | Where to set | Example |
|---|---|---|
| Worker URL | Webflow App: Config tab | `https://your-worker.workers.dev` |
| Xano API Base URL | Webflow App or `wrangler.toml` | `https://xxx.xano.io/api:XXX` |
| Xano API Key | Webflow App or `wrangler secret` | `eyJhbG...` |
| Google Client ID | Webflow App or `wrangler.toml` | `123456.apps.googleusercontent.com` |
| Google Client Secret | Webflow App or `wrangler secret` | `GOCSPX-xxx` |
| GA4 Measurement ID | Webflow App or `wrangler.toml` | `G-XXXXXXXXXX` |
| GA4 API Secret | Webflow App or `wrangler secret` | `xxxxxxxx` |
| Shopify Store Domain | Webflow App or `wrangler.toml` | `store.myshopify.com` |
| Shopify Shop ID | Webflow App or `wrangler.toml` | `64312475691` |
| Shopify Client ID | Webflow App or `wrangler.toml` | `890afa5e-...` |
| Shopify Admin Token | Webflow App or OAuth install flow | `shpua_xxx` (auto via install) |
| Shopify App Secret | Webflow App or `wrangler secret` | `shpss_xxx` |
| Webflow CMS Token | Webflow App or `wrangler secret` | `xxx...` |
| Webflow Collection ID | Webflow App | `xxx...` |
| Resend API Key | Webflow App or `wrangler secret` | `re_xxx` |
| Resend From Email | Webflow App or `wrangler.toml` | `Brand <noreply@domain.com>` |
| JWT Secret | `wrangler secret` only | `openssl rand -hex 32` |

---

## Default CRM Tags

These 17 tags are seeded when you initialize the tag system:

| Category | Tags |
|---|---|
| **status** | Active, Inactive |
| **tier** | VIP, Prospect |
| **consent** | Accepts Marketing, Rejects Marketing, Accepts TOU, Accepts Privacy, Accepts Cookie |
| **marketing** | Email Subscribed, Email Unsubscribed, SMS Subscribed |
| **segment** | High Value, Returning, New Customer, At Risk |
| **campaign** | Campaign |

Tags added from the UCP dashboard that don't match a known category default to **campaign**.
