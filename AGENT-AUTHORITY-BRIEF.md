---
title: "Agent Authority — Technical Brief"
description: "For teams already building agent workflows: the mandate model (scope, cap, expiry, revocation), how authority resolves per call rather than at the boundary, MCP integration with scoped tokens, and public verification against a published Ed25519 key."
canonical: https://persephonepunch.github.io/crm-sync-setup/agent-authority-brief.html
category: "Security"
date: 2026-07-27
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/AGENT-AUTHORITY-BRIEF.md
licence: CC-BY-4.0
---
# Agent Authority — Technical Brief

**For:** engineering teams already running agent workflows in production or close to it.
**Assumes:** you are past "should agents act on our behalf" and into "what stops one doing something we cannot explain afterwards."
**Companion:** [Two Ways to Give an Agent a Key](https://persephonepunch.github.io/crm-sync-setup/agent-key-custody-models.html) for the architectural comparison; this document is the implementation shape.

## The three failure modes you are probably carrying

Most agent stacks reach production with these unresolved, not through carelessness but because every framework hands you a credential and stops there.

**1. Shared credentials.** The agent runs as a service account or an API key. It works. It also means you cannot answer *which agent did this*, cannot revoke one without breaking the others, and cannot cap one differently from another. A credential is not an identity, and no amount of downstream logging reconstructs the attribution you never captured.

**2. Boundary-time authority.** Permission is checked when the agent authenticates, then assumed for the session. But the interesting question is per action: *is this actor allowed to do this specific thing, at this scope, right now, under the consent currently in force.* Session-scoped authorization cannot express a spend cap or a consent state that changed five minutes ago.

**3. Unrecorded decisions.** The agent acted, the effect landed, and nothing recorded what it was permitted to do at that moment. When someone asks later — an auditor, a customer, your own incident review — the reconstruction is inference, and it gets weaker with time.

<h2 class="jumbo">Verification for AI, and the <strong>data-shape revisions</strong> it forces</h2>
<p class="jumbo-sub">You are almost certainly running agents on service credentials today, because that is what every framework hands you. The alternative is a mandate.</p>

## The model

Three objects, all resolved server-side.

**Entitlement** — what a subject may do. A set of capability flags plus scope qualifiers (brand, market, channel, shop) and a state. Held against the subject, not the session. Resolved on every call.

**Mandate** — what an *agent* may do on a principal's behalf. A signed grant carrying a spend cap, a scope, an expiry, and the rail it may settle on. The agent never holds the principal's credentials; it holds a bounded, revocable permission. Revoking it is a single operation that affects nothing else.

**Certificate** — proof, after the fact. Ed25519-signed, embedding the terms and the consent state as they stood at issue time, verifiable by anyone against a published key.

The distinction that matters: **a signature proves authorship, a mandate proves authority.** A signed event reading "the agent spent $40,000" is a perfect record of an unauthorized purchase. The system should have refused it.

## Endpoints

All authenticated calls take `Authorization: Bearer <token>`. Unauthenticated requests return `401`, not a redirect.

| Endpoint | Method | Purpose |
|---|---|---|
| `/commerce/agents/authorize` | POST | Issue a mandate: `{agent_label, max_amount, scope, rail}` → signed grant, revocable |
| `/entitlement` | GET / POST | Read or merge a subject's capability set |
| `/entitlement/token` | POST | Mint a short-TTL token carrying the subject's current entitlement snapshot |
| `/entitlement/verify` | POST | Verify such a token — signature, expiry, and terms |
| `/entitlement/cap-check` | GET | Diagnostic: does subject X hold capability Y, at scope Z |
| `/mcp` | — | Streamable HTTP MCP server; tools resolve the caller's claim per call |
| `/.well-known/jwks.json` | GET | Public key set. No auth. This is the verification anchor |
| `/license/verify` | GET | Check any certificate this platform issued, no account required |

<h2 class="jumbo">You don't need procurement or expensive apps. <strong>Set this up yourself.</strong></h2>
<p class="jumbo-sub">The verification endpoints are public. Check a certificate against a published key in about ninety seconds, with no account and no call to us.</p>

## Verify before you read further

This takes about ninety seconds and needs no account.

```bash
# 1. The public key set — Ed25519, with a key id
curl -s https://crm-sync.dev/.well-known/jwks.json

# 2. Authority is enforced, not advisory
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://crm-sync.dev/entitlement/token -d '{}'      # → 401

# 3. A certificate verifies against the published key, from anywhere
#    (any /license/verify?cert=… link from an account's Licenses panel)
```

The point of publishing the key rather than an API for verification: an auditor, a customer or a counterparty checks a certificate **offline**, without an account, without calling us, and without trusting that we answered honestly.

<h2 class="jumbo">Use a server to extend <strong>mature, easy-to-use MCP tools</strong></h2>
<p class="jumbo-sub">The agent does not need to understand your permission model. It needs a token that is already bounded, and a server that resolves the claim on every call.</p>

## MCP: how an agent reaches capability

The MCP server exposes tools over Streamable HTTP. The relevant design decision is not the transport — it is that **the agent carries a bounded token and the server resolves the claim on every tool call.**

- The agent is issued a scoped token, not a credential.
- Each tool call resolves the caller's entitlement server-side before doing anything.
- A call outside scope, over cap, or past expiry is **refused**, not logged-and-permitted.
- The refusal is recorded, as is the grant. Denials are evidence too.

Practically this means an agent needs no understanding of your permission model. It needs a token that is already bounded. That is what makes a misbehaving agent a non-event rather than an incident: the boundary is enforced where the effect happens, not where the agent was configured.

<h2 class="jumbo">When documentation is what <strong>avoids the penalty</strong>, build it from data you can actually reach</h2>
<p class="jumbo-sub">Authority resolved at event time, per call — not inferred later from a nightly sync. If you are building agent workflows on batch data, you already know it does not hold.</p>

## Where the record lives

Three planes, deliberately separate, failing independently:

- **System of record** (Xano — SOC 2) — identity, consent, entitlements, the hash-chained ledger. The only plane holding data of record.
- **Edge** (Cloudflare Workers) — signing, capability checks, verification endpoints. Native WebCrypto Ed25519; private key material in the platform keystore, never in the client, never in the repo.
- **Interface** — published independently of both.

Keys are **rotatable**: mint a new pair, repoint the active identifier, and certificates issued afterwards carry the new key while earlier ones remain verifiable against the published, retired key. A suspected compromise is a pointer flip rather than an identity loss — which is precisely what participant-held key models cannot offer.

## What this costs to try

Nothing, and no procurement. The orchestration backend is free on signup in about five minutes, and the service level buys support, scale and governance rather than capability. One engineer can stand up identity, entitlements, mandates and the ledger in their own scope, prove it against real calls, and hand it over as a functional specification rather than an infrastructure request. Because the substrate is already SOC 2 certified, that handover is a commercial step, not a re-platforming.

## The short version

If you are building agent workflows, you will need four properties, and you will need them before an incident rather than after:

1. **Per-agent identity** — not a shared service credential.
2. **Per-call authority** — scope, cap and expiry evaluated where the effect happens.
3. **Revocation that is surgical** — kill one mandate without touching anything else.
4. **A record a third party can verify** — including the denials.

None of it is exotic cryptography. It is a claim in a token, a check on a call, and an append-only row — assembled from primitives your platform already ships.

---

*Every endpoint above is live. If something in this document does not behave as described, that is a bug worth reporting rather than a caveat.*
