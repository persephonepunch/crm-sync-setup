---
title: "From product.csv to Consented Conversions"
description: "Google retired the Content API and Amazon now drops conversions with no consent signal. Why a product.csv data layer can no longer feed ads or measurement, how a connected ERP, CRM and PIM replace it, and an eighteen-item checklist with a downloadable test harness."
canonical: https://crm-sync.dev/docs/consented-data-layer
category: "Specs"
date: 2026-10-19
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CONSENTED-DATA-LAYER.md
licence: CC-BY-4.0
tags:
  - consent
  - compliance
  - pim
  - architecture
  - migration
  - testing
keywords:
  - product.csv data layer
  - Content API for Shopping sunset
  - Merchant API migration
  - Amazon Consent Signal
  - consented conversions
  - PIM CRM ERP integration
---
# From product.csv to Consented Conversions

**For:** teams whose catalog still reaches Google and Amazon as an exported spreadsheet.
**Premise:** the spreadsheet isn't wrong, it's late. Everything below replaces the lateness, not the catalog.
**Companions:** [The Trust Framework](https://persephonepunch.github.io/crm-sync-setup/trust-framework.html) for why a record matters; [AI Trust Framework Requirements](https://persephonepunch.github.io/crm-sync-setup/ai-trust-framework-requirements.html) for the REST layer; [Global compliance harness checklist](https://crm-sync.dev/docs/global-compliance-harness-checklist) for the wider release gate.
**Download:** [`CONSENTED-DATA-LAYER-TEST-HARNESS.md`](https://crm-sync.dev/docs/raw?f=CONSENTED-DATA-LAYER-TEST-HARNESS.md&download=1), the eighteen-test harness · diagrams as [image](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-csb.jpg) or [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-csb.pdf) (challenge, solution, benefit) and [image](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-architecture.jpg) or [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-architecture.pdf) (before and after).

## The gap, in one sentence

A `product.csv` export describes the catalog as it was when someone ran the export. Google and Amazon now ask about each event as it happens, and they drop the events that can't show consent.

A nightly file can't say what a shopper agreed to at 14:32, because at 14:32 the file didn't exist.

## What changed in the last year

| Date | Platform | Change | What it does to a CSV data layer |
|---|---|---|---|
| 2026-08-18 | Google | [Content API for Shopping sunset](https://developers.google.com/shopping-content/guides/sunset); HTTP 410 errors from Sept 1, full shutdown early 2027 | Programmatic feeds must move to the Merchant API |
| 2026-06-30 | Amazon | [Consent signal required](https://ppc.land/amazon-ads-consent-deadline-is-june-30-your-data-wont-work-after-that/) on the Ad Tag, Conversions API and Events API for UK and EEA traffic; some sources add Switzerland | Conversions with no signal aren't used |
| 2026-06-15 | Google | `ad_storage` alone gates conversions and remarketing ([reported](https://www.xictron.com/en/blog/google-consent-mode-update-june-2026-shops/), not yet confirmed by Google) | No fallback when consent is missing |
| 2026-04-14 | Google | [Product data spec update](https://support.google.com/merchants/answer/16989427?hl=en): `video_link`, handling cutoff, minimum order value; 500×500 image minimum from 2027-01-31 | New columns a static export doesn't carry |
| 2025-07-31 | Amazon | [XML and flat-file listings feeds retired](https://developer-docs.amazon/sp-api/docs/feeds-api-best-practices) | Listings must go out as `JSON_LISTINGS_FEED` |

None of these is a ban on spreadsheets. Each one moves a decision from the file to the moment of the event.

## Challenge, solution, benefit

![From product.csv to consented conversions, in four rows. Source: a product.csv snapshot goes stale between imports; Shopify webhooks keep a live PIM record; feeds match the store. Feeds: the Google Content API and Amazon XML feeds are retired; the Merchant API v1 and JSON_LISTINGS_FEED replace them; feeds keep flowing. Joins: ERP, CRM and PIM are matched by spreadsheet row; one shared key, shopify_variant_id plus market, replaces the row; ownership is clear and only the CRM holds people data. Consent: Google and Amazon drop conversions with no signal; Consent Mode v2 and Amazon ACS or TCF vendor 793 travel with every event; UK, EEA and Swiss conversions count.](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-csb.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-csb.svg) (1600 × 744) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-csb.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-csb.pdf).*

Read each row left to right. The consent row is the goal. The other three make sure the data that reaches it is current, joined by key and owned by one system.

1. **Source.** The export is replaced by webhooks. A price changed in Shopify reaches the PIM when it changes, not at the next import.
2. **Feeds.** The retired channels are replaced by the APIs that replaced them. Nothing about the catalog changes; only the door it leaves through.
3. **Joins.** Rows matched by position are replaced by one key, `shopify_variant_id + market`. ERP cost and stock arrive keyed by SKU and variant.
4. **Consent.** The consent state travels with the event instead of being assumed. An event without it is not sent.

## Before and after

![Before and after. Before: ERP and Shopify exports are joined by row into product.csv, uploaded by hand or through the retired Content API, while browser tags fire with no consent signal; both reach Google and Amazon. After: Shopify and ERP changes arrive by webhook, keyed by SKU and variant, into PIM Sync, which feeds the Google Merchant API v1 and the Amazon JSON listings feed. Separately the shopper's consent banner sets Consent Mode v2 and ACS, CRM Sync stores the consent record, and server events carry consent state and a dedupe ID to Google and Amazon. The PIM and CRM paths are joined only offline, by shopify_variant_id and market.](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-architecture.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-architecture.svg) (1600 × 848) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-architecture.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/consented-data-layer-architecture.pdf).*

The catalog and consent take separate paths, and that separation is the design, not a gap.

- **The PIM owns the product record.** It writes only its own tables and never reads CRM data at runtime. It runs on its own if the CRM is absent.
- **The CRM owns the person.** Consent, identity and conversions live there, and only there.
- **They meet offline, by key.** `shopify_variant_id + market` reconciles a conversion to the product it was for, without either system reading the other's tables.

A PIM that never holds personal data can't leak it, and it doesn't have to be in scope for every privacy request.

## Readiness checklist

Each item has a test with the same ID in the harness below.

**Feeds**

- [ ] **FD-01** No Content API calls anywhere in the codebase
- [ ] **FD-02** Any Google feed push uses Merchant API v1, not an alpha or beta version
- [ ] **FD-03** Amazon listings go out only as `JSON_LISTINGS_FEED` or through the Listings Items API
- [ ] **FD-04** Every product image is at least 500×500 before 2027-01-31
- [ ] **FD-05** `video_link`, handling cutoff and minimum order value are mapped, or left out on purpose
- [ ] **FD-06** `native_commerce` and `merchant_item_id` sit in a supplemental source, if checkout inside Google AI Mode is wanted

**Identifiers and joins**

- [ ] **ID-01** Every product has a GTIN, or a brand plus MPN
- [ ] **ID-02** Every catalog row carries `shopify_variant_id + market`
- [ ] **ID-03** ERP fields arrive keyed by SKU and variant, never by CSV row order
- [ ] **ID-04** `product.csv` is an import or export only; the PIM is the record of truth

**Consent**

- [ ] **CN-01** The banner sets `ad_storage`, `ad_user_data`, `ad_personalization` and `analytics_storage` before any Google tag fires
- [ ] **CN-02** UK, EEA and Swiss visitors send `amzn_user_data` and `amzn_ad_storage`, or a TCF string with vendor 793
- [ ] **CN-03** Server-side conversions carry the consent state and a dedupe ID
- [ ] **CN-04** No ad cookie is set before consent

**PIM and CRM boundary**

- [ ] **BD-01** The PIM writes only the tables its boundary contract names
- [ ] **BD-02** The PIM never reads CRM tables at runtime
- [ ] **BD-03** The three GDPR webhooks are handled
- [ ] **BD-04** No customer personal data is stored in the PIM

## The test harness

<a class="doc-button" href="https://crm-sync.dev/docs/raw?f=CONSENTED-DATA-LAYER-TEST-HARNESS.md&download=1" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600;border-radius:0">Download the consented data layer test harness (Markdown) →</a>

Eighteen tests, one per checklist item. Seven are shell commands you can run from the repository root today. One runs in the PIM's own test page. The other ten are browser or dashboard checks with a stated pass condition.

**Run it in order.** The feed and boundary checks are fast and catch code problems. The consent checks need a UK or EEA exit and a clean browser, and they catch configuration problems that no code search will find.

**A test that hasn't run is not a pass.** The harness ends with a results log. An empty row is an open item, not a green one.

## Sources

- [Content API deprecation and sunset — Google](https://developers.google.com/shopping-content/guides/sunset)
- [Merchant Center product data specification update 2026 — Google](https://support.google.com/merchants/answer/16989427?hl=en)
- [Feeds API best practices — Amazon SP-API](https://developer-docs.amazon/sp-api/docs/feeds-api-best-practices)
- [Deprecation of Feeds API support for XML and flat-file listings feeds — Amazon SP-API](https://developer-docs.amazon/sp-api/changelog/deprecation-of-feeds-api-support-for-xml-and-flat-file-listings-feeds)
- [Amazon Ads consent deadline June 30 — PPC Land](https://ppc.land/amazon-ads-consent-deadline-is-june-30-your-data-wont-work-after-that/)
- [Amazon DSP EU consent policy — AppsFlyer](https://support.appsflyer.com/hc/en-us/articles/45664244736529-Bulletin-Supporting-the-new-Amazon-DSP-EU-consent-policy)
- [Amazon Consent Signal — Usercentrics](https://usercentrics.com/knowledge-hub/amazon-consent-signal/)
- [Google Consent Mode update June 2026 — Xictron](https://www.xictron.com/en/blog/google-consent-mode-update-june-2026-shops/)
- [UCP and Merchant Center — ChannelEngine](https://www.channelengine.com/en/blog/google-universal-commerce-protocol-merchant-center-ai-shopping)
