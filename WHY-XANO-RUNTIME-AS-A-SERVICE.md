---
title: "Why Xano + AI + e-commerce is the right runtime as a service"
description: "A runtime as a service is judged by what it holds when nothing is being rendered. The identity path across Shopify OIDC, a Cloudflare Worker and Xano; why a consent gate must be metered rather than loaded; what a render surface structurally cannot hold; and the Liquid-to-Deno lineage that ends in a capability you cannot forget to check."
canonical: https://persephonepunch.github.io/crm-sync-setup/why-xano-runtime-as-a-service.html
category: "Specs"
date: 2026-09-06
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/WHY-XANO-RUNTIME-AS-A-SERVICE.md
licence: CC-BY-4.0
tags:
  - xano
  - identity
  - oidc
  - consent
  - architecture
keywords:
  - Xano
  - runtime as a service
  - Supabase
  - Firebase
  - NextAuth
  - Shopify Customer Account API
  - OIDC
  - Cloudflare Workers
  - consent gate
  - Consent Mode v2
  - Merchant Center
  - answer engine optimization
  - agentic commerce
  - Deno
  - Node
  - Liquid
  - row level security
  - entitlement
  - VAT nexus
  - ISO 80000
  - GS1
about:
  - Backend as a service
  - Consent enforcement
  - Agentic commerce
  - Answer engine optimization
  - E-commerce data lifecycle
alternativeHeadline: "A runtime is judged by what it holds when nothing is being rendered"
---
# Why Xano + AI + e-commerce is the right runtime as a service

> The usual comparison asks which library owns the session. That is the wrong first question.
> **A runtime as a service is judged by what it holds when nothing is being rendered** — because
> the decisions that matter most in commerce are made when nobody is looking at a page.

**Written for** architects choosing a backend for a commerce estate that AI agents will transact
against — and for anyone handed the NextAuth-versus-Supabase-versus-Firebase comparison who found
it did not answer the question they actually had.

**The question it answers:** what has to exist behind a storefront before an agent can be
allowed to buy something, and which of it a rendering framework can hold. (None of it.)

---

## 0. How permission moved

The architecture is not a preference. It is where twenty years of e-commerce put the permission
decision, one displacement at a time — each move forced by a caller the previous design had not
imagined.

| Era | Where permission lived | What it could express | What it could not |
|---|---|---|---|
| **2006 · Liquid** | In the template, by refusing to execute | What a theme may *render* | Anything about a caller — there was one kind, and it had a browser |
| **2009 · Node and the API era** | In the app server, per request | Who is signed in; what a route allows | Anything after the response ended |
| **2015 · Headless and the token era** | In a token the client carries | Scope, checked at the boundary | Conditions that change mid-session; a caller with no session at all |
| **2018 · Declared capability** | Stated before execution, refused if undeclared | What the *code* may touch | Who the human is, or what they consented to |
| **Now · Agentic** | In a signed mandate, evaluated per call | Scope, cap, expiry, counterparty **and** the subject's consent state at that instant | — which is the point at which a system of record stops being optional |

Read the last column down: every row is a caller the previous row could not describe. Liquid
never had to name one. The API era named a signed-in human. The token era named a client. Now
the caller is software acting for a human, holding no session, arriving with no page, and the
only honest description of its authority is a document that says what it may do and can be
checked by someone who was not there.

### The same displacement happened to the data, in 2024

Permission was not the only thing that moved. In 2024 both platforms this estate depends on
retired fixed-shape REST in favour of composed, just-in-time GraphQL: Shopify pushed its Admin
API to GraphQL-first and began closing REST to new apps, and Google replaced the Content API for
Shopping with the Merchant API.

It is tempting to file that as a syntax migration. It is the same move as every row above. A REST
resource returns a shape decided at design time, by whoever wrote the endpoint; a GraphQL query
returns a shape composed at call time, by whoever is asking. Which is precisely what a caller
that was never anticipated needs — and precisely why a flat feed cannot carry a parent-child
variant relationship while the graph can: the relationship is a typed edge rather than a
substring someone invented inside an identifier.

So the two arcs are one arc. **The rule is composed when it runs, and the data is shaped when it
is asked for** — because in both cases the party on the other end is no longer one you designed
the interface around. A runtime that fixes either at build time is answering a question from the
era before this one.

**Three things follow from that**, and they are what the rest of this document is about:

