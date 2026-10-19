---
title: "Hyperscaler vs Distributed: Webflow, Xano and Cloudflare Decision Ladders"
description: "Where compute should live, from hyperscalers and GPU neoclouds to edge networks. Opens with task runners, data bindings, and GPUs as a rented place (CoreWeave, Oracle OCI) versus GPU code compiled from Rust to bytecode. Then the strategy: bind before you allocate, with the cost and security case for running distributed data and AI binding before any GPU is allocated. Then incremental knowledge against general-purpose AI: evidence weighting, ranking, and falling back to a larger token model only when the ranked data can't answer. Then context and data streams that scale by direction before intent is tokenized or vectorized. Then two decision ladders, for orchestration and for AI binding, across Webflow, Cloudflare and Xano, plus what each rung does to residency, latency, cost, audit scope and failure modes in enterprise infrastructure."
canonical: https://crm-sync.dev/docs/hyperscaler-vs-distributed
category: "Specs"
date: 2026-10-19
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/HYPERSCALER-VS-DISTRIBUTED.md
licence: CC-BY-4.0
ogImage: https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-og.png
ogImageAlt: "Hyperscaler vs Distributed: an illustrative funnel where one million requests shrink to 113,400 GPU calls, 89% fewer, when data and AI binding run before GPU allocation; a spectrum from hyperscaler to neocloud, edge network and device."
tags:
  - architecture
  - edge
  - xano
  - cloudflare
  - webflow
  - ai
  - infrastructure
keywords:
  - hyperscaler vs edge network
  - CoreWeave vs Cloudflare
  - AEM Edge Functions Fastly
  - Xano data sovereignty
  - system of record data gating
  - Workers AI binding
  - decision ladder
  - AI weighting
  - retrieval ranking
  - context assembly before tokenization
---
# Hyperscaler vs Distributed: Webflow, Xano and Cloudflare Decision Ladders

**For:** teams choosing where logic, data and models run when the front end is Webflow, the edge is Cloudflare and the system of record is Xano.
**Premise:** you don't pick a hyperscaler *or* an edge network. You pick, for each decision, the lowest rung that can make it correctly.
**Companions:** [The AI ladder](https://persephonepunch.github.io/crm-sync-setup/ai-ladder-escalation-and-mandates.html) for escalation and mandates; [Why Xano is the runtime as a service](https://persephonepunch.github.io/crm-sync-setup/why-xano-runtime-as-a-service.html); [Process Management Guide](https://persephonepunch.github.io/crm-sync-setup/process-management.html) for the Webflow, Xano, Cloudflare and Shopify data layer; [Render and Runtime dictionary](https://persephonepunch.github.io/crm-sync-setup/render-runtime-dictionary.html) for terms.
**Download:** diagrams as image or PDF: challenge, solution, benefit ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.pdf)) · bind before you allocate ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.pdf)) · incremental knowledge and AI weighting ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.pdf)) · directional streams ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.pdf)) · the thread ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.pdf)) · the two ladders ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.pdf)) · the system-of-record gate ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.pdf)) · media, 3D render and the GPU ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.pdf)).

## Challenge, solution, benefit

