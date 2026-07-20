---
title: "CRM Sync — Firmware, SBOM & the Cyber Resilience Act"
description: "What an SBOM is, what firmware vaulting does, and how the EU Cyber Resilience Act maps onto both — plus a glossary of the security terms (envelope encryption, hash-chained ledger, grant-gated download, CORS, nosniff)."
canonical: https://persephonepunch.github.io/crm-sync-setup/firmware-sbom-cra.html
category: "Security"
date: 2026-07-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/FIRMWARE-SBOM-CRA.md
---
# CRM Sync — Firmware, SBOM & the Cyber Resilience Act

**For:** manufacturers, compliance officers, and security teams selling connected devices or apps into the EU.
**Companion surfaces:** the live [Protected Firmware service](https://www.crm-sync.dev/pages/firmware) and the [Compliance QA checklist + SBOM registry](https://compliance.crm-sync.dev).

This document answers three questions in plain terms — *what is an SBOM*, *what is firmware vaulting*, and *what does the Cyber Resilience Act actually require* — then defines every term the product uses.

---

## What is an SBOM?

An **SBOM (Software Bill of Materials)** is a machine-readable ingredient list for a piece of software. It lists every component, library, and dependency that went into a build, with versions, so that anyone — you, a customer, or a regulator — can answer "what is actually inside this app or firmware image, and is any of it known to be vulnerable?"

SBOMs are written in one of two standard formats: **CycloneDX** (ECMA-424) or **SPDX** (ISO/IEC 5962). Either format satisfies the regulatory requirement. The key property is that an SBOM is **generated in CI from the lockfile**, not written by hand — so it stays current with every build instead of drifting out of date.

### What is an SBOM registry?

An **SBOM registry** is where those documents live so they stay current and available. In CRM Sync, every app release and every firmware image gets an SBOM stored in the registry, versioned per build, and vulnerability-scanned in place (with tools like Grype or Dependency-Track). Documents are **private by default** — the Cyber Resilience Act requires SBOMs to be available to authorities and customers *on request*, not published openly, because a public component list is also an attack map. The registry provides a mandatory disclosure path without public exposure.

The SBOM Registry is offered as a **$49 / month** add-on (per store). It generates a CycloneDX SBOM for every app release in CI and serves it from the registry.

---

## What is firmware vaulting?

Firmware distribution today is usually a signed installer behind a storage link — a URL that, once shared, is shared forever, with no record of who fetched it or when. **Firmware vaulting** replaces that link with a **grant**.

A firmware image enters through an **encrypted vault** and only leaves through a two-step authorization gate. In between, three records outlive the transaction:

1. A **registry row** — product, version, size, full SHA-256 digest, and the linked SBOM.
2. An **upload certificate** — an Ed25519-signed proof of what was vaulted, by whom, and when.
3. A **hash-chained access ledger** — every grant, every denial, every served byte-stream, each row sealing the one before it.

Your firmware is never a plain file at a URL: it is vaulted under **per-image encryption**, every upload is **certified**, every download is **granted**, and every event lands in a **tamper-evident ledger**. This is the evidence chain the EU Cyber Resilience Act assumes you already have.

Firmware vaulting (encrypted distribution with certificates and the ledger) is the **Firmware Security** product at **$499**. Per-image SBOM analysis is **$250**. A full **CRA Readiness Assessment** is a **$900** engagement.

### Accepted upload formats

The in-browser uploader accepts firmware and 3D-print formats: `.exe`, `.bin`, `.img`, `.hex`, `.dfu`, `.zip`, and the 3D formats `.stl`, `.glb`, `.gltf`, `.obj`, `.3mf`. Vaulting is **immutable per version** — a new build is a new record, never an overwrite. The browser uploader caps at 8 MB; larger images push through the API.

---

## What is the Cyber Resilience Act (CRA)?

The **EU Cyber Resilience Act** is Regulation (EU) 2024/2847. It sets cybersecurity requirements for products with digital elements sold in the EU — which includes both software apps and any device with firmware. Two dates matter:

- **11 September 2026** — reporting obligations begin. Actively exploited vulnerabilities must be reported: an early warning within 24 hours, a notification within 72 hours, and a final report within 14 days.
- **11 December 2027** — full obligations: documentation, secure updates, conformity assessment, and CE marking.

Most apps fall under the CRA's **default category** — self-assessment, no external auditor — which makes compliance a checklist rather than a project. Connected devices (Class I / II) face stricter conformity routes on the same clocks.

### How the firmware service maps onto the CRA

- **SBOM per image** → identify and document components; available to authorities on request (Annex I Part II).
- **Upload certificate** → integrity and provenance evidence for the product placed on the market.
- **Hash-chained ledger** → "who accessed what while vulnerable" — the factual basis of Article 14 reporting.
- **Grant-gated download** → control of the distribution channel; an attestable secure update mechanism.
- **Key rotation** → vulnerability handling: remediate without recall; leaked credentials die server-side.
- **Register + receipts** → a demonstrable conformity trail for market surveillance (Articles 13–14).

---

## Glossary of terms

**MIME type** — a two-part `type/subtype` label a server sends so a client knows how to handle a file's bytes. The vault stores the *declared* MIME type as metadata but never lets it drive rendering: downloads are forced and MIME sniffing is blocked.

**Immutable vaulting** — a vaulted version is a fact, not a mutable file. A new build is a new record (`product-fw-version`), never an overwrite; re-vaulting an existing slug is refused.

**Envelope encryption (vaulting)** — each image is encrypted under a random per-image content key; that key is itself encrypted ("wrapped") under a versioned derived key. Ciphertext and wrapped key are stored apart, useless alone. Storage compromise yields ciphertext, not firmware.

**AES-256-GCM** — the authenticated symmetric cipher used for the payload: 256-bit key, tamper-evident on decrypt.

**CEK / KEK** — Content-Encryption Key (encrypts the image, one per image) and Key-Encryption Key (wraps the CEK, versioned). Separating them means a suspected leak is healed by re-wrapping under a new KEK version; the ciphertext never moves.

**Ed25519 certificate** — a signed attestation binding product, version, digest, uploader, and linked SBOM at vault time. Anyone verifies it against the public JWKS — no account, no trust in the platform required.

**Hash-chained ledger** — every upload, grant, denial, and served byte-stream is a row whose hash includes the row before it. History cannot be quietly edited, only visibly broken.

**Key rotation (healing)** — a suspected leak is answered by bumping the key version and re-wrapping the CEK. Ciphertext is untouched; every previously issued wrapped key and download token dies at once — remediation without a recall.

**Grant (grant-gated)** — download access is a capability held by a subject (a person, teammate, or agent), not a shareable link. It is granted, audited, and revoked per subject in real time.

**PKCE** — Proof Key for Code Exchange; proves the human at sign-in with no client secret to steal.

**JWE** — JSON Web Encryption; seals the actor's identity so it is only ever read server-side.

**JWKS** — the public key set at `/.well-known/jwks.json` that anyone uses to verify a certificate. Published; carries no private key material.

**CORS (Cross-Origin Resource Sharing)** — the browser rule that a page on one origin may only read another origin's response if that server opts in via an `Access-Control-Allow-Origin` header. Here it is paired with **restricted embedding**: a vaulted image's proof badge loads only on the domains you allowlist (empty = any). The encrypted payload itself is never cross-origin readable — it is single-use, server-decrypted, and delivered as a forced download.

**nosniff** — `X-Content-Type-Options: nosniff` tells the browser not to guess a response's type and override the declared one. On the payload path it stops a file from being reinterpreted as HTML or script.

**Content-Disposition: attachment** — instructs the browser to download a response rather than render it in place. Every decrypted payload is served this way, so a file can never execute on our origin.

**SBOM** — Software Bill of Materials; a machine-readable ingredient list (CycloneDX or SPDX) for an app release or firmware image, generated in CI so it stays current.

**CycloneDX** — an SBOM format (ECMA-424); the default the registry generates and scans.

**SPDX** — an SBOM format (ISO/IEC 5962); accepted alongside CycloneDX.

**Cyber Resilience Act (CRA)** — EU Regulation 2024/2847; reporting obligations begin 11 September 2026, full obligations 11 December 2027.

---

*Practical guidance, not legal advice. CRA scope — especially whether your device is default category or Class I / II — is confirmed with counsel as part of the CRA Readiness Assessment.*
