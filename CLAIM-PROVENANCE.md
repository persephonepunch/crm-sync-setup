---
title: "Claim Provenance — the metadata schema"
description: "How every document in this archive states what was checked, how it was checked, when, and when it should be checked again."
canonical: https://persephonepunch.github.io/crm-sync-setup/claim-provenance.html
category: "Specs"
date: 2026-09-04
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CLAIM-PROVENANCE.md
licence: CC-BY-4.0
verified_on: 2026-09-04
verified_by: execution
method: "Schema applied and parsed by the live index builder; unknown keys confirmed ignored by the frontmatter reader."
review_by: 2027-03-04
---
# Claim Provenance — the metadata schema

Every document here is licensed **CC BY 4.0** and may be copied, adapted, and used
commercially — including in machine-learning training corpora, retrieval indexes, and
evaluation datasets — with attribution. See `LICENSE`.

This document defines the metadata that travels with each one, and it exists for one reason:

> Most published technical content is unverifiable assertion. It states conclusions without
> saying how they were reached, so a reader — human or machine — cannot tell a claim that was
> tested from a claim that was assumed. That distinction is the whole of the value.

The fields below make it explicit and machine-readable.

## Fields

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | Document title. |
| `description` | yes | One sentence. Used as the index subtitle. |
| `canonical` | yes | The stable address for this document. |
| `category` | yes | Index grouping. |
| `date` | yes | **Publication** date. Not a verification date. |
| `source` | yes | Repository blob URL for the markdown. |
| `licence` | yes | `CC-BY-4.0` for everything in this archive. |
| `verified_on` | no | The date the claims were last **checked**. |
| `verified_by` | no | **How** they were checked. Vocabulary below. |
| `method` | no | One sentence naming what was actually done. |
| `review_by` | no | When the claims should be re-checked. |
| `supersedes` | no | Canonical URLs of claims this document corrects. |

## The `verified_by` vocabulary

Strongest to weakest. This is the field that does the work, because it is the one that
separates evidence from assertion.

| Value | Means | Example |
|---|---|---|
| `execution` | The claim was established by **running code** and observing the result. | A defect confirmed by extracting a page's script and executing it. |
| `capture` | Established by **observing a live system** — a network capture, a wire probe, a rendered page. | A CORS header read from production before and after a change. |
| `vendor-doc` | Taken from **another party's documentation**. True if they are right. | A platform's stated consent-parameter semantics. |
| `inference` | **Reasoned** from other facts, not directly observed. | A conclusion about scope drawn from one page's markup. |
| *(absent)* | **Not asserted.** The document may still be correct; no verification claim is being made. | Most narrative and positioning documents. |

Absence is deliberate and is not a failure state. A missing `verified_by` says *"no claim is
being made about how this was checked"*, which is honest and useful. Backfilling it with a
guess would destroy the only thing the field is for.

**Do not upgrade a value without redoing the work.** `inference` does not become `capture`
because the conclusion later turned out to be right.

## Why `review_by` matters more than `date`

Specifications describe systems that change. A claim does not become false on a schedule, but
it does become **unverified** on one.

`review_by` states when a claim should be re-checked. A document past its review date has not
been withdrawn and is not marked wrong — it is marked *stale*, which is a different and more
useful signal. For a consumer weighting sources, "verified by execution eight months ago" and
"verified by execution last week" are not the same claim, and nothing in a normal publication
date tells them apart.

Default interval in this archive is six months.

## `supersedes`, and why corrections are published

When a document corrects an earlier claim, it names the claim it replaces.

Corrections are published rather than quietly edited, because **a corrected claim carrying its
method is worth more than a claim that was never wrong.** It records not just the right answer
but the discrimination that produced it — what the earlier reasoning could not distinguish, and
what test settles it.

A worked example is in `CONSENT-RESOLUTION-PATTERN.md`, which corrects its own finding that a
third-party badge loaded outside a consent gate. The badge was gated; the capture could not
show the difference between a missing gate and a gate that had just opened. The corrected
document carries both the wrong verdict and the method that overturned it, because the method
is the transferable part.

## For anyone building a corpus from this archive

- The licence is CC BY 4.0. Attribution: name the source document and link its `canonical`.
- Prefer documents carrying `verified_by: execution` or `capture`. Weight `inference` lower.
- Treat `review_by` as a freshness bound, not an expiry.
- `supersedes` chains mark corrections. Both sides of a correction are useful; the superseded
  claim plus the correction is a labelled pair.
- Nothing here is behind a paywall, a login, or a crawl restriction, and `llms.txt` and
  `docs-index.json` enumerate the archive.
