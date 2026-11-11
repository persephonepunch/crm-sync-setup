---
title: "Build Over Buy"
description: "Move off fee-based Shopify plugins to a Cloudflare, Xano and Webflow build, using Shopify's 1 January 2027 token deadline as the moment: key rotation, bindings, consent, regulation by market, and what is already built."
canonical: https://persephonepunch.github.io/crm-sync-setup/BUILD-OVER-BUY.md
category: "Shopify"
date: 2026-11-11
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/BUILD-OVER-BUY.md
licence: CC-BY-4.0
tags:
  - shopify
  - tokens
  - key-rotation
  - consent
  - architecture
keywords:
  - build over buy
  - Shopify expiring offline tokens
  - January 1 2027 Shopify deadline
  - Shopify IP allowlist
  - key ceremony
  - Cloudflare bindings
  - Xano system of record
---

# Build Over Buy

**Read the full playbook: [Build Over Buy](https://claude.ai/artifact/3ooeS962TpwgeQh1A8HJWX)** (English and Korean).

Shopify public apps that still use non-expiring offline tokens are delisted on 1 January 2027, and their Admin API calls fail with 403 from 1 April 2027. The playbook uses that deadline as the moment to move off fee-based plugins to a build on Cloudflare, Xano and Webflow, one vendor at a time, with each vendor's history mirrored first.

## What it covers

- **The deadline and the migration:** what breaks on 1 January and 1 April, and the IP allowlist dates for public apps.
- **Key rotation and the key ceremony:** how keys rotate between Cloudflare (Worker secrets, KV, signing keys) and Xano (console keys, Auth Me, entitlements), with a diagram.
- **Why some credentials break against Shopify:** a `.env` file on disk, an SAP permanent token or Salesforce long-lived auth, and when middleware such as SAP CPI or MuleSoft handles client credentials fine.
- **Bindings instead of keys:** Cloudflare's binding model, React Router 7 passing bindings to loaders, and why classic Prisma's compiled engine didn't fit Workers.
- **Race conditions in a 15-minute middleware cycle,** and idempotent Xano functions as the fix.
- **Consent, regulation by market, Korea, CRM platforms, ERP, and the Merchant API v1 migration.**
- **What's built:** one dated checklist of what runs in production and what's still open.

## Related

- [Middleware vs AI Architecture](MIDDLEWARE-VS-AI-ARCHITECTURE.md)
- [Shopify Expiring Token Management](SHOPIFY-TOKEN-MANAGEMENT.md)
- [Decision ladder spec](RMA-LADDER-SPEC.md)
