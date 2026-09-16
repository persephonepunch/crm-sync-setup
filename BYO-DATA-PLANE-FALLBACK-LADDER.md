---
title: "The BYO data plane fallback ladder: whose warehouse, and what erasure does to it"
description: "When a tenant brings its own Xano and BigQuery, every write has to land in the tenant's warehouse, and every erasure has to respect the tenant's choice. The five-rung ladder that resolves a tenant's BigQuery project, the operator-approved exceptions and the page that manages them, the tombstone-then-purge erasure and the per-tenant policy for the tenant's own planes, and what Shopify, Google and Klaviyo each do with a deletion."
canonical: https://persephonepunch.github.io/crm-sync-setup/byo-data-plane-fallback-ladder.html
category: "Security"
date: 2026-09-16
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/BYO-DATA-PLANE-FALLBACK-LADDER.md
licence: CC-BY-4.0
tags:
  - xano
  - gdpr
  - compliance
  - ga4
  - architecture
keywords:
  - bring your own BigQuery
  - bring your own Xano
  - fallback ladder
  - BigQuery project resolution
  - platform project exception
  - data subject request tombstone
  - erasure hold period
  - tombstone then purge
  - GA4 user deletion API
  - Klaviyo profile suppression
  - Shopify customers redact timing
  - BigQuery time travel fail-safe
---
# The BYO data plane fallback ladder

> A tenant that brings its own Xano and BigQuery owns what is in them. So the platform needs two rules it can prove: every write lands in the tenant's own warehouse unless an operator has approved otherwise, and every erasure does to the tenant's planes what the tenant chose, while doing to the platform's own copies what the law requires.

