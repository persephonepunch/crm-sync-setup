---
title: "Dawn → Horizon: Agentic Cart Functions"
description: "Migration guideline: move Dawn's client-side business logic to Horizon's thin presentation with cart, pricing, and checkout re-homed to server-side Shopify Functions and the Tool Runner — driveable by an agent under an AP2 mandate. Includes why REST→GraphQL and GA4 Consent Mode v2 are one seismic move, and the dated migration checklist."
canonical: https://persephonepunch.github.io/crm-sync-setup/dawn-horizon-ga4.html
category: "Shopify"
date: 2026-06-24
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/DAWN-HORIZON-GA4.md
---
# Dawn → Horizon: Agentic Cart Functions

**Migration guideline · storefront.** Move the legacy Dawn storefront (business logic in client JS + Script Editor) to Horizon's thin, blocks-native presentation — with cart, pricing, and checkout logic re-homed to server-side Shopify Functions and the Tool Runner, driveable by an agent under an AP2 mandate.

**Immovable clock.** Shopify's Script Editor is removed as of **2026-06-30**. Any reorder/hide-payment, shipping, or line-item-discount Script still live means checkout logic has **silently stopped**. Checkout-touching work and the Scripts→Functions conversion are the urgent thread — do these before the broader theme rebuild.

## The clock, in full

Every date below is an obligation that assumes the evidence already exists when it arrives.

| Date | What changes |
|---|---|
| **2018** | *Wayfair* (585 U.S. 162) makes tax borders real; GDPR makes consent law. The mandates begin. |
| **May 2022** | Omnibus Directive applies: 30-day price evidence per market — a ledger obligation, not a lookup. |
| **2023** | Netflix paid sharing: the first mass entitlement retrofit — built for the fee, not the subject. |
| **March 2024** | Consent Mode v2 becomes mandatory for EEA conversion measurement — the stack's first enforced consent coordinate. |
| **June 2024** | FTC v. Adobe filed: subscription exit dark patterns reach federal court. |
| **October 2024** | Shopify's REST Admin API goes legacy: GraphQL required for new apps; the schema grows weekly. |
| **June 15 2026** | Google Signals retired as a control — Consent Mode `ad_storage` becomes the sole control of the GA4 → Google Ads flow. |
| **June 30 2026** | Shopify Script Editor removed — surviving payment, shipping, and discount Scripts stop silently. |
| **August 2026** · *now* | EU AI Act Article 50 transparency obligations apply. Cloudflare Wallets launches. |
| **August 18 2026** | Content API for Shopping shuts down. |
| **September 2026** · *next month* | Cyber Resilience Act vulnerability-reporting obligations begin. |
| **February 2027** | Battery Digital Product Passport: the first product class where passport data is mandatory at the border. |
| **2027** | GS1 Sunrise 2027: retail point-of-sale worldwide expected to scan 2D barcodes. The GS1 Digital Link QR becomes the product's on-pack URL — one code carrying identity, passport, and evidence. |
| **December 2027** | Cyber Resilience Act applies in full — €15M or 2.5% of global turnover. |

Two of these are already behind us and are the ones most estates have not absorbed: since June 15 the consent signal *is* the ads data control, and since June 30 any un-migrated Script is a checkout rule that stopped without an error.

