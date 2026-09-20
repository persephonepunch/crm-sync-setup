---
title: "Server-Side or It Didn't Happen — Developer Due Diligence for Commerce"
description: "A theme that looks right is not a system that is right. Why the jeopardy lives in cart, checkout, returns, fraud, and remittance; why functions stay server-rendered and shape-gated; why the record is part of the deliverable — and who carries what you didn't write down."
canonical: https://persephonepunch.github.io/crm-sync-setup/server-side-or-it-didnt-happen.html
category: "Security"
date: 2026-08-05
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SERVER-SIDE-OR-IT-DIDNT-HAPPEN.md
licence: CC-BY-4.0
tags:
  - theme
  - consent
  - security
  - shopify
  - architecture
keywords:
  - server-side rendering
  - cart
  - checkout
  - returns
  - RMA
  - fraud
  - remittance
  - tax nexus
  - consent gating
  - Omnibus price history
  - evidence records
  - definition of done
  - due diligence
about:
  - E-commerce architecture
  - Regulatory compliance in commerce
  - Consent and tracking
  - Software quality assurance
---
# Server-Side or It Didn't Happen

**For:** developers building or extending e-commerce themes — and the
business and design stakeholders who pay for that work.

## Developer due diligence

Your role does not stop because you made something that looks like it
works. A cart that renders, a banner that appears, a checkout that
completes — those are rendering claims, and every one of them can be true
while the organization is in penalty territory, because the jeopardy never
lived in what the user sees. It lives in what the system **wrote down**:
the consent that gated the tag, the session the choice was tied to, the
record the price claim rests on, the report the tax event must trace to.

The definition of done changes accordingly. A feature is not done when the
UI passes review. It is done when the evidence writes — when the red/green
test asserts not just that the button works, but that the ledger row
exists, the shape passed the gate, and nothing reachable from the browser
can skip either.

## Who the diligence is for

You have to support the business and design stakeholders who pay for your
time and effort — and support means more than delivering what was asked.
The person who signs your acceptance form is personally holding the risk
of what your build records or fails to record, long after you've moved to
the next ticket. The designer whose work rides on your system gets judged
by what it does, not just how it looks. When you ship something that looks
like it works, the gap between *looks* and *is* doesn't disappear — it
transfers, silently, onto the people who trusted you enough to pay for it.

Due diligence isn't gold-plating, and it isn't scope you sneak past a
deadline. It **is** the deliverable.

## A theme that looks right is not a system that is right

A Tailwind theme plus plugins can render a perfect storefront and still
put the organization in penalty territory. The jeopardy concentrates at
five entry points — **cart, checkout, returns (RMA), fraud, and
remittance for fulfillment** — because every event at those points creates
an obligation: a consent to honor, a price reference to substantiate, a
tax-nexus report to file. Each obligation must trace to an auditable
record, and none of them is visible in a screenshot.

Consumer-commerce regulation now reaches further than banking rules ever
reached a merchant: banking compliance applies to banks with compliance
departments; Omnibus, GDPR, the CRA, and nexus reporting apply to **every
seller**, with penalties measured in percent of global turnover — and, in
the US, private lawsuits with statutory damages per session.

## The client-side banner: three failures, each worse

The default consent implementation — a JavaScript banner — fails three
ways, in escalating order:

1. **It doesn't gate.** Tags, pixels, and session-replay scripts routinely
   fire before the visitor chooses. The banner renders while the recording
   already runs.
2. **It doesn't reach.** A decline mutates that page's JavaScript state.
   The next page, the other storefront, and every server-side integration
   never hear the no.
3. **It doesn't record.** The choice is stored as a cookie **in the
   visitor's own browser**. The organization keeps no copy. GDPR
   Article 7 puts the burden of demonstrating consent on the controller —
   and a cookie on the subject's device is the controller holding no
   evidence at all.

