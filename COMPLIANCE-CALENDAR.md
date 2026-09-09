---
title: "The Compliance Calendar — 2018 to 2027"
description: "Every dated obligation shaping commerce data, from GDPR and Wayfair to the Content API sunset, the CRA, and GS1 Sunrise 2027 — all public record, including the two Shopify pixel changes that took effect without asking anything of the merchant. Plus what the calendar obliges of builders: signed non-destructive releases, self-improving test loops that keep their own verdicts, and an adoption path for security that does not wait six months for procurement."
canonical: https://persephonepunch.github.io/crm-sync-setup/compliance-calendar.html
category: "Global"
date: 2026-08-07
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/COMPLIANCE-CALENDAR.md
licence: CC-BY-4.0
---
# The compliance calendar — 2018 to 2027

**For:** business and design stakeholders, agencies and consultancies, and the security and privacy reviewers they answer to.

Every entry below is public record — a statute, a published ruling or enforcement action, or a platform's own dated announcement. Nothing here is inside information, and nothing here is a prediction. The pattern only becomes visible when the dates are read together: for eight years, law and platform have been pushing commerce toward the same shape — **a typed, server-resolved data plane where consent, price history, and provenance are records rather than settings.**

## Code split and verification — challenge, solution, benefit

**Challenge.** None of the dates below is a reading assignment. Each one changes behaviour on a day, and every record written after that day was written under different rules than the records before it. When Merchant API v1beta retires, when the Content API stops accepting feeds, when a field deprecated in one release is removed in the next — the code changes, and the data keeps its old shape alongside the new. Months later somebody asks the only question that matters: *was this entitlement granted before or after the migration, and under which behaviour?* A single monolithic deploy answers with a timestamp and a shrug. Reconstructing the rest is archaeology, and it starts exactly when a regulator, an acquirer or a customer is waiting.

**Solution.** Two mechanisms, and neither is sufficient alone.

*Code split* — three independently deployable units: the Webflow extension, the Cloudflare Worker, and the public spec repository. A deadline that touches one does not force a release of the others, so the blast radius of a compliance change is the unit that actually changed, and a pre-deploy guard validates the extension before it ships. Fewer things move per deadline, and the things that moved are named.

*Release identity* — the worker binds its own version, so it can see which release is serving the request. Without that binding the version id exists only in a dashboard, and nothing the worker writes can carry it. With it, every entitlement change is stamped with the release that produced it, alongside the state version, the actor, the actor type, and the mandate the change was made under.

**Benefit.** *Which release wrote this record, under what configuration* stops being an investigation and becomes a lookup. That is the difference between an audit trail and a Day-2 index — one tells you something happened, the other tells you under which rules.

It works because an entitlement here is not a flag holding a current value. It is a **history**: an ordered change bus where every row names the subject, the change, the state version, the actor, the actor type — admin, agent, user or system — and the mandate it was granted under. So the question a regulator or a customer actually asks is answerable by replaying to the point in question: *what was this person entitled to on the day it mattered, and who granted it?* The answer is reproducible, and it is the same every time anyone checks.

Two entries below make that concrete rather than theoretical. Feed labels do not carry over automatically when the Content API shuts down, so the record of what was published under which release is the only way to reconstruct what a feed actually contained. And fields deprecated in the 2026-10 release are removed in 2027-01 — a nine-month overlap, every release, during which both shapes are live and only the release stamp distinguishes them.

## The calendar

