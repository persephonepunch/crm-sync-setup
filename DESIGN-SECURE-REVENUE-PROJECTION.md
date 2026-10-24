---
title: "Design for Secure Revenue Projection"
description: "Security as a designed component of the revenue signal path: how conversion values, predicted lifetime value and audiences leave a store's own record for Google, Klaviyo and other channels, what the security component checks at each hop, its states and failure modes, what is built and tested today, and what it costs."
canonical: https://persephonepunch.github.io/crm-sync-setup/design-secure-revenue-projection.html
category: "Security"
date: 2026-10-24
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/DESIGN-SECURE-REVENUE-PROJECTION.md
licence: CC-BY-4.0
tags:
  - security
  - consent
  - audience
  - identity
  - ledger
  - architecture
about:
  - Revenue projection
  - Conversion value security
  - Predicted lifetime value
  - Consent-gated audiences
  - Security as a design component
alternativeHeadline: "Security is a component, not a review"
citation:
  - name: "Google — consent mode"
    url: https://developers.google.com/tag-platform/security/guides/consent
  - name: "Google Ads — about Customer Match"
    url: https://support.google.com/google-ads/answer/6379332
  - name: "Google Ads — enhanced conversions"
    url: https://support.google.com/google-ads/answer/9888656
  - name: "RFC 8659 — DNS CAA Resource Record"
    url: https://www.rfc-editor.org/rfc/rfc8659
  - name: "PHP Commerce: Moving Off Shared Hosting (companion)"
    url: https://persephonepunch.github.io/crm-sync-setup/php-commerce-off-shared-hosting.html
---
# Design for Secure Revenue Projection

**For:** marketing and growth leads, analytics and data engineers, designers who build the consent
and account surfaces, and the compliance reviewer who signs off what leaves the store.
**Genre:** design specification.

> A revenue signal is only as trustworthy as the least-checked hop it passed through. Design the
> checks as a component, with states and tests, the same way you design a button.

| Document control | |
|---|---|
| Status | Published; the component is partly built, and each gap is a failing test |
| Version | 1.0 |
| Owner | Platform security lead, with the marketing data owner |
| Evidence basis | `persephonepunch/ucp-purchase-agent` at `b753d6c` (main); the production Worker at `282d947` |
| Measured | 24 October 2026 |
| Review cycle | Quarterly, and whenever a channel or a vendor is added |

## Vocabulary

The same words are used loosely in marketing, engineering and compliance. Here they mean one thing
each:

| Term | Means here | Does not mean |
|---|---|---|
| **Revenue projection** | Sending a revenue signal about customers from the store's own record to a channel that acts on it: a conversion value for bidding, a predicted value, an audience list, a product feed price | A financial forecast. Forecasting (predicted lifetime value) is one *input* to a projection |
| **Revenue signal** | A conversion value, a predicted lifetime value (pLTV) score, an audience membership, or a price in a feed | Raw orders or customer records. Those stay in the store's own systems |
| **Channel** | The system that receives the signal and acts: Google Ads, Customer Match, Merchant Center, GA4, Klaviyo, Meta | The plugin that carries it. The plugin is transport |
| **Projection target** | A channel's adapter: the code that shapes a signal for one channel | The record. The record has one home; targets get copies |
| **Component** | A designed part with inputs, states, guarantees and tests, reused at every place it applies | A review, a policy document, or a one-off check in one integration |
| **Security component** | The part every projection passes through that decides *send*, *hold* or *refuse*, and leaves a record of the decision | Encryption alone, or TLS alone. Both are inside it, and neither is all of it |
| **Purpose** | Why a record exists: `marketing`, `analytics`, `support`, `fraud_prevention`. It decides which channels may receive it | A tag for reporting |

## The question this answers

Every store already projects revenue. The Google channel sends order values. A Klaviyo flow sends
spend. A pLTV model sends predicted values. The question is not whether to do it, but **who can
prove, afterwards, that each signal was allowed to leave, and was the signal it claimed to be.**

Most stacks answer with a review: a privacy assessment before launch, a penetration test once a
year. A review checks the design once. Revenue signals leave every few seconds, through plugins
that change monthly. The answer that holds up is a component that runs on every signal.

## The components of a revenue projection

A projection is built from six components. Five are familiar. The sixth, security, is usually left
out of the design and added as a review, which is the gap this document closes.