That third failure is the fact pattern at the base of the wiretap
class-action wave (CIPA §631 and its state siblings; Revlon was among the
named defendants): when discovery asks *"prove this visitor's session was
not recorded after she declined,"* a client-side stack has nothing to
produce. The absence of the record **is** the case. Statutory damages run
$5,000 per violation — arguably per session — with no regulator required.

### The forty days nobody noticed

The regulator has now said it directly. In May 2025, California's privacy
agency fined **Todd Snyder, Inc.** — a Shopify Plus menswear retailer —
**$345,178** (CPPA enforcement action, public record). For roughly **forty days** its
third-party consent banner was silently broken: visitors clicked opt-out,
the requests went nowhere, and tracking continued. Nobody inside the
company noticed, because there was nothing that *could* notice — no
server-side register in which forty days of missing opt-out rows would
have read as an alarm. The CPPA's stated lesson: deploying a
consent-management platform does not outsource the obligation — the
business must verify its tools actually work.

The same action's second finding completes the picture: the retailer
demanded photo identification before honoring privacy requests — friction
as a dark pattern, over-collection in the name of verification. Both
findings are records failures with the same cure. A server-side register
makes the first failure impossible to miss — a broken banner shows up as
the row count going to zero **the same day**, not the day the regulator
calls. And it makes the second unnecessary — the session-joined record
*is* the verification, no photo ID required. A theme can pass every visual
QA on earth while its consent tool is broken; only a register knows the
difference between quiet and silence.

## The rule that makes it safe

UI may be added to any theme — AI-generated, red/green test-driven,
vanilla code injected into whatever the agency built — **provided the
functions stay server-side**:

- **Server-rendered, shape-gated functions:** if the data shape does not
  pass, the function blocks. That block *is* the security rule an auditor
  verifies — not a nice-to-have. A function reachable from front-end
  JavaScript is not a control; it's a suggestion.
- **Controlled substrates:** both Shopify (Functions) and Adobe (AEM edge
  functions) execute these bundles server-side, in environments public
  crawlers cannot reach. The pattern is portable because the platforms
  already enforce it.
- **The encryption line:** moving user PII or PCI data from third party to
  first party legally requires encryption — expose it once and the SOC 2
  posture is void: the auditor's assurance collapses the moment the
  evidence shows exposure. (PCI DSS Req. 3–4 mandate it outright; GDPR
  Art. 32 names encryption as the appropriate measure; several US states
  mandate it by statute.)
- **The register:** every consent — yes and no — every grant, every price
  observation, every gated push writes a timestamped, session-joined row
  the organization holds. When someone says *produce the record*, it's an
  export, not an excavation.
- **The agent's reach:** the line above says UI may be AI-generated. It is
  worth saying what that does *not* extend to. A Liquid file, an HTL
  component, a PHP theme function — these are **code**, and write access to
  them is execution in the presentation tier with whatever that tier can
  reach. An agent may be given **content**, into a typed and validated
  structure, behind an entitlement-gated publish route, with the
  publication written to the register as an act by a named agent on
  someone's behalf. It may not be given the executable layer. That stays in
  version control with human review, for the same reason the functions stay
  server-side: an AI step is permitted work, not permitting work.

## One record, three content systems — demonstrated

This is not a proposal. The pattern runs today across three unrelated CMSs
bound to one endpoint: the Shopify storefront's evidence page, the
Webflow-fed collection, and an AEM Edge Delivery page — the same JSON, the
same fail-closed branch, and no surface holding a copy that can drift.