![Task runners, data bindings and two kinds of GPU, in four rows. Task runner: jobs with no owner, spread across crons, webhooks and queue consumers, become one runner per path (a Worker cron and queues at the edge, Xano tasks for the record, idempotency keys), so every job has an owner, a retry policy and a log. Data binding: code that can reach any store becomes bindings declared in config (env.KV, env.DB, env.AI and one Xano endpoint), so the config is the access list. GPU as a place: scarce GPUs are rented as clusters from CoreWeave or Oracle OCI, running NVIDIA-only code such as CUDA and PTX, giving training at scale while the data leaves your boundary. GPU on the device: small GPU work sent away to a cluster becomes portable SPIR-V bytecode run through wgpu on any GPU, written in Rust or another shader language, so small GPU work stays with the data. Rows 3 and 4 split GPU work by size; they don't compete.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.svg) (1600 × 744) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.pdf).*

Read each row left to right. Rows 1 and 2 decide **who may run and what it may touch**. Rows 3 and 4 decide **whether the data goes to the GPU, or the GPU code goes to the data**. They split GPU work by size rather than competing for the same job: training and large models need a rented cluster, while previews, real-time 3D and upscaling can run on the GPU the person already has. Neither row is the goal. The goal is the gate described below, and both kinds of GPU sit under it.

### Four definitions

| Term | What it is | In this stack | Where it sits on the spectrum |
|---|---|---|---|
| **Task runner** | The thing that starts a job, retries it and records the result, as opposed to the code the job runs. | Worker cron triggers and Queues for edge jobs; Xano background tasks for jobs that change the record. Each job carries an idempotency key, so a retry can't apply twice. | Either end. Run it where the data the job changes lives. |
| **Data binding** | A named handle to a resource, declared in configuration and handed to the code at runtime. The code can only reach what is bound; there is no URL or credential to copy. | Cloudflare bindings (`env.KV`, `env.DB`, `env.R2`, `env.AI`, a Durable Object namespace) in `wrangler.toml`; Xano endpoints reached through one bound service. | Edge. The binding list is the security boundary. |
| **GPU as a place** (CoreWeave, Oracle OCI) | GPUs you rent by the cluster. CoreWeave is a neocloud that sells little else; Oracle Cloud Infrastructure is a hyperscaler whose Superclusters link tens of thousands of NVIDIA GPUs over RDMA. Code for them is usually NVIDIA-only: CUDA, or PTX, which Rust can also target through Rust CUDA. | Rung 4 of the AI ladder: training, fine-tuning, self-hosted large models. | Centralized. The data travels to the GPU, so residency and egress are part of every job. |
| **GPU on the device** (portable GPU bytecode) | GPU programs compiled to SPIR-V, a portable bytecode that wgpu runs on any Vulkan, Metal or DirectX GPU. Rust (through rust-gpu) is one source language; GLSL, HLSL and WGSL also compile to it. | Kernels shipped with the application: in a native app, on your own server or, after translation to WGSL, in a browser through WebGPU. | The device, at the far distributed end, past the edge. The data stays where it already is. |

**What portable GPU bytecode does and doesn't buy.** SPIR-V is to a GPU roughly what WebAssembly is to a CPU: one compiled artifact, many targets. That makes *small* parallel work portable, such as image transforms, embeddings or physics, and lets it run on the user's own device, so the data never leaves. It doesn't make a phone into a training cluster, and three limits apply:

- **Maturity.** rust-gpu calls itself early-stage and not yet production-ready. Shader languages that already compile to SPIR-V are the safer route today.
- **Browsers take WGSL, not SPIR-V.** WebGPU in a browser accepts only WGSL, so SPIR-V has to be translated first (wgpu's naga translator does this).
- **The edge has no GPU for your code.** Cloudflare Workers run Rust as WebAssembly on CPUs. Workers AI runs Cloudflare's model catalogue on its GPUs, but you can't upload your own kernels to it. GPU bytecode belongs on the device, a server or a rented cluster, not inside a Worker.

## The strategy: bind before you allocate

Rent or buy GPUs last. Every request first passes through the cheaper distributed layers, and each layer either answers it or removes data from it. A GPU is sized only for what is left. That ordering is where both the cost saving and the security saving come from, and it can be shown with arithmetic before any GPU contract is signed.

![Bind before you allocate, an illustrative funnel of one million requests. The device handles 30%, leaving 700,000. The binding gate denies 10% and redacts personal fields from 12 to 3, leaving 630,000. The edge cache answers 40%, after the gate, leaving 378,000. Workers AI triage settles 70%, leaving 113,400. Only 113,400 reach GPU allocation, as redacted, signed payloads. Result: about 89% fewer GPU calls and about 97% fewer personal-field exposures. Net saving equals GPU cost avoided minus the cost of Workers, Workers AI and the cache.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.svg) (1600 × 788) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.pdf).*

**The rates in the diagram are illustrative, not measurements.** They show the method. Replace each one with the pass-through rate you measure at that stage.

### The cost case

GPU spend scales with the requests that reach it:

```
requests_at_gpu = requests × (1 − device) × (1 − denied) × (1 − cached) × (1 − triaged)
gpu_cost        = requests_at_gpu × gpu_seconds_per_request × price_per_gpu_second
net_saving      = gpu_cost(all requests) − gpu_cost(requests_at_gpu) − (Workers + Workers AI + cache cost)
```

| Stage | Removes | Still travelling | Cost of the stage |
|---|---|---|---|
| Incoming | | 1,000,000 | |
| 1 · Device | 30%: previews and real-time 3D on the person's GPU | 700,000 | None to you; the person's device does the work |
| 2 · Binding gate | 10%: unconsented, out-of-policy or unbound requests | 630,000 | One Worker invocation and a Durable Object read |
| 3 · Edge cache | 40%: repeat transforms and answers | 378,000 | Cache storage and reads |
| 4 · Workers AI triage | 70%: easy cases a small model can settle | 113,400 | Workers AI inference, priced per use |
| 5 · GPU allocation | | **113,400** | Sized for about 11% of the original demand |

Two things make the saving larger than the request count suggests. GPU capacity is bought for the peak, and the device and cache stages remove the most repetitive, burst-prone traffic first. And a smaller, steadier GPU workload can often run on a few GPU pods of your own (media ladder rung 3) instead of a rented cluster (rung 4).

### The security case

Count the personal fields that leave each boundary, not just the requests:

| | Requests reaching a GPU | Personal fields per request | Personal-field exposures |
|---|---|---|---|
| GPU first | 1,000,000 | 12 | 12,000,000 |
| Bind before you allocate | 113,400 | 3, after redaction at the gate | **340,200**, about 97% fewer |

The other savings don't show up in the count:

- **The device stage sends nothing.** Data that never leaves the person's device has no transit, retention or processor terms to negotiate.
- **The gate runs before the cache.** A cached answer is never served without the posture check, so caching can't become a way around consent.
- **Triage stays on the edge network.** Easy cases are settled by small models under one data-processing agreement, not shipped to a GPU provider.
- **What reaches the GPU is redacted and signed.** A provider breach, or a prompt injection, exposes three fields of 113,400 requests, not twelve fields of a million. Every payload is tied to the ledger state that allowed it.

### What to measure before sizing GPUs

1. The share of requests the device can serve: previews, real-time 3D, small on-device models.
2. The gate's deny rate and the number of fields it redacts, per market.
3. The cache hit rate, measured after the gate.
4. The share of cases Workers AI settles, and how often its answer is overturned later. A triage that misroutes hard cases costs quality, not just money.
5. GPU-seconds per remaining request, and the peak-to-average ratio of what reaches the GPU.

If the remaining demand is small and steady, own a few GPU pods. If it is large or bursty, rent. Either way, the decision is made on the 11%, not on the 100%.

## Incremental knowledge vs boil the ocean

There are two ways to make AI know your business. **Boiling the ocean** means putting everything you have into a general-purpose model, by training or fine-tuning it, and hoping the answers come out right. **Incremental knowledge** means leaving the model general and giving it, for each question, only the ranked evidence that question needs. The first changes *model weights* with GPUs. The second changes *evidence weights* with rows, and reaches a GPU only when it must. That makes it the knowledge side of "bind before you allocate".

![Incremental knowledge vs boil the ocean, and what AI weighting weighs. Six comparisons. Starting point: a model trained or tuned on everything, versus a general model that reads only what is retrieved. Adding knowledge: retraining with GPU hours, versus one new row in minutes. Fixing a wrong answer: retraining, versus correcting or demoting the source. Erasure: the fact stays in the weights, versus deleting the row. Citations: none, versus every answer citing its rows and weights. GPU need: up front, versus only for cases weighting can't settle. AI weighting: score equals authority times freshness times eligibility times relevance, with eligibility zero when consent or rights don't allow the use. Illustrative authority tiers: system of record 1.0, reviewed spec 0.8, knowledge base 0.6, inbox and tickets 0.4, open web 0.2. Rank first, fall back last: rank the data; if the top score clears the threshold, a small model answers from the ranked rows and the answer is cited; if not, a larger token model answers with more context, tokens and cost and a higher error risk, and the answer is flagged for the record or a person to confirm.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.svg) (1600 × 1100) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.pdf).*

