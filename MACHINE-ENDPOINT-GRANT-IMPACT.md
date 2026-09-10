---
title: "Paired permissions and grant impact on machine endpoints"
description: "On a machine endpoint a permission and its grant impact are two different statements. Read on a SaaS API is revocable; read on a content-addressed CID is a copy you can never call back. Paired across four endpoint classes — SaaS, content-addressed (IPFS, the DAT endpoint), device attestation in the dark factory, and edge cache — with the shipped envelope gate, and the finding that latency and revocation lag are the same dial unless you enforce at unwrap."
canonical: https://persephonepunch.github.io/crm-sync-setup/machine-endpoint-grant-impact.html
category: "Security"
date: 2026-09-10
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/MACHINE-ENDPOINT-GRANT-IMPACT.md
licence: CC-BY-4.0
alternativeHeadline: "You do not grant a machine access. You grant it a copy."
verified_on: 2026-09-10
verified_by: source-inspection
method: "Permission dimensions, denial reasons and the two-step gate are read from the shipped envelope implementation in workers/crm-sync (mint, unwrap, payload, rotate) rather than from a design document. Protocol properties of IPFS and Hypercore are as published. The latency/revocation finding in section 7 is an architectural claim about this shape, argued rather than measured."
review_by: 2027-03-10
supersedes: []
keywords:
  - machine endpoint permissions
  - grant impact
  - IoT permissions
  - device attestation
  - dark factory
  - IPFS security
  - content-addressed storage
  - DAT endpoint
  - CID access control
  - capability caps
  - entitlement revocation
  - per-row encryption
  - data latency and security
  - SaaS-free gating
about:
  - name: Capability-based permissions for machines
  - name: Content-addressed storage security
  - name: Dark factory and IoT firmware distribution
  - name: Entitlement revocation and key rotation
  - name: Latency and security trade-offs
citation:
  - name: "Dark Factory Entitlement Security (the model this operationalises)"
    url: https://www.crm-sync.dev/pages/knowledge-base#dark-factory-entitlement-security
  - name: "Capability, not perimeter"
    url: https://www.crm-sync.dev/pages/knowledge-base#capability-not-perimeter
  - name: "Hypercore Protocol — signed append-only log (the Dat lineage)"
    url: https://hypercore-protocol.org/
  - name: "File System Agnostic Publishing — the delivery-side companion (IPFS, Pinata, Dat/Hypercore)"
    url: https://www.crm-sync.dev/pages/knowledge-base#universal
  - name: "Pinata — dedicated IPFS gateways"
    url: https://docs.pinata.cloud/gateways/dedicated-ipfs-gateways
---
# Paired permissions and grant impact on machine endpoints

**For:** Platform security, IoT and manufacturing engineering, and whoever signs off on what a machine is allowed to fetch
**Scope:** Public. Architecture and permission semantics only — no keys, no endpoints, no source.
**See also:** [`DARK-FACTORY-ENTITLEMENT-SECURITY.md`](dark-factory-entitlement-security.html) · [`CAPABILITY-NOT-PERIMETER.md`](capability-not-perimeter.html) · [`FIRMWARE-SBOM-CRA.md`](firmware-sbom-cra.html)
**Delivery-side companion:** [`File System Agnostic Publishing`](universal.html) — the same content-addressed substrate from the publishing direction: how to *get* an export onto IPFS. This piece is the permissions half of that one.

---

## 0. TL;DR

A permission is what you wrote down. A **grant impact** is what the subject can still do after you change your mind. On a human session those two statements are close enough to treat as one — you revoke the session and it is over. On a machine endpoint they come apart, and the gap between them is where every irreversible loss lives.

The reason is physical, not procedural. A person consumes access; a machine takes delivery. A browser session ends when the tab closes; a device holds the image it fetched until it is scrapped. So on a machine endpoint you are never granting *access* — you are granting a **copy**, and the only honest question is what you can still take back after the copy exists.

