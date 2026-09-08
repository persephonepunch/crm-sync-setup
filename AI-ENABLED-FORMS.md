---
title: "AI enabled forms with LLM weighting — one form, many outcomes"
description: "A form collects intent, policy and permission in the same moment. This is the business case for owning the infrastructure behind it — against CRM latency, per-contact fees and vendor lock-in — with sprint directives, the compile and binding models, and why a claim's shape decides what an AI can later be asked."
canonical: https://persephonepunch.github.io/crm-sync-setup/ai-enabled-forms.html
category: "Specs"
date: 2026-09-08
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/AI-ENABLED-FORMS.md
licence: CC-BY-4.0
---
# AI enabled forms with LLM weighting — one form, many outcomes

**One form, many outcomes.** A single submission becomes a claim, a consent record, an audience
signal, a customer and a permission — if the infrastructure behind it is yours.

![One POST. Three writes to the record, one conditional projection to Shopify, one transition-only escalation, and four permission planes downstream.](https://crm-sync.dev/kb/media/docs/form-socket-permissions.svg)

*One POST. Three writes to the record, one conditional projection to Shopify, one transition-only
escalation, and four permission planes downstream. Solid arrows are writes; dashed are reads.*

## Who this is for

A business analyst who needs to know what the form can later be asked. A developer who has to build
the binding. A compliance reviewer who has to prove a permission was given. A designer who authored
the form and expects it to keep working after export.

Those four disagree most often about one question: **what does the page carry, and what does it
fetch?** That is the compile question, and every other decision here follows from it.

### One vocabulary

These words get used loosely. A document arguing for closed vocabularies opens with its own.

| Term | Means | Why the distinction pays |
| --- | --- | --- |
| binding | the rule connecting displayed state to stored state | Frameworks differ on direction and owner, not on whether they have one. |
| field | a value the person typed | The only part of the payload they can be said to have authored. |
| extra | a value the script attached without being asked | Never asked for, always recorded — so it must be disclosed, not merely collected. |
| intent | what the person is asking the business to do | Distinct from the field that carried it. One checkbox can declare intent, policy and permission at once. |
| policy | what the jurisdiction requires of that intent | Attaches to the subject, not the store. The same submission is governed differently in Quebec and Texas. |
| permission | what the system may do next as a result | An entitlement is what a subject may do; a mandate is what an agent may do for them, bounded. Three words, not one. |
| claim | a typed boolean asserting what is true now | Joinable and filterable. This is the half a model can weight. |
| evidence | the dated row saying how the claim became true | Answers "where exactly did they accept?" without anyone remembering. |
| mirror | a derived, joinable copy of an authored collection | Rebuildable by definition, which is what lets it be queried in ways the authoring API cannot. |
| stream | one entity's events, carried on their own clock | Folding several entities into one event table loses each one's transitions — the thing audiences are built from. |
| projection | a copy written into a system that reads its own format | Rebuildable by definition. If it drifts, the record wins. |
| weight | how strongly a retrieval model favours a record | Set by what the corpus can prove, not by the model alone. |

## 01 — The business case

### Business goal

Make every form submission usable straight away by every system that needs it — commerce,
marketing, measurement and AI — without paying a per-contact fee for the privilege or handing the
record to a vendor.

### Problem

Three costs, and they compound. Each is ordinary enough to be tolerated on its own, which is why
they are usually only counted together at renewal.

| Problem | What it looks like day to day | What it actually costs |
| --- | --- | --- |
| **CRM latency** | A signup syncs on a batch schedule. An unsubscribe lands after the send. An audience is built from yesterday's state. | You market to people whose current state you do not know. The error is invisible until someone complains, and by then the send is out. |
| **Fee** | Pricing scales with contacts stored and events processed, not with value delivered. | It makes storing less the rational choice — the opposite of what AI retrieval needs. You pay to keep the data that makes the rest of the stack worse. |
| **Vendor lock-in** | The record lives in the vendor's schema. You can join what they sell and nothing else. Export returns rows, not relationships. | Leaving costs a rebuild, so the renewal price only ever goes one way. The switching cost is the product. |

Stated as sentences, because the three are usually argued separately. **CRM latency** means a signup
syncs on a batch schedule, so an unsubscribe can land after the send and an audience gets built from
yesterday's state — you end up marketing to people whose current state you do not know, and the
error stays invisible until someone complains. **Fee** means pricing scales with contacts stored and
events processed rather than with value delivered, which makes storing less the rational choice at
exactly the moment AI retrieval needs more. **Vendor lock-in** means the record lives in the
vendor's schema, so you can join what they sell and nothing else, export returns rows rather than
relationships, and leaving costs a rebuild — which is why the renewal price only ever moves one way.

### Solution

Move the socket, not the vendor. The form posts to infrastructure you own, and the record layer
becomes something you can query rather than something you can only store into.

- **One owned endpoint.** The form posts to your own edge, not a vendor's collector. The submission is written while the request is still open.
- **Typed claims, dated evidence.** Store what is true now *and* how it became true, so state can be filtered and defended rather than merely retrieved.
- **A mirror per collection, a stream per entity.** Collections become joinable; entities keep their own clocks.
- **Permissions decided server-side.** Anything gated in the browser is not gated.
- **One outbound path.** Which makes the AI and Google services already reachable rather than a project each.

### Result

What changed, how it is measured, and what is not done yet. Figures that have not been measured are
marked as such rather than estimated.

| Change | How it is measured | Status |
| --- | --- | --- |
| Submit to usable | The record write happens inside the request, not on a sync schedule | Shipped. The claim, the evidence row and the signal row are all written before the response returns. |
| Cost per extra record | Infrastructure cost only; no per-contact tier | Shipped. Storing more no longer raises a licence fee. |
| Retrieval surface | Chunks produced from the same corpus | Measured: **888, up from 63**, after fixing an id collision. No model or prompt change. |
| Consent defensibility | Every claim has a matching dated evidence row | Shipped. Method, version, timestamp and on-screen wording stored with the claim. |
| List quality | Undeliverable and disposable domains refused at the socket | Shipped. |
| Projection drift | A scheduled check that record and projection agree | **Not built.** Drift is currently unobserved until someone compares by hand. |
| Time-to-audience | Submit to audience membership, end to end | Not yet measured — *n* minutes. Worth instrumenting before it is claimed. |

### Opportunity

The work above was justified on cost and speed. What it makes possible next is the larger part.

- **Every collection becomes answerable.** A mirrored collection is already in a shape an AI can query. New datasets arrive by mirroring, not by building another integration.
- **Reviews and loyalty drive the feed.** Ratings and loyalty state can feed the product listing directly instead of sitting in a separate tool beside it.
- **Offers become a policy join.** Discount eligibility is decided by joining subject to jurisdiction to entitlement, so offers can be personalised without exporting the audience to anyone.
- **Agents can transact safely.** Because entitlement and mandate are already separate words with separate storage, an agent can be given a bounded permission rather than a copy of the customer's.

## 02 — Directives

Each directive is written so it can be picked up as a backlog item and closed on evidence rather
than opinion.

| Directive | Acceptance criteria | Done when |
| --- | --- | --- |
| Every form posts to the owned endpoint | No form submits to a third-party collector; both required attributes present on each form | The pre-ship checklist includes the attribute check and a reviewer has run it. |
| Claims are typed; evidence is dated | Every claim row has a matching evidence row with method, version, timestamp and wording | A count assertion in the test suite compares the two, and fails on a mismatch. |
| Extras are disclosed | The fields attached automatically are listed in plain words next to the submit control | The wording is on the live form and stored with the consent record. |
| Entities stream separately | No shared events table across newsletter, reviews, users, discounts and products | Each stream has its own table and its own consumer named in the docs. |
| Permission decisions are server-side | No entitlement read in the browser determines whether an action proceeds | A review of every gated action confirms the decision happens on the server. |
| Joins assert on counts | Every filter test asserts an expected count, not merely that rows came back | Tests fail when a filter is ignored, which existence checks do not catch. |
| Mirrors are rebuildable | A mirror can be dropped and rebuilt from the authored collection with no loss | The rebuild has been run once, in staging, and the row counts match. |
| Re-indexing has an owner | A named owner and an alert when the index goes stale | The owner is recorded and the alert has fired once in a test. |

## 03 — The infrastructure

A form looks like a way to collect an email address. It collects three different things at the same
moment: **intent** — what the person wants; **policy** — what their local law requires of that; and
**permission** — what the system is now allowed to do.

Most pipelines store all three as one field. That is the decision that makes a compound question
unanswerable later, because a single string cannot be joined against a jurisdiction, filtered by a
date, or used to authorize an action. Splitting them apart when the form posts costs one schema
decision and pays for itself on the first real question.

### Each entity is its own stream

Newsletter, reviews, users, discounts, and products with their attributes are not rows in a shared
events table. Each runs on its own clock, is read by a different consumer, and fails in its own way.

| Entity | Carries | Consumed by | Why it cannot share a table |
| --- | --- | --- | --- |
| Newsletter | consent state and per-event signals | GA4 / GTM audiences; the Shopify email segment | Consent changes on its own clock, and the *transition* is the event. A generic events table records the state and loses the flip. |
| Reviews | user-generated content and a rating aggregate | Merchant feed; product structured data | A rating is a feed field with its own eligibility rules. A review is never a marketing consent and must not accrue like one. |
| Users | identity and entitlement | authorization — never analytics | The only stream permitted to gate an action, which is exactly why it must not live where measurement lives. |
| Discounts | the offer and its eligibility | price rules; Merchant promotions | Eligibility is a policy join across subject and jurisdiction, not an attribute stored on the offer. |
| Products & attributes | catalog fields and trade identifiers | Merchant Center feed; the vector index | GTIN and MPN are *identity*, resolved against an external authority. Description is not, and the two must not be validated alike. |

The same argument in sentences. Newsletter consent changes on its own clock and the *transition* is
the event, so a generic events table records the state and loses the flip. A rating is a feed field
with its own eligibility rules, and a review must never accrue the way a marketing consent does.
Users are the only stream permitted to gate an action, which is precisely why identity must not live
where measurement lives. Discount eligibility is a policy join across subject and jurisdiction
rather than an attribute stored on the offer. GTIN and MPN are identity resolved against an external
authority while a description is not, so the two must not be validated alike.

### Every collection gets a mirror

Each Webflow collection populates an automatic mirror in the record layer — a derived, joinable copy
of the authored item. Webflow keeps the authoring surface; the mirror is what makes the collection
answerable.

The difference is not storage, it is reach. A CMS API returns items from one collection, filtered by
that collection's own fields. A mirror can be joined to a user, filtered by a jurisdiction resolved
elsewhere, ordered by a value computed at write time — and then *evented outward* on change: to GTM
as measurement, to Cloudflare as edge behaviour, to Shopify as commerce.

> The mirror is a copy, and that is the point. Anything you can rebuild from the original can be
> safely thrown away. Anything that exists only in the copy is a bug.

### Revenue is system-built

Once entities stream and collections mirror, revenue stops being something a page produces and
becomes something the system assembles: the APIs make the offer, and **server-side permissions
decide who may take it**. The second half is not a security preference. A client-side entitlement is
a suggestion — it can be read, edited and replayed by the person it constrains, so any offer gated
in the browser is ungated in practice.

### One egress, and what becomes adjacent

Webflow's outbound path runs through Cloudflare to Shopify, or to any API the system is bound to.
Keeping that path to a single hop is what replaces a long list of integrations with a short list of
services you can already reach. Behind one identity and one project, Vertex AI sits next to Vision,
Merchant Center, YouTube Data, Drive, Apps Script, and the audience, reviews and loyalty APIs — no
second login system, no second key-rotation schedule, no connector to keep working.

One caveat, stated plainly rather than discovered on an invoice: **the adjacency is free; the
inference is not.** What disappears is integration cost — the connector, the duplicated identity,
the credential rotation. Model calls, storage and feed processing remain metered under their own
rate cards, which are not quoted here because published rates change and a stale figure is worse
than none.

## 04 — The compile step

Webflow's custom checkbox hides the real `<input>` and draws a `<div>` in its place. The div only
fills because Webflow's runtime adds `.w--redirected-checked`.

Export that markup to Adobe Experience Manager, Shopify or WordPress and you get the div, the hidden
input, and neither the runtime nor the CSS. The box is decorative. The input toggles correctly and
nothing on screen changes, so the person reports it as "I can't tick the box."

Verified on two Shopify stores: **zero `.w--redirected-checked` rules on the page**, and
`window.Webflow === undefined`. Nothing threw. Nothing appeared in the console. The page simply
looked wrong.

> If a component's visual state is applied by JavaScript rather than by the control's own
> `:checked`, it will not survive leaving its origin platform.

The fix is not a better polyfill. It is a native control — `accent-color:#111` on a real
`<input type="checkbox">` renders its own state on every host, with no script, and is
keyboard-accessible for free.

### What each stack compiles, and what it leaves behind

| Stack | Ships in the page | Fetched at runtime | What is left behind on export |
| --- | --- | --- | --- |
| Webflow (hosted) | markup, CSS, `data-w-id`, the IX2 JSON descriptor | jQuery + `webflow.js` | Nothing — until you export, at which point behaviour depends on shipping jQuery with it. |
| Webflow export | markup and CSS only, in practice | whatever you re-add | The interaction runtime and every JS-applied visual state. This is the failure above. |
| Astro | static HTML; per-island JS | island hydration | Listeners bound to swapped DOM, unless rebound on `astro:page-load`. |
| Next / React Router 7 | server-rendered HTML + the loader payload | the client bundle | Nothing visual — but every handler needs `'use client'`, and the loader payload ships in the HTML. |
| Worker-hosted vanilla | two attributes and one script tag | the behaviour itself, from the edge | Nothing. The page carries intent; the edge carries behaviour. |

The last row is the choice this system makes. Webflow holds one tag site-wide, and the loader arms
the forms plane only when it finds a form that asked for it — `embed-scripts.ts:2355`:

```js
// Forms plane — gated Webflow→Xano forms (data-crm-form + data-crm-submit="worker")
if (want.indexOf('forms') >= 0 || has('form[data-crm-form]')) js(W + '/embed/forms.js');
```

A page with no such form never pays for the script. A form change ships with a worker deploy rather
than a Webflow republish — no re-pinned integrity hash, no re-registered script, no republish race.

## 05 — Binding

"Data binding" names four different mechanisms that agree on almost nothing except the word.

| Model | Mechanism | Who owns state | What it costs you |
| --- | --- | --- | --- |
| Webflow IX2 | compiled JSON descriptor reduced through a Redux-style store; the engine writes styles onto `data-w-id` nodes | the runtime | Portability. The descriptor is meaningless without `webflow.js`, which needs jQuery. |
| React Router 7 | `loader` serializes into the document; `action` posts back; the router revalidates and re-runs the loader | the server | A round trip per write. In exchange there is no client state to drift. |
| Shopify UI extensions | Preact signals over remote-dom, rendering Polaris custom elements in a sandbox | the host | Direct DOM access. Your code never owns a node. |
| Attribute + edge script | two attributes declare intent; a worker-hosted script binds the submit and owns the messaging | the record | Nothing does it for you. You write the binding once and maintain it. |

### The tell in Shopify's migration

For API versions 2025-10 and later, Shopify recommends Preact for UI extensions. The dependency diff
is the interesting part: `react`, `@shopify/ui-extensions-react` and **`react-reconciler`** go out;
`preact` and `@preact/signals` come in. The reconciler's departure says what was always true — React
was never touching a DOM inside an extension. It was reconciling a tree that got serialized across a
sandbox boundary. Reactivity now comes from signals on a platform-owned global:

```js
shopify.appMetafields.value.find(...)        // read
shopify.connectivity.current.subscribe(fn)   // observe
```

That is the same shape as the attribute model: state lives in one authoritative place and the view
subscribes to it. What separates these four is not syntax. It is about how long state is allowed to
be out of date, and who notices.

## 06 — Claims and extras

The payload splits in two before it leaves the browser. Fields are what the person typed. Extras are
what the script attached without being asked.

```js
fetch(W + '/forms/' + slug + '?shop=' + shop, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, page, ga_session_id, ga4_client_id, locale })
})                                              // embed-scripts.ts:2726
```

Four of those five are extras. They are legitimate — a consent record without a page and a timestamp
proves very little — but they are collected, not requested, which makes disclosure a design
obligation rather than a legal footnote.

### Conditional by design, not by accident

| Write | Condition | Where | Why it is conditional |
| --- | --- | --- | --- |
| claims | unconditional | Xano | The record must exist before anything can project from it. |
| consent_records | unconditional | Xano | Evidence written with the claim, or the claim cannot be defended later. |
| signal_consent_events | every submit | Xano | Per-event row keyed by `ga_session_id`; `event_key` dedupes a double-fire while keeping two genuine submissions distinct. |
| escalate | on the transition only | Google | Skipped when marketing was already granted, and never for a request form — nothing was granted to escalate. |
| Shopify consent | `slug === "newsletter"` | Shopify | Best-effort. A dead tenant token degrades the projection without failing the subscription. |

In sentences: the claim and its `consent_records` evidence row are written unconditionally, because
the record must exist before anything can project from it. A `signal_consent_events` row is written
on every submit, keyed by `ga_session_id`, where `event_key` dedupes a double-fire while keeping two
genuine submissions distinct. The escalation to the Google segment plane fires only on the
transition, never on a repeat submit. The Shopify projection runs only when the slug is newsletter.

The ordering is the argument. Xano is written first and unconditionally; Shopify is written second,
conditionally, and is allowed to fail — `index.ts:3462`. There is no path in which a Shopify outage
loses a consent. Shopify holds a projection; it never holds the record.

### The refusal that keeps the list answerable

RFC 2606 reserves `.test`, `.example`, `.invalid`, `.localhost` and `example.com/net/org` as names
that will never be delegated. A mailbox there cannot exist, so a submission from one can never be a
subscriber. It is refused at the socket rather than cleaned up later, alongside disposable-mailbox
domains, because **a list you have to clean is a list you cannot trust**.

## 07 — The knowledge chain

Each hop is lossy in a specific and predictable way. Naming the loss is what stops a system from
being asked a question it cannot answer.

| Layer | Holds | Loses on the way out | What it can be asked |
| --- | --- | --- | --- |
| Webflow | the authored surface and the intent attributes | every runtime behaviour, on export | What was on screen — but only if the wording was captured downstream. |
| Xano | typed claims, dated evidence, per-event signals | nothing; it is the record | Anything joinable and filterable. The only layer that answers a compound question. |
| Shopify | native marketing consent on a customer | the method, the wording, the jurisdiction | "Is this customer subscribed?" — never "on what basis?" |
| GTM / GA4 | consent-gated events and audiences | identity; it is a measurement plane | Aggregate behaviour. It must never appear in an authorization decision. |

The last cell is a rule, not an observation. **Machines authenticate; humans get found.** A
measurement warehouse is a good place to learn that a segment converts and a catastrophic place to
decide whether someone may act. Keeping the analytics plane out of authorization is what lets it
stay permissive enough to be useful.

The projection to Shopify exists for one narrow reason: the store's built-in *Email subscribers*
segment reads native consent and nothing else. Writing there makes a subscription immediately
segmentable and biddable. It does not make Shopify the record.

## 08 — LLM weighting

Retrieval quality is usually treated as a model problem. It is mostly a shape problem, decided at
the moment the form posted. Consider one fact — someone agreed to marketing email — stored three
ways.

| Stored as | Retrievable | Filterable | The question it can answer |
| --- | --- | --- | --- |
| free text in a note | by similarity only | no | "Show me documents about consent." A pile, ranked by vibe. |
| string in a metafield | by exact key | weakly | "Does this record mention marketing?" Presence, not truth. |
| typed claim + dated evidence row | by key and by vector | yes, joinably | "Who granted marketing in Quebec after the Consent Mode v2 change, and on what wording?" |

Only the third row supports the question anyone actually asks. That is what *weighting* means here:
not a model parameter, but the corpus's capacity to narrow before it ranks. A boolean you can filter
on removes most of the candidates before similarity is consulted at all, and a dated evidence row
lets the answer cite itself.

### Chunking is weighting

The clearest evidence that shape dominates model choice came from a defect, not a benchmark. The
documentation index was returning weak answers; the cause was an id collision that silently
overwrote chunks during indexing. After the fix, the same corpus produced **888 chunks where it had
produced 63** — no change of model, no change of prompt, no new content. The index had been
answering from a fraction of what it held, confidently.

> A retrieval system that is missing most of its corpus does not report an error. It reports an
> answer.

### Joins and filters — and the trap in them

The capability that makes claims weightable is ordinary relational work: join the claim to the
subject, filter by jurisdiction and date, order by recency. Three failure modes deserve naming,
because all three look like success.

| Failure | What you observe | Why it survives testing |
| --- | --- | --- |
| unknown field dropped on write | `200 OK`, row created, column absent | The write succeeded. Only a later read notices, and by then the cause is weeks old. |
| multi-key search ignores the filter | a result set, slightly too large | Never empty, never an error — just wrong. A count assertion catches it; an existence assertion does not. |
| truncated read treated as empty | a reconcile that deletes what it could not see | An empty set and a refusal are indistinguishable unless the caller distinguishes them. |

The third is not hypothetical: a reconciler once read a truncated page, concluded the remote set was
empty, and deleted accordingly. Point-in-time recovery returned it. The lesson generalises past that
incident — **a refusal is not an empty set** — and any join that treats them alike will eventually
act on the difference. Assert on counts, not on presence. A filter that is being ignored still
returns rows.

## 09 — The counterweight

A comparison that only flatters the choice made is the one a reader stops trusting.

- **The designer loses the form.** Behaviour ships with a worker deploy, not a Webflow publish. That buys atomic rollout and costs the person who authored the form the ability to change how it behaves. On a small team this is fine; on a larger one it is a real handover and should be written down before it is discovered.
- **Two attributes are a manual step.** A form missing `data-crm-submit="worker"` silently posts to Webflow instead. Nothing errors; the submission lands somewhere else. Opt-in was chosen over a site-wide hijack deliberately, but the failure is quiet and belongs in the pre-ship checklist.
- **No drift reconciler.** Xano is the record and Shopify is a projection, which is only meaningful if something proves they agree. Today nothing does.
- **Vector indexes go stale.** Weighting depends on an index that reflects current content. When re-indexing lapses, the symptom is a confident answer from an old index — the hardest failure in the system to see.
- **Record-layer lock-in.** Making one system the record is what makes joins and filters possible, and it is also a dependency with its own primitive limits and silent-write behaviour. The benefit and the exposure are the same decision.
- **You write the binding.** The attribute model has no framework doing the work. Cheap to run, not free to own.

## 10 — What to do next

1. **Does any visual state depend on a runtime that must be present?** If yes, replace it with a native control before the form leaves its origin platform.
2. **What happens on native submit if your JavaScript never binds?** An exported `<form method="get">` with no action navigates to the current URL with the fields as a query string, which looks exactly like the page blanking.
3. **Are the extras disclosed?** List what the script attaches, in the words a person would use, near the control that submits it.
4. **Is every claim typed, and does each one have a dated evidence row?** A boolean without provenance cannot be defended; provenance without a boolean cannot be filtered.
5. **Do the joins assert on counts?** A filter that is silently ignored returns a plausible result set, never an error.
6. **Can a projection failure lose a record?** If yes, reorder until the record is written first and unconditionally.
7. **Who re-indexes, and how would you know they stopped?** Name the owner, or the search layer will keep answering from an index nobody is checking.

A form is the cheapest place a business acquires a fact and the most expensive place to acquire it
badly. The shape you choose between the click and the response decides every question you can ask of
that record afterwards.
