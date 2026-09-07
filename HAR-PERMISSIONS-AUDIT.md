---
title: "HAR permissions audit — a portable prompt for testing an e-commerce storefront"
description: "Hand this file and a HAR capture to any AI assistant and get a permissions audit of your own storefront: what the server actually returned versus what the page displayed, whether the consent gate resolved before the tags fired, credentials reaching the client, and what a caller with no browser would see. Evidence-cited, severity-ranked, no findings without a HAR entry."
canonical: https://persephonepunch.github.io/crm-sync-setup/HAR-PERMISSIONS-AUDIT.md
category: "Security"
date: 2026-09-07
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/HAR-PERMISSIONS-AUDIT.md
licence: CC-BY-4.0
---
# HAR permissions audit — a portable prompt

**What this is.** A prompt you can hand to any AI assistant, together with a HAR capture of your
own storefront, to get a permissions audit back. It depends on no vendor, no platform and no
account. Copy the block below, or link this file directly:

```
https://persephonepunch.github.io/crm-sync-setup/HAR-PERMISSIONS-AUDIT.md
```

**Why a HAR.** A HAR records every request and response of a real session, with timings. It is the
only artefact that shows what a server *actually returned*, as opposed to what a page chose to
display — and that gap is where storefront permission failures live. Conditional visibility was
the permission model for twenty years: you could not click what you were not shown. A HAR ignores
what was shown.

---

## Before you start — read this

**A HAR file is a credential.** It typically contains live session cookies, bearer tokens, API
keys in headers, and any personal data that crossed the wire during capture. Treat the file as you
would a password.

- Capture on a **test account** and a **store you own or are authorised to test**.
- In your browser's network panel, **uncheck "preserve log" across logins** if you do not want the
  authentication exchange in the file.
- **Redact before sharing.** Most tools offer "export without sensitive data"; it is not
  sufficient on its own. Search the file for `Authorization`, `Cookie`, `token`, `key`, `secret`,
  `email` before it leaves your machine.
- **Rotate anything that appears in it** once the audit is done, on the assumption it is now
  disclosed.
- Do not upload a HAR from a production session containing a real customer's data.

If you cannot satisfy those, capture a smaller session: one product page, one add-to-cart, one
account page, logged in as a test user.

---

## The prompt

Copy everything between the rules.

---

You are auditing a HAR capture from an e-commerce storefront that the person sharing it owns or is
authorised to test. Your job is to report **what the server returned and when**, and to identify
where authorisation, consent or data exposure depends on something the client controls.

**Evidence rule, absolute.** Every finding must cite at least one HAR entry: the request URL (path
only, query redacted), the method, the status, and the `startedDateTime`. If you cannot cite an
entry, you do not have a finding — say the check was inconclusive and why. Do not infer behaviour
from framework conventions, and do not describe what such a site "typically" does.

Work through these eight checks in order. For each, state **Pass / Fail / Inconclusive**, the
evidence, and the impact in one sentence.

**1 · Returned versus displayed.**
Find responses whose bodies contain fields the page did not show — other customers' records, cost
or margin, unpublished products, inventory counts, internal notes, full objects where the interface
showed one attribute. Hiding with CSS or a template conditional is not a control: if it was in the
payload, it was disclosed. Report the field names, not their values.

**2 · Consent ordering.**
Identify the request that records or resolves the consent decision. Then list every analytics,
advertising or third-party tag request with an earlier `startedDateTime`. A tag that fired before
the decision resolved was not gated, whatever the banner displayed afterwards. Report the time
delta in milliseconds — a gate that opens late is indistinguishable from a gate that works until
someone reads the order the requests actually went out in.

**3 · Credentials reaching the client.**
Search request headers, query strings, cookies and response bodies for anything credential-shaped:
bearer tokens, `X-*-Key` headers, API keys, admin or private tokens, signed URLs with long expiry.
Classify each as **expected public** (a storefront/publishable key designed to be visible) or
**should never be here** (anything admin, private, or write-capable). Name the header or field, and
redact the value to its first four characters.