Four endpoint classes give four different answers, and only one of them lets you take anything back. Paired properly, the design rule falls out: **enforce at unwrap, not at fetch.** Gate the key rather than the network, and the ciphertext becomes free to cache, mirror, pin, and pre-position at the edge — because a cached inert thing costs nothing to revoke.

**One-line recommendation:** *Write down the grant impact next to every permission before you issue it. If the two columns disagree, the permission is a wish.*

---

## 1. Two statements, not one

Take the simplest permission anyone writes: **read**.

On a SaaS API, `read` means: this caller may ask this service for this record, now, and the service will decide again next time. Revocation is a config change, it takes effect on the next call, and the log tells you who asked while it was open.

On a content-addressed endpoint, `read` means: this caller may compute a hash and retrieve the bytes from any node in the world that holds them, forever, whether or not you are still running. There is no next time to decide again. There is no service in the path to say no.

Same word. Different physics. A permission model that uses one word for both is not modelling anything — it is naming things.

The pairing discipline is to write two columns and refuse to ship a row where they disagree: **what the permission says**, and **what remains true after you revoke it**.

---

## 2. The four endpoint classes, paired

| Endpoint class | What `read` grants | What you can still take back | Revocation latency |
|---|---|---|---|
| **SaaS API** | One answer, re-decided per call | Everything, from the next call | Immediate |
| **Content-addressed** (IPFS/CID — the "DAT endpoint") | The bytes, permanently, to anyone holding the address | Nothing about the content. Only discovery through *your* gateway | Never |
| **Device attestation** (IoT, dark factory) | A copy that outlives the connection, often offline | The *next* fetch. Never the copy on the device | One maintenance window to never |
| **Edge cache / CDN** | Whatever was warm at grant time | Origin behaviour, after the TTL drains | One TTL |

Restated as prose, because the distinctions are the argument and a table read by a machine arrives as a single undifferentiated block.

A **SaaS API endpoint** is the only class where the permission and the grant impact are the same statement. The service is in the path on every call, so it can change its mind, and the price of that is a network round trip on every read. This is the class everything else is measured against, and its guarantee is bought entirely with latency.