| Date | Authority | What changed |
|---|---|---|
| 2018-05-25 | EU | **GDPR applies.** Consent becomes something the controller must be able to *demonstrate* (Art. 7), not merely collect. |
| 2018-06-21 | US | ***South Dakota v. Wayfair*, 585 U.S. 162.** Economic nexus: tax obligations attach per border, at the moment of sale. Batch reconciliation stops being sufficient. |
| 2019-01 | EU (CNIL) | **€50M fine against Google** — consent that is not specific, informed, and unambiguous is not consent. |
| 2019-11-27 | EU | **Omnibus Directive (EU) 2019/2161 adopted** — prior-lowest-price evidence written into consumer law. |
| 2021-12 | EU (CNIL) | **€150M fine against Google** over cookie refusal flows — the *refusal* path is regulated, not just the acceptance path. |
| 2022-05-28 | EU | **Omnibus applies** in member states. A markdown claim now needs a 30-day price history behind it. |
| 2022-10 | EU | **Digital Services Act (EU) 2022/2065** enters force; Art. 25 addresses interface dark patterns. |
| 2023 | Global | **Netflix paid-sharing rollout** — the first mass entitlement retrofit, built for revenue recovery rather than for the subject. |
| 2024-03 | Google | **Consent Mode v2 becomes mandatory** for EEA/UK ads measurement and audiences. |
| 2024-06 | US | **Federal action filed against Adobe** over subscription cancellation and early-termination-fee practices. |
| 2024-08-01 | EU | **AI Act enters into force**, with obligations phasing in by class. |
| 2024-10-01 | Shopify | **REST Admin API declared legacy.** The GraphQL-first turn begins. |
| 2025-03-07 | US (CPPA) | **American Honda fined $632,500** — the CPPA's first settlement. The consent tool was deployed but configured asymmetrically: one click to accept all, two steps to reject. The rights webform demanded eight data elements for every request type, including those needing no verification. |
| 2025-04 | Shopify | **New apps must use the GraphQL Admin API** — typed, bulk, server-resolved becomes the only forward path. |
| 2025-05-06 | US (CPPA) | **Todd Snyder fined $345,178.** For forty days the "Cookie Preferences Center" banner appeared and immediately vanished, so no opt-out could be submitted. The CPPA's enforcement head: *"Using a consent management platform doesn't get you off the hook for compliance."* A broken consent path is an enforcement event, not a bug report. |
| 2025-07 | FR (DGCCRF) | **SHEIN fined €40M for fake discounts** — prices raised ahead of campaigns and prior reductions ignored; 57% of items checked carried no real discount. The Omnibus price-history obligation, enforced. |
| 2025-09-01 | FR (CNIL) | **SHEIN fined €150M over cookies.** Advertising cookies were written on arrival, *before* the visitor interacted with the banner at all — and both cookie interfaces were incomplete. The gate ran after the event it was meant to gate. |
| 2025-12-09 | Google | **Data Manager API launches** — one ingestion point for first-party data across Ads, Analytics, and DV360. |
| 2025-12-10 | Shopify | **Web pixel payloads redact customer PII** — email, phone, name, and address return null for apps without approved protected-customer-data access. |
| 2026-01-13 | Shopify | **Marketing app pixels default to "Optimized"** — the platform may pause some or all of a pixel's data sharing when it judges the signal is not useful. |
| 2026-02-28 | Google | **Merchant API v1beta retired.** Integrations must be on v1. |
| 2026-04 | Google | Enhanced conversions for web and leads **unified into a single toggle**, accepting tag, Data Manager, and API sources together. |
| **2026-06-15** | Google | **Google Signals retired as a control.** Consent Mode `ad_storage` becomes the *sole* control over what GA4 sends to Google Ads. |
| **2026-06-30** | Shopify | **Script Editor removed.** Surviving payment, shipping, and discount Scripts stop — silently. |
| **2026-08-02** | EU | **AI Act Article 50 transparency obligations apply.** |
| **2026-08-18** | Google | **Content API for Shopping shuts down.** Product feeds ride the Merchant API only — regions, ISO time, `amountMicros`. Feed labels do not carry over automatically. |
| 2026-09 | EU | **Cyber Resilience Act vulnerability-reporting obligations begin.** |
| **2026-10** | Shopify | **Customer Account API removes `Customer.lastIncompleteCheckout`** and the Checkout Classic types. |
| **2026 H2 — date not yet announced** | Google | **Second consolidation wave.** Ads personalization moves out of GA4 into Google Ads under `ad_personalization`; tag-collected IP addresses are encrypted and flow to the linked Ads account rather than staying in Analytics. |
| **2026 H2 — date not yet announced** | Shopify | **Final sunset date for legacy customer accounts** to be announced. The deprecation is already in force: no new features, no support, unavailable to new stores. |
| 2027-01 | Shopify | Fields deprecated in the 2026-10 release are **removed**. The overlap is roughly nine months, every release. |
| 2027-02 | EU | **Battery Digital Product Passport** — the first product class where passport data is mandatory at the border. |
| 2027 | GS1 | **Sunrise 2027** — retail point-of-sale expected to scan 2D barcodes (GS1 Digital Link). |
| 2027-12 | EU | **Cyber Resilience Act applies in full.** |

