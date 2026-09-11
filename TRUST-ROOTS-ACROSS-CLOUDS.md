---
title: "Trust Roots Across Clouds"
description: "What TLS actually buys and where it stops — and why a permission is intent, mandate and policy together, never a token anybody carries."
canonical: https://persephonepunch.github.io/crm-sync-setup/trust-roots-across-clouds.html
category: "Security"
date: 2026-09-09
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/TRUST-ROOTS-ACROSS-CLOUDS.md
licence: CC-BY-4.0
tags:
  - security
  - entitlement
  - agentic-commerce
  - identity
keywords:
  - TLS 1.3
  - forward secrecy
  - non-repudiation
  - permissions boundary
  - intent mandate policy
  - RFC 9421 message signatures
  - SPIFFE
  - workload identity
  - Ed25519
  - JWKS
  - hash-chained ledger
  - gates versus weights
  - prompt injection
  - confused deputy
  - Vertex AI lifecycle
  - actAs
  - graph traversal permissions
  - semantic search
  - retrieval
  - agentic commerce
about:
  - Transport layer security
  - Key custody
  - Authorization for AI agents
  - Data governance
  - Vector search and retrieval
  - Graph analytics
---
# Trust Roots Across Clouds

**Moving to AI data in real time for e-commerce.**

**For:** architects, security teams and technical founders running commerce on a composed stack — a CMS, a managed backend, an edge runtime and a warehouse — who are being asked to make that stack legible to AI systems without losing control of it.

**Companion reading:** [Capability, Not Perimeter](./capability-not-perimeter.html) · [Consent Resolution on Higher-Order Load](./consent-resolution-pattern.html) · [Forward-Deploy Agentic GraphQL](./forward-deploy-agentic-graphql.html)

---

## The thesis in three parts

**Challenge.** Cloudflare, Xano and Webflow sell places to put things — a table, a collection, a bucket, a tag. What none of them sells is the ability to say who called, to expire that caller's access without someone remembering to, or to prove afterwards which caller moved what. A stack that renders straight from tables has nowhere to put a policy, so the gap gets filled with shared secrets that never expire and look identical no matter who presents them.

**Solution.** Move the decision out of the render and into a server function. In commerce and GA4 terms, that is the difference between a template looping over a collection and a function that decides, per request and per subject, what data exists, whether the tag fires, and what the event is permitted to carry. A table render has no seam to hold a permission. A function is that seam, and it is the only place a rule can be evaluated rather than merely configured.

**Benefit.** Once the decision is a function, permissions stop being configuration repeated in every plane and become a service the planes call: policy and permissions as a service, which is what a data governance system is when it is enforced rather than documented. Security shaped for an AI caller — decided per action, at request time, in a form a machine can read without a human in the loop — turns out to be shaped correctly for every other caller too. It stops being a gate that only subtracts and becomes a utility that commerce, analytics and agents all draw on.

---

## Nobody in a composed stack sells custody

This is not a criticism of the three vendors. Each is excellent at the job it sells, and the job it sells is *rendering*: bind a collection to a template, a table to an endpoint, a tag to a page. But a render is a pure function of stored state, and stored state cannot express a rule about who is asking. The missing capability is missing from all three at once because it is a property of the shape, not of any one product.

Taking each in turn: **Cloudflare** sells compute and storage at the edge plus the perimeter around it; it holds some records in KV, D1 and R2, and it stores secrets but draws no distinction between callers presenting the same one. **Xano** sells a managed backend — Postgres, function stacks, its own auth — and it is a genuine system of record, but its credential model is environment variables, which means one value for every caller. **Webflow** sells a publishing surface with a CMS attached; it holds a mirror rather than a source, and it has no credential model at all.

| Vendor | What it actually sells | Holds your business records? | Can it control who uses a credential? |
|---|---|---|---|
| Cloudflare | Compute and storage at the edge, plus the perimeter | Some — KV, D1, R2 | Stores secrets; no per-caller distinction |
| Xano | Managed backend — Postgres, function stacks, its own auth | Yes, system of record | Environment variables — one value for every caller |
| Webflow | A publishing surface with a CMS attached | A mirror, not a source | No credential model at all |

The obvious place to look for the missing column is the enterprise secrets-management market, and for a small operator that market is effectively closed: its capable products are sold through named account teams on negotiated agreements, with the useful half of the feature set behind an enterprise tier. A business that cannot renew a dependency with a credit card should not take that dependency. That rules out a category, and what survives the rule turns out to be sufficient — because most of what that category sells is discipline rather than technology, and discipline is written, not purchased.

---

## What TLS actually buys, and where it stops

The baseline being replaced here is not a weaker encryption scheme. It is the ordinary arrangement almost every integration actually runs on: a SQL read against a production database over a connection string, moving whole tables in one direction, into a warehouse or a spreadsheet or an agency's inbox.

Encrypting that channel genuinely fixes four things. The bytes become unreadable to anyone on the path. Tampering in transit is detected. You know which server you reached, because the certificate chain says so. And recorded traffic stays safe even if a long-term key leaks later, because TLS 1.3 always uses ephemeral key exchange — the property called forward secrecy. An unencrypted database connection is indefensible in 2026, and turning TLS on everywhere is cheap and settled.

