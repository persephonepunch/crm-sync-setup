---
title: "Consented data layer test harness"
description: "Eighteen tests that prove a catalog has moved off a product.csv data layer: feeds on current APIs, identifiers joined by key, consent attached to every conversion, and a clean boundary between the PIM and the CRM. Each test is a shell check, an in-app check or a browser check, with the result that counts as a pass."
canonical: https://crm-sync.dev/docs/consented-data-layer-test-harness
category: "Specs"
date: 2026-10-19
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CONSENTED-DATA-LAYER-TEST-HARNESS.md
licence: CC-BY-4.0
tags:
  - consent
  - compliance
  - testing
  - pim
---
# Consented data layer test harness

Companion to *From product.csv to consented conversions*
(https://crm-sync.dev/docs/consented-data-layer).

**How to use it.** Copy this file into your PIM repository. Run each test, record the result in the
log at the end, and treat any failure as a release blocker. A test that has not been run is not a pass.

**Test kinds.** *Shell* is a command run from the repository root; it passes when it prints nothing,
unless the test says otherwise. *In-app* is a check in your PIM's own test page. *Manual* is a browser
or dashboard check: use a clean browser profile, DevTools open, and a UK or EEA exit (VPN) for the
consent tests.

---

## FD — Feeds

### FD-01 · No Content API calls (Shell)

```bash
grep -rInE "shoppingcontent|googleapis\.com/content|content/v2(\.1)?/" \
  --exclude-dir=node_modules --exclude-dir=build --exclude-dir=.git --exclude-dir=docs .
```

**Pass:** no output. Google's Content API for Shopping reached its sunset on 2026-08-18 and returns
HTTP 410 to clients without an extension.

### FD-02 · Merchant API is v1 only (Shell)

```bash
grep -rInE "merchantapi\.googleapis\.com/[a-z]+/v1(alpha|beta)" \
  --exclude-dir=node_modules --exclude-dir=build --exclude-dir=.git --exclude-dir=docs .
```

**Pass:** no output. Run it in every repository that talks to Merchant Center, not just the PIM.
Alpha and beta versions can change or disappear without the usual notice.

### FD-03 · Amazon listings use JSON feeds only (Shell)

```bash
grep -rInE "POST_PRODUCT_DATA|POST_PRODUCT_PRICING_DATA|POST_INVENTORY_AVAILABILITY_DATA|POST_FLAT_FILE" \
  --exclude-dir=node_modules --exclude-dir=build --exclude-dir=.git --exclude-dir=docs .
```

**Pass:** no output. Listings go out as `JSON_LISTINGS_FEED` or through the Listings Items API. Amazon
retired XML and flat-file listings feeds on 2025-07-31.

### FD-04 · Images at least 500×500 (Manual)

Merchant Center → Products → Diagnostics → filter "Image too small".

**Pass:** zero items before 2027-01-31, when 500×500 becomes the minimum for `image_link` and
`additional_image_link`.

### FD-05 · New spec attributes decided (Manual)

For each attribute, record "mapped" with its source field, or "not used": `video_link`, handling
cutoff time, minimum order value, loyalty program under shipping.

**Pass:** every attribute has a decision in the log.

### FD-06 · Agentic checkout attributes in a supplemental source (Manual)

Applies only if checkout inside Google AI Mode or Gemini (UCP) is wanted.

**Pass:** `native_commerce` and, where feed IDs differ from checkout IDs, `merchant_item_id` live in
a supplemental data source, not the primary feed.

---

## ID — Identifiers and joins

### ID-01 · GTIN or brand + MPN (In-app)

Run your PIM's product identifier check.

**Pass:** every product carries a GTIN, or the brand plus MPN pair. An MPN alone doesn't count.

### ID-02 · Shared key on every catalog row (Manual)

Count catalog rows missing `shopify_variant_id` or `market`.

**Pass:** zero. This key is the only allowed join between PIM and CRM data.

### ID-03 · ERP fields keyed by SKU and variant (Manual)

Trace one ERP field, such as cost or stock, from its source into the PIM.

**Pass:** the write is matched on SKU → `shopify_variant_id`, never on a CSV row number or position.

### ID-04 · product.csv is not the record of truth (Manual)

Change one product title in Shopify and wait for the webhook sync.

**Pass:** the PIM shows the new title without a CSV re-import. A fresh CSV export matches the PIM,
not the other way round.

---

## CN — Consent

### CN-01 · Google consent defaults set before tags (Manual)

On a fresh page load, before touching the banner, run in the DevTools console:

```js
dataLayer.filter(e => e[0] === "consent")
```

**Pass:** the first entry is `["consent", "default", {...}]` with `ad_storage`, `ad_user_data`,
`ad_personalization` and `analytics_storage` all `"denied"` for UK and EEA visitors, and it comes
before any `config` or `event` entry. After **Accept**, a `["consent", "update", {...}]` entry follows.

### CN-02 · Amazon consent signal for the UK, EEA and Switzerland (Manual)

DevTools → Network → filter `amazon-adsystem`, or the Amazon Ad Tag host you use.

**Pass:** each request carries `amzn_user_data` and `amzn_ad_storage`, or a TCF string whose vendor
list includes Amazon Ads vendor **793**. Before consent, both signals read "denied".

### CN-03 · Server-side conversions carry consent and a dedupe ID (Manual)

Place one test order with consent granted and one with consent denied. Inspect the Amazon Events API
and Google Enhanced Conversions payloads in your server logs.

**Pass:** the granted order is sent with its consent state and a dedupe ID shared with the browser
event. The denied order is not sent to Amazon, and reaches Google only as a cookieless ping.

### CN-04 · No ad cookies before consent (Manual)

Clear site data, load your UK storefront, and don't touch the banner. DevTools → Application → Cookies.

**Pass:** no `_gcl_*`, `_ga*` or Amazon ad cookies until **Accept**.

---

## BD — PIM and CRM boundary

### BD-01 · The PIM writes only its own tables (Shell)

List the table IDs your PIM owns, then search for writes to any other ID. For example, if the CRM
owns tables 180–211:

```bash
grep -rnoE "table/(18[0-9]|19[0-9]|20[0-9]|21[0-9])\b" app workers
```

**Pass:** no output, and every table the PIM writes is named in your boundary contract. A table that
neither side owns is a finding, even if nothing breaks.

### BD-02 · The PIM never reads CRM data at runtime (Shell)

```bash
grep -rnE "crm|consent" app/services workers | grep -v "^.*//"
```

**Pass:** no runtime reads of CRM hosts or tables. Mentions in comments are fine.

### BD-03 · GDPR webhooks handled (Shell)

```bash
grep -rnE "CUSTOMERS_DATA_REQUEST|CUSTOMERS_REDACT|SHOP_REDACT" app
```

**Pass:** all three topics print, each with a handler that logs or acts on the request.

### BD-04 · No customer personal data in the PIM (Shell + Manual)

Run your privacy test suite, then spot-check the PIM's tables.

**Pass:** the suite is green, and no PIM table has an email, phone or address field.

---

## Results log

| ID | Type | Date | Result | Notes |
| --- | --- | --- | --- | --- |
| FD-01 | Shell | | | |
| FD-02 | Shell | | | |
| FD-03 | Shell | | | |
| FD-04 | Manual | | | Due before 2027-01-31 |
| FD-05 | Manual | | | |
| FD-06 | Manual | | | Only if UCP checkout is wanted |
| ID-01 | In-app | | | |
| ID-02 | Manual | | | |
| ID-03 | Manual | | | |
| ID-04 | Manual | | | |
| CN-01 | Manual | | | |
| CN-02 | Manual | | | |
| CN-03 | Manual | | | |
| CN-04 | Manual | | | |
| BD-01 | Shell | | | |
| BD-02 | Shell | | | |
| BD-03 | Shell | | | |
| BD-04 | Shell + Manual | | | |

## Sources

- [Content API deprecation and sunset — Google](https://developers.google.com/shopping-content/guides/sunset)
- [Merchant Center product data specification update 2026 — Google](https://support.google.com/merchants/answer/16989427?hl=en)
- [Feeds API best practices — Amazon SP-API](https://developer-docs.amazon/sp-api/docs/feeds-api-best-practices)
- [Amazon Ads consent deadline June 30 — PPC Land](https://ppc.land/amazon-ads-consent-deadline-is-june-30-your-data-wont-work-after-that/)
- [Amazon DSP EU consent policy — AppsFlyer](https://support.appsflyer.com/hc/en-us/articles/45664244736529-Bulletin-Supporting-the-new-Amazon-DSP-EU-consent-policy)
- [Google Consent Mode update June 2026 — Xictron](https://www.xictron.com/en/blog/google-consent-mode-update-june-2026-shops/)