| Component | Job | Lives in | What breaks without it |
|---|---|---|---|
| **Identity** | One pseudonymous ID per customer, linked to each vendor's ID | Xano, behind Cloudflare | Each plugin's mapping table becomes the identity record, and it leaves with the plugin |
| **Consent** | The customer's current choice for each signal (`ad_user_data`, `ad_personalization`, `analytics_storage`) | Xano, written when the customer makes a choice | Consent is inferred from a marketing opt-in, and nobody can show it was granted |
| **Value** | The number sent: order total, or a pLTV score | BigQuery ML scores, returned to the Worker | Bidding learns from first orders only |
| **Purpose** | Which uses a record is allowed | On every record on the bus | A fraud score or a support ticket reaches an ad audience |
| **Channel adapter** | Shapes the signal for one channel | Worker, one adapter per channel | Each channel's quirks leak into the record |
| **Security** | Decides *send*, *hold* or *refuse* at every hop, and records it | Worker and Xano, on every projection | Every other component can be bypassed, and no one can tell |

Identity, consent, value and purpose describe the signal. The adapter shapes it. **Security is the
only component that checks the other five actually held.**

## The security component

### Contract

The component takes one signal and returns one decision:

```
input:   signal (value, pseudonymous ID, destination, purpose)
         + the consent state for that ID, read now, not cached from earlier
         + the sender's proof (a webhook signature, a service key)
output:  send | hold | refuse
         + reason
         + a record: what, to where, under which consent and purpose, when
```

It runs at every hop, not once at the edge. A check that only runs at the edge is bypassed by the
first internal job that calls a channel directly.

### States

| State | When | What happens to the signal | What the record says |
|---|---|---|---|
| **send** | Sender verified, purpose allows the destination, consent granted for this signal | Shaped by the adapter and delivered | Sent, with the consent state and purpose |
| **hold** | Consent unknown, or the consent service didn't answer | Queued; nothing leaves | Held, with the reason. A held signal is retried, never assumed granted |
| **refuse** | Sender not verified, purpose doesn't allow the destination, consent denied, or the tenant's own gate isn't set up | Dropped | Refused, with the reason |
| **degraded** | The decision was made, but the record couldn't be signed (signing key expired or unavailable) | The decision stands | Written unsigned and marked, so a later job can sign it. The record is never lost to save the signature |

The rule across all four: **every failure fails toward less exposure.** A gate that can't reach the
consent record holds; it doesn't send.

### Checks at each hop

| Hop | Security check | Why it is here, not elsewhere |
|---|---|---|
| **Order or event arrives** (Shopify, Stripe, a vendor webhook) | Verify the sender's signature in constant time before reading the body | An unsigned or forged event would become a revenue signal |
| **Record joins the bus** | Parse into a declared shape; refuse unknown fields and oversized bodies | Injection happens at transfer points, in whatever code reads the payload |
| **Identity is attached** | Use the pseudonymous ID; never put the email or phone on the bus | A leak of the bus then leaks no contact details |
| **Value is computed** | The model only reads and scores; it never decides access | A model that decides who may be used can't be audited the way a rule can |
| **Gate before a channel** | Ask the release gate per person, per destination: purpose, then consent, then the tenant's own gate | Consent is per person. A batch stamped "granted" is the most common silent failure |
| **Adapter sends** | One Google account per tenant; hashed contacts only; keys held as Worker secrets | A shared or mistyped account ID sends one store's customers to another's audience |
| **Channel acknowledges** | Record the result on the hash-chained ledger, signed with a key the merchant holds | The record must outlive the plugin, the vendor and the vendor's logs |
| **Domain and transport** | TLS everywhere; CAA names the CAs that may issue for the domain | A distrusted CA lets someone impersonate an endpoint the channel calls back |
| **Erasure** | Fan out from the identity spine to every channel copy, each with its own record | Erasure that reaches the app it was sent to, and not the audiences, isn't erasure |

### Failure modes, as they look from outside

Each of these looks exactly like a working system until someone checks the record:

- **A 200 that sent the wrong thing.** The audience upload succeeds, but every member was stamped
  as consented because the batch was. The fix is a decision per person, recorded per person.
- **A gate that opens late.** Consent is checked after the upload is queued. From the dashboard,
  a late gate and a working gate look the same.
- **An erasure that erased the original.** The redact webhook returns 200 and deletes the store's
  copy. The Customer Match list and the pLTV score still hold the person.
- **A fork in the record.** Two writers append to the same ledger at once and both succeed,
  leaving two histories. Only a constraint on the previous hash makes the second write fail.
- **A reporting address no one receives.** The CAA reporting record exists, but its value starts
  with a space, so a strict certificate authority ignores it.

## What is built, and how it is tested

The component is partly built. Each part is pinned by a test in the CRM Sync test harness: green
tests guard what is built, and red tests fail on purpose until a gap is built.