- **Trust and boundary design.** An agent's reasoning is not its authority. Chain of thought
  explains what it intends; the mandate governs what it may do, and the boundary is drawn around
  the second. A system that authorises on intent has authorised on text it cannot verify.
- **Dynamic data services.** The conditions do not compose the same way twice, so the rule that
  evaluates them is composed when it runs rather than compiled into a deployment (§8).
- **A system of record.** Something has to answer afterwards — what was granted, what was
  decided, in what order — to a party who was not present and does not trust you by default.

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

## 4. What you add to Next.js Commerce to take an agent's order

Next.js Commerce is a good storefront. Point an agent at it and the gap is not the checkout —
Shopify already has one — it is everything that has to be true *around* the checkout when the
buyer is software.

**Encryption, because the agent must not hold your keys.** An agent acting for a customer needs
authority, and authority must not be a copy of your credentials. What replaces it is a
**mandate**: scoped, spend-capped, expiring, revocable, and *signed*, so the party on the other
side can verify what was granted without asking you, against a published key set. The merchant's
admin token stays in custody and never travels; the subject's identity travels encrypted, so it
opens for the key it was granted to and stays opaque to everything else. A render deployment has
nowhere to put any of this: environment variables are readable by the function that holds them,
rotate on a deploy rather than on a schedule, and cannot be scoped per tenant. A mandate nobody
outside your system can verify is not a mandate — it is a claim.

**Consent, resolved for a caller with no browser.** At the moment of an agent purchase there is
no page, no tag and no cookie. Whatever the client-side consent tooling asserted for a browsing
session says nothing about this transaction. The honest answer to "what did this customer
permit" has to come from a record: which basis, granted when, under what wording, for which
channel — the same record the receipt, the suppression and the erasure read later. A gate that
evaluates at hydration does not merely miss an agent order; it never runs.

**An idempotency key, because agents retry.** The one that gets skipped, and the only one on
this list that shows up on a statement. A network timeout on a checkout call is
indistinguishable from a failure. A human sees a spinner and waits; an agent retries, because
retrying is what a well-written client does. Without a key that makes the second attempt resolve
to the first outcome, the retry is a second order — surfacing as a chargeback days later, to
someone who was not there.

An idempotency key is not a header you accept and ignore. It is **durable shared state with a
uniqueness constraint**: the key is recorded as part of the write, the second insert loses to the
constraint rather than racing it, and a rejected insert is read as "this already happened"
rather than as an error. Which needs exactly what a render surface does not have — a store that
outlives the request, shared across every instance, able to enforce that two writers cannot both
win.

| What agentic checkout needs | Why the storefront does not supply it | What it takes |
|---|---|---|
| Signed mandate | No key custody, no signing identity, nothing a third party can verify against | A signing key held server-side, public half published |
| Consent record | Client-side consent describes a browsing session that did not happen | A record read at decision time, per channel and basis |
| Idempotency | No durable shared state; retries land as new orders | A constrained store where the second write loses |
| Revocation | Nothing to revoke against between deployments | A denylist read on every use |
| Evidence | A route handler leaves no record ordered by anything | Append-only, ordered by a constraint, verifiable later |
| Machine surface | Pages and route handlers are not tools an agent can enumerate | A tool interface the agent calls directly |
| Webhook receivers | Must answer while nobody is browsing, and survive a redeploy mid-delivery | An always-on receiver with HMAC and dedupe |

### Headless Shopify does not close this

Shopify Headless plus a JavaScript framework gives you a real cart, a real checkout and a real
customer identity provider — and none of the seven rows above. Shopify does not hold your consent
record, does not issue or verify your mandates, does not make *your* side effects idempotent
(only its own), and does not carry per-tenant credentials for the platforms you sync to
afterwards. A chatbot that takes an order is a caller with no browser hitting all seven at once.

The layer is additive, not optional — and it does not have to be any particular product. It has
to be something with a clock, a credential vault, one rule artifact every path calls, and
evidence with enforced ordering. §9 is about what else satisfies that.

---

## 5. The lifecycle is adjudicated in public

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

## 6. Supabase, Firebase, and the enforcement point

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

## 7. Same roles, three vendors

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

Read down a column and you get a vendor; read across a row and you get the job — and the row is
the direction that matters, because **the three are not alternatives.** A real estate runs all of
them at once. The question is never which vendor, but which of them holds this role. The last two rows are not gaps at the
edge — as §4 argues, that is where the lifecycle is adjudicated, and the edge is not in that
business.

### Coexistence is the design, not a compromise

