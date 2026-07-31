---
title: "REST Is Not GraphQL"
description: "What actually breaks when a Shopify integration moves from REST to GraphQL: the inverted error model, cost-based rate limiting, GID identifiers, cursor pagination, and the surfaces that exist in only one API — with the failure mode each produces and an audit checklist."
canonical: https://persephonepunch.github.io/crm-sync-setup/rest-is-not-graphql.html
category: "Shopify"
date: 2026-07-27
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/REST-IS-NOT-GRAPHQL.md
---
# REST Is Not GraphQL

**For:** engineers and technical leads porting a Shopify integration, and the people who have to sign off on the result.
**Companion surface:** [Two Ways to Give an Agent a Key](https://persephonepunch.github.io/crm-sync-setup/agent-key-custody-models.html), on why owning the integration layer matters at all.

Shopify has made GraphQL the primary Admin API, and REST the legacy one. That is a reasonable direction and GraphQL is the better interface for most of what integrations do. The problem is the word most teams reach for when planning the work: **port**.

A port implies the two APIs are the same operations in different syntax — swap the client, translate the URLs, ship. They are not. GraphQL differs from REST in five places that matter operationally, and each one has a failure mode that does not announce itself. Integrations do not usually break at cutover with a stack trace. They break three weeks later, intermittently, in a way that looks like a data problem.

This document is the list, the failure mode each divergence produces, and a checklist for auditing an integration you have already migrated.

## 1. The error model inverts

This is the one that costs the most and is spotted the latest.

**REST** signals failure with the HTTP status line. A `422` is a validation failure, a `403` is a permission problem, a `404` is a missing resource. Client libraries surface these as exceptions or falsy responses, and the ordinary shape of integration code — `if (!response.ok) handleError()` — catches them by default.

**GraphQL** returns **`200 OK` for a request that was successfully processed**, and reports business-level failure *inside the response body*, in a `userErrors` array on the mutation payload:

```json
{ "data": { "productUpdate": {
    "product": null,
    "userErrors": [ { "field": ["handle"], "message": "Handle has already been taken" } ]
} } }
```

The HTTP status is 200. `response.ok` is `true`. A ported client that checks only the status treats this as a successful write.

**Failure mode:** silent no-ops. The integration reports success, dashboards show green, and the data simply never changed. Because nothing throws, no alert fires and no retry happens. The discrepancy surfaces days later as "the feed is wrong," and the investigation starts in the wrong place — usually in the data, not the client.

**What correct handling looks like:** every mutation response must be checked for a non-empty `userErrors` (and the schema-level `errors` array, which is separate and signals malformed queries or throttling). Treat a non-empty `userErrors` exactly as you would have treated a `422`. If your codebase has one HTTP wrapper, this belongs there, once — not in each call site, where it will be forgotten.

## 2. Rate limiting stops counting requests

**REST** uses a leaky bucket over **request count**: a bucket of calls that refills at a fixed rate. Throttling is a function of how many times you call, and a `429` tells you plainly that you called too often.

**GraphQL** budgets **calculated query cost**. Every query is assigned points based on the shape of what it requests — connections and nested fields cost more than scalar fields — and the response carries a `throttleStatus` showing `maximumAvailable`, `currentlyAvailable`, and `restoreRate`. You are limited by *how expensive your queries are*, not how many you make.

**Failure mode:** intermittent throttling under production load only. A REST pattern translated one-for-one usually becomes an N+1 query loop — fetch a list, then fetch details per item. In REST that pattern was merely slow. In GraphQL each iteration draws points, and past a certain catalogue size the job starts exhausting the budget partway through. It succeeds in staging, where the catalogue is small, and fails on the largest tenant, partially, with some records updated and some not.

**What correct handling looks like:** read `throttleStatus` from every response and back off *before* exhaustion rather than reacting to failures. Replace N+1 loops with the query shape GraphQL is for — request the nested data in one query — and move genuinely large jobs to the bulk operations API, which is asynchronous and exists precisely for this. Test against a realistic catalogue size; a small dataset will hide this class of bug indefinitely.

## 3. Identifiers change type

REST returns numeric identifiers: `12345678`. GraphQL uses a **global ID** — `gid://shopify/Product/12345678` — an opaque string that encodes the resource type.

**Failure mode:** everything downstream that persisted the old shape. Foreign keys in your own database, cached mappings, webhook payload joins (webhooks may carry both forms depending on topic and version), analytics keys, and any comparison written as `==` against a stored number. These do not fail loudly; they fail to *match*, which reads as missing data rather than as a bug.

**What correct handling looks like:** decide deliberately which form is canonical in your own store, convert at the boundary, and never mix them in the same column. Write the conversion helpers once. Audit anywhere an id crosses a system boundary — especially webhook handlers, which are easy to forget because they were not part of the API migration.

## 4. Pagination is a different contract

**REST** paginates with `Link` headers and a `page_info` token, and client code typically loops until the header is absent.

**GraphQL** uses cursor connections: `edges { node { … } }` with a `pageInfo { hasNextPage, endCursor }`, and you pass the cursor back as `after`.

**Failure mode:** truncated syncs. A hand-rolled port often fetches the first page and stops, because the loop condition it was translated from no longer exists in the response. The job completes without error and processes the first 50 or 250 records. On a small tenant that is the whole catalogue and nobody notices; on a large one, a stable fraction of products silently never sync.

**What correct handling looks like:** implement pagination once, in a helper that returns everything, and make it the only way the codebase reads a connection. Assert on expected counts in tests rather than trusting the absence of an error.

## 5. The two APIs do not cover the same surface

This is the divergence with the longest tail. Newer capabilities are **GraphQL-only**: bulk operations, several metafield and metaobject semantics, market and localization objects, and a growing set of newer resources. Some older conveniences remain easier in REST. The two are not a superset and a subset; they overlap.

**Failure mode — and the reason rollbacks hurt.** When a migration goes badly under time pressure, the pragmatic response is to revert to REST. That restores service, and it is often the right call in the moment. What it also does is **freeze the data shape at the older model's expressiveness**. Anything the newer API made reachable — richer identifiers, structured metafields, precise market and locale objects — stays unreachable until the migration is attempted again. Teams then plan roadmaps around data they believe the platform does not expose, when in fact their own integration layer is what cannot see it.

**What correct handling looks like:** before migrating, enumerate which objects your integration touches and check each against both APIs. Where something is GraphQL-only and you depend on it, that is not a detail — it is the reason the migration cannot be rolled back cleanly, and it belongs in the plan explicitly.

## An audit checklist

For an integration that has already moved, these questions find most of the damage. Each maps to a section above.

1. **Does every mutation call site check `userErrors`?** Grep for the mutation names and confirm. If the check exists in only some places, the others are silently failing today.
2. **Is `throttleStatus` read anywhere?** If not, you have no backpressure and the job that runs on the largest tenant is the one at risk.
3. **Are there N+1 query loops?** Look for a list query followed by a per-item query. Each is a cost multiplier.
4. **Is any identifier stored in both numeric and GID form?** Especially across webhook handlers and analytics.
5. **Does every connection read paginate to exhaustion?** Test with a dataset larger than one page.
6. **Which objects you depend on are GraphQL-only?** If the answer is "none," verify it rather than assuming it.
7. **Do you have contract tests against the API you actually call?** Not mocks — tests that would fail if the response shape changed.

## The other half: user data does not mix with product data

Everything above is the **product** side of a REST integration. There is a second audit, and keeping the two apart is the point.

**CRM Sync holds user data. PIM Sync holds product data. They are separate systems, with separate credentials, and they do not mix.**

That is a design decision rather than an accident of history. A product catalogue is published deliberately — it exists to be read by storefronts, feeds, marketplaces and agents. A customer record is the opposite: held under obligation, carrying consent and erasure duties, and every additional system that can reach it widens the blast radius of a leaked credential.

Fusing them is the common failure. When one platform holds both, the credential that syndicates your catalogue can also read your customers, and the review regime that governs marketing data starts governing your product feed. Kept apart, a product integration can never become a privacy incident. PIM Sync requests product scopes only — no customer or order access. Neither system is a smaller version of the other.

### Auditing the user-data side

The questions below are answerable from your own systems. None of them requires trusting a vendor's claim.

**Marketing platform — Klaviyo or equivalent**

1. **Is consent one flag, or one per purpose?** Consent Mode v2 asks for four signals. A single boolean cannot express them, and cannot be split later.
2. **Does a withdrawal reach every storefront**, or only the ones a sync happened to touch?
3. **For a named person on a named date, can you state which consent applied** — from a record, not from what the configuration probably was?
4. **Does a profile carry a market**, or is the market implied by whichever store the record arrived from?

**CRM or MDM — Salesforce or equivalent**

5. **Is identity keyed to a stable pseudonymous id, or to an email address?** Erasure against an email is destructive; against a key it is surgical.
6. **Can you erase a subject without destroying the transaction record** you are required to retain?
7. **Does the order carry the price actually paid**, in that market's currency, under the tax treatment that applied — or the list price at import time?
8. **Is history retained**, or does current state overwrite what came before?

**PMAX and predictive audiences**

9. **Are conversions sent with a lawful basis attached**, or modelled because no basis was recorded?
10. **If an audience was built partly from unconsented events, can you identify and rebuild it** — or only delete it?
11. **Does the feed price match the price displayed in that market** at the moment of the click?
12. **Can you say which product identifier the bid was optimised against**, and does it still resolve?

**The separation test**

13. **Can the credential that syndicates your catalogue also read your customer table?** If yes, you have one system wearing two names.
14. **Can you revoke a product integration's access without touching customer data, and the reverse?**

The product half of this audit lives with the product system. [**PIM Sync**](https://www.crm-sync.dev/pages/pim-sync) is that system — catalog shape, the market and time axes, and migrating a flat export to catalogs and metaobjects — with the argument in [REST is not GraphQL: ten places the missing dimension shows up](https://pim-sync.pages.dev/rest-is-not-graphql) and the procedure in [From product.csv to Catalog and metaobjects](https://pim-sync.pages.dev/csv-to-catalog).

Read the product side there; keep the user side here. That the two have separate checklists, separate systems and separate credentials is not an inconvenience to route around — it is the control.

## Why this belongs to you

The deeper point is not about either API. It is about **who owns the integration layer**.

Platform APIs advance. Versions deprecate on a published schedule, and every integration written against an older shape eventually has to move. An organization that reaches its commerce platform *through* a third-party integration layer inherits that vendor's migration schedule rather than setting its own: the work is real, it lands on somebody else's roadmap, and under time pressure a rollback to the older interface is sometimes the only available answer — with the freeze described above as the lasting cost.

An organization that owns its own edge integration schedules the migration itself, tests it against its own contract tests, and — if every write is already recorded — can prove afterwards which records moved and which did not. That last property is worth more than it sounds during a migration, because the expensive question is never "did it break." It is "what exactly happened while it was broken."

That recording is a design choice, not a byproduct — see [Two Ways to Give an Agent a Key](https://persephonepunch.github.io/crm-sync-setup/agent-key-custody-models.html) for how signed, timestamped records are produced and verified, and §7 of that document for why syndication-first systems (channel managers and PIMs) answer *what is true now* rather than *what was true then*. For the same principle applied to a regulated artefact, see [Firmware, SBOM & the Cyber Resilience Act](https://persephonepunch.github.io/crm-sync-setup/firmware-sbom-cra.html).

## What the single-hop model costs you next

There is a further reason this matters now, beyond migration hygiene.

Most bought integration middleware encodes a **single-hop data model**: read from a source, transform through a mapping declared at design time, write to a destination. Order of execution is fixed by the pipeline definition. Field binding is static — this field maps to that field, always. Permissions are checked at the boundary, once, as credentials rather than as context. That model was correct for the problem it was built for, and it is why these products scale so well at throughput.

It is also the wrong shape for what AI can now do in the path.

An event-scoped intelligence layer can decide things the pipeline cannot express:

- **Order of execution as a decision, not a diagram.** Which write goes first depends on what this event contains, what state the destination is in, and what has to be true before the next step is safe — determined at event time, not fixed months earlier.
- **Conditional data binding.** Which field feeds which destination can depend on market, locale, consent state, contract terms, or the presence of a competing assertion from another upstream. A static mapping cannot represent "bind this only when consent covers this jurisdiction."
- **Rules-based permissions resolved per event.** Not "does the connector hold a valid credential," but "is *this actor* — human or agent — entitled to cause *this specific effect*, at this scope, under the consent in force right now." That is a per-event question, and a per-event answer.

Taken together, that is **real-time event scoping**: the middleware understands the event well enough to decide sequence, binding, and authority as the event happens, and records what it decided. It is the difference between a pipe and a participant.

Bought software cannot easily be taught this, because the limitation is not intelligence — it is the data model. There is nowhere in a single-hop mapping to express a conditional binding, no representation of an actor whose authority varies by event, and no slot for a decision record. You cannot bolt event scoping onto a system whose schema assumes one hop with a fixed shape; you would be rebuilding it.

Which returns to ownership. If your integration layer is yours, the intelligence has somewhere to live: it sits in the path, sees the whole event, decides with full context, and writes down what it decided and why. If the layer belongs to a vendor, the most capable middleware partner available to you is standing outside a system that has no interface for it — and the migration you are planning today determines which of those two positions you occupy for the next several years.

---

*Vendor-neutral and platform-general: the specifics here are Shopify's Admin API, but the divergences — inverted error semantics, cost-based limits, identifier shape, cursor pagination, and unequal surface coverage — recur in most REST-to-GraphQL migrations.*
