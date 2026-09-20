---
title: "From Plugins to Mandates"
description: "Why per-seat SaaS pricing taxes the automation you bought it for, what each external DAM, PIM and CRM adds to your supply chain risk, why Shopify and GA4 JSON is the wrong shape for an agent, and why the deprecation timeline is doing the demolition anyway."
canonical: https://persephonepunch.github.io/crm-sync-setup/from-plugins-to-mandates.html
category: "Specs"
date: 2026-09-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/FROM-PLUGINS-TO-MANDATES.md
licence: CC-BY-4.0
tags:
  - architecture
  - agents
  - governance
  - globalization
---

# From Plugins to Mandates

**For the officer approving next year's SaaS renewals, and the architect who has to make them work together.**

> A plugin estate is a set of things you installed. An agentic estate is a set of authorities you
> granted. The difference shows up first in the invoice, then in the breach notification, and
> finally in the one place nobody plans for: **the shape of the data when something other than a
> person comes to read it.**

---

## 1 · The per-seat problem — challenge and solution

### Challenge

External DAM, PIM and CRM products price per seat. That was a reasonable model when a seat meant
a person doing work, and it fails in two directions at once.

**It multiplies across vendors.** One employee needs a DAM seat, a PIM seat, a CRM seat and an
analytics seat. Four line items, four renewal cycles, four vendors' definitions of what a seat
is — and the marginal cost of adding one person is the sum of all four, forever.

**And it taxes exactly the thing you are buying.** The reason to adopt these tools now is that
agents can do the work. But an agent is not a seat. Vendors resolve that in one of two ways,
and both are bad for the buyer: either the agent needs a licensed seat — so automation is
charged at headcount rates while reducing headcount — or the vendor moves you to API-call or
record-based pricing, where **cost scales with how much you use the automation.** Efficiency
becomes a bill.

The second-order effect is the one that actually bites. Per-seat cost makes teams **ration
access**, so the people who need the data do not have a login, and the workaround is an export.
A spreadsheet leaves the governed system, and now the record of who has what is wrong in a way
nobody will discover until it matters.

### Solution

Price the capability, not the chair. An estate where authority is granted as a **mandate** —
scoped, time-boxed, revocable — has no seat to buy, because the unit is *what may be done* rather
than *who is logged in*. A person, an agent and a scheduled job all obtain authority the same
way, and none of them needs a licence to be counted.

The practical test for any vendor: **can an automated caller do this without consuming a human
seat, and what does that cost?** Ask it during procurement rather than during the rollout.

---

## 2 · Supply chain risk — challenge and solution

### Challenge

Every external system holding your data is a party to your obligations. A DAM holds assets a
brand licensed under terms. A PIM holds the catalogue a regulator will ask about. A CRM holds
personal data with erasure rights attached.

Six exposures, and only the first is the one people plan for:

| Exposure | What it means in practice |
|---|---|
| **Vendor breach** | You inherit their posture and their incident timeline. Your disclosure clock starts when they tell you, which is not when it happened |
| **Sub-processors** | Their vendors are now your vendors. Most estates cannot name them, and the contract requires that you can |
| **Contract production** | A regulator asks for the agreement carrying the required terms. **Honda's settlement included exactly this failure** — not a breach, an inability to produce paperwork for where the data went |
| **Erasure coordination** | A subject exercises a right and you must reach four systems, each on its own SLA, and prove all four completed |
| **Sunset and acquisition** | The product is retired or repriced. Your data is portable in theory and shaped like their model in practice |
| **API deprecation** | Their schedule, your rewrite. See the timeline section below |

**The compounding property matters more than any single row.** Each additional vendor adds a
party to every one of those, and risk grows with the number of *places data lives*, not the
number of features you bought.

### The exposure with no counterparty

Every row in that table assumes somebody to ask. A vendor to notify you, a contract to produce, a
support queue, an escalation path, a renewal at which leverage exists.

Some of the largest exposures in an estate have **none of that**, and they are the ones a
procurement process cannot see, because nothing was procured.

The parser sitting under the media pipeline is the clearest case. Nobody sold it to you. It
arrived inside a base image, or underneath a CMS, or as a transitive dependency of something that
generates a preview. There is no account manager, no SLA, no severity-one queue, and no renewal
conversation in which to raise it. **"Without recourse" is not rhetoric here — there is no ticket
to file.** The maintainers owe you nothing and are in most cases volunteers.

