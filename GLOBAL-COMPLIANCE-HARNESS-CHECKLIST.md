---
title: "Global compliance harness checklist: test-driven, AI-assisted"
description: "A checklist for a test harness that blocks a release when a consent, privacy, payment, residency or catalog rule fails. Each item is a test to write before the code: the rule, the kind of test, and the tool — static check, unit, integration, or end to end with Playwright or Selenium."
canonical: https://crm-sync.dev/docs/shopify-october-1-scripts-cart-catalog
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/GLOBAL-COMPLIANCE-HARNESS-CHECKLIST.md
date: 2026-09-30
licence: CC-BY-4.0
---

# Global compliance harness checklist: test-driven, AI-assisted

Companion to *October 1: script tags, Functions, the cart, the catalog agents read*
(https://crm-sync.dev/docs/shopify-october-1-scripts-cart-catalog), section G.

**How to use it.** Copy this file into your repository. For each item, write the test **first**,
watch it fail, then write the code that makes it pass. Tick the box only when the test runs on every
deploy and a failure blocks the release. An item with no test is not done, whatever the code says.

**Test kinds.** *Static* reads source or configuration without running it. *Unit* runs one function
in isolation. *Integration* runs two or more real parts together (worker and database, webhook and
handler). *E2E* drives a real browser through a real page — Playwright or Selenium.

**Rule for AI agents in the loop.** An agent may draft a test from the rule's text and write code
until it passes. It may not edit, skip or weaken a test to make it pass, and it may not add a test
to a known-failures list. A person approves every test that states a legal rule, and every change
that touches keys or money.

---

## 1. The gate itself

- [ ] **Every deploy runs the harness.** The deploy command runs the suites before publishing; a
      manual deploy that skips them is not possible from the standard script. *Static.*
- [ ] **A failing GREEN test blocks the release.** Only tests named in a reviewed known-failures
      list may fail, and each has an owner and a date. *Static.*
- [ ] **The known-failures list only shrinks.** A listed test that now passes fails the gate until
      it is removed from the list. *Static.*
- [ ] **A skipped critical test fails the gate.** Skipping is not passing. *Static.*
- [ ] **Each release is tagged with the commit it came from.** Uncommitted changes are marked, so
      production always maps to a commit. *Static.*
- [ ] **Each legal test cites its source** — the statute, regulation or platform document it
      encodes — in its name or comment. *Static.*

## 2. Consent before measurement

- [ ] **No advertising or analytics request before consent.** Load the page with no stored choice;
      assert zero requests to ad and analytics hosts until the visitor accepts. *E2E (network).*
- [ ] **Consent Mode v2 defaults to denied** for `ad_storage`, `analytics_storage`, `ad_user_data`
      and `ad_personalization`, and the default is set before any tag loads. *E2E / static.*
- [ ] **Stored consent replays before tags load** on a return visit. *E2E.*
- [ ] **Rejecting is as easy as accepting**: the reject control is on the first layer of the banner.
      *E2E.*
- [ ] **A browser opt-out preference signal is honoured.** Send `Sec-GPC: 1` and assert sale and
      sharing are off for the session without any click (California regulations §7025; AB 566 adds
      a browser-level signal from 1 January 2027). *E2E.*
- [ ] **Withdrawal propagates within a stated time** to every downstream system that holds the
      identifier. Measure it; the test fails past the limit. *Integration.*

## 3. Consent before retargeting

- [ ] **No session-level Consent Mode v2 record, no upload.** A purchase's identifiers reach Google
      or Meta only when the consent event for that purchase's session is on record. *Integration.*
- [ ] **`ad_user_data` and `ad_personalization` are recorded, never derived** from analytics
      consent. *Unit.*
- [ ] **Audience and conversion uploads refuse records without a market (ISO 3166-1) and consent
      state.** *Unit.*

## 4. Jurisdiction: where personal data may go

- [ ] **Korea (PIPA art. 28-8).** No Korean buyer's identifier leaves Korea for Google, Meta or any
      overseas processor until itemised overseas-transfer consent exists with evidence; aggregate
      counts only until then. *Integration.*
- [ ] **Korean personal data is processed on Korean-hosted services** or the request is refused.
      *Integration.*
- [ ] **EU and UK (GDPR).** Transfers outside the EEA and UK have a recorded basis per processor.
      *Static (processor register).*
- [ ] **Jurisdiction is the data subject's**, not the server's or the store's. *Unit.*

## 5. Data subject requests

- [ ] **Shopify compliance webhooks exist and answer**: `customers/data_request`,
      `customers/redact`, `shop/redact`. *Integration.*
- [ ] **Each webhook verifies its HMAC** and returns 401 on a bad signature. *Unit.*
- [ ] **A redaction reaches every copy** — database, cache, search index, analytics export. The test
      reads each back. *Integration.*
- [ ] **Deletion keeps what the law requires kept** (tax and order records) and says so in the
      response. *Integration.*

## 6. Payments

- [ ] **Payment tests run only against test mode**: Shopify's Bogus Gateway on a development store,
      or Stripe test keys. The harness refuses a live key. *Static.*
- [ ] **Success, decline and gateway failure each have a test.** Bogus Gateway card numbers `1`
      (approved), `2` (declined), `3` (gateway failure); Stripe `4242 4242 4242 4242` (success),
      `4000 0000 0000 0002` (declined). *E2E.*
- [ ] **Strong customer authentication has a test.** Stripe `4000 0027 6000 3184` requires a 3-D
      Secure challenge; assert both the completed and the failed challenge. *E2E.*
- [ ] **Card fields live in the provider's hosted iframe**; no card number enters your page's DOM,
      logs or requests (PCI DSS scope). *E2E (network) + static.*
- [ ] **No card number, CVC or full token in any log line.** *Static.*
- [ ] **An agent purchase needs a mandate**: an AI agent can complete checkout only inside a
      recorded, scoped, expiring authorisation. *Integration.*

## 7. Shopify after 1 October 2026

- [ ] **No code path creates or updates a script tag** (`scriptTagCreate`, `scriptTagUpdate`, REST
      `script_tags`). *Static.*
- [ ] **Tracking runs in a web pixel that reads consent before sending.** *Static + E2E.*
- [ ] **System data uses double-underscore cart attributes**; themes filter single-underscore line
      item properties. *Static + E2E.*
- [ ] **No reserved metafield namespace is written by your app.** *Static.*

## 8. The catalog agents read

- [ ] **Every price carries an ISO 4217 currency.** *Unit.*
- [ ] **Every record carries an ISO 3166-1 market key** — uppercase in data, lowercase in URLs.
      *Unit.*
- [ ] **One tested mapping between BCP 47 language tags and Shopify's `LanguageCode`**, with a round
      trip for every language you sell in. *Unit.*
- [ ] **Products carry GTIN or MPN** before an agent may quote them. *Integration.*
- [ ] **Estimates are labelled as estimates**, never as quotes. *Unit.*

## 9. Accessibility

- [ ] **Checkout and consent surfaces pass an automated accessibility scan** (axe-core in
      Playwright or Selenium) with zero serious or critical findings — the European Accessibility
      Act has applied to e-commerce since 28 June 2025. *E2E.*
- [ ] **The consent banner and payment form work by keyboard alone.** *E2E.*

## 10. Secrets and the agent

- [ ] **No secret in a test fixture, snapshot or recorded video.** *Static.*
- [ ] **Agents never read raw secrets**; privileged steps are run by a person and recorded.
      *Static (process).*
- [ ] **Every test the agent drafted was read by a person** before it joined the gate. *Process.*

---

Licence: CC BY 4.0. Rules are summaries, not legal advice — confirm each against its source and with
counsel in the market it covers.
