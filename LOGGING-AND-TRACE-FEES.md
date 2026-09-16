---
title: "Logging and trace fees: what monitoring costs by volume"
description: "Log entries and trace spans are the two monitoring lines that grow with traffic rather than with tenants. What Google Cloud Logging, Cloud Trace and Cloud Monitoring charge, what Cloudflare Workers Logs and Traces charge from 1 October 2026, what a fixed-fee Xano plan leaves out, and the four settings that decide the bill before the first invoice does."
canonical: https://persephonepunch.github.io/crm-sync-setup/logging-and-trace-fees.html
category: "Setup"
date: 2026-09-16
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/LOGGING-AND-TRACE-FEES.md
licence: CC-BY-4.0
tags:
  - architecture
  - xano
  - security
  - gdpr
keywords:
  - Cloud Logging pricing
  - Cloud Trace pricing
  - Cloud Monitoring pricing
  - Workers Logs pricing
  - Workers Traces billing
  - observability events
  - log exclusion filter
  - head sampling rate
  - log retention
  - agent monitoring dashboard
  - fixed fee versus metered
---
# Logging and trace fees

> Every other line in this estate is priced by account or by tenant. Logs and traces are priced by traffic. They are the lines that move when the product gets used, and they are set by four switches most teams never open.

**Audience** Business analyst, platform engineer, compliance reviewer
**Status** Current · Version 1.0
**Owner** Platform engineer (role)
**Evidence basis** Vendor list prices read 16 September 2026
**Review cycle** Quarterly, and whenever a vendor announces a billing change

---

## The question this answers

Google's agent monitoring dashboard asks to enable four services before it shows anything: `cloudtrace.googleapis.com`, `monitoring.googleapis.com`, `logging.googleapis.com` and `bigquery.googleapis.com`. Each is free up to an allotment and billed by volume after it. Cloudflare begins billing Worker traces on 1 October 2026. Xano bills a fixed fee.

**What will monitoring cost at our traffic, and which settings decide it?**

---

## Vocabulary

| Term | Means | Is not |
|---|---|---|
| Log entry | One structured record of something that happened: a request, an error, a decision | A trace. A log says *what*; it does not link steps across services |
| Span | One timed step inside a request, such as a database call or an outbound fetch | A request. One request usually produces several spans |
| Trace | The spans of one request, linked end to end | A log. Traces are billed per span, not per request |
| Ingestion | Writing an entry or span into the vendor's store. This is the billed moment | Querying. Neither Google Log Analytics nor Workers Logs bills per query |
| Retention | How long stored entries are kept | Free by default. Google bills past 30 days; Cloudflare keeps 7 days on the paid plan and no longer |
| Sampling | Keeping a fixed share of requests, such as 1 in 10 | Filtering. Sampling is random; a rare failure can be sampled away |
| Exclusion | A rule that drops matching entries before ingestion, so they are never billed | Deletion. An excluded entry was never stored and cannot be recovered |
| Observability event | Cloudflare's billing unit: one log line **or** one span | A request. From 1 October 2026, a request with five spans and one log is six events |

---

## The rate card

### Google Cloud

| Service | Price | Free each month | Scope of the free allotment |
|---|---|---|---|
| Cloud Logging, ingestion | **$0.50 per GiB**, includes 30 days of storage | 50 GiB | per **project** |
| Cloud Logging, retention | **$0.01 per GiB-month** past 30 days | none | per project |
| Cloud Logging, `_Required` bucket | **$0**, fixed 400-day retention | all | audit logs only; cannot be disabled |
| Cloud Trace | **$0.20 per million spans** | 2.5 million spans | per **billing account** |
| Cloud Monitoring | **$0.2580 per MiB**, $0.1510 above 100 GiB, $0.0610 above 250 GiB | 150 MiB | per billing account |
| Cloud Monitoring, standard Google Cloud metrics | **$0** | all | built-in platform metrics |
| Log routing, Log Analytics queries | **$0** | — | — |

Spans generated automatically by App Engine Standard, Cloud Run and Cloud Run functions are not charged. Spans an application sends itself are.

### Cloudflare Workers

| Line | Price on Workers Paid | Retention | Status on 16 September 2026 |
|---|---|---|---|
| Workers Logs | 20 million events included, then **$0.60 per million** | 7 days | Billed |
| Workers Traces | Each span is **one event**, from the same 20 million and at the same price | 7 days | **Free in beta; billed from 1 October 2026** |
| Workers analytics | Included | — | Included |

The 20 million events are shared by logs and traces. Turning tracing on uses up the allowance that logging had to itself.

### Xano

| Line | Price | What it leaves out |
|---|---|---|
| Request history | Part of the plan fee (Essential $85 a month on annual billing). No volume line on the pricing page | Distributed tracing across services. Xano sees its own requests, not the Worker or Shopify steps around them |

