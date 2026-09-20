---
title: "A Template Is Not a Permissions Boundary"
description: "Moving decisions out of Liquid, AEM, WordPress and Drupal templates into a server-side permissions boundary with edge rules, payload encryption through the presentation tier, and a publish path an AI agent can be given safely."
canonical: https://persephonepunch.github.io/crm-sync-setup/template-is-not-a-boundary.html
category: "Specs"
date: 2026-09-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/TEMPLATE-IS-NOT-A-BOUNDARY.md
licence: CC-BY-4.0
tags:
  - architecture
  - security
  - shopify
  - webflow
---

# A Template Is Not a Permissions Boundary

**For architects, platform leads, and the officer accountable for what the storefront discloses.**

> Template languages were built to arrange content. They have been asked, one feature at a time,
> to decide who may see a price, which customer gets which catalogue, and whether a field is
> rendered. **Hiding a control is presentation. Refusing a request is enforcement.** Only one of
> those survives someone opening the network tab.

**Scope.** This is the general argument, across four presentation tiers. The Shopify-specific
instance of it — Dawn's client-side logic re-homed to Horizon with cart, pricing and checkout in
server-side Functions, against dated deprecations — is
[Dawn to Horizon](https://www.crm-sync.dev/pages/knowledge-base#dawn-horizon-ga4). Read that one
if the estate is a Shopify theme; read this one if it is four platforms and a principle.

---

## Summary — challenge, solution, opportunity, risk

### Challenge

Business logic has accumulated in the presentation tier because that is where it could be
reached quickly. A merchandiser needed a rule, the template was editable, and the rule went in.
Repeated across years, the result is an estate where **who may see what** is decided in Liquid
conditionals, PHP theme functions, and AEM components — code that is edited by people with
content access, rarely reviewed as code, and in some cases runs on infrastructure the
organisation does not own.

Three consequences follow, and none is hypothetical:

- A decision made during rendering has **already fetched the data** it decided to hide. The value was retrieved, passed through the tier, and then omitted from the output.
- The same rule exists in several templates and drifts between them, so the answer depends on which page you ask.
- Nothing can attest to the rule. When a regulator or a customer asks *who was allowed to see this*, the answer is a code read across several repositories rather than a record.

### Solution

The template asks. The boundary answers. Nothing else changes about how pages are built.

- **One server-side permissions boundary** that every path calls and that can **refuse** — not hide, refuse.
- **Rules at the edge** for the discipline that needs no code: response headers, origin routing, rate limits on anything that mints work.
- **Payload encryption through the presentation tier**, so a template renders an envelope it cannot itself open. The CMS holds ciphertext, which means a CMS compromise discloses ciphertext.
- **A publish path an agent can be given** — content, not code — so AI-assisted publishing does not mean handing an agent the template layer.

### Opportunity

- **One answer, everywhere.** The same question from a storefront, an app, an agent or an export returns the same result, because it is the same call.
- **Evidence instead of archaeology.** A permissions decision becomes a row with a subject, a scope and a time — answerable in a query rather than a code review.
- **Platform independence.** When the decision is not in the template, replacing the presentation tier stops being a re-implementation of the business rules.
- **Safe AI publishing.** An agent can be given a content surface with a real boundary in front of it, which is the difference between using agents and hoping about them.

### Risk of inaction

| Risk | Exposure | Severity |
|---|---|---|
| Data fetched then hidden by the template | The value is in the response, the cache or the log. Hidden is not withheld | **Critical** |
| Rule drift across templates | Disclosure depends on which page asks. Untestable, and it fails quietly | **High** |
| Template editable by content roles | Change control on a security decision is a content workflow | **High** |
| An agent given template write access | A template is code; write access to it is code execution in the presentation tier | **Critical** |
| No record of the decision | Regulatory questions answered by reading source, under deadline | **High** |

---

## What each platform can actually do

The four estates differ, and the differences decide how urgent this is.

| Platform | The tier runs | Can it reach data and secrets? | The specific hazard |
|---|---|---|---|
| **Shopify Liquid** | On Shopify's infrastructure, sandboxed — no arbitrary code, no outbound calls | No | **Its limits are a feature.** Liquid cannot enforce, which is fine, because it also cannot be made to. The hazard is believing a Liquid conditional withheld something |
| **AEM (HTL + OSGi)** | Your JVM, full application privilege | Yes — repository, services, credentials | Component code with production access, authored in a content-centric workflow |
| **WordPress (themes, plugins)** | Your PHP, unrestricted | Yes — database, filesystem, network | A theme function is arbitrary code running as the web user. Plugin surface multiplies it |
| **Drupal (modules, preprocess)** | Your PHP, with a real internal permission model | Yes | Better structured than WordPress, and still PHP with database access in the render path |

**The gradient matters.** Liquid is the safest and the most misleading: it cannot do harm and it
cannot enforce, so logic placed there is *presentation wearing the costume of a rule*. PHP is the
opposite — it can enforce, and it can also do everything else, in a file a content editor can
sometimes change.

## The migration, in the order that keeps the site up

1. **Inventory the decisions, not the code.** Every conditional that depends on *who is asking* — customer tag, market, price list, logged-in state, entitlement. That list is the scope; template line count is not.
2. **Move the data fetch behind the decision.** This is the step that actually closes the exposure and it is usually skipped. A template that renders nothing but whose page still fetched the value has not been fixed.
3. **Stand up the boundary as a single call.** One function, server-side, that takes subject and scope and returns allow or refuse — with the refusal logged.
4. **Replace conditionals with requests.** The template asks the boundary and renders the answer. It holds no rule of its own.
5. **Put edge rules in front** for the header and routing discipline that needs no application change.
6. **Encrypt what must cross the tier** so that the presentation layer carries an envelope rather than a value.
7. **Delete the old conditionals.** A rule that still exists in a template will be the one someone edits.

## Payload encryption through a tier you do not trust

Where a value must pass through the presentation layer to reach a specific recipient, encrypt it
**to that recipient**, not to the tier. The template renders an opaque envelope; the entitled
party opens it client-side or at another service.

This changes what a compromise yields. A breached CMS, a leaked template, a misconfigured cache
or an over-broad content role discloses ciphertext. It is the same reasoning as a payment page
that never holds a card number: **the safest handling of a value is not handling it.**

It costs key management, and it is worth it exactly where the data is regulated and the tier is
shared, editable, or someone else's.

## Giving an agent a publish path

The pressure to let AI publish is real, and the naive implementation is dangerous in a way that
is easy to miss.

**A template is code.** Liquid, HTL, a PHP theme file — write access to any of them is execution
in the presentation tier, with whatever that tier can reach. An agent with template write access
is not a content tool; it is a deployment tool with no review step.

The safe shape is the boundary again:

- The agent writes **content**, into a typed, validated structure — never a template, never markup with logic in it.
- The publish route is **entitlement-gated** like any other write, under a mandate that is time-boxed and scoped.
- Publication is an **event with an actor**, so the record says which agent, acting for whom, published what and when.
- Templates stay in version control with human review, because that is where the executable part lives.

Which is the same sentence as everywhere else in this estate: **an AI step is permitted work, not
permitting work.** Give it a surface, put a boundary in front of the surface, and keep the
executable layer out of its reach.

## What to do next

1. **Find the fetch-then-hide cases first.** Any template that retrieves a value and conditionally omits it. Highest severity, and usually a small list. *Owner: platform.*
2. **Pick the one rule that exists in the most places** and move it behind a single call. It proves the pattern and removes the worst drift. *Owner: architecture.*
3. **Audit who can edit templates**, and compare that list to who may change a security decision. If they differ, the boundary is not where you think. *Owner: security with platform.*
4. **Before any AI publishing**, confirm the agent's write path reaches content and not templates. *Owner: whoever sponsors the agent.*