Seven things it does not fix. **TLS does not tell the server which client called** — client authentication requires mutual TLS, which is a separate arrangement. **It does not protect anything once it lands**, because the payload is decrypted on arrival. **It does not survive more than one hop**, because it terminates and re-establishes at every proxy, load balancer and CDN. **It does not let a third party prove what was sent.** **It does not restrict which rows move** — the whole table goes, privately. **It leaves no record that the transfer happened.** And **it provides no path for a revocation to travel back**.

| Property | Raw SQL, one direction | Same, over TLS 1.3 | With a policy plane |
|---|---|---|---|
| Bytes unreadable on the path | No | Yes | Yes |
| Tampering in transit detected | No | Yes | Yes |
| You know which server you reached | No | Yes — certificate chain | Yes |
| Recorded traffic safe if a key leaks later | No | Yes — forward secrecy | Yes |
| Server knows *which client* called | No | No — TLS does not do this | Yes — signed request, RFC 9421 |
| Still protected once it lands | No | No — decrypted on arrival | Yes — AES-256-GCM at rest |
| Protection survives more than one hop | No | No — terminates at each proxy | Yes — signature travels with payload |
| A third party can prove what was sent | No | No — symmetric session keys | Yes — Ed25519, published JWKS |
| Only permitted rows are moved | No — whole table | No — whole table, privately | Yes — gate before selection |
| A record exists that it happened | No | No | Yes — hash-chained ledger |
| A revocation can travel back | No — one direction | No — still one direction | Yes — the return path is the point |

### Three misreadings that matter

**TLS is not evidence.** This is the least understood property and the most consequential. Once the handshake completes, both parties hold the *same* symmetric keys. Either could have produced any message in the session, so neither can prove to anyone else what was sent. That is entirely correct for a channel and useless as a record — and it is exactly why a signature layer belongs on top rather than instead. A transcript of a TLS session proves nothing to a third party; an Ed25519 signature over the payload proves it to anyone holding the public key.

**TLS terminates.** Every proxy, load balancer and CDN in the path decrypts and re-encrypts. In a five-cloud path there are at least four such terminations, so "encrypted end to end" describes a diagram nobody has drawn. What actually travels intact from origin to destination is whatever the payload carries in itself, which is the argument for signing the payload rather than trusting the pipe.

**A one-way pipe cannot carry a revocation.** This is the real failure of the raw-SQL export, and it is not a confidentiality failure at all. When someone withdraws consent, or a record is corrected, or an erasure request arrives, that fact has to reach every copy. A one-directional extract has no channel for it to travel down. The CSV that went to an agency in March is not insecure because it was unencrypted — it is uncontrollable because nothing you do afterwards can reach it.

> TLS protects the journey. It says nothing about whether the traveller was permitted to leave, and it cannot bring anything back.

---

## Where the vendors are heading

None of this is a bet against the vendors. Every one of them is moving in the same direction, from tables you render by row toward a typed graph you query by shape.

**Webflow** is moving from CMS collections bound to a template toward a Data API with components and variables — a queryable site graph, but still render-first, so the decision stays outside it. **Xano** is the exception to the framing: it has exposed REST and GraphQL side by side for a long time, so there is no protocol migration to describe. The protocol was never the story. What matters is that the **function stack** is the unit of composition behind either surface — and that is where the seam already is, because a rule evaluated in a function stack is enforced whichever protocol fronted the request. **Cloudflare** moved from being a cache and a perimeter to Workers, D1 and Vectorize, where the function *is* the product and the seam is the whole offering. **Google** is moving from GA4 reports and warehouse tables toward BigQuery and Vertex, and GQL over Spanner Graph — the query shape modernises while governance lags it.

Read that as a split: two vendors are building the decision seam, and two are improving the query surface while leaving the decision exactly where it was. That is not a reason to leave either pair. It is the reason the seam has to be yours, because half your suppliers are not going to provide it.

---

## Six things an agent-to-agent call has to prove

"Permissions with TLS" conflates layers that fail independently. When one agent calls another across a cloud boundary, six separate claims are in play, and TLS answers only the first.

The channel is private, which TLS 1.3 establishes. The calling machine is who it says, which needs a short-lived workload credential rather than a shared key — SPIFFE X.509-SVIDs or OIDC federation. The request was not replayed, which needs a signature over method, authority, path and body — RFC 9421 message signatures, or DPoP under RFC 9449. It acts for a named principal, which needs a delegation chain naming the actor and not merely the subject — RFC 8693 token exchange with an `act` claim. It is allowed to do this specific thing, which needs structured authorization detail rather than a scope string — RFC 9396, or an AP2 mandate. And someone can check it later, which needs a signed, chained record verifiable without the platform.

| Claim | What proves it | Standard |
|---|---|---|
| The channel is private | TLS, terminated at each hop | TLS 1.3 |
| The calling machine is who it says | Short-lived workload credential | SPIFFE / X.509-SVID, OIDC federation |
| This request was not replayed | Signature over method, authority, path, body | RFC 9421, or DPoP RFC 9449 |
| It acts for a named principal | Delegation chain naming the actor | RFC 8693 token exchange, `act` |
| It may do this *specific* thing | Structured authorization detail | RFC 9396, AP2 mandate |
| Someone can check it later | Signed, chained, verifiable without the platform | JWS / JWKS, hash chain |

