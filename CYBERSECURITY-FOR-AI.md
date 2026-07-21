---
title: "Cybersecurity for AI — CISO · CTO · DPO"
description: "What the EU Cyber Resilience Act requires, what firmware and SBOMs are, why CISOs, CTOs, and DPOs are personally exposed when a system only looks like it works, the billion-dollar GDPR precedent behind the server-side migration, and two pathways to compliance: bundled-AI SaaS vs. AI-as-middleware."
canonical: https://persephonepunch.github.io/crm-sync-setup/cybersecurity-for-ai.html
category: "Security"
date: 2026-07-21
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CYBERSECURITY-FOR-AI.md
---
# Cybersecurity for AI

**Status:** Living reference · **Scope:** The threat model was a careful human; it is now an autonomous agent. What the CRA requires, what firmware and SBOMs are, and why the CISO, CTO, and DPO are the ones exposed when a system only *looks* like it works.

**Tags:** [#CRA](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) · [#Art-14 — 11 September 2026](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) · #firmware · #SBOM · #CISO · #CTO · #DPO

---

## What's at stake — and why now

"This isn't how we did it last year" is exactly right. The playbook changed under everyone's feet, on three fronts at once:

- **Consent Mode v2 became mandatory (March 2024).** Without it, Google stops collecting EEA advertising data — so the ad stack quietly degrades *and* you are non-compliant. Last year's client-side pixels no longer clear the bar.
- **The CRA clock started.** Firmware and device obligations are dated law now — 11 September 2026 reporting, 11 December 2027 full — not a future worry.
- **Third-party cookies and browser tracking-prevention broke client-side.** The industry has spent roughly **three years migrating to server-side, first-party, consent-gated data**. The model you shipped last year — pixels and cookies-on-load — is now failing technically *and* drawing fines.

The server-side migration was not a fashion. It was **forced** — by the regulators and by the browsers.

## The billion-dollar precedent

These are the fines that forced it. All public record.

| Company | Fine | For |
| --- | --- | --- |
| **Meta** | €1.2B (2023, Irish DPC) | unlawful EU–US data transfers — the largest GDPR fine to date |
| **Amazon** | €746M (2021, Luxembourg CNPD) | advertising cookies / consent handling |
| **Google** | €150M (CNIL) | making cookie refusal harder than acceptance |
| **Shein** | €150M (2025, CNIL) | cookies dropped without valid consent |
| **Netflix** | €4.75M (2024, Dutch DPA) | opaque data-use disclosures |

The pattern in every case: **cookies and tracking deployed without a valid, recorded consent** — exactly the gap that Consent Mode v2 and server-side, consent-gated collection were built to close. That is the billion-dollar reason behind the three-year server-side migration.

## What the CRA is

The **EU Cyber Resilience Act** (Regulation (EU) 2024/2847) sets baseline cybersecurity obligations for **products with digital elements** sold in the EU — including connected devices and their firmware. It is enforceable law, with a clock and a fine schedule.

- **11 Sep 2026 — reporting begins.** Actively exploited vulnerabilities: a 24-hour early warning, a 72-hour notification, a 14-day final report.
- **11 Dec 2027 — full obligations.** Technical documentation, secure updates, conformity assessment, CE marking, and an SBOM.
- **Penalties** up to **€15M or 2.5% of global turnover** for the essential requirements — plus market withdrawal, recall, or a sales ban.

It stacks with **GDPR** (consent / personal data — up to 4% of global turnover) and the **Omnibus** price-transparency rules (up to 4% of EU-market turnover). Three regimes, one product.

## What firmware is — and why it's in scope

Firmware is the software that runs *on the device itself*, often distributed as a **self-extracting EXE** carrying embedded endpoints, credentials, and unlock logic. For a connected product the CRA's obligations attach to the **firmware image**, not just the companion app.

In the modern "dark factory," firmware fetches and version promotions run **machine-to-machine, without human oversight**. An **unverifiable firmware download** is then both a live security hole and a compliance gap: if the image can't be verified and its distribution can't be evidenced, you cannot meet the CRA's secure-update and traceability requirements.

## What an SBOM is

A **Software Bill of Materials** is a machine-readable inventory of every component inside a product — **CycloneDX** or **SPDX**. The CRA requires you to produce one, keep it current, and handle vulnerabilities in those components across the support period.

Its job: when a component CVE lands, the SBOM answers **"which shipped images contain it, and who has them"** — the factual basis of the 24 / 72 / 14 clocks. It is generated in the build (Yocto `create-spdx`, Zephyr `west spdx`) or by binary analysis (EMBA, cve-bin-tool), and scanned against CVEs on a schedule.

## Why the CISO, CTO & DPO are the ones at risk

A system can **look like it works** — products sell, firmware downloads, analytics fire — while underneath there is no consent record, no SBOM bound to the image, no firmware provenance, and no tamper-evident log. When that surfaces, the exposure doesn't land on the interface. It lands on the people **accountable** for it.

- **CISO — Security.** Owns the security posture. With **no tamper-evident ledger and no firmware evidence chain**, there is nothing to answer an incident — or a regulator — with. "It was fine when we shipped it" is not evidence.
- **CTO — Technology & Architecture.** Owns the build-vs-buy decision. Choosing a platform because **"it has AI" — without solving the immediate obligation** — is a decision the CTO signs. The stack either produces the compliance evidence or defers it; that call, and its consequence, is theirs.
- **DPO — Data Protection.** Owns lawful data handling. With **Consent Mode absent and no auditable consent record**, there is nothing to prove lawful basis under GDPR — the single most-fined failure in the EU.

These roles carry **personal and professional** consequence when the obligations aren't met. In front of an authority, *"it looked like it worked"* is not a defense — the missing evidence trail *is* the finding. The fix is not another dashboard; it is a system that **produces the evidence as a by-product of normal operation.**

## Two pathways to compliance — SaaS vs. AI middleware

Two ways to get from "a file at a URL" to a defensible position. They differ less in cost than in **what they actually produce.**

**Buy a SaaS platform.** Adopt a large enterprise suite — CRM, commerce, a data lake. Broad, and now advertising **built-in AI**. But compliance is not a native output: consent records, an SBOM registry, firmware provenance, and a CRA evidence ledger are integrated, configured, and built *on top*, across a procurement cycle measured in quarters. "It has AI" is a platform feature — **not a remediation for the obligation in front of you.**

**Insert AI as middleware.** A purpose-built middleware layer sits between commerce, identity, and the data plane and **emits the compliance artifacts directly**: consent-mode records, the SBOM registry, signed provenance, grant-gated firmware, and the tamper-evident ledger. It deploys onto rails already in place, no procurement, and produces CRA evidence as a **by-product of normal operation.**

| | Enterprise SaaS suite | AI middleware layer |
| --- | --- | --- |
| **CRA evidence** | built on top, later | emitted natively |
| **Time to compliance** | quarters — procure + integrate | weeks — deploy |
| **Role of AI** | a bundled feature | the mechanism |
| **Immediate need** | deferred | solved now |
| **CISO / CTO / DPO** | exposure deferred, not closed | evidence in hand |

```
SaaS pathway:       procure → integrate → build compliance layer → audit → certify
Middleware pathway: deploy → compliance artifacts emitted → verify against public keys
```

Against a CRA deadline, only the second solves the immediate need. One treats AI as a **checkbox on a platform you buy**; the other treats AI as the **middleware that produces the compliance evidence itself.**

## What "done right" looks like

Firmware becomes a **grant, not a link**: vaulted under per-image encryption, certified (Ed25519), granted per subject, written to a hash-chained ledger. The SBOM lives in a registry, versioned per image and scanned in place. Consent is recorded to a standard, auditable log. Provenance is public and verifiable against `/.well-known/jwks.json` — no account, and no trust in the platform required.

> Most "secure delivery" is a promise about infrastructure. Compliance-grade delivery is a property of the data path — encrypted before storage, keys wrapped and versioned, access granted per subject not per link, consent and every access sealed into a ledger whose rows can't be quietly edited, only visibly broken. That is what a CISO, a CTO, and a DPO can actually stand behind.

## Reference surfaces — running today

- **[Protected Firmware Service](https://www.crm-sync.dev/pages/firmware)** — the encrypted vault, grant-gated download, Ed25519 provenance, and hash-chained ledger.
- **[PIM Sync](https://pim-sync.pages.dev)** — the **Omnibus 30-day price-history data requirement** (show the lowest prior price with every discount), with verified BA logging and management tools on the shared data rails.
- **[Compliance QA & SBOM Registry](https://compliance.crm-sync.dev)** — the CRA checklist and a machine-readable SBOM registry (CycloneDX / SPDX).
- **[The System, Explained](https://www.crm-sync.dev/pages/explained)** — the whole plane feature by feature.

*Practical guidance, not legal advice — confirm your CRA / GDPR position with counsel. EU penalty references: GDPR Enforcement Tracker (enforcementtracker.com) · CRA — Regulation (EU) 2024/2847 · Omnibus — Directive (EU) 2019/2161.*
