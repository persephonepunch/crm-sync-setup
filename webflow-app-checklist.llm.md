---
title: "Webflow App Requirements — LLM Audit Prompt"
description: "Feed this file to any LLM (Claude, GPT, Gemini) along with your codebase to get an automated compliance audit against current Webflow Marketplace requirements (May 2026)."
canonical: https://persephonepunch.github.io/crm-sync-setup/webflow-app-checklist.llm.md
category: "General"
date: 2026-07-13
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/webflow-app-checklist.llm.md
---
# Webflow App Requirements — LLM Audit Prompt

> Feed this file to any LLM (Claude, GPT, Gemini) along with your codebase to get an automated compliance audit against current Webflow Marketplace requirements (May 2026).

## Instructions for the LLM

You are auditing a Webflow app for Marketplace submission readiness. Evaluate the codebase against every requirement below. For each item, respond with one of:

- PASS — evidence of compliance found in code
- FAIL — violation detected; cite the file and line
- REVIEW — cannot determine from code alone; explain what to check manually

Output a summary table first, then details for FAIL and REVIEW items only.

---

## Requirements

### 1. APP REGISTRATION & CONFIG

1.1 App registered in Workspace Settings > Apps & Integrations > Develop
1.2 webflow.json exists with valid `name` and `apiVersion: "2"` (Designer Extensions)
1.3 App name does not exceed 30 characters
1.4 Client secret not hardcoded in source files
1.5 Redirect URI configured and uses HTTPS
1.6 OAuth scopes are minimum required (principle of least privilege)
1.7 Installation URL set for Data Client / Hybrid apps

### 2. AUTHENTICATION & TOKENS

2.1 OAuth uses Authorization Code Grant flow
2.2 Authorization URL is `https://webflow.com/oauth/authorize`
2.3 Required parameters sent: client_id, response_type=code, redirect_uri, scope
2.4 `state` parameter included for CSRF protection
2.5 Token exchange via POST to `https://api.webflow.com/oauth/access_token`
2.6 Authorization code treated as single-use (not reused)
2.7 Access tokens stored securely (database/env vars, not plain text)
2.8 Tokens never exposed in client-side code (HTML, JS, frontend bundles)
2.9 Token revocation implemented via POST to revoke endpoint
2.10 Scopes in OAuth URL match or are subset of app settings

### 3. SECURITY

3.1 Client secret stored via environment variables or secrets manager
3.2 All API calls use HTTPS
3.3 Webhook HMAC signatures verified (SHA-256 with client_secret)
3.4 Webhook timestamp validated within 5 minutes (300,000ms)
3.5 HMAC computed over `timestamp:request_body` format
3.6 Webhooks return HTTP 200 to acknowledge receipt
3.7 No `eval()` statements in Designer Extension code
3.8 No direct DOM manipulation in Designer Extension
3.9 No excessive global variables
3.10 No externally hosted iframes except for authentication
3.11 CSS scoped/namespaced to prevent conflicts with Webflow styles
3.12 Only official Webflow APIs used (no separate manipulation packages)
3.13 CORS policies properly implemented

### 4. PRIVACY & DATA COMPLIANCE

4.1 Privacy Policy URL exists and is accessible
4.2 Terms of Service URL exists and is accessible
4.3 Privacy policy covers: data collected, usage, storage, transfers, contact info
4.4 Sensitive data encrypted at rest and in transit
4.5 Consent requested before collecting personal data
4.6 Only necessary data collected (data minimization)
4.7 No unauthorized use of trademarks, logos, or copyrighted materials
4.8 No offensive, insensitive, or illegal content

### 5. APP LISTING ASSETS

5.1 App name — max 30 characters, unique
5.2 Short description — max 100 characters, action-oriented
5.3 Long description — max 10,000 characters, Markdown, no hyperlinks
5.4 Feature list — max 5 items
5.5 App logo — 900×900px, 1:1 ratio, logomark only (no text logotypes)
5.6 App avatar — 512×512px, 1:1 ratio
5.7 Publisher logo — 20×20px
5.8 Screenshots — 1280×846px, minimum 4, showing actual workflows
5.9 Screenshots consistent styling, readable text
5.10 Website URL, support email provided
5.11 All fees and pricing transparently disclosed
5.12 No ads displayed to users

### 6. DESIGNER EXTENSION QUALITY

6.1 Vertical layout — components stacked vertically
6.2 Full-width elements — buttons and inputs span panel width
6.3 No horizontal scrolling
6.4 Spacing in multiples of 4px
6.5 Sentence case for all text
6.6 No keyboard shortcuts to invoke app
6.7 Bundle size under 5MB
6.8 Relative asset paths used (e.g., `./styles.css`)
6.9 `webflow.notify()` used for user-facing errors
6.10 `webflow.canForAppMode()` checked before executing actions
6.11 Event listeners cleaned up when no longer needed

### 7. DATA CLIENT & API USAGE

7.1 API v2 used (not deprecated v1)
7.2 Version number included in write requests (September 2025+)
7.3 Rate limits handled — retry with backoff for 429 responses
7.4 Rate limit headers monitored (X-RateLimit-Remaining, Retry-After)
7.5 Site publish limited to 1 per minute
7.6 Webhooks used instead of polling where possible
7.7 Max 75 webhooks per trigger type respected
7.8 Webhook handlers are idempotent
7.9 Standard HTTP error codes handled (400, 401, 404, 429, 500)
7.10 App does not crash on API errors (graceful degradation)

### 8. SUBMISSION READINESS

8.1 2FA enabled on workspace admin account
8.2 All backend services operational and accessible
8.3 OAuth flow works end-to-end (approve and deny paths)
8.4 Demo account with all features enabled
8.5 Demo video prepared (2-5 min, shows OAuth flow for Data Client/Hybrid)
8.6 Test credentials functional
8.7 Error handling complete with helpful messages
8.8 One developer account only (no duplicates)

### 9. POST-LAUNCH

9.1 API version current (v2, not deprecated)
9.2 Version numbers in write requests
9.3 Performance monitored and issues addressed
9.4 Support email responsive
9.5 Documentation reflects current functionality
9.6 App functionality matches listing description

---

## Key Dates

- Aug 2024: Apps using v1 auth delisted from Marketplace
- Mar 2025: Webflow API v1 fully deprecated
- Apr 2025: Webhook signature verification required for site tokens
- Sep 2025: Version numbers required in all write requests
- Late 2026: V1 endpoints scheduled for full removal

## How to Use This File

```
Prompt: "Audit my Webflow app against these requirements. Here is my codebase: [paste or attach files]. For each numbered requirement, output PASS/FAIL/REVIEW with a one-line explanation."
```

Source: https://developers.webflow.com/data/v2.0.0-beta/apps/docs/marketplace-guidelines
Last updated: May 2026