| | Boil the ocean (general purpose) | Incremental knowledge |
|---|---|---|
| Adding a fact | Retrain or fine-tune: GPU hours and a new model version | Add one row to the index: minutes, no GPU |
| Fixing a wrong answer | Retrain, or prompt around it | Correct or demote the source; the next answer changes |
| Erasure requests | The fact stays in the weights until the next retrain | Delete the row; it is gone from the next answer |
| Audit | The model can't say where a fact came from | Every answer cites its rows and their weights |
| GPU spend | Up front, before the first answer | Only for the cases ranking can't settle |

This knowledge base works the incremental way. A new article is one line in the book's summary, and it is listed and searchable after the next index run. No model is retrained.

Fine-tuning still has a place: tone, output format, and narrow classification tasks a small model must do fast. It is the wrong tool for facts, because facts change, and a fact held in the weights can't be cited, corrected or erased on its own.

### AI weighting: evidence, not parameters

*Weighting* here means how strongly an answer favours a piece of evidence, not a model's parameters. It matches the definition in [AI enabled forms with LLM weighting](https://persephonepunch.github.io/crm-sync-setup/ai-enabled-forms.html): a weight is set by what the corpus can prove, not by the model alone.

```
score = authority × freshness × eligibility × relevance
```

| Factor | What it measures | How it is set |
|---|---|---|
| Authority | How much the source can be trusted | By tier (illustrative): system of record 1.0, reviewed spec 0.8, knowledge base 0.6, inbox and tickets 0.4, open web 0.2 |
| Freshness | How recently the source was true | Decays at a half-life set per tier: hours for a price, months for a policy |
| Eligibility | Whether this use is allowed at all | 1 or 0, from the gate: consent, rights, market. Never a fraction |
| Relevance | How well the source matches the question | Retrieval similarity, the only factor a model computes |

Because eligibility multiplies, a source that the gate doesn't allow scores zero however relevant it is. The model never sees it, so it can't leak it.