A composed commerce stack is typically strong at the top of that ladder — delegation, scoped permission, evidence — and thin in the middle, where machine identity and replay protection live. That is the inverse of a conventional infrastructure estate, which usually has solid workload identity and no idea who a request is ultimately acting for.

---

## Where policy logic lives, and where it reasons

In the server function, at request time. Never in the store, and never in the render. The evaluator folds three inputs — the entitlement row, the tag set, and for a non-human caller the mandate — into one held-capability set for this request, this subject, this moment.

The distinction worth holding on to is that **logic and reason are two outputs, not one**, and they must be produced in the same breath. The logic is the decision: allow, deny, and at what weight. The reason is the record of why — the rule that fired and the inputs it saw. A decision written without its inputs is not a policy; it is a coincidence that happened to be correct. So the evaluator returns a verdict and appends it, in the same call, as one row carrying the decision, the weight, the rule identifier, the inputs, and its position in the chain.

Denials append too. A policy plane that records only its permissions cannot answer the one question an auditor actually asks, which is what you refused and when.

### How permissions are saved

In four places with four different jobs. The discipline is knowing which one is authoritative.

The **queryable row** lives in the backend's entitlements table: mutable, indexed, joining to the subject. The **ordering proof** lives in an append-only ledger whose unique index on `(tenant, stream, prev_hash)` *is* the compare-and-swap. **Live authority for an agent** lives in a TTL'd key-value record, where absence is expiry and no sweeper is needed. And **projections outward** — customer metafields, tags, a signed token — are rebuildable from the first two and must never be read back as truth.

| Store | Job | Property that makes it right | Authority |
|---|---|---|---|
| Entitlements table | The queryable row | Mutable, indexed, joins to the subject | Source of truth |
| Ledger chain | The ordering proof | `UNIQUE(tenant, stream, prev_hash)` is the CAS | Authoritative for order |
| KV mandate record | Live authority for an agent | TTL'd — absence *is* expiry | Authoritative while present |
| Metafields, tags, signed token | Projections outward | Rebuildable from the two above | Never read back as truth |

A record hash is the join between the queryable row and the proof of where it sits in the sequence. The rule that keeps this honest is that exactly one store is the source and the rest are derived. A projection read back as truth is how drift stops being detectable — the copy and the original disagree, and nothing is looking.

### How weighting is sequenced on the timeline

A weight is not a stored number. It is a fold over the chain up to a sequence point:

    weight(subject, n) = fold(events on stream where seq <= n)

This is the same shape as a loyalty balance, and for the same reason. If the weight is stored, you cannot answer *what was it at the moment the agent acted* — which is precisely the question a disputed purchase asks. If it is folded, every past weight is reproducible by replaying to that sequence number, and the answer is the same every time anyone checks.

Four sequencing rules, all enforced by schema rather than by code that remembers to. **Order by sequence, never by timestamp** — timestamps come from a distributed edge, are not monotonic, and are not a total order. **The unique index is the concurrency control** — every hash may be the predecessor of exactly one row, so two writers racing the same tip both attempt the same `prev_hash` and exactly one commits, while the loser re-reads and retries. **A second, independent guard on the sequence number** keeps it dense and unique per stream, so a gap or duplicate is detectable even if the hash linkage were somehow satisfied. And **revocation appends, it never rewrites** — each weight event carries the mandate it was published under, and revoking that mandate adds a row so every later fold excludes it.

The publishing consequence follows directly. What you hand a model is a projection at a sequence number, not a live query result: the data, the sequence it represents, the mandate it was published under, and a signature. A model, an agent or an auditor can then ask what was published, under whose authority, at which point in the chain — and verify the answer against a published key set without calling you at all.

> Page views tell you a human looked. A sequenced, signed record tells you what a machine was allowed to weigh, and when.

---

## Shopify to GA4, the long way round

The native path is a tag in the theme, firing from the shopper's browser. It is free, it takes an afternoon, and it fails in four ways that are the same failure wearing different clothes: a tag lives in the render, and the render is the one place with no seam to put a decision in.

Delivery through a tag is lossy — blockers, tracking prevention, abandonment before the beacon — whereas a server-to-server webhook retries. The tag's payload carries what the browser knows rather than what the business knows. Consent is evaluated at the tag, inside the render, rather than as a gate in a function before the event exists. The GA4 client identifier never meets the customer identifier. And a refusal is invisible: the tag simply does not fire, which is indistinguishable from a bug.

| Property | Tag in the theme | Through the middleware |
|---|---|---|
| Delivery | Lossy — blockers, abandonment | Server to server; a webhook retries |
| Payload | What the browser knows | What the business knows — enriched before send |
| Consent | Evaluated at the tag, inside the render | A gate in the function, before the event exists |
| Identity | Client id never meets user id | Joined once, in one governed table |
| A refusal | Invisible — the tag does not fire | Recorded, with the rule that caused it |

> A tag in a theme cannot refuse. A function can — and it can say why it did.

### Three vendors, three jobs, three prohibitions

The middleware is not a fourth vendor. It is the arrangement of the three you already have, and it works because each is held to a single job.

**Webflow** is the human surface: it emits consent state and page context, and it is where a person is found. It must never decide, because it holds no request context for any other subject. **Cloudflare** is the decision seam: it verifies the webhook, resolves consent, enriches, mints or refuses, ledgers and forwards. It must never become the source of truth — it is the evaluator, not the record. **Xano** is the source of truth: the user spine, consent rows, entitlements. It must never be reachable from a browser.

