---
title: "Middleware vs AI Architecture"
description: "Why a Xano record plus a Cloudflare edge resolves identifier and consent drift that VM-hosted middleware cannot, what a GTIN check digit proves, and where cryptographic trust sits in a Channel Publish QR link."
canonical: https://persephonepunch.github.io/crm-sync-setup/middleware-vs-ai-architecture.html
category: "Specs"
date: 2026-10-17
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

> Every system that acts on a product — an agent at checkout, a bid in Google Ads, a pick in a
> warehouse — acts on an identifier. Clean IDs come before agentic commerce, not after it.

**Who this is for.** A merchant putting QR codes on packaging, a developer wiring the scan
path, an architect choosing where integration runs, and a compliance reviewer asked to sign off
on the word *verified*.

**The question it answers.** Where must identifiers be reconciled so that every channel acts on
the same product and the same person at the same moment — and once they are, how much of an
identifier can be trusted?

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

### The "right" non-blocking IO

Non-blocking is the revenue condition: five destinations, a model score and a permissions check
can't run as a serial queue at checkout speed. But not everything may be deferred. The rule
is: **decide before sending, defer only the bookkeeping.**

| Work | Blocking? | Why | Evidence |
|---|---|---|---|
| Resolving weights for an audience | No — one parallel pass | A model score is a lookup, not a reason to wait on each buyer in turn | `Promise.all` over eligible members, `index.ts:11171` |
| Permissions decisions across members | Bounded — 8 at a time | Parallel enough to keep pace, bounded so the record isn't flooded | `gateEach(…, concurrency = 8)`, `release-gate.ts` |
| The send itself | **Waits for its own decision** | A send that fires before its permissions answer is the failure the boundary exists to stop | Fail-closed rule, `release-gate.ts` |
| Scan counters, ledger and cache writes | Deferred off the response path | The customer shouldn't wait on bookkeeping; the write still completes | `ctx.waitUntil`, 18 call sites in `index.ts` |
| One slow destination | Isolated | Each destination is its own send with its own decision; Merchant Center being slow doesn't hold up GA4 | Independent sends, section 1 |

Bought middleware usually inverts this. The queue is non-blocking for everything, including the
consent check that should have come first.

> **What this section does not claim.** No revenue lift is measured here, and none is quoted.
> Predicted-LTV scoring needs enough purchase history to train on, and BigQuery ML and Vertex
> need Cloud Console access that the analytics team owns. Without that handoff, the audience
> push falls back to past spend, and everything else above still works.

## 1. The challenge and the solution

![Fee dependency vs. architectural map: on the left, bought middleware on a managed VM, with a fee on the VM, each environment, the AI add-on and every connector; on the right, a Xano record and a Cloudflare edge, with fees on the plan and on usage, and every send a ledgered permissions decision.](https://crm-sync.dev/kb/media/docs/fee-dependency-vs-architectural-map.svg)

**Fee dependency vs. architectural map — summary.** Both sides have fees. They attach in
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

---

*Evidence: worker source at commit `b26b02c`; arithmetic executed 2026-10-17. Line numbers
drift; the function names are the stable reference. This is an engineering note, not a
certification.*
