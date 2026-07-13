---
title: "CRM Sync — Migration Guide: CSV & Legacy Tools → Connected Streams"
canonical: https://persephonepunch.github.io/crm-sync-setup/docs/MIGRATION-GUIDE.md
category: "General"
date: 2026-07-13
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/docs/MIGRATION-GUIDE.md
---
# CRM Sync — Migration Guide: CSV & Legacy Tools → Connected Streams

**For:** Marketing ops, analytics teams, and CRM administrators planning the transition
**Date:** 2026-05-18

---

## The Problem

Your team is likely still using some combination of these workflows:

- **Exporting customer CSVs from Shopify** and uploading them to your CRM, email platform, or analytics tool
- **Running Google Analytics on Universal Analytics settings** that stopped processing data in July 2024
- **Using OneTrust or a similar consent tool** that only manages cookies in the browser — with no way to verify consent on the server side
- **Importing customer lists into Klaviyo, HubSpot, or Salesforce** via spreadsheet upload
- **Tracking conversions by page URL** (/thank-you, /signup-complete) instead of actual events

Each of these workflows has a common flaw: **no consent enforcement, no audit trail, and no automatic propagation when something changes.** If a customer asks to be deleted, you have to manually find and remove their data from every spreadsheet, every CRM, every analytics platform. If consent changes, the CSV you exported yesterday is already stale.

Google, Shopify, and regulators are all moving to enforce this. The deadlines are not future — most have already passed.

---

## What's Already Changed

| Change | When | Impact |
|--------|------|--------|
| Universal Analytics stopped processing data | July 2024 | UA-shaped exports contain no new data. Any workflow built on UA goals, custom dimensions, or page-view conversions is dead. |
| Google requires consent_mode v2 in EEA | March 2024 | Ads campaigns without the four new consent signals lose remarketing and conversion tracking |
| Shopify Customer Privacy API required for new apps | 2025-2026 | Apps that don't implement consent signaling will be rejected from the App Store |
| Google Merchant Center moving to server-side feeds | 2025-2026 | CSV product feeds are being deprecated for most categories |
| GDPR enforcement increasing for "consent laundering" | 2026 onward | Importing contacts without verifiable consent is a regulatory target |

---

## What Needs to Migrate

### Google Analytics: Page Views → Events

Google Analytics 4 fundamentally changed how conversions work. This affects every tool that reports on conversions:

| Old Way (Universal Analytics) | New Way (GA4) | What Breaks |
|------------------------------|---------------|-------------|
| Track conversions by URL path (/thank-you) | Track conversions by event name (purchase, sign_up) | Any tool that counts conversions by page URL stops working |
| Set conversion value once (static) | Value is on each event (dynamic) | CSV-imported static goal values don't exist anymore |
| Session-based attribution (last click) | Event-based, data-driven attribution | CRM systems importing UA session data need to import GA4 event data instead |
| 2 consent signals (basic/advanced) | 4 consent signals (ad_storage, analytics_storage, ad_user_data, ad_personalization) | Consent banners must emit all four signals or lose ad functionality |

### Consent: Browser Cookies → Server-Side Records

| Old Way | New Way | Why |
|---------|---------|-----|
| OneTrust sets a cookie in the browser | CRM Sync stores consent in the database (Xano) | Cookies get cleared. Server-side consent persists. |
| Consent state lives in the browser only | Consent state is verified on the server before any data is sent | An AI agent or automated system can check consent via API — you can't check a cookie from a server |
| Consent changes don't propagate | Consent change → all connected platforms notified in the same request | When a customer opts out of marketing, Klaviyo, HubSpot, and GA4 all know immediately |
| No audit trail of consent changes | Every consent change logged with timestamp, source, and which systems were notified | Required for GDPR Art. 15 (right of access) and Art. 30 (records of processing) |

**Note:** CRM Sync doesn't replace your consent banner (OneTrust or similar). It replaces the server-side consent enforcement that your banner doesn't provide. Your banner tells the browser what's allowed. CRM Sync tells the server what's allowed.

### Customer Data: CSV Export/Import → Connected Streams

