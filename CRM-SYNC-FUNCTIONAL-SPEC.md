---
title: "CRM Sync — Functional Specification"
description: "Document ID: CRM-SYNC-FUNC-SPEC-001 Version: 1.0 Date: 2026-07-12 Status: Active Classification: Public"
canonical: https://persephonepunch.github.io/crm-sync-setup/crm-sync-functional-spec.html
category: "Specs"
date: 2026-07-12
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CRM-SYNC-FUNCTIONAL-SPEC.md
---
# CRM Sync — Functional Specification

**Document ID:** CRM-SYNC-FUNC-SPEC-001
**Version:** 1.0
**Date:** 2026-07-12
**Status:** Active
**Classification:** Public
**Supersedes:** [Omen — Functional Specification & UAT Release Plan](https://persephonepunch.github.io/crm-sync-setup/functional-spec.html) (CRM-FUNC-SPEC-001) as the canonical specification for the CRM Sync product

---

## 1. Executive Summary

CRM Sync is a multi-tenant server-side customer relationship management SaaS (~9,400 lines, single-file Cloudflare Worker, 78 routes) that synchronizes user identity, consent, segmentation, and campaign tags across seven integrated services. Product display and cart/checkout are handled externally by Shopify Web Components and a PIM grid worker (`cf-worker-webflow-sync`), keeping this worker focused on CRM, consent, and identity. The system operates with tri-directional data flow between Shopify (commerce), Xano (database), Webflow CMS (content), Google Analytics GA4 (measurement), Adobe Experience Platform (CDP), Resend (transactional email), and a Webflow-embedded frontend. It is a registered Shopify App and Webflow Marketplace App, subject to both platforms' submission and compliance requirements. The system supports multiple tenants (Shopify shops) with isolated KV-backed configuration.

### 1.1 Commercial Model

CRM Sync is sold as a **$90 one-time license**. The deliverable is a **PWA download plus a password to the shared environment**. Consulting and companion applications are sold separately on a subscription basis.

| Offer | Type | Price | Deliverable |
|---|---|---|---|
| **CRM Sync** | One-time license | $90 | PWA download + password to the shared environment |
| **Consulting** | Subscription | Priced separately | Ongoing implementation and operations guidance |
| **PIM Sync** (and other companion applications) | Shopify App subscription | Priced separately | Product/catalog sync installed per store |

### 1.2 Deployment Environment

| Component | Platform | Identifier |
|---|---|---|
| Setup Wizard | Cloudflare Workers | [`crm.story-story.ai/setup`](https://crm.story-story.ai/setup) |
| Backend Worker | Cloudflare Workers | `cf-worker-crm-sync` |
| Database | Xano | `xerb-qpd6-hd8t.n7.xano.io` |
| Commerce | Shopify Admin API | Per-tenant (e.g., `hx-stage.myshopify.com`) |
| CMS | Webflow CMS API v2 | Per-tenant (e.g., `omenphase1-1.webflow.io`) |
| Analytics | GA4 Measurement Protocol | Per-tenant (e.g., `G-S7QGFWPZ8X`) |
| CDP | Adobe Experience Platform | Per-tenant AEP streaming via `dcs.adobedc.net` |
| Email | Resend API | `story-story.ai` domain |
| Config Store | Cloudflare KV | `CRM_STATE` (tenant-prefixed keys) |
| Access Control | Cloudflare Zero Trust | `kcoop.cloudflareaccess.com` |

---

## 2. Scope & System Boundaries

**In scope for this worker (`cf-worker-crm-sync`):**

- User identity, consent, segmentation, and campaign-tag synchronization across the seven integrated services
- Multi-tenant configuration isolation (KV, tenant-prefixed keys) and per-tenant credentials
- Consent-gated server-side analytics (GA4 Measurement Protocol, Consent Mode v2) and AEP streaming with SHA-256-hashed PII
- Entitlements, capability caps, and agentic-commerce authorization (A2A/AP2 mandates)
- Transactional email (Resend), GDPR/CCPA webhooks, right-to-erasure, and data portability

**Out of scope (delivered by companion systems):**

- Product display, cart, and checkout — Shopify Web Components + the PIM grid worker (`cf-worker-webflow-sync`)
- Product/catalog synchronization — **PIM Sync** (subscription Shopify App)

---

## 3. Subsystem References

The engineering detail for subsystems carried forward from the Omen build is documented once, in the [Omen functional specification](https://persephonepunch.github.io/crm-sync-setup/functional-spec.html), and is not restated here:

| Subsystem | Omen spec section |
|---|---|
| Token lifecycle management (Shopify expiring tokens, grants, self-heal) | §3.14 |
| Data entitlement, consent engine & enterprise add-ons | §3.16 |
| Multi-tenant scaling conventions & forward-deploy harness | §3.17 |
| Modular build strategy & dynamic data loops | §2.5, §3.18 |
| Chatbot FAQ answer cascade | §3.19 |
| Cost architecture (token-maxing resolution) | §3.20 |
| Agency → client deploy handoff & Interactive Key Ceremony | §13 |
| Globalized commerce — agentic settlement layer | Payments surface + Glossary |

---

## 4. Provenance

This document supersedes the Omen functional specification as the canonical CRM Sync product spec. The Omen document (revision history 1.0–1.20) is preserved unmodified as the engineering record of that build, including its original three-tier subscription pricing, which does not apply to CRM Sync.
