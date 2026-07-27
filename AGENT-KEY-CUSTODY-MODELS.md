---
title: "Two Ways to Give an Agent a Key"
description: "An architecture comparison of cryptographic identity for AI agents: the Nostr participant-held keypair model (as shipped in Block's Buzz) against edge-held Ed25519 custody on Xano + Cloudflare. Covers identity vs authority, rotation and revocation, decentralized egress under enterprise controls, three-leg resilience, and where a provenance layer sits relative to a CRM."
canonical: https://persephonepunch.github.io/crm-sync-setup/agent-key-custody-models.html
category: "Security"
date: 2026-07-27
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/AGENT-KEY-CUSTODY-MODELS.md
---
# Two Ways to Give an Agent a Key

**For:** security architects, CISOs and DPOs, platform engineers, and anyone evaluating cryptographic identity for AI agents.
**Companion surfaces:** the [key-management lifecycle](https://persephonepunch.github.io/crm-sync-setup/key-management-lifecycle.html) spec and the public verification endpoint at `/.well-known/jwks.json`.

Block shipped **Buzz** on 21 July 2026: an open-source workspace where humans and AI agents hold cryptographic identities and every action is signed. It is a serious piece of work built on a serious thesis. This document compares its key-custody model with the one used here, because the difference is not cosmetic — it decides what can be proven, what happens after a compromise, and whether an enterprise security review can approve the thing at all.

## 1. The shared thesis

Buzz is built on the Nostr protocol under Apache-2.0. Every participant — human or agent — holds a keypair that belongs to them rather than to the platform. Every message, workflow step, code event, and approval is stored as a cryptographically signed event, and the record is verifiable by anyone holding the public key.

That instinct is correct and worth stating plainly: agents are becoming actors, actors need identity, and identity without cryptography is just a label in someone's database.

We share the thesis and the primitive — Schnorr-family signatures over an append-only record. The divergence is what the key is *for*, and who holds it.

## 2. Identity is not authority

A signature answers one question: **who did this?** That is authorship. It proves an agent rather than a person acted, and proves the record was not altered afterward.

Commerce and compliance ask a different question first: **was this actor allowed to do this, under what limit, with whose consent?** A signed event reading "the agent spent $40,000" is a perfect record of an unauthorized purchase. Authorship tells you who to blame; authority tells you it could not have happened.

So the keys here sign a different object:

- **Entitlements** — capabilities are scoped, revocable grants held against a subject, resolved server-side on every call.
- **Mandates** — an agent acts under a signed grant carrying a spend cap, a scope, and an expiry.
- **Consent binding** — the certificate embeds the consent state as it stood at the moment of the grant, so a later dispute reads the terms that actually applied.

A verifier can therefore answer not just "did this actor sign it," but "was this actor entitled to it, and under what terms."

## 3. The custody trade

Both directions are defensible; they optimize against different failures.

**Participant-held (Nostr).** The keypair *is* the identity. Maximum sovereignty: no platform can revoke you, no operator holds your secret. The structural cost is that losing the key loses the identity, and leaking it has no rotation story — rotating produces a *new* identity rather than a healed one.

**Edge-held (here).** Ed25519 keys are generated and used inside a Cloudflare Worker; private material stays in the platform keystore, and the public half is published at a JWKS endpoint anyone can verify against without an account. The platform attests; the world verifies.

What edge custody buys is **rotation**. A suspected compromise is a pointer flip: mint a new key, repoint the active identifier, and certificates issued afterward carry the new key while earlier ones remain verifiable against a published, retired key. A leak heals without a recall, and without anyone losing their identity.

The corresponding obligation is that **keystore access is signing authority**. That is why the perimeter matters as much as the curve: a root key held by the customer, separation of duties between who approves and who promotes, and a rotation ledger recording each ceremony by fingerprint. Trust is not the algorithm; it is the ceremony around the algorithm.

### Side by side

| Dimension | Participant-held (Buzz / Nostr) | Edge-held (Xano + Cloudflare) |
|---|---|---|
| Signature | secp256k1, per participant | Ed25519, edge-resident, per tenant |
| Key custody | Participant holds the secret | Platform keystore; customer holds the root |
| Compromise | No rotation path — new key, new identity | Rotation heals; identity survives |
| What is proven | Authorship of an event | Authorship plus entitlement and consent state |
| Record | Signed events replicated across relays | Hash-chained ledger in a system of record |
| Verification | Signature against the pubkey | Certificate against published JWKS — no account |
| Delivery | Desktop application, installed per platform | One PWA: browser, desktop dock, home screen |

## 4. Delivery under enterprise controls

Buzz ships as a desktop application for macOS, Windows, and Linux. For an open-source project with a developer audience that is a reasonable first surface: native performance, local key storage, an install anyone can inspect.

Inside a large organization an executable is a different kind of object. It enters through endpoint management, software approval, and an OS-by-OS support matrix — and the people who most need an audit trail (legal, compliance, finance, an external auditor) are precisely those who will never be issued a developer tool.

The harder blocker is the **network shape**. A Nostr client holds open connections to a set of relays: independently operated servers, chosen by the client, that receive and rebroadcast signed events. To a security team that is a decentralized egress path by design, and it lands on the questions their controls exist to answer:

- Which hosts does it connect to, and who operates them?
- What leaves the machine, and can data-loss prevention inspect it?
- Where do events come to rest, and in which jurisdiction?
- Can we demonstrate to a regulator where our record lives?

Self-hosting a private relay is possible and is the right answer for a serious deployment — but it converts an install into an infrastructure project, and until it is complete the default posture is workplace records replicating to third-party servers. Signed and tamper-evident: yes. Confined to approved infrastructure: no. Any organization with an egress policy, a data-residency clause, or a DLP mandate stops there, correctly.

The shape used here is the ordinary one those controls were written for: a browser talking to a named origin over HTTPS. One domain to allowlist, one tenancy holding the record, no persistent connections to unvetted servers. Public verification is a plain `GET` against a published key — an auditor checks a certificate without joining a network, installing anything, or being granted an account.

> A signed record nobody outside the engineering team can open is a record with an audience of one department.

## 5. Three legs, not one monolith

Holding keys at the edge does not create a single point of failure, because the stack is deliberately not one system. It is three planes that scale — and degrade — independently.

| Plane | Role | Holds |
|---|---|---|
| **Xano** | System of record | Identity, consent, entitlements, the ledger |
| **Cloudflare** | Edge | Signing, capability checks, redirects, verification endpoints |
| **Webflow** | Interface | Authored surfaces, published independently of both |

Independence is the point. When the record-keeping plane is slow, the edge still serves and buffers writes to replay. When the interface is being rebuilt, identity and entitlements are unaffected. When the edge deploys, nothing downstream is republished. A monolith converts any one of those events into an outage; three legs convert it into degraded capability in one plane while the others keep their footing.

### Why these two vendors, specifically

The pairing is not incidental. Xano and Cloudflare formalised an integration partnership precisely because the split is a natural one: a managed backend that owns durable state and a global edge network that owns proximity and compute. Each is a category leader with an enterprise track record, published compliance posture, and a support contract someone can be held to — which matters more than elegance when a security review asks who is accountable at 3am.

The practical consequence is **general availability through tools an organization already runs**:

- **No new protocol to approve.** Everything speaks HTTPS and JSON over a named origin — the shape every existing gateway, proxy, SIEM, and DLP rule was written for.
- **No new client to install.** The interface is a URL. Endpoint management has nothing to package, and the auditor needs nothing but a browser.
- **Standards, not inventions.** RFC-defined signatures (EdDSA/JWS), RFC-defined key publication (JWKS), ordinary OAuth for provider identity. A reviewer can check our claims against specifications rather than against our documentation.
- **Egress that resolves to two named vendors**, both of which are almost certainly already on the organization's approved list and in its vendor register — rather than to a client-chosen set of relays that must each be assessed.
- **Exportability.** Because the system of record is a managed database rather than a proprietary format, "give us everything" is a query, not a support ticket.

Resilience follows from the same choice. The edge absorbs load and survives regional failure by design; the record plane is backed up, versioned, and restorable independently; the interface can be rebuilt without touching either. Three vendors' failure domains rarely coincide — and none of the three can unilaterally deny access to the evidence, because the verification key is public and the record is exportable.

### Logging is passive to the locked data

The ledger records **that** something happened, to which record, under whose authority — without ever opening what is encrypted. Events are logged by reference and by hash: an entry names the subject, the capability, the timestamp, and the chain position, while the payload it refers to stays encrypted at rest. The log never needs the key to do its job.

That property is what makes the audit trail safe to distribute. Observability scales without widening the blast radius: hand an auditor the chain, or stream events to a warehouse, without handing anyone the contents.

## 6. Where this sits relative to a CRM

This is not a CRM replacement. It fills the layer neither a CRM nor an email platform was built to hold — the **provenance layer** beneath the data they already store.

Consider one field. A conventional platform records consent as a boolean: *accepts marketing, true.* That flag cannot say **when** it was granted, through **which** mechanism, under **which** version of the terms, or on **which** surface. Under GDPR, CPRA, and Consent Mode v2 the boolean is not the evidence — the provenance is. And when the record lives in a rented platform, the answer to "prove it" becomes "we exported a CSV."

| Question an auditor asks | Conventional CRM / ESP | Provenance layer |
|---|---|---|
| Did this person consent? | A boolean flag | Signed record with version and scope |
| When, and by what method? | Usually absent | Timestamped; method and surface recorded |
| Can it be altered afterward? | A mutable row | Hash-chained; alteration breaks the chain |
| Who can verify it? | Whoever has an account | Anyone, against a published key |
| Where does it live if you leave? | The vendor's tenancy | Infrastructure you own |

A CRM is very good at being where the revenue team works. It is not designed to prove to a third party what an organization was permitted to do, and when. Different jobs — the provenance layer coexists with the CRM and feeds it, and if the relationship ends the evidence does not leave with the subscription.

## 7. You do not have to build any of this

A fair objection to everything above: it reads like a cryptography project, and most teams do not have a cryptographer to spare. They don't need one. The primitives are already in the platforms, and the work is configuration rather than construction.

**The token layer ships with the backend.** Xano issues authentication tokens with **custom claims** as a standard feature — the `auth/me` pattern returns the caller's identity and whatever claims were bound at issue time. Those claims are the same place an entitlement, a scope, or a mandate reference lives. Encryption and signing are built-in functions, not libraries you vendor and maintain: you configure which claims a token carries and which endpoints require them. Nobody hand-rolls a cipher, and there is no key-handling code to get subtly wrong.

**The edge layer is the runtime's own crypto.** Signing and verification use the platform's native WebCrypto — generate a key, sign a payload, publish the public half. This is a handful of calls against a documented standard interface, not a bespoke implementation.

**It reaches agents through MCP, not custom plumbing.** Because authority already travels in the token's claims, exposing a capability to an AI agent over the Model Context Protocol is a matter of handing the agent a scoped token and letting the server resolve the claim on each call. The agent does not need to understand cryptography; it needs a token that is already bounded. The permission check happens server-side where it belongs — so an agent that misbehaves is refused rather than trusted to behave.

The skill required is **reading a claim and deciding what it permits** — ordinary application logic that any competent backend developer or technically-minded operator can implement. The heavy machinery (curve arithmetic, envelope encryption, chain construction) is already inside the platforms, maintained by their vendors and audited on their compliance schedule.

That is the difference between a research posture and a deployment posture. A protocol that demands every participant manage their own keypair correctly places a cryptographic burden on people who did not sign up for one; a platform that binds authority into a token the backend already issues places it where it can be operated by a normal team, on a normal Tuesday.

## 8. What this means operationally

- **Identity you can retire.** Personnel change, agents are deprecated, contractors roll off. Rotation and revocation are routine operations, not identity funerals.
- **Separation of duties enforced in the data plane.** Whoever authors a change cannot promote it; whoever signs off cannot deploy it. Governance is a gate, not a job title.
- **Delegation that cannot amplify.** A holder grants only capabilities they themselves hold, within their own scope, to a bounded depth — the tree cannot sprout new roots.
- **Evidence an outsider can check.** Certificates verify against a published key with no account and no trust in the platform.
- **Consent bound to the record.** The consent state at the moment of the grant is signed into the certificate.

## 9. Glossary of terms

Written for readers who know cryptography but not this stack, and for readers who know neither. No term below is proprietary — where a name is ours, it is marked.

**Nostr** — "Notes and Other Stuff Transmitted by Relays." A minimal open protocol in which identity is a secp256k1 keypair and every message is a signed JSON event. There is no canonical server: clients publish events to, and read them from, a set of independently operated **relays**. Authorization is deliberately out of scope — the protocol proves authorship, not permission.

**Relay** — a WebSocket server that accepts signed events and rebroadcasts them to subscribed clients. Relays are chosen by the client, may be public or private, and hold no authority over identity; they are transport and storage, not gatekeepers.

**secp256k1 / Ed25519** — two elliptic curves used for digital signatures. secp256k1 (Schnorr signatures in Nostr, also Bitcoin's curve) and Ed25519 (EdDSA, RFC 8032) are both modern and fast; the security-relevant difference here is not the curve but **who holds the private key** and whether it can be rotated.

**Key custody** — the question of which party physically holds private key material. *Participant-held* means the end user or agent holds it; *edge-held* (ours) means it lives in the platform keystore and is used inside a compute isolate at the network edge. Custody determines what recovery and rotation are even possible.

**Key rotation** — replacing a signing key while preserving the identity that signs. Requires an indirection between "who this is" and "which key is currently active." Where the key *is* the identity (Nostr), rotation in this sense does not exist: a new key is a new identity.

**JWKS** — JSON Web Key Set (RFC 7517): a public endpoint, conventionally `/.well-known/jwks.json`, publishing the public halves of signing keys with a key id (`kid`). A verifier fetches it and checks any certificate offline afterward — no account, no API key, no trust in the issuer's honesty.

**Entitlement** — *(our term)* a scoped, revocable grant recording what a subject may do: a set of capabilities plus scope qualifiers (brand, market, channel, shop) and a state. Resolved server-side on every call, never trusted from the client.

**Capability** — a single named permission inside an entitlement (for example `firmware.publish`). Capability-based security grants authority to *do a specific thing*, as opposed to role-based access control, which grants authority *to be a kind of person*.

**Mandate** — *(our term, aligned with the AP2 agent-payments pattern)* a signed grant under which an **agent** acts on a person's behalf, carrying a spend cap, a scope, and an expiry, and revocable at any time. The agent never holds the principal's credentials; it holds a bounded, verifiable permission to act.

**Attenuated delegation** — the rule that a grantor may only pass on capabilities they themselves literally hold, within their own scope, to a bounded chain depth, and may never grant the right to grant. It makes privilege escalation structurally impossible rather than merely forbidden.

**Separation of duties (SoD)** — an integrity control in which no single actor completes a sensitive operation alone: whoever authors a change cannot promote it, and whoever signs it off cannot deploy it. Enforced here as distinct capabilities in the data plane, not as job titles in a policy document.

**Hash-chained ledger** — an append-only log in which each row's hash includes the hash of the row before it. History cannot be quietly edited, only visibly broken — a tamper-*evident* structure, not a tamper-proof one.

**Chain of custody** — the documented, unbroken sequence of who held or acted on a record, when, and under what authority, from creation to the present. The term comes from evidence handling: a fact is only admissible if every transfer between hands is accounted for. Applied to data, it is the difference between *having* a record and being able to *prove where it has been*. Here it is assembled from three parts working together — the hash-chained ledger (order cannot be altered), the signed certificate at each grant (authority at that moment is attested), and consent binding (the terms in force are captured, not reconstructed later). A CSV export has no chain of custody; a signed chain does, and it survives the vendor relationship that produced it.

Custody has two distinct meanings that this document keeps apart, and confusing them is the most common source of muddle in these debates:

**Custody of the *key*** — who physically holds the private key material that produces signatures. Two models:

- **Participant custody** — the key lives with the end user or agent, typically on their device. *Strength:* no operator can sign as you, revoke you, or be compelled to hand over your secret; sovereignty is absolute. *Cost:* the key **is** the identity, so loss is permanent and leakage is unrecoverable — there is no rotation, only replacement with a new identity. Recovery and helpdesk support are structurally impossible; an employee who leaves with a key leaves with the identity.
- **Edge custody** — the key lives in a platform keystore and is used inside a compute isolate at the network edge, never leaving it. *Strength:* the identity is an indirection, so a key can be rotated, retired, or revoked while the identity persists; a compromise is healed rather than mourned, and normal operations (offboarding, incident response, an auditor's request) are possible. *Cost:* keystore access is signing authority, so the operational perimeter around it — customer-held root, separation of duties, a fingerprint-level rotation ledger — becomes load-bearing and must itself be evidenced.

**Custody of the *record*** — who holds the data whose history you are proving. Participant-held keys do not imply participant-held records: in a relay model the events replicate to servers chosen by the client, so the key stays with the person while the record spreads to third parties. In the edge model the inverse holds: the key is centrally held while the record sits in one accountable tenancy you can name, export, and locate in a jurisdiction.

Chain of custody is only as strong as the weaker of the two. A perfectly sovereign key attesting records scattered across unvetted relays cannot answer "where does our data live"; a perfectly located record signed by a key nobody can rotate cannot answer "what happens when that key leaks." The pairing chosen here — edge-held key, single accountable record plane, publicly verifiable output — is the combination that answers both questions in a form an auditor accepts.

**JWT / JWS / JWE** — three layers of the JSON Web Token family, routinely conflated:
- **JWS (Signed)** — a payload plus a signature. Anyone can *read* it; nobody can *alter* it undetected. Our licence, attestation, and mandate certificates are JWS with EdDSA — deliberately readable, because the point is public verifiability.
- **JWE (Encrypted)** — a payload sealed so only a holder of the decryption key can read it. Used where the *contents* are sensitive rather than merely authentic: the identity plane's PII and payment-adjacent claims travel as JWE, so an intercepted token yields ciphertext rather than a person.
- **JWT** — the umbrella term, and the source of the confusion: a "JWT" may be signed, encrypted, or nested (a JWS wrapped inside a JWE, giving both authenticity and confidentiality). "We use JWTs" says almost nothing on its own; which of the three you mean is the security-relevant fact.

The division of labour matters: **sign what must be provable, encrypt what must be private, and never rely on one to do the other's job.** A signed-only token protecting personal data leaks it to anyone who intercepts it; an encrypted-only token proves nothing to a third party who cannot decrypt it.

**Consent binding** — signing the state of a subject's consent (version, purposes, timestamp) into the certificate issued at the moment of a grant, so a later dispute reads the terms exactly as they stood rather than as they were subsequently edited.

**Provenance** — the recorded origin and history of a data point: not just *that* consent is true, but when it was given, by which mechanism, under which terms version, and on which surface. Regulators increasingly treat the provenance, not the flag, as the evidence.

**Egress path** — the route by which data leaves a managed device or network. Security teams control egress with allowlists, inspection, and residency rules; software that opens connections to hosts the organization has not vetted is an egress-policy problem regardless of how well the payload is signed.

**DLP (Data Loss Prevention)** — controls that inspect outbound traffic for regulated or confidential content. DLP requires inspectable, enumerable destinations, which is why "connects to a client-chosen set of third-party servers" is a difficult posture to approve.

**PWA (Progressive Web App)** — a web application that installs from the browser to a desktop dock or phone home screen from a single build, updates itself on deploy, and works offline via a service worker. It requires no app-store review and no per-platform binary, so it clears endpoint-management review as a URL rather than as software.

**System of record** — the authoritative store for a class of data, against which all copies are reconciled. Here, identity, consent, entitlements, and the ledger; caches and projections elsewhere are explicitly not authoritative.

**Attestation** — a signed statement that some fact was true at a point in time (this image was vaulted, this license was granted, this deletion completed). Its value is that it can be checked long afterward by someone who does not trust, and need not contact, the issuer.

## 10. Verify it yourself

Nothing above is self-attested. The public key set is served at [`/.well-known/jwks.json`](https://crm-sync.dev/.well-known/jwks.json); any certificate issued by this platform — a license grant, a firmware upload attestation, a data-deletion completion record — can be checked against it at [`/license/verify`](https://crm-sync.dev/license/verify) with no account and no trust in us.

---

*Buzz is a product of Block, Inc. This comparison reflects its public launch documentation as of 27 July 2026 and is offered as architectural analysis, not as a claim about its roadmap. Both models are legitimate engineering positions; they optimize against different failure modes, and the right choice depends on whether sovereignty or recoverability is the constraint that binds.*
