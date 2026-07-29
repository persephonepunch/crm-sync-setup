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

Who uses this?

Device makers first — the EU Cyber Resilience Act starts its reporting clock on 11 September 2026, and it assumes an evidence chain: SBOMs, provenance, an access record. Then every app team, because every release has components. Then SaaS, because the same evidence question doesn't disappear when there's no binary — it re-keys from artifacts to sessions: who could act on what, under which authority, when.

So the answer is: everyone.

That's the opportunity I built for. I turned a regulatory threat into a composable, enterprise-grade asset manager and publishing system for SBOMs and firmware security. Instead of selling another SaaS subscription, I used Shopify's WASM publishing to securely wrap mini applications — Shopify's versioned, non-destructive app releases, paired with Google login, BigQuery, and forward deploy. Very needed security, in the shape the AI future is taking: use what you already run. The platform is the compiler, the OS, and the DevOps pipeline.

And this will expand. GS1's Sunrise 2027 is the other clock: retailers scanning 2D barcodes at the point of sale by end of 2027, which turns the product identifier into a URI the brand hosts — every item on a shelf resolving to a URL. What should that URL serve? A registry: versioned records, signed attestations, an access ledger. The QR registry that vaults firmware today is the same shape as what every physical product is about to point at.

#SBOM #Sunrise2027 #Entitlement #CyberSecurity

---

**The full thread:** the article [Your Firmware Is a URL — the CRA Assumes an Evidence Chain](./cra-evidence-chain.html) · the reference doc [Firmware, SBOM & the Cyber Resilience Act](./firmware-sbom-cra.html) · the identifier plan [CPG Planning for Sunrise 2027](./sunrise-2027-identifier-thread.html) · the deck [Entitlement for Composable AI (PDF)](./entitlement-for-composable-ai.pdf).
