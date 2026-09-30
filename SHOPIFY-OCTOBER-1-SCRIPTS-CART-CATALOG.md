---
title: "October 1: script tags, Functions, the cart, the catalog agents read — Globalized Language ISO requirements"
description: "What server-side consent buys globally: the three-year conversion from browser tags to Consent Mode v2 (September 2023 to March 2027), what Google, Meta and the law require, and why no session-level consent log means no YouTube or Meta retargeting; a real-time consent log, California's Honda and Todd Snyder fines, and the browser opt-out signal from 1 January 2027; business-as-usual data vs an API-reinforced global namespace, from market-prefixed domains to Cloudflare Rules; a retire and adopt checklist; then Shopify's 1 October 2026 script tag deadline, Functions, what is reserved in cart and checkout, the ISO standards of the UCP catalog, and Korea's NICEPAY and consent path."
canonical: https://crm-sync.dev/docs/shopify-october-1-scripts-cart-catalog
category: "Specs"
date: 2026-09-29
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SHOPIFY-OCTOBER-1-SCRIPTS-CART-CATALOG.md
licence: CC-BY-4.0
tags:
  - shopify
  - architecture
  - agentic-commerce
  - consent
  - compliance
keywords:
  - ScriptTag deprecation
  - scriptTagCreate
  - theme app extension
  - app embed block
  - web pixel
  - Shopify Functions
  - instruction limit
  - Ajax Cart API
  - private line item properties
  - private cart attributes
  - reserved metafield namespace
  - checkout.liquid
  - Universal Commerce Protocol
  - UCP Catalog
  - ISO 3166-1
  - ISO 4217
  - BCP 47
  - NICEPAY
  - PIPA
  - cross-border transfer consent
  - conversions API
  - retargeting
  - Consent Mode v2
  - Smart Bidding
  - consent mandate
  - predicted lifetime value
  - Lookalike segments
  - value-based Lookalike Audiences
  - Kakao Pay
  - Samsung Pay
  - Google Pay
  - Google Wallet
  - Agent Development Kit
  - Google Data Manager API
  - Meta Conversions API
  - WebAssembly
  - Rust
  - Javy
  - Vertex AI
  - topic-driven category
  - key phrase
  - language ISO requirements
  - ad_user_data
  - ad_personalization
  - API Improvement Proposals
  - test-driven development
  - compliance test harness
  - Playwright
  - Selenium
  - Bogus Gateway
---

# October 1: script tags, Functions, the cart, the catalog agents read — Globalized Language ISO requirements

## What Consent Mode v2 buys you globally

**Google and Meta ads, lookalike audiences and Smart Bidding — managed by a server-side consent
mandate.**

### A. The three-year conversion: from browser tags to server-side consent

Nine dated changes, from three rulebooks, between September 2023 and March 2027. Read top to bottom
they are one conversion: measurement, audiences and checkout logic move out of the browser and
behind a consent record the server keeps.

| Date | What changes | Who | What it forces |
|---|---|---|---|
| 15 Sep 2023 | Korea's amended PIPA: five legal grounds for moving personal data abroad; for retargeting, that means **separate consent** | Korea (PIPC) | An itemised release consent before any Korean buyer's data reaches a US ad platform |
| Nov 2023 | Consent Mode v2 adds `ad_user_data` and `ad_personalization` | Google | Two new consent signals on every tag and upload |
| Early Mar 2024 | EEA users are left out of Google audiences unless those signals are sent | Google | Consent becomes a condition of reach, not a banner |
| 13 Aug 2024 | `checkout.liquid` unsupported on Information, Shipping and Payment | Shopify | Checkout code moves to Checkout Extensibility |
| 28 Aug 2025 | `checkout.liquid` and additional scripts end on Thank you and Order status; script tags leave the Order status page on Plus | Shopify | Post-purchase tracking moves to web pixels and extensions |
| 1 Apr 2026 | New Customer Match integrations must use the **Data Manager API**; the Google Ads API refuses new adopters | Google | Audience uploads move to a server-side API with a consent field |
| 26 Aug 2026 | Script tags leave the Order status page on every other store | Shopify | — |
| **1 Oct 2026** | Script tags can no longer be created or updated, on any API version | Shopify | Installs and settings flows that write a script tag fail |
| 1 Mar 2027 | Script tags stop loading on storefronts | Shopify | Anything still injected this way goes dark |

### B. What each platform requires of you

Every channel that sells or retargets across borders — YouTube Shopping, Google Customer Match,
Meta Custom Audiences, Shopify Audiences — ends at the same sentence: **the advertiser confirms it
has the consent the law requires. None of them collects that consent for you.** A consent record
kept on the server, itemised per market, is what lets one company run one media plan in the United
States and abroad: reach where it is permitted, hold where it is not, and prove which was which.