| Check | State | Evidence |
|---|---|---|
| Webhook signatures compared in constant time | Built | Green test: no plain `===` on the signature |
| Release gate asked per person before Customer Match, GA4 purchase and user properties, and Merchant reviews | Built | Green tests in the release-gate suite; the gate fails closed when a tenant's own gate isn't provisioned |
| One Google account per tenant | Built | Green tests in the Google-bindings suite: an account already bound to another store is refused |
| Consent and erasure records chained by `seq` and `prev_hash`, signed with Ed25519, kept when signing fails | Built | Green tests: chain constraint, signing, degraded path |
| Erasure fan-out to Shopify, Klaviyo, Salesforce, Adobe, Google Customer Match, the pLTV score and agent mandates | Built | Green test; the Google removal is written to the chain |
| CAA names the permitted CAs, with a valid reporting address; no emSign in any served chain | Built | Green tests, run live against DNS and the served certificates |
| No private key in the source; the public key list carries public keys only | Built | Green tests |
| Purpose tags that keep fraud and support data out of ad destinations | Not built | Red test |
| Erasure to helpdesk, fraud and consent-platform vendors (Gorgias, Sprinklr, Signifyd, OneTrust) | Not built | Red test |
| Arrival time recorded and clock skew flagged on inbound vendor events | Not built | Red test |
| A Rust/WebAssembly shape gate on inbound vendor payloads | Not built | Red test |
| One table linking every vendor's customer ID to the identity spine | Not built | Red test |
| The per-destination consent mapper called on every send | Written and tested, not yet called; the release gate decides today | — |

The vendor-by-vendor detail behind the red rows is in
[The plugin in the middle](https://persephonepunch.github.io/crm-sync-setup/php-commerce-off-shared-hosting.html#the-plugin-in-the-middle-data-ownership-from-shopify-to-crm-service-fraud-consent-and-google-pltv),
and which channel data may feed conversions, audiences, pLTV or model training is in
[Google audiences and conversions with Vertex AI, and where LoRA fits](https://persephonepunch.github.io/crm-sync-setup/php-commerce-off-shared-hosting.html#google-audiences-and-conversions-with-vertex-ai-and-where-lora-fits-scoping-private-channel-data).
The CAA steps, and a script that tests a domain red then green, are in
[CAA records](https://persephonepunch.github.io/crm-sync-setup/php-commerce-off-shared-hosting.html#caa-records-name-the-cas-that-may-issue-for-your-domain).

## Designing the visible part

Most of the component is invisible. Three parts reach a screen, and they are designed like any
other component, with states:

| Surface | States to design | What it must never do |
|---|---|---|
| **Consent banner and preferences** | Not yet asked; granted per signal; denied per signal; withdrawn | Offer one "accept" that grants ad signals the customer never saw named |
| **Account page** ("what we share") | Shared with each channel; held; erased, with the date of each | Show a channel as connected after an erasure was sent but not confirmed |
| **Merchant dashboard** (projection health) | Sent, held and refused counts per channel, with reasons | Show only *sent*. A dashboard without *held* and *refused* hides the gate |

The account and dashboard states come straight from the component's records, so the screen can't
disagree with what was sent.

## What it costs

- **Fewer signals reach the channel.** Holding until consent is known, and refusing on purpose,
  means smaller audiences and fewer conversion values than a stack that sends everything. Bidding
  learns from less data. That is the trade, and it should be stated in the plan, not discovered.
- **Latency.** A per-person gate adds a lookup before each send, and a batch is gated member by
  member. It is never free.
- **One more system to own.** The identity spine, the ledger and the gate run in Xano and
  Cloudflare. If those stop, projection stops, by design. That is a dependency the team takes on.
- **Vendor coverage lags.** Each new channel needs an adapter, an erasure call and a test before it
  is trusted. Until then it is a red row.
- **The tests prove the code, not the vendor.** A green erasure test proves the call is made; it
  doesn't prove the vendor deleted anything. Confirmations still have to be recorded and checked.

## What to do next

1. **List every revenue signal that leaves the store today,** with the channel, the plugin that
   carries it, and the purpose of the data. Most teams find signals no one owns.
2. **Write the security component's checks as tests before changing anything.** Each check you
   can't pass yet is a red test, and the list of red tests is the plan.
3. **Put the gate in front of the highest-volume signal first,** usually the audience upload or the
   conversion value, and make it decide per person.
4. **Move identity and consent to a record you own,** so the gate reads the current choice, not
   the plugin's copy.
5. **Add the visible states** to the banner, the account page and the dashboard from the same
   records.
6. **Turn one red row green at a time,** and add each new channel with its adapter, its erasure
   call and its test together.
