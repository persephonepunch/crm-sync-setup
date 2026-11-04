---
title: "Middleware vs AI Architecture"
description: "Why a Xano record plus a Cloudflare edge resolves identifier and consent drift that VM-hosted middleware cannot, what a GTIN check digit proves, and where cryptographic trust sits in a Channel Publish QR link."
canonical: https://persephonepunch.github.io/crm-sync-setup/middleware-vs-ai-architecture.html
category: "Specs"
date: 2026-11-04
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/MIDDLEWARE-VS-AI-ARCHITECTURE.md
licence: CC-BY-4.0
tags:
  - gs1
  - security
  - identity
  - ledger
  - xano
  - consent
  - architecture
keywords:
  - middleware vs AI architecture
  - build vs buy integration
  - AI binding ecommerce
  - Workers AI binding
  - predicted LTV Smart Bidding
  - non-blocking IO
  - Xano system of record
  - Cloudflare event bus
  - GTIN check digit
  - GS1 Digital Link
  - JWKS Ed25519
  - signed QR code
verified_on: 2026-10-17
verified_by: execution
method: "Check-digit arithmetic executed in Node; send-time permissions, identifier resolution, AI bindings, Durable Object sharding, tenant key partitioning and mint/scan behaviour read from the worker source and wrangler.toml at commit b26b02c (release gate merged from f3585e8). Claude runner descriptions from Anthropic documentation (vendor-doc)."
review_by: 2027-04-17
---
# Middleware vs AI Architecture

