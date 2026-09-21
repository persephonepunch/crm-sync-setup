---
title: "Served, stored, subpoenaed — sovereign edge serving for Korea"
description: "Data sovereignty is three questions, not one: where a page is served, where the record lives, and whose law can compel it. A working definition of sovereign edge serving, Korea's PIPA as the worked example — entrustment vs third-party provision vs cross-border transfer — what Webflow, Cloudflare and Naver each actually offer, and the crossing inventory that makes a regulator's suspension order survivable."
canonical: https://persephonepunch.github.io/crm-sync-setup/sovereign-edge-serving.html
category: "Global"
date: 2026-09-21
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SOVEREIGN-EDGE-SERVING.md
licence: CC-BY-4.0
tags:
  - consent
  - security
  - compliance
  - identity
  - architecture
keywords:
  - data sovereignty
  - data residency
  - sovereign edge serving
  - PIPA
  - PIPC
  - Korea data residency
  - cross-border transfer consent
  - 위탁
  - entrustment agreement
  - Cloudflare Data Localization Suite
  - Regional Services
  - Geo Key Manager
  - Customer Metadata Boundary
  - Naver Cloud
  - Webflow data residency
  - CLOUD Act
  - transfer suspension order
---

# Served, stored, subpoenaed

Most conversations about data sovereignty collapse three separate questions into one, and
then answer the easiest of them.

| The question | What answers it | What it does **not** answer |
|---|---|---|
| **Where is it served?** | CDN points of presence | Anything about where the data lives |
| **Where does it live?** | The origin, and the database behind it | Anything about who can compel its production |
| **Whose law can compel it?** | The corporate nationality of whoever holds it | Latency, and not residency either |

A Seoul point of presence in front of a US database is a Seoul-latency US data residency.
A US company's Korean datacentre is Korean residency under US jurisdiction. Neither is
wrong; both are routinely sold as "we support Korea," and they answer different questions
from the one a regulator will ask.

## A working definition

**Sovereign edge serving: the jurisdiction is decided at the edge, before any handler
runs, and personal data resolves in-region while everything else stays global.**

Four properties make it real rather than aspirational.

**1. Partition before dispatch.** The jurisdiction is a value the request *carries*, frozen
onto the record at the moment of capture — not re-derived later from a lookup. Re-deriving
judges a past grant under a law the subject was not standing in. It has to fail closed: an
unplaceable visitor gets the strict treatment, because showing a strict banner to somebody
who did not need it is a nuisance, and showing a permissive one to somebody who did is the
violation.

**2. The split is per-field, not per-request.** Catalogue, prices, CSS, images, model
weights are global. Identity, address, order history, phone are regional. A single page
load touches both, so "which region does this request belong to" is the wrong granularity —
the right one is "which of these fields may leave."

**3. A crossing is an event, not a side effect.** Every border crossing writes a row: which
fields, to which country, to which recipient, on what basis, under which consent record.
If you cannot enumerate your crossings, you do not have a partition; you have a hope.

**4. Suspension is implementable.** You can stop a given transfer without stopping the
store. This is the property that fails in almost every stack, and the reason is structural:
the transfer is not a component, it is a hundred implicit calls inside third-party tags. A
transfer you cannot name is a transfer you cannot switch off.

## Korea is not a localization regime

This is the most common error, and it sends people looking for the wrong solution.

Korea does not mandate general localization of commercial personal data. Its one genuine
export restriction is geospatial — the reason mapping products still behave oddly there.
For everything else, PIPA is a **consent-and-accountability** regime: the crossing is
lawful if it is disclosed, consented to in the right shape, and revocable.

What makes it architecturally demanding is the 2023 amendment, which gave the Personal
Information Protection Commission the power to **order a transfer suspended**. That is not
a fine after the fact. It is a live instruction to stop a specific flow while the business
keeps trading — and it is satisfiable only by property 4 above.

Two more Korea-specific rules that change data models rather than policies:

- **The resident registration number (주민등록번호) is prohibited** as an identifier unless
  a specific statute permits it. Not "sensitive" — prohibited. Do not design a schema with
  a column waiting for it.
- **Unique identification information** — passport, driver's licence, alien registration —
  requires separate consent *and* encryption at rest.

## The distinction that does the work

With a Korean controller and a Korean origin, the question stops being "how do we lawfully
export" and becomes "which category does each flow fall into." PIPA's three are
substantially different obligations, and conflating them is how teams end up asking for
consent they do not need while missing the consent they do.

| Category | What it is | What it requires |
|---|---|---|
| **위탁** — entrustment | A processor handling data on the controller's instructions, for the controller's purposes | Written contract, disclosure in the privacy policy, supervision of the entrustee. **No separate consent.** |
| **제3자 제공** — third-party provision | Another party using the data for **its own** purposes | Separate, itemised consent |
| **국외이전** — cross-border transfer | Data leaving Korea | Its own itemised consent, naming the recipient country, the recipient, their purpose and retention period, and the right to refuse — plus the PIPC's suspension power over it |

The leverage is in the first row. A worker that processes Korean personal data **as an
entrustee, inside Korea**, is entrustment: a contract and a disclosure, not a consent gate.
The expensive regime attaches only to data that genuinely leaves, or that genuinely passes
to someone for their own ends.

The 2023 amendment also added bases for cross-border transfer beyond consent, partly to
ease the cloud-outsourcing case. That is worth a Korean legal opinion rather than a
reading of the statute in English — the distinction between entrustment abroad and
provision abroad is exactly where a confident layman's summary goes wrong.

## What the vendors actually offer

Vendor marketing says "we support Korea." The three questions disambiguate it.