A three-vendor estate used to mean one thing: a nightly sync into a warehouse. Everything was
copied somewhere central, the copy was stale by construction, and it was authoritative for
nothing — you reconciled against the source whenever the answer mattered. Integration meant
duplication, and duplication meant a drift problem nobody owned.

**An AI runner changes the unit of integration.** Instead of materialising a combined dataset in
advance, it composes across the three at the moment of the question and enriches only what was
asked for. The record stays where it is authoritative — the catalogue in the commerce platform,
identity and consent in the system of record, measurement in the warehouse — and the view is
assembled per call rather than kept in a fourth place that has to be reconciled with the other
three.

That is the same move as everything else in this document, one layer up. GraphQL shapes the data
when it is asked for (§0); the metered gate decides when a row wants to move (§3); a dynamically
loaded rule composes when it runs (§8). Real-time integration with supplemental enrichment on
demand is that pattern applied to the estate itself: *nothing pre-computed that may not be
needed, nothing copied that already exists somewhere it is true.*

Two things it makes your problem, and both are worth designing rather than discovering:

- **Latency becomes a design input rather than a batch window.** Every call is a fresh read across
  systems that fail independently, so caching is deliberate and the degraded answer is designed —
  which value is served stale, for how long, and how the caller is told. A composed view with no
  stated staleness is a warehouse with extra steps and worse availability.
- **Enrichment is egress.** A supplemental read that pulls a subject's data into an answer is data
  moving, so it passes the same gate as any other movement — and it has to be able to name the
  person it enriched. Enrichment that cannot say whose record it touched is not a data-quality
  gap; it is a subject-access request you will not be able to answer.

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

## 8. The lineage: preload, and the thing no request owns

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

**Xano runs its Lambda steps on Deno** — the JavaScript escape hatch inside a function stack,
not the whole platform, whose own language is XanoScript — and Supabase's edge functions run
there too. The two backends compared in §6 disagree about where enforcement lives and agree,
without discussing it, about the runtime underneath.

### Dynamic loading is the feature, and the dates rule out hindsight

Lambda steps landed well before the agentic wave. Nobody added a JavaScript escape hatch to a
visual function stack in order to serve AI checkout, because there was no AI checkout to serve.
The fit is retrospective, which is the only kind worth much: a design that happens to answer a
question posed years later was answering something structural rather than something fashionable.

The property doing the work is **dynamic loading**. A step is resolved and evaluated when the
stack runs, not compiled into a deployment beforehand — so the rule that decides a permission is
*data*, not a build artifact. That is the difference between a runtime where the inputs are
dynamic and the rule is static, and one where the rule itself can be composed at the moment it is
needed.

Which is the shape of an agentic checkout authorisation exactly. A mandate is conditional in
several dimensions at once — scope, spend cap, expiry, counterparty, and the consent state of the
subject *at that instant* — and those conditions do not compose the same way twice. A new
market's rule, a new lawful basis, a cap that now depends on a category: in a compiled runtime
each of those redeploys the thing that does the checking, and a deploy is a poor unit of change
for a decision measured in seconds.

**The edge cuts both ways.** A rule that can change without a deploy is a rule that *can change
without a deploy* — no build, no diff, no reviewer between an edited permission and a live one.
Which is why the evidence layer is not decoration on this architecture but the compensating
control: a signed entitlement says what was granted in a form a stranger can verify, and an
append-only ledger says what was decided and when, in an order a constraint enforces.

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

## 9. Alternatives — assembling the same four properties

Nothing here argues that one product is the only answer. The requirement is four properties, and
several stacks satisfy them. What follows is what each actually replaces.

### HashiCorp — the enterprise decomposition

The closest thing to a like-for-like alternative *for the custody and runtime half*, and a
genuinely stronger answer on secrets than a config blob:

| Tool | What it covers | Against the four properties |
|---|---|---|
| Vault | Secrets, dynamic short-lived credentials, encryption as a service | The credential vault — and better than static per-tenant tokens, because a credential can be issued per use and expire on its own |
| Nomad | Scheduling and long-running work | The clock |
| Consul | Service identity, discovery, mTLS between services | Who may call whom — the machine plane, done properly |
| Boundary | Human access to infrastructure, with session recording | Operator-side evidence, which is a different audit trail from the subject-side one |