**Audience** Platform engineer, compliance reviewer, buyer evaluating a bring-your-own deployment
**Status** Current · Version 1.0
**Owner** Platform engineer (role)
**Evidence basis** Worker release of 16 September 2026; vendor documentation read the same day
**Review cycle** Quarterly, and whenever a vendor changes its deletion timeline
**Related** [BYO Xano and BigQuery against Google's agent platform](https://persephonepunch.github.io/crm-sync-setup/byo-xano-bigquery-vs-google-agent-costs.html) · [Logging and trace fees](https://persephonepunch.github.io/crm-sync-setup/logging-and-trace-fees.html)

---

## The findings, briefly

**A tenant's BigQuery project is resolved by a five-rung fallback ladder**: an admin override, then the tenant's own configured project, then an operator-approved exception, then the platform project only for a tenant that already runs on the platform's own Xano workspace, and otherwise the write is refused.

**A tenant on its own Xano can only reach the platform BigQuery project through an approved exception**, and each exception carries a written reason, an approver and a date, and is recorded in the configuration ledger.

**An erasure is a tombstone first and a purge later.** At the request, the person stops receiving advertising and email marketing and disappears from public pages; after a hold of up to 28 days, the data is deleted.

**Each tenant chooses what the purge does to its own Xano and BigQuery**: delete, which is the default, or keep with the person permanently suppressed. Data the platform holds itself is always deleted.

**Every vendor tombstones before it deletes.** Shopify forwards a deletion request after 10 days or after six months from the last order, Google Analytics hides a user within 24 hours and removes the data within 63 days, and BigQuery keeps deleted rows recoverable for up to 14 days.

---

## Vocabulary

| Term | Means | Is not |
|---|---|---|
| BYO tenant | A tenant whose Xano workspace or BigQuery project is its own, reached through access it granted and can revoke | A tenant with its own login to the platform's systems |
| Platform project | The platform's own BigQuery project | A default any tenant falls into |
| Rung | One step of the fallback ladder, tried in order | A permission level |
| Exception | An operator's approval that one tenant may use the platform project | A code change. Exceptions are data |
| Tombstone | The immediate part of an erasure: suppression and withdrawal, with the data still held | Deletion |
| Purge | The scheduled part of an erasure: deletion or anonymisation after the hold | Immediate |
| Hold | The time between tombstone and purge, up to 28 days | A delay in stopping use. Use stops at the tombstone |
| Erasure policy | A tenant's choice of `purge` or `tombstone_only` for its own Xano and BigQuery | A choice about the platform's own copies |

---

## The fallback ladder

The same shape as the publishing ladder, where a document resolves to its rendered page, then its PDF, then its markdown, then "missing": try each rung in order, stop at the first that holds, and record which one it was.

1. **Override.** An admin call names a project explicitly.
2. **Tenant configuration.** The tenant's own configured BigQuery project.
3. **Exception.** An operator has approved this tenant to use the platform project.
4. **Platform Xano.** The tenant runs on the platform's own Xano workspace, so the platform project is already its warehouse.
5. **Refused.** A tenant on its own Xano with no project and no exception. Nothing is written anywhere.

Rungs 1 and 2 are refused as well when they would point a tenant on its own Xano at the platform project without an exception. A request cannot talk its way into the platform warehouse by naming it.

Every endpoint that writes pLTV scores, identity maps, consent reconciliation, reviewer sentiment or document tags uses this ladder, and so does erasure. Before 16 September 2026 these endpoints fell back to the platform project whenever the caller omitted one, so a BYO tenant could be written into the platform warehouse by default.

---

## Exceptions, and the page that manages them

Some tenants legitimately need the platform project: a proof of concept that has not yet provisioned a warehouse, or a client project that is locked to the platform's infrastructure by agreement. An exception records that decision.

| Property | Rule |
|---|---|
| Who can approve | Platform administrators only, with the platform key or an administrator session. A tenant cannot grant itself one |
| What it needs | A written reason of at least 10 characters, shown to every operator |
| What it records | Tenant, reason, approver, date |
| Audit | Every approval and revocation is written to the configuration ledger as a hashed before-and-after |
| Scope | Registered tenants, or tenants with a configuration record, only |
| Where it lives | Platform configuration data, never in code. Some tenants belong to separately locked client projects that platform code must not name |

**The operator page** shows the ladder, then every tenant with its backend (platform Xano or its own), the rung its BigQuery project resolves to, its erasure policy and hold, and its exception. Approving opens an inline reason field; revoking explains the consequence first, because a revoked tenant with no project of its own is refused on its next write. There are no browser confirmation dialogs; every action is a visible step on the page.

---

## Erasure: tombstone, then purge

### What happens at the request

| Action | Status |
|---|---|
| Marketing consent cleared, identity-graph keys and audience memberships suppressed | `Built` |
| Excluded from every audience export (Smart Bidding, newsletter, video, reviewer) | `Built` |
| Google Ads Customer Match removal requested | `Built` |
| Store email marketing set to unsubscribed in Shopify | `Built` |
| Klaviyo profile suppression requested | `Partial`: needs a key with Subscriptions write, and is confirmed on the first real request |
| Predicted lifetime value score dropped | `Built` |
| Reviews withdrawn from public pages, structured data and Google | `Built` |
| Account identity anonymised and sessions revoked | `Built` |

### What happens at the purge

| Action | Status |
|---|---|
| Consent evidence, identifiers and pending writes held by the platform deleted | `Built` |
| Review text and name, support messages, bridged Salesforce records, ledger and consent-record minimisation in the tenant's Xano | `Built`, subject to the tenant's policy |
| Identity map and Klaviyo feature rows in the tenant's BigQuery | `Built`, subject to the tenant's policy |
| Shopify customer erasure requested | `Built` |
| Klaviyo profile deletion requested | `Built` |
| Google Analytics user deletion requested by client id | `Built`: needs the platform service account to hold Editor on the tenant's GA4 property |
| Completion certificate issued and emailed | `Built` |
| The merchant's own Salesforce org, Adobe | `Gap`: not contacted; the merchant files those requests |

In words: at the request, advertising, email marketing and public display stop and the account is closed; at the purge, the data is deleted and a signed completion certificate is issued.

### The hold

The hold defaults to **28 days** and can be set per tenant, never longer. It exists for the reasons vendors hold: a mistaken or fraudulent request can be caught before it is irreversible, and a legal claim can pause it. It stops at 28 so that the purge and its retries always finish inside the one-month response window of GDPR Article 12(3).

A purge is never dropped. A failed purge retries, first every 15 minutes and then hourly, and the request record says it is retrying and why. If the person registers again under the same email during the hold, the purge skips the systems keyed by that email, so it cannot erase the new account, and records the skip for a person to review.

An immediate purge, for a court order or a confirmed legal obligation, needs the platform administrator key.

---

## The tenant's erasure policy

| | `purge` (default) | `tombstone_only` |
|---|---|---|
| Tenant's own Xano | Deleted or anonymised after the hold | Kept, with the person permanently suppressed |
| Tenant's own BigQuery | Deleted after the hold | Kept, with the person permanently suppressed |
| Suppression at the request | Always | Always |
| Email and sign-in identifiers on the live account | Removed | Removed |
| Data the platform holds itself | Deleted after the hold | Deleted after the hold |
| Deletion requests to Shopify, Klaviyo and Google Analytics | Sent | Sent |

In words: the tenant decides only about its own Xano and BigQuery. Suppression, removal of sign-in identifiers, deletion of the platform's own copies and the requests to connected vendors happen under either policy.

**Why sign-in identifiers go even under `tombstone_only`.** A deleted account that keeps a live email address or provider id can capture the next person who signs in with it. That happened once in this estate, so the rule is structural rather than optional.

**The policy is fixed when the request arrives** and recorded on the request and the certificate. Changing the setting later does not rewrite an earlier controller decision.

**The tenant is the controller of what it keeps.** A tenant choosing `tombstone_only` must describe that in its own privacy notice.

**Objections and opt-outs are not erasures.** Objecting to advertising or opting out of sale under CCPA suppresses advertising and keeps the data. Restriction requests are handled by a person.

---

## What each vendor does with a deletion

| Vendor | Starts | Completes | Can be cancelled |
|---|---|---|---|
| Shopify | Sends the redact request 10 days after it is made, or six months after the last order if more recent | The app must act within 30 days of receiving it | Yes, before it completes |
| Google Analytics | Hides the user within 24 hours | Removes the data within 63 days | No |
| Google Ads Customer Match | Marks an uploaded file for deletion after matching, which takes up to 48 hours | List memberships expire after 540 days unless removed sooner | Not applicable |
| BigQuery | A delete removes rows from queries at once | Deleted rows stay recoverable for up to 7 days, then 7 more days in storage only Google support can restore from | Within the recovery window |
| Revoking platform access in the tenant's own Google Cloud | Access ends at once | The data stays in the tenant's project | The tenant can grant access again |
| Klaviyo | Suppression stops email marketing regardless of consent status | Deletion runs as an asynchronous job | Suppression can be lifted; deletion cannot |

In words: every vendor separates stopping use from deleting. Shopify can hold a request for up to six months before the app sees it, Google Analytics takes up to 63 days, and BigQuery keeps deleted rows recoverable for 14 days. The platform's 28-day hold sits inside that range, and its 30-day clock starts when a request reaches it.

---

## What it costs

| Choice | What it gives up | Severity |
|---|---|---|
| A 28-day hold | The data exists for up to 28 more days after the request, not in use | Low: use stops at the tombstone, and every vendor holds longer |
| Refusing BYO tenants without a project | A tenant that has not configured a warehouse loses pLTV, sentiment and warehouse erasure until it does or an exception is approved | Medium: visible on the operator page as a refused rung |
| `tombstone_only` | The tenant keeps personal data after an erasure request | High for the tenant: lawful only under an exemption the tenant must document |
| Suppression instead of immediate Klaviyo deletion | The profile exists in Klaviyo until the purge | Low: suppressed profiles receive no marketing email |
| Not contacting Salesforce orgs or Adobe | Copies in those systems remain until the merchant files its own request | Medium: named on every request record rather than hidden |

---

## What to do next

Ordered by exposure.

1. **Give the platform service account Editor on each tenant's GA4 property**, then run the deletion preflight, which sends one request for a synthetic visitor and confirms access. Owner: tenant's Google Analytics administrator.
2. **Connect Klaviyo with Profiles, Lists and Segments read, and Subscriptions and Data Privacy write.** Paste the key into the connect call from your own terminal, never into a chat or ticket. Owner: tenant's Klaviyo administrator.
3. **Configure every BYO tenant's BigQuery project**, or approve an exception with a reason. Owner: platform administrator.
4. **Decide each BYO tenant's erasure policy** and reflect it in the tenant's privacy notice. Owner: tenant's compliance reviewer.
5. **File Salesforce and Adobe deletion requests** where those systems hold copies. Owner: merchant.

---

## What this document does not claim

This describes the platform's behaviour as released on 16 September 2026, not a legal assessment. Vendor timelines are quoted from each vendor's documentation on the same date and change without notice. Klaviyo suppression is confirmed only when a real request records it as accepted. Whether keeping data under `tombstone_only` is lawful depends on an exemption the tenant must establish with counsel.

**Sources**

- [Shopify: privacy law compliance webhooks](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [Google Analytics: User explorer and user deletion](https://support.google.com/analytics/answer/9283607)
- [Google Analytics Admin API: submitUserDeletion](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties/submitUserDeletion)
- [Google Ads: how Google uses Customer Match data](https://support.google.com/google-ads/answer/7474263)
- [BigQuery: time travel and fail-safe](https://docs.cloud.google.com/bigquery/docs/time-travel)
- [Klaviyo: bulk suppress profiles](https://developers.klaviyo.com/en/reference/bulk_suppress_profiles)
- [GDPR Article 17: right to erasure](https://gdpr-info.eu/art-17-gdpr/)