### Rank first, fall back to a larger token model last

1. **Rank the data.** Score every candidate row and keep the top few, with their weights.
2. **Check the threshold.** The top score must clear it, and the top rows must broadly agree with each other.
3. **If it clears:** a small model phrases what the rows say. It uses few tokens and has a low error risk, and every claim cites a row. To fix the answer, fix the row.
4. **If it doesn't:** fall back to a larger token model, with more context, more tokens and a higher cost per answer. It fills the gaps from its own weights, which is exactly where the error risk lives. Its answer is flagged as low confidence, and the record or a person confirms it before anyone acts on it.

The fallback is a deliberate trade, not a failure: you accept a bigger error risk in exchange for an answer, and you label it as such. Count how often it fires. A rising fallback rate means the evidence is missing, not that the model is too small, and the fix is a row, not a GPU.

## Context and data streams: scale by direction, tokenize last

Everything above happens before a model reads a single token. This section names that boundary. Context reaches a model from two streams that run in opposite directions and scale in opposite ways, and both should be finished (typed, gated and ranked) before the person's *intent* is turned into tokens or vectors.

![Context and data streams: scale by direction, tokenize intent last. Outbound: catalog and content from the system of record fan out through the edge cache into typed outbound context with tier, freshness and market. Inbound: events, forms and questions from people and agents fan in through the gate and a queue partitioned per subject and region, into typed inbound context holding one subject's consented state. Both meet in context assembly, which joins by key, ranks by weight, drops ineligible rows and caps the token budget. Only then is the intent, with the assembled context, tokenized or vectorized. Rules: direction sets the scaling; filter while typed; gate before embedding; tokens are the bill.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.svg) (1600 × 660) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.pdf).*

| | Outbound stream | Inbound stream |
|---|---|---|
| Carries | What you publish: products, prices, policies, articles | What people and agents send: events, forms, questions, consent |
| Shape | Fans out: one source, many readers | Fans in: many sources, one record per subject |
| Scales by | Cache: more readers cost almost nothing at the edge | Partition: per subject and per region (Durable Objects, queues, one Xano instance per jurisdiction) |
| Arrives as | Claims with tier, freshness and market attached | One subject's consented state, and nothing about anyone else |
| Fails | Stale: serve the last good copy, marked with its age | Closed: no posture means no context |

**Why direction matters.** Each stream scales in its own way. Scaling the outbound stream means adding cache, not compute. Scaling the inbound stream means adding partitions, not making one database bigger. A design that sends both streams through the same pipe, such as one vector store holding catalog and customer text together, has to scale both the expensive way and loses the boundary between them.

**Why tokenize last.** *Intent* is what the person wants, and it only becomes tokens (for a model to read) or vectors (for a similarity search) at the end. Before that line the context is typed: every field still has a name, a source tier, a market and a consent state, so it can be filtered, joined and capped. After the line it is text and numbers:

- **Fields can't be filtered after they become text.** A model can be told to ignore a field, but it can't be prevented from reading it. Only typed data can be removed.
- **A vector of personal data is still personal data.** Research has shown that text embeddings can be partly inverted back to the original text. Gate before embedding, and keep each subject's vectors in their home region, never in a shared index.
- **Tokens are the bill.** Every token past the line is paid for, on every call. Context assembly caps the budget, and the ranking from the previous section decides what fits.
- **Context assembly is cheap; the model is not.** Joining by key, ranking and dropping ineligible rows run in a Worker on typed data. Doing the same work inside a prompt costs tokens and can't be audited.

Read with the funnel above: the device, gate, cache and triage stages all sit before the tokenization line. "Bind before you allocate" and "tokenize last" are the same rule seen from the cost side and from the data side.

## The thread, in one picture

![Hyperscaler vs distributed: the thread. A spectrum runs from centralized to distributed: hyperscalers (AWS, Azure, Google Cloud), neoclouds (CoreWeave), edge networks (Cloudflare, Fastly, Akamai), and the person's own device. Four questions sit along it. CoreWeave or Cloudflare: different layers, use both. Hyperscaler or distributed: keep the core central and the edge in front. Where do AEM Edge Functions run: on Fastly Compute behind Adobe's managed CDN, in beta. Can Xano distribute Kubernetes: no, one instance per jurisdiction with an edge router and gate. The answers feed an orchestration ladder and an AI binding ladder, which lead to the enterprise impact.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.svg) (1600 × 750) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.pdf).*

This article began as four questions, each asked after the one before was answered. Read the diagram top to bottom: the spectrum, then the questions placed on it, then what the answers add up to.