The same timeline, live and machine-readable (human table plus a JSON block any agent can parse): **[crm-sync.dev/pages/difference#calendar](https://www.crm-sync.dev/pages/difference#calendar)**

## Globalization and time are first-class in the new API

The Merchant API is not a rename of the Content API — it is a reshape, and the axes it adds are exactly the ones a single-border stack never had.

- **Time is scheduled, not assumed.** Data sources carry explicit fetch settings — `timeZone` (IANA, UTC by default), `frequency`, `dayOfWeek`, `dayOfMonth`, `timeOfDay` — so a feed states *when* it is true, per market, in a declared zone. A nightly job with an implicit server clock is no longer a description of anything.
- **Location is a declared axis.** Regions, regional inventory, and local inventory are separate resources; availability and price can differ per region without forking the catalog.
- **Prices changed shape.** `value: string` + `currency: string` becomes `amountMicros: int64` + `currencyCode` — a data-model change, not a rename, and the reason "just repoint the URL" migrations fail.
- **Identifiers consolidate.** Resource `name` strings replace separate IDs, and `customBatch` gives way to parallel async calls.

The consequence for a global estate: **time zone, region, language, and currency stop being feed columns and become coordinates**. A record that carries them can answer per market; one that doesn't has to be re-exported per market, forever. This is the same fusion argument as above, wearing the feed's clothes — machine-addressable *and* correctly qualified, or neither.

## GraphQL + GA4 signals — one seismic move, not two chores

Enterprises are forced through two migrations they treat as unrelated: **REST → GraphQL** (REST Admin API declared legacy October 2024; GraphQL required for new apps since April 2025) and **GA4 Consent Mode v2** (four signals — `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` — mandatory for EEA/UK ads features since March 2024). The recognition worth having: they are the *same* migration toward one thing — a **consent-gated, agent-addressable data plane**.

| Move | Delivers | Missing alone |
|---|---|---|
| REST → GraphQL | Typed, bulk, server-resolved data — machine-addressable | Reach without permission: the agent can query but not know what it may do |
| GA4 Consent Mode v2 | Consent as a first-class signal on every event | Permission without reach: data still un-queryable at scale |
| **Fused** | **Every datum machine-addressable AND consent-qualified** | — |

Neither migration delivers the agent-ready plane alone; the value is the fusion. (Since **June 15, 2026**, `ad_storage` is also the *sole* control over what GA4 sends to Google Ads — the consent signal is no longer a formality beside the pipeline, it is the valve.)

### The trust foundation the fusion rides on

- **Orthogonal trust** — consent and access are independent axes that compose without coupling; the agent carries zero inherited trust.
- **Hexagonal trust** — the GraphQL plane sits behind ports; every consumer (agent, GA4, ESB, CDP, storefront) crosses one consent-enforcing port.
- **Loop engineering** — the agent's query loop re-checks consent every iteration, fail-closed. Trust is re-earned per loop, never inherited.

**The enterprise unlock:** AI workflows that are *powerful* (reach all the data) and *safe* (consent lineage per loop). Most stacks force that trade-off; the fused plane removes it — and it coexists with an existing ESB/CDP rather than replacing them.

## Enforcement is a benefit — revenue, trust, reputation

Compliance and permissions are not a cost center or a checkbox. Enforced at the data plane — fail-closed, per-loop — they protect revenue, compound trust, and defend reputation.

| Benefit | Capability | Enforcement |
|---|---|---|
| Ad ROAS preserved | Consent Mode v2 signals keep measurement and remarketing lawful — lost consent = lost signal = wasted spend | Four signals required, fail-closed before analytics fire |
| Promotions run legally | Omnibus 30-day prior-lowest price — discount in the EU without "fake sale" exposure | Price-history ledger, read-gated |
| Market access retained | Data rights (opt-out, export, delete) — the price of selling in the EU or California at all | Wired to live endpoints, fail-closed |
| Safe delegation → new revenue | Scoped, revocable per-tenant tokens + capability permissions — sell to teams and agencies without exposure | Data-plane; revoke = instant 401 |
| Agentic revenue, no rogue-agent risk | AP2 mandate + agent permissions — autonomous purchase, safely | Per-loop re-check, fail-closed |
| Enterprise deals unlocked | PII-free audit trail — provable governance is what procurement requires before it can buy | Audit by construction |

**The reframe:** permissions enforcement converts compliance from risk and cost into revenue enablement and a trust asset. The governance is the reason the data is *safe to open* — which is the core offer: accessibility, made safe by construction.

## 1 · Why Horizon fits

Horizon is **blocks-first**: a `blocks/` directory, nested blocks via `{% content_for 'blocks' %}`, per-component `{% stylesheet %}` / `{% javascript %}`, no framework runtime. That posture — *thin presentation, logic pushed out* — is the native Shopify endpoint for a server-resolved stack, not a fight against it.

| Dawn coupling (what breaks) | The layer that absorbs it |
|---|---|
| Business rules in section `<script>` / Script Editor | Execution → Tool Runner (worker) + Shopify Functions |
| Cart / price math recomputed in the browser | Data plane → server-resolved (cart-transform / draft order) |
| Product data hardcoded in Liquid | Source of truth → hydrate from the PIM via GraphQL |
| Auth and gating in theme JS | Identity → JWE claim, derived server-side, never in Liquid |
| Brand look re-built per surface | Look → design-token sync; one theme.css keys every surface |

## 2 · Agentic cart functions — guideline

Two audiences hit the same cart: a **human** on the Horizon storefront and an **agent** acting under a mandate. The rule is that both cross the same server-side boundary — no logic path exists only in the browser.

### 2.1 · Script → Function replacement map

| Legacy Script (removed 2026-06-30) | Shopify Function | Runs at |
|---|---|---|
| Reorder / hide payment methods | `payment_customization` | checkout |
| Reorder / hide / rename shipping | `delivery_customization` | checkout |
| Line-item / order discount | `product_discount` / `order_discount` | cart + checkout |
| Bundle / merge / expand lines | `cart_transform` | cart |
| Block invalid carts | `cart_checkout_validation` | cart + checkout |

Functions are WASM, run server-side on Shopify's infrastructure, and are **deterministic and input-bounded** — which is exactly why an agent can be allowed to trigger them: the merchant's rules hold regardless of who or what filled the cart.

### 2.2 · The agentic cart path

`JWE claim` → `AP2 mandate (consent-to-purchase)` → `Tool Runner` → `add_to_cart` → `cart_transform + discount` → `agentic_checkout` → **Functions enforce**

The agent never asserts price, discount, or identity. It calls a *tool*; the tool decrypts the JWE claim, checks caps at the data plane, and submits a cart. Merchant Functions then apply pricing, payment, and shipping rules on the server — the same rules a human would hit. The AP2 mandate is the user's scoped, revocable authorization for the agent to transact, re-checked on each loop, fail-closed.

### 2.3 · Rules

1. **No money math in the browser.** Price, tax, discount, and shipping totals are server-resolved. Liquid renders the resolved number; it never computes it.
2. **One cart boundary for human and agent.** The Tool Runner's `add_to_cart`/`checkout` tools hit the same Cart/Checkout as the storefront — never a private, unguarded path.
3. **Agent authority = mandate, not session.** Authorization comes from the decrypted AP2 mandate plus caps, re-verified every tool call. A prior grant is never inherited across the loop.
4. **Deterministic rules live in Functions.** Anything that must hold for every cart (discounts, payment/shipping gating, bundle logic) is a WASM Function — not worker code, not theme JS.
5. **Orchestration lives in the Tool Runner.** Multi-step, stateful, or cross-system logic (PIM lookup, consent, settlement-rail choice) is a worker tool — Functions are input-bounded and side-effect-free.
6. **Catalog from the PIM, not Liquid.** PDP and collection hydrate via GraphQL; no product data hardcoded in templates.
7. **Consent gates the cart, not just analytics.** The AP2 mandate and Consent Mode v2 signals must be present before an agent transacts; absent consent = fail-closed.
8. **Present as Horizon blocks.** Cart, upsell, and PDP UI are theme blocks with per-component CSS/JS — thin presentation over server-resolved state, themed by synced design tokens.

## 3 · Migration checklist

Work top to bottom. Groups A–B are the hard-dated urgent thread; C–F are the broader spine.

**A · Step-0 audit (do first)**
- [ ] Inventory Script Editor scripts — every payment / shipping / discount Script becomes one row in group B.
- [ ] Grep the theme for inline `<script>` business logic — cart math, gating, price recompute, eligibility rules living in section/asset JS.
- [ ] Find REST calls and hardcoded catalog data — mark each for GraphQL + PIM hydration.
- [ ] List per-locale theme forks — route to edge translation instead of forked templates.

**B · Scripts → Functions (2026-06-30)**
- [ ] Payment Script → `payment_customization`
- [ ] Shipping Script → `delivery_customization`
- [ ] Discount Script → `product_discount` / `order_discount`
- [ ] Bundle / merge logic → `cart_transform`
- [ ] Cart guards → `cart_checkout_validation`
- [ ] Deploy Functions and confirm active on live checkout — verify each merchant rule fires with a real test cart, not just unit input.

**C · Agentic cart wiring**
- [ ] Tool Runner `add_to_cart` / `checkout` hit the same Cart API — no private agent-only path.
- [ ] AP2 mandate created, scoped, and revocable — bound to the JWE actor.
- [ ] Caps re-checked every tool call, fail-closed — trust re-earned per iteration, never inherited.
- [ ] Redact tokens and mandates from tool-call logs.

**D · Consent and signals**
- [ ] All four Consent Mode v2 signals emitted on every surface, headless included.
- [ ] Consent captured server-side with timestamp, method, and version — the banner is not the record.
- [ ] Declines logged and enforced at egress, not just in the browser.

**E · Data plane**
- [ ] Catalog hydrated from the PIM over GraphQL; no hardcoded product data in Liquid.
- [ ] REST calls retired ahead of the sunset; feeds ride the Merchant API from 2026-08-18.
- [ ] Price observations recorded so any markdown claim has a 30-day reference behind it.

**F · Presentation**
- [ ] Cart, upsell, and PDP rebuilt as Horizon blocks with per-component CSS/JS.
- [ ] Design tokens synced so the same brand keys Horizon and every other surface.
- [ ] Per-locale forks replaced with edge translation.

---

## See it running

Every claim in this guideline is demonstrable on a live store rather than described:

- **The calendar** — the dates above, rendered for humans and for machines from one array: [crm-sync.dev/pages/difference#calendar](https://www.crm-sync.dev/pages/difference#calendar)
- **Price evidence, fail-closed** — a real markdown with its 30-day window bounds, and a refusal where coverage is short: [crm-sync.dev/pages/omnibus](https://www.crm-sync.dev/pages/omnibus) · raw record: [`/pim/omnibus?handle=asset-sample-model`](https://crm-sync.dev/pim/omnibus?handle=asset-sample-model&shop=segment-data.myshopify.com)
- **The identity plane** — how a login binds accounts you already own, and why permissions are rows: [Trust With Login](https://persephonepunch.github.io/crm-sync-setup/trust-with-login.html)
- **The same records on another CMS** — the identical elements rendering on AEM, no data stored there: [trust-login](https://main--livelylynx76577--aemsitestrial.aem.live/trust-login) · [omnibus](https://main--livelylynx76577--aemsitestrial.aem.live/omnibus2)
- **Server-side or it didn't happen** — the doctrine behind the guideline: [the dev doc](https://persephonepunch.github.io/crm-sync-setup/server-side-or-it-didnt-happen.html)
- **Machine discovery** — what the estate advertises to agents: [`crm-sync.dev/stack/config`](https://crm-sync.dev/stack/config)
- **The whole catalog plane, any frontend** — [PIM Anywhere](https://persephonepunch.github.io/crm-sync-setup/pim-anywhere.html)

*The migration is not a theme project with a compliance appendix. It is one move — logic to the server, consent into the data plane — and the theme rebuild is what falls out of it.*