**4 · Personal data leaving to third parties.**
List every request to a domain other than the store's own, and for each, what personal data it
carried — email, hashed email, phone, address, order contents, order value, customer id. Cross-
reference against check 2: personal data sent to a third party *before* the consent decision
resolved is the most consequential finding this audit produces. State it separately and first.

**5 · Authorisation depending on the client.**
Look for endpoints that return data keyed by an identifier supplied by the client, where nothing in
the request proves entitlement to that identifier — sequential or guessable ids, no `Authorization`
header on a data endpoint, an id in a query string that the response reflects without a session
check. Do not test this by making requests; report the shape and say what a tester should try.

**6 · Cart and checkout integrity.**
Determine whether price, discount, quantity, tax or shipping is computed client-side and sent to
the server, or resolved server-side and returned. If a price or a discount appears in a *request*
body, the client is proposing it — say so, and state whether any response indicates the server
recalculated it.

**7 · Session and transport hygiene.**
For every cookie set: `Secure`, `HttpOnly`, `SameSite`, and expiry. For every authenticated
endpoint: whether the response carries `Access-Control-Allow-Origin: *`, and whether caching
headers would let an intermediary store a personalised response.

**8 · What a caller with no browser sees.**
Distinguish facts present in the initial HTML document from facts injected by later requests. Price,
availability, identifiers, ratings and disclosures that arrive only via client-side fetch are
invisible to any caller that does not execute JavaScript — which includes most crawlers, answer
engines and purchasing agents. List which of those facts are in the document and which are not.

### Output format

Open with a **findings table**, ordered by severity, highest first:

| # | Severity | Check | Finding | Evidence (path · status · time) | Impact |
|---|---|---|---|---|---|

Use four severities and define them by consequence, not by feeling:

- **Critical** — data belonging to someone other than the session holder was returned, or a
  write-capable credential is present in the client.
- **High** — personal data reached a third party before consent resolved, or authorisation depends
  on a client-supplied value.
- **Medium** — data was returned but not displayed, or session hygiene is missing.
- **Low** — machine-visibility gaps, caching, and hardening.

Then, in this order:

1. **What was checked and found clean** — as important as the findings, and the part most reports
   omit. Name each passing check.
2. **Inconclusive checks**, with the specific capture that would settle each one.
3. **What this HAR cannot tell you.** Be explicit. A HAR shows one session by one user in one
   market. It cannot show what a different entitlement would have returned, what a scheduled job
   does, what an erasure actually deleted, or what happens when no browser is involved at all.

**Tone.** State findings, not adjectives. No remediation advice unless asked; if asked, one
sentence per finding. Never speculate about intent — report the behaviour and let the reader
conclude.

---

## What this audit is deliberately not

It is not a penetration test, and nothing in the prompt asks anyone to send a request. It reads a
recording.

It also only covers the half of the estate that renders. Four things it structurally cannot
observe, because they happen when nobody is looking at a page:

- what a **scheduled job** moved overnight,
- whether an **erasure** reached every store or returned success having deleted nothing,
- what an **automated buyer** was permitted to do, and by whom,
- whether a **retry** created a second order.

Those need a different kind of evidence: a record with time in it, produced by something that is
still running when no page is open. Which is the subject of
[Why a runtime is judged by what it holds when nothing is being rendered](https://www.crm-sync.dev/pages/knowledge-base#why-xano-runtime-as-a-service).

## Capturing a good HAR

1. Open a private window and the browser's developer tools, Network tab.
2. Enable **preserve log**, and disable cache.
3. Sign in as a test customer, visit a product page, add to cart, open the cart, open the account
   page. Stop before submitting payment.
4. Right-click the request list → **Save all as HAR**.
5. Redact, per the warning above.

A capture of five to six navigations is enough. Larger files make the audit slower and rarely
change the findings.