The path runs in six stages. **Verify** — check the webhook HMAC with a constant-time compare; an unverified event is not a lower-confidence event, it is not an event. **Resolve** — look the subject up on the spine. **Gate** — read the consent state, including the advertising-data and personalisation signals and the jurisdiction that decided them, as a binary check before the event is minted. **Mint or refuse** — both outcomes append to the ledger with the rule that produced them. **Send** — server-side to the Measurement Protocol under an API secret held as a worker secret, which is the point: it is never in a theme, a page source or a tag manager container. **Join** — export to the identity map, carrying the internal identifier, the user identifier, the GA4 client identifier and the consent state, for consented subjects only.

One ordering constraint governs all of it. GA4's client identifier is minted by the browser, so it can only be captured *after* consent, and signing in is the first moment an anonymous client identifier can be bound to a person. Capture it first and you have collected an identifier you had no permission to collect; later consent does not retroactively authorise it.

---

## The destination is not a dashboard

Orders and events land in the warehouse from the commerce API and the analytics export. A gradient-boosted regressor trains on the joined feature set. The scores join back on the client identifier. And the result comes home as a per-user weight in edge key-value storage, where the request-time decision function reads it.

| Stage | What it produces |
|---|---|
| Collect — commerce GraphQL, analytics export | Orders and events in one dataset |
| Join — identity map | client id ↔ user id, the identity spine |
| Train — boosted-tree regressor | A model of future revenue |
| Score — scores table | A predicted value per client id |
| Return — edge KV | A per-user weight read at request time |
| Escalate — a managed ML platform | Only when the model outgrows SQL |

The second-to-last row is what makes this a policy plane rather than analytics. The score does not stop at a report someone reads on Monday — it re-enters the decision as a weight, which means it is subject to every sequencing rule above: folded rather than stored, ordered by sequence, published under a mandate.

The erasure path is worth copying as a pattern. Deleting a subject removes the identity-map row and leaves the revenue rows in place, retained but de-linked. That is the only shape satisfying the erasure right and the accounting requirement at once, and it works precisely because the identity spine is a separate table from the facts. Build any new destination the same way, or erasure becomes a choice between breaking the books and breaking the law.

---

## Migration is a lifecycle nobody admitted to

Migrations are scoped as projects: a cutover date, a freeze, a rollback plan, a status that goes green. The trouble is that sources keep changing after the date passes, the mirror drifts, and nothing re-checks a status that already said done. Every stale index and every page that needed a second push is the same bug — a project shape imposed on a continuous problem.

Turning it into a real-time lifecycle replaces the cutover with a reconciler that keeps running: read the source, compare against the mirror, emit the delta as events on the chain. Nothing is ever migrated. It is either currently in sync, or currently behind by a measurable amount.

| Question | Migration as a project | Migration as a lifecycle |
|---|---|---|
| The unit of work | A cutover | An event on a stream |
| "Done" means | The date passed | Lag is inside budget, and lag is a number |
| How it fails | Silent drift after go-live | A stalled cursor — visible, alertable |
| Rollback | Restore a backup, lose the interval | Replay to a sequence number |
| What the model sees | Yesterday | Now |

That last row is why this belongs in a document about inference. A weight computed from a batch that lands overnight is wrong for the whole of the following day, and confidently so.

### Inferring what changed

A reconciler has three ways to learn that something moved, and a real design uses all three because each covers the others' blind spot. **The source tells you** — a webhook, change feed or cursor — which is cheapest but leaves a missed delivery invisible forever. **You compare** — a full or windowed diff — which is complete but too slow to be the only signal. **You infer** — hashes, etags, `updated_at` heuristics — which is cheap and sometimes wrong, flagging a touched row that did not change. Use the change feed for latency, a periodic diff for completeness, and hashes to keep the diff affordable.

### Four rules for a reconciler

**A refusal is not an empty set.** A read that errors, times out, or comes back truncated must never be treated as "the source has no rows." This is the most dangerous line in any reconciler and it is how an unattended process deletes a production dataset. Three outcomes, never two: rows, empty, unknown.

**Absence is a candidate, not a delete.** A row missing from one read is a hypothesis. Require a tombstone, or two consecutive independent reads that agree, before removing anything.

**Bound the blast radius per pass.** If a single pass would delete more than a set fraction of the mirror, it stops and asks. A reconciler that *can* delete everything in one pass eventually will.

**Dry run is a gate, not a courtesy.** The preview belongs in the path by default, with the write requiring an explicit flag — the opposite of the usual arrangement, and the right way round for anything that reconciles.

---

## The reshape: SQL, JSON, query, weight, retrieval

Five stages, and every boundary changes the shape. SQL is rows. JSON is documents. A query selects. A weight orders. Retrieval hands a model a top-K to read. Something is lost at each crossing, and knowing what is lost is the difference between a retrieval system that answers and one that confabulates fluently.

### Product.csv to GraphQL data lists

The starting point is the worst case. A CSV is the purest possible table render: no request context, no subject, no seam for a policy, and no types — a forward-filled handle column is indistinguishable from real data on inspection, and vendor-defined groups do not survive the export at all. Every guarantee described in this document is unrepresentable in that format.