Several of these are already behind us, and those are the ones most estates have not absorbed: the consent signal is *already* the ads data control, any un-migrated Script has *already* stopped, third-party pixels *already* receive less than they used to and can *already* be paused by the platform — and the feed deadline is weeks away, not quarters. Two entries carry no date at all yet, which is its own kind of planning problem: an obligation you can see coming but cannot schedule around.

## The tool was bought. The gate never ran.

Four of the entries above are the same finding wearing four coats, and none of them is a case of a company having no consent tool. Every one had bought a consent management platform. Honda ran a mainstream commercial CMP. Todd Snyder ran a third-party privacy portal. SHEIN ran two cookie interfaces at once. The tool was purchased, deployed, and visible on the page — and in every case it was not wired to the thing it was supposed to control.

The regulator said so directly. Announcing the Todd Snyder order, the head of the CPPA's Enforcement Division put it in one line: *"Using a consent management platform doesn't get you off the hook for compliance"* — the buck stops with the business, not the vendor.

**A CMP renders. A gate runs.** That distinction is the whole of it, and the four findings sort cleanly along it:

| Failure | What was actually wrong | Class |
|---|---|---|
| Honda — asymmetric banner | The gate ran, in the wrong shape: one click to accept, two steps to reject | Configuration |
| Honda — eight-field rights form | Verification demanded where none was permitted | Configuration |
| Todd Snyder — vanishing banner | The UI rendered; the gate was never reachable | Wiring |
| SHEIN — cookies on arrival | The gate ran *after* the event it existed to gate | **Ordering** |

The last row is the one worth dwelling on, because it is not fixable by configuring the banner better. Advertising cookies were written the moment a visitor arrived, before any interaction with the interface. No setting on that interface could have helped: the tag had already fired. **The dependency is the timeline, not the widget.** A gate that evaluates after the event has been emitted is decoration, however correct its copy.

### Why one CMP configuration cannot serve two regimes

There is a second trap underneath, and it is structural rather than careless. The US and EU consent models have opposite defaults:

- **US (CCPA/CPPA)** is an **opt-out** shape. Collection is lawful until the subject objects, so the tooling's job is to make objecting easy and to honour it. That is why Honda's asymmetry was the violation — the objection path was harder than the acceptance path.
- **EU (ePrivacy/GDPR)** is an **opt-in** shape. Non-essential cookies are unlawful *until* consent exists, so the tooling's job is to prevent the tag from firing at all. That is why SHEIN's timing was the violation — consent had not yet been given when the cookies were written.

A CMP bought and configured for the US shape does the right thing in the US and the wrong thing in the EU, because "collect until told to stop" is precisely what the EU prohibits. One tool, one configuration, deployed across both, guarantees that one of the two regimes is being broken continuously — and the broken one produces no error, no alert, and no visible symptom. It looks exactly like working software.

The pressure lands hardest on the purchase path, because that is where the tags are densest and where the money is attached. Add-to-cart, checkout, purchase and the conversion ping each carry identifiers to ad platforms, and each one is an event with a consent dependency that has to be resolved *before* it is emitted, per subject, in that subject's jurisdiction. Jurisdiction follows the **subject**, not the store: a French visitor to a US storefront is owed the opt-in shape, and no amount of correct US configuration supplies it.