1. **CoreWeave or Cloudflare?** Different layers. CoreWeave rents dense GPU clusters for training and serving large models. Cloudflare runs the network between users and applications: CDN, DDoS protection, DNS, a firewall, zero trust, and a developer platform (Workers, R2, D1, KV, Workers AI). A model trained or hosted on one can sit behind the other.
2. **Hyperscaler or distributed?** A hyperscaler brings the work to the data center; an edge network brings the data center to the user. Most production systems keep the core central and put the edge in front.
3. **Where do AEM Edge Functions run?** Adobe rents its edge. The functions are JavaScript modules deployed to Adobe's managed CDN, which runs on Fastly Compute, and they are reached through origin-selector rules in `cdn.yaml`. The feature is in beta.
4. **Can Xano distribute Kubernetes?** No. Xano hides its infrastructure from you, and each instance is a regional island. Distribution happens one level up: one Xano instance per jurisdiction, with an edge router and gate in front.

## One spectrum, three models

| | Hyperscaler | Neocloud (GPU cloud) | Edge network |
|---|---|---|---|
| Examples | AWS, Azure, Google Cloud | CoreWeave | Cloudflare, Fastly, Akamai |
| Footprint | Few, huge regions | Few, dense GPU sites | Hundreds of small sites |
| Optimized for | Throughput, rich state, every service in one place | Raw GPU compute | Latency, global reach, request handling |
| Typical work | Databases, data pipelines, enterprise back ends | Training, fine-tuning, large-model serving | CDN, security, edge functions, small-model inference |
| Data model | Centralized, strongly consistent | Centralized, job-scoped | Cached, replicated, eventually consistent |
| You pay in | Distance from the region; egress fees | Scarcity and commitment | Depth: little room for heavy state |

Past the edge sits the **device**: the person's own phone, laptop or console, and its GPU. It isn't a vendor's network, but it is the most distributed place compute can run, and the only one where data never travels.

The lines are blurring. Hyperscalers sell edge products such as CloudFront, Lambda@Edge and Azure Front Door, and edge networks keep adding storage, databases and GPU inference. The model you start from still decides what is cheap and what is hard.

**Rented edges.** Not every edge belongs to the vendor that sells it. AEM Edge Functions run on Fastly, and Webflow Cloud apps deploy to Cloudflare Workers through Wrangler. So "edge" in a vendor's diagram can mean someone else's network, with someone else's limits, logging and data-processing terms. Ask whose edge it is before you write consent or residency logic for it.

## The edge distributes; the system of record decides

![The edge distributes and the system of record decides. A request reaches a Cloudflare Worker that acts as router and gate. The Worker reads the subject's posture from a per-subject Durable Object, routes writes to the subject's home Xano instance (EU, US or KR, each with Postgres and a ledger), and sends only signed, gated payloads downstream. Xano pushes a projection to the Durable Object after each write. Four rules: Xano wins disagreements; fail closed; personal data stays in its home instance; the signature binds the posture and the ledger head hash.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.svg) (1600 × 760) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.pdf).*

*System of record data gating* means the system of record holds the truth, and nothing leaves until a gate has checked that truth at the moment of the action.

- **One Xano instance per sovereignty boundary.** Each regional instance owns its subjects' records and its own append-only ledger. Personal data never replicates between instances. Only an opaque routing key, saying which region a subject lives in, is shared.
- **The edge does the distributing.** A Worker resolves the subject to its home region and routes there. In practice "distributed Kubernetes" is several regional Xano instances behind one global router, not one cluster stretched across regions.
- **Durable Objects are projections, not truth.** Each subject's Durable Object caches the posture derived from the ledger, so the gate can decide without a round trip. Writes go to Xano first and the Durable Object is updated afterwards. If they disagree, Xano wins.
- **The gate enforces at egress.** Before anything goes to an ad platform, a CRM or an agent tool, the Worker checks the posture, strips or blocks what it doesn't allow, and signs the decision. The signature binds the posture to the ledger head hash, so an auditor can verify what was allowed and which ledger state allowed it.
- **Fail closed.** A projection that is stale beyond its threshold, or a regional instance that can't be reached, means deny. That is what makes it a gate rather than a log.

Xano suits the system-of-record role: deterministic, auditable logic in Postgres with its own API layer. It is a poor fit for the gate itself, because it lives in a few regions and would add latency to every request. Keep the hot path in Workers and Durable Objects, and keep Xano as the slower, authoritative write path.

## The decision ladders

![Two decision ladders. Orchestration, bottom to top: Webflow publish; Cloudflare Worker; Durable Object; Xano as the system of record; hyperscaler or BYOC cluster. AI binding, bottom to top: no model; Workers AI binding; AI Gateway to a hosted model; agent with tools on Xano; dedicated GPUs. Each rung names the condition that earns the next. Rules on every rung: Xano wins disagreements, fail closed when the projection is stale, personal data stays home, data leaves only through the signed gate.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.svg) (1600 × 770) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.pdf).*

Start every decision at rung 0 and climb only when the *climb when* condition is true. Each rung adds cost, latency or audit scope, so a decision made higher than it needs to be is paying for something it doesn't use.

