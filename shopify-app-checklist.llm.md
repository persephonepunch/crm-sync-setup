---
title: "Shopify App Requirements — LLM Audit Prompt"
description: "Feed this file to any LLM (Claude, GPT, Gemini) along with your codebase to get an automated compliance audit against current Shopify App Store requirements (May 2026)."
canonical: https://persephonepunch.github.io/crm-sync-setup/shopify-app-checklist.llm.md
category: "General"
date: 2026-07-13
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/shopify-app-checklist.llm.md
---
# Shopify App Requirements — LLM Audit Prompt

> Feed this file to any LLM (Claude, GPT, Gemini) along with your codebase to get an automated compliance audit against current Shopify App Store requirements (May 2026).

## Instructions for the LLM

You are auditing a Shopify app for App Store submission readiness. Evaluate the codebase against every requirement below. For each item, respond with one of:

- PASS — evidence of compliance found in code
- FAIL — violation detected; cite the file and line
- REVIEW — cannot determine from code alone; explain what to check manually

Output a summary table first, then details for FAIL and REVIEW items only.

---

## Requirements

### 1. DEV DASHBOARD & CONFIG

1.1 App created in Dev Dashboard (dev.shopify.com), not legacy Partner Dashboard
1.2 shopify.app.toml exists with valid client_id
1.3 application_url does not contain "Shopify" or "Example"
1.4 embedded = true (if app renders in Shopify Admin)
1.5 access_scopes lists only minimum required scopes
1.6 use_legacy_install_flow is false or omitted
1.7 redirect_urls configured in [auth] section
1.8 webhooks.api_version set to supported version (2025-04 or later)
1.9 compliance_topics declared: customers/data_request, customers/redact, shop/redact
1.10 Extensions managed via CLI (no dashboard-managed extensions)
1.11 Shopify CLI version >= 3.84.1

### 2. AUTHENTICATION & TOKENS

2.1 OAuth initiates immediately on install — no UI before OAuth
2.2 OAuth initiates immediately on reinstall
2.3 Redirect to app UI after OAuth handshake (not blank page or external URL)
2.4 No manual .myshopify.com URL entry during install
2.5 Token exchange sends expiring=1 parameter (mandatory for new public apps since April 1, 2026)
2.6 Access token stored with TTL tracking (shpua_, 60-min lifetime)
2.7 Refresh token stored securely (shprt_, 90-day lifetime, encrypted at rest)
2.8 Token refresh implemented proactively (before expiry, not after 401)
2.9 Fallback: handle 401 by refreshing token
2.10 Both access_token and refresh_token updated on every refresh
2.11 Refresh failure monitoring and alerting
2.12 No code assumes offline tokens never expire
2.13 Session tokens used for embedded app auth (not cookies/localStorage)
2.14 App works in Chrome incognito mode

### 3. PROTECTED CUSTOMER DATA

3.1 Data access level determined (0/1/2)
3.2 Protected customer data access requested in Partner Dashboard
3.3 Specific field access requested: read_customer_name, read_customer_email, read_customer_phone, read_customer_address (as needed)
3.4 Code handles null for unapproved/redacted fields without crashing
3.5 Data protection details completed (Level 2)
3.6 Tested on non-development store (dev stores bypass scoping)

### 4. DATA SECURITY

4.1 Tokens encrypted at rest (secrets manager, not config files)
4.2 No secrets in client-side code (HTML, JS, frontend bundles)
4.3 All connections over HTTPS/TLS
4.4 Webhook HMAC signatures validated; 401 returned for invalid signatures
4.5 No PII or tokens in log output
4.6 Secrets stored via platform secrets manager (e.g., wrangler secret put)

### 5. GDPR / PRIVACY COMPLIANCE

5.1 customers/data_request webhook handler — returns all stored data for customer
5.2 customers/redact webhook handler — deletes/anonymizes customer personal data
5.3 shop/redact webhook handler — deletes all customer data 48h after app uninstall
5.4 All handlers accept POST with JSON body (Content-Type: application/json)
5.5 All handlers validate HMAC and return 401 for invalid signatures
5.6 All handlers return 200-series response
5.7 Privacy policy URL exists and is linked from app listing
5.8 Privacy policy covers: data collected, how used, retention period, storage location, contact info
5.9 Only necessary data collected (data minimization)
5.10 Data deleted when no longer needed

### 6. APP STORE LISTING

6.1 App name — unique, no "Shopify" in name
6.2 App icon — 1200x1200px, JPEG or PNG
6.3 App card subtitle — concise value prop, no keyword stuffing
6.4 App details — clear functionality explanation
6.5 Screenshots — 1600x900px (16:9), 3-6 minimum, showing actual UI
6.6 Screenshots show unique views (no duplicates or near-identical images)
6.7 No Shopify trademarks in graphics
6.8 No reviews/testimonials in listing content
6.9 Demo screencast — English or English subtitles, shows onboarding + features
6.10 Test credentials included and functional
6.11 Emergency contact email and phone provided
6.12 Contact email does not contain "Shopify"
6.13 Geographic requirements noted (if applicable)
6.14 Category correctly set

### 7. BILLING

7.1 All charges use Shopify Billing API (no external payment processing)
7.2 Billing tested with "test": true on dev store
7.3 "test": false set before submission
7.4 Merchants can upgrade/downgrade without reinstalling
7.5 Enterprise pricing referenced in "Description of additional charges"

### 8. APP FUNCTIONALITY

8.1 Uses Shopify checkout (no offsite checkout bypass)
8.2 Directs to Shopify Theme Store (no theme downloads)
8.3 Factual information only (no fake data)
8.4 Unique app (not duplicate of another you published)
8.5 Single-merchant storefront (marketplaces must be Sales Channels)
8.6 No upselling via admin UI extensions or admin links
8.7 Max modal only launches on merchant interaction
8.8 App loads quickly; minimal storefront/checkout performance impact
8.9 API rate limits handled with retry + backoff
8.10 Webhook handlers are idempotent

### 9. WEBHOOKS & SYNC

9.1 Webhooks registered via GraphQL webhookSubscriptionCreate (not legacy REST)
9.2 HMAC verified on all webhook payloads
9.3 Handlers tolerate unknown fields (forward-compatible)
9.4 Handlers respond 200 within 5 seconds; heavy work done async
9.5 Subrequest limits respected (Cloudflare: 50 per invocation)

### 10. POST-LAUNCH

10.1 API version current (not deprecated/sunset)
10.2 Test credentials kept up to date
10.3 App functionality matches listing description
10.4 Monitoring: webhook delivery, function execution, error rates (Dev Dashboard)
10.5 Scope changes deployed via shopify app deploy

---

## Key Dates

- Feb 2025: Scopes reviewed for necessity on every submission
- Dec 2025: Protected customer data scopes enforced for web pixels
- Apr 1, 2026: Expiring offline tokens mandatory for new public apps
- Mar 2026: RBAC for partner orgs; clearer image standards
- Apr 2026: New submission experience with AI self-review

## How to Use This File

```
Prompt: "Audit my Shopify app against these requirements. Here is my codebase: [paste or attach files]. For each numbered requirement, output PASS/FAIL/REVIEW with a one-line explanation."
```

Source: https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements
Last updated: May 2026
