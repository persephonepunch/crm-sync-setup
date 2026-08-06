---
title: "Trust With Login — The Bind Is the Product"
description: "Why this login is different: it binds the Shopify and Google accounts you already own, reset never dead-ends, permissions are read from the entitlement register rather than an installed app, and the same grant gates WordPress, AEM, Salesforce, Webflow, Next, Nuxt, Svelte, and Astro. Every sign-in is a ledger event."
canonical: https://persephonepunch.github.io/crm-sync-setup/trust-with-login.html
category: "Security"
date: 2026-08-06
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/TRUST-WITH-LOGIN.md
---
# Trust with login — the bind is the product

**For:** business and design stakeholders evaluating how a login can be trusted, security reviewers asking what happens when apps are removed, and developers who have been told "add SSO" and want to know what the stronger version looks like.

We are a publishing entitlement system. That identity starts at the login — and the login is different in five specific, checkable ways.

## 1. The bind is the product

Our login does not create a new credential. It **binds two accounts the merchant and the customer already own**: the Shopify account (the commerce identity — orders, purchases, entitlements) and the Google account (the federated identity — OpenID Connect, signed ID tokens verified against Google's published keys).

Sign in with either door. The session lands on the **same subject row** in the same System of Record. One accountable identity, two ways in, nothing new to install — and nothing new for enterprise procurement to refuse, because both identity providers are already inside the building.

The technical name for this pattern is federated login; the protocol carrying the Google half is OIDC. What matters to the person trusting it is simpler: **an ID token is a signed, verifiable claim from a named issuer** — the same trust shape as every other record in this system. We never take an identity's word for it; we verify the signature.

## 2. Reset is a right, not a dead-end

Because identity here is an **axis bound to federated providers** — not a password column in an application's private database — account recovery rides the provider's own reset. Lose a password, recover at Google or Shopify, and the bind holds. Losing a credential never orphans the account.

The industry has already seen the failure mode this prevents: a downloaded peer application that holds identity as a local credential, with no SSO, no admin recovery, and no path back into your own account when the credential dies. When identity is a column, reset is a favor. When identity is an axis, reset is a right.

## 3. Permissions come from the register, not the install

What a session may *do* — human or AI agent — is read from the **entitlement register at call time**: capability rows, scopes, spending caps, market grants. The grammar is three verbs:

**Grant = insert. Revoke = delete. Audit = SELECT.**

Notice what is *not* in that grammar: install, update, uninstall. App-bound permission models tie authority to a software lifecycle — installing grants it, updating mutates it, uninstalling maybe revokes it and maybe orphans it, and nobody can prove which, because the permission's existence was entangled with a binary's presence on someone's machine.

Row-bound permission has no such entanglement. And the dashboard that displays your grants — the role console, the "choose your view" screen — is deliberately **just UX**: a window onto the register, never the container of it.

> The dashboard shows the grant. The register holds it. Uninstall everything — the permission still answers.

## 4. The gate travels; the host never holds it

The same grant gates **WordPress, AEM, Salesforce Experience, Webflow, Next, Nuxt, Svelte, and Astro** — because none of them are asked to enforce anything. The surface renders; the element or embed calls the worker; the worker reads the grant row and decides. Every host receives the identical yes or no from the identical register, and no host is trusted with the authority it displays.

Compare the alternative: an app-bound model must be *reimplemented per platform* — a WordPress plugin's permissions, a Salesforce package's permissions, an AEM configuration — eight platforms, eight permission systems, eight audit surfaces, eight ways to drift. The row-bound model is implemented **zero times per platform**; the platforms are consumers of a decision made elsewhere.

> Eight frontends, one gate. Adding a platform adds a tag — never another permission system to audit.

## 5. Every login is a ledger event

A sign-in here is not a state change that evaporates — it lands in the same append-only evidence plane as every consent, grant, and price observation: which subject, which provider, which session, what consent posture rode with it. "Who was in the account, and under what authority?" is a query, not a reconstruction.

That includes the forms that precede login. A visitor who submits a form is registered on the same identity spine — the same subject row a later Google or Shopify sign-in binds to — with their consent claims already recorded. The form creates the subject; login upgrades it to an authenticated session; entitlement rows govern what that session may do. One row, three stages of trust, every stage witnessed.

## Why an enterprise can allow this — and cannot allow the alternative

The federated bind **inherits the enterprise's existing identity governance**. The customer's Google or Shopify policies — two-factor requirements, session controls, offboarding — keep working, because those providers still own authentication. Nothing is asked of the security team except to verify what is already true.

And the application itself lives where platforms govern applications: a **registered Shopify app** (listed on the Shopify App Store), a **registered Webflow app**, delivered through the Cloudflare helmet — reviewed distribution channels the platforms themselves audit and can revoke. Not a binary downloaded from a vendor's website; a publication inside three platforms' own governance.

The installed-peer alternative *bypasses* that governance: a local credential distributed like shadow IT, invisible to SSO, unrecoverable by admins, revocable only by hoping the uninstall happened. That is not a smaller version of trust; it is a different and unauditable one — which is why it cannot be allowed on enterprise systems, and why this can.

The one-sentence version, for the person who signs:

> **Your people sign in with accounts your company already governs. What they may do is a row you can read, grant, and revoke. And every use of that permission is on the record — with a signature you can check yourself.**
