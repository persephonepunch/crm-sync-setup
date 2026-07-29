---
title: "What Is an SBOM? Who Uses This? Everyone."
description: "The LinkedIn edition — question-first: what an SBOM is, who uses it (everyone), and how a regulatory threat became a composable, enterprise-grade publishing system for SBOMs and firmware security on Shopify WASM."
canonical: https://persephonepunch.github.io/crm-sync-setup/sbom-everyone.html
category: "Security"
date: 2026-07-29
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SBOM-EVERYONE.md
---
# What Is an SBOM? Who Uses This? Everyone.

*The LinkedIn edition of [Your Firmware Is a URL — the CRA Assumes an Evidence Chain](./cra-evidence-chain.html): the same argument, question-first, with the builder's story.*

---

What is an SBOM?

A machine-readable ingredient list for software: every component, library, and version in a build, generated in CI from the lockfile — so that anyone can answer "what is inside this, and is any of it known to be vulnerable?"

![Beat 1 — What is an SBOM? The firmware glossary: SBOM, envelope encryption, hash-chained ledger, grant-gated download, key rotation — every term defined, each with its anchor URL.](https://crm-sync.dev/kb/media/docs/firmware-glossary-table.png)
*Beat 1 — the receipts. Every term the system uses, defined in plain language with a permalink.*

Who uses this?

Device makers first — the EU Cyber Resilience Act starts its reporting clock on 11 September 2026, and it assumes an evidence chain: SBOMs, provenance, an access record. Then every app team, because every release has components. Then SaaS, because the same evidence question doesn't disappear when there's no binary — it re-keys from artifacts to sessions: who could act on what, under which authority, when.

![Beat 2 — Who uses this? Choose your view: access granted by invitation; you see only the roles you hold — CISO/DPO, Designer, QA/Compliance, Release Manager, Data & Audit, Agent permissions.](https://crm-sync.dev/kb/media/docs/teams-choose-your-view.png)
*Beat 2 — enterprise teams. Separation of duties by design: the reviewer who signs off is never the one who promotes.*

So the answer is: everyone.

That's the opportunity I built for. I turned a regulatory threat into a composable, enterprise-grade asset manager and publishing system for SBOMs and firmware security. Instead of selling another SaaS subscription, I used Shopify's WASM publishing to securely wrap mini applications — Shopify's versioned, non-destructive app releases, paired with Google login, BigQuery, and forward deploy. Very needed security, in the shape the AI future is taking: use what you already run. The platform is the compiler, the OS, and the DevOps pipeline.

And this will expand. GS1's Sunrise 2027 is the other clock: retailers scanning 2D barcodes at the point of sale by end of 2027, which turns the product identifier into a URI the brand hosts — every item on a shelf resolving to a URL. What should that URL serve? A registry: versioned records, signed attestations, an access ledger. The QR registry that vaults firmware today is the same shape as what every physical product is about to point at.

![Beat 3 — Everyone. The product surface as URLs — SBOM registry, firmware security, CRA readiness, channel publish — ending on the question from Isaac Hepworth (Google): "How do you solve this problem for SaaS?"](https://crm-sync.dev/kb/media/docs/the-urls-saas-question.png)
*Beat 3 — the whole surface, closing on the question this piece answers: "How do you solve this problem for SaaS?"*

<div class="uk-video-wrap" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5rem 0 0.5rem;">
<iframe src="https://www.youtube-nocookie.com/embed/ZYsUbN6oT7Q" title="How do you solve this problem for SaaS? — Isaac Hepworth" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

> "How do you solve this problem for SaaS?"
> — Isaac Hepworth, Google

Watch on YouTube: <https://youtu.be/ZYsUbN6oT7Q>

## How it ties together

The video asks the question; the login is the answer.

![The connected login — Sign In, Shopify, or Continue with Google: three doors, one subject, PII sealed.](https://crm-sync.dev/kb/media/docs/connected-login-modal.png)
*The front door: one sign-in, two identity providers, one subject.*

Sign in with Shopify and you arrive as your commerce identity; continue with Google and you arrive as the same subject — both providers' identifiers resolve to a single platform UUID, integrated with both UUID privacy systems so no PII crosses in the clear. PKCE proves the human at the door with no client secret to steal; the actor's identity travels as JWE, sealed and readable only server-side. The identifier does the joining; the person's data never has to.

That one UUID is what every chain in this story hangs off. A purchase mints entitlement — capabilities, not a subscription flag. Teams and agents hold scoped, revocable grants against it (the roles screen in Beat 2). Consent, entitlement, revenue, and engagement key off it in a single session view. And every event — a firmware grant, a consent change, an agent's checkout — lands in the same hash-chained ledger the vault uses.

The division of labor is clean. **Shopify's app system provides the secure WASM wrapper** — versioned, non-destructive, reviewed code executing inside the platform, not loose JavaScript in the buyer's browser. **Google provides the segments** — audiences, Smart Bidding, BigQuery. And the spine links privacy to **predictive lifetime value**: consent-gated, pLTV-weighted signals flow from the same UUID into bidding. Which means all you need is consent. Granted, it powers prediction; revoked, the boundary fails closed and everything downstream goes quiet. That is the whole trade — evidence-grade privacy in exchange for signals worth predicting on.

So the thread runs: the glossary defines the primitives, the roles screen shows who wields them, the product URLs show where they ship, and the login is where it all keys in. Firmware ledgers artifacts by SHA-256. SaaS ledgers sessions by UUID. Sunrise 2027 will point physical products at the same registry. One spine — identity → entitlement → consent → action — with two front doors and one ledger.

#SBOM #Sunrise2027 #Entitlement #CyberSecurity

---

**The full thread:** the article [Your Firmware Is a URL — the CRA Assumes an Evidence Chain](./cra-evidence-chain.html) · the reference doc [Firmware, SBOM & the Cyber Resilience Act](./firmware-sbom-cra.html) · the identifier plan [CPG Planning for Sunrise 2027](./sunrise-2027-identifier-thread.html) · the deck [Entitlement for Composable AI (PDF)](./entitlement-for-composable-ai.pdf).
