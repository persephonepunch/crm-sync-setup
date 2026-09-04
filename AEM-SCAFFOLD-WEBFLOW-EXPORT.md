---
title: "Shopify / Google Integration on an AEM Scaffold — via Webflow Export"
description: "How the Shopify + Google integration ships onto an Adobe Experience Manager estate: the Webflow export as the page scaffold, worker embeds as the behavior layer, and an either/or substrate election (Cloudflare or Adobe/Azure) — beside AEM, never inside it."
canonical: https://persephonepunch.github.io/crm-sync-setup/aem-scaffold-webflow-export.html
category: "Specs"
date: 2026-08-02
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/AEM-SCAFFOLD-WEBFLOW-EXPORT.md
licence: CC-BY-4.0
---
# Shopify / Google integration on an AEM scaffold — via Webflow export

**What this is:** how the Shopify + Google integration ships onto an Adobe
Experience Manager estate, using the Webflow export as the page scaffold.

**What you can decide after reading it:** whether to adopt the scaffold path,
and which substrate election (Cloudflare or Adobe/Azure) your paper already
supports.

**Companions** (referenced, not restated): [the trust framework](./trust-framework.html),
[Cybersecurity for AI](./cybersecurity-for-ai.html), and
[the key ceremony](./key-rotation-123.html).

---

## 1. Premise

AEM owns the glass: content authoring, templates, Adobe-managed delivery. It
never holds identity, consent, or commerce credentials.

The integration ships **beside it, never inside it** — a substrate AEM does
not have and was not built to have:

> **Rows decide. The gate serves. The ledger remembers. JWKS verifies.**

That grammar appears once in this doc, here. Every section after this one is
an application of it.

Declared non-goal, up front: this is not an ESB replacement. It can feed an
existing ESB; it does not duplicate one (§8).

---

## 2. The scaffold pipeline — Webflow → vanilla export → AEM

```
Webflow (author)  →  vanilla HTML/CSS export  →  AEM templates + clientlibs  →  embeds layer on
```

The load-bearing claim: **behavior never lived in the Webflow runtime**, so
the export loses nothing. Interactions, CMS bindings, and Webflow.js were
never load-bearing; all app behavior is served from worker-hosted embeds that
are framework-agnostic by construction. The export is markup and stylesheet —
exactly the two things AEM wants to own as content.

| Webflow artifact | AEM artifact |
|---|---|
| Page / section markup | Page template, HTL / Core Component wrapping the exported block |
| Compiled first-party CSS (one file, shared across platforms) | Clientlib |
| Head custom-code slot | Template head: `stack-loader.js` first, then chrome loaders |
| Worker embeds (login, consent, nav, footer) | Unchanged — same script tags, same worker origin |

Rule carried over from every other surface: **embed, not iframe.** The blocks
mount on the host page's origin, because the session contract (§5) reads
first-party storage.

Invariant this section ends on: the scaffold is disposable; the embeds are
not. Re-export, re-theme, or rebuild the AEM templates and nothing
security-relevant moves.

---

## 3. The Shopify socket

| Field | Value |
|---|---|
| OAuth authority | **Xano ↔ Shopify**, brokered by the worker. Not an AEM integration, not a Webflow Data Client. |
| Token lifecycle | Per-tenant short-lived Admin tokens, auto-refreshed before expiry, auto-migrated from legacy non-expiring grants. Survives Shopify's expiring-token mandate with no merchant action. |
| Surface mounting | Worker-served blocks / Web Components on AEM pages: product data, cart, checkout handoff to Shopify checkout. |
| Conversion close | Order webhook → worker → row. The purchase lands in the ledger, not in a nightly batch. |

**Hard precondition — the consent bridge.** AEM is a headless surface, and
every headless surface wires `setTrackingConsent` before any tracking or cart
call. No consent signal, no fire. This is the one integration step that is
not optional and not deferrable.

Invariant: no Shopify credential is ever present in AEM, the page, or the
transport. The socket terminates in Xano; the page sees only its own session.

---

## 4. The Google socket

| Field | Value |
|---|---|
| OAuth authority | **Xano ↔ Google** ("Continue with Google" → worker callback). The consent a user approves is Google's sign-in — not AEM's, not Webflow's. |
| Signals | GA4 + Consent Mode v2. Conversion tags are consent-gated and revenue-weighted; Smart Bidding bids on a consented, flagged, real-revenue conversion. |
| Segmentation | One segment definition drives both activations — email and bidding — so the definitions cannot drift apart. |

Boundary statement: **analytics reads, never decides.** BigQuery and
predicted-LTV modeling sit downstream of the ledger and stay off the
authorization path. Nothing in the analytics plane can grant, revoke, or
transact.

---

## 5. The substrate contract — what AEM doesn't have

Three pieces, identical on AEM, Shopify, Webflow, or a packaged PWA:

- **Session contract.** Three keys — token, timestamp, user — plus one change
  event the embeds broadcast and subscribe to. Any surface that can hold
  first-party storage can hold a session.