That is the argument for resolving consent server-side, in the function that mints the event, rather than in a banner that renders beside it. A banner can only ask. A function can refuse — and can record that it refused, with the rule that fired, which is the artefact every one of the four investigations above was actually looking for.

## What replaced Google Signals — and why it moves work onto you

The June 15 change is usually read as one toggle being retired. It is bigger than
that: **two different things were replaced, the control and the data model.**

**The control moved to consent.** Google Signals stopped being a co-controller of
what Analytics sends to Google Ads; the Consent Mode `ad_storage` parameter now
decides alone. Signals still exists, demoted to a reporting toggle inside
Analytics — whether Analytics data is associated with signed-in user information
for behavioural reports. It governs a *view*, no longer a *flow*.

**The data model moved from Google's identity graph to yours.** Signals was
Google's own cross-device graph, assembled from signed-in Google users and
borrowed by advertisers. What replaced it is first-party data, hashed and matched:
Enhanced Conversions, Customer Match, and the **Data Manager API** — launched
9 December 2025 as a single ingestion point for first-party data across Google Ads,
Analytics, and Display & Video 360 — with enhanced conversions for web and leads
unified into one toggle in April 2026.

Read as a sequence, the intent is unmistakable:

> Consent Mode v2 (2023–24) → Enhanced Conversions (2024) → Data Manager
> (December 2025) → Signals demoted (15 June 2026).

Google spent three years replacing *its* identity graph with *your* first-party
data, gated by consent. Targeting was not removed; **the burden of identity was
moved onto the merchant.**

The consequence is uneven, and it is the reason this calendar is a strategy
document rather than a compliance one. An organisation holding a real consent
record and a genuine first-party identity spine now gets *sharper* measurement
than it had under Signals — its own data, matched, with lineage. An organisation
holding a banner and no record gets shrinking remarketing lists, modelled
conversions, and no way to explain either. Same date, same platform change,
opposite outcomes — decided entirely by whether the records existed beforehand.

