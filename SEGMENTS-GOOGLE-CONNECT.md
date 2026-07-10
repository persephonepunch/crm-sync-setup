# Google turned off the list upload. We were never uploading lists.

**For:** Marketing ops, analytics engineering, and the business analyst who owns segments
**Status:** Plan of record · GA4 pipe built · Live Google push routes via the Data Manager API
**Date:** 2026-07-10
**Depends on:** [`SEGMENTS-GA4-BIDDING.md`](segments-ga4-bidding.html) · [`ARCHITECTURE.md`](architecture.html) · [`GLOBAL-PAYOUTS.md`](https://persephonepunch.github.io/crm-sync-setup/GLOBAL-PAYOUTS.md)

---

## 0. TL;DR

On **April 1, 2026**, Google disabled Customer Match uploads through the Google Ads API for developer tokens without prior Customer Match history. The replacement — the **Data Manager API** — needs no developer token, authenticates with a plain Google Cloud service account, and fans one ingest endpoint out to Google Ads, Display & Video 360, and GA4. For a pipeline that was always consent-gated and server-computed, this is not a migration. It is the arrival of the channel the architecture assumed.

This plan connects Shopify segments to Google along **three planes**: **Reach** (segments become value-weighted ad audiences), **Memory** (segment, consent, and revenue history lands in BigQuery), and **Answers** (Google's Conversational Analytics sits on that warehouse so a non-technical stakeholder can ask "which segments drove revenue this week?" in plain English).

**One-line recommendation:** *Ship the single-US-market pipe now on the Data Manager API, with a `market` key on every row from day one — so going global is adding markets, not rebuilding.*

---

## 1. What changed at Google — and why it favors this design

| Retired (April 1, 2026) | Replacement |
|---|---|
| Google Ads API `OfflineUserDataJobService` / `UserDataService` uploads | **Data Manager API** — `datamanager.googleapis.com` |
| Developer token + Ads-specific OAuth plumbing | Standard Google Cloud OAuth; one scope (`auth/datamanager`) |
| Per-product upload endpoints | One ingest endpoint → Google Ads, DV360, GA4/Firebase, Ad Manager, CM360, SA360 |
| Consent as a policy footnote | Consent fields (`ad_user_data`, `ad_personalization`) **on every member, on the wire** |

The Data Manager API also supersedes the GA4 Measurement Protocol for server-side conversion ingestion. The GA4 pipe described in [`SEGMENTS-GA4-BIDDING.md`](segments-ga4-bidding.html) keeps working — this plan adds the direct channel beside it.

The consent posture doesn't change at all: the pipeline computes segments in the data layer, gates them on consent, and hands Google a qualified signal — never a raw list. Google's new API now *requires* what this architecture already *did*.

---

## 2. What counts as a segment

Four kinds of group, and they travel differently. Only one ever becomes an advertising audience.

| Domain | Example | Where it goes |
|---|---|---|
| **Peers & Households** | VIP repeat buyers; a family sharing one account | The **only** domain projected to Google Ads — consented members, hashed identifiers, value-weighted |
| **Teams** | A design team; an approvals group | Insight plane only (warehouse + answers). Never advertising |
| **Organizations** | A client company; an agency workspace | Insight plane; any B2B projection is a separate, later decision |
| **Nations** | Canada; the EU; Korea | Not an audience — a **boundary**. Scopes campaigns, partitions the warehouse, selects the consent regime and data residency |

**Rule of thumb:** Peers/Households flow *out* to Google; Teams and Organizations flow *up* to insight; Nations decide *where* — and under *which law* — everything runs.

---

## 3. The three planes

```
  SHOPIFY segment ──▶ WORKER (consent gate · revenue weights) ──▶ DATA MANAGER API ──▶ Ads audience   REACH
  XANO records    ──▶ nightly delta feed (queued, audited)    ──▶ BIGQUERY warehouse                  MEMORY
  BIGQUERY        ──▶ Conversational Analytics data agent     ──▶ plain-English answers               ANSWERS
```

| Plane | What it delivers | Who it serves |
|---|---|---|
| **Reach** | Consent-gated, revenue-weighted Customer Match audiences + value-based conversions for Smart Bidding | Performance media |
| **Memory** | Segment / consent / revenue history in BigQuery — atomic nightly loads, every run in the audit chain | Analytics engineering |
| **Answers** | Natural-language questions over the warehouse — no SQL, no analyst queue | The BA who owns segments |

The Answers plane is the accessibility thesis made literal: connected CRM data that a non-technical teammate can interrogate directly.

---

## 4. Google-side requirements

One Google Cloud project. Services to enable:

| API | Why |
|---|---|
| `datamanager.googleapis.com` | Audience ingestion (Customer Match successor) + weighted conversion ingestion |
| `analyticsadmin.googleapis.com` | Programmatic GA4 audiences mirroring segment definitions |
| `bigquery.googleapis.com` + `storage.googleapis.com` | The warehouse and its staging bucket |
| `geminidataanalytics.googleapis.com` + `cloudaicompanion.googleapis.com` | Conversational Analytics data agents (Answers plane) |

**Authentication:** a service account, not user OAuth. Service accounts skip Google's OAuth app-verification queue; the runtime mints short-lived access tokens server-side (JWT-bearer exchange, cached until a minute before expiry). The credential enters the system through the same supervised key ceremony as every other secret — see [`KEY-MANAGEMENT-LIFECYCLE`](key-management-lifecycle.html).

**Account linking (human, one sitting):** grant the service-account identity access to the destination Google Ads account (requires Ads admin), link GA4 ↔ Ads, and verify **Customer Match eligibility** — it is account-level (policy compliance + payment history) and worth confirming *before* anything is built on top.

**Consent on the wire:** every ingest carries per-member `ad_user_data` and `ad_personalization`, mapped from the same consent records that already gate the GA4 pipe. No consent, no export — structurally, not procedurally.

Setup is a CLI-and-console sitting; the runtime adds **no new infrastructure dependency** — the existing worker and data layer call Google's REST endpoints directly.

---

## 5. The warehouse feed

Deltas come off a **sync queue**, not a timestamp watermark — the queue gives idempotency, retry, and dead-lettering, and keeps the feed inside the audit chain (watermarks silently miss hard-deletes).

| Ingest option | Fit |
|---|---|
| **GCS batch load + `MERGE`** — recommended | Ingestion is free and atomic (a night's load lands completely or not at all); true upserts against the system of record |
| Legacy streaming `insertAll` | Sub-minute freshness, but billed at a 1 KB-per-row minimum and rows linger in a streaming buffer |
| Storage Write API | The best engine, but gRPC — reachable from an HTTP-only backend via a thin edge shim, only worth it if a stakeholder needs sub-minute numbers |

The loop: read pending → batch to NDJSON → load into staging → `MERGE` on the business key → advance the queue **only on success**. Failures dead-letter with the job ID; every run logs counts into the audit chain.

---

## 6. One market or worldwide

Google's fees are near zero either way at this volume — batch loads are free, and the free tiers (10 GiB storage, 1 TiB query per month) cover the working set. The real cost axis is accounts, compliance, and people-time.

| | **Single US market** | **Global organization** |
|---|---|---|
| Ads structure | One Ads account | Manager account (MCC) + per-market accounts |
| GA4 | One property | Per-market properties, each linked to Ads |
| Warehouse | One US-region dataset | Region-partitioned datasets (EU data stays in the EU) |
| Consent regime | US opt-out rules; Consent Mode v2 already exceeds them | EEA: all four Consent Mode v2 signals **mandatory** (built); Korea and Japan add their own consent paperwork |
| Nations domain | Dormant | Active — where country boundaries do real work |
| Google cost | ≈ $0 / month | ≈ $0–10 / month |
| Real cost | One setup sitting; live in days | Per-market account grants + legal review — people-time, not fees |

**Recommendation: A with a B-shaped schema.** Ship the single US market now; carry a `market` key on every warehouse table and campaign row from day one, and name datasets so regional siblings can appear beside them. Going global then reuses the market plumbing the Canada proof-of-concept already validated.

---

## 7. Delivery phases

| Phase | Delivers | Visible result |
|---|---|---|
| **0 — Setup** | Cloud project, APIs, service account, Ads + GA4 links, eligibility check | A verified checklist; nothing live yet |
| **1 — Feed** | Nightly queued delta load into BigQuery | Row counts + "last updated" any morning |
| **2 — Reach** | Live audience ingest via Data Manager API (test mode stays the default) | The segment appears in Google Ads with a count |
| **3 — Freshness** | Event-triggered incremental updates (no polling) | Audience counts move on their own after busy days |
| **4 — Mirror** | GA4 audiences created programmatically per segment definition | Event-based audiences beside Customer Match |
| **5 — Value** | Weighted conversions ingested — the Smart Bidding payoff | Conversion value reflects segment weights |
| **6 — Answers** | Conversational Analytics over the warehouse | A plain-English question box for segments |

Phase 0 is a supervised human sitting. Phases 1 and 2 are independent and parallel. Phase 6 waits only on Phase 1.

---

## 8. The enterprise pivot — when the incumbent stack can't conform

Enterprise organizations holding seven-figure Salesforce/Adobe commitments are
waiting for those platforms to conform to the new advertising regime. They
won't — not because the vendors are slow, but because the regime broke the
architecture those stacks were built on:

- **Consent Mode v2** demands per-event, per-signal consent stamped at the
  data layer. Incumbent CDPs store consent as a field on a record — the wrong
  place architecturally, and no release cycle relocates it.
- **The Customer Match retirement** (April 1, 2026) deleted the upload pattern
  every enterprise Google connector was built around. The successor channel
  expects consent fields on every member, on the wire — which presumes the
  gate above already exists.
- **Agentic buyers never fire the instrumentation.** An agent completes
  search → cart → checkout with no click, no page view, no pixel. A
  seven-figure measurement estate is not underperforming on this channel —
  it is structurally blind to it.

### The CDP that syndicated the page view

The clearest instance is the Segment-class CDP. Its founding primitives are
the Universal Analytics worldview promoted to infrastructure: `page()` as a
first-class API call, identity rooted in a cookie-scoped `anonymousId`,
collection defaulting to a client-side library injected into the DOM. Instead
of sending the page view to one destination, it sold sending it to a hundred —
so it did not escape the page view's obsolescence, it **syndicated** it: when
the cookie/client-script architecture broke, the value proposition broke in
every destination simultaneously. Server-side sources and audience products
moved the transport, not the worldview — the same page/track/identify schema,
the same cookie-rooted identity spine, audiences computed inside the toll
booth and synced to ad platforms through exactly the upload patterns retired
in April 2026. The pricing makes the toll explicit: metering by monthly
tracked users bills the merchant per anonymous cookie, including the
overwhelming share who never consent, never sign in, and never buy.

This substrate inverts every term of that model. Consent gates the signal at
the source instead of filtering it at the destination; identity is the
consented login, not a stitched cookie; audiences are computed in the
merchant's own data layer and projected outward; and nobody is billed per
ghost.

The pivot is not rip-and-replace. The incumbent stack stays as the system of
engagement, and keeps receiving its feeds. What changes is the signal path:
identity, consent, mandates, and conversions run through the consent-gated
substrate this plan describes — stamped at the source, encrypted in transit,
agent-addressable — and the estate consumes from a plane that is admissible
under the new rules.

**Your stack isn't wrong — it's deaf to the new signals. We don't replace it;
we give it ears that are legal to use — and ears an average user in the
organization can operate.** The substrate ships with its own plain-language
surfaces: a question box that answers in English (the Answers plane above), a
searchable documentation archive written for operators — this article is part
of it — and a campaign wizard with approval gates. The people who own segments
day-to-day run this in-house. Conformance here is not a statement of work, and
nothing waits on a consulting team ten time zones away.

---

### The measurement stack, side by side

| Model | Built to measure | Primitive | Agent-commerce impact | Consent posture | Fee model |
|---|---|---|---|---|---|
| **Semrush-class** (visibility) | Public presence: rankings, now AI-answer citations | The keyword position | SERP → AI answers; rank ≠ cited. **Adapts** — stays useful as the scoreboard for "are we cited?" | None needed — public data only | Per-seat intel |
| **Segment-class** (CDP) | Client-side behavioral events, routed to N destinations | `page()`/`track()` on a cookie `anonymousId` | Agents never load the script; the audience-sync patterns it fed were retired April 2026. **Bypassed** | Filter at the destination, bolted on after the pipes | Per-MTU — billed per anonymous cookie |
| **Optimizely-class** (A/B) | On-page conversion lift | The DOM variant shown to a browser | Agents render no DOM — nothing to variant-test. **Replaced** by edge/server-side flags | Adds its own script + cookie consent surface | Per-MAU / per-impression |
| **The standard page-based funnel** (ad → landing page → pixel → retarget) | Clicks and page views, stitched into modeled attribution | The click | The agent funnel has no click, page, or pixel — the entire chain simply never fires. **Blind** | Degrades at every hop; modeled numbers paper over the gaps | Media percentage + the tool stack above |
| **Server-side, agent-ready, consent-tracked** (this plan) | Authenticated requests: tool calls, mandates, transactions — plus human-web events server-side | The consented event | **Native** — the protocol endpoint is the measurement point; the same plane covers browsers and agents | Gates at the source; stamped per event and per member | Infrastructure-priced; $0 per contact |

The value-add of the last row, stated plainly: **deterministic** (a ledger,
not a model — every conversion carries its transaction and mandate);
**channel-complete** (one plane sees the browser funnel *and* the agent
funnel the others cannot); **admissible** (Consent Mode v2 and Data Manager
requirements are satisfied by construction, not by retrofit);
**auditable** (every number traceable through the audit chain); and
**operable in-house** (the surfaces are built for the segment owner, not a
retained integration team). The four incumbent rows are not made worthless —
the scoreboard keeps score and page-based testing still serves the human
web — but every row above the last one is measuring a shrinking share of
the funnel, on rented collection, at a per-contact price.

### Measurement without a browser

The forward question decides tooling strategy: what happens when measurement
must include agents and machines that never open a browser?

Every load-bearing assumption of the current toolchain — a browser implies a
person, a session implies attention, a cookie implies continuity — fails at
once. A browser emits *behavior* that tools sample, model, and stitch into
inferred identity. An agent emits *authenticated requests*: tool calls
carrying tokens, mandates, and consent claims. There is nothing left to
infer — the call announces who it is, on whose behalf it acts, what it is
permitted to do, and what it did. Measurement collapses from probabilistic
reconstruction into a **deterministic ledger**. The statistical apparatus of
the tag era — sampling, modeled attribution, view-through windows — existed
to compensate for not knowing. On this channel, you know.

The observation point moves to the only place the merchant controls: the
protocol surface where `discover`, `search`, cart, and checkout calls land.
No agent will ever execute your JavaScript. Structurally this is a return to
server-log analytics — except the requests are signed, structured, and
intent-rich, and the event that *authorizes* an action is the *record* of it:
the permissions bus and the measurement bus become the same bus.

The questions change shape with it. Not "which page converted," but: which
agent (attestation replaces user-agent strings — bot management inverts from
blocking machines to admitting the right ones); on whose behalf (the mandate
chain); with what permission at call time; and which *answer* converted —
the funnel now runs indexed → cited → discovered → completed.

Measurement vendors face three doors: adapt what they watch (the visibility
scoreboards), insert themselves into the server path (a new toll booth that
substrate-owning merchants have no reason to admit), or read from the
merchant's ledger — becoming reporting layers over a warehouse they no longer
collect for. Collection was the moat; on this channel the merchant owns
collection by default, because the protocol endpoint is theirs. Google
already conceded the direction — Measurement Protocol and the Data Manager
API are server-side ingestion of merchant-owned truth, not tags.

**The browser era measured what strangers did on your pages. The agent era
notarizes what authenticated parties did with your permission.** Agent
analytics is not a product to buy; it is a report over data this substrate
already keeps.

---

## 9. Related documents

- [`SEGMENTS-GA4-BIDDING.md`](segments-ga4-bidding.html) — the built GA4 pipe: consent gate, revenue weights, user properties, audiences. This plan's Reach plane is its direct-channel sibling.
- [`ARCHITECTURE.md`](architecture.html) — where the worker, data layer, and consent plane sit.
- [`KEY-MANAGEMENT-LIFECYCLE`](key-management-lifecycle.html) — the ceremony that admits the service-account credential.
- [`GLOBAL-PAYOUTS.md`](https://persephonepunch.github.io/crm-sync-setup/GLOBAL-PAYOUTS.md) — the settlement side of the same market boundaries the Nations domain scopes.