![EU price-evidence cards rendering on AEM Edge Delivery — every card
fail-closed until the observation record covers the full window](https://crm-sync.dev/kb/media/docs/aem-omnibus-live-2026-08-05.png)

Live: [www.crm-sync.dev/pages/omnibus](https://www.crm-sync.dev/pages/omnibus)
(the store surface). The AEM capture above shows the identical record
rendered by Adobe's CMS through a thin block that authors only a product
handle — the page stores no rows, so there is nothing on it to go stale.

![The same site chrome and consent plane on the AEM front
page](https://crm-sync.dev/kb/media/docs/aem-home-live-2026-08-05.png)

## This is not a Shopify document

Real estates are plural. The same organization runs WooCommerce mid-port
to Astro, BigCommerce beside Shopify, WordPress content next to Salesforce
Commerce checkouts — and every one of those storefronts needs the same
upstream truth: the AEM content plane, the ERP's records, the CRM's
identities, the WMS's inventory and fulfillment data. No storefront can be
the system of record for obligations that span all of them.

That is why the rule is stated the way it is. The gate and the register
sit **beside** every storefront, not inside any of them — which is the
only place a rule can live when the storefronts themselves disagree. Add a
platform, port a theme, acquire a brand on a different stack: the record
doesn't move, because it was never in the thing you changed.

There is also a structural reason the records gap keeps recurring on one
platform in particular. Enterprise-scale Shopify stores are comparatively
rare — the platform's globalization ceiling historically kept large
multi-market estates on other stacks — so the agency labor market is
overwhelmingly trained on **small-business Shopify**: theme customization,
Liquid, app installs. When one of those merchants grows into global
obligations — multi-market pricing evidence, consent regimes, nexus
reporting — the team that built the store has often never seen the
problems the store now has. "That's not how Shopify sites work" isn't a
philosophy; it's the boundary of an expertise. The register exists so that
growing past your builder's experience doesn't mean growing past your
evidence.

## Where the app itself runs changes what it may reach — not what it may decide

The same argument reaches the packaging question, and the answer is less
interesting than people expect: **a native app, a progressive web app and a
desktop shell are all clients.** None of them can enforce a permission,
because all three run where the person using them can read and change them.
What differs is what each may *reach*, and therefore what it is safe to put
in one.

| Shell | May reach | The hazard |
|---|---|---|
| **React Native** | Device APIs, local storage, whatever the JS bundle is given | The bundle ships to the device. **A key inside it is a published key** — the firmware problem in a different wrapper. Over-the-air bundle updates are a distribution channel and need the integrity controls of one. Note the platform weather: Shopify [moved its own apps off it on 10 September 2026](https://www.crm-sync.dev/pages/knowledge-base#shopify-and-google-sunsets), citing coding agents removing the duplicate-work cost that justified the abstraction |
| **PWA** | Only what the browser grants the origin | The most constrained and the most honest. It cannot hold a secret at rest, which is a feature — it stops anyone trying |
| **Desktop shell (Tauri or similar)** | Filesystem, local network, OS keychain, under a declared capability list | Full native privilege unless the capability list is actually narrowed. The keychain makes real credential custody possible, which is the one genuine advantage over a PWA |

Three consequences worth writing down:

- **Choose the shell for reach, not for enforcement.** If the requirement is
  to talk to a device on the local network, a browser cannot and a desktop
  shell can. That is a reach question. If the requirement is that a landlord
  may cap a setting but not observe occupancy, no shell answers it — the
  server does.
- **A shipped bundle keeps no secrets.** React Native, a PWA's JavaScript, a
  desktop binary: all readable by whoever holds them. The client gets a
  public key to verify with, never a private key to act with.
- **An over-the-air update path is a firmware channel.** If the shell can
  replace its own executable code from a URL, that URL needs signing,
  verification on the device, and an anti-downgrade rule — the same
  treatment as any other image. See
  [Security Reinforcement: Firmware Asset Publishing](https://www.crm-sync.dev/pages/knowledge-base#firmware-asset-publishing).

## SOC 2, ISO, GDPR is a method, not a thing

You don't buy it, you don't install it, and a certificate doesn't contain
it. It is how the system behaves on every request — which is why it can be
verified any day, and why a framed certificate over an unrecorded cart
protects no one. A certificate attests a point in time; a register answers
at any time.

## Why this document exists

This doctrine is the origin of the system it describes. It was written
after watching organizations pay seven figures for responsive renderings —
delivered, accepted, and abandoned by the teams that built them — leaving
the person who signed the acceptance form holding a website that could not
produce a single record in its own defense. The register is the product.
Everything else is a surface it protects.