### Orchestration: where the logic runs

| Rung | Runs on | Use it for | Climb when… | What it gives up |
|---|---|---|---|---|
| 0 | Webflow publish | Pages, CMS collections, static output from a CDN | A request needs a decision, not a page | Per-request logic |
| 1 | Cloudflare Worker | Routing, caching, auth and consent checks, the gate | The decision needs memory of one subject | Durable state |
| 2 | Durable Object | Per-subject posture, rate limits, coordination | The action must change the record | Authority: it is a projection |
| 3 | Xano, the system of record | Business rules, Postgres, the append-only ledger, one instance per region | One instance can't meet residency or load | Edge latency |
| 4 | Hyperscaler or BYOC cluster | Xano Enterprise in your own AWS, Azure or Google Cloud account; warehouses; batch | A contract or a regulator requires it | Simplicity: you now run accounts, networks and licences |

### AI binding: where the model runs, and what it may touch

| Rung | Runs on | Use it for | Climb when… | What it gives up |
|---|---|---|---|---|
| 0 | No model | Deterministic rules in a Worker or a Xano function | The input is language, images or a fuzzy match | Nothing; start here |
| 1 | Workers AI binding (`env.AI`) | Small models at the edge: classify, embed, moderate, translate | The task needs a frontier model | Model size |
| 2 | AI Gateway to a hosted model | Claude, Gemini or GPT behind one gateway with logs, caching and rate limits | The model must read or write records | Data stays outside the model, so it also has no context |
| 3 | Agent with tools on Xano | Tool calls to Xano endpoints, each write passing the gate under a mandate | Hosted models fail on cost, privacy or tuning | A smaller audit scope: the model now acts |
| 4 | Dedicated GPUs | Self-hosting, fine-tuning or training on neocloud or hyperscaler GPUs | The model weights are the product | Operational simplicity and a variable bill |

Rung 4 has a sideways exit. When the work is small and parallel rather than a large model, portable GPU bytecode can run on the user's device or your own server instead of a rented cluster. That keeps the data where it is, at the cost of the maturity limits above.

The ladders are independent. A Webflow page (orchestration rung 0) can call an edge classifier (AI rung 1), and a Xano agent (AI rung 3) still answers to the gate at orchestration rung 1. What they share is the four rules in the band under the diagram.

## Media, 3D render and the GPU