What it does **not** give you is the other half: no data layer, no consent record, no business
rule as a callable artifact, and no commerce endpoints. You would still add Postgres and a
service you write and operate. So the honest comparison is not "HashiCorp or Xano" — it is
*HashiCorp + Postgres + your own API layer* against *one product with a visual rule surface*.
The first is the right answer when you already run a platform team, want dynamic credentials
rather than stored ones, and need the audit story to satisfy an enterprise security review. The
second is the right answer when the rule needs to be shown to an auditor without handing over a
codebase, and when nobody is available to operate four more services.

### Temporal — the best answer to the row that costs money

Worth naming specifically because §4's idempotency problem is its whole reason for existing.
Durable execution makes a retry safe by construction: the workflow's state is the record, a
replayed step resolves to its first outcome, and "did this already happen" stops being a question
you answer with a uniqueness constraint you remembered to add. If agentic checkout is the
principal use case and the team is comfortable operating it, this is the strongest single answer
to retries — and it still leaves consent, custody and evidence to be sited somewhere.

### The rest, briefly

- **Cloud-native (AWS or GCP).** Lambda or Cloud Run for compute, EventBridge Scheduler or Cloud
  Scheduler for the clock, Secrets Manager with KMS for custody, and conditional writes in
  DynamoDB or Firestore for idempotency. All four properties, assembled. The cost is that the
  rule ends up as code in a repository rather than an artifact anyone can be shown.
- **Supabase, extended.** Postgres with `pg_cron`, edge functions, and its secrets store. The
  closest single-product alternative, and the enforcement-point argument in §6 is the reason it
  was not chosen here rather than a criticism of it.
- **Cloudflare alone.** Workers with cron triggers, Durable Objects for coordination, D1 for
  constrained writes, Queues, and a secrets store. Most of this document's own infrastructure
  already runs there; the gap is a system of record with a queryable relational model and a rule
  surface a non-engineer can read.

The test for any of them is the same, and it is not a feature list: **can it hold a clock, a
credential vault, one rule artifact every path calls, and evidence whose ordering a constraint
enforces — while nothing is being rendered?** Four yeses and the choice is about operating cost
and who has to read the rule. Fewer than four and the gap does not close by adding a framework
in front of it.

---

## 10. The generalisation: every static-data integration becomes a function with declared reach

Nothing in this document is specific to one storefront framework, and the conclusion is not
"choose this backend." It is that **an entire category of software is about to need a server-side
function layer it never had** — every plugin, every CRM connector, every integration whose model
is *read a fixed dataset, render it.*

That model was sufficient while the caller was a person with a browser, because three things were
handled implicitly and none of them were anyone's responsibility:

- **Privacy** was a banner and a cookie, resolved once per visit, describing a session.
- **Permission** was implicit in the interface — you could not click what you were not shown.
- **Idempotency** was unnecessary, because a human who saw a spinner waited rather than retrying.

All three assumptions fail at once the moment the caller is software. Consent has to be a record
resolvable with no session, permission has to be stated rather than implied by a hidden button,
and retries stop being an edge case and become normal client behaviour. A plugin that reads
static data has nowhere to put any of it — not because it was built badly, but because it was
built for a caller that no longer exclusively exists.

What replaces it has the same shape everywhere, whatever it is written in: **functions that run
server-side and declare their reach before they run.** Privacy as a call, permission as a
declaration, and writes that carry a key so the second attempt resolves to the first outcome.

### Tools and rules — Deno-grade permission, at the business layer

"Declare what you may touch before you run" stops sounding like a runtime detail once the caller
is a model, because that is exactly what a tool definition *is*. A tool names what it does, what
it takes, and what it may reach; an agent can act only through the tools it was given. It is
`--allow-net` moved from the process to the business operation.

Rules are the other half: the conditions on those tools, evaluated per call rather than baked in
— scope, cap, expiry, counterparty, consent state at that instant.

**AI both forces this architecture and makes it possible.** It forces it because intents can no
longer be enumerated in advance: you cannot ship a screen for every thing an agent might
reasonably try, so the boundary has to be stated as capability rather than implied by what a
person was shown. And it makes it possible because the caller *reads declarations* — a tool list
is machine-readable in a way that a permissions matrix in a wiki never was. For the first time,
the thing being restricted can parse the restriction.

Which closes the argument the timeline in §0 opened. Permission moved from the template, to the
request, to the token, to the declaration — and the destination is a set of tools with rules on
them, evaluated per call and recorded afterwards. That is a Deno-grade permission model with the
process swapped for the business operation, and it is the first architecture in twenty years that
the caller itself can read.

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
