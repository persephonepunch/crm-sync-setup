---
title: "Security Reinforcement: Firmware Asset Publishing"
description: "Configuration tooling, a UAT plan, and the severity of shipping secrets in code — for teams publishing firmware where a signed byte stream is the only thing standing between a download URL and a device."
canonical: https://persephonepunch.github.io/crm-sync-setup/firmware-asset-publishing.html
category: "Security"
date: 2026-09-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/FIRMWARE-ASSET-PUBLISHING.md
licence: CC-BY-4.0
tags:
  - firmware
  - sbom
  - security
  - architecture
---

# Security Reinforcement: Firmware Asset Publishing

**For release engineers, firmware teams, and whoever signs off that an update channel is safe.**

> Every other asset class fails inside a process you control. Firmware executes on a device,
> outside your containers, your allow-lists and your monitoring — and persists through a
> reinstall of everything above it. The controls therefore have to hold on the device, not on
> the server that served the bytes.

Companion to [Asset Management, Security and AI](https://www.crm-sync.dev/pages/knowledge-base#what-survives-the-transform),
which argues the case. This is the operational half: what to configure, what to test before
publishing, and what it costs to leave the codebase unguarded.

---

## Summary — challenge, solution, opportunity, risk

For the reader who signs the release rather than builds it.

### Challenge

An update channel is the only route by which an organisation can change hardware it no longer
possesses. In most estates that channel's entire integrity claim is **transport**: the file was
fetched over HTTPS, therefore it is the right file. That does not follow. A valid certificate
proves the connection reached a server, not that the bytes are the ones the business approved —
and the routes to changing those bytes (a compromised build agent, an over-permissive storage
bucket, a stolen deploy token, a CDN rule) do not touch the certificate at all.

Two conditions make the consequence disproportionate. A device executes what it is given,
outside every control the organisation operates. And code that ships is code that can be read,
so any credential inside it is disclosed to anyone who buys the product.

### Solution

Move the integrity claim from the transport to the artifact, and move verification from the
server to the device.

- The payload is signed with a key the organisation cannot export and an attacker cannot copy.
- The device verifies that signature **before flashing**, offline, using a public key in hardware.
- The bundle's digest is published somewhere the download host does not control, so a third party can check what was received against what was released.
- The download is gated on entitlement, and the device refuses an older image even when correctly signed.
- The codebase and the **compiled artifact** are both scanned, and a finding blocks the build.

### Opportunity

- **Market access.** Regulatory regimes now require a bill of materials, a vulnerability-handling process and update integrity for connected products. Building the evidence into the release process is materially cheaper than assembling it under audit.
- **A claim competitors cannot easily match.** "You can verify independently what we shipped" is checkable, and most vendors cannot say it.
- **Incident response becomes answerable.** *What was in the build that shipped two years ago* changes from an investigation into a query.
- **Channel and resale.** Provenance that travels with the artifact lets partners distribute without becoming a trust dependency.
- **Lower recall cost.** Staged rollout with a health gate turns a fleet-wide event into a cohort-sized one.

### Risk of inaction

| Risk | Exposure | Severity | Recoverable? |
|---|---|---|---|
| Signing key disclosed or absent | Any party can produce firmware the fleet accepts | **Catastrophic** | Only if the fleet can receive a key rotation — which a compromised channel may prevent |
| Substituted bytes at the download origin | Fleet-wide compromise, with no on-device check to stop it | **Critical** | Recall, and reputational cost beyond it |
| Credentials shipped inside the image | Disclosed to every purchaser; fleet-wide, permanent | **Critical** | Requires a firmware update the device may never take |
| No bill of materials | Cannot answer what shipped; regulatory and commercial exposure | **High** | Reconstructable only at significant cost |
| No anti-downgrade control | A known-vulnerable signed image can be replayed indefinitely | **High** | Fixed forward, but the window stays open |
| No entitlement on download | Distribution to unknown parties; analysis fuel for an attacker | **Medium** | Closeable at any time |

**The decision this document supports:** the controls below cost engineering time measured in
weeks. The first row of that table costs the product line. That asymmetry, rather than any
technical argument, is why this is a release-gate item and not a backlog item.

---

## 1. Configuration tooling

Named tools, grouped by the job. Substitutes are fine; the **job** is not optional.

### Signing and key custody
- **Sigstore / cosign** — sign artifacts and attestations; keyless signing with an OIDC identity where a long-lived key is the greater risk.
- **Rekor** — the transparency log. A signature nobody can see is a signature nobody can dispute; a logged one can be checked later against what actually shipped.
- **HSM or cloud KMS** (YubiHSM, AWS KMS, Cloud KMS, Azure Key Vault) — the signing key must be **non-exportable**. If a human can copy it, it is already a distributed secret.
- **Hardware root of trust on the device** — secure boot with the public key in OTP or fuses. Verification that software can disable is decoration.

### Bill of materials and provenance
- **syft** or **cyclonedx-cli** — generate an SBOM at build, from the build, not from a later scan of the artifact.
- **in-toto** / **SLSA provenance** — attest *how* the artifact was produced: which source, which builder, which inputs.
- **GitHub artifact attestations** (or your CI's equivalent) — bind the attestation to the workflow run that made it.
- **Reproducible builds** where the toolchain allows. Two independent builders arriving at identical bytes is the strongest claim available, and it costs discipline rather than money.

### Archive and manifest handling
- **A purpose-written extractor**, not the platform default. It must reject `..`, absolute paths, symlinks and hard links, and cap entry count, per-entry size, total uncompressed size and compression ratio **before writing anything**.
- **defusedxml** (Python), or libxml2 with `XML_PARSE_NONET` and DTD loading off — for any XML manifest. Every XML parser in the pipeline, not just the obvious one.
- **JSON Schema or XSD validation** of the manifest before a single path in it is used.
- **Content addressing** — a CID or digest computed from the bytes, published somewhere the download host does not control.

### Codebase protection
- **gitleaks** or **trufflehog** in CI *and* as a pre-commit hook. CI alone means the secret is already in history.
- **detect-secrets** with a reviewed baseline, so a new finding is an event rather than noise.
- **semgrep** or **CodeQL** — SAST tuned for hardcoded credentials, weak crypto and unsafe deserialization.
- **osv-scanner**, **grype** or **trivy** — dependency and container CVEs, run on the image you ship rather than the manifest you wrote.
- **Binary secret scanning** — run the scanner against the **compiled artifact**, not only the source. This is the step almost everyone skips, and section 3 explains why it matters most here.
- **Dependabot / Renovate** — because an unpatched dependency in firmware ships to hardware you cannot reach.

### Distribution
- **Entitlement on the download route.** The serve path refuses; an unlisted URL is not access control.
- **Anti-downgrade counter** enforced by the device, so a correctly signed older image with a known flaw cannot be replayed.
- **Staged rollout with a health gate** — a percentage cohort, automatic halt on failure signal.
- **A documented rollback path**, tested, on the actual hardware.

---

## 2. UAT for a firmware publish

Every case below is **expected to FAIL the install**. A test that passes when it should refuse
is the only kind that matters here. Run them against the real device, not an emulator, and run
them on the artifact you are about to publish rather than a rebuild.

### Signature and provenance
- Valid signature, correct key, current version → **installs**. (The one positive case.)
- Signature absent → refuses.
- Signature valid but signed by a **non-production key** → refuses.
- Signature valid, **one byte of the payload flipped** → refuses.
- Manifest tampered after signing, payload untouched → refuses.
- Payload substituted for a different, also-validly-signed payload → refuses, because the manifest digest does not match.
- Verification with the **network unavailable** → still succeeds. On-device verification must not depend on reachability.
- Published digest compared against the downloaded bytes by an independent party → matches.

### Archive handling
- Entry named `../../etc/passwd` → extractor refuses, writes nothing outside quarantine.
- Absolute path entry (`/boot/x`) → refuses.
- Symlink entry pointing outside the root → refuses.
- Archive expanding beyond the configured total size → refuses at the cap, disk unaffected.
- Archive with an absurd entry count → refuses.
- Nested archive (a zip within the zip) → not auto-extracted.

### Manifest parsing
- Manifest containing an **external entity** referencing a local file → no file read, parse rejected.
- Manifest with an entity referencing a remote URL → **no outbound request** observed on the wire. Watch the network, do not take the parser's word.
- Manifest failing schema validation → refuses before any path is used.
- Manifest with a valid schema but a traversal path in a destination field → refuses.

### Version and device
- Older correctly signed version → refuses on the anti-downgrade counter.
- Image for a different hardware model or revision → refuses.
- Same version already installed → no-op, not a reflash.

### Failure and recovery
- Power removed mid-flash → device boots, recovers, or enters a recoverable mode. Never bricks.
- Corrupted download (truncated transfer) → detected before flash, not during.
- Rollback to the previous image → succeeds, on hardware.

### Access
- Download requested without entitlement → refused with the same response as a nonexistent artifact.
- Revoked entitlement → refused immediately, not at next token expiry.

**Definition of done:** every refusal case refuses, the positive case installs, and the rollback
works on real hardware. Anything else is not a publish, it is a hope.

---

## 3. Risks of an unguarded codebase, and what each is worth

Hardcoded secrets are the ordinary case, and in firmware they carry a severity they do not carry
elsewhere. The reason is short and worth stating before the table:

> **A secret in firmware is a published secret.** Anyone who buys the device has the binary.
> Anyone with the binary has the strings. There is no threat model in which shipped code keeps a
> secret — obfuscation changes how long extraction takes, not whether it succeeds.

Which means the question is never *could this be found*. It is **what does it unlock, and how
fast can we make it worthless.**

| Finding | What it enables | Severity | Notes |
|---|---|---|---|
| **Signing key in the repository or in the image** | Sign arbitrary firmware that every device accepts | **Catastrophic** | Ends the entire trust model. Recovery requires a key rotation the fleet may be unable to receive |
| **Hardcoded default device credentials** | Fleet-wide remote access, unchanged for the life of the hardware | **Critical** | Historically the single most exploited firmware defect. Regulators now treat shipped default credentials as a defect in itself |
| **Static encryption key or IV in the image** | Decrypt every device's data and every captured session | **Critical** | One key, whole fleet, permanently |
| **Cloud or API credential in the image** | Access to the backend as the device, at fleet scale | **Critical** | Usually over-scoped, because it was provisioned for convenience |
| **Debug interface or test endpoint left enabled** | Privileged local or remote access, no exploit required | **High** | Found by anyone who reads a UART header or scans a port |
| **Update endpoint without pinning or signature check** | Substitute firmware at the network layer | **High** | The channel described in section 1, absent |
| **Credential in git history but removed from `HEAD`** | Same as it ever was | **High** | Deletion is not rotation. Assume disclosed from the moment it was pushed |
| **`.env` or config committed** | Whatever it held | **High** | The most common finding, and the easiest to prevent |
| **Internal hostnames, IPs or bucket names** | Reconnaissance, and often direct access to something unauthenticated | **Medium** | Raises the value of every other finding |
| **Verbose errors or symbols in a release build** | Faster exploit development | **Low–Medium** | Not a breach alone. Compounds everything above it |

### The response is the same shape every time

1. **Rotate, do not delete.** A committed secret is disclosed at push time. Removing it from
   `HEAD` changes nothing an attacker can observe.
2. **Scan the artifact, not the source.** The binary is what ships, and build systems inline
   things the source did not obviously contain.
3. **Fail the build.** A scanner whose output is a report is a scanner someone will learn to
   ignore. Blocking is the only setting that holds under deadline.
4. **Provision per device, not per fleet.** Credentials unique to a unit turn a catastrophic
   finding into a single-device one.
5. **Assume the binary is public**, because it is. Then design so that being public costs you
   nothing: the device holds a public key for verification, not a private key for anything.
