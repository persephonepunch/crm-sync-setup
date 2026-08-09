---
title: "Permissions for AI, in plain terms — capability, not perimeter"
description: "Permissions for AI agents in plain 1-2-3: what RBAC, ABAC, RuBAC, OIDC and OAuth mean, why a filesystem perimeter + Next.js RBAC breaks for AI, and three use cases — household streaming, HIPAA remote 3D printing, and a private mortgage. Money- and privacy-gated. Own your auth (Google/Shopify), run everywhere."
canonical: https://persephonepunch.github.io/crm-sync-setup/capability-not-perimeter.html
category: "Security"
date: 2026-08-09
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CAPABILITY-NOT-PERIMETER.md
---
# Permissions for AI, in plain terms — capability, not perimeter

**For:** BAs, growth marketers, CISOs/DPOs, and the Next.js/Tailwind devs who handle permissions the "senior-dev" way.
**See it live:** [prosthetics demo](https://crm-sync.dev/demo/prosthetics) · [building-inspection demo](https://crm-sync.dev/demo/inspection).

<div style="max-width:760px;margin:1.25rem 0"><div style="position:relative;padding-top:56.25%"><iframe src="https://www.youtube-nocookie.com/embed/Zi5ok36ptXo" style="position:absolute;top:0;left:0;width:100%;height:100%;border:1px solid #B8B0A4" title="Agentic Checkout Needs More Than RBAC — permissions for AI agents (Next.js)" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"VideoObject","name":"Agentic Checkout Needs More Than RBAC — permissions for AI agents (Next.js)","description":"Why capability-based permissions beat RBAC for AI agents at checkout: a signed grant for one action on one record, minted, just-in-time, revocable, verifiable — a PMax-era alternative to Next.js RBAC.","thumbnailUrl":["https://i.ytimg.com/vi/Zi5ok36ptXo/maxresdefault.jpg"],"uploadDate":"2026-08-09","duration":"PT2M24S","contentUrl":"https://www.youtube.com/watch?v=Zi5ok36ptXo","embedUrl":"https://www.youtube.com/embed/Zi5ok36ptXo","publisher":{"@type":"Organization","name":"CRM Sync","logo":{"@type":"ImageObject","url":"https://www.crm-sync.dev/favicon.png"}},"keywords":"agentic checkout, permissions for AI, capability-based access control, RBAC, ABAC, Next.js, OAuth, OIDC"}
</script>

