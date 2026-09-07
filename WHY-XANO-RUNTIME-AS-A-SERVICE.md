---
title: "Why Xano + AI + e-commerce is the right runtime as a service"
description: "A runtime as a service is judged by what it holds when nothing is being rendered. The identity path across Shopify OIDC, a Cloudflare Worker and Xano; why a consent gate must be metered rather than loaded; what a render surface structurally cannot hold; and the Liquid-to-Deno lineage that ends in a capability you cannot forget to check."
canonical: https://persephonepunch.github.io/crm-sync-setup/why-xano-runtime-as-a-service.html
category: "Specs"
date: 2026-09-06
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/WHY-XANO-RUNTIME-AS-A-SERVICE.md
licence: CC-BY-4.0
---
# Why Xano + AI + e-commerce is the right runtime as a service

**For:** architects choosing a backend for a commerce estate that AI agents will transact
against, and anyone who has been handed the NextAuth-versus-Supabase-versus-Firebase
comparison and found that it does not answer the question they actually have.

The usual comparison asks which library owns the session. That is the wrong first question.
A runtime as a service is judged by **what it holds when nothing is being rendered** — because
the decisions that matter most in commerce are made when nobody is looking at a page.

---

## 1. The relying party is not the app server

Most comparisons assume the app server holds the session. In this architecture it does not.

A Cloudflare Worker terminates OIDC itself: it runs the authorization code exchange, verifies
the `id_token`, mints its own signed session token, and hands that to every surface — the
storefront, the installable app, the embedded admin app, the chat client, an agent. Xano never
issues the session token. **Xano holds the user, the claims, the consent record and the
entitlement.** Shopify is one of three front doors, not the system of record.

That single deviation changes the row people get wrong most often: **revocation works**, despite
the session being a stateless JWT. Logout writes the token's hash to a denylist with a lifetime
equal to the token's remaining life, so a copy cached anywhere else dies with the session
instead of living out its full term.

### The four hops

1. **Shopify proves who the customer is.** Authorization Code + PKCE against the shop's
   Customer Account endpoints, with `state`, `nonce` and the verifier held for ten minutes.
   The client id is per tenant with no platform fallback — a store without its own shows no
   Shopify button rather than authenticating against somebody else's store.
2. **The worker exchanges and issues.** Where no account matches, the shopper is sent to the
   store's own hosted sign-in page rather than an error screen. Google and email/password enter
   at exactly this point: three doors, one token.
3. **Xano makes the customer a user.** The provider subject links to a user row, assertions land
   as claims, consent lands in its own record. Provider id → user id → every other identity is
   the spine. The OIDC token is only the proof that starts it.
4. **The data layer gates egress.** The user resolves to a stable pseudonymous id joined to the
   analytics client id, and every event resolves its consent signals before it is sent.

---

## 2. One channel of surfaces, and what none of them can hold

Next, WordPress, AEM, Astro and 11ty are **one channel**: render surfaces that consume the same
token the same way. The only thing that varies is which file the tag goes in. Next is in that
list, not above it — it has a server, and that difference matters as a hazard rather than a
capability, because a surface with a server invites you to keep session state in it.

Draw the line by **lifetime**, not by feature. Every surface renders for the length of one
request or one build, on something replaceable between two calls. Everything that must outlive
that falls through the floor:

| The gap | Why no surface holds it |
|---|---|
| Scheduled work | No process outlives a request or a build; nothing wakes itself |
| Admin token custody | It would have to reach a browser or a build artifact to be useful there |
| Token exchange | Swapping a client's session token for an admin token needs the stored credential |
| Webhook receivers | Must answer whether or not anyone is browsing, and survive a redeploy mid-delivery |
| Session revocation | A denylist is shared state; a stateless deployment has none |
| Consent before egress | Enforced at a surface, it binds only callers who pass through that surface |
| Downstream credentials | Per-tenant refresh tokens and API keys outlive every deployment |

This list reads as framework-specific and is not. WordPress with a cron plugin, AEM with a
workflow, an 11ty build with a scheduled action — each has a partial answer to one or two rows,
none has an answer to all of them, and a partial answer is the more dangerous kind because it
works in testing.

### Why there is no floor

On a serverless or edge deploy a handler is invoked per request and frozen or discarded after:
no timer survives, no queue drains, nothing holds a denylist in memory. Routes compile on demand
and cold-start, which makes them a poor home for a webhook that must acknowledge in seconds.

