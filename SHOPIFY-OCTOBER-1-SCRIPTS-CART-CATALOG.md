---
title: "October 1: script tags, Functions, the cart, the catalog agents read — Globalized Language ISO requirements"
description: "What changes on Shopify on 1 October 2026 and 1 March 2027, where storefront JavaScript goes instead of a script tag, what a Shopify Function may spend and how a backend feeds it, which names are reserved in the cart and checkout, the ISO standards the Universal Commerce Protocol catalog uses, and for Korea: where restricted APIs route, NICEPAY TLS and login rules, the consent permissions for automating NICEPAY and Kakao Pay orders into Google (YouTube) and Meta targeting, and where Kakao Pay, Samsung Pay, Google Pay, Google Wallet, UCP and ADK each work."
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
---

# October 1: script tags, Functions, the cart, the catalog agents read — Globalized Language ISO requirements

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

### 8.3 Automated checkout and global conversions: NICEPAY to Google, YouTube and Meta

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
9. **Remove what is left by 1 March 2027**, when script tags stop loading. *Owner: app
   developer.*

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
- NICEPAY developer manual, integration preparations (TLS 1.2, hosts, IPs, Basic auth) —
  https://github.com/nicepayments/nicepay-manual/blob/main/common/preparations.md
- PIPA 2023 amendment, overseas transfer grounds — Lexology,
  https://www.lexology.com/library/detail.aspx?g=4e246fbb-9f7a-48dc-9435-410a577d6ff8 ; Shin & Kim,
  https://www.shinkim.com/eng/media/newsletter/2048
- Items a Korean overseas-transfer notice must state — DLA Piper, Data Protection Laws of the World,
  https://www.dlapiperdataprotection.com/?t=transfer&c=KR
- YouTube Shopping in Korea (store platforms, affiliate program) — YouTube Help,
  https://support.google.com/youtube/answer/13376398
- NICEPAY payment window (server approval), methods and signatures —
  https://github.com/nicepayments/nicepay-manual/blob/main/api/payment-window-server.md
- Google consent mode (ad_user_data, ad_personalization) — https://developers.google.com/tag-platform/security/guides/consent
- Google Data Manager API — https://developers.google.com/data-manager
- Meta Conversions API — https://developers.facebook.com/docs/marketing-api/conversions-api
- Kakao Pay developers — https://developers.kakaopay.com/
- Samsung Pay developers — https://developer.samsung.com/pay
- Google Pay API — https://developers.google.com/pay/api
- Google Wallet API — https://developers.google.com/wallet
- Universal Commerce Protocol — https://ucp.dev/
- Agent Development Kit — https://google.github.io/adk-docs/
- AIP-122 resource names — https://google.aip.dev/122

*Not legal advice and not a certification. Dates and limits are Shopify's and
may change; check the linked pages before acting.*