A GraphQL data list replaces the file with a typed selection evaluated per request: the caller asks for the fields it is entitled to and the server decides what to return. The migration is usually described as a performance or tooling change. It is neither — it is the point at which permissions become expressible at all.

### Lists and segments are people-shaped only

Marketing platforms' lists and segments contain users, and that is all they contain. On their own they cannot drive commerce, because a list of people carries no product, no price and no campaign. The pairing is not an enhancement: the person plane has to be joined to products, campaigns, lists and segments before any of it is actionable — and that join cannot happen inside the marketing platform, and certainly not inside a CSV. It happens in the function.

### Nine domains, and which are gates

Products reshape into a document plus an embedding, weighted by a blend of vector rank, title overlap and rating. People reshape into an identity-spine row weighted by predicted lifetime value. Reviews fold into the product embedding as a tiebreaker. Loyalty is a fold over the ledger, recomputed and never stored. Prices carry a 30-day history and are about correctness rather than ranking. Languages become a multilingual index, which is a filter rather than a score.

The remaining three are **gates, not weights**: context — consent, entitlements, capabilities — is evaluated at request time and is never a score; campaigns are consent-gated eligibility; segment membership is binary.

| Domain | Reshaped to | Weight or gate |
|---|---|---|
| Products | Product document + embedding | Weight — vector, title and rating blend |
| People | Identity spine row | Weight — predicted lifetime value |
| Reviews | Folded into the product embedding | Weight — tiebreaker only |
| Context | Evaluated at request time | GATE — never a score |
| Loyalty | Fold over the ledger stream | Weight — recomputed, never stored |
| Prices | Price document with history | Neither — correctness, not ranking |
| Languages | Multilingual index | Filter — locale, not a score |
| Campaigns | Audience membership | GATE — consent-gated eligibility |
| Segments | Membership set, recomputed | GATE — membership is binary |

> A gate removes the row. A weight orders the rows that survived the gate. A permission that becomes a coefficient will eventually serve the thing it was told not to.

Keeping gates out of the scoring function is the single most important rule in the reshape. Withdrawn consent cannot be expressed as a low weight, because a low weight still ranks — it just ranks lower, and on a quiet enough day it reaches position one. Gates run first, they are binary, and they delete rows from the candidate set before any weight is computed.

---

## "Add it to the product.csv update process so the model can see it"

This is the advice a merchant gets, and it is given in the name of AI security rather than in spite of it. It deserves a straight answer, because **its premise is correct**: a model can only weigh what it can see, and a field that exists solely inside an application's runtime is invisible to a training job. The CSV gets proposed because it is the one artifact every system in the stack can read.

What is wrong is the conclusion. Following the advice means three things, and each converts a control into a liability.

**Flattening the permission into a column** turns a gate into a value. A gate deletes rows; a column can only be read. Once consent is a cell, every consumer decides for itself whether to honour it, and they will not agree.

**Maintaining it manually** makes freshness a function of somebody's memory. A withdrawal arriving Tuesday reaches the file on Friday, if anyone remembers. Every training run in between uses permission state that is known to be wrong.

**Distributing it one direction** makes each copy authoritative for whoever holds it. No return path exists for a revocation, so every copy is a permanent decision taken with the state of one afternoon.

> A permission expressed as a column is a suggestion attached to a row. Only something that can refuse is a permission.

### The premise is right. The transport is wrong.

The answer is not to hide the data from the model. It is to separate *visibility for training* from *authority for serving*, which are two requirements that the CSV collapses into one file.

Train on a **projection**: the fields the model needs, at a stated sequence number, with ineligible rows removed *before* the export exists. Gate first, then export — never export, then filter, because by then the rows have already left. Serve from the **source**, at request time, where a refusal is still possible. And let the reconciler regenerate the projection rather than a person, so freshness becomes a lag figure that can raise an alert instead of a habit that can lapse.

| Question | The CSV column | The gated projection |
|---|---|---|
| Who removes ineligible rows | Every consumer, differently | The exporter, once, before the file exists |
| How fresh is the permission state | Whenever someone remembered | A lag figure, with a threshold |
| Can a training run be reproduced | No | Yes — replay to the sequence number |
| Does a revocation reach it | Never | On the next reconciler pass |
| Can it refuse a caller | No | Yes — it is a function |

The projection is *more* visible to the model, not less. It carries the fields the training job actually needs, it arrives on a schedule the model can rely on, and it states the sequence point it represents — which a hand-maintained file never can. The security improvement and the machine-learning improvement are the same change.

The advice is right that the model must see the data. It is wrong that a person should be the transport.

---

## Three retrievals, and what each one cannot do

These three get used interchangeably in conversation and they are not interchangeable at all.

**Text search** — lexical — matches the tokens typed against the tokens stored, through a query syntax, a SQL `LIKE`, or an inverted index. It wins on exact identifiers: SKU, GTIN, order number, a name already known. It is defeated by synonym, paraphrase, typo and word order. It is deterministic and fully explainable: you can always say why a row matched.

**Semantic search** — vector — embeds the query and returns nearest neighbours by distance in that space. It wins on paraphrase and intent, so "mouse for my computer" finds mice. It is defeated by exact identifiers, because the embedding of a SKU is noise; by negation; and by anything where a literal token must match. It is not deterministic across model versions: re-embedding the corpus changes the answers, and nothing warns you.