The honest caveat: a self-hosted long-running process **is** a process, so "no runtime" is a
property of the deployment rather than of the framework. It does not change the conclusion. That
process still does not survive a redeploy, still does not share memory with a second instance,
and still cannot hold a revocation list once there is more than one of it.

**And deferred loading is the trap with teeth.** Client-side, the consent helmet must run
*before* anything it gates. Loaded with a default strategy, or deferred, the consent bridge
resolves after the tags it exists to hold back. The page still measures, the banner still
appears, and everything looks correct. A gate that opens late is indistinguishable from a gate
that works, until someone reads the order the requests actually went out in.

---

## 3. Loaded, or metered

There are two places a consent gate can live, and they are not variations on one design.

- **Loaded** — it ships in the bundle, evaluates when the page's JavaScript compiles and
  hydrates, and runs once per render whether or not anything is about to move.
- **Metered** — it is a call made at the moment a row wants to leave, and runs once per decision.

The unit is the whole argument. A loaded gate is priced in page views; a metered gate is priced
in decisions. Those numbers diverge in both directions at once:

- **Traffic without egress** — the common case. Thousands of renders evaluate a gate for pages
  that were only read. Cost is paid to decide nothing.
- **Egress without traffic** — the dangerous case. A scheduled sync, a webhook-driven erasure,
  an agent purchase on the payment rails: rows move with no document rendered, so a loaded gate
  is not merely expensive there, it is **absent**.
- **The runner case** — an AI data runner asks "may this move" at inference time. There is no
  page and no hydration to attach a script to. Only a call, which is what a metered gate is.

This is why the gate cannot be fixed by moving it earlier in the page. Even with the helmet
first in the head, the best a loaded gate achieves is being correct for one surface's own
traffic. The decisions a regulator cares about are the ones made when nobody was looking.

Consent is therefore **resolved and refused**, never assumed: an event either carries a consent
block resolved from the record, or an exemption with a written reason. There is no third path
and no boolean bypass. For EEA traffic, `ad_user_data` and `ad_personalization` must both be
granted before Customer Match data is processed at all — and modelling is not the fallback,
because behavioural and conversion models have separate thresholds and below them nothing runs.

---

## 4. The lifecycle is adjudicated in public

It is tempting to file Tag Manager under "tag delivery" and Merchant Center under "catalog
syndication", with an edge alternative for each. Both filings are wrong.

**An edge tag loader is not a smaller Tag Manager.** Edge loaders move third-party scripts off
the main thread — a performance and isolation tool, and a good one. Tag Manager is a contract
surface with Google's commerce systems: the data layer those systems expect, the four Consent
Mode v2 signals in the shape Google reads them, enhanced conversions, and a **server container
that receives events from callers with no browser at all.** The agent rails need exactly that.

**Merchant Center is not syndication.** The feed is where product identity is asserted in
public — `gtin`, `mpn`, brand — alongside price and availability that must match the landing
page, and shipping and tax declared per country. Getting it wrong does not lower click-through.
It suspends the account, or files the wrong tax.

Which means every upstream system has a stake in one document:

| System | What it owns | What the feed forces it to agree to |
|---|---|---|
| PIM | Attributes, identifiers, variant structure | The identifiers Google matches on, nested — a flat file cannot carry a parent-child relationship at all |
| WMS | Pick and pack — what is there, and what it weighs once boxed | Availability derived from stock, and every mass and dimension carrying a declared unit |
| Drop-ship | Who ships, and from where | Lead time and shipping cost per destination when the shipper is not the seller |
| ERP | Cost, price, currency | Price matching the page at the moment Google fetches it |
| Tax / VAT nexus | Where the obligation exists | Whether the displayed price includes tax — a feed setting, not a store setting |

### A number is not a measurement

Pick and pack is where an estate stops describing products and starts describing objects with
mass. `1.5` is not a weight; `1.5 kg` is. That is why ISO 80000 and the SI base units exist and
why machine formats carry a unit code rather than a number and a hope.

- **Carriers rate the parcel, not the product.** Dimensional weight is computed from packed
  dimensions against a divisor that differs by carrier and region. Publish net product weight
  where gross parcel weight belongs and every shipping quote is quietly low.
- **Some units are legal statements.** Net content on prepackaged goods is declared under a
  national scheme; jurisdictions that tax by volume take the unit as a tax input; and a GS1
  element string encodes the decimal position in the identifier itself, so two adjacent
  identifiers are the same measure with a factor of a thousand between them.
