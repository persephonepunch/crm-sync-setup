---
title: "October 1: script tags, Functions, the cart, and the catalog agents read"
description: "What changes on Shopify on 1 October 2026 and 1 March 2027, where storefront JavaScript goes instead of a script tag, what a Shopify Function may spend, which names are reserved in the cart and checkout, and the ISO standards the Universal Commerce Protocol catalog uses — and why that catalog is not a replacement for product CSV import."
canonical: https://persephonepunch.github.io/crm-sync-setup/shopify-october-1-scripts-cart-catalog.html
category: "Specs"
date: 2026-09-29
status: draft
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
---

# October 1: script tags, Functions, the cart, and the catalog agents read

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

**JavaScript or Rust.** Functions can be written in JavaScript or TypeScript, but Shopify's
documentation is explicit: JavaScript reaches the instruction limit sooner than a language that
compiles directly to WebAssembly, and **Shopify strongly recommends Rust**. JavaScript is fine
for a prototype; a Function that sees large carts should be written in Rust from the start,
because a Function that runs out of instructions fails at checkout.

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

## 8. What it costs

| Choice | Cost | Stated plainly |
|---|---|---|
| App embed instead of script tag | The merchant must turn it on | Silent installs end; that is the point |
| Web pixel instead of a tracking script | No DOM access; events only | Measurement that respects consent by construction |
| Functions in Rust | A second language in the codebase | JavaScript Functions are cheaper to write and more likely to fail on large carts |
| Double-underscore attributes | Invisible to the theme as well as the buyer | Correct for system data; wrong for anything a template must display |
| Catalog read literally by agents | Data quality becomes visible to shoppers | Fix identifiers and currencies before an agent quotes them |

---

## 9. What to do next

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
7. **Remove what is left by 1 March 2027**, when script tags stop loading. *Owner: app
   developer.*

---

## Sources

- Shopify changelog, 24 Aug 2026: *Script tags are deprecated and will stop running on
  March 1, 2027* — https://shopify.dev/changelog/posts/online-store-script-tags-deprecation
- Script tag deprecation guide and Order status timeline —
  https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation
- Shopify Functions limitations and resource limits — https://shopify.dev/docs/api/functions
- JavaScript for Functions — https://shopify.dev/docs/apps/build/functions/programming-languages/javascript-for-functions
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

*Status: draft. Not legal advice and not a certification. Dates and limits are Shopify's and
may change; check the linked pages before acting.*