---

## Worked example: one month, three volumes

Illustrative, not measured. Assumes one log entry of about 1 KiB and five spans per request, no sampling and no exclusions.

| Requests / month | Google Logging | Google Trace | **Google total** | Workers Logs only | Workers Logs + Traces (after 1 Oct) | Xano |
|---|---|---|---|---|---|---|
| 300,000 | $0 | $0 | **$0** | $0 | $0 | in plan |
| 3,000,000 | $0 | $2.50 | **$2.50** | $0 | $0 | in plan |
| 30,000,000 | $0 | $29.50 | **$29.50** | $6.00 | **$96.00** | in plan |

**Read the last row carefully.** At 30 million requests, Cloudflare tracing costs about three times Google tracing. Cloudflare prices a span at $0.60 per million against Google's $0.20, and a span shares the allowance a log line would otherwise use. "No egress" does not mean "cheaper for everything".

Log size moves the Google side instead. At 10 KiB per entry, which is realistic for an AI agent conversation that logs prompts and tool calls, 30 million requests is about 286 GiB. That is **$118 a month** for Cloud Logging, and nothing extra on Cloudflare, which bills per event regardless of size up to 256 KB.

---

## The four settings that decide the bill

1. **Sampling rate.** On Cloudflare, `observability.head_sampling_rate` takes a value from 0 to 1. At 0.1, 30 million requests become 3 million events, inside the included allowance. On Google, the trace sampler in the client library does the same for spans.
2. **Exclusion filters.** On Google, an exclusion on the `_Default` sink drops health checks, static asset requests and debug output before they are billed. Exclusions are the only lever that lowers ingestion without lowering sampling.
3. **Retention.** Keep `_Default` at 30 days unless a named obligation requires longer. Past 30 days, Google bills $0.01 per GiB-month, and every extra month of stored logs is another month of stored personal data.
4. **Whether tracing is on at all.** A trace is worth its fee while a request crosses several services and something is being diagnosed. Left on permanently at 100%, it is the line that grows fastest after 1 October 2026.

---

## What it costs to keep the bill low

| Choice | What it gives up | Severity |
|---|---|---|
| Sample at 10% | A failure that happens once in 10,000 requests is recorded about once in 100,000 | Medium: pair with an unsampled error log |
| Exclude noisy logs | Excluded entries cannot be recovered after an incident | Medium: exclude by path, never by severity |
| Keep 7 or 30 days | An incident found after the window has no logs to investigate | Medium: route the audit trail somewhere with a longer, deliberate retention |
| Leave tracing off | Slow requests show up as slow, with no evidence of which step was slow | Low while traffic is low; rises with every service added |
| Rely on Xano request history | No view of the Worker, Shopify or Google steps around a Xano call | Low for Xano bugs; high for bugs that span services |

---

## Logs are personal data

A log entry that records a customer id, an email address, an IP address or a prompt holds personal data. Retention is then a GDPR question as well as a billing one: storage limitation requires keeping it no longer than its purpose needs, and an erasure request covers it. Two consequences:

- **Do not log what you would not store.** Consent decisions, tokens and identifiers belong in the record they govern, not in free-text log lines that no erasure path reaches.
- **Google's `_Required` bucket keeps audit logs for 400 days and cannot be shortened.** That is appropriate for admin audit events and a reason never to write customer data into them.

---

## What to do next

Ordered by deadline.

1. **Before 1 October 2026: decide Worker tracing.** Leave it unconfigured, or set `head_sampling_rate` below 1 before enabling traces. Owner: platform engineer.
2. **Set a sampling rate on any Worker that logs every request.** `observability.enabled: true` with no rate means 100%. Owner: platform engineer.
3. **Before pressing "Enable all" on Google's agent monitoring:** add a `_Default` exclusion for health checks and static assets, and a budget alert on the project. Owner: Google Cloud project owner.
4. **Compare each Worker's dashboard logging setting with its configuration file.** A setting changed in the dashboard is not in configuration, and the first invoice shows it before any review does. Owner: platform engineer.
5. **After 30 days, replace this page's illustrative volumes** with the billed quantities from both invoices. Owner: business analyst.

---

## What this document does not claim

This is a price comparison at list rates, not a bill. The volumes are assumptions and are marked as such. Rates were read from each vendor's pricing page on 16 September 2026 and change without notice. The Cloudflare trace billing date is Cloudflare's own announcement. Xano's pricing page lists no logging or tracing line, so none is assumed. This is not legal advice on retention periods.

**Sources**

- [Google Cloud Observability pricing](https://cloud.google.com/stackdriver/pricing)
- [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Cloudflare Workers Traces](https://developers.cloudflare.com/workers/observability/traces/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Xano pricing](https://www.xano.com/pricing/)
