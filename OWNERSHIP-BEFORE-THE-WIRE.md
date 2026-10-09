---
title: "Ownership before the wire: a per-country rules ladder for AI, functions and forms"
description: "Most forms, ERPs and CRMs were designed before Rust made ownership checkable and before GDPR, PIPA and the AI Act made it law. They shape the record first and filter it later. This article sets out the alternative: rules owned per country, published as tested artifacts, and AI agents and functions that receive a data binding only when a mandate resolves."
canonical: https://persephonepunch.github.io/crm-sync-setup/book/ownership-before-the-wire/
category: "Compliance"
date: 2026-10-09
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/OWNERSHIP-BEFORE-THE-WIRE.md
licence: CC-BY-4.0
tags:
  - compliance
  - permissions
  - consent
  - architecture
  - ai
  - mandates
keywords:
  - per-country rules ladder
  - ownership
  - borrowing
  - Rust
  - declared reach
  - conditional binding
  - mandates
  - PIPA
  - GDPR
  - CCPA
  - CPRA
  - EU AI Act
  - Cyber Resilience Act
  - cross-border transfer
  - double opt-in
  - ERP
  - CRM
  - forms
  - Shopify Functions
  - Cloudflare Workers bindings
  - Deno permissions
  - Xano
about:
  - Permission enforcement before data moves
  - Cross-border data rules
  - AI agent permissions
alternativeHeadline: "Permission belongs before the data moves, not after it arrives"
---

# Ownership before the wire: a per-country rules ladder for AI, functions and forms

> **Permission belongs before the data moves, not after it arrives.** A system that shapes the
> record first and filters it afterwards has already sent the data somewhere by the time it
> decides whether it should have.

Most of the software a business runs on (its forms, its ERP, its CRM) was designed before two
things existed: a mainstream language that checks ownership before a program runs, and laws that
make ownership of personal data a legal duty that differs by country. Those systems added
compliance later, as layers. This article sets out the design that starts from the other end:
**rules owned per country, published as tested artifacts, and functions and AI agents that are
handed a binding to data only when a mandate resolves.**

## 1. Why now: the dates

| Year | Systems of record | Ownership and permission in software | Law |
|---|---|---|---|
| 1987–1993 | Oracle Financials (1987), SAP R/3 (1992), Siebel CRM (1993) | | |
| 1998–1999 | NetSuite (1998), Salesforce (1999) | | |
| 2005–2008 | Zoho CRM (2005); HubSpot, Shopify, JotForm, Wufoo (2006); Google Forms (2008) | | |
| 2011 | | | Korea's Personal Information Protection Act (PIPA) enacted |
| 2015 | | **Rust 1.0** | |
| 2016–2018 | | Cloudflare Workers announced (2017); Deno announced (2018) | **GDPR** adopted 2016, applies from May 2018; CCPA signed 2018 |
| 2020 | | | CCPA in force; Schrems II invalidates the EU–US Privacy Shield |
| 2023 | | | PIPA's major amendment in force (September); CPRA in force (January) |
| 2024 | | | EU AI Act in force (August), phased to 2027; Consent Mode v2 required in the EEA (March); Cyber Resilience Act in force (December) |
| 2027 | | | Cyber Resilience Act's main obligations apply (December); the AI Act's last phases |

The systems of record in the first rows are not frozen in time; every one of them has shipped
privacy features since. But their **core model** was set before the right-hand columns existed,
and a core model is the hardest thing to change.

## 2. Shaped before permitted

That core model shares one assumption: **the record is the unit, and permission is a filter
applied after it is read.**

- **Fetch, then filter.** The application server loads the whole row and field-level security
  hides columns on the way to the screen. The data has already left the database; only its
  display is restricted.
- **Export, then forget.** Integrations copy whole objects on a schedule. Each copy is a new
  holder of the data that no one is tracking, with its own retention and its own breach surface.
- **Forms collect into the tool.** A hosted form posts straight into the vendor's store. The
  consent wording, the country of the person and the purpose are, at best, extra fields on the
  row, not conditions on whether the row should exist.
- **Permission is a role.** Who may see a record is decided by the user's profile, not by whose
  data it is, where they live, what they agreed to, or until when.