**Whole-record query** — structured — queries descriptions, tag sets and event streams as *fields*: filters, facets, time and sequence ranges, a selection over tags and metafields. It wins on exhaustiveness and counts. It is defeated by anything the schema did not anticipate. It is the only one of the three that can be **complete**; the other two return a top-K and cannot tell you what they left out.

| Mode | Wins on | Defeated by |
|---|---|---|
| Text search (lexical) | Exact identifiers — SKU, GTIN, order number | Synonym, paraphrase, typo, word order |
| Semantic search (vector) | Paraphrase and intent | Exact identifiers, negation, literal matches |
| Whole-record query (structured) | Exhaustiveness, counts, "everything since N" | Anything the schema did not anticipate |

Because they fail differently, the blend must be explicit and inspectable. A working product search scores roughly 45% vector rank, 45% title-token overlap and 10% rating, names the strategy in its debug output, and falls through a documented cascade: a strict conjunction, then a relaxed disjunction re-ranked by title because the platform returns disjunctive matches in arbitrary order, then a fuzzy pass scoring exact matches at 1.0, prefixes at 0.7 and edit-distance-two at 0.6, keeping anything averaging 0.5 or better. The rating is weighted small on purpose, because review text is already folded into the embedding and would otherwise count twice.

> A ranking you cannot inspect is a ranking nobody can tune.

### The failure to design against

The sharpest illustration comes from knowledge-base retrieval. A chunker that splits on blank lines turns an entire markdown table into one chunk. Ask a question about a single row of that table and the similarity falls under the matching threshold — and the system answers that the topic is not mentioned, while the answer sits in the corpus, correctly indexed, in a chunk that was simply too large to match.

Semantic search does not fail loudly. It returns a confident nothing, and a confident nothing is indistinguishable from a true negative unless something else in the system can be complete. The remedies are to restate tabular content as prose so it chunks into matchable units, and to route row-level and count questions to the structured query, which can answer *how many* and *is there any* — questions a top-K is structurally incapable of answering.

---

## Graph analytics is where per-row permissions stop composing

A graph endpoint — one route that answers how this connects to that — is the natural next analytics surface, and it is the query shape that breaks every permission model above.

**Further viewing.** Big Data LDN's conference talk *Graph Analytics in BigQuery — Unifying Analytics and AI at Scale* covers the query-side half of this — unifying analytics and AI over a graph at scale. It is a good account of the capability. The permission problem below is the part that sits outside its scope.

<div style="max-width:760px;margin:1.25rem 0"><div style="position:relative;padding-top:56.25%"><iframe src="https://www.youtube-nocookie.com/embed/ylUaoy1musw" style="position:absolute;top:0;left:0;width:100%;height:100%;border:1px solid #B8B0A4" title="Graph Analytics in BigQuery — Unifying Analytics and AI at Scale (Big Data LDN)" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>

<p style="font-size:.85rem;color:#6E7276;margin:-.6rem 0 1.4rem">Video: <a href="https://www.youtube.com/watch?v=ylUaoy1musw" rel="noopener">Graph Analytics in BigQuery — Unifying Analytics and AI at Scale</a> — <a href="https://www.youtube.com/@Bigdataldn" rel="noopener">Big Data LDN</a>. Embedded for reference; not a CRM Sync production.</p>

The reason is structural. Row-level authorization assumes the answer is a set of rows, each of which you may or may not see. A traversal's answer is a *path*, and a path crosses ownership boundaries by definition. Filtering the endpoints of a path while returning the path itself leaks the middle. Filtering the middle changes the answer without saying so. Neither is a bug in the engine; it is what a join across permission domains does.

Engines differ in what they can enforce. A property-graph database with label-based access control can gate individual nodes and relationships. A managed graph analytics service typically authorises per IAM action across the whole graph. A graph layer over a relational store inherits table and column grants. And recursive common table expressions over an ordinary relational database enforce whatever row-access policies that database has.

| Engine | Built-in AI | Finest permission unit |
|---|---|---|
| Property graph with label ACLs | Vector index, graph RAG | Node and relationship, by label |
| Managed graph analytics service | Vector search in-engine | The whole graph, per IAM action |
| Graph layer over a relational store | Via an external ML platform | Inherited table and column grants |
| Recursive CTEs, no graph engine | Alongside, not in-engine | Row-access policies |

**The recommendation for most teams is to not buy one yet.** At modest spine sizes, a recursive CTE answers the same questions, and the honest reason to adopt a graph engine is query ergonomics rather than capability. Adopting one early imports a second identity model and a second audit trail to solve a problem that is not yet the bottleneck.

What is worth doing now is fixing the permission shape, because it is the same fix either way. A graph route should return the edges the caller is entitled to see *and a count of the ones it is not*, rather than silently pruning. A pruned traversal that does not say it was pruned is the analytics equivalent of a route that returns success and writes nothing.

> An agent that can ask "who is connected to whom" enough times does not need permission to read the edge.

Repeated authorized traversals reconstruct unauthorized structure, and no engine prevents it. The controls that work are budgetary rather than relational: per-subject query budgets, a minimum result cardinality before a path is returned, and every traversal landing in the same ledger as everything else.

---

## Merge the graph. Do not merge the planes.

