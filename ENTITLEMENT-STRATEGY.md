---
title: "Entitlement Strategy — RBAC, ABAC, RuBAC & Permissions for AI Agents"
description: "How RBAC, ABAC, and RuBAC actually relate; why WordPress roles, AWS IAM, and Azure RBAC stop at the door; and how an entitlement plane with purchase-granted capability caps, envelope encryption, and AP2 mandates gates AI agents."
canonical: https://persephonepunch.github.io/crm-sync-setup/entitlement-strategy.html
category: "Security"
date: 2026-07-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/ENTITLEMENT-STRATEGY.md
---
# Entitlement Strategy — RBAC, ABAC, RuBAC & Permissions for AI Agents

**From role gates to policy bound to data.** How RBAC (role-based), ABAC (attribute-based), and RuBAC (rule-based) access control actually relate; why role-based perimeters — WordPress roles, AWS IAM, Azure RBAC — stop at the door; and how the entitlement plane extends the same discipline to a subject the incumbents were never designed for: the AI agent.

**PDF:** [entitlement-strategy.pdf](https://crm-sync.dev/kb/media/docs/entitlement-strategy.pdf)

---

## 1 · Thesis

Every mainstream permission system answers one question: *who may open the door?* The questions that decide real-world outcomes are different: *what does this specific subject hold, right now, on this specific object, under which terms — and how do we take it back?* The entitlement plane answers those. Policy is **data** (purchase-granted roles carrying scoped capability caps), enforcement is at the **data plane** (per-asset envelope encryption; possession of bytes is worthless without a grant), revocation is an **operation** (rotate one key, every outstanding copy dies), and every decision leaves **evidence** (a hash-chained ledger, verifiable against a published key at `/.well-known/jwks.json` by anyone — no account, no trust in the platform required).

## 2 · The door-check pattern: three incumbents, one failure joint

| | WordPress roles | AWS IAM | Azure RBAC / Entra |
|---|---|---|---|
| **Model** | Roles = flat bundles of global capabilities (`edit_posts` = all posts) | Identity policies over control-plane APIs; tag-based ABAC governs *resources*, not app users | Role assignments at scopes; ABAC conditions narrow (e.g. blob storage) |
| **Granularity stops at** | Site / post-type; per-object needs plugins enforcing in PHP | The AWS resource boundary — app users/objects are "your problem" (hence Cedar) | The Azure resource boundary; app roles are coarse token claims |
| **The naked file** | `wp-content/uploads` = public URL, zero policy | S3 presigned URL = bearer access, irrevocable until expiry | SAS tokens = same bearer pattern |
| **Revocation** | Role change ≠ recall of anything served | Policy change ≠ recall of presigned URLs | Assignment change ≠ recall of issued tokens |

All three are **perimeter authorization over containers**. None bind policy to the data itself; all three have weak revocation. The industry has conceded the gap — AWS shipped **Cedar / Verified Permissions**, Google published **Zanzibar** (now OpenFGA), and **OPA** exists — all policy-as-data engines, all built because role gates do not compose into application-level authorization. The entitlement plane is the same conclusion, plus the step none of them take: cryptographic enforcement at the asset.

## 3 · RBAC, ABAC, RuBAC — the layered model is the standard

- **NIST SP 800-162** (Guide to Attribute Based Access Control) frames RBAC as a *special case* of ABAC in which the evaluated attribute is "role." The role check is the first layer of the general model, not an alternative to it.
- **Kuhn, Coyne & Weil, "Adding Attributes to Role-Based Access Control"** (IEEE Computer, June 2010) — by authors of the RBAC standard itself — endorses the *role-centric hybrid*: roles set the ceiling; attributes constrain within it.
- **Where RuBAC fits.** Rule-based access control evaluates condition rules — time windows, network, object state — against a request. In NIST's framing it is the policy half of ABAC: attributes describe the subject, object, and context; rules decide. A mature stack layers all three.

> Purchase-granted roles carrying scoped capability caps are the Kuhn role-centric hybrid, implemented: the purchase grants the ceiling (**RBAC**); the caps, entitlement state, and consent snapshot are the attributes (**ABAC**); their evaluation per object, per request, is the rule layer (**RuBAC**).

## 4 · The entitlement plane, concretely

- **Grant, not file.** Assets sealed in per-asset envelopes (AES-256-GCM); delivery is server-side decryption against the caller's entitlement, per request. No public URL to leak, cache, or scrape.
- **Policy as data.** Entitlements are records — purchase-granted, scoped, per-subject, revocable — evaluated at request time. Changing policy is a state change, not a redeploy.
- **Revocation heals.** Rotating an asset key kills every outstanding envelope copy at once — one recorded operation.
- **Decisions leave evidence.** Every mint, grant, denial, download, and revocation lands in a hash-chained ledger; certificates are Ed25519-signed and third-party-verifiable against the published JWKS — the accountability record GDPR expects and the artifact CRA Article 14 reporting presumes.
- **Coexistence, not replacement.** The plane sits beside WordPress, AWS, and Azure estates: they keep governing their containers; the entitlement plane governs the objects and subjects they cannot see.

## 5 · Permissions for AI Agents — the subject the incumbents never modeled

Role systems assume a human who logs in occasionally and holds standing permissions. An AI agent is the opposite subject: it acts continuously, delegates, and cannot safely hold a role-wide grant — an agent with "Editor everywhere, forever" is an incident report with a timestamp. Agent authorization requires exactly the properties the entitlement plane already has:

- **Agents are first-class subjects** in the same engine — no parallel permission vocabulary. Agent capability is gated by an explicit cap (`caps.a2a`), granted and revoked like any entitlement.
- **Mandates, not sessions.** Autonomous purchase runs under an AP2-style mandate: a scoped, time-boxed, consent-anchored authorization for a *specific* action envelope (`create_mandate` → `agentic_checkout`). The mandate is the ceiling; caps constrain within it — the Kuhn hybrid applied to machines.
- **Identity travels encrypted.** The acting party is resolved server-side from a decrypted JWE token — never from a claim the agent asserts about itself. An agent cannot name its own principal.
- **Consent is an input, not a footnote.** Agent actions evaluate the subject's consent snapshot at decision time, and the snapshot is signed into the resulting certificate.
- **Every agent action is ledgered.** Agent-initiated grants, purchases, and denials land in the same hash-chained record as human actions — one audit surface, machine and human alike.
- **Tool surfaces are gated.** Agent-facing interfaces (MCP tools) expose only operations the caller's entitlements permit; the tool list is a projection of the grant.

> Principle: **agents get entitlements, never roles.** A role is standing power; an entitlement is a scoped, revocable, evidenced grant. Standing power plus autonomy is how AI incidents happen.

## 6 · Strategy summary

| Layer | Question it answers | Mechanism |
|---|---|---|
| RBAC gate (door) | Who may enter at all? | Roles — including the incumbents' (WP/IAM/Azure), which coexist |
| Capability caps (ABAC) | What can this subject do here, now? | Purchase-granted scoped caps per request (NIST 800-162 / Kuhn hybrid) |
| Rule layer (RuBAC) | Under which conditions? | Per-request evaluation of caps, entitlement state, consent |
| Agent mandates | What may this *machine* do, for whom, until when? | AP2 mandates + `caps.a2a` + JWE-resolved principal + consent snapshot |
| Data-plane crypto | What if every layer above fails? | Envelope encryption; leak yields ciphertext; rotation = revocation |
| Evidence | Can anyone prove what happened? | Hash-chained ledger; Ed25519 certificates; public JWKS verification |

## 7 · References

- NIST SP 800-162, *Guide to Attribute Based Access Control* — <https://csrc.nist.gov/pubs/sp/800/162/upd2/final> ([PDF](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-162.pdf))
- Kuhn, Coyne, Weil, "Adding Attributes to Role-Based Access Control," *IEEE Computer* 43(6), 2010 — <https://csrc.nist.gov/files/pubs/journal/2010/06/adding-attributes-to-rolebased-access-control/final/docs/kuhn-coyne-weil-10.pdf> (DOI 10.1109/MC.2010.155)
- NIST ABAC project overview — <https://csrc.nist.rip/projects/abac/>
- NIST SP 800-207, *Zero Trust Architecture* — <https://csrc.nist.gov/pubs/sp/800/207/final>
- Amazon Cedar / Verified Permissions; Google Zanzibar (USENIX ATC 2019) / OpenFGA; Open Policy Agent — the industry's policy-as-data concessions.