| Platform | What it offers | Where | What it requires of you |
|---|---|---|---|
| [YouTube Shopping](https://support.google.com/youtube/answer/13376398) (affiliate program) | Products tagged in videos | 14 regions, including **South Korea** and the **United States** | Channel in the YouTube Partner Program, not made for kids. In Korea a store connects only through Cafe24 or Marpple (§8.1) |
| [Google Customer Match](https://support.google.com/adspolicy/answer/6299717) (sent through the Data Manager API) | Retargeting on Search, YouTube, Gmail and Display | Global | Disclose the sharing in your privacy policy; **obtain consent where the law or Google's policies require it**; first-party data only |
| [Meta Custom Audiences](https://www.facebook.com/legal/terms/customaudience) (customer list) | Retargeting on Facebook and Instagram | Global | You warrant **"all necessary rights and permissions and a lawful basis"**; remove anyone who opts out; Meta deletes the list after matching |
| [Shopify Audiences](https://help.shopify.com/en/manual/promoting-marketing/shopify-audiences/setting-up-shopify-audiences) | Retargeting and prospecting lists exported to Meta and Google | Stores **based in the US or Canada** only | Shopify Plus, Shopify Payments and Shopify Network Intelligence — so **not available to a Korea-based store** |

### C. What that buys

1. **Reach US audiences from global markets, with consent.** A buyer who granted release consent
   can be measured and retargeted on every platform above, whatever market they bought in.
2. **Hold where consent is absent.** The same order still counts — as an aggregate, with no
   identifier leaving the buyer's country (§8.3).
3. **Prove which was which.** Each platform makes *you* warrant the consent; the server-side record
   is the evidence behind that warranty.
4. **Consent Mode v2 buys value-based growth.** With `ad_user_data` and `ad_personalization`
   granted, one consented customer list — each customer carrying a **predicted lifetime value
   (pLTV)** — seeds three things: Google **Smart Bidding** on value (target ROAS, maximise
   conversion value), Google
   [Lookalike segments](https://support.google.com/google-ads/answer/13541369) in Demand Gen
   campaigns (seeded from Customer Match, at least 100 matched people), and Meta
   [value-based Lookalike Audiences](https://www.facebook.com/business/help/917879191754763)
   (seeded from a customer list with a value column). Without consent, none of the three may use
   that customer.

   *Status here:* the pLTV model is trained in BigQuery ML; the Google upload is built behind a flag
   for US audiences; the Meta upload is not built; Korean buyers stay out of every seed list until
   release consent exists (§8.3).

### D. The rule: no session-level Consent Mode v2 log, no retargeting

A buyer enters a YouTube (Google) or Meta audience — or is sent as a purchase conversion with identifiers —
only when a consent event for **that session** is on record: the session ID, the four Consent Mode v2
signals (`ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`), the time, and
the version of the notice that was shown. Google and Meta ask the advertiser to *warrant* consent;
this log is what turns the warranty into evidence for a specific purchase. A person's current
consent answers "may we now?"; the session log answers "did they agree when they bought?".

| Piece | Status |
|---|---|
| Consent events recorded per session, keyed by session ID (effective state = latest event in the session; reset and withdrawal recorded) | **Built** |
| Upload gates (audiences, pLTV seed lists) read the person's **current** consent | **Built** |
| Upload gates **require the session record** of the purchase before any identifier leaves | **Not built** — the next step (§10) |

**What Google, Meta and the law add up to: a consent log kept in real time.** No single rule says
"real-time consent log" in those words. Read together, they leave no other way to comply:

| Source | What it asks | What that means for the log |
|---|---|---|
| Google — Consent Mode v2 | The consent signals travel **with each tag event and each upload**; since March 2024, EEA users without them are left out of audiences | Consent is recorded per event, at the moment it happens |
| Google — Customer Match policy | Obtain consent where the law or Google's policies require it; first-party data only | You must be able to show consent for each person you upload |
| Meta — Custom Audiences terms | You warrant a lawful basis, and **remove anyone who opts out** after you uploaded them | A withdrawal has to reach the audience, not just the banner |
| GDPR, Art. 7 | The controller "shall be able to **demonstrate** that the data subject has consented"; withdrawing must be as easy as consenting | Proof per person, and a withdrawal that takes effect as easily as the consent did |
| California — CCPA regulations §7026 | Honour an opt-out of sale or sharing, including the Global Privacy Control signal, as soon as feasibly possible and **within 15 business days** at most | A clock starts when the opt-out arrives; a scheduled copy can run past it |
| Korea — PIPA Art. 28-8 | Separate, itemised consent before personal data leaves Korea | The release consent must exist before the upload, not after |

**Put plainly, and kindly:** none of these platforms will keep this log for you, and every one of
them — and every regulator behind them — will ask for it the day something goes wrong. A consent log
written in the moment, per session, is the one document that ends that conversation early. Without
it, the only answer to "show us they agreed" is a spreadsheet exported after the fact, and that is
where the expensive part of a dispute begins.

**The public record already shows the pattern.** California's privacy regulator has fined two
well-known brands for exactly this gap between the banner and the systems behind it:

| Case (California Privacy Protection Agency) | What the regulator found | Result |
|---|---|---|
| American Honda Motor Co., March 2025 | Asked for more information than needed to opt out; the cookie tool did not offer choices symmetrically (allowing was easier than refusing); authorised agents were made hard to use | $632,500 fine and changed practices |
| Todd Snyder (clothing retailer), May 2025 | The privacy portal's technical setup was not overseen or configured properly, so opt-outs of sale or sharing **went unprocessed for 40 days**; it also asked for identity verification before an opt-out | $345,178 fine, reconfigured opt-out mechanisms, staff training |

The second case is the time-lapse risk in E made concrete: the banner said "opted out", and the
systems behind it did not hear for forty days. Neither case needed a data breach.

**Why January 2027 raises the stakes.** California's Opt Me Out Act (AB 566, signed 8 October 2025)
requires, from **1 January 2027**, that browsers serving Californians include a built-in setting to
send an opt-out preference signal. Today, few visitors send one, because it takes an extension or a
privacy-focused browser. From that date it is a setting in the browser people already use — so the
number of opt-outs arriving as a signal, on every page view, rises sharply. A store whose opt-outs
travel by scheduled copy will be missing far more of them, far more often. A store that reads the
signal at the edge and writes it to the consent log in the same request is unaffected by the volume.

### E. Business-as-usual data handling vs API reinforcement with a global namespace

Most stores run on **business-as-usual (BAU) data handling**: one data state, shaped for one country
(usually the US), kept separately inside each app. It works until the same customer, order or
consent has to mean the same thing in a second market, a second language or a second ad platform.

**API reinforcement** moves the rules into the API that every system calls — the edge Worker and
Xano's function stacks — so a record missing its market, language or consent is refused at the call,
not discovered in a report. A **global namespace** is the shared set of keys that makes a record mean
the same thing everywhere: `market:<iso2>`, BCP 47 language tags, ISO 4217 currencies, Shopify GIDs,
`$app:` metafield namespaces, and one name per consent purpose.

| | BAU: single US data state | API-reinforced, global namespace |
|---|---|---|
| **Consent** | One status per channel inside each app | Per purpose (the four Consent Mode v2 signals, plus release of data abroad), per market, per session, with the notice version |
| **History** | The latest state; earlier ones are overwritten or scattered across app event logs | An append-only timeline the server can replay: who agreed to what, when, in which session |
| **Market** | Implied by the domain and the currency | An ISO 3166-1 key on every record, named top-level down (F) |
| **Language** | One | A BCP 47 tag on every record and chunk of content |
| **Identity** | Email address as the key, in every tool | A pseudonymous ID and platform GIDs; contact details encrypted, held once |
| **Where the rule runs** | In each app, often in the browser | In the API, on every call — the same check for a person, a script or an agent |
| **Erasure** | One app at a time | One request, fanned out to every system and confirmed |
| **Timing** | Middleware copies changes on a schedule — minutes to hours behind | Consent is read at the moment of each call; there is no copy to fall behind |

**The time-lapse risk.** A withdrawal that takes hours to reach every system is a withdrawal
ignored for hours. In that window a person who opted out is still emailed, still tracked, still in an
uploaded audience — and that gap, repeated across millions of records, is where complaints,
regulator inquiries and lawsuits come from. It is not a vendor defect; it is what any scheduled copy
does. The fix is structural: the systems that act (send, track, upload) ask the consent record at
the moment they act, instead of trusting a copy.

**The namespace starts at the hostname.** Stores that run one market per prefixed domain —
`uk.example.com`, `ca.example.com`, `www.example.com` — often find every market showing the US
consent banner. The usual cause: the consent platform's script and geolocation rules were set up once,
for the parent domain, and each prefix inherits that US template instead of its own. The hostname is
the first key in the global namespace, and it should resolve to a market before anything else loads:

- **Cloudflare Rules** match on the hostname (`http.host`) and the visitor's country, and set the
  market and consent defaults at the edge — a UK prefix gets UK defaults whether or not a script ever
  runs. See https://developers.cloudflare.com/rules/
- **Each prefix that sends email needs its own SPF record.** SPF does not inherit from the parent
  domain, so `uk.example.com` mail fails SPF unless that name publishes one; DMARC can fall back to the
  parent's policy, SPF cannot.
- **The prefix declares the market; the visitor decides the law.** A UK visitor on `www` is still
  owed UK consent. Route on both — hostname for market, visitor location and signals (such as Global
  Privacy Control) for the consent rules — and record both in the log.
- **Google's reference for the hostname choice** is *Managing multi-regional and multilingual
  sites*: country domain (`example.de`), subdomain (`de.example.com`), subdirectory
  (`example.com/de/`) or URL parameter (not recommended), each paired with `hreflang`. Google also
  warns not to adapt *content* by IP address. That fits the rule above: the prefix fixes what a page
  says, so crawlers see a stable page per market; the visitor's location changes only the consent
  defaults, never the content.
- **The same top-level-down naming, behind the hostname.** Cloudflare's *Artifacts* product uses
  namespaces as the top-level containers for repositories, split by environment (`prod`, `staging`,
  `dev`) or by tenant, with names that stay stable across Workers, API clients and Git. It names
  repositories, not URLs — but it is the same convention one layer down: the market prefix a visitor
  sees and the namespace that holds that market's configuration should be named once, top-level down,
  and never renamed in only one place. See https://developers.cloudflare.com/artifacts/concepts/namespaces/

**Why the middleware keeps coming back.** When a CRM is fed only through middleware, removing the
middleware stops the CRM — so developers put it back, and the lag returns with it. Removing it is the
wrong goal. Keep the middleware for what it does well, moving records into the CRM on a schedule, and
take **consent out of the copy**: the CRM reads consent from the consent record through the API, and
anything that acts on a person — a send, a tag, an upload — checks that record at the moment it acts.
The CRM keeps running; the schedule no longer decides who may be contacted.

*Status here:* inbound Salesforce record events are received by the edge Worker, and Salesforce
pulls erasures from an outbox this estate keeps, so no platform credential for Salesforce is held.
Moving every consent read in a merchant's CRM onto the API is per-merchant work.

**Klaviyo as the worked example.** Klaviyo records, per profile, **one marketing status per channel**
— `SUBSCRIBED`, `UNSUBSCRIBED` or `NEVER_SUBSCRIBED` — with the time and method of the last change,
and logs subscribe and unsubscribe events. That answers one question well: *may we email or text this
person?* It is not a per-purpose (`ad_user_data`, `ad_personalization`), per-market, per-session
record, and it holds no release consent for moving data abroad — so on its own it cannot be the gate
in D. Keep Klaviyo for messaging; let the API-reinforced consent record decide what may reach Google
and Meta, and send Klaviyo the result.

**Household panels and clean rooms: whose consent covers what.** Household purchase panels (Circana,
and NielsenIQ's Homescan) hold consent from their own panel households. That consent covers the
panelists' data; it does not cover a store's customers. The moment a store sends its own customer or
loyalty list to be matched, enriched or measured, the permission is the store's, and it goes through
the same consent record as any Google or Meta upload.

| Use | Whose consent covers it | What the consent record needs |
|---|---|---|
| Panel reports, or segments built only from the panel | The panelists', given to the panel company | Nothing per person on the store's side |
| Sending the store's list for matching, enrichment or lift measurement | The store's | A purpose of its own. In California, a contract that keeps the partner a service provider decides whether it is a "sale"; if the partner may reuse the data, treat it as sale or sharing and honour opt-outs, including the browser signal |
| Activating matched households as Google or Meta audiences | The store's | `ad_user_data` and `ad_personalization` per person, as in D |
| A clean room that returns totals only | Lower risk | The default in D: counts and values leave, identifiers do not |

Four things bite on household data. **A household is personal information** under the CCPA, whose
definition covers information linked to "a particular consumer or household". **Purchase segments
can be health data**: a segment built on over-the-counter or allergy purchases can fall under
Washington's My Health My Data Act, where sharing needs consent and a sale needs the person's signed
authorisation. **The time-lapse risk becomes a file**: a match file sent on a schedule keeps an
opted-out person in the partner's copy, and the CCPA regulations require passing opt-outs on to the
third parties who received the data in that gap — a suppression feed, not just a banner update.
**Korea is stricter**: handing personal data to a panel or measurement partner is a provision to a
third party under PIPA, and abroad it also needs the separate consent in §8.

**How this estate applies it: sign-in claims, extras and the invitation to view, edit or share.**
The global namespace gives each of these its own key, so one never stands in for another:

- **Sign-in (`/auth/me`)** returns four separate things: the *user*, the *claims* (one consent
  flag per purpose, with its version), the *extras* (third-party identifiers — Adobe ECID, Nielsen
  ID, Circana household ID, segments) and the *entitlement* (what the account may use). Claims
  decide; extras are only ever keys that claims unlock.
  Xano's own `auth/me` works the same way: it checks the authentication token — an encrypted JWE —
  and returns the user, and a token can carry *extras*, such as a role, stored inside it
  (https://docs.xano.com/building-backend-features/user-authentication-and-user-data). Keep the two
  meanings of "extras" apart: **token extras** travel with every request, so they hold only small,
  non-identifying facts like a role; the **extras table** holds third-party identifiers, and a
  household ID never goes into a token.
- **Clean room** is its own consent purpose, not a feature someone buys. Every subject is excluded by
  default; a match job receives an explicit *include* or *exclude* for each person at each consent
  change, the latest decision wins, and the match list carries hashed references, never an email
  address. Withdrawing it removes the person from the next match.
- **Withdrawing marketing consent clears the extras** — the Adobe, Nielsen and Circana identifiers
  and the segments are emptied, and audience memberships are ended in the same step. Flipping a flag
  while the household ID stays in place would leave the retargeting running.
- **An invitation grants a place, never a person.** Teams invitations are single-use, expire after
  14 days and store only a hash of the link. They carry role tags — admin, design, content edit, QA,
  security, agent; no tag means view only — so separation of duties is set at the invitation. Stacks
  separate who may **view** (visibility: public, group, named people, private) from who may **edit or
  delete** (protection: owner, admin, group). Shared assets name the reason for every decision
  (public, named people, invitation, purchase, group) in a ledger.
- **Sharing a person's data asks the person's record, not the inviter's role.** The share gate
  refuses if the subject opted out of sale or sharing or has not granted ad personalisation, then
  checks the actor: the subject themselves, a peer with a delegated grant, or an agent under a live
  mandate bound to that subject. Anything missing is a refusal.

*Status here, stated plainly:* the claims, extras, clean-room include/exclude, suppression on
withdrawal, invitations and view/edit axes are built. Three gaps remain. The share gate is written and
tested but **not yet called by any route**, so today sharing is governed by the invitation layer
alone. Ad personalisation is **derived from the marketing flag** rather than held as a purpose of its
own. And the session view releases the Nielsen and Circana identifiers when **analytics** alone is
granted, where a measurement-match purpose should be required. Closing those three is the next step
before any household match file leaves the estate.

**Where this is proved: outside the closed Kubernetes and Red Hat pair.** Xano runs on managed
Kubernetes and Docker. Large companies often run their own Kubernetes too — on Red Hat OpenShift in an
internal cloud or on-premises — but that side needs a subscription, a cluster and a platform team
before the first test can run. The advantage of validating outside is timing: the data shape, the
`auth/me` claims, the consent purposes (clean room included) and the invitation rules are built and
proved by tests on public, synthetic or consented data, before anyone buys a cluster. What crosses
into the closed side is the **contract** — schema, gate rules, harness tests, AI eval set and MCP tool
definitions — not the data. The closed side runs the same contract (on OpenShift, or as Xano Standalone
in the client's own cluster), Terraform adopts the pieces, keys are minted fresh, and the same tests
must pass there. If one fails inside, the handover stops.

**Circana, Nielsen and Adobe IDs live on the closed side, behind a protected endpoint.** These are the
identifiers that turn a customer into a household, a panel match or an Adobe profile, so they are the
last thing that should sit in a shared layer. In the closed pair — an Azure estate, for example — the
Circana household IDs, Nielsen IDs and Adobe IDs are held in one store reached only through an
**Azure private endpoint**: a network interface with a
private IP address in the company's own virtual network. Microsoft notes that a private endpoint does
not by itself switch off public access, so **public network access is disabled on the store as a
separate step**. Callers authenticate with a **Microsoft Entra ID** token issued to a service
(client credentials), and the Cloudflare side reaches in only through **Cloudflare Tunnel**, an
outbound connection from inside, so no inbound port is opened.

The endpoint answers questions, not lists: *is this person included in the match* (include or
exclude, from the clean-room consent) or *how many and how much* (totals). It never returns the
identifier itself. The prep layer carries hashed references in its place, and a withdrawal clears
them on both sides — the prep layer's extras in the same step, the closed store through the
suppression feed.

*Status here:* the prep-layer half is built (consent-gated clean-room include and exclude, hashed
references, extras cleared on withdrawal). The Azure store, private endpoint and Tunnel are the
client's closed side and are set up at handover; today, in the demo estate, those identifiers sit in
the prep layer's extras table, released only with consent.

**How OpenShift connects to off-prem Docker and Kubernetes — and the gap every SaaS-to-on-prem
integration leaves.** Four layers cross the boundary, and Red Hat has a documented answer for each:

| Layer | What crosses | How, on the OpenShift side |
|---|---|---|
| **1. The image** | A container built with Docker off-prem runs on OpenShift unchanged: both use the open OCI image format | Pulled from an outside registry with a pull secret, or mirrored into an internal registry so nothing is pulled from the internet at run time. OpenShift's default restricted policy runs containers as an **arbitrary non-root user ID**, so an image that assumes root fails here even though it runs in Docker — check this before handover |
| **2. The definition** | Kubernetes YAML and Helm charts in Git | **OpenShift GitOps** installs Argo CD, which syncs the same repository; OpenShift adds its own Routes, Projects and security context constraints |
| **3. Cluster management** | Policy and observability across clusters | **Red Hat Advanced Cluster Management** imports EKS, AKS, GKE and other conformant Kubernetes clusters, with limited lifecycle support compared with OpenShift clusters |
| **4. The network** | A running service calling another | **Red Hat Service Interconnect** (built on the open-source Skupper project) links services across clusters and clouds without a VPN, over mutual TLS; **Cloudflare Tunnel** dials out from inside so no inbound port opens. Closed estates block outbound traffic by default, so every outside endpoint needs an egress rule, and identity comes from the enterprise provider (Entra ID), never the off-prem account |

Xano's managed service and Cloudflare are services, not clusters to join: OpenShift reaches them over
HTTPS like any API. At handover, what moves inside is the images and the Git repository — and, if the
work was done right, the contract.

**The fifth layer is the one that is missing.** SaaS-to-on-prem data integrations — scheduled syncs,
middleware and EDI exchanges alike — move **copies of records**. The schema, the gate rules and the
consent state that made those records valid stay behind on the SaaS side. Each side then keeps its
own history, and every difference is found later, by hand, in a reconciliation report: an order that
exists on one side only, a price that changed between runs, a withdrawal that the copy never heard
about. Nothing in layers one to four fixes that, because they move software, not agreement.

What closes it is the same rule as the rest of this document: the **contract crosses with the images
and Git** — schema, gate rules, harness tests, eval set — the same tests pass on both sides, and one
ordered, in-region log records each change once, so both sides replay the same history instead of
comparing two. Drift then shows up as a failing test at handover, not as a reconciliation meeting a
month later.

![How OpenShift connects to off-prem Docker and Kubernetes in four layers — image, definition, cluster management, network — and the missing fifth layer, reconciliation, closed by moving the contract and one ordered log](https://crm-sync.dev/kb/media/docs/openshift-off-prem-bridge-reconciliation-gap.png)

![Validate outside, run inside: the Cloudflare and Xano prep layer hands a tested contract, not data, to the closed Kubernetes and Red Hat OpenShift pair](https://crm-sync.dev/kb/media/docs/prep-layer-vs-closed-kubernetes-red-hat-v2.png)

### F. Checklist for global Shopify stores: retire from the critical path, then adopt

The dates in A retire **mechanisms, not companies**. Every tool named below can stay in your stack;
what has to go is the pattern it may be carrying. Run the check against each tool you use — the
examples are tools commonly installed in each category, not a verdict on any of them.

**Retire from the critical path**

| Pattern to retire | Commonly installed examples | The check to run | What carries the critical path instead |
|---|---|---|---|
| A CRM built around one storefront domain (one TLD) | Your CRM | Does every customer record carry its market (ISO 3166-1), and does the tool serve every market domain? | A market key on every record, named top-level down (below), enforced by the API (E) |
| Reviews, loyalty, service and subscription apps that assume one domain | Yotpo, Klaviyo, Attentive, Braze, Salesforce, Recharge, Loop, Gorgias, Sprinklr | Does it load through a script tag? Does it read consent and market per record, from the server? Does it serve every market domain? | App embeds and server-side APIs, with consent and market read per record |
| A consent banner as the only record of consent | Cookiebot, OneTrust | Can your server read the consent event for a purchase's session (D)? | Keep the banner to collect the choice; keep the session event server-side |
| Product data round-tripped through spreadsheets | `product.csv`, Matrixify | Is a spreadsheet the source of truth for a pipeline? | Admin API bulk operations (JSONL, `productSet`) for pipelines; spreadsheets for human edits only |
| Middleware that moves records without consent or language, on a delay | Boomi, Celigo, MuleSoft | Does each record carry its consent state and BCP 47 language through every hop? **How long between a withdrawal and the last downstream system honouring it?** | Keep the integration platform and add the fields — or a Worker or Xano step that refuses records without them |
| Google product data as a scheduled CSV file or through the Content API for Shopping | Google product feed file, Content API | The **Content API sunsets 18 Aug 2026**, with progressive errors from 1 Sep 2026; a file updates on a schedule, not when the product changes | The Merchant API |

**Naming convention, top-level down.** Every lower level is derived from the one above it; no system
invents its own name for a market ("korea", "asia") where an ISO code exists.

| Level | Convention | Example |
|---|---|---|
| Brand | One registrable domain for the global root | `brand.com` |
| Market | One country-code domain or market subdomain per market | `brand.co.kr`, `brand.jp`, or `kr.brand.com` |
| Language | A BCP 47 subfolder under the market | `brand.com/en-us/`, `brand.co.kr/ko/` |
| Market key in every system (CRM, tags, metafields, feeds) | ISO 3166-1 alpha-2 — uppercase in data, lowercase in URLs and handles | `KR` in a record, `kr` in a URL |
| Currency | ISO 4217 | `KRW` |
| Tag namespace | `market:<iso2>` | `market:kr` |

**Adopt**

| Adopt | Its job in this model | Status here |
|---|---|---|
| **Cloudflare Workers** | The edge: consent-first page loading, server-rendered pages, and the permission check on every tool call | **Built** |
| **Xano functions** | The data plane: typed tables and function stacks with preconditions, on Xano's managed container (Kubernetes and Docker) infrastructure; an `auth/me` endpoint resolves the signed-in person from their token; every call over TLS | **Built** |
| **AI data-binding runners (Claude)** | An AI agent maps and moves data between systems inside the test harness — it prepares and verifies; a person approves anything that touches keys or money | **Built** — how this estate is operated |
| **Google Merchant API** | Product data, statuses and reports; replaces the Content API | **Built** — the catalog mirrors its shape (AIP-122) |
| **Shopify Functions** | Pricing, discount, delivery and validation logic inside checkout | **Designed** (§3 example); none deployed here yet |
| **Rust and Wasm** | The language and format for Functions that see large carts | **Recommended**; not yet used here |
| **A test harness with compliance gating** | Every deploy runs the suites; a failing consent, permission or residency test blocks the release | **Built** — the deploy gate |

### G. Test-driven compliance with AI: the harness checklist

The last row of F — a test harness with compliance gating — is what keeps A to F true after the day
they are written. This section says what that means in practice and gives the checklist.

<a class="doc-button" href="https://crm-sync.dev/docs/raw?f=GLOBAL-COMPLIANCE-HARNESS-CHECKLIST.md&download=1" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600;border-radius:0">Download the global compliance harness checklist (Markdown) →</a>

**TDD and unit testing are not the same thing.** A *unit test* is a kind of test: it runs one
function on its own, with everything around it faked. *Test-driven development* (TDD) is an order of
work: write the test first, watch it fail (red), write the least code that makes it pass (green),
then tidy the code with the test still passing (refactor). The two are independent. You can write
unit tests after the code, which is not TDD; and you can do TDD with any kind of test — unit,
integration, or a browser test that pays with a test card.

| | Unit testing | Test-driven development |
|---|---|---|
| What it is | A size of test: one function, isolated | An order of work: the test before the code |
| Answers | "Does this function return the right value?" | "What must be true before we write anything?" |
| When the test is written | Any time, usually after | Always first, and it must fail first |
| Kinds of test used | Unit only | Unit, integration and end to end |
| What a compliance rule becomes | A check someone may or may not add | The first thing written; the feature does not exist until it passes |

**Why compliance needs TDD, not just tests.** A legal rule written after the feature is tested
against what the feature already does, so the test tends to agree with the code. Written first, the
test states the rule — "no ad request before consent", "no Korean identifier to Google before
overseas-transfer consent" — and the code has to meet it. Once in the gate, the rule is checked on
every deploy, not once at launch.

**Where the AI fits.** An AI agent is good at the slow parts of TDD: turning a rule's text into a
failing test, writing code until it passes, and running the suites. It must not be the judge of its
own work. In this estate the agent drafts, a person reads every test that states a legal rule, and
the gate refuses a release when a test fails, is skipped, or is quietly added to the known-failures
list. The download button above was built this way: a test for the download route was written and
failed before the route existed.

**Paying in a test: Selenium and Playwright.** Unit tests cannot show that a buyer can pay, or that
no ad tag fired before they agreed to one — that takes a real browser on a real page. Both tools
drive one. Neither should ever touch a live card: use a development store with Shopify's Bogus
Gateway (card number `1` approves, `2` declines, `3` fails) or Stripe test mode (`4242 4242 4242
4242` succeeds; `4000 0027 6000 3184` requires a 3-D Secure challenge).

| | Selenium | Playwright |
|---|---|---|
| Standard | W3C WebDriver; the longest-established choice | Its own protocol over each browser's debugging interface |
| Languages | Java, Python, C#, Ruby, JavaScript | TypeScript/JavaScript, Python, Java, .NET |
| Waiting | Explicit waits you write | Waits for elements automatically |
| Card fields in an iframe | Switch into the frame, then back out | `frameLocator` reaches in directly |
| Watching network requests | Possible (Selenium 4, BiDi or DevTools); more setup | Built in — `page.on("request")`, `page.route()` |
| Best fit | An existing Selenium grid and multi-language teams | Consent and network assertions; new suites |

The consent test is where Playwright is simplest, because it can list every request the page made:

```ts
// consent.spec.ts — Playwright. Written first; it fails until the stack loader defers tags.
import { test, expect } from "@playwright/test";

const AD_HOSTS = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.com\/tr/;

test("no advertising or analytics request before consent", async ({ page }) => {
  const early: string[] = [];
  page.on("request", (r) => { if (AD_HOSTS.test(r.url())) early.push(r.url()); });
  await page.goto("https://dev-store.example.com/");
  await page.waitForLoadState("networkidle");
  expect(early).toEqual([]);            // nothing fired while consent is denied
});

test("pays with the Bogus Gateway", async ({ page }) => {
  await page.goto("https://dev-store.example.com/products/sample");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.goto("https://dev-store.example.com/checkout");
  // Card fields sit in the gateway's own iframes; selectors vary by checkout — read yours.
  await page.frameLocator("iframe[title*='Card number']").locator("input").fill("1");
  await page.frameLocator("iframe[title*='Expiration']").locator("input").fill("12 / 30");
  await page.frameLocator("iframe[title*='Security code']").locator("input").fill("123");
  await page.frameLocator("iframe[title*='Name on card']").locator("input").fill("Test Buyer");
  await page.getByRole("button", { name: /pay now/i }).click();
  await expect(page.getByText(/thank you/i)).toBeVisible();
});
```

The same payment in Selenium, where each iframe has to be entered and left explicitly:

```python
# test_pay.py — Selenium 4, Python. Bogus Gateway on a development store only.
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def fill_in_frame(driver, title_part, value):
    frame = WebDriverWait(driver, 15).until(EC.presence_of_element_located(
        (By.CSS_SELECTOR, f"iframe[title*='{title_part}']")))
    driver.switch_to.frame(frame)
    driver.find_element(By.CSS_SELECTOR, "input").send_keys(value)
    driver.switch_to.default_content()   # back out before the next frame

def test_pays_with_bogus_gateway():
    driver = webdriver.Chrome()
    try:
        driver.get("https://dev-store.example.com/products/sample")
        driver.find_element(By.XPATH, "//button[contains(., 'Add to cart')]").click()
        driver.get("https://dev-store.example.com/checkout")
        fill_in_frame(driver, "Card number", "1")
        fill_in_frame(driver, "Expiration", "12 / 30")
        fill_in_frame(driver, "Security code", "123")
        fill_in_frame(driver, "Name on card", "Test Buyer")
        driver.find_element(By.XPATH, "//button[contains(., 'Pay now')]").click()
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(., 'Thank you')]")))
    finally:
        driver.quit()
```

Each payment test gets its failing twins — `2` must show a decline, `3` a gateway error — and the
consent test gets one per market, since the rule differs by where the buyer is. The checklist lists
them all: the gate itself, consent before measurement and before retargeting, where personal data
may go, data subject requests, payments, Shopify after 1 October, the catalog, accessibility, and
secrets.

### H. What the rest of this document covers

The machinery that makes A to G true: where JavaScript is allowed to run after 1 October (§1–§4),
what is reserved in cart and checkout (§5), the ISO standards a global catalog uses (§6), and — for
Korea — the routes, the rules and the consent that must come before any retargeting (§8).

---


> On 1 October 2026 a Shopify app can no longer create or update a script tag, on any API
> version. On 1 March 2027 the ones already installed stop loading. The replacement is not a
> different way to inject JavaScript — it is a rule about where each kind of code is allowed to
> run: layout in the theme, app code in an app embed, measurement in a web pixel, pricing
> logic in a Function, and product data in a catalog read by agents.

**Who this is for:** the merchant or business analyst who has to know what stops working and
when; the developer who has to move the code; the compliance reviewer who has to know where
data now flows. **The question it answers:** after 1 October, where does each piece of
storefront JavaScript go, and what names and formats are reserved on the way?

Every date and limit below is quoted from Shopify's developer documentation or the UCP
specification, linked in §9. Where a claim came from elsewhere and could not be confirmed there,
it is marked **unconfirmed**.

---

## 0. Vocabulary

Several of these words mean two different things, and the deadline only applies to one of them.

| Term | Means here | Does NOT mean |
|---|---|---|
| **ScriptTag** (the API resource) | An Admin API object an app creates so Shopify injects a JavaScript URL into every storefront page, with no theme change. Created by `scriptTagCreate` (GraphQL) or `POST` on the ScriptTag REST resource | A `<script>` element. Themes write `<script>` elements by hand and those are unaffected |
| **`script_tag`** (the Liquid filter) | A theme filter that wraps an asset URL in a `<script>` element | The ScriptTag API. Same words, unrelated feature, not deprecated |
| **App embed block** | Code an app ships in a **theme app extension**; the merchant turns it on in the theme editor | A script tag. It is visible to, and switchable by, the merchant |
| **Web pixel** | A sandboxed script that subscribes to Shopify's customer-event bus (page viewed, product added to cart, checkout completed) for analytics and marketing | A way to change the page. It observes; it does not render |
| **Shopify Function** | Server-side logic compiled to WebAssembly that Shopify runs inside cart and checkout (discounts, delivery, payment, validation) | Storefront JavaScript. It never runs in the browser |
| **WebAssembly (Wasm)** | The compact binary format every Shopify Function is shipped as. Shopify runs the module inside checkout and counts its instructions | A language. Rust, Zig, TinyGo and JavaScript all compile *to* it |
| **Rust** (for Functions) | The language Shopify strongly recommends for Functions: it compiles directly to Wasm, using Shopify's `shopify_function` crate and the `#[shopify_function]` macro | Required. It is the recommended path, not the only one |
| **Javy** | Shopify's JavaScript-to-Wasm toolchain. A JavaScript Function ships a JavaScript engine inside its Wasm module, which is why it spends instructions faster | A different runtime. The result is still Wasm |
| **Consent mandate** | The server-side record of what one person allowed, per purpose and market — analytics, `ad_user_data`, `ad_personalization`, release of data abroad — written with evidence and checked before every upload, audience or bid signal | A cookie-banner state in one browser. A banner collects the choice; the mandate is what the server enforces |
| **Keyword** | One word matched as written (`fuel`, `연료전지`) | Meaning. A keyword does not match a synonym |
| **Key phrase** | Several words matched as one unit (`heat pipe heater`, `household heating`) | A bag of the same words in any order |
| **Topic-driven category** | A category assigned by **meaning**: the text is embedded and placed in the category whose description it is nearest to, so "hydrogen power plant" lands in *Clean energy* with neither word present | A keyword rule. Keywords and phrases feed it; they do not decide it |
| **`cart.js`** (theme asset) | An ordinary file in a theme's `assets/` folder, written and owned by the theme developer | The endpoint below |
| **`/cart.js`** (Ajax Cart API) | A route every storefront serves, returning the current cart as JSON; part of the family `/cart/add.js`, `/cart/change.js`, `/cart/update.js`, `/cart/clear.js` | A file. It cannot be edited, and the `.js` suffix is historical |
| **UCP Catalog** | The Universal Commerce Protocol capability that AI agents use to **search and look up** products. Shopify offers it as the **Global Catalog** (all merchants) and the **Storefront Catalog** (one store) | An import format. Nothing is uploaded through it |

---

## 1. The dates

| Date | What happens | Applies to | Status on 29 Sep 2026 |
|---|---|---|---|
| 1 Feb 2025 | Apps can no longer create script tags with a `display_scope` of `order_status` or `all` | Order status page | Passed |
| 28 Aug 2025 | Script tags stop running on the Order status page; `checkout.liquid` and additional scripts sunset on Thank you and Order status | Plus stores | Passed |
| 26 Aug 2026 | Script tags stop running on the Order status page | All other stores | Passed |
| **1 Oct 2026** | `scriptTagCreate` and `scriptTagUpdate` return a user error; the REST ScriptTag resource rejects `POST` and `PUT`. **All API versions — pinning an older version does not defer it** | Every app, every store | **Two days** |
| **1 Mar 2027** | Shopify stops injecting script tags into storefronts | Every store | Five months |

**What keeps working after 1 October:** existing script tags keep running until 1 March 2027,
and the `scriptTags` query and `scriptTagDelete` mutation keep working, so an app can audit
and clean up what it installed.

**What breaks that is easy to miss:** any flow that *creates or updates* a script tag. That
includes onboarding, a settings screen that re-registers a URL, and **reinstalling an app on a
store**. The app does not fail on 1 March; it fails the next time someone installs it.

**How to see a store's script tags without API access:** view the page source of any
storefront page and search for `asyncLoad`. Shopify renders active script tags as a list of
URLs inside that function in `content_for_header`. No `asyncLoad` block means no script tags.
(An observation method, not a documented contract: Shopify says not to parse
`content_for_header`, because its contents may change.)

---

## 2. Where each kind of JavaScript goes now

The script tag was one mechanism for five different jobs. Each job now has its own place, with
its own rules.

| Job the code does | Where it goes | Who can switch it off | What it gives up |
|---|---|---|---|
| Theme layout and interaction (cart drawer, carousel) | A theme asset loaded with `asset_url` in a hand-written `<script defer>` or `type="module"`, or a `{% javascript %}` block in a section, block or snippet | The theme developer | Nothing new — this is how themes already work |
| An app adding something visible to the storefront | An **app embed block** in a theme app extension | **The merchant**, in the theme editor | Silent installation. The merchant has to turn it on |
| Analytics, conversion and marketing measurement | A **web pixel** | Consent: the pixel reads the visitor's choice from the Customer Privacy API | Access to the page. A pixel sees events, not the DOM |
| Price, discount, delivery or payment logic | A **Shopify Function** | Checkout configuration | The browser entirely — and a strict resource budget (§3) |
| Product data for agents and channels | The **catalog** and product feeds (§6) | Channel and agent settings | Nothing to inject — data is read, not loaded as script |

**`{% javascript %}` in detail**, from Shopify's theme documentation:

| Behaviour | Consequence |
|---|---|
| One `{% javascript %}` tag per file; a second is a syntax error | Keep a component's script in one block |
| Shopify concatenates the blocks into one file per type: `scripts.js` (sections), `block-scripts.js` (blocks), `snippet-scripts.js` (snippets) | One request per type, not per component |
| Injected through `content_for_header` and loaded with `defer` | It never blocks first paint |
| Injected **once per file, not once per instance** of a section or block | Per-instance values cannot live in the script; put them in `data-*` attributes on the markup |
| **Liquid is not rendered** inside `{% javascript %}`; Liquid there can cause syntax errors | Settings reach the script through the markup, never by templating the script |
| Each block is wrapped in a self-executing anonymous function | Variables stay local, and one section's runtime error does not break another |

**A claim to treat as unconfirmed:** that the `script_tag` Liquid filter always emits
`type="text/javascript"` and cannot add `defer` or `type="module"`. Shopify's documentation
does recommend hand-written `<script src="{{ 'x.js' | asset_url }}" defer>` (Theme Check,
*ParserBlockingJavaScript*), which is the safe pattern either way.

---

## 3. What a Shopify Function may spend

Functions run inside cart and checkout, so Shopify enforces a hard budget. For carts of up to
200 line items:

| Resource | Limit | Note |
|---|---|---|
| Execution instructions | **11 million** | Scales proportionally above 200 line items |
| Function input | **128 kB** | 1 kB = 1000 bytes in Shopify's limits |
| Function output | **20 kB** | Not enough for bulk price changes across every line; use discount functions, B2B catalogs, or targeted products |

**Why the language matters: everything becomes WebAssembly.** Shopify accepts a Function in any
language that compiles to Wasm and meets its Wasm API: Rust, Zig or TinyGo compile directly;
JavaScript is compiled by **Javy**, which packages a JavaScript engine into the module. The
budget below is counted in Wasm instructions, so the engine inside a JavaScript Function spends
part of the budget before your logic runs.

**JavaScript or Rust.** Functions can be written in JavaScript or TypeScript, but Shopify's
documentation is explicit: JavaScript reaches the instruction limit sooner than a language that
compiles directly to WebAssembly, and **Shopify strongly recommends Rust**. JavaScript is fine
for a prototype; a Function that sees large carts should be written in Rust from the start,
because a Function that runs out of instructions fails at checkout.

### A Function with a backend: decide before checkout, read at checkout

A Function **cannot call your backend while the buyer checks out**. Network access (the
`fetch` target) is limited to custom apps on Enterprise stores and has to be requested. So the
work splits in two: the backend decides ahead of time and stores the decision on Shopify, and
the Function reads that decision as part of its input.

| Step | Where it runs | What it does | Rule it follows |
|---|---|---|---|
| 1. Decide | Your backend (here, a Xano function stack) | Works out which collections get the VIP rate and which are excluded | Any logic, any data — no checkout budget applies |
| 2. Store | Admin API `metafieldsSet` | Writes the decision as **one JSON metafield** in the app's reserved namespace **on the Function's owner** (for a discount Function, the discount) | Only JSON metafields; never on the shop or the app installation |
| 3. Read | The Function's input query | Each JSON key becomes a query **variable**; the query asks Shopify which cart lines fall in those collections | A list variable over **100 elements** returns an error |
| 4. Apply | The Function (Rust or JavaScript) | Returns the discount for the matching lines | 11 million instructions, 128 kB in, 20 kB out |

**Xano view — the function stack, top to bottom.** In Xano's editor each step below is one card
in the stack; in XanoScript it reads as follows (illustrative, generic names, shortened):

```
query "demo/discount-rules" verb=POST {
  input  { text token { sensitive = true }   text discount_id
           text[] vip_collection_ids?        text[] excluded_collection_ids? }
  stack {
    redis.ratelimit { key = "demo_discount_rules:" ~ $env.$remote_ip  max = 10  ttl = 60 }
    precondition (token matches)                 { error_type = "accessdenied" }   // 403
    precondition (discount_id is a discount gid) { error_type = "inputerror" }     // 400
    var $rules { vipCollectionIds, excludedCollectionIds }
    precondition (each list has at most 100 IDs) { error_type = "inputerror" }     // refuse here, not at checkout
    api.request { POST https://{shop}/admin/api/2026-07/graphql.json
                  metafieldsSet(ownerId: discount_id, namespace: "$app:discount-rules",
                                key: "config", type: "json", value: $rules|json_encode) }
  }
  response = { saved, metafield, userErrors, rules }   // never the admin token
  history = false                                      // the request is not logged
}
```

**On the Shopify side**, the Function declares where its variables come from, and uses them in
its input query:

```toml
# shopify.extension.toml
[extensions.input.variables]
namespace = "$app:discount-rules"
key = "config"
```

```graphql
query Input($excludedCollectionIds: [ID!], $vipCollectionIds: [ID!]) {
  cart {
    lines {
      id
      merchandise {
        ... on ProductVariant {
          product {
            inExcludedCollection: inAnyCollection(ids: $excludedCollectionIds)
            inVIPCollection: inAnyCollection(ids: $vipCollectionIds)
          }
        }
      }
    }
  }
}
```

**Why this shape:** the Function never searches, fetches or computes membership itself — Shopify
answers `inAnyCollection` before the Function runs — so the instruction budget is spent only on
applying the rule. The backend can take as long as it needs, and the checkout pays nothing for it.
**What it costs:** the decision is only as fresh as the last write. A collection change reaches
checkout when the backend writes the metafield again, not before.

---

## 4. Server-side data: what storefront JavaScript may assume

The pattern behind every change above is the same: **the server decides, the browser reads.**
JavaScript that computed prices, decided eligibility or gathered data on its own is being moved
to places the merchant and the visitor can see and control.

| Requirement | Why | Where it is stated |
|---|---|---|
| **Settings arrive in the markup** as `data-*` attributes, not by rendering Liquid inside script | A `{% javascript %}` block is injected once per file and Liquid is not rendered inside it, so per-instance values can only come from the markup | Shopify theme docs, JavaScript and stylesheet tags (the documented example reads `data-slide-speed` through `dataset`) |
| **Consent before measurement.** Read the visitor's choice (`analyticsProcessingAllowed`, `marketingAllowed`, `saleOfDataAllowed`) before sending anything | The web pixel API exposes consent as a standard subscription (`visitorConsentCollected`) | Web Pixels API, Customer Privacy |
| **Prices and discounts are computed server-side**, in a Function | A price computed in the browser can be edited in the browser | Shopify Functions |
| **Do not parse `content_for_header`** | Its contents are undocumented and change | Liquid reference, `content_for_header` |
| **Cart state comes from `/cart.js`**, not from a copy the script keeps | The Ajax Cart API is the single source of the current cart | Ajax Cart API |

---

## 5. What is reserved in the cart and checkout

Reserved names are how Shopify separates what the buyer sees from what systems pass to each
other. Using the wrong prefix either shows internal data to a customer or hides it from the
code that needs it.

| Name or prefix | Where | What it does | Visible to |
|---|---|---|---|
| **`_key`** (single underscore) | Line item property | **Private** line item property | Hidden at checkout; still returned to the theme's `line_item.properties` and the Ajax API, so **the theme must filter it out** of the storefront; visible on the admin Order details page |
| **`__key`** (double underscore) | Cart attribute | **Private** cart attribute | Hidden at checkout and **not** returned in Liquid `cart.attributes` or the Ajax API, so no theme change is needed and it does not affect page caching; visible on the admin Order details page |
| `_key` in POS | Line item or cart property | Hidden on every POS surface, including receipts; in POS a `__` prefix means the same as `_` | Admin and the GraphQL Admin API |
| **`--`** in a name | Metafield namespace, metaobject type | Reserved since 19 Feb 2025 for platform formats such as `shopify--{standard}` and `app--{app-id}`; new definitions containing `--` are refused | — |
| **`$app:`** | Metafield namespace, metaobject type | Refers to the current app's reserved namespace without hard-coding its ID | The owning app |
| **`checkout.liquid`** | Checkout layout | Unsupported for Information, Shipping and Payment; sunset for Thank you and Order status on 28 Aug 2025 | — replaced by Checkout Extensibility |
| **`/cart.js`, `/cart/add.js`, `/cart/change.js`, `/cart/update.js`, `/cart/clear.js`** | Storefront routes (with an optional `/{locale}` prefix) | The Ajax Cart API | Public on every storefront — never name a theme file or app route to collide with them |

**The rule that follows:** anything a system needs and a buyer must not see goes in a
**double-underscore cart attribute**. A single-underscore line item property is private only if
every theme that renders it remembers to filter it.

---

## 6. The catalog agents read, and the ISO standards it uses

Shopify exposes products to AI agents through the **Universal Commerce Protocol (UCP) Catalog**
capability: `search_catalog` and `lookup_catalog`, with the Global Catalog spanning all
merchants and the Storefront Catalog scoped to one store. Both answer with UCP version
**2026-08-25**.

| Field | Standard | Example | Note |
|---|---|---|---|
| Country (`address_country`, filters) | **ISO 3166-1 alpha-2** | `US`, `KR` | Alpha-3 or a full name is accepted for backward compatibility; send alpha-2 |
| Region (`address_region`) | First-level administrative division | `California` | UCP does not require a code standard here |
| Language (`language`) | **IETF BCP 47** tag | `en`, `fr-CA`, `zh-Hans` | Hyphenated |
| Currency (`currency`) | **ISO 4217** | `USD`, `EUR`, `KRW` | Uppercase in every example |
| Amounts | **ISO 4217 minor units** | `12000` = USD 120.00; `12000` = KRW 12,000 | The currency's exponent decides: 2 for USD, 0 for JPY and KRW, 3 for KWD. `0` means free |
| Product ID | Shopify global ID | `gid://shopify/p/{upid}` (Global), `gid://shopify/Product/{id}` (Storefront) | Not the product handle |
| Variant ID | Shopify global ID | `gid://shopify/ProductVariant/{id}` | |

**The naming trap between two Shopify surfaces:**

| Surface | Language format | Example |
|---|---|---|
| UCP Catalog context | BCP 47, hyphen | `pt-BR`, `zh-Hans` |
| Admin GraphQL `LanguageCode` enum (product feeds, translations) | Enum, underscore | `PT_BR`, `ZH_CN`, `ZH_TW` |

A pipeline that copies one into the other without mapping sends `PT_BR` where a tag is expected,
or `zh-Hans` where the enum has `ZH_CN`. Map explicitly, in one function, and test it.

### Is the catalog replacing product CSV?

**No — and the difference matters.** The UCP Catalog is a **read** interface: agents search
and look up products that already exist. Nothing is uploaded through it, and Shopify's Global
Catalog **infers** some product fields from published product data rather than accepting a
submission.

| Job | What does it | Format |
|---|---|---|
| Put products **into** Shopify at scale | Admin API bulk operations: `stagedUploadsCreate`, then `bulkOperationRunMutation` running `productSet` once per line | **JSONL** (one JSON object per line) |
| Put a few products in by hand | Admin product CSV import | CSV — still supported |
| Let agents **find** products | UCP Catalog (Global or Storefront) | JSON-RPC over MCP, UCP 2026-08-25 |
| Let a channel **read** a product list | Product feeds (`ProductFeed` with `country` and `language`) | Admin API |

What does change for anyone moving off CSV: the fields agents read are the ones the product
record holds — title, description, price, identifiers, availability — so a catalog that was
"good enough in a spreadsheet" is now read literally by software. Missing GTINs, prices without
a currency, and descriptions in the wrong language become wrong answers to a shopper.

### 6.1 Products, users, tags and categories: the dataset pipeline behind the funnels

The catalog is what agents read. The **funnels** are what the business measures: which topics,
phrases and categories bring a person from a video or a search to a purchase. They share four
datasets, and the language rule of §6 applies to every one of them: text is tagged with a BCP 47
language and routed by it, never blended across languages.

| Dataset | Holds | Where it lives | Personal data? | Status |
|---|---|---|---|---|
| **Products** | Title, type, vendor, tags, short description, price in ISO 4217 minor units | Vectorize product index (multilingual `bge-m3`); Merchant-shaped catalog; BigQuery corpus per store | No | **Built** |
| **Users** | A pseudonymous ID and consent state only — never a name, email or phone | BigQuery identity map, written only for marketing-consented users | Pseudonymous | **Built**, empty until consented users exist |
| **Tags** | Controlled vocabulary: `content:kb/<slug>`, audience and campaign tags, each with a key | Channel tables; Webflow tag collection with weights | No | **Built** |
| **Categories** | Topic-driven categories with descriptions and weights (for example *Korea Clean Energy*) | Webflow category collection; topic subjects in the funnel wizard | No | **Built**; topic subjects added 29 Sep 2026 |

**How the funnel is keyed** — three signals, from exact to broad, each with its own job:

| Signal | Matched by | Good for | Example |
|---|---|---|---|
| Keyword | Exact word, per language | Search terms, placement lists, blocking | `연료전지`, `fuel cell` |
| Key phrase | Exact phrase, per language | Intent that one word misreads | `heat pipe heater` vs `heater` |
| Topic-driven category | Embedding nearest to the category description (Vectorize `bge-m3` at the edge; optionally Vertex AI embeddings in Google Cloud) | Content and questions that use neither the keyword nor the phrase | A question about hydrogen power scored into *Clean energy* |

**The Vertex step, and why it is optional.** Where a business already runs Google Cloud, a
**Python** job (or BigQuery SQL) can call Vertex AI through a BigQuery connection to embed or
score text **where the data already is**, and write the result back as a column — the pattern in
the estate's sentiment-funnel specification: score in BigQuery, not in the worker. What the job
may read is fixed:

| Rule | Why |
|---|---|
| Products, tags and categories may be embedded and scored | They contain no personal data |
| Users enter only as pseudonymous IDs with consent state; the job produces **aggregates** (per category, per phrase), never a ranking of named people | An analytics store may inform a decision; it must never grant access or identify a person |
| Korean personal data never reaches Vertex; Korea's funnel runs on the edge model and Vectorize | Korean personal data stays in Korea (§8) |
| The core product needs no Google Cloud at all | Vertex, BigQuery ML and predicted lifetime value are add-ons for businesses that already use them |

**Status: the Python Vertex pipeline is a design, not built.** The four datasets, the Vectorize
indexes and the topic subjects exist; the Vertex embedding and scoring job does not. Topic
subjects are defined by their keywords and phrases today, and nothing yet places content into
them by meaning. Topic-driven assignment by embedding is the next step.

---

## 7. This estate's status

Measured on 29 September 2026.

| Check | Result | Evidence |
|---|---|---|
| Does the worker create or update script tags? | **No** — 0 calls to `scriptTagCreate`, `scriptTagUpdate` or the REST resource | `workers/crm-sync/src/index.ts`, search |
| How does the brand theme reach the storefront? | An **app embed block** (theme app extension *CRM Sync Brand Kit*), switched on by the merchant | `extensions/brand-kit/shopify.extension.toml` |
| Does the live store load any script tags? | **No** `asyncLoad` block on `www.crm-sync.dev` | Page source, 29 Sep 2026 |
| Consent before measurement? | Yes — Consent Mode v2 defaults to denied, stored consent replays before any tag loads | Stack loader, `js-load-order` harness suite |
| Catalog for agents | The merchant catalog mirrors Merchant API names; the UCP discovery document reports version 2026-08-25 | `/merchant/products`, post-deploy check `ucp-discovery` |

**What this does not claim:** that every app installed on a merchant's store has migrated.
Third-party apps own their own script tags; the `asyncLoad` check above is how a merchant finds
them.

---

## 8. Korea: where the restricted APIs route, and the consent that gates retargeting

A US company selling into Korea meets the same October deadline, plus a set of services that do
not work there or only work from a fixed address. None of this blocks selling; each row has a
route.

#### YouTube to lead funnel · consent to e-commerce funnel

**Search terms:** Clean Energy · Korea · API · Audience

YouTube video (topic signal, no viewer data) → video page → lead form, with processing and
cross-border consent → Kakao Pay deposit → order → retargeting only with release consent (§8.3).

<a class="doc-button" href="https://ondol-intake.yoonsunlee150.workers.dev/v/korea-clean-energy-fuel-cell-example" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600;border-radius:0">Watch the Korea Clean Energy video, then try the Ondol Life lead form →</a>

*Example only: the video page and the lead form are demonstrations. Prices are illustrative, not a
quote, and the 10% Kakao Pay deposit is a test payment — no money is charged. The page is also in
Korean.*

### 8.1 The map

| Need | The US default | In Korea | Route used here | Status |
|---|---|---|---|---|
| Take payment | Shopify Payments | **Not offered** to merchants based in South Korea | Shopify stays the system of record (draft order); a Korean PG settles; the draft is marked paid and becomes the order | Built for Kakao Pay (sandbox) |
| Korean cards and wallets | Google Pay, Google Wallet | **Not launched** for Korean-issued cards | Kakao Pay; Samsung Pay and cards through **NICEPAY** (Samsung Pay is a separate NICEPAY contract) | NICEPAY endpoints built in Xano; not live |
| Marketplace (Coupang) | — | Open API **enforces an IP allowlist** | A Cloudflare Worker has no fixed outbound IP, so calls go Worker → Xano (fixed IP) → Coupang | Design; keys are ceremony secrets in Xano |
| NICEPAY REST API | — | See §8.2 | Called from Xano, not the Worker; every money step checks the signature **and** the amount | Built, refusal paths tested |
| Sell on YouTube | Shopify's Google & YouTube app | Own-store connection only through **Cafe24** or **Marpple**; embedded checkout only with Cafe24; affiliate through **Coupang**; **no public API** to tag products | The store's own checkout sits beside YouTube, not inside it | Not built; a direction |
| AI on personal data | Any hosted model | Korean personal data must not reach a non-Korean endpoint | Public questions: Workers AI. Personal data: a Korean-hosted model, or refuse | Rule enforced before the call |
| Staff and operator access | Shared admin key | Staff logins are personal data under PIPA | `/ops/*` behind Cloudflare Access; the Worker verifies the Access token itself and fails closed | Live on the POC; each client creates its own organisation |

### 8.2 TLS and login requirements

| Who is logging in, or connecting | Requirement | Source |
|---|---|---|
| Our server calling NICEPAY | HTTP client must support **TLS 1.2**; **Basic** authentication with the client key and secret key; sandbox and production keys differ | NICEPAY developer manual, *preparations* |
| Our firewall | Outbound to `api.nicepay.co.kr` and `pay.nicepay.co.kr` (sandbox hosts separate); **inbound webhooks from 121.133.126.86 and .87** | NICEPAY developer manual |
| NICEPAY calling our server | Optional **IP security**: restrict which IPs may call the API (CIDR). A Worker cannot be allowlisted by IP; Xano can | NICEPAY developer manual |
| A buyer paying with Kakao Pay | A payer account without Korean identity verification (본인인증) is refused ("restricted Kakao Pay usage") — observed on 25 Sep 2026 with a US account, even for a test payment | **Observed**, not a documented rule |
| A Kakao developer key | A Kakao **Login** REST key is a different product from the Kakao **Pay** key; swapping them fails with a well-formed but rejected request | Our payments runbook |
| Staff opening refunds or customer records | Cloudflare Access (Zero Trust) login; the Worker checks the token's signature, audience, issuer and expiry, and refuses when Access is half-configured | Our Korea/US governance reference |

### 8.3 Automated checkout and global conversions: NICEPAY to Google, YouTube and Meta — reaching US audiences from global markets, with consent

The path a US company wants is simple to draw: a Korean buyer pays through NICEPAY, the order is
confirmed server-side, and the conversion is sent to Google Ads (YouTube campaigns) and Meta so
they can measure and retarget. **The step that decides whether that is lawful is not in the
payment flow. It is the buyer's consent to release their data abroad.**

```
NICEPAY approval ──▶ signature + amount checked ──▶ Shopify order (system of record)
                                                          │
                                        ┌─ release consent on record? ─┐
                                        │ no                           │ yes
                                        ▼                              ▼
                          aggregate count and value only     conversion with identifiers
                          (no identifier leaves Korea)       to Google Ads / Meta, and
                                                             eligibility for retargeting
```

**Why consent, specifically.** Since 15 September 2023, PIPA Article 28-8 allows a transfer of
personal information abroad on one of five grounds: separate consent, law or treaty, processing
necessary to perform a contract with the person, a PIPC certification, or a PIPC adequacy
decision. Sending a buyer's details to an ad platform so they can be **retargeted** is not needed
to deliver their order, so for most US companies **separate consent** is the ground that applies.
The consent has to tell the buyer what is transferred, to which country, when and how, to whom,
for what purpose and for how long, and that they may refuse.

| What would be sent | Personal information? | Without release consent | With release consent |
|---|---|---|---|
| Order count and total value, no identifiers | No | Allowed | Allowed |
| Ad click ID (`gclid`, `fbclid`) with the order | Treat as **yes**: it links an order to a person's ad activity | Hold | Send |
| Hashed email or phone (Google enhanced conversions, Meta Conversions API) | **Yes** — hashing is pseudonymisation, not anonymisation | Hold | Send |
| The buyer in a retargeting list (Customer Match, Custom Audiences) | **Yes** | Hold | Send, and remove on withdrawal |

**This is the feature a US company needs from its data layer:** a **release-data consent**,
itemised the way PIPA requires, recorded with evidence, and **checked server-side before any
conversion or audience upload** — with "aggregate only" as the default when it is absent. A
browser tag cannot enforce that: it fires before the server knows whether consent exists.

**This estate's honest status:**

| Piece | Status |
|---|---|
| Consent regime for Korean visitors | Opt-in banner (Korea resolves to `opt_in`) — **Built** |
| Consent evidence | Running log in Xano plus a keyed evidence store — **Built** |
| Consent signal for ad conversions | `google_ads_conversion` mapped to `ad_user_data` in the conversion-consent module — **Built**, not yet called by any conversion upload |
| Itemised consent to collect and to move data to our own US database (Korean deployment template) | **Built.** A Korean visitor must tick processing and cross-border transfer separately before a lead or membership is stored |
| **Itemised release consent to an ad platform (Google, Meta)** | **Partial.** The Korean template records a separate, optional, unticked "share with Google" choice, itemised (recipient, country, items, purpose, retention). Nothing is sent on it yet, and the crm-sync store has no equivalent |
| Server-side upload to Google (Data Manager) | **Partial.** Built behind a flag for US audiences, gated on marketing consent; not enabled for Korean buyers |
| Server-side upload to Meta (Conversions API) | **Not built** |
| The store's existing conversion tag | A **custom web pixel** in Shopify Customer events with Analytics, Marketing and Sale-of-data purposes. Its code was not read for this document — confirm what it sends before it runs for Korean buyers |

*PIPA points here are a map for a conversation with Korean counsel, not legal advice.*

### 8.4 NICEPAY for Kakao Pay into Google channel automation: the consent permissions

**The payment.** NICEPAY offers Kakao Pay inside its own payment window — `method` values
`kakaopay`, `kakaopayCard` and `kakaopayMoney` (Samsung Pay is `samsungpayCard`; each easy-pay
method needs its own contract). The page opens the window; our server confirms with
`POST /v1/payments/{tid}` and the amount, and checks NICEPAY's signature,
`hex(sha256(tid + amount + ediDate + SecretKey))`, before anything is recorded. Kakao Pay can
also be taken directly through Kakao Pay's own API; either way the result is the same confirmed,
server-side order.

**The automation.** From that order, three things can be automated toward Google and Meta:
reporting the conversion, adding the buyer to an audience, and targeting by topic. Each needs a
different permission, and two different rulebooks apply at once — Google's and Meta's consent
signals, and Korean law.

| Automated action | Google / Meta mechanism | Google consent signal | Korean buyer: PIPA permission | Without it |
|---|---|---|---|---|
| Report that a sale happened (count, value, no identifier) | Aggregate conversion reporting | none beyond measurement | none: no personal information leaves | **Allowed** |
| Report the sale **with** a click ID or hashed email/phone | Google Data Manager conversion events (enhanced conversions); Meta Conversions API | `ad_user_data` granted | Consent to provide to a third party for marketing **and** separate overseas-transfer consent (Art. 28-8) | **Hold** — send the aggregate only |
| Add the buyer to a retargeting audience (YouTube, Search, Display) | Google Data Manager Customer Match; Meta Custom Audiences | `ad_user_data` **and** `ad_personalization` granted | As above, for the marketing purpose, with the right to withdraw — and removal on withdrawal | **Hold** |
| Show ads beside Korean clean-energy videos and searches | YouTube placement and topic targeting | none: no data about the buyer | none | **Allowed** |

**Two rulebooks, stated separately.** Google defines `ad_user_data` as consent "for sending user
data related to advertising to Google" and `ad_personalization` as consent "for personalized
advertising", and enforces them for EEA traffic under its EU user consent policy. For a Korean
buyer the obligation comes from PIPA, not from Google — but sending the two signals anyway puts
the buyer's choice into every record Google receives, and the Data Manager API carries a consent
object on each request for exactly that.

**The order of operations that makes it lawful:** payment confirmed → release consent looked up
server-side → only then an upload, with the consent signals set from that record. A tag in the
browser cannot follow this order: it fires on the thank-you page, before the server has checked
anything.

### 8.5 Wallets and agent protocols: the APIs, and where each works

| API | What it is | Korea | US | This estate | Documentation |
|---|---|---|---|---|---|
| **Kakao Pay** | Korean wallet; direct API or through NICEPAY (`kakaopay`) | Yes | — | Direct: built, sandbox. Through NICEPAY: endpoints built in Xano, not live | https://developers.kakaopay.com/ |
| **Samsung Pay** | Wallet; Web Checkout in the US, through a Korean PG (NICEPAY `samsungpayCard`) in Korea | Through NICEPAY, separate contract | Web Checkout | Built, not live | https://developer.samsung.com/pay |
| **Google Pay** | Card wallet for web and Android checkout | **No** — not launched for Korean-issued cards | Yes | **Live** (US) | https://developers.google.com/pay/api |
| **Google Wallet** | Passes: loyalty cards, offers, tickets | Not a realistic channel | Yes | Planned, for loyalty | https://developers.google.com/wallet |
| **Universal Commerce Protocol** | The open protocol agents use to search catalogs and check out (UCP 2026-08-25) | Protocol is global; payment rails are local | Yes | Catalog discovery live; merchant catalog mirrors Merchant API | https://ucp.dev/ |
| **Agent Development Kit (ADK)** | Google's framework for building agents that call tools | Refused for Korean shoppers; Korea uses an edge model | Optional | Concierge built; calls our tools, never decides permissions | https://google.github.io/adk-docs/ |

**One naming rule across all of them.** Google publishes its API design rules as
[API Improvement Proposals](https://google.aip.dev/general) — resource names such as
`accounts/{account}/products/{product}` ([AIP-122](https://google.aip.dev/122)), standard
methods, paging and errors. The tools an agent calls here follow the same rules, so an agent
built on ADK or UCP reads them the way it reads Google's own APIs. The rules name things; they do
not grant anything — every tool still checks permission and consent itself.

### 8.6 One path, segmented by region: Shopify UCP → Google audience → NICEPAY

The same shopper journey runs in every market. What changes by region is the payment rail and
what may be sent to Google — and one router, keyed by the buyer's ISO 3166-1 country, decides both.

```
                    Agent or shopper
                           │
        Shopify UCP catalog (search_catalog / lookup_catalog)
        address_country · language · currency  (ISO 3166-1 · BCP 47 · ISO 4217)
                           │
             market router (by ISO 3166-1 country)
          ┌────────────────┼──────────────────────┐
          US               KR                     KP · IR · SY
   Google Pay (live)   Kakao Pay (default)        refused: blocked markets
   Samsung Pay         Samsung Pay                never settle
   Web Checkout        through a Korean PG
                       (NICEPAY: kakaopay, samsungpayCard)
          │                │
          └──── Shopify order (system of record) ────┘
          │                │
   Google audience     Google audience held until release consent;
   (consent-gated)     topic and placement targeting only
```

| Step | United States | South Korea | Status |
|---|---|---|---|
| Discovery | UCP catalog, `address_country=US`, `currency=USD` | UCP catalog, `address_country=KR`, `language=ko`, `currency=KRW` | **Built** — Shopify's catalog; our merchant catalog mirrors Merchant API |
| Router | Home market: settles locally | Market module: rails Kakao Pay and Samsung Pay, default Kakao Pay, domestic PG, settles in KRW | **Built** — only a *ratified* market may settle; everything else fails closed |
| Payment | Google Pay; Samsung Pay Web Checkout | Kakao Pay direct, or Kakao Pay and Samsung Pay through NICEPAY (each a separate NICEPAY contract). Shopify Payments is not offered in Korea, so the payment leaves Shopify checkout and the order is settled on the Korean rail | US: Google Pay **live**, Samsung **built**. KR: Kakao Pay direct **built** (sandbox); NICEPAY **built in Xano, not live** |
| Order | Shopify order | Shopify draft order, marked paid once the Korean rail confirms | **Built** |
| Google audience | Data Manager, gated on marketing consent and `ad_user_data` / `ad_personalization` | **Held** until the itemised release consent of §8.3; topic and placement targeting need no personal data | US: **Partial** (behind a flag). KR: **Held by design** |
| Other markets | — | Taiwan: Samsung Pay through a domestic PG — **incubating**, cannot settle. North Korea, Iran, Syria — **blocked** | Built as refusals |

**A gap stated rather than hidden:** the worker's slot for a Korean payment gateway is a
placeholder named for another PG (KG Inicis) and reports itself unavailable. NICEPAY is built as
Xano endpoints, but not yet connected to that slot. Until it is, Samsung Pay in Korea cannot settle
through the worker; Kakao Pay can, through its own direct connection.

---

## 9. What it costs

| Choice | Cost | Stated plainly |
|---|---|---|
| App embed instead of script tag | The merchant must turn it on | Silent installs end; that is the point |
| Web pixel instead of a tracking script | No DOM access; events only | Measurement that respects consent by construction |
| Functions in Rust | A second language in the codebase | JavaScript Functions are cheaper to write and more likely to fail on large carts |
| Double-underscore attributes | Invisible to the theme as well as the buyer | Correct for system data; wrong for anything a template must display |
| Catalog read literally by agents | Data quality becomes visible to shoppers | Fix identifiers and currencies before an agent quotes them |
| Release consent before retargeting Korean buyers | Smaller retargeting lists and fewer matched conversions from Korea | Every list that is built can be shown to a regulator; the alternative is a PIPC suspension order on the transfer |

---

## 10. What to do next

Ordered by exposure — the first item fails in two days.

1. **Find every code path that creates or updates a script tag** — install, onboarding,
   settings, reinstall — and replace it before **1 October 2026**. *Owner: app developer.*
2. **Audit each store's live script tags** (`scriptTags` query, or `asyncLoad` in page source)
   and assign each URL to its replacement in §2. *Owner: merchant, with each app vendor.*
3. **Move tracking scripts to web pixels** that read consent before sending. *Owner: marketing
   engineering; reviewed by compliance.*
4. **Move private system data to double-underscore cart attributes**, and filter
   single-underscore line item properties in every theme that renders them. *Owner: theme
   developer.*
5. **Write one mapping** between BCP 47 language tags and the Admin `LanguageCode` enum, with
   tests, before any pipeline copies between them. *Owner: integration developer.*
6. **Check product records for what agents will read**: GTIN or MPN, currency on every price,
   description language. *Owner: catalog owner.*
7. **For Korean buyers, hold every identifier until release consent exists**: build the
   itemised PIPA 28-8 consent, record it with evidence, and gate conversion and audience uploads
   on it server-side; send aggregate counts only until then. Review what the store's custom
   conversion pixel sends first. *Owner: data layer developer; reviewed by Korean counsel.*
8. **Call NICEPAY and Coupang from a fixed IP** (Xano), with a TLS 1.2 client, and allowlist
   NICEPAY's webhook addresses. *Owner: integration developer.*
9. **Require a session-level Consent Mode v2 record before any retargeting upload**: a purchase's
   identifiers go to Google or Meta only when the consent event for that purchase's session is on
   record. *Owner: data layer developer; reviewed by compliance.*
10. **Connect NICEPAY to the worker's Korean payment slot**, replacing the KG Inicis placeholder,
   so Samsung Pay can settle in Korea alongside Kakao Pay. *Owner: integration developer.*
11. **Remove what is left by 1 March 2027**, when script tags stop loading. *Owner: app
   developer.*

---

## Dictionary: AI and API terms

One line each, in the sense this document uses them. Terms defined at length in §0 are repeated
briefly here so the list stands on its own.

| Term | Means |
|---|---|
| **Agent** | Software that decides which tool to call next toward a goal. It decides what to *try*, never what is *allowed* |
| **Tool** (function call) | One operation an agent may request, such as "search the catalog"; the server checks permission on every call |
| **MCP** — Model Context Protocol | The open protocol agents use to discover and call tools on a server |
| **A2A** — Agent2Agent | A protocol for one agent to hand a task to another |
| **AP2** — Agent Payments Protocol | A protocol for an agent to pay under a mandate the person signed |
| **UCP** — Universal Commerce Protocol | The open protocol agents use to search catalogs and check out (§6) |
| **ADK** — Agent Development Kit | Google's framework for building agents that call tools |
| **Mandate** | What an agent may do on someone's behalf: signed, capped, scoped, time-boxed, revocable |
| **Consent mandate** | The server-side record of what one person allowed, per purpose and market (§0) |
| **RAG** — retrieval-augmented generation | The model answers from passages retrieved at question time |
| **CRAG** — corrective RAG | RAG with a grader: weak passages are refused and the next source is tried |
| **Grounded answer** | An answer written only from retrieved passages; "not in the documents" when they do not answer |
| **Embedding** | A list of numbers that places a piece of text by meaning, so similar texts sit close together |
| **Vector index** (Cloudflare Vectorize) | A store of embeddings searched by nearest meaning |
| **bge-m3** | The multilingual embedding model used here (English, Korean and more in one index) |
| **LoRA** — low-rank adaptation | A small trained adapter that changes how a model writes; never used to store facts |
| **Eval set** | Real questions with accepted answers, run before and after every change |
| **Workers AI** | Models run on Cloudflare's network; used here for public questions, including Korea's |
| **Vertex AI** | Google Cloud's AI platform; optional here, and never for Korean personal data |
| **AI data-binding runner** | An AI agent that maps and moves data between systems inside a test harness, with a person approving keys and money |
| **REST** | An API style built on URLs and HTTP verbs, one resource per call |
| **GraphQL** | An API style where the caller asks for exactly the fields it needs in one query; Shopify's Admin API is GraphQL |
| **GID** | Shopify's global ID, such as `gid://shopify/Product/123` |
| **AIP** — API Improvement Proposals | Google's API design rules: resource names, standard methods, paging, errors |
| **Page token** | An opaque marker for "the next page" of a list, bound to the query that produced it (AIP-158) |
| **JSONL bulk operation** | A file with one JSON object per line, run by Shopify as one bulk job |
| **Webhook** | A call a platform makes to your server when something changes |
| **Idempotent** | Safe to repeat: the second identical request changes nothing |
| **Metafield / metaobject** | Shopify's custom fields and custom records |
| **`$app:` namespace** | A metafield namespace reserved to the app that owns it |
| **App embed block** | App code a merchant switches on in the theme editor; the replacement for script tags |
| **Web pixel** | A sandboxed script that receives customer events, for measurement only |
| **Shopify Function / Wasm / Javy** | Server-side checkout logic compiled to WebAssembly; Javy compiles JavaScript to Wasm (§3) |
| **Function input query** | The GraphQL query a Function declares for the data it needs; can take variables from a JSON metafield |
| **Consent Mode v2** | Google's four consent signals: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` |
| **CMP** — consent management platform | The banner tool that collects a visitor's choices |
| **BAU data handling** | Business-as-usual: one data state per app, shaped for one country |
| **API reinforcement** | Rules enforced by the API every system calls, so a bad record is refused at the call |
| **Global namespace** | The shared keys that make a record mean the same everywhere: `market:<iso2>`, BCP 47, ISO 4217, GIDs, `$app:`, consent purpose names |
| **Data Manager API** | Google's single upload API for audiences (Customer Match) and conversion events, with consent per request |
| **Customer Match** | Retargeting Google users from your own customer list |
| **Merchant API** | Google's product data API; replaces the Content API for Shopping |
| **Conversions API** (Meta) | Meta's server-side API for conversion events |
| **pLTV** — predicted lifetime value | A model's estimate of what a customer will spend; used as the value for Smart Bidding and value-based lookalikes |
| **Smart Bidding** | Google's automated bidding toward conversions or conversion value |
| **Lookalike** | An audience of people similar to a seed list (Google Demand Gen; Meta value-based lookalikes) |
| **TLS** | The encryption on every HTTPS connection; NICEPAY requires TLS 1.2 or later |
| **JWT / JWE** | A signed token (JWT) or an encrypted one (JWE) carrying identity or permissions |
| **OAuth** | The standard way to grant an app access to an account without sharing its password |
| **`auth/me`** | The endpoint that returns who the current token belongs to |
| **BCP 47** | Language tags such as `ko`, `fr-CA`, `zh-Hans` |
| **ISO 3166-1** | Country codes such as `KR`, `US` |
| **ISO 4217** | Currency codes such as `KRW`, `USD`, and each currency's minor unit |

---

## Sources

- Shopify changelog, 24 Aug 2026: *Script tags are deprecated and will stop running on
  March 1, 2027* — https://shopify.dev/changelog/posts/online-store-script-tags-deprecation
- Script tag deprecation guide and Order status timeline —
  https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation
- Shopify Functions limitations and resource limits — https://shopify.dev/docs/api/functions
- JavaScript for Functions — https://shopify.dev/docs/apps/build/functions/programming-languages/javascript-for-functions
- Rust for Functions — https://shopify.dev/docs/apps/build/functions/programming-languages/rust-for-functions
- WebAssembly for Functions — https://shopify.dev/docs/apps/build/functions/programming-languages/webassembly-for-functions
- Network access for Functions — https://shopify.dev/docs/apps/build/functions/network-access
- Input query variables from metafields — https://shopify.dev/docs/apps/build/functions/input-queries/use-variables-input-queries
- JavaScript and stylesheet tags in themes —
  https://shopify.dev/docs/storefronts/themes/best-practices/javascript-and-stylesheet-tags
- `content_for_header` — https://shopify.dev/docs/api/liquid/objects/content_for_header
- Ajax Cart API, private properties and attributes — https://shopify.dev/docs/api/ajax/reference/cart
- POS cart API, private properties — https://shopify.dev/docs/api/pos-ui-extensions
- Reserved prefix protection for metafields and metaobjects, 19 Feb 2025 —
  https://shopify.dev/changelog/posts/reserved-prefix-protection-for-metafields-and-metaobjects
- `checkout.liquid` deprecation — https://shopify.dev/docs/storefronts/themes/architecture/layouts/checkout-liquid
- Web pixels and the Customer Privacy API — https://shopify.dev/docs/apps/build/marketing/pixels
- Shopify catalogs for agents — https://shopify.dev/docs/agents/catalog
- UCP Catalog specification (2026-04-08) — https://ucp.dev/2026-04-08/specification/catalog/
- Bulk operation imports — https://shopify.dev/docs/apps/build/apis/graphql-admin/bulk-operations/imports
- Google API design rules used on the merchant surface — https://google.aip.dev/general
- Migrate from Content API for Shopping to Merchant API (sunset 18 Aug 2026) —
  https://developers.google.com/merchant/api/guides/compatibility/overview
- NICEPAY developer manual, integration preparations (TLS 1.2, hosts, IPs, Basic auth) —
  https://github.com/nicepayments/nicepay-manual/blob/main/common/preparations.md
- PIPA 2023 amendment, overseas transfer grounds — Lexology,
  https://www.lexology.com/library/detail.aspx?g=4e246fbb-9f7a-48dc-9435-410a577d6ff8 ; Shin & Kim,
  https://www.shinkim.com/eng/media/newsletter/2048
- Items a Korean overseas-transfer notice must state — DLA Piper, Data Protection Laws of the World,
  https://www.dlapiperdataprotection.com/?t=transfer&c=KR
- YouTube Shopping affiliate program, overview and eligibility (14 regions) — YouTube Help,
  https://support.google.com/youtube/answer/13376398
- NICEPAY payment window (server approval), methods and signatures —
  https://github.com/nicepayments/nicepay-manual/blob/main/api/payment-window-server.md
- Google consent mode (ad_user_data, ad_personalization) — https://developers.google.com/tag-platform/security/guides/consent
- Google: updates to consent mode for EEA traffic (March 2024) — https://support.google.com/google-ads/answer/13695607
- GDPR Article 7, conditions for consent — https://gdpr-info.eu/art-7-gdpr/
- California: CCPA and Global Privacy Control (opt-out within 15 business days) — https://oag.ca.gov/privacy/ccpa/gpc ;
  California Privacy Protection Agency FAQ — https://cppa.ca.gov/faq.html
- California Privacy Protection Agency: Honda settles over privacy violations (12 March 2025) —
  https://cppa.ca.gov/announcements/2025/20250312.html
- California Privacy Protection Agency: Todd Snyder ordered to pay fine (6 May 2025) —
  https://cppa.ca.gov/announcements/2025/20250506.html
- California Opt Me Out Act (AB 566), browser opt-out preference signal from 1 January 2027 —
  https://privacy.ca.gov/2026/01/californias-opt-me-out-act-your-privacy-just-got-easier
- Google Search Central: managing multi-regional and multilingual sites —
  https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites ;
  localized versions (hreflang) — https://developers.google.com/search/docs/specialty/international/localized-versions
- Cloudflare Rules — https://developers.cloudflare.com/rules/
- Xano: User Auth & Data (auth/me, JWE tokens, extras) — https://docs.xano.com/building-backend-features/user-authentication-and-user-data
- Red Hat OpenShift — https://www.redhat.com/en/technologies/cloud-computing/openshift
- Azure Private Link: what is a private endpoint — https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview
- Microsoft Entra ID: OAuth 2.0 client credentials flow — https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow
- Cloudflare Tunnel — https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- Red Hat Developer: adapting Docker and Kubernetes containers to run on OpenShift (arbitrary user IDs) —
  https://developers.redhat.com/blog/2020/10/26/adapting-docker-and-kubernetes-containers-to-run-on-red-hat-openshift-container-platform
- Red Hat OpenShift GitOps: setting up an Argo CD instance —
  https://docs.redhat.com/en/documentation/red_hat_openshift_gitops/1.16/html-single/argo_cd_instance/index
- Red Hat Advanced Cluster Management datasheet (EKS, AKS, GKE and conformant Kubernetes) —
  https://www.redhat.com/en/resources/advanced-cluster-management-kubernetes-datasheet
- Red Hat Service Interconnect (Skupper) —
  https://docs.redhat.com/en/documentation/red_hat_service_interconnect/2.1/html/using_service_interconnect/skupper-overview
- California Civil Code §1798.140 (CCPA definitions, "consumer or household") —
  https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.140
- CCPA regulations §7026(f)(2): notify third parties who received the data before the opt-out was honoured —
  https://www.law.cornell.edu/regulations/california/11-CCR-7026
- Washington My Health My Data Act, RCW 19.373 — https://app.leg.wa.gov/RCW/default.aspx?cite=19.373
- Cloudflare Artifacts: namespaces — https://developers.cloudflare.com/artifacts/concepts/namespaces/
- SPF (RFC 7208) — https://www.rfc-editor.org/rfc/rfc7208
- Google Ads Developer Blog: changes to Customer Match support in the Google Ads API (April 2026) —
  https://ads-developers.googleblog.com/2026/03/changes-to-customer-match-support-in.html
- Google Data Manager API — https://developers.google.com/data-manager
- Meta Conversions API — https://developers.facebook.com/docs/marketing-api/conversions-api
- Meta Customer List Custom Audiences Terms — https://www.facebook.com/legal/terms/customaudience
- Klaviyo: understanding consent in profiles — https://help.klaviyo.com/hc/en-us/articles/360037101072
- Klaviyo: collect email and SMS consent via API — https://developers.klaviyo.com/en/docs/collect_email_and_sms_consent_via_api
- Google Customer Match policy — https://support.google.com/adspolicy/answer/6299717
- Google Lookalike segments (Demand Gen) — https://support.google.com/google-ads/answer/13541369
- Meta value-based Lookalike Audiences — https://www.facebook.com/business/help/917879191754763
- Shopify Audiences setup and eligibility — https://help.shopify.com/en/manual/promoting-marketing/shopify-audiences/setting-up-shopify-audiences
- Kakao Pay developers — https://developers.kakaopay.com/
- Samsung Pay developers — https://developer.samsung.com/pay
- Google Pay API — https://developers.google.com/pay/api
- Google Wallet API — https://developers.google.com/wallet
- Universal Commerce Protocol — https://ucp.dev/
- Agent Development Kit — https://google.github.io/adk-docs/
- AIP-122 resource names — https://google.aip.dev/122

- Playwright: network events and frames — https://playwright.dev/docs/network ; https://playwright.dev/docs/api/class-framelocator
- Selenium: working with iframes, waits — https://www.selenium.dev/documentation/webdriver/interactions/frames/ ;
  https://www.selenium.dev/documentation/webdriver/waits/
- Shopify Bogus Gateway (test card numbers 1, 2, 3) — https://help.shopify.com/en/manual/checkout-settings/test-orders
- Stripe test cards, including 3-D Secure — https://docs.stripe.com/testing
- California CCPA regulations §7025, opt-out preference signals — https://cppa.ca.gov/regulations/
- European Accessibility Act, applicable from 28 June 2025 — https://eur-lex.europa.eu/eli/dir/2019/882/oj

*Not legal advice and not a certification. Dates and limits are Shopify's and
may change; check the linked pages before acting.*