Warehouse management, product information, trading-partner documents and customer records describe one commerce from four angles, and the prize in unifying them is real: a single traversal running from a purchase order through a SKU to a shipment to the person waiting for it. Unified graph parameters are what make weighting comparable across all of it — without one parameter space, every domain scores on its own scale and nothing ranks against anything else.

| System | Entities | Native edges | Plane |
|---|---|---|---|
| WMS | Location, lot, movement | holds, moved-to, picked-for | Machine |
| PIM | Product, variant, attribute | variant-of, supersedes, bundles | Machine |
| EDI | PO, ASN, invoice, partner | fulfils, references, invoices | Machine |
| CRM | Person, consent, claim, entitlement | consented-to, entitled-to, acts-for | Human |

Three of the four are machine-shaped. One is not, and that asymmetry is the entire design problem — because the merge everyone wants is precisely the merge across it. A shipment has a person waiting for it; an entitlement belongs to someone; a segment is made of people.

### Human-only data merges with machine permissions at exactly one point

Two different things could be unified here, and only one of them should be. Unify the *traversal*: one graph, one parameter space, one weighting scale. Do not unify the *authorization*. The capability that lets a machine read a lot number has nothing in common with the consent that lets a person's address be used for a purpose, and a graph in which one implies the other is a compliance incident with a query planner attached.

Entity identifiers unify, because the join key is the point. Edge types and traversal unify, because one walk across four systems is the prize. The weighting parameter space unifies, for comparability. **Consent state never unifies**, because consent is granted per purpose and a traversal has no purpose. **Capability grants never unify**, because machine capabilities are per action on a different subject entirely. And **identity attributes never enter the weight** — a predicted value returns as a number, and the features behind it do not.

That last one gets violated by accident. A score derived from a person is safe to carry; it is a number. The features that produced it are not, and a unified graph makes joining back to them a one-hop operation nobody explicitly authorised. Keep the warehouse out of the authorization path entirely: a row in a warehouse is evidence *about* a person, never permission to act *on* them.

The join mechanism is a name, not a record. An encrypted actor token names a machine acting for a human without carrying that human's attributes into the machine's authorization path. That is what keeps the merge from becoming a leak: the actor is the single point where the planes touch, it is one identifier wide, and everything else stays on its own side.

> Merge the graph so the traversal is possible. Keep the planes apart so the traversal is lawful.

Operationally that means two gates, evaluated separately and both before any edge is walked: the machine caller is gated on its own capability, and the human subject's rows are gated on consent for this purpose. Filtering after the walk is the pruning failure again — by then the traversal has already read what it was not entitled to, and the only thing being protected is the response body.

---

## The ML lifecycle permission that actually matters

A managed ML platform's lifecycle runs in stages, each with its own IAM verbs, and the interesting failure is at the seam between two of them.

Registering a dataset grants reach over whatever the dataset points at. Creating a training job runs arbitrary code on managed compute under an attached identity. Uploading a model puts an artifact in the registry. **Deploying attaches a model to a serving endpoint and binds a service account to it.** Calling the endpoint looks narrow. And separately, the permission to *act as* a service account decides which identity the job or endpoint runs as.

| Stage | Permission | Blast radius |
|---|---|---|
| Data | `datasets.create` | Whatever the dataset points at |
| Train | `customJobs.create` | Code execution under an attached identity |
| Register | `models.upload` | Registry contents |
| Deploy | `endpoints.deploy` | Everything the bound service account can reach |
| Serve | `endpoints.predict` | Narrow — but see below |
| Attach | `iam.serviceAccounts.actAs` | The real privilege boundary |

Read the last two rows together. A caller with only predict permission looks tightly scoped — it can invoke a model and nothing else. But the endpoint executes as the service account bound at deploy time, so every data source that account can read is transitively reachable through inference. The caller's permissions govern *whether the call happens*; the deploy-time account governs *what the call can touch*. Those are different questions, answered by different people, usually months apart.

This is the confused deputy in its modern form, and it is precisely the AI-to-AI hazard the ladder above exists to close: the identity that authenticates is not the identity that acts. The mitigations are unglamorous and they work — a dedicated minimal service account per endpoint; the `actAs` permission held by nobody who also holds deploy; a service perimeter so a model or its corpus cannot leave the project; customer-managed encryption keys on datasets, models and endpoints; and prediction calls landing in the same ledger as everything else.

That last pairing connects back to the trust-root question. Customer-managed encryption takes a key from a cloud key service, and a cloud key service is self-serve — priced per key and per operation, no agreement to negotiate. That is the concrete mechanism by which custody reaches the AI plane: the model and its corpus are encrypted under a key the provider can use but cannot produce.

---

## Almost none of this is inside anyone's governance programme

Two things are true at once. The graph and ML material above is technically correct, and it describes a layer that most enterprise data-governance programmes do not cover at all.

Governance was built around the warehouse and the system of record: catalogued tables, a named owner per domain, a retention schedule, periodic access review, lineage back to a source. The ML plane arrived afterwards — provisioned by a different team, on a different budget, under IAM the governance council never reviewed. It is not governed. It is discovered, usually during an audit.