![Media, 3D render and the GPU: where each step runs and what protects it. Three workloads across five places, from closest to the person to closest to the GPU. Images: client preview on the device; Cloudflare Images transforms at the edge; a private original in R2 or S3, with Xano holding the record and key; batch processing in C with libvips or ImageMagick pods on Kubernetes; Adobe Firefly Services as a hosted API. 3D game render: real-time render on the player's GPU through WebGPU or native code; glTF and KTX2 asset delivery from the edge; an asset catalog in the system of record; build and bake jobs on Kubernetes with the GPU Operator; offline or streamed rendering on CoreWeave- or OCI-class GPUs. AI media: on-device models; Workers AI at the edge; consent and rights in the system of record; self-hosted models on GPU node pools; hosted generative APIs. Protection rules: base64 is not protection; Kubernetes Secrets are only base64 by default, so enable encryption at rest; lock down ImageMagick with policy.xml; strip EXIF and use signed, expiring URLs.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.svg) (1600 × 774) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.pdf).*

Media is where the spectrum costs the most, because the payloads are large and they often carry people: faces, voices, locations. Read the grid left to right. The further right a step runs, the further the file travels and the more systems hold a copy. The heavy boxes on the left are the only places where the media never leaves the person's device.

### Media ladder

| Rung | Runs on | Use it for | Climb when… | What it gives up |
|---|---|---|---|---|
| 0 | The device | Previews, real-time 3D on the player's GPU, small on-device models | The work needs the original, or more GPU than the device has | Nothing leaves, so nothing to protect in transit |
| 1 | The edge | Resize, format and crop on request; cached asset delivery; Workers AI captions and moderation | The job is a batch, or needs a library the edge can't run | No GPU for your own code; CPU time limits |
| 2 | Kubernetes, CPU pods | libvips or ImageMagick batches in C; texture compression; bakes | The work is parallel enough to need a GPU | You now run the cluster and its secrets |
| 3 | Kubernetes, GPU pods | Lightmaps, upscaling, self-hosted image models, through the NVIDIA GPU Operator | Steady demand beats a rented cluster, or the GPUs you need aren't available | Media stays in your account, but you buy the capacity |
| 4 | Hosted GPU or API | Render farms and pixel streaming on CoreWeave- or OCI-class GPUs; Adobe Firefly Services | Only when the scale or the feature can't be had lower down | The file leaves your boundary under someone else's retention terms |

### Four terms the grid relies on

- **ImageMagick.** An open-source image library and toolset, written in C, from ImageMagick Studio. It isn't an Adobe product. Adobe's hosted equivalents are the Photoshop and Lightroom APIs in Firefly Services. ImageMagick reads hundreds of formats, and that breadth is its risk: a crafted file can reach a coder you never meant to use, as ImageTragick did in 2016. Run it with a `policy.xml` that allows only the formats you accept and caps memory, time and pixel count, and run it in a pod with no network access to the rest of the system.
- **C-level render optimization.** Making the native layer do less work, rather than adding hardware. In practice: decode once and stream in tiles instead of loading whole images (libvips works this way, and for resize pipelines it is usually faster and lighter on memory than ImageMagick), keep pixels in one buffer instead of copying between libraries, encode straight to the delivery format (AVIF or WebP for images, KTX2 for textures), and never re-encode an already-compressed file. Only move work to a GPU when it is parallel enough to repay the transfer. Resizing a single image rarely is; a lightmap bake or an upscaling model usually is.
- **base64.** A way to write bytes as text. It makes a file about a third larger and protects nothing: anyone who can read the text can decode it. Don't put media in base64 inside JSON, KV or the CMS. Store the binary in a private bucket and pass a signed, expiring URL.
- **Kubernetes Secrets.** By default these are only base64-encoded in etcd, not encrypted. Protected data in a cluster needs encryption at rest turned on (or an external KMS provider), RBAC that limits who can read Secrets, and media credentials scoped to one bucket and one job. CoreWeave runs its GPUs as a Kubernetes service, and Oracle's OKE runs GPU node pools, so the same rule applies whether the cluster is yours or rented.

**3D game render.** Real-time rendering belongs on the player's GPU. WebGPU in the browser takes WGSL shaders, and native engines take SPIR-V, which is where the Rust-to-bytecode path from the opening section is most useful. The edge delivers assets (glTF meshes, KTX2 textures) and never renders. The cluster bakes and compresses. Rented GPUs earn their place only for offline render farms, or for pixel streaming, when the player's device can't render the scene at all. The asset catalog in the system of record decides who receives which asset version under which licence, through the same gate as any other data.

## Impact on enterprise infrastructure

| Concern | Hyperscaler-centred | Distributed, with a system-of-record gate | What changes for the enterprise |
|---|---|---|---|
| Data residency | Chosen by region; replication is a configuration you have to audit | One Xano instance per jurisdiction; only routing keys cross borders | Residency becomes a deployment fact, not a policy document |
| Latency | Good near the region, worse elsewhere | Decisions at the edge; writes travel to the home region | The hot path and the write path are budgeted separately |
| Consistency | Strong inside a region | The ledger is strong; edge projections are eventual and fail closed | Stale data is denied rather than served |
| Egress cost | Charged per GB leaving the cloud | R2 has no egress fees; gated payloads are small | Moving data out costs less and is easier to justify |
| Failure mode | Regional outage stops everything in the region | A region outage stops its subjects; the rest keep working | Outages are scoped per jurisdiction |
| Audit scope | Everything in the account is in scope | Gate, ledger and signing keys are the audited core | A SOC 2 boundary you can draw on one page |
| AI exposure | Models sit next to all the data | Models reach records only through tools behind the gate | Prompt injection can't exfiltrate what the gate won't release |
| Licensing | Usage-based, committed spend | Xano licence per instance (Enterprise); Workers usage | Each new jurisdiction carries a fixed cost |
| Skills | Kubernetes, IAM, networking teams | Workers, Xano and gate design; little cluster operation | Platform headcount moves from operating clusters to writing policy |
| Media and render | Originals, transforms and render farms sit in one account next to everything else | Previews and real-time 3D on the device; transforms at the edge; originals private; GPUs rented per job | Fewer copies of large files that contain people, and a GPU bill that follows the work |
| Vendor concentration | One provider holds compute, data and AI | Edge, system of record and model provider are separate | No single contract can switch the whole system off |

The trade is real. The distributed pattern only pays off if the gate is the single way out. A team that adds a direct database export "just for analytics" has rebuilt the hyperscaler's blast radius without its tooling.

## Decision checklist

- [ ] Every data flow names its system of record, and only that system can change the truth.
- [ ] Each jurisdiction you serve maps to exactly one Xano instance, or a documented reason it shares one.
- [ ] Personal data never replicates between instances; only an opaque routing key is shared.
- [ ] The gate runs at the edge and is the only egress path to ad platforms, CRMs and agent tools.
- [ ] Durable Objects hold projections with a staleness threshold, and stale means deny.
- [ ] Gate decisions are signed, and the signature binds the posture and the ledger head hash.
- [ ] Each AI use names its rung, and the reason it can't run one rung lower.
- [ ] Models reach records only through tools that pass the gate, never through a direct connection.
- [ ] For every "edge" in a vendor diagram, you know whose network it runs on and under which data-processing terms.
- [ ] Rung 4 (BYOC or dedicated GPUs) is reached only by a written contract, regulatory or cost requirement.
- [ ] Media originals live in a private bucket, and only signed, expiring URLs leave it; no media travels as base64.
- [ ] EXIF location and device fields are stripped before any image leaves the system of record.
- [ ] ImageMagick runs with a restrictive `policy.xml`, in a pod with no route to the rest of the system.
- [ ] Every cluster that holds protected data has Secrets encryption at rest (or an external KMS) turned on, and checked.
- [ ] Each GPU job names its rung, and why the device or a CPU pod couldn't do it.
- [ ] GPU capacity is sized on the measured demand left after the device, gate, cache and triage stages, not on raw request volume.
- [ ] The gate runs before the cache, so no cached answer skips the posture check.
- [ ] Facts live in ranked, cited rows, not in fine-tuned weights; fine-tuning is kept for tone, format and narrow classification.
- [ ] Eligibility is a 0-or-1 factor set by the gate, so a disallowed source can't be retrieved however relevant it is.
- [ ] Answers from the larger-model fallback are flagged as low confidence and confirmed before use, and the fallback rate is tracked.
- [ ] Outbound and inbound context run as separate streams: outbound scaled by cache, inbound by partition per subject and region.
- [ ] Context is typed, gated and ranked before tokenization; no personal field is filtered by prompt instruction alone.
- [ ] Embeddings of personal data are made only after the gate, and kept in the subject's home region, never in a shared index.
- [ ] Before committing to Enterprise, Xano has confirmed region placement for BYOC on your timeline and whether direct Postgres access is available for verifying the ledger.

## Sources

- Adobe, [AEM Edge Functions](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/edge-functions) and the [Edge Functions overview](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/edge-functions/overview): runs on Adobe's managed CDN, powered by Fastly Compute; beta.
- Adobe, [Set up AEM Edge Functions on AEM as a Cloud Service](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/edge-functions/edge-functions-setup/setup-aemcs): `cdn.yaml` origin selectors.
- Xano, [Xano for Enterprise](https://docs.xano.com/enterprise/xano-for-enterprise) and [Enterprise deployment](https://docs.xano.com/enterprise/enterprise-features/deployment): BYOC on AWS, Azure or Google Cloud; data sovereignty; multiple instances, each separately licensed.
- Xano, [Enterprise-grade multi-tenant control](https://community.xano.com/release-announcements/post/new-enterprise-grade-multi-tenant-control-2DNxiHH69FITNmt): Kubernetes-level tenant isolation and regional clusters in the Tenant Center add-on.
- Webflow, [About the Webflow Cloud edge environment](https://developers.webflow.com/webflow-cloud/environment) and [configuration](https://developers.webflow.com/webflow-cloud/environment/configuration): Webflow Cloud apps run on the Cloudflare Workers runtime and deploy with Wrangler.
- Oracle, [World's largest AI supercomputer in the cloud](https://blogs.oracle.com/cloud-infrastructure/post/worlds-largest-ai-supercomputer-in-the-cloud): OCI Superclusters with NVIDIA GPUs over RDMA networking.
- Rust GPU, [rust-gpu](https://github.com/Rust-GPU/rust-gpu): Rust to SPIR-V, maintained by the community since 2024, early-stage.
- [rustc_codegen_nvvm](https://lib.rs/crates/rustc_codegen_nvvm) (Rust CUDA): Rust to PTX, early development; NVIDIA, [The Rust + GPU ecosystem](https://nvidia.github.io/cuda-rust/appendix/ecosystem.html), which also covers cuda-oxide.
- Kubernetes, [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) (stored unencrypted in etcd by default) and [Encrypting confidential data at rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/).
- ImageMagick, [Security policy](https://imagemagick.org/script/security-policy.php): `policy.xml` coder, resource and path limits.
- [libvips](https://www.libvips.org/): a demand-driven, streaming image library in C.
- Cloudflare, [Images](https://developers.cloudflare.com/images/): transformations at the edge.
- Adobe, [Firefly Services](https://developer.adobe.com/firefly-services/): Photoshop, Lightroom and Firefly APIs.
- NVIDIA, [GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/index.html): GPU drivers and scheduling on Kubernetes.
- Morris et al., [Text Embeddings Reveal (Almost) As Much As Text](https://arxiv.org/abs/2310.06816), EMNLP 2023: embeddings can be inverted to recover much of the input text.
- CNCF, [From data residency to digital sovereignty](https://cncf.io/blog/2026/06/16/from-data-residency-to-digital-sovereignty-architectural-patterns-for-cloud-native-platforms): a shared Kubernetes control plane still centralizes administrative authority.