- **All readers must agree on the unit, not the number.** This is the consent argument in a
  different column: a value that means nothing without the declaration qualifying it, which
  must therefore travel with it rather than be reattached at the far end.

### The second reader

The feed was built for a shopping channel and acquired a second audience without changing
format. An answer engine resolving "which of these is in stock in Canada under two hundred
dollars" matches on the same identifiers, reads the same price and availability, and **does not
execute JavaScript while doing it.** Whatever a component renders after hydration is not part of
the answer.

So the machine-readable layer is one assertion published in three places that must agree: the
feed, the server-rendered structured data on the page, and the knowledge layer a model quotes
when it has no page to cite. A PIM, WMS, ERP or tax disagreement used to produce a bad ad and a
suspension. It now also produces **a machine-readable claim that is wrong** — read literally,
repeated with confidence, and cited as though someone stood behind it. Which someone did.

---

## 5. Supabase, Firebase, and the enforcement point

Both were evaluated closely. Neither lost on features. They lost on one structural question:
**where enforcement lives.**

Supabase and Firebase are excellent at the same shape — a client that talks to the data layer
directly, with the rule enforced at the row (Postgres row-level security; Firestore security
rules). When the browser is a first-class caller, that is *stronger* than any convention a
backend enforces, because a new endpoint cannot forget it.

A commerce runtime of this kind has no such caller. Nothing reaches the data layer but the
worker. So the policy engine's home advantage is defending a door that does not exist, while the
questions that do get asked fall outside what a row policy can express:

- **The question is egress, not read.** Not "may this user read row X" but "may this row leave
  the estate for this marketing platform, under which basis, granted when."
- **The caller often has no session.** An agent purchase carries a mandate, not a signed-in
  user. The user id is null and the right answer is still not "deny" — it is "check the mandate."
- **The output must be evidence.** A policy evaluation permits or refuses and leaves nothing
  behind. What is needed is an append-only, signed record a stranger can verify afterwards.

Xano fits because the rule becomes a **callable artifact**: one consent function every sync
invokes, reviewable as an object rather than as code in a repository. An auditor or an agency
can be shown the rule without being handed the codebase.

**What the choice costs.** Supabase gives real Postgres, real migrations, and self-hosting.
Firebase gives better realtime and offline sync for app-shaped clients. Xano gives neither, and
the coupling is real. It has its own sharp edges too, and they are the quiet kind: a write with
an unknown field can be dropped and answered `200 OK`, and a multi-key search can ignore the
filter it was given. Both are silent-success failures — the difference is that they are known
and tested for rather than assumed away.

---

## 6. Same roles, three vendors

| Role | Google | Cloudflare | Xano |
|---|---|---|---|
| Compute | Cloud Functions / Cloud Run | Workers | API endpoints + functions |
| Scheduled / async | Cloud Scheduler / Tasks | Cron triggers / Queues | Background tasks + triggers |
| App database | Firestore / Cloud SQL | D1 | Built-in PostgreSQL |
| Coordinated state | Firestore transactions | Durable Objects | Postgres transactions + locks |
| Cache / config | Memorystore / Remote Config | KV | Redis cache + environment variables |
| Files | Cloud Storage | R2 | File storage (S3-backed, image transforms) |
| Analytics | BigQuery | Analytics Engine | — (request history; export onward) |
| Tag delivery | Tag Manager | Edge tag loader | — |
| Catalog syndication | Merchant Center | — | — (build the feed via an endpoint) |

Read across a row and you get the job; read down a column and you get a vendor. The rows are the
useful direction, because a real estate uses all three. The last two rows are not gaps at the
edge — as §4 argues, that is where the lifecycle is adjudicated, and the edge is not in that
business.

### KV, D1 and R2 against one Postgres

| Primitive | What it gives up | Counterpart | Used for |
|---|---|---|---|
| KV | Strong consistency and queries | A Postgres table at one region's latency | Tenant config, OAuth state with a TTL, the session denylist |
| D1 | Scale and extensions | Postgres proper | The consent ledger, because it needs a constraint KV cannot express |
| R2 | A policy layer | Object storage with row-level policy attached | Consent evidence keyed per subject, exports, media |
| Durable Objects | — | Transactions and advisory locks | Per-partner session isolation |

