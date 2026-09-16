---
title: "Shopify and Google sunsets: what is due before 11 November 2026"
description: "Every Shopify, Google Analytics and Google Ads deprecation dated between 16 September and 11 November 2026, the five topics merchants ask about — native mobile, short-lived tokens, the REST sunset, GraphQL data layers, and GA4 consent and conversions — and whether CRM Sync is exposed to each, with every source linked."
canonical: https://persephonepunch.github.io/crm-sync-setup/shopify-and-google-sunsets.html
category: "Shopify"
date: 2026-09-16
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SHOPIFY-AND-GOOGLE-SUNSETS.md
licence: CC-BY-4.0
tags:
  - shopify
  - graphql
  - ga4
  - consent
  - migration
keywords:
  - Shopify API version 2025-10 retirement
  - Shopify script tags deprecated
  - expiring offline access tokens
  - Shopify REST Admin API sunset
  - Polaris web components checkout extensions
  - Google Ads API v22 sunset
  - Data Manager API Customer Match
  - offline conversion imports
  - Consent Mode ad_personalization
  - Google Signals ad_storage
  - Shopify React Native Swift Kotlin
---
# Shopify and Google sunsets

> A sunset rarely breaks with an error. It keeps answering, on a version nobody chose, until a number is quietly wrong.

