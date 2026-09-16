---
title: "BYO Xano and BigQuery against Google's agent platform: what AI automation costs per call"
description: "Google's agent platform is the faster way to build an AI automation, and its managed layers bill every request. What Conversational Agents, Agent Search, grounding and Agent Runtime charge per call, what the same jobs cost on a bring-your-own Xano and BigQuery stack with Cloudflare Workers AI, where Google is cheaper, and the price changes dated between now and January 2027."
canonical: https://persephonepunch.github.io/crm-sync-setup/byo-xano-bigquery-vs-google-agent-costs.html
category: "Specs"
date: 2026-09-16
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/BYO-XANO-BIGQUERY-VS-GOOGLE-AGENT-COSTS.md
licence: CC-BY-4.0
tags:
  - xano
  - architecture
  - agentic-commerce
  - rag
keywords:
  - bring your own Xano
  - bring your own BigQuery
  - Vertex AI pricing
  - Gemini Enterprise Agent Platform pricing
  - Conversational Agents pricing
  - Dialogflow CX Playbooks price per request
  - Agent Search pricing
  - Grounding with Google Search price
  - Agent Runtime pricing
  - BigQuery ML remote model pricing
  - Cloudflare Workers AI pricing
  - cost per AI call
---
# BYO Xano and BigQuery against Google's agent platform

> Google's agent platform is the fastest way to ship an AI automation. It is also a stack of managed layers, and each layer bills every call. The model tokens are not what makes it expensive. The layers around them are.

