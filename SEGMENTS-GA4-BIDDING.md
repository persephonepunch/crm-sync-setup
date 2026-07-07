# Marketing was built on the page view. The funnel now pays for the **consented login**.

**For:** Marketing ops, performance media, and analytics engineering
**Status:** Built (GA4 push + audiences) · Direct Google Ads push pending Ads API credentials
**Date:** 2026-07-07
**Depends on:** [`FEATURE-SPEC-UA-MIGRATION.md`](FEATURE-SPEC-UA-MIGRATION.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## 0. TL;DR

Consent Mode v2, the decay of third-party cookies, and first-party identity moved the funnel's unit of value from the **anonymous page view** to the **consented, logged-in identity**. A page view depreciates — cookie-fragile, anonymous, disposable. A consented login appreciates — durable, addressable, worth money, and the only thing an AI agent or an AI answer engine can act on.

This spec defines the pipe that turns a **Shopify customer segment** into a **Google Smart Bidding signal** without a CSV, without an unconsented identifier, and without a static conversion value. A revenue-weighted, consent-gated user property flows from Xano → the Cloudflare Worker → GA4 (Measurement Protocol) → a GA4 audience → Google Ads, where Smart Bidding optimizes to the value of the *identity*, not the *click*.

**One-line recommendation:** *Stop bidding on page views. Bid on consented, revenue-weighted segments — computed server-side, gated on consent, and delivered to Google as a first-party signal.*

---

## 1. Why the funnel got repriced

| Old unit of value (page view) | New unit of value (consented login) |
|---|---|
| Anonymous — no durable identity to bid on | First-party identity, keyed by a portable UUID |
| Cookie-fragile — cleared, blocked, or expired | Server-side record, survives the browser |
| Static conversion value set once | Value on every event, recomputed per order |
| Invisible to consent — "consent laundering" risk | Consent is a first-class field, checked before every push |
| Opaque to agents and answer engines | Machine-addressable — an agent can act on it |

Three forces made the page view a wasting asset: **Consent Mode v2** (four required signals in the EEA — `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`), the collapse of third-party cookies, and the shift of Google's own bidding toward first-party, value-based signals. Most marketing apps still pivot on the page view. This one builds on the login.

---

## 2. The pipe — Shopify Segment → Smart Bidding

```
   SHOPIFY                     XANO                     CLOUDFLARE WORKER            GOOGLE
   customer tags        source of truth            projection + consent gate     GA4 + Ads
   + Segments      →   crm tags (segment,     →    on tag change:            →   Measurement
   + metafields         tier, campaign,             build user properties,        Protocol → GA4
   + Customer            consent) + revenue          check consent_marketing,      user property →
   Events (JIT)          weight per identity         push server-side              GA4 audience →
                                                                                   Ads Smart Bidding
```

**The invariant:** the segment is *computed in your data layer*, not in the ad platform. Google receives a consent-qualified, revenue-weighted signal keyed to a first-party identity — never a raw customer list, never an unconsented identifier.

### 2.1 What each layer owns

| Layer | Owns | Emits |
|---|---|---|
| **Shopify** | Customer tags, Segments, `custom.crm_segment` metafield, Customer Events (JIT triggers) | Order value, segment membership, purchase events |
| **Xano** | The system of record: CRM tags by category (`status`, `tier`, `segment`, `campaign`, `consent`, `marketing`), revenue weight per identity, consent state | Canonical, versioned user record keyed by UUID |
| **Cloudflare Worker** | Projection + the **consent gate**. On every tag change it builds GA4 user properties and refuses to push if `consent_marketing ≠ granted` | GA4 Measurement Protocol calls, fail-closed |
| **GA4** | User-scoped custom dimensions → Audiences | Audiences shared to Google Ads |
| **Google Ads** | Smart Bidding (tROAS / tCPA) consuming the audience + value | Bids weighted to the identity's value |

---

## 3. The signals that cross the wire

The worker pushes these GA4 **user properties** on every tag change (from the dashboard, the 15-minute Shopify sync, or the admin API):

| User property | Source (CRM tag category) | Example | Role in bidding |
|---|---|---|---|
| `crm_segment` | segment | `high_value,returning` | Audience membership |
| `crm_tier` | tier | `vip` | Value tier / bid multiplier intent |
| `crm_campaign` | campaign | `summer_2026` | Campaign audience scoping |
| `crm_status` | status | `active` | Suppression / eligibility |
| `consent_marketing` | consent | `granted` \| `denied` | **Gate** — no grant, no push |
| `crm_revenue_band` | derived (order history) | `p90` | Revenue weighting for tROAS |

**Events:** `crm_tags_updated` (dashboard tag change; carries `tags_added`, `tags_removed`, `campaign_tags`) and `crm_sync` (`source: shopify_cron`). Both carry only consented, server-verified state.

---

## 4. Consent is the gate, revenue is the weight

Two rules make this legal *and* effective:

1. **Consent gates the push (fail-closed).** Before any Measurement Protocol call, the worker checks `consent_marketing`. Denied or unknown → the signal is not sent. Consent is stored server-side in Xano, not read from a browser cookie, so an outage or a cleared cookie cannot silently reopen the pipe. When a customer opts out, every connected destination is notified in the same request — no stale audience keeps bidding on someone who left.

2. **Revenue is the weight, not the headcount.** A segment isn't "how many logins" — it's "how much value." The worker attaches a revenue band per identity so Google's **value-based Smart Bidding (tROAS)** optimizes toward the identities that actually pay, instead of treating every consented login as equal. This is the difference between a remarketing list and a *bidding signal*.

> Compliance here is not a cost center. A consent-gated, revenue-weighted signal is *more* valuable to Smart Bidding than an unconsented bulk list — because it is legal to use, durable, and priced to value. Enforcement is the reason the signal is safe to send.

---

## 5. Just-in-time membership (Shopify Customer Events)

Batch segment sync is the floor, not the ceiling. Shopify **Customer Events** (Web Pixel / server pixel) let the segment update *at the moment of behavior*:

- A `checkout_completed` event raises the identity's revenue band → the next GA4 push moves them up a bidding tier.
- A high-intent browse pattern adds a `campaign` tag → JIT audience entry, no waiting for the 15-minute cron.
- An opt-out event flips `consent_marketing` → the worker suppresses the next push immediately.

JIT keeps the bidding signal fresh to the event, while the cron sweep guarantees eventual consistency and heals any drift.

---

## 6. Setup (operator steps)

1. **GA4 Measurement Protocol** — set `GA4_MEASUREMENT_ID` (`G-XXXXXXXXXX`) and the API secret in the app config.
2. **User-scoped custom dimensions** in GA4 for `crm_segment`, `crm_tier`, `crm_campaign`, `consent_marketing`, `crm_revenue_band`.
3. **GA4 Audiences** — e.g. *VIP*: `crm_tier contains "vip"`; *At-Risk*: `crm_segment contains "at_risk"`; *Marketing Opted-In*: `consent_marketing equals "granted"`. Audiences auto-share to Google Ads.
4. **Google Ads** — turn on value-based Smart Bidding (tROAS) on the campaigns consuming the shared audiences.
5. **Shopify metafield mirror** — confirm `customer.metafield.custom.crm_segment` is populated so the same segment is queryable inside Shopify Segments and Flow.

---

## 7. Status & what's next

| Capability | State |
|---|---|
| CRM tags → GA4 user properties (server-side) | **Live** |
| Consent gate (fail-closed on `consent_marketing`) | **Live** |
| GA4 audiences → Google Ads sharing | **Live** (native GA4 → Ads link) |
| Revenue-weighted band (`crm_revenue_band`) | **Live** |
| JIT membership via Shopify Customer Events | **Live** |
| **Direct** push to Google Ads Customer Match / offline conversions | **Pending** — requires Google Ads API credentials |

The direct Ads API path (Customer Match audiences + value-based offline conversion import, hashed first-party identifiers under consent) is the next increment. Until those credentials are provisioned, GA4's native audience share carries the signal.

---

## 8. Theme the surfaces this bids on

Every surface a bid lands on — the storefront, the login, the account, the dashboard — is themed from one place. Open the store this stack is built on:

**→ [design-sync.myshopify.com](https://design-sync.myshopify.com)**  *(migrating to **[crm-sync.dev](https://crm-sync.dev)**)*

One primary color and token set key Shopify, Webflow, and every embed, so the consented login you bid on looks like one brand across the whole funnel.

---

*The reframe: stop paying for the anonymous page view. Compute the segment in your data layer, gate it on consent, weight it by revenue, and hand Google a first-party signal it can actually bid on. That is the funnel, repriced.*