*The live version of this calendar — the same rows plus a machine-readable JSON block — is at [crm-sync.dev/pages/difference#calendar](https://www.crm-sync.dev/pages/difference#calendar).*

## When the platform changes the pipe and nobody tells the record

Two Shopify entries above are unusual, because they are the only changes in this
calendar that took effect **without requiring anything of the merchant** — and
without leaving a mark on the merchant's side.

On 10 December 2025, web pixel payloads began returning null for email, phone,
name, and address to any app without approved protected-customer-data access.
Five weeks later, on 13 January 2026, marketing app pixels moved to an
"Optimized" default, under which the platform monitors pixels and may pause some
or all of a pixel's data sharing when it judges the signal is not useful.

Read those together and the implication is uncomfortable in a specific way.
**What a merchant's own records say was sent, and what was actually sent, can now
diverge with no event on the merchant's side.** No error, no notification, no row.
The tool still renders. The dashboard still populates, thinner. This is the same
failure shape as an opt-out that silently fails to take effect — a path that
stops working while every interface reports health — except the cause is a
platform default rather than a misconfiguration, so no amount of care on the
merchant's part would have surfaced it.

The mitigation is not to argue with the platform's judgement, which is often
correct. It is to hold a record on your own side that can be *compared* to the
platform's behaviour: what you believe you sent, to which destination, for which
subject, under which consent posture. A divergence you can see is an operational
finding. A divergence you cannot see is what a discovery request finds for you.

## What the calendar actually asks for

Read together, the dates ask for four artifacts, not four projects:

1. **A consent record** — timestamp, method, version — held by the company, not by the visitor's browser.
2. **A price history** — enough observation to prove any "was" claim, or the discipline to refuse the claim.
3. **A provenance record** — what shipped, in which version, containing what (the SBOM and passport thread).
4. **A dated dependency register** — every API and plugin, with its published sunset status and the date it was checked.

Each is a record. None is a certificate. All four answer the same way: a query, at the moment the question arrives.

## The builder's obligation

Most of this calendar lands on the person who *builds*, and the professional standard has moved with it.

### A deprecation notice is a dated public warning

After the date, "we didn't know" is not a defense — it's a finding. Every sunset in the table above was announced publicly, months or years ahead, by the platform itself. An agency, consultancy, or internal team that ships onto a deprecated component is shipping against a published warning, and the vendor's own sunset page becomes the exhibit.

The discipline is small: a dated dependency register, and a written notice to the client or stakeholder when something on it moves. Which produces the other half of the rule — **you can't be liable for a risk you documented; you are certainly liable for one you never raised.** A declined remediation, recorded, is a closed risk. An unraised one is an open liability with your name on it.

### Signed, non-destructive release management

If a release can silently overwrite what came before, no downstream record can be trusted — because nobody can prove which version produced it. The standard worth holding, end to end:

- **Additive, not destructive.** Promotion adds a version; it never overwrites the prior one. Rollback is selecting an earlier version, not reconstructing it.
- **Signed at the boundary.** Each release carries a signature and a content hash, so "what shipped on the day in question" is verifiable by someone who wasn't there — including a party who does not trust the publisher.
- **Separation of duties.** Whoever reviews does not promote. This is ordinary segregation-of-duties practice, and it is what makes a release record evidence rather than assertion.
- **Every release leaves a row.** Who promoted, from which version, at what time, against which review.

### Self-improving test loops owe their own verdicts

AI-assisted testing changes what "we tested it" means. A loop that writes and revises its own tests is powerful and entirely legitimate — *provided it keeps a record of what it asserted, when, and what changed.* Otherwise "tested" is a claim about a system that no longer exists.

The obligation, stated plainly: **a self-improving loop must be non-destructive and must keep its verdicts.** Each run appends — the assertion, the version it ran against, the outcome, and the rubric used. A later run may supersede an earlier verdict; it may not erase it. That single property is what separates a test suite from a story about a test suite, and it is what lets an AI-driven pipeline be shown to a reviewer at all.

### Assessment that doesn't wait six months

The hardest structural problem in this calendar is not technical. It is that the deadlines move in weeks and enterprise procurement moves in quarters. An organization can know exactly what it needs and still be unable to adopt it in time, because every tool — regardless of what it does — enters the same queue.

That queue exists for a good reason: most tools take custody of data, add a processor, widen the attack surface, or create a dependency that is painful to remove. Those genuinely deserve months of review. But the calculus is different for a control that:

- **takes no custody** — the record stays in systems the organization already owns;
- **is additive** — it installs beside the existing stack, and removal is a deletion rather than a teardown;
- **adds no new party to the data path** — no new processor, no new destination;
- **is reviewable by the people who own the risk** — the SME, the privacy or security stakeholder, the operator — because what it does is legible in an afternoon.

For that class, the right review is a short, expert one by the stakeholders accountable for the outcome, not a full vendor-onboarding cycle. Assessment should be proportional to what a tool can *do*, not uniform by category.

And the asymmetry underneath it is the part worth saying out loud: **nobody has ever been penalized for introducing security.** No regulator has fined an organization for logging consent, for keeping a price history, for signing a release, or for being able to produce evidence. Every penalty in the calendar above landed on an *absence* — a missing record, a broken path, an unprovable claim. Which inverts the usual risk framing: waiting is the only option with a downside. Adopting the record early costs a review; adopting it late costs the fine, the remediation, and the explanation.

## The one-page version

- The dates are public. The pattern is one direction: **records, not settings.**
- Four artifacts satisfy nearly all of it: consent record, price history, provenance record, dependency register.
- Builders owe a dated register, a written warning, signed non-destructive releases, and test loops that keep their verdicts.
- Security controls that take no custody and can be removed cleanly deserve a proportional review — days, by the people accountable — not a six-month queue.
- **Introducing evidence has never carried a penalty. Failing to have it always has.**
