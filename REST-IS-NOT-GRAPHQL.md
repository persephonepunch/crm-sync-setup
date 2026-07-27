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

## Why this belongs to you

The deeper point is not about either API. It is about **who owns the integration layer**.

Platform APIs advance. Versions deprecate on a published schedule, and every integration written against an older shape eventually has to move. An organization that reaches its commerce platform *through* a third-party integration layer inherits that vendor's migration schedule rather than setting its own: the work is real, it lands on somebody else's roadmap, and under time pressure a rollback to the older interface is sometimes the only available answer — with the freeze described above as the lasting cost.

An organization that owns its own edge integration schedules the migration itself, tests it against its own contract tests, and — if every write is already recorded — can prove afterwards which records moved and which did not. That last property is worth more than it sounds during a migration, because the expensive question is never "did it break." It is "what exactly happened while it was broken."

That recording is a design choice, not a byproduct — see [Two Ways to Give an Agent a Key](https://persephonepunch.github.io/crm-sync-setup/agent-key-custody-models.html) for how signed, timestamped records are produced and verified, and §7 of that document for why syndication-first systems (channel managers and PIMs) answer *what is true now* rather than *what was true then*. For the same principle applied to a regulated artefact, see [Firmware, SBOM & the Cyber Resilience Act](https://persephonepunch.github.io/crm-sync-setup/firmware-sbom-cra.html).

---

*Vendor-neutral and platform-general: the specifics here are Shopify's Admin API, but the divergences — inverted error semantics, cost-based limits, identifier shape, cursor pagination, and unequal surface coverage — recur in most REST-to-GraphQL migrations.*