Worse, the remediation is not a patch. Pinning a newer version does not change the fact that the
design hands files to an interpreter; the fix is **architectural** — move the parse into an
isolated envelope holding no credentials and no network. That is a change to the ingest path, not
a dependency bump.

**And it arrives at the worst possible moment.** The deprecation window is already forcing the
estate to touch this code. Teams are mid-migration — wings off the plane, in flight, past the
dates they committed to — and the exposure surfaces as a fourth priority behind three that have
regulator-published deadlines attached.

So it presents as an enterprise decision with two unattractive options: ship the forced migration
on schedule and carry a parser exposure nobody has yet asked about, or delay a dated commitment
for a risk with no incident behind it.

**The way out is that the framing is slightly wrong.** The remediation does not depend on the
migration finishing, on a vendor's cooperation, or on a roadmap. Isolating the parse is a
**scoped, local change to one path** — bytes in, typed result out, credentials and network
withheld — and it is the one item on the list that **requires nobody's permission.** Which makes
it, unusually, the thing that can be done *during* the migration rather than after it.

The decision to actually make is narrower than it looks: not *fix everything or ship*, but
**which single path receives untrusted files, and what does that process currently hold.**

### The worked example, because the sunset row usually gets waved through

Vendor retirement reads as a hypothetical until it has a name.

**Adobe Business Catalyst.** Acquired in 2009, the same year Adobe acquired **Omniture**, and it
became close to the complete article: CMS, ecommerce, CRM, email marketing and Adobe's own
analytics, in one hosted platform. It rendered server-side against Adobe's database, and — the
detail that makes the architecture legible — it used **Liquid** for dynamic content, for the same
reason Shopify does: a template language that cannot execute arbitrary code is the only kind you
can safely hand to thousands of tenants.

It worked. Agencies built practices on it.

Adobe announced end-of-life in 2018 and the service ended on **26 September 2021**. Every site had
to be rebuilt somewhere else, because the runtime was never portable and the content was shaped
like Adobe's model rather than like anyone's business.

**The pattern is not a one-off.** Adobe has repeatedly bundled a publishing and packaging layer
into the Creative Suite — Digital Publishing Suite being the clearest case, carrying document
packaging and the image metadata handling that came with it — and those layers have been folded,
renamed or retired on Adobe's schedule rather than the customer's.

**The point is not that Adobe is a risky vendor.** It plainly is not, and that is precisely what
makes the example useful. Business Catalyst did not fail, get breached, or price itself out. It
stopped being strategic. **No amount of diligence on a vendor's security posture detects a
strategy change**, and the supply-chain row above is the only one where the vendor doing
everything right is fully compatible with you losing the platform.

The exposure is therefore not *reliability*. It is **portability** — whether what you hold is
shaped like your business or like their product.

### Adobe's current direction helps, and does not close three gaps

Adobe's move toward **AEM with edge delivery and server-side functions** is the right shape, and
by the argument elsewhere in this estate it is the same bargain we make: push processing off the
authoring runtime into constrained, isolated compute. Credit where it is due — that is a
structural improvement, not a feature.

It does not, by itself, answer three questions that are **needed now** rather than on a roadmap,
and no SaaS compliance posture answers them either, because they sit outside what that posture
is scoped to assert.

| Gap | What the standard SaaS answer covers | What it leaves open |
|---|---|---|
| **Cross-border** | A region setting, a DPA, an attestation | Where a *specific record* physically sits today, and which sub-processor moved it there. Jurisdiction follows **the subject**; a tenant region setting follows **the account** |
| **AI and agent access** | Human users, sessions, roles | *Who may an agent act for, within what bounds, until when.* Most permission models have no field for it, so an agent either gets a human's seat and a human's reach, or it gets nothing |
| **Boundary penetration testing** | The vendor's own perimeter, tested on the vendor's scope | Whether **your** boundary holds *through* their product — can a caller holding tenant A's token reach tenant B's asset via their API. That is your risk, and it is outside their test scope by definition |

The common thread: a vendor tests **their** system against **their** threat model. None of the
three above is a claim they are refusing to make — it is a claim that is not theirs to make. Each
one is answerable only where the entitlement lives, which is the argument this document has been
making from the first section.