**Audience** Business analyst, platform engineer, buyer evaluating a bring-your-own deployment
**Status** Current · Version 1.0
**Owner** Platform engineer (role)
**Evidence basis** Vendor list prices read 16 September 2026; AI models in use read from the worker source the same day
**Review cycle** Quarterly, and before 1 January 2027, when Gemini Flash introductory pricing ends
**Related** [Logging and trace fees](https://persephonepunch.github.io/crm-sync-setup/logging-and-trace-fees.html) · [Interactive comparison: Metered or Flat](https://claude.ai/artifact/5LafXpaGpt4tzryYrGxDbk)

---

## The question this answers

A bring-your-own deployment means the buyer owns the Xano workspace and the BigQuery project, and the platform holds only access the buyer grants and can revoke. The alternative is to build the same automation on Google's agent platform, where Google hosts the agent, the search index and the model.

**For the same AI job, what does each call cost on each path, and where does the difference come from?**

---

## Vocabulary

Google renamed these products in 2026. The old names are still what most people search for.

| Term used here | Google's current name | Formerly | Bills per |
|---|---|---|---|
| Conversational Agents | Conversational Agents | Dialogflow CX | chat request, or voice second |
| Playbooks | Playbooks | generative agents | chat request, at a higher rate than flows |
| Agent Search | Agent Search | Vertex AI Search | 1,000 queries |
| Agent Runtime | Agent Runtime | Vertex AI Agent Engine | vCPU-hour and GiB-hour while active |
| Agent platform | Gemini Enterprise Agent Platform | Vertex AI | tokens, requests or hours, per layer |
| Grounding | Grounding with Google Search, Maps or your data | — | 1,000 grounded queries |
| BYO | Bring your own: the buyer's Xano and BigQuery, the platform's Cloudflare Worker | — | flat plan, plus per-token model use |

---

## The rate card

### Google's managed layers

These are charged per call, on top of any model tokens.

| Layer | Price | Free allowance |
|---|---|---|
| Conversational Agents, flows, chat | **$0.007 per request** | $600 trial credit, 12 months |
| Conversational Agents, Playbooks, chat | **$0.012 per request** | $1,000 trial credit, 12 months |
| Conversational Agents, voice | $0.001 per second (flows), $0.002 per second (Playbooks) | trial credit |
| Agent Search, Standard | **$1.50 per 1,000 queries** | 10,000 queries a month |
| Agent Search, Enterprise (with generative answers) | **$4.00 per 1,000 queries** | 10,000 queries a month |
| Agent Search, advanced generative answers | **+$4.00 per 1,000 queries** | none |
| Data store and index storage | $5.00 per GiB-month | 10 GiB |
| Grounding with Google Search, Gemini 3 models | **$14 per 1,000 grounded queries** | 5,000 a month |
| Grounding with Google Search, Gemini 2.5 Pro | $35 per 1,000 grounded prompts | 10,000 a day |
| Grounding with your own data | $2.50 per 1,000 requests | none |
| Agent Runtime, compute | $0.085 per vCPU-hour | 50 hours a month |
| Agent Runtime, memory | $0.009 per GiB-hour | 100 GiB-hours a month |
| Agent Runtime Sessions and Memory Bank | 1 vCPU-hour per 1M writes or 3M reads, plus $0.30 per GiB-month stored | **billed from 1 September 2026** |

A Conversational Agents turn that touches a Playbook, a data store or a generative fallback is billed at the Playbooks rate. Idle time between turns is not billed on Agent Runtime.

### Model tokens, per 1 million

| Model | Input | Output | Batch |
|---|---|---|---|
| Gemini 2.5 Flash, on Google | $0.30 | $2.50 | half price |
| Gemini 2.5 Flash-Lite, on Google | $0.10 | $0.40 | half price |
| Gemini 3.8 Flash, US region, until 31 December 2026 | $0.825 | $4.125 | half price |
| Gemini 3.8 Flash, US region, **from 1 January 2027** | $1.65 | $8.25 | half price |
| Mistral Small 3.1 24B, on Cloudflare Workers AI | $0.351 | $0.555 | — |
| Llama 3.3 70B, on Cloudflare Workers AI | $0.293 | $2.253 | — |
| BGE-M3 embeddings, on Cloudflare Workers AI | $0.012 | — | — |

Workers AI includes 10,000 neurons a day, about $3.30 a month, and bills $0.011 per 1,000 neurons after that.

**Token prices are close.** Gemini 2.5 Flash and Llama 3.3 70B cost about the same per token. Mistral Small is cheaper on output. None of the gaps below come from the model.

### The bring-your-own stack

| Line | Price | What it does |
|---|---|---|
| Xano Essential | $85 a month on annual billing, no API rate limit | system of record for identity, consent and entitlements |
| Cloudflare Workers Paid | $5 a month, 10M requests included | the permissions boundary every call passes |
| Cloudflare Vectorize | 50M queried dimensions included, then $0.01 per million | knowledge base search |
| BigQuery, the buyer's own project | $6.25 per TiB queried, first 1 TiB free | analytics and scoring |
| BigQuery ML, logistic regression training | $312.50 per TiB processed | pLTV model creation |
| BigQuery ML, prediction | $6.25 per TiB, inside the 1 TiB free tier | pLTV scoring |

Xano's pricing page lists no AI, agent or MCP usage fee.

---

## Worked example 1: a customer chat turn

Illustrative, not measured. One turn reads about 2,000 tokens of instructions and retrieved knowledge base text and writes about 300 tokens. The Google-assembled path runs 3 active seconds on Agent Runtime with 1 GiB of memory.

| Chat turns / month | Conversational Agents Playbooks | Gemini 2.5 Flash + Agent Search Enterprise + Agent Runtime | BYO: Workers AI + Vectorize | BYO including Xano |
|---|---|---|---|---|
| 10,000 | $120 | $13.50 | $5.39 | $90 |
| 100,000 | $1,200 | $498 | $84 | $169 |
| 1,000,000 | **$12,000** | **$5,383** | **$875** | **$960** |

In words: one Playbooks chat turn costs $0.012, and the same turn on Cloudflare Workers AI with Mistral Small costs about $0.0009, roughly fourteen times less. At a million turns a month, Playbooks cost about $12,000, the Google-assembled path about $5,383 and the bring-your-own path about $960 including Xano's plan. On the Google-assembled path, Agent Search at $4 per 1,000 queries is $3,960 of the $5,383. The Gemini tokens are $1,350.

**Grounding changes the order of magnitude.** A turn grounded in Google Search on a Gemini 3 model adds $0.014 after the first 5,000 a month. At a million grounded turns, grounding alone is about $13,930, more than the Playbooks bill. The bring-your-own path grounds in the buyer's own knowledge base through Vectorize, at $9.74 for the same million queries.

**At low volume, Google is cheaper.** At 10,000 turns, the Google-assembled path is $13.50 against $90 for bring-your-own, because Xano's $85 plan is a floor. The Google path still needs a system of record for identity and consent; this table does not price one.

---

## Worked example 2: enriching records in batch

Illustrative. Each record reads 1,500 tokens and writes 200: a product description summarised, a review classified, a form answer extracted.

| Records / month | BigQuery calling Gemini 2.5 Flash (batch rate) | Workers AI, Mistral Small |
|---|---|---|
| 10,000 | $4.75 | $3.08 |
| 100,000 | $47.50 | $60.45 |
| 1,000,000 | **$475** | **$634** |

In words: for batch enrichment inside BigQuery, Google is cheaper. BigQuery's remote models bill Gemini at the batch rate, half the standard price, so a million records cost about $475 against about $634 on Workers AI. Google also bills the BigQuery bytes processed on top, which this table leaves out because it is small for text columns.

**This is the counterweight to the argument above.** When the job is a large batch over data that already lives in the buyer's BigQuery, calling Gemini from BigQuery is the cheaper route. It is still bring-your-own: the buyer's project pays, and the buyer can revoke access.

---

## Where each path runs today in this estate

| Job | Runs on | Status |
|---|---|---|
| Knowledge base embeddings | Workers AI, BGE-M3 and BGE base | `Built` |
| English to French translation | Workers AI, M2M100 | `Built` |
| Structured extraction | Workers AI, Mistral Small, with Llama 3.3 70B as fallback | `Built` |
| Simplified to Traditional Chinese rewrite | Workers AI, Qwen3 30B | `Built` |
| pLTV scoring | BigQuery ML in the buyer's project | `Built` |
| Gemini called from BigQuery | Setup instructions only; no model created | `Gap` |
| Conversational Agents, Agent Search, Agent Runtime | Not used | — |

No production request pays a per-call Google managed-layer fee today.

---

## Dated price changes

| Date | Change | Effect |
|---|---|---|
| 5 January 2026 | Grounding with Google Search on Gemini 3 billed per grounded query | $14 per 1,000 after 5,000 a month |
| 1 July 2026 | US-region endpoints priced separately from global for Gemini 3 and later | about 10% above global |
| 1 September 2026 | Agent Runtime Sessions and Memory Bank billing starts | storage, read and write charges |
| 1 October 2026 | Cloudflare Workers Traces billed | see [Logging and trace fees](https://persephonepunch.github.io/crm-sync-setup/logging-and-trace-fees.html) |
| 30 October 2026 | TabFM on BigQuery moves to token pricing | $0.05 input and $0.20 output per 1M tokens |
| **1 January 2027** | **Gemini 3.8, 3.7 and 3.6 Flash introductory pricing ends** | **token prices double** |

---

## What bring-your-own costs

| Choice | What it gives up | Severity |
|---|---|---|
| No Conversational Agents | Google's visual flow designer, voice channel and built-in agent analytics. Build time is longer | High for a team without engineers; low for this estate |
| No Agent Search | Managed ranking and document connectors. Vectorize retrieval is only as good as the chunking | Medium: tables must be restated as prose to retrieve well |
| Workers AI models | Open-weight models trail Gemini Pro on hard reasoning | Medium: route hard cases to a stronger model per call |
| Xano's $85 floor | Below about 27,000 chat turns a month, the Google-assembled path is cheaper | Low: the plan also holds identity and consent |
| Operating it | A permissions boundary, retries and monitoring are yours to run | Medium: this is the work the harness tests exist for |

---

## What to do next

Ordered by deadline.

1. **Before 1 January 2027: price any Gemini 3.x Flash usage at the 2027 rate**, $1.65 input and $8.25 output per 1M tokens in the US, not the introductory rate. Owner: business analyst.
2. **Keep grounding off Google Search for customer-facing chat.** Ground in the buyer's own knowledge base, which costs cents per million queries instead of $14 per 1,000. Owner: platform engineer.
3. **Route batch enrichment over BigQuery data through BigQuery's Gemini batch rate**, and keep interactive turns on Workers AI. Owner: platform engineer.
4. **Put a budget alert on the buyer's Google Cloud project before enabling any agent platform API.** Owner: Google Cloud project owner.
5. **After 30 days of real traffic, replace this page's illustrative token counts** with measured input and output tokens per turn. Owner: business analyst.

---

## What this document does not claim

This compares list prices, not invoices. Token counts per turn and per record are assumptions and are marked as such. Rates were read from each vendor's pricing page on 16 September 2026; Google's pages show no last-updated date, and Cloudflare's show 28 August 2026 for Workers AI and 21 April 2026 for Vectorize. Committed-use discounts, promotional credits and negotiated rates are excluded. Model quality is not compared.

**Sources**

- [Gemini Enterprise Agent Platform: generative AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- [Gemini Enterprise Agent Platform pricing: Agent Runtime](https://cloud.google.com/vertex-ai/pricing)
- [Conversational Agents pricing](https://cloud.google.com/dialogflow/pricing)
- [Agent Search pricing](https://cloud.google.com/generative-ai-app-builder/pricing)
- [BigQuery pricing, including BigQuery ML](https://cloud.google.com/bigquery/pricing)
- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare Vectorize pricing](https://developers.cloudflare.com/vectorize/platform/pricing/)
- [Xano pricing](https://www.xano.com/pricing/)