A **content-addressed endpoint** — a CID on IPFS, or the "DAT endpoint" in the loose usage — inverts every property. (On the naming: Dat/Hypercore is a sibling protocol, and in practice a DAT endpoint resolves to IPFS, since the pinning industry only exists on the IPFS side. The two models are compared in full in the delivery-side companion, [File System Agnostic Publishing](universal.html), which is where this stack's IPFS path is specified.) The address *is* the hash of the content, so the address cannot be revoked without changing the content, and changing the content produces a different address. Anyone who knows the CID can fetch from any node that holds it. A restricted or dedicated gateway does gate something real: it controls which CIDs *your domain* will serve. It does not control whether the content is retrievable, because it was never the only route. Gateway policy is a discovery control wearing an access control's clothes.

A **device attestation endpoint** is the dark factory's subject, and it is the worst-behaved of the four. The device fetches a firmware image and then leaves the conversation — possibly for years, possibly onto an air-gapped line. It cannot be asked to log in again. It cannot be told the grant was withdrawn. Revocation reaches the *next* fetch, which may never come. A permission model that assumes the subject is reachable does not describe this subject at all.

An **edge cache** looks like the SaaS class and behaves like a weak version of the content-addressed one for exactly as long as the TTL. Its grant impact is bounded and known, which makes it the only one of the three delivery classes that can be reasoned about with a number.

---

## 3. IPFS security: the endpoint cannot gate, so stop asking it to

Three things a CID grants the moment it is known, and none of them are recoverable:

**World read, permanently.** Content addressing makes the hash the address. Unpinning removes your node's copy; it does not remove anyone else's, and it does not make the address stop working where the bytes still exist.

**Existence proof.** Even where the bytes are unreachable, a CID discloses that a specific artifact existed and that you published it. For firmware, model geometry, or a customer dataset, the existence claim can matter as much as the content.

**Immutable provenance — in both directions.** This is the underrated one, and it is a feature. A CID is a cryptographic name for exactly those bytes. Every publish is a named artifact, promotion is repointing at a new CID, rollback is repointing back, and a supply-chain lookalike is detectable by anyone with the real hash. Content addressing is excellent release engineering. It is simply not an access control, and the two get confused because both involve hashes.

Two gates survive on this substrate, and only two.

**The key gate.** Encrypt before pinning. The CID then names ciphertext, and ciphertext distributed to the world is inert. Access becomes a question about a key rather than a question about a network — which means it becomes revocable again, because keys can be rotated and re-wrapped without recalling a single distributed copy. This is the whole trick, and it is the only one that survives contact with a protocol designed to make retrieval unstoppable.

**The discovery gate.** A restricted gateway on your own domain, serving only your pinned CIDs. Useful, real, and worth having — as long as nobody in the room believes it is stopping a determined reader.

Everything else offered as "IPFS access control" is one of those two wearing a different name.

---

## 4. The dark factory: permissions for a subject that cannot be reached

The dark factory raises the stakes because it removes the human from the loop entirely. A lights-out line fetches firmware, tool paths, and model geometry on its own schedule, acts on them physically, and has no one at the console to notice a bad grant.

Paired honestly, the machine subject has three properties no human subject has.

It **caches by necessity**, because a line that stalls waiting on a network is a line that has stopped. It is **frequently unreachable**, because segmented OT networks and maintenance windows are the point, not a defect. And it has **no session**, because there is nobody to sign in — the identity is an attestation the hardware makes about itself, and that attestation is as durable as the hardware.

The correct response is not to make the device better behaved. It is to move the enforcement point to the only place that stays under your control: **the key, checked at unwrap, on your side.** The device may hold the ciphertext indefinitely, cache it, mirror it to a peer, or carry it across an air gap on removable media, and none of that is a security event — because the thing it is holding does nothing until an unwrap succeeds, and the unwrap happens where you still get a vote.

That reframes revocation from an operation you perform on a fleet into an operation you perform on a key. You do not chase copies. You retire a key version, and the copies go dark at their next unwrap.

---

## 5. Gating without a SaaS in the path

Remove the SaaS gatekeeper — for latency, for cost, for sovereignty, or because the data should not transit a third party at all — and the gate does not disappear. It moves. There are exactly three places it can land, and one of them is a decision people make without noticing.

**In the key.** The payload is encrypted at rest under a per-asset content key; that key is wrapped under a key-encryption key held by the operator; the wrapped key sits in a head row, never with the ciphertext. Possession stops implying access. Revocation becomes a re-wrap. This is the one that works on every substrate, including the ones with no server at all.

**In the ledger.** The gate does not prevent the read; it makes the read undeniable. Every grant, denial, and served byte-stream is an append-only, hash-chained row. This is weaker than prevention and it is not a substitute for it — but for a regulator asking *who accessed what while it was vulnerable*, an answer with evidence is the only artifact that counts, and neither a bundle nor a silo can produce one.

**Nowhere.** The default, chosen by omission, every time an artifact is pinned or published in plaintext because the endpoint felt private. This is the failure mode that a content-addressed endpoint punishes hardest, because the mistake is permanent on a substrate designed never to forget.

---

## 6. The shipped shape

The model above is not a proposal here; it is what the envelope gate in this stack already does, which is why the permission dimensions can be stated concretely rather than aspirationally.

An asset is minted encrypted: AES-256-GCM under a random per-asset content key, ciphertext to object storage, the content key wrapped under a key-encryption key derived from a master secret, a per-asset salt, and a key version. The wrapped key lives in the head row; the content key never leaves the worker and never touches storage.

Access is two steps, deliberately. `unwrap` checks the caller's capability and mints a short-lived signed token — the firmware path gives that token 120 seconds. `payload` verifies the token, decrypts server-side, streams plaintext stamped with a per-fetch serial, and writes the ledger row. Possession of the ciphertext, of the URL, or of an expired token yields nothing at any point.

The capability is per-artifact rather than per-role: `firmware:<slug>` for a firmware image, `assets3d:<slug>` for a 3D asset, minted from the purchase as `asset:<slug>`. A grant to one artifact is not a grant to a category.

The policy carried on a grant has five dimensions that the word "read" does not disclose, and each has its own denial reason in the ledger: **visibility** (public, named people, or group), **starts_at** (denied as `not_yet_active` before it opens), **expires_at** (`expired`), **usage_limit** against a running count (`usage_exhausted`), and the capability check itself. Denials are recorded as carefully as grants, which is what makes the ledger evidence rather than a success log.

Healing is a key-version bump and a server-side re-wrap. The ciphertext in storage is untouched — cheap by design — and every leaked wrapped key or token goes dead. And because the ledger is hash-chained on `prev_hash`, the record of all of it is tamper-evident: the CRA Article 14 artifact, produced as a side effect of operating rather than assembled afterwards.

---

## 7. Latency and revocation are the same dial

Here is the finding worth the price of the document, and it is the reason the two halves of the title belong in one piece.

Every technique that makes a machine read faster works by **caching a decision**. A cached token, a warmed edge object, a pre-positioned firmware image, a pinned CID, a long-lived session — each one removes a round trip by deciding earlier and reusing the answer. And a decision that has been reused is a decision you have not re-made. So the same knob that buys latency spends revocation: the faster the read, the longer the window in which a withdrawn grant is still being honoured somewhere.

Teams usually meet this as a false choice and resolve it by policy — shorter TTLs, more frequent re-attestation — which is just choosing a point on the dial and paying for it in both currencies.

The exception is the whole architecture: **cache the inert thing, decide on the live one.** Ciphertext carries no decision, so caching it costs no revocation latency at all. Pin it, mirror it, ship it to the edge, hand it to a peer, let a device hold it for three years. The decision is deferred to the unwrap, which is small, fast, online, and yours. Latency collapses onto a tiny authorisation call instead of a large payload transfer, and revocation stays immediate because the only cached artifact was already inert.

That is why this shape gets faster *and* stricter at the same time, and why the usual trade-off does not apply to it. It is not a clever setting. It is a consequence of never having cached a decision in the first place.

---

## 8. What this does not solve

**A granted unwrap is spent.** Once plaintext reaches an authorised subject, it is theirs. Per-fetch serials give a leak attribution, and attribution is genuinely useful — it is not prevention, and it should never be sold as prevention.

**Existence is still disclosed.** Encrypting before pinning protects the content. It does not hide that an artifact exists, how large it is, or when it changed. Where the metadata is the sensitive part, content addressing is the wrong substrate and no amount of encryption fixes it.

**The unwrap gate is an availability dependency.** Moving enforcement to the key means an offline device cannot unwrap. That is the correct security property and a real operational constraint, and a line that must run through a network partition needs a deliberate, time-boxed answer — a pre-authorised window with an expiry, chosen on purpose — rather than a permanent exemption that quietly becomes the architecture.

**The ledger proves integrity, not truth.** A hash chain proves the record has not changed since it was written. It does not prove the record was accurate when written. Where that distinction matters, the underlying measurement has to be independently reproducible.

**Section 7 is argued, not measured.** The claim that cached ciphertext costs zero revocation latency follows from the mechanism, and the mechanism is in the source. The end-to-end performance comparison against a session-cached SaaS read has not been run here.

---

## 9. The grant impact worksheet

Before issuing any machine grant, write these six lines. If line 4 is empty, you have not issued a permission — you have made a disclosure.

1. **Subject.** Which machine, attested how, acting for whom.
2. **Artifact.** The specific slug or CID. Not a category, not a folder.
3. **Permission.** The literal capability key that will be checked.
4. **What remains true after revocation.** The grant impact. In plain words.
5. **Bound.** Expiry, usage limit, opening time — at least one must be real.
6. **Evidence.** Where the grant, the denial, and the fetch are recorded.

Line 4 is the one that gets skipped, and it is the only line that describes the part you cannot undo.