Compliance add-ons (encryption at rest, data-residency options, consent fields) are real
improvements, and none of them changes the order of operations. They make it harder to misuse
data that has been read; they cannot make it impossible to read data that should not have been.

## 3. Ownership, borrowing, lifetimes

Rust's contribution is not memory safety as such. It is that **ownership is checked before the
program runs**, so whole classes of misuse are refused at build time rather than discovered in
production. The same rules translate almost word for word to personal data:

| Rust | Personal data |
|---|---|
| **Ownership.** Every value has exactly one owner | Every record has one authoritative home, in its subject's jurisdiction. A Korean customer's data lives in the Korean instance |
| **Move.** After a move, the original may not be used | A cross-border transfer is a move. It needs its own legal basis (PIPA's itemised consent, GDPR's transfer rules), and the record states where the data went |
| **Explicit `Clone`** | A copy is a new disclosure. It is never implicit, and it needs its own basis: sharing a customer's floor plan with a partner requires the customer's consent first |
| **Borrowing: `&T` or `&mut T`** | A function or agent gets a scoped loan, read-only or a single writer (compare-and-set), never a standing grant |
| **Lifetimes.** A borrow cannot outlive its owner | Access expires with the consent, the retention period or the mandate |
| **The borrow checker runs at compile time** | Rules are tested against the statute **at publish time**, before deployment |
| **`cfg(target)`.** One codebase, built per target | One rule set, built and tested per country |
| **`unsafe`.** Allowed, marked, reviewed | Break-glass access with a written reason and an audit entry |

The analogy has a limit worth stating: Rust proves its rules for every possible execution, and a
rules ladder can only test the cases someone wrote. That is why the tests in §4 cite the statute
they come from: a missing case is then a visible gap against a named provision, not a silent one.

## 4. The per-country ladder

Rules are organised as rungs. Each rung adds to the ones below it, and a request is allowed only
if every rung that applies to it allows it.

| Rung | Holds | Examples |
|---|---|---|
| 1. Base | What every market requires | Encryption, minimisation, logging, retention by default |
| 2. Region | Regional regimes | GDPR in the EU and EEA; US state privacy laws |
| 3. Country | National rules | Korea's cross-border consent; Germany's double opt-in; California's opt-out of sale and sharing |
| 4. Sector | Rules for the kind of business or product | Payments, health, children, electrical safety listings |
| 5. Mandate | This person, this purpose, this agent, until this date | A customer's consent to share rooms with one named partner, valid 90 days |

Each rule is an **artifact**, not a line buried in an endpoint. It is versioned, it says which
provision it implements, and it carries its own test cases:

```yaml
rule: cross-border-transfer
version: 2026-10-08
jurisdiction: KR
implements: "PIPA Art. 28-8 (transfer of personal information abroad)"
when:
  subject_country: KR
  storage_country: { not: KR }
require:
  consent: itemised-crossing     # recipient, country, items, purpose, retention
  consent_version: present
cases:
  - given: { subject_country: KR, storage_country: US, consent: none }
    expect: deny
  - given: { subject_country: KR, storage_country: US, consent: itemised-crossing, consent_version: "2026-10-08" }
    expect: allow
  - given: { subject_country: KR, storage_country: KR }
    expect: allow                # nothing crosses; no crossing consent needed
```

This is YAML in the Kubernetes sense (a declaration checked against a schema), not in the sense
of data that becomes behaviour when loaded.

**The publish gate.** A rule set ships to a country's runtime only when every case passes, the
same way a release ships only when its tests pass. Adversarial tests belong here too: generated
inputs that try to get a record stored without the consent its rung requires. The rule set that
answered yesterday's audit is the one tagged in version control, and it can be re-run.

**One rule set, many runtimes.** The ladder is published to each place that enforces it (the
endpoint that accepts a form, the worker in front of an AI agent, the function in a checkout),
so no path has its own private copy of the rules.

## 5. Conditional binding for AI and functions, with mandates

The top rung is where agents and functions meet the data. The principle is the one in §3:
**an agent is not given a permission it must remember to check; it is given a binding, or nothing.**

- **The binding is the permission.** A Cloudflare Worker reaches only the databases, buckets and
  services bound to it before it runs. A Deno program reaches only what it was granted at start.
  A Shopify Function receives only the input its query declares. In each case the boundary is
  set before execution, by something other than the code being bounded.
