---
title: "Global Unit Data Loads — 3D Commerce, WMS & Merchant Feed Spec"
description: "Every physical quantity stored once, in SI units with an ISO/UN code, and converted at each surface's edge: the 3D viewport, the WMS, Shopify, the Google Merchant feed and every migrated app read the same canonical unit record. With the SAP and ECC break, GS1 identifiers, events, ISO and UTF-8 data for space, sea, air and LiDAR, AI scaling and security, non-browser data chains and a six-step load pipeline."
canonical: https://crm-sync.dev/docs/global-unit-data-loads
category: "Specs"
date: 2026-11-13
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/GLOBAL-UNIT-DATA-LOADS.md
licence: CC-BY-4.0
tags:
  - units
  - wms
  - google-merchant
  - sap
  - 3d
  - geospatial
  - lidar
  - utf-8
---

# Global Unit Data Loads — 3D Commerce, WMS & Merchant Feed Spec

Nov 13, 2026 · Yoonsun Lee

![How g:id links to the Shopify GID namespace. The Shopify product GID gid://shopify/Product/8123456789 and variant GID gid://shopify/ProductVariant/4455667788 give their numbers to the Google offer ID shopify_KR_8123456789_4455667788, with item_group_id 8123456789. The Merchant API v1 names the product accounts/{merchantId}/products/ko~KR~offerId, so the full key is GID plus content language plus feed label. Back to Shopify: split the offer ID on underscores; the last part rebuilds the variant GID and the second last the product GID, with no lookup table. A custom offer ID such as fo1-KR-0142 has no numbers to parse, so the canonical record stores the GID and its offers. Rules: never change a live offer ID, derive it from the variant GID, one offer per variant per target country, up to 50 characters.](https://persephonepunch.github.io/crm-sync-setup/assets/gid-to-offer-id.svg)

**Related knowledge base:**
[ECC direct to Google](https://ecc-rust-book.yoonsunlee150.workers.dev/ecc-direct-to-google) ·
[ECC market prices and FX](https://ecc-rust-book.yoonsunlee150.workers.dev/ecc-direct-to-google#market-prices-and-fx-one-price-read-everywhere) ·
[ECC revenue and WMS risk register](https://ecc-rust-book.yoonsunlee150.workers.dev/ecc-direct-to-google#revenue-and-wms-risk-register) ·
[SAP to Google EDI](https://ecc-rust-book.yoonsunlee150.workers.dev/sap-to-google-edi) ·
[SAP Fiori-style UI5 apps at the edge](https://ecc-rust-book.yoonsunlee150.workers.dev/s4hana-alternative#substitutes-at-the-edge) ·
[An alternative to a full S/4HANA upgrade](https://ecc-rust-book.yoonsunlee150.workers.dev/s4hana-alternative) ·
[From product.csv to Consented Conversions](CONSENTED-DATA-LAYER.md)

**Live on fo1.io (the first use case):**
[Furnish a home](https://fo1.io/ko-kr/#furnish) (floor plan, budget and a 3D room in meters) ·
[Configure in 3D](https://fo1.io/ko-kr/#configure) (made-to-measure pieces) ·
[Portal](https://fo1.io/ko-kr/#portal) (clients and architects, demo)

## Overview

Every physical quantity is stored once, in SI units with an ISO/UN code, and every surface converts from that record at its own edge. The 3D viewport, the WMS, Shopify, the Google Merchant feed and every migrated app read the same canonical unit record; none of them stores its own copy of a measurement.

- **3D viewport:** fluid 16:9 frame (`aspect-ratio: 16 / 9; width: 100%`), UI laid out in %, fr and grids. The scene itself is in meters (1 unit = 1 m, the glTF convention). Like an SVG viewBox, space is proportional; pixels exist only at the final render step, so physical width is never stored in px.
- **Physical data:** dimension, volume, weight and temperature (°C, °F, K) travel as value + unit code, converted for display by locale.
- **Commerce data:** currency as ISO 4217 (USD, KRW), countries as ISO 3166-1 alpha-2 (US, KR), locales as BCP 47 (en-US, ko-KR), dates as ISO 8601, all text UTF-8.
- **First use case:** fo1.io custom orders, sourced in the US, warehoused and installed in Korea, so every order crosses USD↔KRW, in↔cm and lb↔kg.

## Canonical unit model

The canonical record stores the SI value plus the UN/CEFACT Rec 20 code; UCUM, CLDR and Shopify codes are lookups, not stored copies. A record is `{"value": 1.8288, "unit": "MTR", "source_value": 72, "source_unit": "INH"}`, so the original entry is never lost.

| Quantity | Unit | UN/CEFACT Rec 20 (canonical) | UCUM | CLDR / Intl | Shopify metafield |
|---|---|---|---|---|---|
| Length | meter | MTR | m | meter | m |
| Length | centimeter | CMT | cm | centimeter | cm |
| Length | millimeter | MMT | mm | millimeter | mm |
| Length | inch | INH | [in_i] | inch | in |
| Length | foot | FOT | [ft_i] | foot | ft |
| Area | square meter | MTK | m2 | — | — |
| Area | square foot | FTK | [sft_i] | — | — |
| Volume | cubic meter | MTQ | m3 | — | m3 |
| Volume | liter | LTR | L | liter | l |
| Volume | US gallon | GLL | [gal_us] | gallon | us_gal |
| Weight | kilogram | KGM | kg | kilogram | kg |
| Weight | gram | GRM | g | gram | g |
| Weight | pound | LBR | [lb_av] | pound | lb |
| Weight | ounce | ONZ | [oz_av] | ounce | oz |
| Temperature | kelvin | KEL | K | — | — |
| Temperature | degree Celsius | CEL | Cel | celsius | — |
| Temperature | degree Fahrenheit | FAH | [degF] | fahrenheit | — |

Conversion rules:

- Use exact factors: 1 in = 0.0254 m, 1 lb = 0.45359237 kg, 1 US gal = 3.785411784 L, K = °C + 273.15, °F = °C × 9/5 + 32.
- Round only at display; never write a rounded value back to the canonical record.
- `Intl.NumberFormat` has no kelvin, area or cubic-meter units, so those need a small custom formatter.
- Shopify has no temperature metafield type; store temperature as a decimal + unit code in a metaobject or JSON metafield.
- Kelvin carries two meanings: thermodynamic temperature (cold chain, machine telemetry) and lighting color temperature (2700 K warm, 4000 K neutral). Tag which one so they are never compared.

## Linking units to global WMS

The WMS keeps its own unit-of-measure (UoM) master, so the link is a mapping table from each WMS UoM to the canonical UN/CEFACT code, plus GS1 identifiers on everything that ships. Packaging levels (each, case, pallet) stay in the WMS; physical measures resolve to the canonical record.

| Physical measure | GS1 Application Identifier | Canonical code |
|---|---|---|
| Net weight | 310n (kg) · 320n (lb) | KGM |
| Length | 311n (m) · 321n (in) | MTR |
| Width | 312n (m) | MTR |
| Height / depth | 313n (m) | MTR |
| Net volume | 315n (L) · 316n (m³) | MTQ |
| Gross (logistics) weight | 330n (kg) · 340n (lb) | KGM |
| Max temperature | 4330 (°F) · 4331 (°C) | KEL |
| Min temperature | 4332 (°F) · 4333 (°C) | KEL |

The n digit in each AI is the number of decimal places. The temperature AIs were added in GS1 General Specifications v24 for freight temperature requirements and are expressed in hundredths of a degree; GS1 has no kelvin AI, so kelvin converts to °C or °F at the label.

- **POs and custom orders:** each PO line carries quantity, packaging UoM and physical measures as canonical records. Made-to-measure orders (fo1.io) keep the customer's original entry as `source_value` / `source_unit`, so a Korean install team sees cm while the US vendor sees inches from the same record.
- **Machine / IoT:** sensor telemetry (warehouse and container temperature, humidity, load weight) arrives as SenML or vendor JSON; map its unit field to the canonical code on ingest and keep the raw payload.
- **Currency on WMS documents:** PO values, landed cost and duties carry ISO 4217 codes and the FX rate used, with its date (see the feed section).
- **Kelvin split:** cold-chain readings use thermodynamic kelvin; lighting products carry color temperature in K as a product attribute, never routed into cold-chain logic.

## Google Merchant feed schema

The feed is generated from the canonical record, never edited by hand, and pushed through the Merchant API v1. The Content API for Shopping reached its sunset on August 18, 2026, with intermittent 410 errors from September 1, 2026, so any direct integration must already be on the Merchant API. Shopify's Google channel handles that migration for its own sync.

| Concern | Feed attribute | Format and units | Source in canonical record |
|---|---|---|---|
| Currency | price, sale_price, cost_of_goods_sold | value + ISO 4217, e.g. 4500000 KRW | price per market |
| FX | none in the feed | submit a price in the target country's currency rather than relying on conversion | Shopify Markets price + stored rate and rate date |
| Tax | tax (US only), tax_category | US: country, region, rate; KR and EU prices are VAT-inclusive | tax engine per market |
| ISO codes | shipping.country, ships_from_country, content_language | ISO 3166-1 alpha-2, ISO 639-1 | market + locale |
| Dates | availability_date, sale_price_effective_date | ISO 8601 (interval for sale dates) | order and promo calendar |
| Shipping weight | shipping_weight | lb, oz, g, kg | KGM, converted |
| Shipping dimensions | shipping_length, _width, _height | cm or in, 1–400 cm, one unit across all three | MTR, converted |
| Product dimensions | product_length, _width, _height, product_weight | cm / in; lb, oz, g, kg | MTR, KGM |
| Unit pricing | unit_pricing_measure, unit_pricing_base_measure | value + unit, e.g. 750 ml / 100 ml | volume or weight record |
| Loyalty | loyalty_program | program label, tier, member price, points | loyalty migration (below) |
| Technical specs | product_detail | section, name, value (e.g. Color temperature, 2700 K) | Kelvin, area, materials |

Rules:

- In the Merchant API product attributes, the `taxes` field is marked deprecated; set US tax in Merchant Center settings where possible.
- Merchant Center has no kelvin, temperature or area unit attribute, so those go into `product_detail` as display text formatted from the canonical record.
- Large custom pieces exceed carrier limits; assign a `shipping_label` (freight class) and use shipping tables instead of carrier-calculated rates.
- The same values render as schema.org JSON-LD on Webflow pages (`Offer.priceCurrency`, `QuantitativeValue.unitCode` with UN/CEFACT codes, `OfferShippingDetails`), so page and feed never disagree.

Example item (XML feed):

```xml
<item>
  <g:id>fo1-KR-0142</g:id>
  <g:price>4500000 KRW</g:price>
  <g:availability>preorder</g:availability>
  <g:availability_date>2027-01-15T09:00+09:00</g:availability_date>
  <g:product_length>213 cm</g:product_length>
  <g:product_weight>48 kg</g:product_weight>
  <g:shipping_label>freight-white-glove</g:shipping_label>
  <g:ships_from_country>US</g:ships_from_country>
  <g:product_detail>
    <g:section_name>Lighting</g:section_name>
    <g:attribute_name>Color temperature</g:attribute_name>
    <g:attribute_value>2700 K</g:attribute_value>
  </g:product_detail>
</item>
```

### How g:id links to the Shopify GID namespace

The offer ID (`g:id`) is a plain string of up to 50 characters, not a GID. Shopify's Google channel builds it from the numbers at the end of the GIDs: `gid://shopify/Product/8123456789` and `gid://shopify/ProductVariant/4455667788` become `g:id` `shopify_KR_8123456789_4455667788` and `item_group_id` `8123456789`, one offer per variant per target country. The Merchant API v1 names the product `accounts/{merchantId}/products/{contentLanguage}~{feedLabel}~{offerId}`, so the full key is GID + language + feed label. Splitting the offer ID on `_` gives both GIDs back with no lookup table (see the diagram at the top).

A custom offer ID such as `fo1-KR-0142` has nothing to parse, so the canonical record stores the link: `{ "gid": "gid://shopify/ProductVariant/4455667788", "offers": [{ "offerId": "fo1-KR-0142", "feedLabel": "KR", "contentLanguage": "ko" }] }`. Never change a live offer ID, since Google treats a new ID as a new product; derive it from the variant GID, never the SKU or title.

## product.csv vs. Shopify Catalog data layer vs. Google Merchant

The GraphQL Admin API catalog is the data layer; product.csv is a flat, lossy export of it, and the Merchant feed is generated from GraphQL, never from the CSV. The CSV stores weight only in grams, has no dimensions, 3D media, translations or contextual pricing, and carries no explicit currency code, so it is used only for bulk legacy imports. Column names follow Shopify's current product CSV; legacy names are in parentheses.

| Data | product.csv column | Catalog GraphQL (Admin API) | Google Merchant attribute | Units, ISO and gaps |
|---|---|---|---|---|
| Identity | URL handle (Handle) | Product.id, handle; ProductVariant.id | id (variant), item_group_id (product), link | GID ↔ offer ID mapping kept in the canonical record |
| Title | Title | title | title | per-locale titles from translations |
| Description | Description (Body (HTML)) | descriptionHtml | description | HTML stripped to text for the feed |
| Brand | Vendor | vendor | brand | — |
| Category | Product category | category (TaxonomyCategory) | google_product_category | Shopify taxonomy → GPC ID mapping |
| Type | Type | productType | product_type | — |
| Tags | Tags | tags | custom_label_0–4 (by rule) | — |
| Status | Status, Published on online store | status, publications | excluded unless active and published to the Google channel | — |
| Options | Option1–3 name / value | options, selectedOptions | color, size, material, pattern | option → attribute mapping per category |
| SKU | SKU (Variant SKU) | sku | often the offer id | — |
| GTIN | Barcode (Variant Barcode) | barcode | gtin | empty → identifier_exists = no for one-of-a-kind |
| MPN, gender, age group, condition | Google Shopping / … columns | metafields (Google channel namespace) | mpn, gender, age_group, condition | — |
| Price | Price (Variant Price) | price (MoneyV2: amount + currencyCode) | price | CSV has no currency column; GraphQL carries ISO 4217 |
| Sale | Compare-at price | compareAtPrice | price = compare-at, sale_price = price | plus sale_price_effective_date |
| Market price | Price / [market] | price lists, contextualPricing(context: {country}) | price per target country | KRW, JPY: zero decimals |
| Cost | Cost per item | inventoryItem.unitCost | cost_of_goods_sold | — |
| Tax | Charge tax, Tax code | taxable, tax code | tax (US only), tax_category | — |
| Weight | Weight value (grams) (Variant Grams), Weight unit for display | inventoryItem.measurement.weight (value + unit) | shipping_weight, product_weight | CSV is grams only; GraphQL keeps g, kg, oz, lb |
| Dimensions | none | dimension metafields | shipping_length/width/height, product_length/… | not in CSV at all |
| Unit pricing | Unit price total / base measure + unit | unitPriceMeasurement | unit_pricing_measure, unit_pricing_base_measure | — |
| Inventory | Inventory quantity, Continue selling when out of stock | inventory quantities, inventoryPolicy | availability (in_stock, out_of_stock, preorder, backorder) | custom orders use preorder + availability_date |
| Shipping | Requires shipping, Fulfillment service | inventoryItem.requiresShipping | shipping, shipping_label | freight label for oversized pieces |
| Images | Product image URL, Image position, Image alt text | media (MediaImage url, alt) | image_link, additional_image_link | alt text per locale via translations |
| 3D models | none | media (Model3d, GLB / USDZ sources) | none | 3D stays on Shopify, R2 and Webflow |
| Translations | none (separate translation CSV) | translations(locale), translationsRegister | localized title, description per feed language | m2m100 pipeline |
| Origin and customs | none | inventoryItem.countryCodeOfOrigin, harmonizedSystemCode | none | ISO 3166-1; feeds WMS and customs |
| Custom specs | Metafield columns | metafields, metaobjects | product_detail | kelvin, area, materials as display text |

Cut over by loading the CSV once into GraphQL, then switching all writes to GraphQL mutations so the CSV is never a source again.

## The SAP → e-commerce break

SAP already holds every quantity as value + unit with an ISO code, and the break happens when that data is flattened into the product.csv shape on its way to the storefront. Each app downstream then reads the flattened copy, keeps its own version, and has no path back to the ERP's units, currency or origin data, so the loss becomes permanent.

For ECC specifically, see [ECC direct to Google](https://ecc-rust-book.yoonsunlee150.workers.dev/ecc-direct-to-google) (converting ECC's own data straight into Merchant Center's shape) and, for the screens, [Fiori-style UI5 apps at the edge](https://ecc-rust-book.yoonsunlee150.workers.dev/s4hana-alternative#substitutes-at-the-edge) calling ECC's OData services through the gate.

| SAP source | What SAP holds | What the CSV shape keeps | Lossless target in the Catalog data layer |
|---|---|---|---|
| Material master weights (MARA-BRGEW, NTGEW, GEWEI) | gross and net weight + unit | one weight, grams only | inventoryItem.measurement.weight + canonical KGM record with source unit |
| Volume (MARA-VOLUM, VOLEH) | volume + unit | nothing | volume metafield + canonical MTQ / LTR record |
| Dimensions per unit of measure (MARM-LAENG, BREIT, HOEHE, MEABM) | L × W × H for each, case and pallet | nothing | dimension metafields; packaging levels stay in WMS |
| Units table (T006 ISO code) | internal unit → ISO/UN unit code | not applicable | lookup to UN/CEFACT canonical codes |
| Currency and FX (TCURC, TCURR) | ISO 4217 codes, rates by type and date | a bare number | MoneyV2 with currencyCode; rate and rate date stored |
| Country of origin, commodity code | ISO country, customs code | nothing | countryCodeOfOrigin, harmonizedSystemCode |
| BOM and revisions | parent/child, quantity + unit, revision | nothing | BOM records keyed by Digital Link URI |

Where it breaks in practice:

- **Connectors map to the flat shape.** Integrations built around the CSV or the legacy REST product shape drop every field without a column, before any app sees it.
- **Apps keep copies.** Loyalty, reviews, comparison and CRM apps each store their own product data; none of them is designed to accept units, currency codes or origin back from the ERP.
- **No unit identity survives.** Once a weight is a bare gram value and a price a bare number, nothing downstream can tell which unit, currency or rate it came from, so no app can repair it.

The fix is to skip the flat shape: read SAP through its product APIs or MATMAS IDocs, map units through T006 ISO codes to UN/CEFACT, write directly to Shopify GraphQL and the canonical record, and let every app read from that record instead of storing its own copy.

## Permissions and boundary events

Each field has exactly one system of record that may write it; every other system reads. Every event that crosses a system boundary is validated for unit codes, currency and consent before it is accepted, and rejected rather than guessed when a code is unknown.

### Write ownership

| Field group | System of record (writes) | Readers |
|---|---|---|
| Dimensions, weight, volume | ERP / WMS item master | Shopify, feed, 3D scene |
| Temperature specs and telemetry | WMS + IoT ingest | ERP, ops dashboards |
| Price and currency per market | Shopify (Markets) | feed, Webflow, ERP |
| FX rate and rate date | ERP / finance | Shopify Markets, PO costing |
| Tax rates | tax engine per market | Shopify, feed (US only) |
| Reviews and ratings | review platform → Merchant API Reviews | Webflow, feed |
| Loyalty tiers and points | loyalty platform | Shopify, feed loyalty_program |
| Marketing consent and identity | consent layer (CRM Sync) | CRM, loyalty, ad platforms |

Access scopes: Shopify Admin API scopes limited per integration (e.g. `read_products` for the feed builder, `write_inventory` only for the WMS connector); the Merchant API through a dedicated Google Cloud project with the content OAuth scope; Merchant Center user roles kept to named people.

### Boundary events

| Boundary | Event | Checks at the boundary |
|---|---|---|
| ERP → Shopify | item master change | known UN/CEFACT codes, SI conversion, source_value kept |
| Supplier → WMS | PO (EDI 850), ASN (EDI 856) | GS1 AIs parsed to canonical units, currency + FX stamp on cost |
| IoT → WMS | telemetry reading, threshold breach | unit mapped, thermodynamic K vs color temperature tagged |
| Shopify → Merchant API | product create/update | price currency matches target country, units within Google limits |
| Merchant API → ops | product status change notification | disapprovals routed to field owner |
| Shopify → CRM / loyalty / ads | order, customer update | consent checked per subject at send time, not from a batch export |
| Any → archive | conversion or rejection | raw payload and rule version logged for audit |

## Migration from apps

Each app is migrated by extracting what it holds, normalizing every unit, currency, country and locale to the canonical codes, and writing it back to its system of record. Apps then read from the canonical data instead of keeping their own copies.

| App type | Unit and ISO data it holds | Normalization | Lands in |
|---|---|---|---|
| ERP (NetSuite, SAP, Acumatica, Odoo) | UoM tables, item dimensions and weights, currency, FX tables, tax codes | map each ERP UoM to its UN/CEFACT code; keep FX rates with their dates; tax codes per ISO country | item master (canonical), FX table |
| CRM (Klaviyo, HubSpot, Salesforce) | country, locale, currency, custom-order measurements, consent | ISO 3166-1, BCP 47, ISO 4217; add preferred unit system; consent moved as per-subject records, not list flags | customer profile + consent layer |
| Loyalty (Smile.io, LoyaltyLion, Yotpo) | points, tiers, reward values in one store currency | reward values per market in ISO 4217; points stay unitless integers; member prices per market | customer metafields, feed loyalty_program |
| Reviews (Judge.me, Okendo, Yotpo) | ratings, product IDs, fit and size answers (often imperial text) | map products to SKU/GTIN; parse measurements into canonical records; strip reviewer PII from exports | review platform → Merchant API Reviews, Webflow |
| Comparison (spec tables, comparison apps, shopping engines) | free-text specs such as "72 in" or "approx. 1.8 m" | parse to value + code; unparseable values go to a review queue | canonical record; tables render by locale |

Migration order: ERP item master first, since every other app references its dimensions and currency; then CRM and consent; then loyalty, reviews and comparison, which depend on both. Run each app in read-only parallel until its counts and totals reconcile, then cut over.

### Where each app now lands in Google

Apps that kept their own data can now publish it to Google through Merchant Center surfaces, fed from the canonical record rather than from each app's copy. Each surface carries ISO currency and country codes natively, so the unit and currency spine reaches Google intact.

| App type | Google surface | What it carries | Limits to plan for |
|---|---|---|---|
| RMA / returns | Online return policies (accounts.onlineReturnPolicies get, list, create) | countries (ISO 3166-1), return window in days, return methods (by mail, in store, kiosk), item conditions, restocking and return shipping fees with currencyCode, refund processing days, exchanges | publishes the policy, not individual RMAs; policies made in the Merchant Center UI take up to 10 business days to review; must match the policy on the website |
| Loyalty | Merchant loyalty program + loyalty_program attribute; Loyalty Customer Match via Merchant API | tiers, member prices, redeemable points, member free shipping | one supported country per Merchant Center account (KR and US are both supported, so each needs its own account); member price shows in ads only at 5% or 5 currency units off or more; uploaded customer identifiers need a per-subject consent check |
| Reviews (store) | Google store ratings | star rating, review count, delivery-time qualifier | about 100 eligible post-purchase reviews per country; ads need 3.5 stars or more; calculated per country, not globally; sourced from Google Customer Reviews or listed partners (Okendo, Yotpo, Stamped and others) |
| Reviews (product) | Merchant API product reviews | rating, review text, product identifiers (GTIN, MPN, SKU) | reviews must map to the same identifiers as the feed; reviewer PII stays out |
| Comparison | Comparison Shopping Services (CSS) in the Merchant API | the same product data, listed through a CSS partner | CSS applies in Europe; products come from the canonical feed, not a separate spec table |

The consent layer sits on the loyalty and review paths: Loyalty Customer Match and review requests both send customer identity to Google, so each send is checked per subject at the moment it happens.

## Regional model loading: APAC, EU, the Americas

Each region loads two kinds of models from the same canonical record: translation models for content, and 3D models for the viewport. Translation runs through PIM Sync: Meta m2m100-1.2B on Cloudflare Workers AI, pushed to Shopify with the GraphQL `translationsRegister` mutation and tracked from pending through translated, reviewed and published. 3D files (GLB, USDZ, STL, OBJ, 3MF) are hosted on Cloudflare R2 and loaded into Three.js / A-Frame scenes in meters.

| Region | Example markets | Currency (ISO 4217) | Display units | Translation | 3D asset storage | Price and tax notes |
|---|---|---|---|---|---|---|
| The Americas | US, CA, MX, BR | USD, CAD, MXN, BRL | US customary in US; metric elsewhere | none for US and CA English (Shopify auto currency conversion); m2m100 for es, pt, fr | R2 location hint for North America | US prices pre-tax with Merchant tax; BR VAT-style inclusive |
| EU + UK | DE, FR, NL, ES, IT, PT, PL, SE, UK | EUR, PLN, SEK, GBP | metric | m2m100 for de, fr, nl, es, it, pt, pl, sv; UK English uses auto conversion | R2 bucket in the EU jurisdiction for residency | VAT-inclusive prices |
| APAC | KR, JP, AU, NZ | KRW, JPY, AUD, NZD | metric | m2m100 for ko, ja; AU and NZ English use auto conversion | R2 location hint for Asia-Pacific / Oceania | KR 10% VAT included; KRW and JPY have zero decimal places |

Loading rules:

- The canonical record loads once; each region renders it with its own locale (BCP 47), currency and unit system at the edge.
- m2m100 takes ISO 639-1 codes and has a single pt and fr, so pt-BR and fr-CA output goes through the review stage before publishing.
- APAC languages (ko, ja) are an extension beyond PIM Sync's currently listed EU and Americas languages; confirm before launch.
- Price rounding is set per currency: KRW and JPY round to whole units, EUR and USD to cents, before any charm-pricing rule.
- 3D models load lazily per region from the nearest bucket; GLB and USDZ also sync to Shopify media so mobile AR works natively.
- Physical specs inside translated text ("213 cm", "2700 K") are never machine-translated; they are re-rendered from the canonical record per locale.

## Non-commerce specs: LiDAR, BOM, QA, agents and events

Every physical item has one identity key that scans, parts, QA results, agent actions and events all attach to: a GS1 Digital Link URI built from its GTIN and serial, e.g. `https://id.gs1.org/01/09506000134352/21/FO1-0142`. One-of-a-kind and antique pieces with no GTIN use an internal ID plus MPN, and the Merchant feed sets `identifier_exists` to no.

### Identifiers

| Identifier | Use | Applies to |
|---|---|---|
| GTIN (AI 01) | trade item | catalog products, purchased parts |
| Serial (AI 21) | individual unit | each custom order, each antique |
| MPN | manufacturer part number | parts and products without GTIN |
| GMN (AI 8013) | model number | made-to-order furniture lines |
| CPID (AI 8010) + serial (AI 8011) | component or part | BOM components, replacement hardware |
| GIAI (AI 8004) | fixed asset | scanners, warehouse machines, IoT sensors |

### LiDAR and 3D capture

- Raw scans are kept as LAS/LAZ or E57 point clouds in meters, with scanner, capture date (ISO 8601) and coordinate reference system recorded; phone room scans (e.g. RoomPlan) export USDZ.
- Derived meshes are exported as GLB for the viewport and Shopify media; the scan, mesh and canonical dimensions share the item's Digital Link URI.
- Measured length, width, height and volume from the scan are written as canonical records with `source_unit = scan` and a stated accuracy, never overwriting the specified dimensions.
- Install teams in Korea scan the room; the scene loads room and product in the same meter space to check fit before delivery.

### Machine part BOM

| BOM field | Format |
|---|---|
| Parent and child item | Digital Link URI, GTIN or MPN |
| Quantity per parent | decimal + UN/CEFACT unit code (C62 = each, MTR, KGM) |
| Revision | revision letter or number + effective date (ISO 8601) |
| Material and finish | controlled list per category |
| Supplier | manufacturer name, MPN, country of origin (ISO 3166-1) |
| Engineering geometry | STEP AP242 or the source CAD file, linked by revision |
| Substitutes | approved alternates by MPN, each with its own QA status |

### QA

- Dimensional check: scanned dimensions vs. specified canonical dimensions, within a tolerance set per product type (e.g. ±5 mm for case goods).
- Incoming inspection at the Korea warehouse uses ISO 2859-1 sampling (AQL) for production lots and 100% inspection for one-of-a-kind items.
- Antiques get a condition report (photos, scan, notes) attached to the serial; QA status values are pending, passed, failed, waived, each with inspector and date.
- A failed check blocks publishing and shipping for that serial until it is cleared or waived by a named person.

### Agent automation and permissions

- Agents can read the canonical record and propose changes (translations, GPC tags, BOM substitutes, QA summaries); they cannot publish, change price, delete or waive QA.
- Each agent has its own scoped credentials and identity; every proposal carries the agent ID, model and version, and the input it used.
- Human approval is required for price, publish, BOM revision, QA waiver and anything sent to customers; approvals are signed and logged with the same signing plane as the consent layer.

### Event management

Events use the CloudEvents envelope (id, source, type, time, subject), with subject set to the item's Digital Link URI so every event traces back to one physical item.

| Event type | Raised by | Effect |
|---|---|---|
| scan.captured | scanner app | creates measured dimensions, triggers QA |
| qa.passed / qa.failed | inspector or QA rule | unblocks or blocks publish and ship |
| bom.revised | engineering | new revision; open orders flagged for review |
| part.substituted | purchasing | requires QA status on the substitute |
| agent.proposed | agent | queued for review, nothing published |
| agent.approved / agent.rejected | named person | applies or discards the proposal |
| item.published | publish job | pushes to Shopify, Merchant API, Webflow |

## Geospatial data: KML for land, ocean and space

Locations are exported as KML (OGC KML 2.3), with every placemark carrying the same Digital Link URI and unit codes as the canonical record. KML coordinates are WGS84 longitude, latitude, altitude (in that order), with altitude in meters, so they line up with the meter-based 3D scene. LiDAR scans in a local or projected CRS are reprojected to WGS84 before export.

| Domain | What is mapped | KML altitude handling | Linked data |
|---|---|---|---|
| Land | warehouses, install sites, delivery addresses, supplier factories | clampToGround, relativeToGround (e.g. floor height in a building) | WMS location, order, scan, ISO 3166-1 country |
| Ocean | freight routes US → KR, ports, container positions, sea-floor assets | gx:clampToSeaFloor, gx:relativeToSeaFloor; depth as negative meters | UN/LOCODE ports, SSCC containers, IoT temperature readings |
| Air and space | air-freight legs, GNSS fixes, satellite IoT ground tracks, sky positions | absolute altitude in meters; sky data with hint="target=sky" (longitude = right ascension − 180°, latitude = declination) | GIAI tracker assets, telemetry events |

Rules:

- Time on every placemark uses TimeStamp or TimeSpan in ISO 8601, so routes replay in order.
- Custom fields go in ExtendedData (SchemaData with typed fields): Digital Link URI, GTIN or MPN, SSCC, unit code, currency, event ID.
- Ports use UN/LOCODE (e.g. USNYC, KRPUS for Busan); countries use ISO 3166-1 alpha-2.
- Container and cold-chain readings attach as scan.captured, qa.* and telemetry events whose subject is the item's or container's URI, so a map point opens its full event history.
- Orbital data itself (orbits, ephemerides) stays in its source format; KML holds only the derived ground track or position for display.

Example placemark:

```xml
<Placemark>
  <name>FO1-0142 at Busan</name>
  <TimeStamp><when>2027-01-08T14:20:00+09:00</when></TimeStamp>
  <ExtendedData>
    <Data name="subject"><value>https://id.gs1.org/01/09506000134352/21/FO1-0142</value></Data>
    <Data name="unlocode"><value>KRPUS</value></Data>
    <Data name="temp_max"><value>298.15 KEL</value></Data>
  </ExtendedData>
  <Point>
    <altitudeMode>clampToGround</altitudeMode>
    <coordinates>129.04,35.10,0</coordinates>
  </Point>
</Placemark>
```

## ISO data in UTF-8: space, sea, air and LiDAR

KML is the display layer. Behind it, each domain has its own identifiers and source formats, and the canonical record keeps those as text in UTF-8 (RFC 3629, the encoding form of ISO/IEC 10646), with numbers stored as numbers. The table lists the codes each domain carries into the record. The same Digital Link URI is the `subject` throughout.

| Domain | Identity | Position and reference system | Time | Source format (kept as is) | Display |
|---|---|---|---|---|---|
| Space | COSPAR ID (`1998-067A`), NORAD catalog number, GIAI for owned trackers | orbit in an inertial or Earth-fixed frame (GCRF, ITRF); ground track in WGS84 | UTC in ISO 8601; source time scale (UTC, TAI, GPS) recorded | CCSDS Orbit Data Messages (CCSDS 502.0, adopted as ISO 26900), OEM or OPM | derived ground track or position in KML (`absolute`) |
| Sea | IMO ship number (7 digits), MMSI (9 digits; Korea uses MID 440 and 441), ISO 6346 container code (`CSQU3054383`, check digit), SSCC, UN/LOCODE ports | WGS84 lon/lat; depth as negative meters with its vertical datum | AIS report time in UTC, ISO 8601 | AIS messages (ITU-R M.1371), ISO 19848 shipboard sensor data, IHO S-100 for charts | KML `gx:clampToSeaFloor` / `gx:relativeToSeaFloor`, or `clampToGround` at the surface |
| Air | ICAO 24-bit aircraft address, ICAO and IATA airport codes (`RKSI` / `ICN`), IATA air waybill (3-digit prefix + 8 digits, mod-7 check digit) | WGS84 lon/lat; barometric altitude (feet, flight level) and GNSS geometric height kept apart | UTC, ISO 8601 | ADS-B, cargo messages from the carrier; at least two feed providers (see the legacy network note below) | KML `absolute`, converted to meters with `source_unit` FOT kept |
| LiDAR | Digital Link URI of the scanned item or site, GIAI of the scanner | CRS as WKT2 (ISO 19162) or an EPSG code, horizontal plus vertical (e.g. EPSG 5186 Korea 2000 Central Belt 2010 + a height datum); reprojected to WGS84 only for display | capture time, ISO 8601 | LAS 1.4 / LAZ (CRS in the WKT VLR), COPC for streaming, E57 (ASTM E2807) | derived mesh as GLB in the meter scene; footprint or point in KML |

Rules for every domain:

- **Coordinate order is not shared.** ISO 6709 text and most ERP and WMS fields put latitude first. KML, GeoJSON (RFC 7946) and WKT in WGS84 put longitude first. The canonical record stores named fields (`lat`, `lon`, `h`) and never a bare pair, so the order can't flip during a load.
- **Heights carry their datum.** GNSS gives height above the WGS84 ellipsoid (EPSG 4979). KML `absolute` and charts use mean sea level, through a geoid model such as EGM2008 (EPSG 3855). In Korea the two differ by roughly 25–30 m. Record which one each height is, and convert with the geoid model, not with a constant.
- **Precision is stated.** Seven decimal places of a degree is about 1 cm, and six is about 11 cm. A phone scan isn't 1 cm accurate, so its stated accuracy (ISO 19157 data quality) travels with the value.
- **Air data sits on a legacy network.** US air traffic control still depends partly on a telecom network from the early 2000s, including copper circuits. Its failures have reached operations: the January 2023 NOTAM database outage, and in spring 2025 the loss of radar and radio links for Newark controllers working from Philadelphia. A multi-year replacement with fiber, wireless and satellite links is funded but not finished, and each facility cutover carries its own risk. Our air positions come from commercial ADS-B aggregators and carrier messages, not the FAA's internal network, so an outage there shows up as gaps or late bursts rather than wrong values. The rules: take air positions from at least two providers, keep the source time, mark gaps without filling them, and never let one feed's silence clear a shipment's ETA or status.
- **Space data stays in its frame.** Orbits are propagated from the CCSDS message. The KML point is a derived, timestamped display value, and it's never read back as the orbit.

UTF-8 rules:

- **One encoding and one normal form.** All text is UTF-8 without a BOM, normalized to NFC on load. Hangul matters here: a name typed on one system can arrive decomposed into jamo (NFD), for example a file name from older macOS storage. `부산` in NFD doesn't match `부산` in NFC, so a key lookup fails silently.
- **Codes are ASCII, names are Unicode.** UN/LOCODE, ISO 6346, IMO, MMSI, ICAO, EPSG and ISO 4217 values are checked against `[A-Z0-9]` patterns plus their check digits. Place names, ship names and notes are free UTF-8 text kept next to the code, never instead of it.
- **Numeric fields reject look-alikes.** Full-width digits (`１２９`), the minus sign U+2212 in place of `-`, a comma decimal (`129,04`), and the degree sign `°` U+00B0 confused with the ordinal `º` U+00BA all show up in pasted coordinates. NFKC is applied to numeric fields only, then they are parsed as numbers. A field that still fails is quarantined.
- **Declare the encoding in each format.** KML and GML: `<?xml version="1.0" encoding="UTF-8"?>`. JSON and GeoJSON are UTF-8 by spec (RFC 8259). EDIFACT uses syntax identifier `UNOW` for UTF-8. CCSDS KVN and AIS payloads are ASCII-only, so names in them are transliterated, and the UTF-8 name lives in the canonical record.

Example canonical record for one sea leg:

```json
{
  "subject": "https://id.gs1.org/00/095060001343520011",
  "container": "CSQU3054383",
  "vessel": { "imo": "9074729", "mmsi": "440123456", "name": "한바다호" },
  "from": "USNYC",
  "to": "KRPUS",
  "position": { "lat": 35.1000000, "lon": 129.0400000, "h": 0, "h_ref": "EPSG:3855", "accuracy_m": 10 },
  "time": "2027-01-08T05:20:00Z",
  "readings": [{ "n": "temp", "u": "Cel", "v": 21.5 }],
  "source": { "format": "AIS", "spec": "ITU-R M.1371", "raw_ref": "r2://raw/ais/2027-01-08/…" }
}
```

All identifiers above (SSCC, container, IMO, MMSI, vessel name) and the storage path are placeholders. `readings` uses SenML (RFC 8428) names and units.

## AI scaling and security for geospatial data

AI reads this data to summarize routes, flag QA failures, match scans to products and answer questions such as "where is order 0142?". It doesn't get the raw data. These are the requirements that keep it affordable and safe.

### Scaling

| Need | Rule |
|---|---|
| Point clouds are too large for a model | A survey scan is hundreds of millions of points (gigabytes), and even a phone room scan is megabytes. The model gets derived values: dimensions, accuracy, QA result and a thumbnail. Raw LAZ/COPC stays in R2 and is read by range, tile by tile, by code. |
| Tracks are too long for a context window | A container's AIS track can be thousands of fixes. A Worker reduces it to legs (port to port, with times and the gaps), and the model reads the legs. |
| Conversions must be exact | Unit, datum and coordinate conversions run in code with exact factors and the geoid model. The model never computes a conversion; it reads the converted record. |
| Compact, coded input | Records go to the model as JSON with ISO and UN codes (`KRPUS`, `KGM`, `Cel`), not prose. That uses fewer tokens and gives less room to misread. |
| Fan-out | Each scan, AIS batch or telemetry window is one Queue message. AI calls run per message with retries and a dead-letter queue, so a spike in scans doesn't become a spike of failed calls. |
| Retrieval | Embeddings index the metadata (names, notes, QA text) keyed by Digital Link URI. Coordinates and measurements are queried exactly in Xano and never matched by similarity. |

### Security

| Risk | Rule |
|---|---|
| Location is personal data | Delivery addresses and live positions of a person (a driver, an installer, a customer's home) are personal data. In Korea, personal location information also falls under the Location Information Act as well as PIPA. Positions tied to a person are blurred (for example, to postal-code or 3-decimal precision) before any model sees them, and pass the per-subject consent check like any other personal field. |
| Asset location is sensitive | A live container or tracker position is cargo-theft data. Only delayed or leg-level positions go to AI or to a public map. The live feed stays behind authenticated endpoints. |
| Residency and export | Korean site scans and positions stay in APAC storage. Korea restricts taking high-precision survey map data out of the country, so check before a site-level LiDAR scan or a survey-grade model of a Korean site leaves the region. |
| Text inside data is untrusted | Ship names, KML `description` and `ExtendedData`, scan notes and AIS free-text fields can contain instructions aimed at a model. They are passed to the model as quoted data, and model output can only propose (`agent.proposed`), never publish. |
| Unicode tricks | Bidirectional control characters (the Trojan Source class, CVE-2021-42574) and confusable letters (Cyrillic `а` in place of Latin `a`) are stripped or rejected in identifiers, using the Unicode Security Mechanisms (UTS #39). They're allowed in display names only after the bidi controls are removed. |
| Parser attacks | KML and GML are XML, so they're parsed with external entities and DTDs disabled (XXE). `NetworkLink` and remote `href` values are stripped on import, so a file can't make the server fetch a URL (SSRF). KMZ and LAZ are decompressed with a size limit to stop zip bombs. |
| Tampered records | Each canonical row is signed (HMAC over the stored fields). A batch of position or QA changes that fails signature checks freezes sync instead of publishing, as with the integrity tripwire on the Xano side. |
| Training | Customer positions, site scans and route history are not used to train or fine-tune shared models. Each agent call logs the agent ID, model, version and the input record IDs, not the raw coordinates. |

## Non-browser data chains

Most of this data never touches a browser: a scanner, an AIS receiver, a satellite IoT tracker, an ERP or a carrier's EDI. There's no cookie, no consent banner and no user session. So identity, consent and delivery guarantees have to be built into the chain itself.

| Chain | Transport | Device or sender identity | Payload | What goes wrong |
|---|---|---|---|---|
| Scanner → edge | HTTPS upload, resumable | mTLS client certificate per scanner (GIAI), checked at Cloudflare | LAZ/E57 or USDZ plus a JSON sidecar | partial upload; the scan is attached to the wrong item |
| Tracker or sensor → edge | MQTT 5 over TLS, or CoAP over DTLS | per-device certificate or key; device ID = GIAI | SenML in CBOR (RFC 8949), batched | offline at sea for days, then a burst; clock drift |
| AIS / ADS-B feed → edge | provider API or stream | provider API key plus an IP allowlist | decoded messages with UTC times | duplicate and out-of-order reports; a single provider going quiet during an upstream network outage |
| Space data → edge | provider API | provider key | CCSDS OEM/OPM | wrong frame or time scale assumed |
| ERP / carrier → edge | AS2 or SFTP for EDI, or a signed webhook | AS2 certificates, an SSH key, or an HMAC signature | EDIFACT (`UNOW`), X12 856/214, JSON | encoding not declared; a resent file is processed twice |
| Edge → system of record | Queue → Xano | Worker service credential, scoped per workspace | canonical record | at-least-once delivery writes twice without a key |

Rules for every chain:

- **The path is fixed.** Every chain enters the same way: device or sender → Cloudflare (authentication, size limits, UTF-8 and code checks) → Queue → Xano as the system of record → derived outputs (KML, GeoJSON, GLB, Merchant API, AI summaries). Nothing writes to Xano directly from a device, and no output is read back as input.
- **Machine identity replaces the browser session.** Each device has its own certificate or key, registered against its GIAI, and is revoked by itself. A shared fleet key is never used, because losing one tracker would then mean rotating all of them.
- **Every message is idempotent.** An idempotency key is formed from device ID, sequence number and the source timestamp. Replays inside the window are dropped, and a resent EDI file with the same interchange control number is acknowledged but not processed again.
- **Store-and-forward is expected.** Ships and remote sites batch readings while offline. The edge accepts late data, orders it by source time rather than arrival time, and marks gaps instead of interpolating them.
- **Time comes from the source.** The record keeps the device's time, the arrival time, and the difference between them. A device whose clock is off by more than a set limit is flagged, and its readings are held for review.
- **Consent is a legal basis, not a banner.** With no browser, consent can't be clicked. A person's position, such as a driver's phone or a wearable, needs a recorded legal basis per subject (contract, consent captured in the app, or employment terms) before it enters the chain. Equipment and cargo positions that aren't linked to a person don't.
- **Raw is archived and the edge is stateless.** The raw payload is written unchanged to R2 (step 1 of the load pipeline) before parsing, so any record can be rebuilt. The Worker keeps no state between messages; ordering and deduplication live in the Queue and in Xano.

## Load pipeline and validation

Every load, from an app migration or a daily feed, runs the same six steps, and a record that fails a check is quarantined rather than written.

1. Extract the raw payload as UTF-8 and archive it unchanged.
2. Parse each measurement into value + source unit; each price into amount + ISO 4217; each place into ISO 3166-1.
3. Map source units to UN/CEFACT codes through the lookup table; unknown codes stop the record.
4. Convert to SI with exact factors, keeping `source_value` and `source_unit`.
5. Validate against the rules below.
6. Publish to each reader: Shopify metafields, WMS, Merchant API, Webflow JSON-LD and the 3D scene.

Validation rules:

- Physical values are positive and inside plausible ranges per product type (a sofa between 0.5 m and 5 m long).
- Temperatures in kelvin are above 0; color temperature and thermodynamic temperature are never mixed.
- A converted value round-trips to its source within display rounding.
- Feed values sit inside Google's limits (shipping dimensions 1–400 cm, shipping weight up to 1000 kg); anything larger gets a freight `shipping_label`.
- Every price carries a currency; every FX conversion carries its rate and rate date.
- No customer record leaves for CRM, loyalty or ads without a current per-subject consent check.

## Open questions

- [ ] Which ERP and WMS are in scope first, and does the ERP's UoM table already carry ISO/UN codes?
- [ ] Which loyalty, review and CRM apps are installed today, and which stay after migration?
- [ ] Is the Google feed sent through Shopify's Google channel or a custom Merchant API integration?
- [ ] Is the FX rate source the ERP, Shopify Markets, or a bank feed, and how often does it refresh?
- [ ] Do any fo1.io products need cold-chain handling, or is kelvin only for lighting specs?
- [ ] Which markets launch first beyond US and KR?
- [ ] Which tracker and AIS data providers are in scope, and do their devices support per-device certificates?
- [ ] Which height datum does the Korea install team's scanner export (ellipsoidal or a local vertical datum)?
- [ ] Does any LiDAR of Korean sites need to leave APAC (for example, for an offshore modeling vendor)?

## Sources

- Google: Content API for Shopping deprecation and sunset
- Google Merchant Center: shipping weight
- Google Merchant Center: shipping length, width, height
- Google Merchant API: product attributes reference
- GS1 Australia: standards and v24 temperature AIs
- RFC 8428: SenML
- RFC 3629: UTF-8; RFC 8259: JSON; RFC 7946: GeoJSON; RFC 8949: CBOR
- ISO 6709: standard representation of geographic point location by coordinates
- ISO 19162: well-known text representation of coordinate reference systems; ISO 19157: data quality
- CCSDS 502.0: Orbit Data Messages (ISO 26900)
- ISO 6346: freight container coding; ITU-R M.1371: AIS; ISO 19848: shipboard data
- ASPRS LAS 1.4; ASTM E2807 (E57); COPC
- Unicode UTS #39: Unicode Security Mechanisms; CVE-2021-42574 (Trojan Source)
