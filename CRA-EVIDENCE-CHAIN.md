---
title: "Your Firmware Is a URL — the CRA Assumes an Evidence Chain"
description: "The two CRA dates as a records problem, what an SBOM is and isn't, what firmware vaulting replaces — and the SaaS answer: ledger sessions, not artifacts. Includes the relay-vs-entitlement model contrast."
canonical: https://persephonepunch.github.io/crm-sync-setup/cra-evidence-chain.html
category: "Security"
date: 2026-07-29
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CRA-EVIDENCE-CHAIN.md
---
# Your Firmware Is a URL — the CRA Assumes an Evidence Chain

*Reporting obligations begin 11 September 2026. What an SBOM actually is, what firmware vaulting replaces, and why the download link is the part that fails the audit.*

**Companion reading:** the reference doc [CRM Sync — Firmware, SBOM & the Cyber Resilience Act](./firmware-sbom-cra.html) and the screen-by-screen deck [Entitlement for Composable AI (PDF)](./entitlement-for-composable-ai.pdf).

---

Firmware distribution today is usually a signed installer behind a storage link. A URL that, once shared, is shared forever — with no record of who fetched it, when, or under what authority.

That was fine when the only question was "does the checksum match?" The EU Cyber Resilience Act asks a different question: **when this version turns out to be vulnerable, who had it, and can you prove it?**

Two dates matter, and the first one is close.

**11 September 2026** — reporting obligations begin. An actively exploited vulnerability triggers an early warning within 24 hours, a notification within 72 hours, and a final report within 14 days.

**11 December 2027** — full obligations: documentation, secure updates, conformity assessment, CE marking.

A 24-hour clock is not a policy problem. It is a records problem. You cannot write the report if the distribution channel never produced a record.

## What an SBOM actually is

An SBOM — Software Bill of Materials — is a machine-readable ingredient list for a build: every component, library, and dependency, with versions, so that you, a customer, or a regulator can answer "what is inside this image, and is any of it known to be vulnerable?"

Two things about SBOMs are widely misunderstood:

**They are generated, not written.** An SBOM comes out of CI, from the lockfile, on every build. A hand-written one drifts out of date the day it's saved. Either standard format — CycloneDX (ECMA-424) or SPDX (ISO/IEC 5962) — satisfies the requirement.

**They are private by default.** The CRA requires SBOMs to be available to authorities and customers *on request* — not published openly. A public component list is also an attack map. What you need is a mandatory disclosure path without public exposure: a registry, versioned per build, vulnerability-scanned in place.

## What firmware vaulting replaces

Vaulting replaces the link with a **grant**.

A firmware image enters through an encrypted vault and only leaves through a two-step authorization gate. In between, three records outlive the transaction:

1. A **registry row** — product, version, size, full SHA-256 digest, and the linked SBOM.
2. An **upload certificate** — an Ed25519-signed attestation of what was vaulted, by whom, and when. Anyone can verify it against the published public key set; no account, no trust in the platform required.
3. A **hash-chained access ledger** — every grant, every denial, every served byte-stream, each row sealing the one before it. History cannot be quietly edited, only visibly broken.

The image itself sits under per-image envelope encryption: each build encrypted with its own content key, that key wrapped under a versioned master. A suspected leak is healed by rotating the wrapping key — every previously issued download token dies at once, the ciphertext never moves. Remediation without a recall.

Versions are immutable. A new build is a new record, never an overwrite. That is what makes a SHA-256 digest a permanent identity rather than a snapshot.

## How this maps onto the regulation

- **SBOM per image** → components identified and documented, available on request (Annex I).
- **Upload certificate** → integrity and provenance evidence for the product placed on the market.
- **Hash-chained ledger** → "who accessed what while vulnerable" — the factual basis of Article 14 reporting.
- **Grant-gated download** → control of the distribution channel; an attestable secure update mechanism.
- **Key rotation** → vulnerability handling without recalling hardware.
- **Register + receipts** → a demonstrable conformity trail for market surveillance.

## The part that should lower your blood pressure