- **Entitlement rows.** A grant is a row: subject × capability × asset.
  **Grant = insert. Revoke = delete. Audit = SELECT.** Agents are first-class
  subjects under scoped, revocable mandates — the same row shape as a human.
- **Verification.** Proofs verify against `/.well-known/jwks.json` on the
  customer's own domain.

Invariant: the JWKS endpoint is the piece that never moves — not in a
re-platform, not in a substrate election, not in a vendor exit.

---

## 6. Substrate election — either/or, never hybrid

The identical grammar runs on either substrate. An enterprise picks one; it
is a decision, not a migration project.

| Layer | Cloudflare (live today) | Adobe/Azure constellation |
|---|---|---|
| Delivery | Cloudflare CDN | Adobe-managed Fastly (bundled with AEM CS) |
| Gate + signer | Worker, WebCrypto Ed25519 | Own Fastly Compute service, Fastly Secret Store |
| State | Workers KV | Fastly KV Store |
| Payloads | R2 | R2 stays (S3-compatible, ciphertext, free egress) or Fastly Object Storage |
| System of record | Xano (hosted) | Xano Enterprise on the customer's Azure tenancy (AKS) — beside AEM CS, never inside it |
| Proofs | JWKS on owned domain | Same — no paper moves |

Procurement reading of that table: almost every row lands on paper that
already exists — the Adobe bundle, the Azure commitment. The one new
agreement is the Fastly Compute + Secret Store service. The proofs row needs
no paper at all.

EdDSA is substrate-neutral: certificates minted on either edge verify with
the same client code. The `kid` is the only trace of which edge signed.

---

## 7. Delivery phases

| Phase | Entry criteria | What works after it | Still absent |
|---|---|---|---|
| **1. Static scaffold** | Webflow export in hand | AEM pages render the full design — templates + clientlibs, zero behavior | Login, consent, commerce |
| **2. Substrate layer** | Worker origin reachable; tenant configured | Login, consent modal, nav, session contract live on AEM templates | Commerce, signals |
| **3. Commerce + signals** | Consent bridge verified; GA4 property + CMv2 confirmed | Shopify blocks transact; consent-gated tags feed Smart Bidding; conversions close to rows | Nothing — this is the operating state |
| **4. Substrate election** | Optional; enterprise paper review | Same system on Cloudflare or the Adobe/Azure constellation | — |

Phase 4 is deliberately last and deliberately optional: the election changes
where the gate runs, not what the system does.

---

## Demonstrated — phases 1–3 on a live AEMaaCS tenancy

Run on 2026-08-02 against an AEM as a Cloud Service environment (Edge
Delivery + Universal Editor, xwalk boilerplate). Not a mockup — the
adoption path above, executed:

![The point-of-difference grid and the consent plane, served by AEM Edge Delivery](https://crm-sync.dev/kb/media/docs/aem-front-live.png)

- **Scaffold (§2):** the point-of-difference card grid — the same section
  that runs on [the Shopify store](https://www.crm-sync.dev/) and the
  Webflow site — shipped into the AEM repo as a block (markup, CSS, and a
  three-field content model), appeared in the Universal Editor's component
  palette, was authored as content, and published through Edge Delivery.
- **Substrate (§5):** `stack-loader.js` first in the page head, footer
  embed deferred. On the AEM origin, the worker injected the footer, the
  login host, and the consent banner (Accept All / Customize / Reject);
  the session-contract and modal APIs came up; the brand plane served the
  theme CSS and self-hosted fonts. Tenant resolution came from one
  origin-to-shop pair on the worker.
- **Identity (§5), signed in:** a real login on the AEM origin — the
  account menu and the **Choose-your-view** role picker (CISO/DPO,
  Designer, Revenue BA, QA/Compliance, Release Manager…) rendering as a
  headless modal on Adobe's glass. Separation of duties, served by the
  worker, no AEM-side identity anywhere:

![The Choose-your-view role picker — the entitlement plane — on the AEM page](https://crm-sync.dev/kb/media/docs/aem-choose-your-view.png)

- **Boundary held:** no AEM credential, key, or secret exists anywhere in
  the exchange. The environment was a stock 30-day trial; everything
  durable lives in git.

For comparison, the same section on the Shopify store:

![The same card grid on the Shopify storefront](https://crm-sync.dev/kb/media/docs/store-home-cards.png)

---

## 8. Boundaries

- **No standing credentials** in AEM, the page, or the transport. There is
  nothing in the middle worth taking; relays and CDNs are verifiably empty.
- **AI Data Transport, not an ESB.** An ESB holds standing credentials to
  every connected system and orchestrates messages between them. This holds
  none, dissolves authority into individually revocable rows, and can feed an
  ESB that already exists.
- **AEM authors content. It never authors identity.**

---

## Appendix — glossary

| Term | Meaning |
|---|---|
| Mandate | A scoped, revocable authorization under which an agent acts |
| Entitlement row | subject × capability × asset; the unit of grant, revocation, and audit |
| Consent bridge | The wiring that lands the user's consent state on a headless surface before any tracking or cart call |
| stack-loader | The first script in the head; advertises and loads the behavior planes a surface uses |