Warehouse tables and the system of record are covered; that is what the programme was built for. BI dashboards are mostly covered, though ownership of derived metrics tends to be vague. Training corpora and feature stores are rarely covered, and lineage back to the governed table they were copied from is usually absent. Model registries are rarely covered. **A serving endpoint's service account is almost never covered** — it is the privilege boundary nobody owns. Graph stores have no owner, because edges inherit no policy from their endpoints. And prompt and inference logs have no retention policy at all, while containing the inputs verbatim.

| Asset | In the programme | What is typically missing |
|---|---|---|
| Warehouse tables | Yes | Nothing — this is what it was built for |
| System of record | Yes | Nothing material |
| BI dashboards | Mostly | Ownership of derived metrics |
| Training corpus / feature store | Rarely | Lineage back to the governed source |
| Model registry | Rarely | Retention, owner, what the model memorised |
| Serving endpoint's service account | Almost never | Access review — the boundary nobody owns |
| Graph store | No | An owner at all |
| Prompt and inference logs | No | A retention policy — they hold inputs verbatim |

### And the divide is wider than that

The organisation asking about graph analytics has usually not closed the first gap. Getting conversions to land reliably on the free tier of GA4 — consent gating the tag, the tag firing on the right event, the event carrying a value, the value reconciling against the order in the store — is a multi-quarter project in most enterprises, and it is a prerequisite for everything above it. Every layer inherits whatever that layer got wrong, and the model layer hides it.

> The distance from a conversion that reconciles to a governed model is organisational, not technical. Nobody sells the crossing.

The frontier described above is real, and it is not where the buyer is standing. The crossing is: consent that gates the tag, an event that carries a value, a value that reconciles against the order, and a record of all three that a third party can check without being asked to trust anyone.

**The sequencing rule follows directly.** Do not build or sell the graph endpoint or the ML plane into an organisation whose conversions do not yet reconcile. A model trained on conversion data that does not tie out is a faster, more expensive and considerably more confident way to be wrong — and it converts a reconciliation problem, which is fixable, into a model problem, which is not.

---

## Permission is a conjunction, not a token

Everything above has treated permission as something a caller carries. That is the wrong shape, and it is why bearer strings feel adequate right up until they are not. A permission is not held — it is the agreement of three independent statements, and it exists only where all three overlap.

    permission = intent ∩ mandate ∩ policy

**Intent** answers what the principal actually wanted done. It is authored by the human, or the system that owns the outcome, and it is declared in advance, scoped and revocable. **Mandate** answers what this actor may do on their behalf. It is minted and signed by the platform, and it is short-lived and expiring — absence is expiry. **Policy** answers what the operator will permit regardless of the other two. It is authored by the operator, standing and versioned by release.

| Layer | Question it answers | Who authors it | Lifetime |
|---|---|---|---|
| Intent | What did the principal actually want done? | The human, or the system owning the outcome | Declared in advance, scoped, revocable |
| Mandate | What may *this actor* do on their behalf? | Minted and signed by the platform | Short, expiring — absence is expiry |
| Policy | What will the operator permit regardless? | The operator | Standing, versioned by release |

Because it is a conjunction, the useful analysis is the failure cases — and each two-of-three combination is a real incident with a name.

**Mandate and policy, no intent.** Credentials perfect, purpose forged. This is prompt injection and the confused deputy both: a valid actor makes a policy-compliant request that no principal ever asked for. The defence is that intent must be declared *separately and earlier*, so a request that maps to no standing intent is refused despite flawless credentials.

**Intent and policy, no mandate.** The principal genuinely wanted it and nothing carries that fact in verifiable form. The action may well be correct; it is simply unprovable, and an unprovable action is indistinguishable afterwards from an invented one.

**Intent and mandate, no policy.** The principal authorised something the operator must not do — spending past a cap, shipping to an embargoed destination, processing a special category of data. Consent does not create capability. Policy is a floor and it wins against both of the others.

Evaluation order is policy, then mandate, then intent: policy first because it is the cheapest denial and the least negotiable, the mandate check second as bounded cryptographic work, and the intent match last because it is the most expensive and the most semantic. Every denial records *which of the three failed* — without that, a refusal is a shrug, and the operator cannot tell a revoked mandate from a policy change from a request nobody made.

> A token answers "may you." A permission answers "may you, for whom, and to what end" — and refuses if any of the three is silent.

---

## What remains unsolved

Every mechanism above — TLS, workload identity, message signatures, token exchange — authenticates a *channel*, a *machine*, or a *principal*. Not one of them establishes that the action being requested is the action the human wanted.

That gap is where AI-to-AI differs from service-to-service, and it is not a transport problem. An agent with a valid credential, a correct signature and a clean certificate chain can still be executing an instruction that arrived inside a document it read. Perfect mutual TLS carries a prompt injection with the same fidelity as a legitimate request.

> The pipe can be provably authentic and the purpose still be forged.

The conjunction above is the shape of the answer, and the mandate is the part of it that already works: signed, scoped, expiring, checked at the point of action rather than at the door. What remains genuinely unsolved is **granularity**. Intent has to be declared precisely enough that a machine can check a request against it, and every widening of the declaration readmits the problem it was meant to close — an intent recorded as "manage my shopping" authorises the injected instruction exactly as comfortably as the real one.

Narrow intents are checkable and exhausting to collect. Broad intents are easy to collect and check nothing. That trade is the open work in agentic commerce, it is not a transport problem, and no vendor named anywhere in this document sells an answer to it.