**Watch the 2-minute explainer above**, then do what its **last screen** says: scan or visit **[crm-sync.dev/r/du2qxzd](https://crm-sync.dev/r/du2qxzd)** to try it.

Role-based access control is the right answer to a question we no longer only ask. RBAC answers *"is this **person** allowed in?"* But the actor is now often an **AI agent**, and an agent is inside the perimeter by definition. Here it is in plain terms.

---

## 1 · The problem, in three steps

1. **You secured the app the standard way** — roles behind a locked-down route (RBAC). That is the right answer for a human.
2. **Your customer is now an AI agent**, acting on their behalf — and an agent is *inside the wall by design*. A wall can't scope something already inside.
3. **So you lock everything down.** But that same wall blocks your customer's *consented* AI from finishing the purchase. **Security just killed the sale.**

## 2 · The words, one line each

1. **RBAC** (Role-Based) — access by your **role**. Coarse and static: a role unlocks a whole surface.
2. **ABAC** (Attribute-Based) — access by **attributes** (user, resource, context) checked by a policy. More granular, but the policy lives centrally.
3. **RuBAC** (Rule-Based) — access by **rules/conditions** (time of day, network), authored ahead of time, usually on top of RBAC.
4. **OAuth** — lets an app act **on your behalf without your password**, via a scoped token. "Sign in with Google," "Connect Shopify."
5. **OIDC** — a thin identity layer **on top of OAuth** that proves *who you are*.
6. **Capability / claim** (what CRM Sync uses) — a **signed grant for one action on one record**, carrying its own consent + ISO timestamp, checked **just-in-time**, **revocable by deletion**. Attribute- and rule-aware *and* portable, verifiable, auditable.

## 3 · How CRM Sync does it, in three steps

1. **Claim, not role.** A small key for one action — not a big key for the whole building. *Scope the action, not the room.*
2. **The mint IS the grant.** A link or QR *is* a scoped grant; every use is a signed row in a ledger anyone can verify against a public key. A file behind a login is shared once, shared forever. **A grant is a receipt.**
3. **Three principals, not one.** **Agent** (a scoped, expiring mandate — not a login) · **Peer** (a human teammate) · **View** (read-only). The verbs: **Grant = insert, Revoke = delete, Audit = read.**

---

## Permissions for AI — three use cases

1. **Streaming, for a household.** Stop sharing **one password** (a key to everything, un-revocable, un-auditable). **Mint five scoped grants** — one per member/device. Kick one person off = delete one grant; the other four keep working.
2. **Remote 3D printing of a medical device (HIPAA).** A print file, once sent, is shared forever with no record. Instead, the master stays encrypted and you **mint a per-print grant** — single-use (idempotency key), bound to that printer's device session. Every print is a signed ledger row: chain of custody as a side effect. *(This is the [prosthetics demo](https://crm-sync.dev/demo/prosthetics).)*
3. **Qualifying for a mortgage, privately.** Don't hand the lender your SSN, statements, and tax returns. **Mint a verification grant** that proves the predicates — *income ≥ X ✓, DTI ≤ Y ✓, identity ✓* — without surrendering the documents. The lender verifies the **proof**, not a **copy**. Prove the predicate; keep the data.

---

## Why it's money AND privacy gated (the unique part)

Every principal — a **Peer**, a **Household** member, or an **AI agent** — is gated on **both** dimensions at once:

1. **Money** — the *entitlement*: what was purchased/converted grants which capabilities.
2. **Privacy** — the *consent*: the grant only fires if consent for this purpose exists, right now, with a timestamp.

No role model does both. RBAC has no money dimension and no consent dimension. **The moment the search runs, if a consented, ISO-timestamped grant exists → conversion + a value-weighted (pLTV) audience is enabled — for free.** Behind a fortress RBAC perimeter, the dynamic AI function is *never enabled at all*, so the sale never happens. Security that **sells**, not security that only blocks.

## Why the stakes are enterprise, not startup — the single dev vs. the compliance team

1. **The single dev.** A Turbopack/Tailwind developer builds you a fast, **responsive** e-commerce theme; the agency invoices for it; everyone moves on. A theme is a *look*. **A theme is not a system of record.**
2. **The compliance team.** A real e-commerce operation must keep **running documents** — **geo-stamped and timestamped on the server** (not the client, where anyone can forge them): **Omnibus** 30-day price history, **Consent Mode v2** state per purpose, the **SBOM / CRA** evidence chain — all producible **on demand, in real time**. In the EU the stakes run to the **billions**.
3. **The gap that's left behind.** Those records have to exist **long after the Turbopack/Tailwind dev has left the room and the agency has taken the money for a responsive-only theme.** The theme can't produce them; the *operator is still liable*. A capability model backed by a **hash-chained, server-side, geo- and time-stamped ledger** produces the evidence as a **side effect of normal operation** — it is the shape of the system, and it stays after everyone leaves.

## The choice: rebuild it again, or put the consent flags in a utility

1. **Rebuild the whole thing again.** Every new developer, every new theme, every agency re-implements consent capture, price-history logging, and audit records from scratch — and it breaks the moment they leave.
2. **Consent flags built into a utility.** The consent and entitlement logic lives **once**, as a reusable utility nested inside your frameworks — **remotely updatable without breaking live code**. Swap the theme, swap the developer; the **consent flags and the ledger stay**. You never rebuild compliance — you inherit it.

That is the whole difference: a theme is thrown away and re-bought; a utility with the flags built in is written once and carried everywhere.

## Vanilla, everywhere — own your auth, don't rent it

CRM Sync **owns its auth** — Google OAuth + Shopify OAuth, resolved by `auth/me` — instead of renting a "buy-auth" vendor (Cognito, Clerk, permit.io, Okta, Better Auth) whose fees and egress grow with you. The output is **vanilla**: the same grant gates **Shopify, Webflow, WordPress, Drupal, Sitecore, Adobe Experience Manager, Salesforce Experience Cloud, Azure, and AWS** — including legacy stacks a framework runtime can't reach. It is **described at the edge, per request** — not compiled into one frontend bundle (one build = one point of failure).

---

## See it — the video's last screen

Watch the 2-minute explainer to the end, then do exactly what the final screen shows:

> **Scan the QR, or visit [crm-sync.dev/r/du2qxzd](https://crm-sync.dev/r/du2qxzd)** — the grant applies, and you can try it.

*Verify any grant yourself against the public key at [`/.well-known/jwks.json`](https://crm-sync.dev/.well-known/jwks.json). No account required — that is the point.*

**The one-line version:** RBAC asks *"are you inside?"* A capability asks *"may you do exactly this, right now — and can anyone verify it later?"* The senior-dev answer for humans is the wrong answer for agents.
