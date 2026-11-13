---
title: "Global Unit Data Loads — 3D Commerce, WMS & Merchant Feed Spec"
description: "Every physical quantity stored once, in SI units with an ISO/UN code, and converted at each surface's edge: the 3D viewport, the WMS, Shopify, the Google Merchant feed and every migrated app read the same canonical unit record. With the SAP and ECC break, GS1 identifiers, events and a six-step load pipeline."
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
---

# Global Unit Data Loads — 3D Commerce, WMS & Merchant Feed Spec

Nov 13, 2026 · Yoonsun Lee

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

## Sources

- Google: Content API for Shopping deprecation and sunset
- Google Merchant Center: shipping weight
- Google Merchant Center: shipping length, width, height
- Google Merchant API: product attributes reference
- GS1 Australia: standards and v24 temperature AIs
- RFC 8428: SenML