![Fee dependency vs. architectural map: on the left, bought middleware on a managed VM, with a fee on the VM, each environment, the AI add-on and every connector; on the right, a Xano record and a Cloudflare edge, with fees on the plan and on usage, and every send a ledgered permissions decision.](https://crm-sync.dev/kb/media/docs/fee-dependency-vs-architectural-map.svg)

**In short.** Bought middleware charges for every connection and makes every channel wait in
one queue, translating product and customer IDs its own way at each step. This architecture
keeps one record of customers, consent and product IDs in Xano, and lets a Cloudflare edge send
to every channel at once — each send checked against the customer's consent first. The result
is one set of clean IDs for agents and ads, budget spent only on audiences you may target, and
bids weighted by predicted revenue instead of past spend.

**The article at a glance**

- **The problem.** One order must reach five places at once — an AI agent, Merchant Center,
  Google Ads, GA4 and the ERP — under one consent decision. Middleware queues them and maps IDs
  per connector.
- **The architecture.** Xano holds the record. A Cloudflare edge sends to each channel, and every
  send asks permission first. Your ERP, CRM and service bus stay; they receive the same record.
- **Easier to run, faster to revenue.** AI bindings and low-code orchestration (Xano function
  stacks) replace connector licences and cluster operations, so a change ships in days, not a
  project. The new bid values go live on the next audience push.
- **The revenue scale.** Predicted lifetime value becomes the bid value, and revoked customers drop
  out of audiences first. At $100M in online revenue, every 1% is $1M — so the stakes run into
  the millions. That's arithmetic, not a measured result: a holdout test gives the real number.
- **The AI.** Models run inside the same request, with no extra vendor hop. Claude task runners
  connect over `/mcp` under the same permissions. AI finds candidates; clean IDs close the sale.
- **The speed rule.** Everything runs side by side except the consent check: decide before
  sending, defer only the bookkeeping.
- **Product Lead / BA owns the IDs.** Every variant needs a GTIN, or brand + MPN. Never reuse or
  invent one.
- **Trust.** A barcode check digit catches typos, not fakes. Channel Publish refuses forged
  codes today; signed, verifiable links are the next step.
- **EU data stays in the EU.** Any plugin or CRM on a US server is a transfer that needs a legal
  basis, a contract and disclosure. Keep the EU record in the EU and send US tools pseudonymous
  IDs only.
- **The cost.** Two vendors instead of one, an outage path when the consent check is
  unreachable, and a Cloud Console handoff for predicted-value scoring.

The sections below expand each point, with the evidence.

**Who this is for.** A BA or product lead making the case to leadership, an architect choosing
where integration runs, a merchant putting QR codes on packaging, and a compliance reviewer
asked to sign off on the word *verified*.

> Every system that acts on a product — an agent at checkout, a bid in Google Ads, a pick in a
> warehouse — acts on an identifier. Clean IDs come before agentic commerce, not after it.

---

## Revenue benefit: build to revenue

> Bought middleware is a cost line per connection. An AI binding on the record turns the same
> data services into bid value: consented buyers, weighted by predicted revenue, sent without
> blocking.

The revenue path runs through four steps. Each one either exists in code or is named as a gap.

1. **Data services land in the record.** Orders, catalog and ERP feeds resolve to one identity
   and one set of product IDs (GID, GTIN/MPN) in Xano.
2. **The AI binding works in the request.** Workers AI and Vectorize match and enrich in the
   same worker that holds the permissions check — no third runtime, no model API key.
3. **Weighted data sets the value.** A BigQuery ML model predicts each consented buyer's future
   revenue. The score comes back as a per-user weight, and Vertex feature extraction weights the
   tenant's own content for AEO.
4. **The weight becomes the bid.** The audience push to Google Data Manager sends predicted
   lifetime value as `conversion_value` in place of past spend, so Smart Bidding bids on where
   a targeted audience is going, not where it has been.

| Revenue lever | How it earns | Status | Evidence |
|---|---|---|---|
| **Value-based bidding on predicted LTV** | Bids follow forward value. A buyer with high predicted value and little spend so far stops being under-bid. Past spend remains the fallback when there is no score. | Built in code; scores need the client's BigQuery | Weight replaces spend, `index.ts:11171–11176`; model `pltv.purchase_ltv`, `index.ts:6356`; weight stored with a 45-day TTL, `index.ts:6816` |
| **Spend only on audiences you may use** | Only consented, targetable buyers carry a weight. A revocation deletes the weight before the next push, so no budget goes to people who can't legally be targeted. | Built | Weight deleted on revocation, `index.ts:6588`, `index.ts:6753` |
| **Weighted content for AEO** | Vertex feature extraction over the tenant's own corpus weights tags and taxonomy, so answer engines and on-site search rank what sells. Sold as an add-on, with terms accepted at purchase. | Partial — needs Cloud Console access | Terms-gated permission, `index.ts:41968`; Gemini remote model step, `index.ts:28097` |
| **Exact-match agent checkout** | Agent conversions attribute to the variant actually bought, so value-based bidding learns from the right item. | Partial | See "Clean IDs are the precondition" below |
| **EDI ingest (X12 / EDIFACT)** | Purchase orders and advance ship notices from trading partners would feed the same record. | Gap | No EDI parser in the worker; the ERP side is an outbound projection only |

### Easier to run, and why the stakes run into the millions

**Easier to use.** Bought middleware asks for a connector licence per system and, behind it, a
cluster someone has to operate. Here, the AI is a binding — one line of configuration — and
orchestration is a Xano function stack a BA can read. A new destination or a new rule is a
change to one function, not a new contract or a new deployment pipeline.

**Faster to revenue.** The switch from past spend to predicted value takes effect on the next
audience push. Google's bidding then goes through its own learning period before results
settle, so "immediate" means the value is live immediately — not that the lift is.

**The scale.** Bidding changes act on all ad-driven revenue at once, so a small percentage is a
large number. The table below shows what a given improvement is worth. It is arithmetic, not
a forecast: the percentage is the thing a holdout test has to measure.

| Annual online revenue | +1% | +3% | +5% |
|---|---|---|---|
| $10M | $100K | $300K | $500K |
| $100M | $1M | $3M | $5M |
| $500M | $5M | $15M | $25M |

How to get the real number: split the audience. One half bids on predicted value, the other
on past spend, over the same period and budget. The difference in revenue is the lift, and it
is the only figure worth quoting to leadership.

### Non-blocking, in plain terms

**For the BA and leadership.** "Blocking" means one job waits for another before it can move.
"Non-blocking" means nothing stands in line that doesn't have to. That matters for revenue,
because one order has to reach five places — the agent, Merchant Center, Google Ads, GA4 and
the ERP — while the customer is still on the page.

Picture a restaurant. A **blocking** waiter takes one order, stands at the kitchen until the
food is ready, delivers it, then takes the next order. A **non-blocking** waiter takes the
order, hands it to the kitchen, and serves other tables while it cooks. Nobody waits for a
dish that isn't theirs.

There is one exception, and it is the rule this design is built on: **the waiter still checks
the customer's allergy card before the dish leaves the kitchen.** In this system, the allergy
card is the customer's consent. Everything may run side by side except that check.

> **The rule: decide before sending, defer only the bookkeeping.**

#### How each technology handles waiting

The same idea appears under different names across the stack. A thread is one waiter.

| Technology | How it handles waiting | Where you meet it | What it means for this design |
|---|---|---|---|
| **Ruby** — the client theme | One worker handles one request at a time; if it waits on another system, that worker waits too. More traffic means adding more workers. | Shopify renders theme pages (Liquid) on its own Ruby servers. Liquid can't call other services mid-render. | Fast and predictable for the storefront, which is why theme pages never wait on Google or the ERP. Connected work happens elsewhere. |
| **11ty** — Liquid at build time | Uses the same Liquid template language, but renders ahead of time in Node, not per request. All the waiting on other services happens once, in the build, when data files fetch from APIs. Every page is then written out as a static file. | Headless storefronts and content sites built from Webflow or Shopify data, served from a CDN. | Visitors never wait on a service. Live parts (cart, consent, prices) load at runtime as web components, so one page can be static and live at once. |
| **Rust** — horizontal loading | Real threads on every processor core at once, plus many waiting jobs per thread. Work spreads sideways across cores and machines. | Heavy processing: images, 3D files, large data jobs. | The right tool for heavy lifting. Not needed to make five quick sends, which are mostly waiting, not computing. |
| **Node** (and Cloudflare Workers) | One waiter with a very good memory: starts each job, moves on while it waits, and comes back when the answer arrives. Heavy computing would hold everyone up. | Most web APIs. This stack's edge runs on the same model, in many locations. | Where the five sends run. Each one is started, and none waits for the others. |
| **Shadow DOM** (web components) | In the browser, each component is a sealed box with its own styles and data. It can load without holding up the rest of the page. | Cart, consent banner, product cards. | The page equivalent of isolated sends: one slow box doesn't freeze the page. |
| **Load lifecycle** — eager, lazy, cache, ISR, garbage/destroy | *Eager* loads now. *Lazy* loads when needed. *Cache* keeps a copy nearby so it isn't fetched again. *ISR* (incremental static regeneration) serves the saved copy instantly and rebuilds it in the background once it is too old, so no visitor waits for the rebuild. *Garbage/destroy* throws away what has expired or is no longer allowed, so stale or forbidden data can't be served. | Webflow image and asset loading (eager, lazy); CDN caching; ISR in Next.js and similar frameworks; cleanup when a component closes or a cache entry expires. | The same five choices, applied to customer data. The consent decision is eager. Bookkeeping is lazy. Revenue weights are cached, so a bid never waits on the model, and refreshed when the model re-scores, much like ISR. They are destroyed after 45 days, or at once when a customer revokes consent. |
| **Kubernetes orchestration** | Runs many copies of a service and adds copies when traffic rises; restarts any that fail. | What most bought middleware, and its managed VM, scales on. | Real scale, but someone has to operate it and pay for the copies, sized for the busiest hour. On the edge, the platform does this per request. |

#### Who waits for what

| Work | Does anything wait? | Why, in one line |
|---|---|---|
| Looking up each buyer's revenue weight | No — all at once | A score is a lookup. There's no reason to fetch them one buyer at a time. |
| Checking permissions across an audience | A little — 8 at a time | Fast enough to keep up, steady enough not to overload the record. |
| **Sending a customer's data** | **Yes — it waits for its own consent check** | Sending first and checking later is exactly the mistake this design exists to prevent. |
| Counters, ledger entries and cache updates | Not the customer — done afterwards | The customer shouldn't wait for paperwork, and the paperwork still gets done. |
| One slow destination | Only itself | Merchant Center being slow doesn't hold up Google Ads or GA4. |

Bought middleware usually gets this backwards. Its queue never blocks on anything — including
the consent check that should have come first.

*Engineering evidence:* weights resolved with `Promise.all`, `index.ts:11171`; permissions
checks bounded with `gateEach(…, concurrency = 8)` and fail-closed, `release-gate.ts`; deferred
writes via `ctx.waitUntil`, 18 call sites in `index.ts`; weights cached in KV with a 45-day
TTL, `index.ts:6816`.

> **What this section does not claim.** No revenue lift is measured here, and none is quoted.
> Predicted-LTV scoring needs enough purchase history to train on, and BigQuery ML and Vertex
> need Cloud Console access that the analytics team owns. Without that handoff, the audience
> push falls back to past spend, and everything else above still works.

## 1. The challenge and the solution

**Fee dependency vs. architectural map, in detail** (the diagram at the top of the page). Both sides have fees. They attach in
different places, and that decides what a sixth destination, a second environment or an agent
costs.

| | Fee dependency — bought middleware on a managed VM | Architectural map — Xano record + Cloudflare edge |
|---|---|---|
| **Where a fee attaches** | Each connector, environment and AI add-on, plus VM hours sized for peak | The Xano plan, and platform usage (requests, AI inference, storage) |
| **What a new destination costs** | Another connector fee, plus another place where IDs are mapped | One more send behind the same permissions check, keyed on IDs already reconciled in the record |
| **Where consent is decided** | Copied into each job; a revocation trails the queue | Asked per subject, per send; a revocation applies to the next send |
| **Where AI runs** | The vendor's model, reached through a connector | A Workers AI binding in the same request, with Vectorize indexes |
| **What a breach reaches** | Every system the VM holds standing credentials to | One destination per credential, each revocable on its own |
| **What you give up** | Little operational work — the vendor runs it | Ownership: two vendors, model evaluation, and an outage path when the Xano check is unreachable |

Fee amounts are deliberately left out. They depend on contract and volume, so compare your own
quotes against where the fees attach, not against a list price.

### The challenge

One Shopify order now has to reach five places at once, under one consent decision:

- an **agent or chatbot** completing an exact-match checkout or search;
- **Google Merchant Center**, as an offer;
- **Google Ads Smart Bidding**, as a conversion or a Customer Match member;
- **GA4**, as a measured event;
- the **ERP** — SAP, Dynamics, or a CRM such as Salesforce — and the warehouse system behind it.

Each of those systems names the product and the person differently. Shopify says
`gid://shopify/ProductVariant/…`; Merchant Center says an offer ID; the ERP says a material or
item number; the warehouse says a bin and a SKU. A consent decision made in the browser has to
arrive at all five before the payload does, not after.

The conventional answer is **middleware on a managed cloud VM**: one integration process, one
queue, a connector per system, each connector translating IDs its own way.

That answer has a legitimate half. A VM is one deployment to reason about. Systems integrators
know it, ERP connectors exist off the shelf, and an existing enterprise service bus already
runs this way. The objection is not that it is old. It is what this shape does with IDs and
consent when five destinations fire at once.

### The solution

**Xano is the system of record; Cloudflare is the edge that fans out.** The record of who the
person is, what they consented to, and which identifiers name the product lives in Xano rows.
The Cloudflare Worker sends to each destination, and before any payload carrying a person's
data leaves, it asks a permissions boundary in Xano — beside the consent rows — whether this
subject may go to this destination. That check is per subject, per destination, and recorded.

The ERP, the CRM and the existing service bus are not replaced. They keep their roles and
receive a projection of the same record, so they read IDs that were reconciled once instead of
translating them again.

| Concern | Middleware on one managed VM | Xano record + Cloudflare edge | Status | Evidence |
|---|---|---|---|---|
| **Consent at send time** | Consent is a field the connector copies. A revocation reaches the queue after jobs already built from the old value. | Each send asks the permissions boundary first; anything other than an explicit allow is a refusal. No bypass argument exists. | Built | `release-gate.ts` header; `releaseGateFor`, `index.ts:1095`; live since `f3585e8` |
| **Five destinations at once** | Sequential jobs from one process; the slowest connector sets the pace for all. | Independent sends from the edge, each with its own decision and its own ledger row (`release_ledger`). | Built | Destinations enumerated in `ReleaseDestination`, `release-gate.ts` |
| **Person identity** | Each connector maps customer IDs its own way. | One subject ID; Shopify's numeric and GID forms are both resolved against the same claims row. | Partial | `resolveUserIdFromShopifyCustomer`, `index.ts:2612` — both forms are still stored, so the resolver tries each |
| **Product identity** | GTIN/MPN copied field-by-field per connector. | GTIN/MPN resolved server-side from one identifier plane, shared by JSON-LD, Merchant, GA4/BigQuery and minted links. | Built | `index.ts:25430–25438` |
| **ERP and warehouse** | Native connectors, usually the VM's strength. | A configurable projection channel to your ingestion endpoint (for example SAP S/4HANA OData). No warehouse naming map exists yet. | Partial | `index.ts:60413` |
| **Credentials** | The VM holds standing credentials to every connected system — one breach reaches all of them. | Each destination's credential is scoped to that destination; permissions are rows, revocable one at a time. | Built | `verifyBearerOrTenantToken` — platform key, then revocable tenant-scoped tokens |
| **Failure seen from outside** | A job that 200s with a stale consent value looks the same as a correct one. | A refusal is a ledger row with a reason. A boundary that is unreachable refuses — it does not wave payloads through. | Built | Fail-closed rule, `release-gate.ts` |

### Comparison map: batch files vs one record behind an API

The same data can move two ways. On the batch path, SAP ECC exports a CSV, Matrixify bulk-imports it into Shopify, a copy lands in Airtable, and GA4 exports to BigQuery where SQL joins it to CRM data later. Each step makes a copy, and each copy can be the one someone trusts. On the event path, each change is one event: a Cloudflare Worker checks it at the edge, D1 holds a derived queue or read model, Xano Postgres is the record behind a documented API, and every consumer reads from that API.

The middle lane zooms into the CSV step, where most of the cost hides. Getting ECC data into an application by file takes five steps: **extract** (SE16, ALV or LSMW exports, IDocs or flat files, still in SAP field names like `MATNR` and `KUNNR`), **map** fields in a spreadsheet or script (`MATNR` to SKU, `MEINS` to unit, code lists matched by hand), **cleanse** (strip leading zeros, fix units, dedupe, with the decisions recorded nowhere), fill **one CSV template per target application**, then **import**, where partial failures land in a job log and the row loses its link to the ECC record. Change a code in ECC and every template drifts. On the API path the same mapping is code: typed in the Worker, checked against the OpenAPI schema, versioned in git, and every record keeps its ECC key.

![Comparison map: SAP ECC, CSV, Matrixify, Airtable and GA4 to BigQuery SQL loads; the five steps of ECC data transformation from CSV to an application; against a Cloudflare Worker, D1, Xano Postgres with a Swagger/OpenAPI API, and consumers by API; with hosting on the edge, VM-Docker or Kubernetes, and a matrix comparing the two paths](https://persephonepunch.github.io/crm-sync-setup/assets/batch-vs-api-comparison-map.svg)

| Dimension | Batch and file (ECC → CSV → Matrixify, Airtable, GA4 → BigQuery) | Event and API (Workers + D1 → Xano Postgres) |
|---|---|---|
| **Unit moved** | A file of rows | One signed event |
| **Latency** | 15 minutes to a day | Seconds |
| **Contract** | Column headers | An OpenAPI (Swagger) schema per endpoint |
| **Source of truth** | Whichever copy loaded last | Xano Postgres; D1 and every other copy derived and reconciled |
| **Consent** | Lost in the export | Travels with the event, checked at the gate |
| **Retry** | A re-import duplicates or overwrites | An idempotency key makes a retry safe |
| **Deletion (DSR)** | Chase every file, base and table | Delete once, with a receipt from each consumer |
| **Audit** | File names and job logs | Append-only ledger |
| **Credential** | Airtable token: a bearer key to whole bases | Xano token: an encrypted, expiring identity; access decided per endpoint |
| **Rate ceiling** | Airtable: 5 requests per second per base | Xano paid plans: no platform limit; your instance and your edge set it |
| **Runs on** | Desktop exports, SaaS import jobs, scheduled SQL | Workers and D1 at the edge; Xano cloud, or self-hosted on a VM with Docker or on Kubernetes |

The batch tools stay useful: Matrixify for a one-off migration, Airtable or Sheets as a view, BigQuery for analysis. The difference is which copy is the record.

### ECC to S/4HANA and Fiori: the migration under the map

Most ECC data paths in the map exist because ECC was built around SAP GUI transactions and batch files. Moving to S/4HANA, with Fiori as its interface, changes every layer, and the data path most of all: file drops and IDocs give way to OData APIs and business events, which is the shape the event path above expects. SAP ends mainstream maintenance for ECC 6.0 on 31 December 2027, with optional extended maintenance to 2030 at extra cost.

There are three ways in: a **system conversion** (brownfield: convert ECC in place, keeping history and custom code), a **new implementation** (greenfield: start clean and migrate selected data), or a **selective data transition** (move chosen company codes, years or processes).

![ECC to S/4HANA and Fiori: user interface, roles, data model, integration and custom code, each from ECC today through a migration step to S/4HANA and Fiori, with the three migration approaches, the 2027 maintenance deadline and where CRM Sync fits](https://persephonepunch.github.io/crm-sync-setup/assets/ecc-to-fiori-migration.svg)

| Layer | ECC today | Migration step | S/4HANA + Fiori |
|---|---|---|---|
| **User interface** | SAP GUI transactions (`VA01`, `MM01`, `ME21N`); one transaction serves many roles | Map transactions to apps with the Fiori apps recommendations in SAP Readiness Check | Fiori launchpad: role-based apps in the browser and on mobile; Fiori elements generated from annotations |
| **Roles** | PFCG roles built from transaction codes, broad and accumulated over years | Rebuild as business roles from business catalogs, spaces and pages; remove what no app needs | Least privilege per Fiori app; the same roles gate the OData services behind it |
| **Data model** | ECC tables (`MARA`, `KNA1`, `LFA1`, `BSEG`, `MSEG`); customers and vendors kept separately | Migration Cockpit (staging tables or direct transfer); customer/vendor integration (CVI) to Business Partner | Business Partner for both; the `ACDOCA` universal journal and `MATDOC` material documents |
| **Integration** | CSV drops, flat files, IDocs, RFC and batch jobs; mapping in spreadsheets | Expose OData services and released APIs; Integration Suite for partners; retire file drops | OData APIs and business events to subscribers; consented data leaves through the gate |
| **Custom code** | Z-programs, user exits and modifications in the core, with unknown usage | ABAP Test Cockpit checks; usage data decides what to keep or retire; remediate what's kept | Clean core: extensions on BTP or through released APIs, so upgrades don't re-test the core |

**Where CRM Sync fits.** S/4HANA stays the record for finance and logistics. Xano holds consent, grants and the ledger. Data moves between them by API and events, never a CSV drop, so the transformation lane in the map becomes code on one side of the migration rather than spreadsheets on both. Transaction codes and tables are examples: check SAP's Readiness Check and the simplification list for your release.

### One product, four shapes: ECC, Fiori, product.csv and GraphQL

The same product and user records take four shapes on their way out: ECC tables, the OData services that S/4HANA and Fiori read, the product.csv shape, and GraphQL or JSON at the destination. Here the destination is the Google Merchant API. The middle shape is the one to watch. Airtable's [Shopify store base](https://www.airtable.com/universe/expAyxuRwfshA5Isv/shopify-store-compact-base) (products, inventory and orders) is, like Feedonomics, Salsify and Rithum, still built around rows in Shopify's product.csv columns: `Handle`, `Title`, `Variant SKU`, `Variant Price`, `Variant Barcode`, one row per variant. The tools differ in what they do with the rows; the rows are the same.

![One product, four shapes: product and user records as ECC tables, Fiori and S/4HANA OData services, the product.csv shape used by the Airtable Shopify base, Feedonomics, Salsify and Rithum, and Shopify GraphQL plus Google Merchant API JSON; with JSON examples for the product and user collections and a list of what needs to change](https://persephonepunch.github.io/crm-sync-setup/assets/product-shapes-ecc-fiori-csv-graphql.svg)

| Record | ECC tables | Fiori / S/4HANA OData | product.csv shape | GraphQL + Merchant API JSON |
|---|---|---|---|---|
| **Product** (Xano `products`) | `MARA`, `MAKT` and pricing conditions: `MATNR` with leading zeros, `MAKTX`, `EAN11`, `MEINS` | `API_PRODUCT_SRV`: `Product`, `ProductDescription`, `GlobalTradeItemNumber` per unit; the same service Fiori apps read | `Handle`, `Title`, `Variant SKU`, `Variant Price`, `Variant Barcode`, `Image Src`, one row per variant | Shopify Admin GraphQL `productSet`; Merchant `ProductInput` with `offerId`, `feedLabel`, `contentLanguage` and typed `productAttributes` |
| **User** (Xano `users`) | `KNA1` customers kept apart from vendors; staff access as PFCG transaction roles; consent outside ECC, if anywhere | `API_BUSINESS_PARTNER`: one Business Partner for customer and vendor; business roles per Fiori app | `customers.csv`: name, email, and `Accepts Email Marketing` as yes or no, with no time or source | Shopify `emailMarketingConsent` (`marketingState`, `consentUpdatedAt`); Merchant `accounts.users` for staff only, with access rights from Xano grants |

**The product collection as Merchant API JSON.** One `ProductInput` per offer, language and feed label, inserted into an API data source each time the Xano record changes:

```http
POST https://merchantapi.googleapis.com/products/v1/accounts/{ACCOUNT_ID}/productInputs:insert?dataSource=accounts/{ACCOUNT_ID}/dataSources/{DATASOURCE_ID}
```

```json
{
  "offerId": "100245",
  "contentLanguage": "en",
  "feedLabel": "US",
  "productAttributes": {
    "title": "Oak bed frame, queen",
    "link": "https://www.example.com/p/100245",
    "imageLink": "https://www.example.com/img/100245.jpg",
    "gtins": ["00012345678905"],
    "availability": "IN_STOCK",
    "condition": "NEW",
    "price": { "amountMicros": "499000000", "currencyCode": "USD" }
  }
}
```

`offerId` is the ECC material number without its leading zeros, the GTIN passes its check digit before it is sent, and the price is in micros (499.00 USD is `499000000`).

**The user collection as Merchant account users.** Merchant Center users are the people who may work in the account, never shoppers. Each one mirrors a grant in Xano, and revoking the grant deletes the user:

```http
POST https://merchantapi.googleapis.com/accounts/v1/accounts/{ACCOUNT_ID}/users?userId=analyst@example.com
```

```json
{ "accessRights": ["READ_ONLY", "PERFORMANCE_REPORTING"] }
```

The access rights are `STANDARD`, `READ_ONLY`, `ADMIN`, `PERFORMANCE_REPORTING` and `API_DEVELOPER`. A new user stays `PENDING` until they accept the invitation. Shoppers' data, and their consent, stay in Xano.

**What needs to change:**

- **The record leaves the file.** Xano's product and user collections are the source; the CSV, the Airtable base and the feed tools become views of it.
- **Rows become typed resources.** One `ProductInput` per `offerId`, feed label and language; price in micros; enums such as `IN_STOCK`, not free text.
- **Keys survive the trip.** `offerId` comes from the ECC material number, and the GTIN check digit is validated before anything is sent.
- **Files become calls.** `productInputs:insert` or `productSet` on each change, and a delete is a call too, not a row that quietly disappears from the next file.
- **Markets are fields, not files.** `feedLabel` and `contentLanguage` on one record instead of one CSV per country.
- **GTINs and parents aren't CSV-shaped.** `gtins` is an array; variants nest under the product (`productSet`) or share an `itemGroupId` (Merchant has no parent row); pack levels link child to parent. One `Barcode` cell and an "is parent" flag column can't hold that.
- **Consent is a record, not a column.** State, time and source, as in Shopify's `emailMarketingConsent`, never a yes/no cell.
- **Users are grants, not seats.** Merchant access rights mirror Xano grants, and revoking a grant deletes the user.
- **Status comes back to you.** Product issues are read back from the API into your ledger, not left in a feed tool's dashboard.
- **Feed tools become channels.** Feedonomics, Salsify and Rithum still earn their place mapping to marketplaces, reading from the API; they no longer own the record.

Field names are examples: check your SAP release and each vendor's current schema. Merchant API JSON per the [Merchant API v1 product guide](https://developers.google.com/merchant/api/guides/products/add-manage) and [user access guide](https://developers.google.com/merchant/api/guides/accounts/control-access).

### Many hops, many reshapes: Feedonomics, Salsify and Rithum

A product rarely goes from ECC to a channel in one step. A common chain runs it through a PIM or product experience platform such as Salsify, a feed tool such as Feedonomics and a marketplace hub such as Rithum (formed from CommerceHub and ChannelAdvisor), then on to Amazon, Walmart, Google and Meta. Each hop imports the data, reshapes it into its own model and exports it again in the next hop's template. Five reshapes, three vendor copies, each with its own credential.

![Many hops, many reshapes: SAP ECC to a CSV export, Salsify, Feedonomics, the Rithum hub and the channels, with five reshapes; against one Xano record in PIM Sync projected to each channel by API](https://persephonepunch.github.io/crm-sync-setup/assets/many-hops-pim-reshape.svg)

| | Many hops | One record (PIM Sync) |
|---|---|---|
| **Reshapes** | One per hop: five before a channel sees the product | One per channel, from the same record |
| **Copies** | The CSV, plus a copy in each vendor, each behind its own credential | One record in Xano; every channel view derived from it |
| **Enrichment** | A title or category fixed at hop 4 never reaches the source | Made on the record, so every channel gets it |
| **Deletion and consent** | Chased through every hop | One delete; each channel's receipt in the ledger |
| **Errors** | Surface at the channel, several hops from the cause | Channel status read back by API into the ledger |
| **Feed tools** | Own a copy of the catalogue | Still map to marketplaces, reading from the API |

These are patterns, not claims about any vendor: each tool does real work, and the chain is often how a catalogue grew. What PIM Sync changes is where the record lives. It keeps product, assets, variants, translations, market prices, consent and grants in Xano and projects them to Shopify, the Merchant API, Webflow and marketplaces by API.

<a class="doc-button" href="https://apps.shopify.com/pim-sync" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600;border-radius:0">Install PIM Sync on Shopify: one record, a projection per channel →</a>

More on how it works: [PIM Sync on crm-sync.dev](https://www.crm-sync.dev/pages/pim-sync).

### One measurement, every market: units from product.csv to the WMS

Going global changes the numbers as well as the words. A product's weight, dimensions, volume and the distances it travels have to mean the same thing in the ECC record, the storefront, Google Merchant Center and the warehouse, in every market. product.csv carries almost none of it: `Variant Grams` and a display `Variant Weight Unit`, and no dimensions, volume or distance at all.

![One measurement, every market: weight, length, volume, distance and GTINs with parents, from ECC through product.csv, the Xano record, Shopify GraphQL and the Merchant API to the WMS; with the load order from consent to BigQuery and Vertex AI, and the rules that make it global](https://persephonepunch.github.io/crm-sync-setup/assets/global-units-csv-graphql-merchant-wms.svg)

| Measure | ECC (SAP T006) | product.csv | Xano record | Shopify GraphQL | Merchant API JSON | WMS |
|---|---|---|---|---|---|---|
| **Weight** | `BRGEW` / `NTGEW` with `GEWEI`; KG maps to ISO `KGM` | `Variant Grams`; weight unit for display only | Kilograms at full precision, plus the unit as entered | `inventoryItem.measurement.weight` | `shippingWeight`, `productWeight`: `g`, `kg`, `oz` or `lb`, up to 4 decimals | Each, case and pallet weight; dimensional against actual weight |
| **Length** | `MARM`: `LAENG`, `BREIT`, `HOEHE` with `MEABM`, per unit of measure | None | Metres, per pack level | A `dimension` metafield | `shippingLength`, `shippingWidth`, `shippingHeight`: `in` or `cm` | L × W × H per pack level, for slotting and carton fit |
| **Volume** | `VOLUM` with `VOLEH`; M3 maps to `MTQ`, L to `LTR` | None | Cubic metres; contents in litres | A `volume` metafield | `unitPricingMeasure` and `unitPricingBaseMeasure` (750 ml, priced per 100 ml) | Cube per case and pallet; Ti × Hi and trailer fill |
| **Distance** | Route master distance, with its own unit | None | Kilometres; miles as a view | Local delivery radius, per location | Shipping settings `serviceRadius`: `MILES` or `KILOMETERS` | Pick-path travel distance; carrier zones |
| **GTINs and parent** | `EAN11` per unit of measure; configurable parent with variants | One `Barcode` cell per row; "is parent" as a flag | `gtins[]` per variant and pack level; parent and children linked | `productSet` with variants nested; a barcode per variant | `gtins[]` array; variants grouped by `itemGroupId`, no parent row | GTIN-14 per case, SSCC per pallet; pack levels linked |

**Load order.** The market projection and the analytics come after the controls, never before:

1. **Consent** is read before anything moves.
2. **An idempotency key** is set for the change, so every later step can retry safely.
3. **The record is written** in Xano, in SI units, for all markets.
4. **Each market is projected**: ISO 4217 currency, language (`contentLanguage`, ISO 639), units and rounding for that destination.
5. **Channels** receive their projection: Shopify, the Merchant API, the WMS.
6. **BigQuery and Vertex AI load after the channels**: audiences are built by location, and LLM weighting, embeddings and ranking use the language model for that locale, on consented rows only, deduplicated by the same idempotency key, so a retry never counts or weights a product twice.
7. **The TypeScript event loader runs last**: once consent, the record and the audience's locale are known, the page's script loads and its events carry the right market, language and currency.

**Not English by default.** The language model is chosen by locale, like the currency and the units, and the same rules apply to the AI strategy as to the data. A model trained mostly on English quietly degrades Korean, Japanese, Chinese, Thai or Vietnamese search and copy, and pivoting every translation through English loses meaning twice. For APAC in particular:

| Job | Model | Why it fits |
|---|---|---|
| **Search and retrieval** across languages | BAAI `bge-m3` (on Cloudflare Workers AI as `@cf/baai/bge-m3`) | Multilingual embeddings for 100+ languages in one vector space, so a Korean query can find a Japanese product description |
| **Translation** between market languages | Meta `m2m100` (on Workers AI as `@cf/meta/m2m100-1.2b`) | Many-to-many: translates Korean to Japanese directly, without pivoting through English |
| **Audiences and weighting** | Vertex AI, with BigQuery | Audience by location and language; a multilingual embedding model when ranking runs there |

The guardrails don't change with the model: product content goes in, personal data doesn't; the market's residency rules decide where the call runs; and a human reviews machine translation for regulated copy such as pricing, safety and legal text.

**Rules that make it global:**

- **Store SI once**, at full precision, with the unit as entered beside it: a 1 lb item is 0.45359237 kg and still knows it was 1 lb.
- **Name units with UN/ECE Recommendation 20 codes** (`KGM`, `MTR`, `LTR`, `MTQ`, `KMT`), the codes SAP's T006 ISO column and GS1 data use.
- **Convert with exact factors**: 1 lb = 0.45359237 kg, 1 in = 2.54 cm, 1 US gal = 3.785411784 L, 1 mi = 1.609344 km.
- **Round only at the projection**, to what each destination accepts: Merchant takes up to 4 decimals and `in` or `cm`; Shopify takes its own units.
- **Let the market choose the display**: `feedLabel` and `contentLanguage`, with ISO 3166 country, ISO 639 language and ISO 4217 currency.
- **Keep GTINs and parents structured**: arrays and links, not a barcode cell and a parent flag.
- **Load analytics and scripts last**: BigQuery and Vertex AI read consented, deduplicated rows after the record and the channels; the TypeScript event loader runs after them.
- **Not English by default**: choose the language model by locale; for APAC, `bge-m3` for multilingual embeddings and `m2m100` for direct translation.
- **Keep pack levels apart**: each, case and pallet each carry their own weight, dimensions, volume and GTIN, so the WMS and the feed agree.

Field names and unit lists are examples: check your SAP release, Shopify's metafield types and Google's [product data specification](https://support.google.com/merchants/answer/7052112).

### Airtable vs Xano: keys and rate ceilings

**The key is the point of difference.** An Airtable personal access token is a bearer secret: whoever holds it acts as the user, on every base and table the token's scopes and base list allow, and it doesn't expire by default, so it lasts until someone revokes it. (Airtable retired the older account-wide API keys in February 2024; OAuth integrations get short-lived access tokens with refresh tokens.) There is no per-record decision in between: if the token can read the table, it reads every row. A token pasted into a script, an automation or a no-code tool is a copy of the key to the whole base.

A Xano authentication token is different in kind. It is a JWE, an encrypted token created by the workspace's own secret, so the client can't read or alter what's inside, and it carries an expiry you set. The token only says *who* is calling. Each endpoint then decides *what* they may do, in its own function stack: check the grant, the consent and the market at the system of record, and refuse otherwise. The secret that mints tokens stays in Xano, or in your own region if Xano is self-hosted, and is never handed to a client or a plugin.

| | Airtable | Xano |
|---|---|---|
| **Credential** | Personal access token (scoped to bases and actions) or OAuth | JWE authentication token from the workspace secret; separate scoped tokens for the Metadata API |
| **What holding it means** | Access to every record the scopes allow | An identity; each endpoint decides access per call |
| **Expiry** | None by default for personal tokens; revoke by hand | Set when the token is created (an hour to a day is typical) |
| **Row-level decisions** | Not in the API: access is per base and table | In the endpoint logic: grant, consent and market checked per record |
| **Where the signing secret lives** | With Airtable | With Xano, or in your own region when self-hosted |
| **Rate ceiling** | 5 requests per second per base; 50 per second across one user's tokens; a 429 then a 30-second wait | Free plan: 10 requests per 20 seconds. Paid plans: no platform-enforced limit |
| **Monthly cap** | Free: 1,000 API calls; Team: 100,000; Business and Enterprise: none (per Airtable support) | None on paid plans |
| **Write throughput** | Up to 10 records per create or update request, so about 50 records per second per base | Bounded by your instance's compute and database, not a quota |
| **Who sets your limit** | Airtable | You: Xano's Redis *Rate Limit* function on dedicated plans, or Cloudflare rate-limiting rules at the edge |

**What the ceiling means in practice.** At 5 requests per second, with 10 records per request, one Airtable base takes about 50 record writes per second at most, roughly 180,000 an hour if nothing else touches it. A catalogue sync, a webhook burst after a sale, or an agent retrying will hit the 429, and every request then fails for 30 seconds. That makes Airtable a good view of the data and a poor place to put it first. Xano on a paid plan has no platform quota, so the ceiling is the instance you pay for. Set your own limit deliberately, per tenant and per endpoint, at the Cloudflare edge before traffic reaches Xano, so a runaway agent is refused at the edge rather than slowing the record for everyone.

Sources: [Airtable rate limits](https://airtable.com/developers/web/api/rate-limits), [Airtable API call limits](https://support.airtable.com/docs/en/managing-api-call-limits-in-airtable), [Xano API rate limit](https://docs.xano.com/api-rate-limit), [Xano Rate Limit function](https://docs.xano.com/working-with-data/functions/data-caching/rate-limit), [Xano: stateless authentication with JWE and JWS](https://www.xano.com/learn/stateless-authentication-xano-jwe-jws/). Limits as published on 4 November 2026; both vendors can change them.

### AI in the architecture: bindings and functions vs. bought middleware

The same choice repeats for AI. Bought middleware, such as an integration platform with an AI
add-on, adds the model as another connector: the record is sent to the vendor's AI service,
retrieval runs against the vendor's copy of the catalog, and the agent works through the
vendor's runtime. In the built architecture, AI is a **binding** on the same worker that already
holds the permissions check, plus **functions** over the same record:

- **Workers AI** (`[ai]` binding) runs embeddings, translation and chat models inside the
  request. It needs no API key and adds no third runtime.
- **Vectorize** (three bound indexes) holds the semantic catalog and the knowledge base.
- **Xano functions and worker endpoints** are the tools. Agents reach them over `/mcp` the way
  any client would, under a mandate, and every call lands on the same ledger.

The legitimate half of buying: a vendor AI layer arrives supported, with an SLA, packaged
governance and a procurement path the organisation already has. A built layer means you own
model choice, evaluation and quotas.

| Concern | Bought middleware + AI add-on | Workers AI binding + Vectorize + Xano functions | Status | Evidence |
|---|---|---|---|---|
| **Where the model runs** | In the vendor's AI service, reached through a connector. Data makes another hop to another processor. | In the same worker request, through a binding. No model API key to store or rotate. | Built | `wrangler.toml:131`; `env.AI.run`, `index.ts:13977` |
| **Which models** | The vendor's selection. | Open models: `bge-base-en-v1.5` and `bge-m3` embeddings, `m2m100` translation, Llama 3.3 70B, Mistral Small 3.1 and Qwen3 for chat. Changing one is a constant change. | Built | `index.ts:13927–14013` |
| **Retrieval** | An index the vendor builds from a synced copy. | Vectorize indexes `kb-index`, `kb-index-ml`, `product-index-ml`, written from the record. | Built | `wrangler.toml:112–128`; `index.ts:14600` |
| **Exact match** | Depends on how the vendor maps IDs. | Semantic search returns the *nearest* product, not an identity. Product vectors carry the handle, not the GID or GTIN, so an agent has to resolve handle → GID → GTIN from the record before checkout. | Partial | Vector metadata, `index.ts:14604` |
| **Tools an agent calls** | Vendor-defined actions running on the vendor's credentials. | Ordinary endpoints — Xano functions over records, worker endpoints over the store — with no privileged path for the agent. | Built | `/mcp` route, `index.ts:64165` |
| **Permissions on AI output** | The add-on inherits whatever the connector is allowed to reach. | `agent` is a channel in the same per-subject permissions check as every other send. | Built | `ReleaseChannel`, `release-gate.ts` |

The exact-match row is the point of this section. AI finds candidates; identifiers decide the
transaction. However good the model is, an agent's checkout can only be as exact as the IDs it
resolves to.

#### Claude task runners on the same tools

A task runner drives the loop: it calls the model, runs the tools the model asks for, and
repeats until the task is done. It doesn't need its own integration layer. Each Claude runner
below can reach the same `/mcp` tools as any other client, and it gets the same permissions
check. The runner orchestrates the work; Xano rows decide what is allowed.

| Runner | What it is | Who hosts the loop | How it reaches this stack | Docs |
|---|---|---|---|---|
| **Tool Runner** | An SDK helper in the Anthropic API SDK that loops over tools you define. | You — for example inside a Worker | Each tool is a call to a worker endpoint or a Xano function | [Tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) |
| **Claude Agent SDK** | Claude Code packaged as a library, with built-in file, shell and web tools plus MCP. | You | `/mcp` as an MCP server | [Agent SDK](https://code.claude.com/docs/en/agent-sdk) |
| **Managed Agents** | Anthropic runs the loop and a per-session sandbox. Agents are stored, versioned configs, and runs can be scheduled. | Anthropic | `/mcp` through the MCP connector, with credentials held in a vault rather than in the sandbox | [Overview](https://platform.claude.com/docs/en/managed-agents/overview) · [MCP connector](https://platform.claude.com/docs/en/managed-agents/mcp-connector) · [Vaults](https://platform.claude.com/docs/en/managed-agents/vaults) · [Permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies) · [Webhooks](https://platform.claude.com/docs/en/managed-agents/webhooks) |

What this does not claim: none of these runners is wired to this worker today. The table shows
where each would connect, not a running integration. Whichever runner is used, its credential
should be a scoped tenant key and never the platform admin key. Its sends then appear in the
ledger under the `agent` channel.

### Concurrency: threads, shards and channels — in code vs. in a bought application

Five destinations at once is a concurrency problem before it is an integration problem. There
are three ways to own it:

- **Write it yourself in Rust on a VM.** Threads or async tasks do the work, channels pass
  messages between them, and sharded maps hold shared state. You size the VM and prove the
  locking correct.
- **Buy an integration application.** Worker pools, partitions and topics are set in a console,
  and ordering and retry follow the vendor's guarantees.
- **Use platform primitives,** as this stack does. Each request runs in its own isolate with no
  shared memory. A Durable Object is a single-instance shard addressed by name. Partitioning is
  a key prefix.

The legitimate half of the first two: Rust threads on a VM give predictable latency and
CPU-bound throughput that a request-scoped isolate cannot, and a bought application gives you
managed scaling and a support contract. Neither is wrong. The question is which one keeps
**per-tenant ordering and per-subject permissions** correct when five sends fire at once.

| Concern | Rust on a VM (in code) | Bought integration application | This stack (platform primitives) | Status | Evidence |
|---|---|---|---|---|---|
| **Unit of concurrency** | Threads or async tasks in one process you size | A worker pool set in the vendor console | One isolate per request, no shared memory; the platform scales them | Built | Cloudflare Workers runtime |
| **Shared state and ordering** | A mutex or a sharded map; correctness is yours to prove | Partition keys; ordering per the vendor's documentation | A Durable Object per shop, addressed by `idFromName(shop)` — one instance worldwide, so Shopify token refresh is serialised across data centres. KV has no compare-and-set, which is why this is a Durable Object. | Built | `wrangler.toml:134–146`; `index.ts:47476` |
| **Tenant partitioning** | A shard key in code | Tenant configuration in the product | Every KV key prefixed `tenant:<shop>:`, and a tenant's permissions check runs against that tenant's own Xano workspace | Built | `tenantKvKey`, `index.ts:50975`; `releaseGateFor`, `index.ts:1095` |
| **Channels (message passing)** | In-process channels between threads — lost on restart unless persisted | Topics and queues, durable by the vendor | Two meanings, both durable as rows: send channels in the permissions check (`browser`, `crm`, `erp`, `agent`…), each decision a ledger row; and the Xano `channels` table for audiences and agent stacks, with membership rows. No message broker is bound. | Partial | `ReleaseChannel`, `release-gate.ts`; `channels` / `channel_membership`, `index.ts:10281` |
| **Retry after failure** | Your code, against your own queue | The broker redelivers | The caller retries; there is no broker to redeliver. Idempotency keys on every permissions decision make a retry safe, not automatic. | Partial | `releaseKey` idempotency keys, `index.ts:1129` |
| **Per-partner isolation** | A process or container per partner | Separate environments, licensed per environment | A Durable Object per clean-room partner is declared but commented out | Gap | `wrangler.toml`, clean-room block |
| **Rust in this repository** | — | — | Only the desktop Tauri shell (13 lines, no concurrency). Rust on Workers compiles to WebAssembly and runs single-threaded per isolate, so it does not bring threads back. | — | `desktop/src-tauri/src/` |

The ordering guarantee is where the three differ most. A Rust service is only as ordered as its
locks. A bought application is ordered per partition, by contract. Here, ordering holds per shop
for the one thing that must not race, token rotation, and every send is an independent,
idempotent decision instead of a queued job. A revoked consent then applies to the next send,
not to a backlog that was built before the revocation.

### Clean IDs are the precondition

The fan-out only stays correct if the identifiers it carries already agree. Three places where
they currently decide the outcome:

| Surface | Identifier that must be clean | What breaks if it is not | Status | Evidence |
|---|---|---|---|---|
| **Agentic checkout, chatbot, search** | Shopify GIDs for Product, ProductVariant and Customer | An agent's exact match resolves to the wrong variant, or to none. A deletion request finds "no match", which looks the same as "nothing to erase". | Partial | Normalised at read (`toCustomerGid`, `index.ts:1288`); stored in mixed forms |
| **Merchant Center + Smart Bidding** | Offer ID and GTIN | The same product lists as two offers, and conversions don't join back to the item that was bid on. This worker keys offers by handle; confirm the store's native Google channel uses the same key before running both. | Partial | Offer ID = handle, `index.ts:19718`; cross-channel key is unverified |
| **ERP / Dynamics / SAP, warehouse naming, ISO data** | GTIN/MPN mapped to material or item number; ISO 3166 country, ISO 4217 currency, ISO 639 language | Pick lists, stock and landed cost key to a name the storefront never published. Cross-border pricing keys to a market code that doesn't match. | Gap | No GTIN-to-material map in the worker; ISO codes are used in the Merchant projection only |

### EU data residency and disclosure

**For the BA and leadership.** If a plugin or CRM on a US server handles EU customers' data,
that is a transfer out of the EU under GDPR Chapter V. The edge doesn't make this go away —
Cloudflare is a US company too — so every hop needs a check, not just the obvious ones.

**What every US hop requires:**

1. **A transfer mechanism.** Either the vendor is certified under the EU–US Data Privacy
   Framework, or you sign standard contractual clauses and do a transfer impact assessment.
2. **A data-processing agreement** (GDPR Art. 28), with the vendor named on your subprocessor
   list.
3. **Disclosure in the privacy notice** (Art. 13(1)(e)–(f)): who receives the data, that it
   leaves the EU, and the safeguard that applies.
4. **An entry in the record of processing** (Art. 30).
5. **In Germany, an informed cookie consent.** The banner or its settings layer names the vendors
   that will receive data.

| Where the data sits | Is it a transfer? | What to do | Status in this stack |
|---|---|---|---|
| **Plugin or CRM on a US VM** | Yes, always | All five steps. Often the weakest link, because plugins add subprocessors of their own. | — |
| **Klaviyo** | Usually; check where the account's data is hosted | DPA, check Data Privacy Framework status, disclose. Send only consented profiles. | Production connector has not run |
| **Salesforce** | Avoidable for storage with EU hosting (Hyperforce EU). Support or admin access may still be a transfer. | Choose the EU region, DPA, disclose. | Inbound webhook and erasure only; not connected outbound |
| **Cloudflare Workers (edge)** | A US provider. EU visitors are usually served from EU locations, but that isn't guaranteed by default. | DPA and disclosure. To keep processing inside the EU, use Cloudflare's Data Localization Suite (enterprise). | Built; not EU-pinned |
| **KV** — revenue weights `pltv:<shop>:<uid>` | Yes. KV replicates globally, and a user ID with a score is still personal data. | Store only pseudonymous IDs and disclose, or move EU tenants to an EU-pinned store. | **Gap** — global today (`index.ts:6816`) |
| **Durable Objects and R2** | Can be kept in the EU | Both support an EU jurisdiction setting. Use it for EU tenants' state and consent evidence. | Available; not configured for EU |
| **Xano — the record** | Depends on the instance region | Host EU tenants' identity and consent on an EU-region instance, so the system of record stays in the EU. | Per tenant |
| **Google (GA4, Ads, Customer Match)** | Yes | Data Privacy Framework and Google's terms. Hashed emails still count as personal data. Disclose, and keep every send behind the consent check. | Sends gated per subject (`releaseGateFor`, `index.ts:1095`) |

**The design rule.**
- Keep EU identity and consent in the EU: an EU-region Xano record and an EU-jurisdiction
  evidence store.
- Send the edge and US tools pseudonymous IDs only, and only what each one needs.
- Give every remaining US hop the five steps above.

This sharpens the middleware argument. A plugin on a US VM holding standing credentials to every
system is one large transfer you have to disclose and defend. A record kept in the EU, with
narrow, consent-checked projections out, is several small transfers — each one justified on its
own and each one revocable.

> **What this section does not claim.** Vendor certifications and regional-hosting options
> change. Check each vendor's current Data Privacy Framework entry and hosting documentation
> before relying on this table. This is engineering guidance, not legal advice.

### What this choice costs

| Cost | What it means | Severity |
|---|---|---|
| A network dependency before every send | If the Xano check is unreachable, Google and Shopify payloads stop. That is the design, but it is also an outage. | High during an outage |
| Xano behaviour that can look like success | A write with a field that has no column returns 200 and drops the field. Every new field must be read back. | Medium |
| Two vendors instead of one VM | Two consoles, two sets of platform limits, two contracts. | Medium |
| ERP connectors are not native | The ERP side is a projection you point at your own endpoint, not a prebuilt connector. | Medium |
| No broker, request-scoped compute | Isolates have per-request CPU limits and no durable queue. Heavy CPU work (mesh or media processing) belongs in a Rust service or a container, not the worker. A failed send is retried by the caller, not redelivered. | Medium |
| One Durable Object per shop is a ceiling | Serialising per shop is correct for token rotation, but it caps that path's throughput for one tenant. | Low today |
| You own the AI layer | Open models on Workers AI are not frontier models. Evaluation, model upgrades and platform quotas are yours, with no vendor SLA. | Medium |

The rest of this article takes one of those identifiers, the GTIN, and asks how much of it can
be trusted: what its check digit proves, and where trust actually sits when it travels in a QR
link.

> A check digit proves a number was copied correctly. It says nothing about whether the number
> is real, who issued it, or whether the link carrying it was ever minted by you.

## 2. Vocabulary

### For the Product Lead / BA: GTIN and MPN in plain terms

Every channel in this article — the agent at checkout, Merchant Center, Smart Bidding, the
warehouse — recognises a product by one of two numbers. Owning them is a product decision, not
an engineering one.

- **GTIN (Global Trade Item Number)** is the number under the barcode. The brand owner licenses
  it from GS1, and it identifies one exact sellable version: one size, one colour, one pack
  count. UPC (12 digits) and EAN (13 digits) are both GTINs. When a scanner, a marketplace or
  Google says "this exact product", this is the number it means.
- **MPN (Manufacturer Part Number)** is the maker's own catalogue code. It is only unique
  together with the brand name, because two makers can use the same code. It is the fallback
  for products without a GTIN: custom, made-to-order, private-label or spare parts.

| Question | GTIN | MPN |
|---|---|---|
| Who assigns it | The brand owner, from a GS1 licence | The manufacturer, however it likes |
| Unique on its own | Yes, worldwide | No — only together with the brand |
| One per | Sellable variant (size, colour, pack) | Whatever the maker decides; often per model |
| Google Merchant Center | Expected for any product that has one assigned (check Merchant Center's current product data spec) | Brand + MPN when there is no GTIN |
| What breaks if it's wrong | Listings disapproved or merged with someone else's product; conversions credited to the wrong item | Weak matching; the product competes as "unidentified" |

**What the Product Lead owns:**

1. Every variant carries a GTIN, or brand + MPN when it has no GTIN. Nothing ships with neither.
2. One source for the field: the Shopify variant barcode feeds the identifier plane, and nothing
   downstream retypes it.
3. Never reuse a GTIN across variants, and never invent one. A made-up number can pass the
   check-digit test in §3 and still belong to someone else's product.
4. When a variant changes in a way a buyer would notice — size, colour, pack — it gets a new
   GTIN, not an edited one.

### Verification terms

Three mechanisms get called "verification". They answer different questions.

| Term | Means | Is not |
|---|---|---|
| **Check digit** | Error detection. A weighted sum, mod 10, appended to a GTIN so a scanner can reject a misread. | A secret, a key, or proof the GTIN was issued by GS1. Anyone can compute one. |
| **Hash (SHA-2 family)** | Integrity. A fixed-length fingerprint; change one input bit and the output changes unpredictably. | Proof of *who* produced the data. A hash with no signature only says "unchanged since someone hashed it". |
| **Signature (Ed25519, RSA)** | Authenticity. Proves the holder of a private key produced or approved the data. | Proof the person holding the object is entitled to it. A signed thing can still be copied. |
| **JWKS** | A published set of *public* keys, at `/.well-known/jwks.json`, that lets anyone check a signature without calling the issuer. | A key exchange. Nothing is negotiated; the verifier only reads. |

## 3. What a GTIN check digit does

The last digit of every GTIN (GTIN-8, GTIN-12/UPC, GTIN-13/EAN, GTIN-14) is computed from the
others:

1. Take every digit except the check digit.
2. From the **rightmost**, multiply alternately by 3, 1, 3, 1…
3. Sum the products.
4. The check digit is whatever brings that sum to the next multiple of 10 (0 if it is already one).

Worked example: the EAN-13 body `400638133393` weights to a sum of 89, so the check digit is
**1** and the GTIN is `4006381333931`.

```js
function gtinCheckDigit(body) {            // body = digits without the check digit
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const d = +body[body.length - 1 - i];
    sum += d * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}
const isValidGtin = g => /^\d{8}$|^\d{12,14}$/.test(g) &&
  gtinCheckDigit(g.slice(0, -1)) === +g.slice(-1);
```

### What it catches — measured

| Error | Caught? | Evidence |
|---|---|---|
| Any single wrong digit | Always | Weights 1 and 3 are both coprime to 10, so every single-digit change moves the sum mod 10. |
| Two adjacent digits swapped | Usually — **80 of 90** ordered digit pairs | Executed: the 10 misses are exactly the pairs that differ by 5 (0↔5, 1↔6, 2↔7, 3↔8, 4↔9). |
| Two or more independent errors | Not reliably | Errors can cancel in the sum. |
| A deliberately invented GTIN | **Never** | The algorithm is public. A forger computes the right digit in one line. |

### Why the weights start from the right

Because weighting is anchored at the check digit, **leading zeros never change the result**.
Executed: `400638133393` and `0400638133393` both yield check digit 1. Every GTIN therefore
zero-pads to 14 digits and stays valid, which makes a clean normalisation step for catalog
work: pad to 14, validate, then dedupe or match. It is how the same product listed as a UPC in
one feed and an EAN in another resolves to one row.

**What it never tells you:** whether the number is assigned to a real product, who owns it, or
whether it is the right GTIN for that SKU. That needs GS1's *Verified by GS1* lookup or the
brand's own product data.

## 4. Not SHA, not RSA

A check digit is in the same family as a credit-card Luhn digit or an ISBN check digit — cheap
error detection. There is no secret, no key and no cryptography in it.

GTINs and cryptography meet only in layers built **on top of** the GTIN: a GS1 Digital Link QR
carrying signed data, a serialisation scheme for anti-counterfeiting, a brand signing its own
product feed. In each of those the GTIN is the *payload*, and the signature over it is what
earns trust.

## 5. Where trust sits in a Channel Publish link today

> **Channel Publish: put the identifier on the box, the video and the stream, and know every scan.** Mint a QR or short link bound to the product's own GTIN/MPN, publish it on any channel, and read every scan back in your own ledger.
>
> - **Permissioned minting**: only an account holding the Channel Publish permission can create a link.
> - **Identifier-bound**: GTIN/MPN resolve server-side, the same values as the page's JSON-LD and barcode.
> - **Refuses forgeries**: a code that was never minted returns 404 and earns no attribution.
> - **Your ledger**: every human scan is counted against its mint; crawlers and probes are not.
>
> Signed, offline-verifiable links are on the roadmap: see §6 below.

<a class="doc-button" href="https://www.crm-sync.dev/products/channel-publish" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600;border-radius:0">Open Channel Publish: attributed links and QR codes →</a>

Channel Publish mints an attributed short link (`/r/<code>`) and a QR for it. Read from the
worker source at commit `b26b02c`:

**Status:** `Built` exists and runs · `Partial` exists with a stated limit · `Gap` absent.

| Layer | What it proves | Status | Evidence |
|---|---|---|---|
| **Permissioned minting** | Only an admin key, a tenant token, or a signed-in user holding the Channel Publish (`distribution`) or SBOM permission can create a link. Everyone else gets 401/403. | Built | `handleDistributionCreate`, `index.ts:25401` |
| **Server-side identifiers** | A product-bound mint takes its GTIN/MPN from the store's own identifier plane, never from the request body — the same values in the page's JSON-LD and the variant barcode. | Built | `index.ts:25430–25438` |
| **Registry lookup on scan** | The scan path resolves the code against the mint record. A code that was never minted returns `404 unknown link` and is never counted. Codes are 7 characters from a 31-symbol alphabet — about 2.75 × 10¹⁰ possibilities, so guessing a live one is impractical. | Built | `handleDistributionRedirect`, `index.ts:25565`; `distNewCode`, `index.ts:25292` |
| **Per-scan ledger** | Each human scan increments the mint's counter; crawler unfurls and HEAD probes are excluded. Xano `distribution_links` is the system of record. | Built | `index.ts:25589–25596` |
| **Owned domain** | The QR encodes a URL on the merchant's domain — the owned-URL pattern GS1 Digital Link standardises. TLS proves the resolver is yours. | Built | — |
| **Check-digit validation on mint** | GTINs are digit-stripped and length-classified for schema.org, but the check digit is not validated. A mistyped barcode in Shopify flows through unchanged. | Gap | `gtinProp`, `index.ts:19501` |
| **Offline-verifiable signature** | A third party holding only the scanned URL cannot prove you minted it without asking your server. Nothing in the link is signed. | Gap | No signature field on the mint row, `index.ts:25451–25458` |

**A correction to the obvious objection.** "Anyone can type a URL in your path format and print
it" is true of the *format* and false of the *count*: a fabricated code 404s and earns no
attribution. The registry is the verifier. What the registry cannot do is let someone **other
than you** check a link offline — and that is the only thing a signature adds.

## 6. Where a JWKS would fit

The worker already holds an Ed25519 key with generation, rotation, KV storage and a published
JWKS, used today for entitlement tokens, consent-row attestations and firmware certificates
(`index.ts:3376–3385`). Using it for minted links is a decision, not a missing capability.

1. **Sign at mint.** A compact payload — GTIN, channel, mint ID, creator, issued-at — as a JWS
   with `alg: EdDSA` and a `kid` header.
2. **Carry it with the link.** As a query parameter, or a short reference resolved at the edge.
   GS1 also defines an application identifier for a digital signature (AI 8030); confirm its
   current status before building on it.
3. **Verify against the published key.** The edge worker, a retailer, or an auditor checks the
   signature against `/.well-known/jwks.json`. Unsigned links or unknown `kid`s are flagged
   rather than counted.

## 7. What it costs

| Cost | What it means | Severity |
|---|---|---|
| Longer URLs | A JWS adds roughly 100+ characters; a denser QR prints worse at small sizes. A short edge reference avoids it but brings back the online lookup. | Medium — trade-off, not a defect |
| Key custody | A link signed on the shared worker verifies against the platform's key, not the merchant's. Only the Private Worker tier puts the merchant's own JWKS on the evidence. | Medium |
| Rotation | Printed packaging outlives keys. Retired `kid`s must stay in the JWKS for the life of the print run, or old boxes stop verifying. | High for packaging, low for video |
| **The copy problem — unsolved by any signature** | A printed QR is a bearer artifact. A signature proves you minted the link; it does not prove the scanner holds your package. A photographed code works anywhere. | Structural |

The copy problem is answered by the ledger, not the key: scan velocity, geography and channel
mismatch per mint. Signed links stop forged links and fake attribution. They do not stop copied
links.

> **What this document does not claim.** The product page states *"Nothing here is
> self-attested."* What is verifiable today is permissioned minting, server-resolved
> identifiers, a registry that refuses unknown codes, and an owned domain. None of that is
> cryptographically verifiable by a third party. Either sign minted links (§6) or narrow the
> line to what holds.

## 8. What to do next

Ordered by exposure.

| # | Step | Owner |
|---|---|---|
| 1 | Narrow the product-page claim to what is verifiable today, until signing ships. | Content owner |
| 2 | Validate the GTIN check digit at mint and at catalog import; refuse or flag on mismatch, and store the 14-digit padded form. | Worker developer |
| 3 | Sign minted links with the existing Ed25519 key and `kid`; keep retired keys published for the print run. | Security owner |
| 4 | Add per-mint anomaly signals (velocity, geography) to the scan ledger — the control for copied codes. | Data owner |
| 5 | Store Shopify customer and product IDs in one form (the full GID), and add the GID and GTIN to product-vector metadata so an agent's search result resolves straight to an exact match. | Worker developer |
| 6 | Confirm one Merchant Center offer key across this worker and the store's native Google channel before running both. | Data owner |
| 7 | Add a GTIN/MPN ↔ ERP material or item-number map in Xano, with ISO country, currency and language codes, before any ERP or warehouse projection goes live. | Solutions architect |
| 8 | Run a holdout test — predicted-value bidding against past-spend bidding, same budget and period — and report that lift, not the illustrative table. | BA with the data owner |
| 9 | For EU tenants, move revenue weights out of global KV to an EU-pinned store, host the record on an EU-region Xano instance, and list every US hop in the privacy notice and subprocessor list. | Solutions architect with the DPO |

---

*Evidence: worker source at commit `b26b02c`; arithmetic executed 2026-10-17. Line numbers
drift; the function names are the stable reference. This is an engineering note, not a
certification.*