**Why the ledger is in D1 and not KV.** The consent chain is append-only and each row carries
the hash of the one before it. A key-value store has no way to say "write this only if nothing
else has claimed this position" — two racing writers both succeed and the chain forks silently,
the one failure an evidence log may not have. A uniqueness constraint across tenant, stream and
previous hash **is** the compare-and-set: the second writer loses the insert rather than forking
the chain. The database is not storing the rule; the database *is* the rule.

**Object storage without a policy layer** is the row-level-security argument one level down. A
policy attached to the object and evaluated against a user session is exactly right when a
browser fetches its own file. Here nothing does: the worker reads and decides. The missing
policy layer costs nothing because there is no unauthenticated caller to police — and the thing
that *would* have cost, egress pricing on an evidence bucket that exists to be read during an
audit, is the row where zero-egress storage charges nothing.

---

## 7. The lineage: preload, and the thing no request owns

Every argument above reduces to two moments, and both predate this stack by fifteen years.

**Liquid is the preload discipline made syntactic.** A template language written in Ruby that
deliberately cannot execute arbitrary code: a merchant's theme decides what a page contains
without being able to block, exhaust or exploit the server rendering it. That is the feature,
not the limitation. The equivalent here is the loader's first tier — it runs at parse time,
sets the consent default before any tag can fire, and is ordered by construction rather than by
hoping hydration wins a race.

**Node is the other half, and it came from the same room.** Before Node, Ryan Dahl was writing
Ruby web servers, trying to make a request-per-thread model stop blocking on I/O. The conclusion
he drew — and the thing Node actually was — is that **the request must not own the work.**

**Deno is the sequel, and it is a preload.** Dahl's follow-up was written as the correction to
what he judged had gone wrong the first time, and its signature change is that a program
declares what it may touch before it runs, with the runtime refusing anything undeclared.

| | Node (2009) | Deno (2018) |
|---|---|---|
| Permissions | The script gets the machine on start | Nothing by default; reach declared before execution |
| Modules | CommonJS, directory-walking resolution | ES modules by URL, lockfile, no install step |
| TypeScript | A build step or a loader | Runs directly |
| Platform APIs | Its own, with web APIs added later | Web APIs first — fetch, Request, Response, Web Crypto |
| Tooling | Assembled from the ecosystem | Formatter, linter, test runner, bundler in the binary |
| Ecosystem | Won, decisively | Runs much of npm through a compatibility layer |

Only the first row is an idea; the rest are ergonomics. And it is the row this architecture is
built on, because a permission that must be declared up front is one that cannot be forgotten
later.

**Xano runs its Lambda steps on Deno**, and Supabase's edge functions run there too — the two
backends compared in §5 disagree about where enforcement lives and agree, without discussing it,
about the runtime underneath.

### Where it closes

A permission flag is still only a flag: it is enforced because a runtime agreed to enforce it.
The last step is to stop asking a checker to remember, which is what cryptography does.

An entitlement here is not a row someone looks up before proceeding. It is **signed and
verifiable against a published key set**, so a party that never spoke to us can confirm what was
granted; and the identity plane it points at is **held encrypted**, so the payload opens for the
key it was granted to and stays opaque to everything else. Capability stops being a decision
made at the door and becomes a property of the artifact: not "may this caller read it" but
"can this caller open it at all."

That is the runtime's permission model moved one layer down and made cryptographic. Liquid
decides what may run before anything runs; Node frees the work from the request; Deno makes the
work declare its reach in advance; the entitlement makes that declaration checkable by a stranger
and the data unreadable without it. An agent mandate — scoped, spend-capped, revocable, signed —
is the same object again, pointed at money instead of memory.

**The irony worth naming:** a serverless render handler re-inherits the exact model Node was
written to escape — the request owns the work, and when the request ends the work has nowhere to
live. The framework is not at fault. Rendering is request-shaped. The mistake is only ever
asking it to hold the things that are not.

---

## What "runtime as a service" actually has to mean

Not "somewhere to put an API." A runtime that can serve an AI-transacted commerce estate must
hold four things a render surface cannot:

1. **A clock** — work that runs when no one arrived.
2. **A credential vault** — per-tenant secrets that outlive every deployment.
3. **A rule that is one artifact** — the consent decision every path calls, including the paths
   with no page.
4. **Evidence** — an append-only record whose ordering a constraint enforces, verifiable by
   someone who was never given access.

Judge any candidate on those four. The session library is a detail; the rendering framework is
replaceable on purpose. What is not replaceable is the layer that still answers when nothing is
being rendered — which is the layer an agent talks to, and increasingly the only one that does.