| | Served from Korea | Stored in Korea | Korean jurisdiction |
|---|---|---|---|
| **Webflow** | Yes — CDN PoPs cache static assets | **No** — origin is AWS in the United States | No |
| **Cloudflare** | Yes | Partly — see below | No (US parent, whatever the contracting entity) |
| **Naver Cloud** | Yes | Yes | **Yes** |

**Webflow** stores customer and end-user data in the United States and offers no regional
residency — not Korea, not even the EU, which has been an open request for years. It
covers transfers with the Data Privacy Framework and standard contractual clauses instead.
Seoul PoPs serve cached HTML, CSS and images, so the *site* is fast in Korea while the
*data* is not in Korea.

The concrete trap is **forms**. A Korean visitor submitting a Webflow form sends personal
data to US infrastructure — a cross-border transfer needing its own itemised consent
naming Webflow as recipient. Treat Webflow as a presentation layer and post forms to your
own worker instead. This is the general rule in specific clothing: the presentation layer
should hold no credential and receive no personal data.

**Cloudflare's** Data Localization Suite splits finer than a single yes or no:

- **Regional Services — South Korea supported.** TLS termination and HTTP processing
  pinned to Korean datacentres.
- **Geo Key Manager v2 — South Korea supported.** Private keys held only in Korea.
- **Customer Metadata Boundary — not supported for Korea.** Cloudflare's own logs and
  metadata leave the region regardless of the above.

Note what Regional Services governs: **processing, not storage**. Object storage residency
is a separate control, and R2's jurisdictional restriction covers the EU, not Korea;
D1 and Durable Objects offer location *hints*, which are placement preferences rather than
guarantees. Pinning processing to Korea does not pin the bucket.

**Naver Cloud** is a Korean company under Korean law, and carries CSAP for public-sector
work. It is the only one of the three that answers the third question.

## The crossing inventory

Once the origin is domestic, the cross-border surface is small enough to enumerate — which
is the point. Write it down, because this list *is* the compliance artefact:

- **Google Merchant, GA4, Ads, Vertex.** US-processed. Anything carrying a stable
  customer key or an email crosses. Aggregate reporting may not; a hashed audience does.
- **Cloudflare metadata.** Leaves regardless of Regional Services, because the Customer
  Metadata Boundary does not cover Korea.
- **Administrative reads.** A support tool, an admin dashboard, a BI query run from
  abroad. This is the one teams forget, and it is a transfer like any other.
- **Model inference.** A prompt containing personal data sent to a US endpoint is a
  transfer, whatever the vendor calls the feature.

Each of those should be a **named edge with a switch**, not an emergent property of a
vendor SDK. That is what makes a suspension order survivable.

## Where the partition is decided

The mechanism is a single resolver at the edge that returns the jurisdiction, its source,
and the regime it implies — consulted before any handler runs, and frozen onto whatever
record it governs. Three rules earn their keep:

1. **An explicit override beats geography**, so the gate is testable without a VPN.
2. **The country and its subdivision must come from the same authority.** Pairing a query
   country with an edge-derived subdivision invents a place that does not exist.
3. **Fail closed twice** — once for an unplaceable country, once for an unplaceable
   subdivision inside a country that splits.

That third rule needs a fourth guard that is easy to miss. ISO 3166-1 reserves `AA`,
`QM`–`QZ`, `XA`–`XZ` and `ZZ` as user-assigned, and edge geolocation returns its own
non-answers for unplaceable addresses and anonymising exits. Every one of those is
*well-formed* and meaningless, so a shape check passes them straight through to the
permissive side.

**And the same failure has a worse form: a real country that simply is not on the list.**
A subdivision case like Quebec announces itself, because catching it requires a map that
somebody has to build. A country case does not. `KR` is a perfectly valid code that
resolves cleanly, silently, to the wrong regime — for as long as nobody checks that Korea
is in the opt-in set. Guard the membership, not just the shape.

## What this does not buy

Four honest limits, because each one is routinely oversold.

**Contractual locality is not data locality.** Buying Cloudflare through a Korean entity
gets Korean contracting and KRW billing. It does not change where bytes are processed —
Regional Services does that, and it is a separate, paid control that has to be switched on.

**A vendor's local office does not discharge your obligations.** If you are a foreign
operator above the threshold, appointing a domestic representative is your duty; your
vendor having a Seoul office is irrelevant to it.

**No amount of regional configuration removes US jurisdiction from a US company.** If the
requirement is sovereignty *from US compulsory process* rather than sovereignty *from
latency*, that is a domestic-provider question — Naver, KT, NHN — and it is the one
question vendor region menus cannot answer.

**Controller or entrustee is a contract question, and it decides everything else.** As an
entrustee your exposure is a written 위탁 contract and staying inside the controller's
instructions. As a joint controller you inherit the full set. Settle it before the
architecture hardens around an assumption, and settle it with Korean counsel — nothing
above is legal advice, and the categories in the table are precisely where a translated
summary stops being reliable.

## The shape that follows

For a Korean deployment with domestic controllers:

- **Naver Cloud** holds the identity plane and the system of record. Korean company,
  Korean law, no foreign compulsory process.
- **Cloudflare** in front with Regional Services and Geo Key Manager pinned to Korea —
  a thin processing edge over a Korean stack, holding no personal data at rest.
- **Webflow** for presentation only. No forms, no credentials, no personal data.
- **Every remaining crossing** named, switched, and logged against a consent record.

The test is not whether an auditor accepts the diagram. It is whether, handed an order to
suspend one transfer tomorrow morning, you can do it before lunch and keep selling.

---

*Related: [Permissions for AI — capability, not perimeter](capability-not-perimeter.html) ·
[Consent, cookies and preferences](consent-cookies-preferences.html) ·
[Server-side or it didn't happen](server-side-or-it-didnt-happen.html)*