Most apps fall under the CRA's **default category**: self-assessment, no external auditor. That makes compliance a checklist, not a project — ten documents, prepared in order, ahead of two dates. Connected devices (Class I / II) face stricter conformity routes on the same clocks, which is exactly why the evidence chain has to be a by-product of normal operation, not a quarterly scramble.

The teams that will have a bad September 2026 are not the ones with vulnerable components — everyone has vulnerable components eventually. They are the ones whose distribution channel is a storage link with no memory.

## And for SaaS?

"How do you solve this problem for SaaS?" is the right follow-up, because in SaaS nothing crosses a boundary — there is no binary to hash, no download to grant. The evidence questions don't go away; they re-key. "Who had the vulnerable version?" becomes "who could act on what data, under which authority, during the window?"

Firmware compliance ledgers **artifacts**. SaaS compliance ledgers **sessions**. The unit of evidence shifts from a binary's SHA-256 to the tuple *identity → entitlement → consent → action* — and the same five properties apply unchanged on the new substrate:

- **SBOM per release** still comes out of CI. SaaS ships builds too; the registry works as-is.
- **The shareable-forever URL becomes the shareable-forever credential** — the shared API key, the seat login passed around. The replacement is the same move: access as a capability held by a subject (a person, a teammate, an agent), granted, audited, and revoked per subject in real time.
- **The upload certificate becomes a signed license** — an attestation of who held what authority, under which terms, from when to when — verifiable by anyone against the published public key set.
- **The access ledger becomes the event ledger** — consent grants and revocations, entitlement changes, agent actions — append-only, each row sealing the one before it. That is the factual basis of incident reporting for a service.
- **Key rotation still heals without a recall** — bump the key generation and every issued token dies server-side at once.

A useful contrast here is Nstor's relay model — shared channel keys, where possession of the key *is* membership. That is not a lesser design; it is a different one, built literally for an individual: one person coordinating many agents, where holding the key is both identity and access, and the simplicity is the point — no accounts, no administrator, nothing to provision. The trade-offs only surface when you ask it to be an enterprise. There is no "forgot password," because nothing exists server-side to reset against, and anyone holding the key is indistinguishably you. And there are no teams: no per-member identity, no roles, no ejecting one person without re-keying everyone who should remain, no way for an outsider to verify a membership was ever legitimate. None of that matters to an individual running their own agents. All of it matters to an organization signing a conformity assessment.

The enterprise answer is asymmetric keys with named generations: identity is a subject on the platform, credentials are individually revocable, rotation is non-disruptive by construction — old and new public keys published side by side, no flag day — and a team is a set of roles with scoped capabilities and separation of duties, verifiable by anyone against the published key set. Two models, two audiences: relay for the individual with a fleet of agents, entitlement for the team with duties to separate. Both are part of the same rising tide — authority becoming something signed, scoped, and verifiable rather than something merely possessed. SBOM registries and CRA evidence chains simply live on the enterprise side of that line.

That last part is not abstract. It is a screen: access is granted by invitation, and each member sees only the roles they hold — CISO / DPO, Designer, QA / Compliance, Release Manager, Data & Audit, Agent permissions — separation of duties by design. The reviewer who signs off is never the one who promotes; the agent's authority is a grant on the same board, with the same immutable audit. None of that has anywhere to live when the team's identity is one shared key.

![Choose your view — access granted by invitation; you see only the roles you hold. Separation of duties by design.](https://crm-sync.dev/kb/media/docs/teams-choose-your-view.png)

---

The reference write-up — including a plain-language glossary of every term above (envelope encryption, CEK/KEK, hash-chained ledger, grant-gating, CORS, nosniff) — is [CRM Sync — Firmware, SBOM & the Cyber Resilience Act](./firmware-sbom-cra.html). The full screen-by-screen walkthrough of the entitlement, session, and attestation surfaces is the deck: [Entitlement for Composable AI (PDF)](./entitlement-for-composable-ai.pdf).

*Practical guidance, not legal advice. Whether your product is default category or Class I / II is a question for counsel.*