**Audience** Business analyst, platform engineer, compliance reviewer
**Status** Current · Version 1.0
**Owner** Platform engineer (role)
**Evidence basis** Platform pages read 16 September 2026; CRM Sync worker at commit `8eb2102`
**Review cycle** Each Shopify quarterly API release; next 1 January 2027
**Related** [Commerce API migration calendar](https://www.crm-sync.dev/pages/difference#calendar)

---

## At a glance

**[Open the interactive brief: Shopify and Google Sunsets](https://claude.ai/artifact/Wj7pWeMPyxU7DPQEbXd3HL)** · **[Download the full migration calendar (.md)](https://crm-sync.dev/calendar/migration-timeline.md)**

Two of the five topics carry a date inside the eight weeks from 16 September to 11 November 2026: Shopify API version retirement and the Google Ads API. Neither reaches the running CRM Sync worker. One item needs work: two Shopify Flow extensions are pinned to an API version Shopify has already retired. Short-lived tokens are due on 1 January 2027, the REST shutdown has no date, the native mobile move is Shopify's own apps rather than a developer deadline, and two Google consent changes are announced for later in 2026 without a date.

Status words used below: **Clear** means no exposure in the running code; **Action** means something to change, with an owner; **Watch** means real but undated; **Passed** means already in effect.

---

## The question this answers

Which platform changes land in the next eight weeks, and does any of them touch what is running today? It covers the five topics raised by the business — native mobile, short-lived tokens, the REST sunset, GraphQL data layers, and GA4 consent and conversions — plus every other Shopify and Google change found dated inside the window.

## Terms, fixed here

| Term | Means | Is not |
|---|---|---|
| Deprecated | Announced as going away. It still works. | Removed. |
| Sunset / retired | The date the platform stops honouring it. | Always an error. Shopify serves a retired API version from the oldest supported one. |
| Fall forward | Shopify answers a retired version on a newer one; the `X-Shopify-API-Version` response header names it. | Safe. Removed fields return differently, still with a 200. |
| Expiring offline token | A Shopify Admin credential lasting 60 minutes, renewed by a 90-day refresh token. | A certificate. |
| Consent signal | A Consent Mode v2 value a page sends Google: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`. | A console setting. Google is moving control to these signals. |
| Data Manager API | Google's single upload endpoint for audiences and conversions. | The Google Ads API, which Customer Match and offline conversions have left. |

In words: deprecated means it still works; retired means the platform stops honouring it, and on Shopify that usually means a request quietly answered on a newer version rather than an error. An expiring offline token lasts an hour and renews from a 90-day refresh token. Consent signals, not console toggles, are becoming Google's control for advertising data.

---

## Everything dated inside the window

| Date | Change | Exposure | Status |
|---|---|---|---|
| 1 Oct 2026 | Script tags: apps can no longer create or update them, in GraphQL or REST. They stop running on storefronts on 1 March 2027. | None; CRM Sync uses no script tags. | Clear |
| 1 Oct 2026 | Checkout and customer-account extensions must finish moving to Polaris web components. | None; no checkout or customer-account extensions. | Clear |
| 1 Oct 2026 | Shopify API version 2026-10 released. | No change required. | Clear |
| 7 Oct 2026 | Google Ads API v22 shut off; v22 requests fail. | None; audiences use the Data Manager API. | Clear |
| 16 Oct 2026 | Shopify API version 2025-10 retired at 15:00 UTC. | Worker on 2026-04, supported to 16 April 2027. Two Flow extensions pin 2025-01. | Action |

In words: on 1 October Shopify refuses new or updated script tags and requires Polaris web components in checkout and customer-account extensions, and CRM Sync uses neither. On 7 October Google shuts off Google Ads API v22, which CRM Sync does not call. On 16 October Shopify retires API version 2025-10; the worker runs on 2026-04, but the two Flow extensions are pinned to 2025-01 and should be moved to a supported version.

---

## 1. React Native to Swift and Kotlin

On 10 September 2026 Shopify said it is rebuilding its own mobile apps natively, in Swift for iOS and Kotlin for Android; the Shop app was first, rebuilt in 12 weeks. This is an engineering decision about Shopify's apps, not a deprecation. No end date for React Native tooling that outside developers use was found, and CRM Sync has no React Native code. **Status: Watch** — whether Shopify's mobile SDKs follow its apps.

## 2. Short-lived tokens

From **1 January 2027** every public app must call the Admin API with expiring offline tokens; a non-expiring token gets authentication errors after that date. New public apps have needed them since 1 April 2026. Custom apps and merchant-created apps are exempt.

CRM Sync's token exchanges already request expiring tokens. What is not yet checked is whether every installed shop has switched: migration happens once per shop, cannot be undone, and a new token retires the old refresh token immediately. **Status: Action** — confirm per shop during October, so a missed shop is found before New Year's Day rather than on it.

## 3. The REST sunset

The REST Admin API has been legacy since 1 October 2024, and new public apps have been GraphQL-only since 1 April 2025. Shopify has not set a shutdown date for existing apps; the only REST change inside the window is the script tag write refusal on 1 October. CRM Sync makes one REST call, for shop details, and everything else is GraphQL. **Status: Watch**, with an optional action to move that call to the GraphQL `shop` query so nothing depends on REST when a date is set.

## 4. GraphQL data layers

| Change | Date | Exposure | Status |
|---|---|---|---|
| API version 2025-10 retired | 16 Oct 2026 | Flow extensions on 2025-01 already fall forward | Action |
| API version 2026-04 retired | 16 Apr 2027 | The worker's pinned version | Watch |
| Web pixel events strip name, email, phone and address unless the app is approved for protected customer data | 10 Dec 2025 | Anything reading email from pixel events receives blanks | Passed |
| Additional scripts stop on non-Plus Thank you and Order status pages | 26 Aug 2026 | Tracking comes from Customer Events | Passed |

In words: the version clock is the live risk — 2025-10 retires on 16 October and 2026-04, the worker's version, on 16 April 2027. Two data-layer changes are already in effect: since 10 December 2025 web pixel events carry no customer name, email, phone or address unless the app holds approved protected customer data access, and since 26 August 2026 additional scripts no longer run on non-Plus Thank you and Order status pages.

## 5. GA4, consent v2 and conversion sunsets

| Change | Date | Exposure | Status |
|---|---|---|---|
| Customer Match uploads moved from the Google Ads API to the Data Manager API | 1 Apr 2026 | Already on the Data Manager API | Passed |
| Offline conversion uploads left the Google Ads API | 15 Jun 2026 | Not used | Passed |
| `ad_storage` alone decides whether GA4 data reaches Google Ads; the Google Signals setting no longer does | 15 Jun 2026 | Consent signals are sent before any tag loads | Passed |
| Ads personalization settings move from GA4 to Google Ads; `ad_personalization` becomes the only control | Later 2026, undated | Signals already sent; confirm the Ads account setting matches when dated | Watch |
| IP addresses the Google tag collects are encrypted and sent to the linked Ads account | Later 2026, undated | No code change; re-read any privacy notice that describes IP handling | Watch |
| GA4 user deletion runs on Google's `v1alpha` admin API | No date | Alpha versions can change without the usual notice | Watch |

In words: three Google changes have already happened. Customer Match uploads moved to the Data Manager API on 1 April 2026, which CRM Sync already uses; offline conversion uploads left the Google Ads API on 15 June 2026, which CRM Sync does not use; and since 15 June the `ad_storage` consent signal alone decides whether GA4 data reaches Google Ads. Later in 2026, on a date Google has not announced, ads personalization settings move from GA4 into Google Ads with `ad_personalization` as the only control, and tag-collected IP addresses are encrypted and sent to the linked Ads account. CRM Sync already sends `ad_personalization` and `ad_user_data`; when Google sets the date, the Google Ads account's setting should be checked against the signal. The GA4 user deletion used for privacy requests runs on an alpha API, so a deletion that starts failing should be diagnosed with the GA4 deletion preflight first.

---

## Just past the window

| Date | Change | Exposure | Status |
|---|---|---|---|
| 1 Dec 2026 | Returns and subscription apps need Customer Account API sign-in to keep Built for Shopify status | Does not apply | Clear |
| 1 Jan 2027 | Expiring offline tokens required for all public apps | Exchange ready; per-shop migration unchecked | Action |
| 1 Jan 2027 | POS Liquid receipt templates converted automatically | No POS receipts | Clear |
| 1 Mar 2027 | Script tags stop running on storefronts | None used | Clear |

In words: on 1 December 2026 returns and subscription apps need Customer Account API sign-in for Built for Shopify status, which does not apply to CRM Sync. On 1 January 2027 expiring offline tokens become mandatory for all public apps, and POS Liquid receipt templates are converted automatically. On 1 March 2027 script tags stop running on storefronts.

---

## What it costs to leave these alone

| Left alone | What it looks like from outside | Severity |
|---|---|---|
| Flow extensions on 2025-01 | Flow runs keep succeeding on a substituted version; a field that changed shape returns empty, and nothing errors | Medium, silent |
| A shop not migrated to expiring tokens | Admin calls for that one shop fail from 1 January while every other shop works | High, dated |
| Ads personalization dated without notice | Personalized audiences shift because the Ads setting disagrees with the consent signal | Medium, undated |
| GA4 alpha API changes | A privacy deletion records that Google was not instructed | Low; the record says so |

In words: the most expensive item is a shop left on a non-expiring token, because it fails on a known date and only for that shop. The quietest is the Flow extension version, which never errors — it returns different data with a success status.

**What this does not claim.** It covers the five topics raised and the Shopify and Google changes found dated inside the window. It is not a full audit of every Shopify changelog entry, and the React Native finding reflects what Shopify has published about its own apps, not a guarantee about its SDKs.

## What to do next

1. **Bump both Flow extensions off 2025-01** to a supported API version and deploy the app. Owner: platform engineer.
2. **Confirm every installed shop holds an expiring token** during October. Owner: platform engineer.
3. **Match the Google Ads personalization setting** to the `ad_personalization` signal when Google dates the change. Owner: Revenue BA with the Google Ads account owner.
4. **Replace the last REST call** with the GraphQL `shop` query. Owner: platform engineer. Optional.
5. **Review again on 1 January 2027**, when 2027-01 releases and three months before 2026-04 retires. Owner: platform engineer.

---

## Sources

Platform pages are primary; agency and news articles are secondary and were used only for dates a platform page did not state.

**Shopify**
- About Shopify API versioning — https://shopify.dev/docs/api/usage/versioning
- Shopify developer changelog: action required — https://shopify.dev/changelog?filter=action-required
- Expiring offline access tokens required for all public apps as of January 1, 2027 — https://shopify.dev/changelog/expiring-offline-access-tokens-required-for-all-public-apps-as-of-january-1-2027
- Pixel Privacy — https://shopify.dev/docs/api/web-pixels-api/pixel-privacy
- Native is now the future of mobile at Shopify — https://shopify.engineering/back-to-native

**Google**
- Updates to Google Analytics Data Controls — https://support.google.com/analytics/answer/17016975?hl=en
- Google Ads API deprecation and sunset dates — https://developers.google.com/google-ads/api/docs/sunset-dates
- Google Ads API v22 sunset reminder — https://ads-developers.googleblog.com/2026/09/google-ads-api-v22-sunset-reminder.html
- Google Ads API v21 sunset reminder — https://ads-developers.googleblog.com/2026/06/google-ads-api-v21-sunset-reminder.html

**Secondary**
- Shopify script tags are being switched off: the two dates that matter — https://learnshopify.dev/blog/shopify-script-tags-deprecated
- Shopify Updates August 2026 (Fudge) — https://www.fudge.ai/blog/shopify-updates-august-2026/
- Shopify breaking changes 2026 (Weaverse) — https://weaverse.io/blogs/shopify-developer-breaking-changes-april-2026
- Shopify drops React Native for Swift and Kotlin (InfoQ) — https://www.infoq.com/news/2026/09/shopify-drops-react-native/
- Shopify's REST API deprecation and GraphQL migration (Lazer) — https://www.lazertechnologies.com/insights/shopifys-rest-api-deprecation-and-graphql-migration-guide
- What customer data Shopify redacts from web pixel events (WeltPixel) — https://weltpixel.com/blogs/news/what-customer-data-is-available-in-shopify-web-pixel-events-and-what-shopify-redacts
- GA4 and Google Ads data controls: what changes June 15, 2026 (Dataslayer) — https://www.dataslayer.ai/blog/ga4-google-ads-data-controls-june-15-2026
- Google forces Customer Match uploads to Data Manager API by April 1 (PPC Land) — https://ppc.land/google-forces-customer-match-uploads-to-data-manager-api-by-april-1/
- Google is moving offline conversion imports out of the Google Ads API (Search Engine Land) — https://searchengineland.com/google-is-moving-offline-conversion-imports-out-of-the-google-ads-api-477669

---

*Platform dates read 16 September 2026. Dates marked "later 2026" are unannounced by the platform, not estimated here. This is a change brief, not a certification.*