### Solution

Reduce the number of systems that **hold** data, not the number that **use** it.

A vendor that reads through a permissions boundary and returns a result is a tool. A vendor that
holds a copy of your catalogue, your assets or your customers is a party. The first is
replaceable on a Tuesday; the second is a migration, a legal review and a disclosure risk.

Where a vendor must hold data, three things belong in the contract before the trial ends:
**named sub-processors**, an **erasure SLA in hours**, and the **required contractual terms in a
document you can produce without asking them for it.**

---

## 3 · The shape problem — challenge and solution

This is the one that surprises people, because every system involved is working correctly.

### Challenge

An agent answering a real question needs a complete, typed, resolvable record. What the estate
actually provides is four partial ones.

- **Shopify's JSON** describes commerce objects in Shopify's model. Complete for orders. Silent on who may see a price in a market, what a product's rights are, or what it is called in a partner's taxonomy.
- **GA4's JSON** describes events in GA4's model, already aggregated, already consent-filtered, with identifiers that deliberately do not join to a person.
- **A DAM's JSON** describes assets in its metadata model — and, as covered elsewhere, loses the embedded rights at the first transform.
- **A CRM's JSON** describes contacts in its model, with its own notion of consent and its own nullability rules.

Each is complete *for the question its vendor designed it to answer*. None carries **rights,
entitlement, provenance or cross-system relationships**, because no single vendor owns those.

So an agent has to join four shapes with four identifier schemes, four freshness guarantees and
four definitions of null — and every join is an inference. **An agent that infers a relationship
will state it with the same confidence as one it was given.** That is the actual governance
failure: not a wrong number, a *confident* wrong number, generated at machine speed, from data
that was individually correct.

GA4 sharpens it further. Consent-filtered, aggregated data is the right shape for reporting and
the wrong shape for a decision about an individual — and nothing in the JSON says which it is.

### Solution

A **system of record that owns the joins**, and a **descriptor that carries what the vendor
formats cannot.**

The vendor shapes stay exactly as they are. What changes is that the relationships between them —
this asset belongs to this product, which is sold in these markets, under these rights, to
subjects with this entitlement — live in one place that can be queried and versioned, rather than
being re-derived by whatever is asking.

The test is blunt: **can an agent answer "may this person see this thing" with a query, or does it
have to assemble the answer?** If it assembles, it will eventually assemble wrongly and say so
confidently.

---

## 4 · Why the timeline decides the moment

The pivot is not optional and the date is not yours. Inside a single window the estate is
already being forced to touch this code: REST declared legacy and GraphQL required, the Merchant
API v1beta retired, expiring tokens mandated, script tags refused and then stopped, Consent Mode
signals separated, checkout extensions moved to web components, and the CRA reporting clock
starting.

**You are paying the migration cost regardless.** The only decision left is what you get for it.

Rebuild the same shape and you have bought another three years of the same three problems, with
a newer API version. Rebuild around mandates, fewer data-holding parties and a system of record
that owns the joins, and the same spend produces an estate that an agent can be pointed at safely.

That is the pivot, and its timing is set by a calendar somebody else publishes.

---

## 5 · Opportunity, against the baseline risk

| | With mandates, fewer holders, one record | Baseline: plugins, seats, borders |
|---|---|---|
| **Adding a person or an agent** | Grant authority; no licence | Four seats, four vendors, four renewals |
| **Automating a task** | Costs compute | Costs a seat, or meters the automation |
| **A regulator asks where data went** | Produce the record | Ask four vendors, hope for the contracts |
| **A subject asks for erasure** | One routine, asserted per plane | Four tickets and four SLAs |
| **An agent answers a question** | A query against owned joins | An inference across four shapes, stated confidently |
| **A vendor is retired or repriced** | Replace a tool | Migrate a party |
| **Jurisdiction** | Follows the subject | Follows whichever server answered |

**The opportunity is not cheaper software.** It is that each row turns a coordination problem
into a query — and coordination problems are billed in people, which is the cost per seat was
supposed to be buying down.

**The baseline risk is not a breach either.** It is arriving at an agentic estate having kept a
plugin architecture: paying per seat for work no person does, holding data in four places you
cannot fully account for, and pointing a confident machine at four incomplete shapes and calling
the output governance.