- **The binding is conditional.** For personal data, the binding is created per request, after
  the ladder resolves for that subject, that purpose and that country. An agent asking to read
  a Korean customer's order from outside Korea receives no binding at all unless the crossing rung
  allows it, and so has nothing to leak.
- **A mandate is the condition, written down.** Who authorised it, for what purpose, over which
  data, in which country, until when, and under which rule version. The mandate is stored; the
  binding is derived from it and expires with it.
- **Outbound reach is declared too.** Bindings limit what an agent can read; they do not by
  themselves limit where it can send. Network egress needs its own allow-list (in Workers,
  outbound controls; on premises, the firewall), or the agent can still send what it was lent.

## 6. Where ERPs, CRMs and forms go

None of this requires replacing the systems in §1. It changes their position.

1. **The owner** is the system of record in the subject's country, with the ladder in front of it.
2. **ERPs and CRMs are downstream.** They receive a projection released by the ladder for a stated
   purpose: minimised per country, with a lifetime, and logged as a disclosure. They work on
   borrowed data, not owned data.
3. **Forms collect into the ladder,** not into the form vendor. The form keeps its design, its
   validation and its success and error states; only its destination changes.
4. **AI agents and functions** receive conditional bindings per mandate (§5), never the CRM's whole
   object.

The tools people know stay where they are. They stop being the place where permission is decided,
because they were designed before permission was the law.

## 7. A worked example: Ondol Life

Ondol Life sells custom floor heating in Korea, with US partners and a demo stack in the US. Parts
of the ladder already run there; parts do not yet.

**Built.**

- **The newsletter form** is a Webflow form that posts to a Xano endpoint, not to Webflow Forms.
  The endpoint applies rung 3 before anything is stored: a Korean visitor's address is not stored
  outside Korea without the itemised crossing consent and its version, and visitors from the EU,
  EEA, UK and Switzerland are stored as pending until they confirm by email. Every attempt,
  refused ones included, is logged with the wording version shown.
- **Adversarial tests** for that endpoint generate hostile input and check that no sign-up is ever
  stored without the boxes its country requires.
- **Cross-sell between vendors** copies a customer's room measurements to a partner's project only
  after a recorded consent naming the partner: `Clone` made explicit.
- **Residency.** At launch the Korea team runs its own Cloudflare account and Xano in Seoul, so for
  Korean customers the crossing rung is not needed at all: nothing moves.

**Not built yet.**

- The rules are still written into each endpoint rather than published as one ladder that every
  path resolves against.
- The test cases do not yet cite the provisions they come from.
- Mandates exist for consent, but not yet as the source of per-request bindings for AI agents.

## 8. What this article does not claim

- It is not legal advice. The provisions named are examples of what a rung implements; which rules
  apply to a business is a question for its counsel, per country.
- Dates and article numbers were checked against public sources at the time of writing and laws
  change; the rule artifact's `implements` field exists so that a change in the law points at the
  rules it affects.
- The systems of record named in §1 are named for their founding dates, not for their current
  privacy features, several of which are good.

## Sources

- [Rust 1.0 announcement](https://blog.rust-lang.org/2015/05/15/Rust-1.0.html), 15 May 2015
- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [EU AI Act, Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)
- [Cyber Resilience Act, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/eli/reg/2024/2847/oj)
- [Personal Information Protection Act (Korea), English text](https://www.law.go.kr/LSW/eng/engLsSc.do?menuId=2&query=personal%20information%20protection%20act)
- [California Consumer Privacy Act](https://oag.ca.gov/privacy/ccpa)
- [Deno is joining Cloudflare](https://blog.cloudflare.com/deno-joins-cloudflare/), 9 October 2026
- Companion articles: [Why Xano + AI + e-commerce is the right runtime as a service](https://persephonepunch.github.io/crm-sync-setup/why-xano-runtime-as-a-service.html) (declared reach, §8), [From Plugins to Mandates](https://persephonepunch.github.io/crm-sync-setup/book/from-plugins-to-mandates/), [Permissions for AI, in plain terms](https://persephonepunch.github.io/crm-sync-setup/book/capability-not-perimeter/)
