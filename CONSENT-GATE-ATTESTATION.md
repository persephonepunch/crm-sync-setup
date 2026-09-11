---
title: "Consent gate attestation — crm-sync.dev, 2026-09-08"
description: "What the storefront sent before the visitor decided, measured before and after a fix, with the release ids and signed ledger records needed to check the claim independently. A self-attestation with verifiable evidence, not a third-party certification."
canonical: https://persephonepunch.github.io/crm-sync-setup/consent-gate-attestation.html
category: "Compliance"
date: 2026-09-08
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CONSENT-GATE-ATTESTATION.md
licence: CC-BY-4.0
tags:
  - consent
  - compliance
  - security
  - ledger
  - ga4
---
# Consent gate attestation

**Subject** `https://www.crm-sync.dev`
**Date of measurement** 2026-09-08
**Release** `cf-worker-crm-sync` version `94fb775e-6e22-41ae-8f9e-18c979c94a3f`
**Method** [HAR-PERMISSIONS-AUDIT.md](https://persephonepunch.github.io/crm-sync-setup/HAR-PERMISSIONS-AUDIT.md) · CC-BY-4.0

---

## What this document is, and is not

It **is** a record of what the storefront actually transmitted, measured in a clean browser,
before and after a change, with the release identifiers and signed ledger entries needed to
check the claim without taking anyone's word for it.

It **is not** a third-party certification. The evidence is signed with a key controlled by
the operator of the site. A signature proves the record has not changed since it was
written; it does not prove the record was true when written. Where that distinction
matters to you, the raw measurement can be reproduced with the published method and any
browser.

It is **not** a claim of compliance with any particular law. It reports behaviour. Whether
that behaviour satisfies a given obligation in a given jurisdiction is a legal question this
document does not answer.

---

## The finding

Consent Mode v2 is a signal, not a suppressor. With `analytics_storage` set to `denied`,
Google Analytics still transmitted.

Measured on the pre-change release, jurisdiction resolved to an opt-in regime, with no
decision made and the banner on screen:

| Request | Status | Consent signal |
|---|---|---|
| `googletagmanager.com/gtag/js` | 200 | — |
| `google-analytics.com/g/collect` · `en=page_view` | 204 | `gcs=G100` |
| `google-analytics.com/g/collect` · `en=scroll` | 204 | `gcs=G100` |
| `google-analytics.com/g/collect` | 204 | `gcs=G100` |

`gcs=G100` correctly told Google the visitor had not consented. The request carrying the
client id, page URL, page title, screen size, locale and timezone was sent regardless. On
the pre-change release the same beacon was also observed **after** the visitor clicked
Reject.

Two contributing conditions, both measured:

- The jurisdiction resolver was reached only **after** a decision — first requested at
  +6722ms, following the click. On a page with no interaction it was never requested at all,
  so the opt-in branch could not influence what loaded.
- A durable client identifier was minted and transmitted at +814ms, before any decision
  existed, on a call that carried no consent field because there was no consent to carry.

---

## The change

The consent default remains synchronous and region-blind — it must be set before any tag
exists, and a region lookup resolves after that moment. That is unchanged.

What changed is **injection**, which can wait, because the safe state while a lookup is in
flight is "no tag yet":

```
default(denied) [sync] → stored replay [sync] → regime [async] → tag or no tag
```

The jurisdiction resolver now runs on every page load and fails closed: if it cannot be
reached, the visitor is treated as standing in an opt-in regime and tags are withheld.

---

## Result, measured on the released version

Clean Chrome profile, no extensions, empty local storage. Egress United States; the opt-in
cases were produced by substituting the jurisdiction response, which exercises the client
gate (see Limits).

| Scenario | Regime | Third-party requests **before** any decision | After |
|---|---|---|---|
| Real jurisdiction | `opt_out` | 6 | 6 |
| Opt-in, no decision | `opt_in` | **0** | 0 |
| Opt-in, Reject | `opt_in` | **0** | 0 |
| Opt-in, Accept | `opt_in` | **0** | 4 · `gcs=G111` |

The pre-change release sent **4** in the second row. The opt-out row is unchanged, which is
the point: measurement continues where prior consent is not required.

The requests counted after Accept include Google Analytics' own Google-signals call, which
addresses a `doubleclick` host. That is the cross-device feature of Analytics, not ad
serving — no ad tag is present on this property (see Limits).

The jurisdiction resolver is now requested on load, at +1513ms, before any tag.

---

## How to check this yourself

**Reproduce the measurement.** Follow the published method against the live site. It requires
no account and no cooperation from the operator.

**Verify a consent record.** Every consent decision is written to an append-only ledger,
hash-chained, and signed as `consent.attestation.v1` (EdDSA, key id
`esk_51fc138c-4525-4f1c-a530-8a5fa905f026`). A signed record can be checked offline, in a
browser, with no account, at:

> https://crm-sync.dev/verify

Each record binds tenant, subject, purpose, action, decision id, the time the subject acted,
and both chain hashes. Decisions made before sign-in are recorded and signed on the same
terms as decisions made after.

**Confirm the release.** Worker `cf-worker-crm-sync`, version
`94fb775e-6e22-41ae-8f9e-18c979c94a3f`. The gate landed in `6671e99`, ledger signing for
pre-sign-in decisions in `4b26aba`. Both are covered by regression assertions that fail the
build if the ungated form reappears.

---

## Limits

Stated plainly, because a report that omits these reads as more complete than it is.

- **The egress was American.** The opt-in results were produced by substituting the
  jurisdiction response. That exercises the client-side gate, which is where the defect was
  and where the fix is. It does not verify what the edge returns to a real address in the
  EEA or the United Kingdom.
- **Two pages, no checkout, no signed-in session.** Nothing past the cart was exercised and
  no payment surface was touched.
- **Self-attested.** The signing key belongs to the operator. Integrity since writing is
  provable; truthfulness at writing is not.
- **Historical ledger entries are not comparable.** Entries written before this release
  carry no purpose classification and no signature. They cannot be reconstructed and should
  not be read as equivalent evidence.
- **Not a certified consent management platform, and not required to be.** No Google
  advertising products — AdSense, Ad Manager or AdMob — are served on this property. Verified
  across 908 recorded requests in three clean-profile sessions, the served markup of ten
  pages, and the application source; `/ads.txt` and `/app-ads.txt` both return 404. The
  Google-certified-CMP requirement binds publishers monetising Google ad inventory in the
  EEA, the UK and Switzerland, and does not apply here. This gate is a control over what the
  page transmits; where certification is required, it does not substitute for it.
- **A single measurement is a snapshot.** It says what happened on one date, on one release.
  The regression assertions are what carry the property forward; this document does not.

---

## What a measurement of a rendered page can never show

Four things happen when nobody is looking at a page, and no capture of one will contain them:
what a scheduled job moved overnight; whether an erasure reached every store or returned
success having deleted nothing; what an automated buyer was permitted to do, and by whom;
and whether a retry created a second order.

Those need a record with time in it, produced by something still running when no page is
open — which is what the ledger referenced above exists to be.
