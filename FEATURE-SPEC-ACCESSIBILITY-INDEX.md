---
title: "CRM Sync — Feature Specification"
description: "Document ID: CRM-FEAT-003 Version: 1.0 Date: 2026-07-06 Status: Published Classification: Public Parent: CRM-FUNC-SPEC-001"
canonical: https://persephonepunch.github.io/crm-sync-setup/feature-spec-accessibility-index.html
category: "Specs"
date: 2026-07-06
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/FEATURE-SPEC-ACCESSIBILITY-INDEX.md
---
# CRM Sync — Feature Specification

## Accessibility & Machine-Index Score — the measurable foundation of the accessibility offer

**Document ID:** CRM-FEAT-003
**Version:** 1.0
**Date:** 2026-07-06
**Status:** Published
**Classification:** Public
**Parent:** CRM-FUNC-SPEC-001

---

## 1. Executive Summary

The core offer of CRM Sync is **accessibility**: making connected commerce data
usable by every enterprise team **and** by AI agents, through one governed
gateway. Accessibility is only a credible promise if it is **measured**. This
feature specifies the **Accessibility & Machine-Index Score** — a repeatable,
automated quality gate that scores every published surface on two dimensions:

- **Accessibility Score (human reach)** — conformance of a surface to the
  automatable items of the [Webflow Accessibility Checklist](https://webflow.com/accessibility/checklist)
  (WCAG-aligned): language, structure, landmarks, alternative text, keyboard and
  form semantics, media captioning.
- **Machine-Index Score (agent reach)** — how readable a surface is to search
  and **answer engines**, per the automatable items of the
  [Webflow AEO Checklist](https://webflow.com/resources/aeo-checklist): crawlability,
  structured data, metadata, semantic sectioning, scannable formats, freshness
  and authorship signals.

These are two faces of one objective. A surface that a screen-reader user cannot
navigate and a surface that an LLM cannot parse are the **same failure** — data
that is present but not *accessible*. This feature makes that failure visible,
ranked, and fixable before publication.

---

## 2. Why this is foundational, not cosmetic

| Business claim | Without this feature | With this feature |
|---|---|---|
| "Your data is accessible to every enterprise team" | Asserted, unverified | Scored per surface, per release, against a public standard |
| "Your content is accessible to AI agents / answer engines" | Hope | A Machine-Index grade with a ranked gap list |
| "Governed, auditable delivery" | Data-plane only | Extends access-governance to the **presentation layer** |

The platform already governs **access to data** at the data plane (scoped,
revocable, PII-free by construction). This feature governs **accessibility of the
rendered surface** — the last mile where humans and agents actually consume the
data. It is the presentation-layer complement to the access-governance substrate:
the same discipline (measurable, repeatable, fail-toward-safe), applied to reach.

---

## 3. Functional Requirements

**FR-AXI-01 — Two-dimensional score.** Every evaluated surface receives an
**Accessibility Score** and a **Machine-Index Score**, each 0–100 with a letter
grade (A ≥90 · B ≥80 · C ≥70 · D ≥60 · F <60).

**FR-AXI-02 — Standards-anchored checks.** Scored checks are drawn only from the
**automatable** items of the two published checklists (§1). Each check records
its source criterion (WCAG or AEO reference) so a score is defensible and
auditable, not a black box.

**FR-AXI-03 — Weighted, severity-aware scoring.** Each check carries a severity
(critical / high / medium / low) that weights its contribution. A score is the
weighted proportion of applicable checks that pass — so a missing image
alternative (critical) moves the score more than a missing social-preview tag
(low).

**FR-AXI-04 — Scope awareness (page vs. fragment).** Whole-page requirements
(document title, canonical URL, structured data) are evaluated only on full
pages. Embeddable fragments are **not penalized** for lacking them; a fragment
therefore receives a meaningful Accessibility Score and a Machine-Index result of
*n/a*, because answer-engine indexing is a whole-page property.

**FR-AXI-05 — Ranked remediation.** Output includes a **Top Gaps** list ordered
by severity × prevalence across surfaces — a fix-first worklist, not an
undifferentiated dump.

**FR-AXI-06 — Honest boundary (manual-review carve-out).** Items that cannot be
decided from static markup — colour contrast, visible focus, target size, caption
*content* quality, answer accuracy in live AI engines, E-E-A-T truthfulness — are
**listed as manual review and never scored**. The score never overstates what
automation can prove.

**FR-AXI-07 — Continuous evaluation.** The score runs in continuous integration
on every change, and can also be run on demand against local files or against
**live URLs** (real rendered HTML). It emits a machine-readable report suitable
for dashboards and trend tracking.

**FR-AXI-08 — Promotable gate.** The score begins as a **non-gating baseline**
(reported, not enforced) and is promotable to a **required release gate** at
chosen thresholds (default: Accessibility ≥ 80, Machine-Index ≥ 70). This mirrors
the platform's forward-deploy posture: measure first, tighten to fail-closed as
the baseline is raised — never a hard stop dropped without warning.

---

## 4. Scoring Model (summary)

```
score(dimension) = Σ weight(passing applicable checks)
                   ─────────────────────────────────── × 100
                   Σ weight(applicable checks)

weight:  critical 3 · high 2 · medium 1 · low 0.5
grade:   A ≥90 · B ≥80 · C ≥70 · D ≥60 · F <60
n/a:     no applicable checks in that dimension (expected for fragments on Machine-Index)
```

An **overall** figure per dimension is the weight-aggregate across all evaluated
surfaces, so a portfolio can be tracked as a single number over time.

---

## 5. What each dimension checks (automatable set)

**Accessibility (human reach)** — document language; unique, descriptive title;
skip-to-content link; landmark regions; zoom not disabled; image alternative
text; decorative graphics hidden from assistive tech; no autofocus; no
autoplaying media; captions/subtitles on video; logical heading order; a single
top-level heading; no empty links; descriptive link text; table header cells;
labelled form fields.

**Machine-Index (agent / answer-engine reach)** — indexable (not blocked);
meta description; descriptive title; canonical URL; structured data (JSON-LD)
with a recognized type; FAQ content carrying FAQ structured data; social/preview
metadata; semantic sectioning; descriptive subheadings; scannable formats
(lists / tables / disclosure); internal linking; freshness (dated content);
author / authority attribution.

**Manual review (informational, unscored)** — colour and border/icon contrast;
visible focus states; minimum target size; caption/audio-description content
quality; harmful-motion review; plain-language review; live answer-engine
accuracy; BLUF summary quality; E-E-A-T verification; citation share in AI
answers.

---

## 6. Relationship to the platform

- **Access-governance parity.** The data plane governs *who may reach the data*;
  this feature governs *whether the delivered surface is reachable* — by people
  and by agents. Together they make "accessible, governed data" a testable claim
  end to end.
- **Forward-deploy alignment.** Non-destructive and additive: surfaces are scored
  as they are, gaps are surfaced as a worklist, and enforcement is tightened only
  as the baseline improves.
- **AEO substrate.** The Machine-Index dimension is the acceptance test for the
  semantic-structure work (semantic sectioning, structured data, scannable
  formats) that makes connected content answerable by AI engines — the machine
  half of accessibility.

---

## 7. Non-Goals

- Not a certification of legal WCAG conformance; it is an automated pre-flight
  that raises the floor and routes the remainder to manual review (FR-AXI-06).
- Not a live AI-answer-quality monitor; it measures **machine readability**, the
  precondition for good AI answers, not the answers themselves.
- Ships **no** customer data and requires **no** credentials to run against public
  surfaces — it reads only rendered markup.

---

*CRM Sync is a governed Shopify ⇄ Xano ⇄ Webflow gateway. This feature makes the
accessibility of every delivered surface measurable, ranked, and enforceable —
the foundation under the promise that connected data is genuinely accessible to
enterprise teams and to AI agents alike.*