| Old Way | New Way | Why |
|---------|---------|-----|
| Export customers.csv from Shopify | Real-time webhook + sync every 15 minutes | Max data staleness = 15 minutes, not hours/days |
| Upload CSV to HubSpot / Salesforce / Klaviyo | Connected stream pushes data when it changes | No manual step, no stale data, no duplicate contacts |
| No consent check on CSV import | Every data push checks consent before sending | "Consent laundering" (importing contacts without verified consent) is a growing regulatory target |
| No record of what was sent where | Every outbound push logged per platform | You can answer "which systems have this customer's data?" instantly |
| No deletion propagation | GDPR deletion handler removes data from all connected systems | Customer requests deletion → all platforms notified automatically |

---

## Impact on Specific Tools

### Matrixify (formerly Excelify)

**What it does:** Bulk import/export Shopify data via CSV/Excel.

**What to keep:** Product bulk operations (that's PIM Sync's domain, not CRM Sync).

**What to replace:** Customer data exports and imports. Matrixify CSVs have no consent enforcement, no audit trail, and customer PII sitting in your Downloads folder. Replace with CRM Sync's authenticated API endpoints that check consent before every data transfer.

### OneTrust (and similar consent platforms)

**What to keep:** The consent banner UI that customers see and interact with.

**What to augment:** Server-side consent enforcement. OneTrust manages the user experience. CRM Sync manages the truth — storing consent in the database, checking it before every data push, and logging every change.

### HubSpot / Salesforce / Klaviyo CSV Imports

**What to replace:** All CSV-based customer imports. Each platform gets a connected stream through CRM Sync that:
- Checks consent before sending any data
- Deduplicates contacts (no more duplicate records from email case differences)
- Logs every transfer
- Propagates deletions when a customer requests removal

### Google Merchant Center CSV Feeds

**What to replace:** Manual CSV product feeds. Use Shopify's Google & YouTube channel (server-side sync) or CRM Sync's connected stream infrastructure for custom feeds.

### UA Goal-Based Reporting (Looker, Tableau, Custom Dashboards)

**What to replace:** Any dashboard that queries Universal Analytics goal data. There is no migration path — UA goals are structurally incompatible with GA4. Dashboards must be rebuilt on GA4 event data.

---

## Decision Matrix

| Legacy Tool | Keep / Replace / Augment | Rationale |
|-------------|-------------------------|-----------|
| **Matrixify** | Replace (for customer data) | No consent enforcement, PII in CSVs. Keep for product bulk ops only. |
| **OneTrust** | Augment | Keep the banner. Add server-side consent enforcement via CRM Sync. |
| **HubSpot CSV Import** | Replace | Use connected stream. Consent-gated, logged, deduplicated. |
| **Salesforce Data Loader** | Replace | Use connected stream. No flat-file PII. |
| **Klaviyo CSV List Import** | Replace | Use connected stream. Email consent verified per subscriber. |
| **Google Merchant CSV Feed** | Replace | Use Shopify's Google channel or Content API. |
| **UA Goal-Based Reporting** | Replace | Rebuild on GA4 events. No migration path. |
| **Shopify Customer CSV Export** | Replace | Use authenticated API endpoint. No PII in downloads. |

---

## Implementation Timeline

| Phase | Timeline | What Happens |
|-------|----------|-------------|
| **Phase 1** | Week 1-2 | Upgrade consent banner to GA4 consent_mode v2. Add audit logging. Rate limit auth endpoints. |
| **Phase 2** | Week 3-4 | Build connected stream infrastructure. Add per-platform sync logging. UCP dashboard shows sync history. |
| **Phase 3** | Week 5-8 | Connect enterprise platforms (Salesforce, Klaviyo, HubSpot, Braze, Attentive). |
| **Phase 4** | Week 9-10 | Deprecate CSV imports. Archive UA references. Complete compliance certification. |

---

## The Bottom Line

Organizations still using CSV workflows for customer data are accumulating compliance debt with each passing month. The page-view conversion schema is already dead. The consent requirements are already enforced. The question is not whether to migrate, but how much process debt to carry forward.

CRM Sync replaces manual, file-based, consent-blind data handoffs with authenticated, logged, consent-aware connections — and every new platform you add inherits the same protections automatically.

---

*Technical reference: [FEATURE-SPEC-UA-MIGRATION.md](FEATURE-SPEC-UA-MIGRATION.md)*
