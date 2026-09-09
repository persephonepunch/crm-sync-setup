---
title: "BYO Shape Pipeline"
description: "How to bring your own Xano to the data-shape pipeline: the merge contract, the write path, the entitlement gate, and how to swap the runtime for Kubernetes or the model for Google AI — without buying anything that isn't self-serve."
canonical: https://persephonepunch.github.io/crm-sync-setup/byo-shape-pipeline.html
category: "Specs"
date: 2026-09-09
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/BYO-SHAPE-PIPELINE.md
licence: CC-BY-4.0
---
# BYO Shape Pipeline

**For:** anyone bringing their own Xano instance to this pipeline, and anyone who intends to run
the decision seam on Kubernetes and the model on Google AI rather than on the defaults.

**The promise this document has to keep:** every dependency named below is self-serve. No
enterprise agreement, no named account team, no seat you have to negotiate for. Where a
component *could* be bought, the open path is stated beside it. If you hit a paywall following
these instructions, that is a bug in the instructions.

---

![The BYO shape pipeline — challenge, solution, opportunity](https://crm-sync.dev/kb/media/docs/byo-shape-pipeline.svg)

*The whole pipeline on one page. Dashed borders mark everything a packaged install cannot
guarantee, or that carries a trap — read those first.*

## What a shape is, and why the contract is small

A shape is a data model that a design surface authors and a runtime renders. Not a page edit —
a record with fields, provenance, and a version. Designers and developers exchange shapes; the
edge merges, gates and ledgers every change.

The whole contract is four things. Implement these and you are on the pipeline, whatever else
you swap:

1. **A merge order**, deterministic, with per-field provenance.
2. **A capability** that gates writes, resolved per subject at request time.
3. **A ledger append** on every accepted change, hash-chained.
4. **A read endpoint** that returns the merged shape *and* which layer won each field.

Everything else — the runtime, the model, the CMS, the store — is substitutable. That is the
point of writing the contract down rather than shipping a connector.

---

## The merge order

Three layers, lowest to highest precedence:

| Layer | Provenance tag | Home | Who authors it |
|---|---|---|---|
| Base | `github-base` | A JSON file in a git repo | Developers, by commit |
| CMS | `webflow-cms` | A Collection item, slug matching the shape | A non-technical author, by publish |
| Override | `kv-override` | Per-tenant key-value | The runtime, per store |

A field present in a higher layer wins. A field absent falls through. **The response must name
the winning layer per field** — a merged shape that cannot say where a value came from is a
render, not a record, and you have lost the only property worth having.

Reference implementation: base at `shape-promo.json` in this repo, CMS layer resolved by
Collection slug `shapes`, override at a tenant-scoped KV key. Collection id is cached for an
hour and can be pinned to skip discovery. Reads carry a 60-second edge micro-cache so the CMS
API is never hammered.

### One thing to decide before you build

The reference reads the CMS **live items** endpoint — published items only. If your authors work
in a *private or draft* collection, that layer will be invisible and you will debug a merge that
silently has two layers instead of three. Either have authors publish, or read the drafts
endpoint and accept that unpublished work goes live at merge time. Pick deliberately; both are
defensible, and the failure mode of picking by accident is a shape that looks correct and is stale.

---

## The write path

Two legs. Build the first; the second is what makes it survive contact with a real tenant.

### Leg 1 — the primary path, through the decision seam

```
CMS publish
  → webhook (HMAC-verified)
  → decision seam: resolve subject, check capability, merge, decide
  → write: system of record + git commit + commerce projection
  → ledger append (hash-chained)
```

The decision seam is the only place that may refuse. It holds the credentials, it resolves the
capability, and it records both outcomes. **A refusal appends to the ledger exactly like an
acceptance** — a rejection that leaves no trace is indistinguishable from a bug, and the first
question anyone asks after an incident is what you refused and when.

Verify the webhook signature before anything else. An unverified event is not a
lower-confidence event; it is not an event. If your CMS emits any webhook variant it does not
sign, that variant is an unauthenticated write path into your record — allow-list it to the
topics that genuinely cannot be signed, or reject it.

### Leg 2 — the catch-up path, a Xano Database Trigger

The webhook cannot see an edit made directly in the backend. A Database Trigger on the shapes
table can, and it is the right primitive for it — not middleware, which wraps an endpoint, and
not a Realtime trigger, which fires on channel activity.

Use it as a **reconciler**, not as the primary path:

- It runs on insert and update, and re-emits the change into the same merge and ledger.
- It must be idempotent. The same row arriving twice must produce one ledger entry, not two.
- It must not be the only way a change reaches the record, because you cannot guarantee it exists.

That last point is the whole BYO problem, and it deserves its own section.

---

## BYO Xano: the gate must exist twice

**Middleware attachment is a UI action.** So is trigger creation. Neither can be reliably
provisioned into someone else's workspace, which means a packaged install can be *complete* and
still have the gate half-attached, or absent.

The pattern that survives this is already in the reference implementation, and its own
description says why it exists:

> *The gate as a callable. Same rules as the middleware, reachable by an endpoint directly — so
> a packaged install is secure even when the UI-only middleware attachment is skipped or
> half-done. Returns the resolved tenant and scopes; throws on any failure. One copy of the
> rules either way.*

So: **write the authorization rules once, expose them twice** — as a pre-middleware for the
normal path, and as a callable function that every endpoint invokes directly. The endpoint does
not assume the middleware ran. If both are present the rules execute once and agree, because
there is only one copy of them.

### Verify, do not assume

Provisioning a trigger is a setup step. Proving it fires is a different thing, and only the
second one is worth anything. Ship a probe:

1. Write a canary row to the shapes table through the backend directly, bypassing the webhook.
2. Wait a bounded interval.
3. Assert the ledger contains exactly one entry for that canary.
4. If not, the tenant's install is **degraded, not broken** — say so plainly on their status
   surface, and keep the primary path running.

A pipeline that reports healthy while one leg is silently absent is the failure that costs the
most, because nothing looks wrong until an audit asks.

### Backend traps that will bite you

- **Silent field drops.** Writing a field the schema does not know returns success and stores
  nothing. Read back what you wrote, or assert the response shape — do not trust a 200.
- **Multi-key search ignoring a filter.** A search with several keys can return rows that match
  only some of them. Validate the rows you got, do not assume the query constrained them.
- **Plan tier, and whose plan.** Trigger availability and execution limits vary by tier. Check
  the tier of *the instance the pipeline will run on* during onboarding, not when a trigger
  silently fails to fire. Two traps here: a workspace can sit on a different tier from the
  account that owns it, so read the label on the workspace rather than the invoice; and
  grandfathered pricing does not transfer. If whoever wrote your runbook holds an early
  fixed-fee plan, the person following it today is quoting current rates, possibly
  usage-based. Never budget a BYO install from someone else's plan.

---

## Entitlement: how the write capability is granted

Writes require one capability. It arrives by exactly two routes, and both are self-serve:

| Route | Mechanism |
|---|---|
| **Purchase** | A matching purchase grants the capability to the buying subject. |
| **Invitation** | A team invite carrying the shape role tag grants the same capability. |

Nothing else grants it. In particular, being an administrator of the CMS does not — authoring a
Collection item and being permitted to change the record are separate decisions, and collapsing
them hands the record to whoever holds a design seat.

Grant the write capability and nothing adjacent. A shape author needs to write shapes; they do
not need theme control, release promotion, or evidence export. If your role model cannot express
that distinction, the role model is the thing to fix — not the gate.

**Check the capability at the point of action, not at the door.** A session that was entitled
when it started may not be entitled now. Resolve per request, per subject.

---

## Swapping the runtime: Kubernetes

Nothing in the contract requires a specific runtime. The decision seam is a request handler that
can resolve a subject, check a capability, merge three layers, write, and append to a ledger. A
container on Kubernetes does that as well as an edge worker.

What you take on when you move it:

| Concern | Edge default | On Kubernetes |
|---|---|---|
| Micro-cache | Edge cache, built in | Your own cache; add one, or the CMS API takes every read |
| Per-tenant KV | Key-value binding | Any keyed store — Redis, a table, a ConfigMap for static tenants |
| Ledger | Chained rows with a unique-index compare-and-swap | Any store that gives you a **CAS on the chain tip** — see below |
| Secrets | Runtime secret binding | Kubernetes Secrets, or a cloud KMS; do not bake them into images |
| Signature verification | Standard crypto | Same; no platform dependency |

**The ledger is the one that has a wrong answer.** The chain needs a compare-and-swap on the tip
so two concurrent writers cannot both commit against the same predecessor. A unique constraint
on `(tenant, stream, previous_hash)` gives you exactly that in any relational store: the loser
takes a constraint violation, re-reads the tip and retries. Do **not** implement this on an
eventually-consistent key-value store — a read after a write can return the old tip, both writers
chain from the same point, and the verifier then reports the whole chain as broken. A concurrent
write becomes indistinguishable from tampering, which destroys the evidence in both directions
at once.

Order by sequence, never by timestamp. Timestamps from a distributed runtime are not monotonic
and are not a total order.

---

## Swapping the model: Google AI and other LLM services

The pipeline does not care which model you call, because the model is never in the authorization
path. Ranking, enrichment and generation consume the merged shape; they do not decide whether a
write is permitted. Keep it that way.

Two integration shapes, both self-serve:

- **SQL-fronted.** Declare a remote model in your warehouse and call it from a query. Nothing is
  deployed, there is no serving endpoint, and no service account is bound to inference. The
  simplest thing that works, and the one with the smallest blast radius.
- **A deployed endpoint.** More capable, and it introduces the permission problem worth knowing
  about before you meet it: **an endpoint executes as the identity bound to it at deploy time,
  not as the caller.** A caller holding only "invoke" reaches every data source that deploy-time
  identity can read. Give each endpoint its own minimal service identity, and make sure nobody
  holds both "deploy a model" and "choose what it runs as" — that pair is the real privilege
  boundary, and it is usually assigned by two different people months apart.

If you encrypt training data or model artifacts with your own key, a cloud key service is
self-serve and priced per key and per operation. External key managers exist and are
enterprise-sold; you do not need one to hold your own key.

---

## The no-blocker inventory

Every dependency, and how you get it:

| Dependency | Self-serve? | Open alternative |
|---|---|---|
| Git host | Yes, free tier | Any git remote; the contract needs a repo, not a vendor |
| CMS for the authoring layer | Yes | Any CMS with an items API and webhooks; the layer is a JSON merge |
| Backend / system of record | Yes | Any backend with triggers and a function stack |
| Edge or container runtime | Yes | Any HTTP runtime |
| Key-value / cache | Yes | Redis, or a table |
| Ledger store | Yes | Any relational store with a unique index |
| Signing keys | Yes | Generate locally; publish the public half as a JWKS |
| Cloud key service (optional) | Yes, per-key pricing | Self-hosted transit signing, at the cost of running it |
| LLM | Yes, pay-per-token | Any provider, or a local model |
| Secrets management | Yes | Runtime secret bindings or Kubernetes Secrets |

Nothing in that table requires a procurement cycle. The two components that *usually* carry one
— enterprise secrets management and an external key manager — are both marked optional, with the
open path beside them, because the discipline they sell is written rather than purchased: leases
instead of long-lived strings, policy instead of key possession, audit as a first-class output.

---

## What to check before you call it done

- [ ] A merged read names the winning layer for **every** field.
- [ ] A write without the capability is refused, and the refusal is in the ledger with the rule
      that fired.
- [ ] The webhook signature is verified, and every unsigned variant is either allow-listed by
      topic or rejected.
- [ ] The canary probe proves the catch-up trigger fires, and a degraded install says so.
- [ ] Two concurrent writes to the same chain tip produce one commit and one retry — not two
      commits, and not a forked chain.
- [ ] Replay is by sequence, never by timestamp.
- [ ] No model sits in the authorization path.
- [ ] Every credential the pipeline uses is held by the component that can refuse a request, and
      by no other.

The last one is the summary of all the others. A pipeline is trustworthy exactly to the degree
that the thing holding the credentials is also the thing that can say no.
