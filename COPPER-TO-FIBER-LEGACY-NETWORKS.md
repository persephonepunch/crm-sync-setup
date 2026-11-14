---
title: "Copper to Fiber: 2000s-Era Network Debt and Short-Term Paired Fixes"
description: "Why aging copper telecom lines still carry US air traffic radar data, what failed at Newark in 2025, why fiber alone doesn't fix it, and the paired, short-term fixes (diverse paths, legacy circuits over IP, radar plus ADS-B, multi-feed data chains) that cover the gap until the long rebuild lands. With the Game of Thrones, Windows and radar \"too much data\" pattern, why Rust, threads and chunking belong in the legacy tech-debt budget, and what a downstream commerce or logistics data chain should do."
canonical: https://crm-sync.dev/docs/copper-to-fiber-legacy-networks
category: "Specs"
date: 2026-11-14
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/COPPER-TO-FIBER-LEGACY-NETWORKS.md
licence: CC-BY-4.0
tags:
  - infrastructure
  - tech-debt
  - air
  - ads-b
  - resilience
  - data-chains
  - rust
  - chunking
  - preload
  - xano
  - incremental-loads
  - horizontal-scaling
  - machine-planning
  - iot
  - lidar
  - orchestration
  - ott
  - ai
  - gaming
---

# Copper to Fiber: 2000s-Era Network Debt and Short-Term Paired Fixes

Nov 14, 2026 · Yoonsun Lee

![The helm: one manifest per flow steers four duties. Sources on the left (Shopify webhooks; ERP and WMS with EDI and batch files; machines such as radar, VMS, IoT, LiDAR and trackers; shoppers and agents; design surfaces, outbound only unless allowed) flow into the helm, a control layer with one manifest per flow, versioned in git, validated, canaried and rolled back by pointer. It sets four duties. Data direction: inbound, outbound or both per flow, undeclared directions refused, nothing sent out read back. Orchestration: request, event and scheduled paths; load, validate, canary, switch; idempotent jobs; reads serve the last good copy. Security: one key per flow and device, signed messages with size and type limits, consent checked before personal data moves, agents propose and people approve. Scaling: a partition key per flow, bounded queues with backpressure, a memory budget per task, more instances rather than a bigger machine. Outputs on the right: Xano as the system of record, the edge cache with preloaded reads and A/B slots, channels (Merchant API, Meta, Amazon, Shopify), operations screens and the R2 archive. The helm steers three paths: the request path with Node preload at the edge, the event path with a queue feeding Rust and Tokio tasks, and the scheduled path with Xano background tasks.](https://persephonepunch.github.io/crm-sync-setup/assets/helm-orchestration.svg)

**Related knowledge base:**
[Global Unit Data Loads — Data Type Management](GLOBAL-UNIT-DATA-LOADS.md) ·
[ISO data in UTF-8: space, sea, air and LiDAR](GLOBAL-UNIT-DATA-LOADS.md) ·
[Hyperscaler vs Distributed](HYPERSCALER-VS-DISTRIBUTED.md)

## The challenge: tech debt that worked before data got big

Most of the systems in this article weren't badly built. The copper circuits between FAA facilities, the HBO GO sign-in path, the way Windows machines took security updates and the nightly ERP batch were all sound designs for the data they were built to carry. Each one rests on an assumption about how much data arrives, how fast, and how much of it at the same moment. Those assumptions were true when the systems went in. They stopped being true as data got big, and nothing in the system announced it.

That's the kind of tech debt this article is about: a sizing assumption that expired while the system kept working.

| System | Built for | Assumption that held then | What grew | How the debt showed |
|---|---|---|---|---|
| FAA telecom links | radar and voice between facilities, early 2000s | a fixed, modest data rate per circuit; a backup was a second circuit | more radar sources, ADS-B once a second from every aircraft, digital voice, longer routes after facilities were consolidated | 90-second radar and radio blackouts at Newark in 2025; the backup failed with the primary |
| HBO GO sign-in (2010s) | subscribers watching through their cable account | viewers arrive spread over the evening | millions arriving in the same minute for one premiere | the Game of Thrones season 4 premiere outage, 2014 |
| Windows security updates | a fleet patched on a schedule | an update is small, tested, and a bad one hurts a few machines | one vendor's content file pushed to millions of machines within an hour | the CrowdStrike outage, 2024: airlines grounded worldwide |
| Nightly ERP batch | daily stock and order files | the business can wait until tomorrow | marketplaces, ad feeds and agents that expect changes within minutes | stale prices and stock in feeds, oversells, disapproved products |

Three things make this debt hard to see:

- **It works every day until the peak.** Average load stays inside the old sizing, so dashboards look normal. The failure comes on the busiest minute, which is also the most visible one.
- **It fails all at once, not gradually.** A link that is too small doesn't get a little slower. It drops, and every system behind it stops at the same time.
- **The backup shares the assumption.** A second copper line, a second server with the same code, or a second region with the same rollout sees the same overload and fails with the first.

### How the problem scales

The same expired assumption shows up at four levels. Each level sits on the one below it, so a platform that fails at level 1 can't be made safe at level 4.

| Level | What breaks | Too much data in the form of | Recent example | What it means for a BAU commerce platform |
|---|---|---|---|---|
| 1. Fundamental load | a component that can't take the volume, rate or simultaneity | one big file, one blocking request, one undersized link | Newark copper links (2025); HBO GO sign-in (2014); the nightly ERP batch | if a single job, link or database can't take peak load, nothing above it matters |
| 2. E-commerce data streams | the always-on flows between store, ERP, WMS, marketplaces and ad platforms | webhook storms after a bulk edit, product and inventory updates at peak, feed rebuilds, conversion events | Black Friday / Cyber Monday peaks; a bulk price change that fires one webhook per variant | backlogs, rate limits (HTTP 429), retries that multiply the load, duplicate orders, stale stock and prices in feeds |
| 3. Hyperscalers that break | a provider's shared region, control plane or configuration system | a configuration or data file that grows or changes and is pushed everywhere at once | AWS us-east-1, October 20, 2025 (a DNS race in DynamoDB's automation); Azure Front Door, October 29, 2025 (a configuration change); Cloudflare, November 18, 2025 (a bot-management feature file doubled in size and passed a hard limit in the proxy); Google Cloud, June 12, 2025 (a policy change with blank fields crashed Service Control) | one provider's fault stops thousands of unrelated stores at the same moment; your own load was fine |
| 4. Mob AI on BAU platforms | the platform's front door and its business logic | very large numbers of AI agents and crawlers acting at once: scraping catalogs, comparing prices, testing carts and checkouts, trying credentials, injecting instructions into reviews and product text | AI crawler and agent traffic growing faster than human traffic; agentic checkout protocols (UCP, ACP) moving purchases to machines | request rates set by machines, not people; security controls that are themselves load; attacks that look like ordinary shopping |

Why the order matters:

- **Level 4 arrives on top of levels 1–3, not instead of them.** Agent traffic is more of the same requests, at machine speed and all at once. A store that already struggles at a human Black Friday peak will struggle sooner under agents, before any attack is involved.
- **Security tooling is load too.** Bot detection, WAF rules, consent checks and signature checks all run on every request. The Cloudflare outage of November 18, 2025 started in a bot-management file: a security feature failing on too much data took the traffic down with it.
- **An overloaded system fails unpredictably.** Under overload, checks can time out and fail open (letting traffic through) or fail closed (blocking real customers). Load has to be predictable before security behavior can be.
- **Rust alone isn't the answer.** The proxy in the Cloudflare outage was Rust; an oversized input reached a hard limit and the code panicked instead of rejecting the file. Memory safety doesn't replace size limits, validation of each input, and staged rollout.
- **Concentration is a design choice.** Levels 3 and 4 hit every platform on the same provider or the same agent protocol at once. For the paths that can't stop (checkout, order intake, consent), keep a second path that doesn't share the provider: a static fallback, a second region or provider, or a queue that holds orders until the main path is back.

So the challenge isn't only replacing old equipment. It's finding every place, from the wire up to the provider and the front door, where a design still assumes the data is small, slow, spread out or sent by people, and changing how that part takes data in before the next peak, outage or agent wave finds it. The rest of this article follows that through: the FAA example, why new cable alone doesn't fix it, short-term pairings that cover the gap, and why chunking, concurrency and Rust belong in the same budget as the new wire.

This article is the background for the air row of [Global Unit Data Loads](GLOBAL-UNIT-DATA-LOADS.md). That spec says air positions come from at least two providers and that gaps are marked, not filled. This article explains why.

## Overview

US air traffic control still moves radar and radio data between facilities over telecom lines, and many of them are copper circuits from the early 2000s or older. The radio part of radar works. The weak link is the wired leg that carries the processed data from the radar site to the room where controllers work. When that leg fails, controllers lose the picture even though the radar is still running.

The long fix is a full rebuild. It takes years, so the useful question for anyone running or depending on this kind of network is what can be paired with the old system now, so that one failure doesn't become an outage.

The fiber migration itself is a 20-year-old problem: it was scoped around 2007, the year HBO on Broadband launched. The same pattern shows up in commerce stacks from the same era: a 2000s ERP, a T1 or MPLS line, a nightly batch file. New links get laid in, but the system behind them is the same, so the risk stays.

## A 20-year problem

Moving these networks to fiber isn't a new project. It has been on the table for about twenty years, the same span in which consumer video moved from cable boxes to broadband.

| Year | Aviation | Broadband and streaming |
|---|---|---|
| early 2000s | FAA Telecommunications Infrastructure (FTI) contract replaces older leased circuits, but much of the last mile stays on carrier copper | DSL and cable modems become the home connection |
| 2007 | NextGen modernization program gets under way, promising a digital, satellite-based system | HBO on Broadband launches: premium video delivered over the subscriber's internet line instead of the cable box |
| 2010s | NextGen rolls out ADS-B (mandate from 2020), but the facility-to-facility links largely stay as they were | HBO GO and other streaming apps scale; carriers lay fiber to homes and businesses |
| 2025 | Newark outages over copper links | fiber and 5G are the normal home and mobile connection |
| 2026–2028 | Brand New Air Traffic Control System replaces copper, radios and radars | — |

Consumer streaming crossed to fiber because each subscriber's line could be upgraded on its own. The FAA network couldn't move that way: every link feeds a safety-critical system that can't go dark during a cutover, and the endpoints were never replaced. That is why a problem first scoped around 2007 is still causing outages in 2025.

## What failed at Newark (2025)

- Radar data for Newark flights is processed at the New York TRACON on Long Island. It then travels over telecom circuits to the Philadelphia TRACON, where Newark's controllers moved to in 2024.
- On April 28, 2025, a failed piece of copper wiring cut the link. Controllers lost radar and radio contact for about 90 seconds.
- On May 9, 2025, a second outage of about 90 seconds hit after both the primary and the backup links failed.
- The result was thousands of delays and cancellations, controllers taking trauma leave, and national attention on the age of the system.
- A later Northeast ground stop was reported to trace back to a severed cable at the Philadelphia TRACON. Its exact date isn't confirmed here.

The second outage is the important one: the backup existed, but it didn't survive the same failure as the primary.

## Why copper is the problem, and why fiber alone isn't the fix

| Issue | What it means |
|---|---|
| Capacity | The circuits were sized for an earlier data load. One controller said the wires can't carry the amount of data now sent over them, which leads to shorts and dropouts. |
| Distance and age | Hundreds of miles of copper behave like an old landline network: corrosion, water, heat and construction damage, with each splice a failure point. |
| Shared paths | A primary and a backup that run through the same conduit, building or carrier fail together, as on May 9. |
| Old endpoints | Even where fiber is installed, the signal is slowed down at the facility because the computers there are too old to take the data at full speed. |
| Same architecture | FAA leadership put it plainly: "We're pulling copper up and putting fiber down, but it's the same data architecture that we've had for 50 years." |

The lesson carries over directly: replacing the cable without replacing the endpoints and the data model moves the bottleneck instead of removing it.

### The old endpoints: Compaq computers and floppy disks

The "old endpoints" are literal. Reuters reported that the system relies on decades-old Compaq computers, with replacement parts bought on eBay, and the FAA says it will phase floppy disks out of hundreds of facilities by 2028. The FAA hasn't published how much memory these machines have. For scale, typical desktops of the Windows 95 and NT era shipped with about 16–128 MB of RAM, against 8 GB or more in a current phone.

Memory isn't the main reason they can't take the new load, though. Radar track data is small by modern standards. The limits sit in the rest of the stack:

- **Processor and operating system:** single-core CPUs, and 32-bit systems that can't address more than 4 GB however much memory is fitted. The operating systems no longer get security patches.
- **Interfaces:** serial lines and old network cards built to match the copper circuits. That's why data arriving over new fiber is slowed down at the facility.
- **Software written for a fixed load:** fixed buffers, fixed message rates and one-at-a-time processing. More data than the software expects overflows or stalls it, whatever the hardware.
- **Certification lock-in:** the systems run around the clock and are safety-certified. Changing the hardware or operating system means recertifying, and they can't be taken offline, so they're kept alive with salvaged parts.
- **Shrinking supply:** HP retired the Compaq brand in 2013, so every failure takes longer to repair.

Adding RAM wouldn't fix it, which is why the FAA's plan replaces the computers and software along with the copper. It's the clearest case of tech debt that worked before data got big: each part was sound for the load it was certified for, and the load moved on.

## Too much data at once: Game of Thrones, Windows and the radar link

Three outages from three industries share the same shape. In each, a component built for an earlier load took the new load as one large, blocking unit. When it choked, everything behind it stopped.

| Incident | What arrived all at once | Where it blocked | What chunking and concurrency change |
|---|---|---|---|
| HBO GO, Game of Thrones season 4 premiere (April 6, 2014) | Millions of viewers signing in at the same minute, a spike HBO put down to "excessive user demand" | The sign-in and entitlement path. The video was already delivered in small segments, but the check on who may watch ran as a blocking request against a cold backend. | Warm the catalog and entitlements into cache before the spike, answer sign-ins on a non-blocking event loop, and admit users in batches instead of all at once. *Field note from the team that did the setup: the original stack was threaded Ruby with Adobe's Ruby-based entitlement system; the lesson became the Node preload strategy.* |
| CrowdStrike update on Microsoft Windows (July 19, 2024) | One faulty content update sent to every machine at once | Inside the Windows kernel. About 8.5 million devices crashed (Microsoft's estimate), including airline check-in, crew scheduling and dispatch systems. Delta alone cancelled thousands of flights over several days. | Ship updates in stages (a small ring first, then wider rings), validate each piece before loading it, and isolate the component so that one bad input can't take the whole host down. |
| Newark radar and radio link (April 28 and May 9, 2025) | More radar and voice data than the copper circuits were sized for | The telecom link, then the facility's old computers, which still slow down data arriving over the new fiber | Carry the feed as bounded, numbered messages over diverse paths, with backpressure, so an overload degrades the picture instead of cutting it. |

At HBO GO the radar link's role was played by the sign-in check, and at airlines by the kernel. In all three cases the medium got faster or the audience got bigger, but the processing model stayed the same.

## Why Rust, threads and chunking belong in the legacy tech-debt budget

Legacy tech debt is usually scoped as old equipment: copper lines, old servers, an old ERP. The incidents above show the other half of the debt, which is the processing model. A system that takes data as one big blocking unit, on one thread or on threads that share locks, fails the same way on fiber as it did on copper. That is the FAA's own point: "We're pulling copper up and putting fiber down, but it's the same data architecture that we've had for 50 years."

So when a migration is budgeted, these items belong on the same line as the new wire, not in a later phase:

| Legacy pattern | How it fails under too much data | Fold-in fix | Where it sits in this stack |
|---|---|---|---|
| Whole-payload processing (one file, one request, one batch) | One oversized or bad payload blocks or crashes everything behind it | **Chunking.** Split data into bounded pieces, each with a sequence number, size cap and hash, so each piece can be checked, retried and resumed on its own. | Cloudflare Queues batches; R2 multipart uploads and range reads; COPC tiles for point clouds; HLS/DASH segments for video |
| One thread, or threads that share locks | One slow call stalls every user; lock contention collapses throughput at peak | **Concurrency without shared state.** Async tasks on a work-stealing thread pool (Rust and Tokio), where the compiler rejects data races. Many isolated single-threaded instances where that suits better. | Tokio in Cloudflare Containers for heavy parsing; Workers isolates for the edge; Xano tasks for the system of record |
| No backpressure | The sender keeps pushing until the link or the process falls over, as the copper circuits did | **Bounded channels and load shedding.** When input exceeds capacity, slow the sender, queue up to a limit, and drop the lowest-priority work first. | Queue limits and dead-letter queues; per-tenant rate limits at the edge |
| Garbage-collection pauses and unpredictable memory | Latency spikes at exactly the moment of peak load | **Predictable memory.** Rust has no garbage collector, so memory use per message is known in advance. | Rust/WASM parsers for large feeds (AIS, LAS, EDI) |
| All-at-once rollout | One bad update reaches every machine together (CrowdStrike) | **Staged delivery.** Canary rings, validation before loading, and a fast stop | Versioned Worker deploys with gradual rollout; the release gate |
| Cold start at the spike | The backend is asked for everything at the busiest moment (HBO GO) | **Warm before the spike.** Preload catalogs, entitlements and keys into cache ahead of a known event | KV and cache warm-up before launches and drops |

Two cautions:

- **Rust doesn't create capacity.** It makes behavior under overload predictable, with no data races, no garbage-collection pauses and bounded memory. The capacity still comes from the network, the hardware and the number of instances.
- **Chunking needs an order and an end.** Every chunk carries its position and the total count or a final marker, so the receiver knows when the message is whole, and a missing chunk is reported as a gap rather than silently skipped. That's the same rule as gap marking in the [non-browser data chains](GLOBAL-UNIT-DATA-LOADS.md).

The result is a single budget line: the new link, the new processing model, and the staged path to switch from one to the other. Paying only for the link leaves the debt where it was, which is why a problem first scoped around 2007 was still producing outages in 2025.

## OTT vs data streams

OTT means **over-the-top**: video delivered over the public internet, "over the top" of the cable or satellite operator's own network instead of through a set-top box. HBO GO, Netflix, Disney+ and YouTube are OTT services.

OTT and commerce or machine data streams share delivery mechanics, but the data has a different shape.

| | OTT video streaming | Commerce and machine data streams |
|---|---|---|
| Direction | mostly one-to-many and downstream: the same file goes to millions of viewers | mostly many-to-one and upstream: millions of different messages arrive at one system of record |
| Caching | highly cacheable; every viewer gets the same segments from the CDN | each message is unique, so it can't be cached on the way in; only outputs (preloaded reads) can |
| Chunking | HLS or DASH segments of about 2–6 seconds, each in several bitrates | queue batches, multipart uploads, COPC tiles, SenML batches |
| Under overload | adaptive bitrate lowers quality and the viewer keeps watching | every record matters, so nothing can be sent at "lower quality"; hold, coalesce or deprioritize instead (backpressure and load shedding) |
| Order and loss | a late segment is skipped; a lost frame is barely noticed | order matters within a partition; a lost or duplicated message is a wrong stock count or a double order, so idempotency keys and gap marking are required |
| Latency | video on demand buffers seconds ahead; live runs at about 2–30 seconds | depends on the source: under a second for radar and operations screens, minutes for feeds, hours for reconciliation |
| Security | per session: DRM and signed URLs | per message: signatures, a key per device, a consent check |

What carries over from OTT:

- **The manifest.** An HLS playlist (`.m3u8`) or a DASH MPD lists the chunks, the renditions and their order, and the player follows it. The helm's per-flow manifest plays the same role for data.
- **Chunks with a position and an end.** Every segment has a sequence number, the same rule this article sets for data chunks.
- **Preloading to the edge.** CDNs position popular content before a premiere, which is Node preload applied to the catalog and entitlements.
- **The HBO GO lesson.** In 2014 the video segments were already chunked and cached. What broke was the sign-in and entitlement path, the one part that behaved like a commerce data stream: unique per user, not cacheable, and blocking.

OTT solved the outbound, identical-content problem about twenty years ago. Commerce and machine data is mostly the inbound, unique-message problem, so it borrows OTT's chunking, manifests and edge preload, and adds ordering, idempotency and per-message security.

## Chunking compared: OTT, AI, gaming and data streams

Chunking is the shared technique, but each field cuts at a different boundary and protects something different.

| | OTT video | AI | Gaming | Commerce and machine data |
|---|---|---|---|---|
| Unit | a segment of a few seconds, per bitrate | a passage of a few hundred tokens for retrieval; a batch of requests for inference; a stream of tokens out | a world cell or level section; a texture mip level; a level-of-detail mesh; a network snapshot or delta per tick | one record change, a queue batch, a file part, a tile |
| Where it's cut | at keyframes, so each segment plays on its own | at meaning (headings, paragraphs), with some overlap so context isn't cut mid-thought | by distance and visibility around the player | by partition key (tenant, market, product, device) and a size cap |
| Budget it protects | network bandwidth and the playback buffer | the context window and token cost; GPU memory | the frame budget (16.6 ms at 60 fps) and GPU memory | queue depth, memory per task, API rate limits |
| Loaded first | the next segments at the current bitrate | the highest-ranked chunks that the user is allowed to see | what's in view and near the player | changes ranked by priority: price and stock before descriptions |
| Under overload | lower bitrate | fewer chunks, a smaller model, or a fallback with a flag | lower level of detail, lower-resolution textures, fewer far objects | coalesce, hold in the queue, shed low-priority work |
| Manifest | the `.m3u8` or MPD playlist | the retrieval index and its metadata | the asset bundle or world-partition manifest | the helm's flow manifest |
| Delta updates | new segments only | new or changed chunks re-embedded only | patches shipped as changed chunks only | hash-gated changes only |

Rules all four share:

- **Each chunk stands alone.** It can be checked, retried, cached or dropped without the rest. A video segment starts on a keyframe; a retrieval chunk carries its own source and heading; a world cell loads without the neighboring cell; a data batch is valid on its own.
- **Each chunk carries its metadata.** For AI and data this includes permissions: a retrieval chunk carries its source, tier, consent and rights, so a model never reads a chunk its user may not see, and deleting the source row deletes its chunks.
- **Load by priority within a budget.** Players, games, models and queues all decide what to load first from a fixed budget, and degrade the rest instead of failing.
- **Update by delta, never by rebuild.** New segments, re-embedded changed chunks, game patches and hash-gated record changes all avoid reprocessing everything. That's the incremental A/B load in four forms.
- **Preload before the peak.** CDNs before a premiere, games while the player is still in the previous area, AI caches of frequent answers, and the commerce edge cache before a drop.

The game-engine frame budget as the origin of "bind before you allocate" is covered in [Hyperscaler vs Distributed](HYPERSCALER-VS-DISTRIBUTED.md); AI weighting and ranking of retrieved rows are in the same article.

## The approach: preload, background tasks and bounded memory

### Why more hyperscaler VMs won't restore business as usual

A worked example shows how big the growth is. Take a catalog of 10,000 products.

| | Then: nightly batch | Now: always-on streams |
|---|---|---|
| Unit of change | one row per product | one row per variant, per market, per channel |
| Records | 10,000 products | 10,000 × 5 variants × 10 markets × 5 channels (Shopify, Google, Meta, Amazon, the site) = 2.5 million |
| Updates per day | 1 (the nightly file) | about 20 (stock moves, price changes, feed refreshes) |
| Record updates per day | 10,000 | 50,000,000 |
| Growth | — | **5,000×** |

Your multipliers will differ, but the shape doesn't: every new market, channel and agent multiplies the others. Scaling virtual machines to match doesn't bring back business as usual, for four reasons:

- **Cost grows with the multiplier.** VMs sized for the peak are paid for around the clock, and log ingestion, streaming and egress on a hyperscaler are priced per gigabyte, so 5,000× the records means a bill that follows it (see [Hyperscaler vs Distributed](HYPERSCALER-VS-DISTRIBUTED.md)).
- **Spikes are faster than VMs.** A premiere, a drop or an agent wave arrives in seconds. New VMs take minutes to boot, warm and join the pool.
- **A bigger VM keeps the same bottleneck.** If the code takes the data as one blocking unit or behind one lock, more cores wait on the same lock.
- **The provider is a shared point of failure.** The October and November 2025 outages above hit every customer of the affected region or service at once.

The answer is to change where and when the work happens. Do it before the request, off the request path, and in bounded memory. Then shrink the 5,000× before it reaches compute.

### Three paths, three tools

| Path | Tool | What it does | Memory and load rule |
|---|---|---|---|
| Request path (a shopper, an agent, a controller's screen) | **Node preload** at the edge: a non-blocking event loop plus data warmed into cache (KV) before the spike | Answers from precomputed data only: catalog, prices per market, entitlements, consent state. Nothing is computed or fetched from the system of record during the request. | Read-only, small objects, cached; a cache miss returns the last good version and queues a refresh, never a blocking call |
| Event path (webhooks, feeds, scans, telemetry) | **Rust and Tokio background tasks** as queue consumers, in Cloudflare Containers for heavy parsing and Workers for light reshaping | Parses, validates, reshapes, hashes and diffs each chunk, then writes only the changes onward | Streaming parse (the file is never loaded whole), bounded channels, fixed-size buffers reused between chunks, a memory budget per task (a Worker isolate has 128 MB), no garbage-collection pauses |
| Scheduled path (reconciliation, rebuilds) | **Xano background tasks** on the system of record | Batch upserts from the queue, nightly and hourly reconciliation against Shopify and the ERP, retries of dead-lettered messages, snapshot for the integrity check, and a rebuild of the preload cache | Idempotent by key; batched writes; runs off-peak where it can; one task per job, so a slow job doesn't hold the others |

### Shrink the multiplier before it reaches compute

Most of the 5,000× is repetition. Background tasks remove it before anything expensive runs:

- **Hash-gate every record.** Hash the fields each channel uses. If the hash hasn't changed, nothing is sent. Most updates to most records change nothing a channel reads.
- **Coalesce bursts.** Twenty stock changes to one variant in a minute become one update with the last value.
- **Send per channel only what that channel reads.** Meta doesn't need the warehouse bin, and Google doesn't need the internal cost.
- **Batch writes.** A thousand changed rows go to Xano or the Merchant API as one batch call, not a thousand calls.
- **Precompute reads once.** A price per market is computed once when it changes and preloaded, not computed per request by every visitor and agent.

In the example above, hash-gating and coalescing typically leave a small fraction of the 50 million updates to send. The exact figure depends on the catalog, so measure it on your own data before sizing anything.

### How this ties back

- **HBO GO:** preload is the lesson of the 2014 premiere. The sign-in check reads warmed entitlements and doesn't call a cold backend at the peak.
- **CrowdStrike and Cloudflare:** background tasks validate each chunk against a size limit before loading it, and roll changes out in stages. An oversized input is rejected and reported; it doesn't crash the consumer.
- **Newark:** bounded queues give backpressure, so an overload degrades the picture instead of cutting it.
- **Mob AI:** agents hit the preloaded request path, which costs little per request and has nothing to exhaust in the system of record, while rate limits and bot rules sit in front of it.

## Incremental A/B data loads and horizontal scaling by design

Preload and background tasks only pay off if the system is designed to change a little at a time and to grow by adding instances. The opposite, brute force, is the default in many stacks: every change recompiles, re-serves and re-uploads everything.

### Brute force vs built in

| | Brute force: everything compiles, serves and updates | Incremental A/B loads with horizontal scaling built in |
|---|---|---|
| Unit of work | the whole site, catalog or feed | one changed record, or one partition |
| Cost per change | proportional to the whole data set | proportional to what changed |
| At 5,000× the change rate | full rebuilds overlap and never finish; the queue grows without end | each change is small, and more instances absorb more changes |
| Time to live | minutes to hours per rebuild | seconds per change |
| A bad load | replaces everything at once (the CrowdStrike and Cloudflare shape) | stays in the inactive slot and fails validation before anyone sees it |
| Rollback | rebuild the previous version, as slowly as the bad one | switch the pointer back |
| Peak handling | a bigger machine (vertical scale), with the same lock | more stateless instances working separate partitions (horizontal scale) |
| Provider dependence | one large job on one provider's VMs | small jobs that can run at the edge, in Xano or in a second region |

### The A/B data load

The live data sits in two slots, A and B. One serves traffic and the other is loaded.

1. **Load the inactive slot incrementally.** Copy forward from the live slot, then apply only the changed records (hash-gated and coalesced, as above).
2. **Validate before anyone sees it.** Check record counts against the expected change, the hash of each partition, every value against its type and range, and the size of each file and object against a hard limit. An oversized or empty file is rejected here, which is exactly the check that would have stopped the 2024 and 2025 configuration-file outages.
3. **Canary.** Serve the new slot to a small share of traffic, one market or one channel first, and compare errors, prices and stock between the slots.
4. **Switch with one pointer.** A single key (for example `active_slot` in KV) moves from A to B. Readers pick it up on their next request; nothing is rebuilt.
5. **Keep the old slot for rollback.** If anything looks wrong, the pointer goes back to A immediately. The next load then goes into A.

The same two slots support A/B testing: serving slot B to a set share of visitors is a canary that stays on, with results compared per slot.

### Horizontal scaling built in

Horizontal scaling isn't something added at the peak. It comes from four design choices made at the start:

- **Partition by key.** Work is split by tenant, market and product (or a hash of the product ID). Each partition is loaded, validated and switched on its own, so a problem in one market doesn't hold the rest.
- **Keep workers stateless.** Any instance can take any partition's next message; state lives in the queue, in Xano and in KV. Adding capacity means adding instances, not resizing one.
- **Order within a partition, not globally.** Changes to one product stay in order. Different products run in parallel. No global lock exists to wait on.
- **Backpressure per partition.** A hot product or a flooded market slows down on its own queue, and the others keep moving.

### Where each piece sits in this stack

| Surface | Brute force to avoid | Incremental, horizontal approach |
|---|---|---|
| Google Merchant API | resubmitting the full product file on every change | `productInputs` insert or delete per changed offer, batched; a full file only for the first load |
| Shopify | re-syncing the whole catalog | bulk operations once for the initial load, then per-item mutations driven by webhooks |
| Static site and Webflow pages | a full site rebuild and publish for each content change | incremental builds and per-item or per-page publishing; data rendered from the edge instead of compiled into pages |
| Xano (system of record) | one task that reprocesses every table | batched upserts per partition from the queue; scheduled reconciliation per partition |
| Edge cache (KV) | flushing everything after a change | A/B slot keys per partition and an `active_slot` pointer |
| Files and 3D assets (R2) | overwriting objects in place | new versioned objects plus a pointer switch; the old version kept for rollback |
| Worker deploys | releasing everywhere at once | gradual rollout by percentage, with the previous version ready |

The result is that business as usual survives growth. A change costs what it changes, a bad load never reaches readers, and a peak means more instances working more partitions, not a bigger machine waiting on the same lock.

## Machine planning: radar, VMS, IoT, LiDAR, spatial data and serving

Most of the 5,000× doesn't come from people. It comes from machines: radar, cameras, sensors, scanners and trackers that send data all day whether anyone is looking or not. Machine planning means sizing each source before it's connected and deciding, per source, what stays at the site, what is processed in the background, and what is served to whom.

The rates below are orders of magnitude for planning. Measure your own devices before sizing anything.

| Source | Typical output | Rate per device | Keep raw where | Process in the background | Serve |
|---|---|---|---|---|---|
| Radar | target reports and tracks (ASTERIX: category 48 for single-radar plots, 62 for system tracks); the raw radar video stays at the radar | a terminal radar sweeps about every 4.8 s, an en-route radar about every 12 s; track reports are kilobits to low megabits per second | at the radar site and the facility | track fusion with ADS-B and multilateration; gap and disagreement flags | live tracks to operations screens; delayed, leg-level positions to customers and agents |
| ADS-B and AIS | position reports | about once a second per aircraft; every few seconds to minutes per ship, depending on speed | provider archive; our raw copy in R2 | reduce tracks to legs; cross-check providers | legs and ETAs, never a single provider's silence as a status |
| VMS (video management: cameras) | continuous H.264/H.265 video | about 2–8 Mbps per 1080p camera, more for 4K | at the site, on the recorder; never shipped raw to the cloud | detection at the site or edge, which turns video into events and short clips | events, clips on request, counts; never a live stream to agents |
| IoT sensors | small readings (SenML in CBOR over MQTT or CoAP) | tens to hundreds of bytes per reading, every few seconds to minutes; the volume comes from fleet size | R2, compressed | coalesce, check ranges, flag cold-chain breaches | current value plus alerts; history as rollups |
| LiDAR | point clouds (LAS/LAZ, E57; phone scans as USDZ) | a terrestrial scanner captures up to about a million points per second; one scan is gigabytes | R2, as LAZ and COPC | streaming parse in Rust, measured dimensions, QA against the spec, a GLB mesh | dimensions and QA result to Xano; the mesh and COPC tiles to the viewer by range request |
| Spatial data (KML, GeoJSON, vector and 3D tiles) | derived positions, routes, footprints | changes when the sources change | R2, versioned | precompute tiles (for example a single PMTiles file) and route KML per leg | static tiles from R2 through a Worker with range reads; nothing rendered per request |

### The planning steps

1. **List every machine source** with its count, rate per device, message size and cadence.
2. **Compute the steady rate and the peak.** Peak is not the average times two. Plan for the reconnect storm: after an outage, every device that buffered data sends it at the same moment.
3. **Decide what never leaves the site.** Raw video, raw radar returns and full-resolution point clouds stay local or go to R2 in bulk off-peak. This is the biggest lever in the whole plan.
4. **Size the site buffer for the outage you expect.** Buffer = rate × hours offline. If the site must survive 24 hours without a link, the buffer has to hold 24 hours of everything that will be sent later.
5. **Choose a partition key per source:** site, device or product. That key drives the queue, the A/B slots and horizontal scaling.
6. **Tier the storage.** Hot (current state, in Xano and KV), warm (recent history, rollups), cold (raw archive in R2). Each tier has a retention period.
7. **Budget the serving side separately.** Who reads what, how fresh it has to be, and from which preloaded copy. Operations get live data over a socket; customers and agents get delayed, summarized data from the cache.

### Worked example: one warehouse in Korea

| Source | Count | Rate | Per day | Plan |
|---|---|---|---|---|
| Cameras (VMS) | 40 | 4 Mbps each, 160 Mbps total | about 1.7 TB | stays on the site recorder; only events and clips are sent (megabytes a day) |
| Sensors (temperature, humidity, doors) | 500 | 100 bytes every 10 s | about 430 MB | sent as SenML/CBOR batches; coalesced and range-checked in the background |
| LiDAR scanner | 1 | a few scans a day, about 1–2 GB each as LAZ | a few GB | uploaded off-peak to R2; dimensions and QA results to Xano |
| Trackers on outbound pallets | 20 | one fix a minute | under 10 MB | sent through the non-browser chain; legs to customers |

Video is more than 99% of the raw volume and none of it needs to leave the site. Without that one decision, the link, the cloud bill and every downstream system are sized for 1.7 TB a day. With it, they're sized for a few gigabytes. Brute force ships everything and scales VMs to match. Machine planning decides first what each machine's data is for.

### How it connects

- Formats, identifiers, coordinate systems and UTF-8 rules per source are in [Global Unit Data Loads](GLOBAL-UNIT-DATA-LOADS.md) (ISO data for space, sea, air and LiDAR; KML).
- Device identity, store-and-forward and idempotency are in its non-browser data chains section.
- Background processing, preload and A/B slots follow the sections above. Each source gets a partition key, a bounded queue and a memory budget per task.
- Serving follows the preload rule: no machine data is computed per request, and agents read summaries, never raw feeds.

## Orchestration: the helm

Preload, background tasks, A/B loads and machine planning are parts. The helm steers them. It's the control layer that decides, for every flow, which way data may move, what runs when, under which keys and limits, and how far it may scale. Without it, each part makes those decisions on its own, and the system is again one big job nobody can steer at the peak.

The helm is declared, not coded into each service: one manifest per flow, versioned in git, validated and rolled out in stages like any other data. Teams on Kubernetes will recognize the idea from Helm charts, where one values file sets replicas, resource limits, network policy and secrets for a release. Here the same idea covers the edge, the queues and Xano.

### The four duties

| Duty | What the helm decides | Rules | Where it's enforced |
|---|---|---|---|
| **Data direction** | which way each flow may move: inbound to the system of record, outbound to channels, or both | every flow has a stated direction; an unlisted direction is refused; design surfaces are outbound only unless a flow is explicitly allowed inbound; no output is read back as input | edge routes and Worker bindings; Xano endpoint auth; per-flow allow list |
| **Orchestration** | what runs, in what order, on which path (request, event or scheduled) | request path reads preloaded data only; heavy work is a queued background task; scheduled jobs are idempotent and one task per job; dependencies are explicit (load → validate → canary → switch) | Cloudflare Queues and cron triggers; Rust/Tokio consumers; Xano background tasks |
| **Security** | which identity and key each flow uses, what it may touch, and what's checked on each message | one key per flow and per device, never shared; signatures on every inbound message; consent or legal basis checked before personal data moves; size and type limits checked before parsing; agents propose, people approve | edge (mTLS, HMAC, Turnstile, WAF, rate limits); key store; consent layer; integrity tripwire |
| **Scaling** | the partition key, queue limits, memory budget and instance range per flow | scale by adding instances per partition, never by one bigger machine; bounded queues with backpressure; a memory budget per task; a load-shedding order (what's dropped first) | queue settings; Worker and Container limits; Xano task schedule |

### One manifest per flow

An example for stock and price updates going from Shopify to Google's Merchant API:

```yaml
flow: offers-to-merchant-api
direction: outbound              # Xano (system of record) → Google; never read back
source: xano.offers              # canonical record, not the Shopify webhook itself
sink: google.merchant.productInputs
path: event                      # queued background task, not on the request path
partition_key: [tenant, feed_label, offer_id]
change_filter:
  hash_fields: [price, sale_price, availability, title, link]
  coalesce_window: 60s           # 20 stock moves in a minute → 1 update
load:
  slots: [A, B]
  validate:
    max_batch_bytes: 5MB
    max_records_per_batch: 1000
    price_currency: required     # ISO 4217
  canary: { share: 5%, by: feed_label }
  switch: kv:offers/active_slot
security:
  credential: merchant-sa-tenant # one service account per tenant and flow
  signing: hmac-sha256           # inbound webhooks to the edge
  personal_data: none            # an offer carries no customer data
scaling:
  queue: offers-merchant
  max_queue_depth: 200000
  consumers: { min: 1, max: 50 }
  memory_budget_mb: 96
  shed_order: [refresh_unchanged, low_priority_markets]
on_failure:
  read: serve_last_good
  write: hold_in_queue           # never drop, never publish an unvalidated batch
```

### Rules for the helm itself

- **No flow without a manifest.** A connection that isn't declared doesn't get a key, a queue or a route.
- **The helm's own configuration is data, and it gets the same checks.** Manifests are validated against a schema and a size limit, canaried and rolled back by pointer. The 2024 and 2025 outages above all began with configuration or data pushed everywhere at once; the helm must not become that single push.
- **Fail-safe defaults are set per flow.** Reads serve the last good copy. Writes to the system of record, payments and consent hold in the queue rather than proceed unchecked.
- **Direction gates are reviewed like permissions.** Opening an inbound direction (for example, reading content back from a design surface) is a change with a named owner and a reason, not a default.
- **The helm is visible.** Each flow reports its queue depth, lag, error rate, active slot and last switch, so the people steering can see the load before it becomes an outage.

On Kubernetes, the same manifest maps onto Helm chart values: `replicas` and a HorizontalPodAutoscaler for scaling, `resources.limits.memory` for the memory budget, NetworkPolicy for data direction, and Secrets per release for keys. The duties are the same whichever platform runs them.

## The long-term fix: the Brand New Air Traffic Control System

These figures are as reported by the sources below, through autumn 2026. They haven't been independently checked here, so confirm the latest status before citing them.

| Track | What's planned | Reported status |
|---|---|---|
| Telecom | About 5,170 new high-speed connections over fiber, satellite and wireless | about 67% of copper replaced by August 2026; target around Q3 2027. A new Philadelphia–New York fiber cable for the Newark facility went online in May 2026. |
| Equipment | 27,625 radios, 462 digital voice switches, 612 radars, new surface radars at 44 airports, electronic flight strips | in progress |
| Data network | A digital network on top of the new links ("Putting fiber in the ground is not enough") | software side underfunded; needs more from Congress |
| Funding | July 2025 law: $12.5 billion, including $4.75 billion for telecom, $3 billion for radars and $1.9 billion for new en-route centers | down payment on a larger total |
| Oversight | GAO (GAO-26-107992, September 2026): no lifecycle cost estimate or master schedule, so there's a risk of disruptions or of relying on old systems for longer | overall deadline December 2028 |

## What the signals are

Radar itself is radio, not wire. The wire problem starts only after the radar has turned the echoes into data.

| Source | How it works | Band | Can it be faked or switched off? |
|---|---|---|---|
| Primary radar, terminal (ASR) | sends pulses and times the echo | S-band, about 2.7–2.9 GHz | no; it sees any aircraft |
| Primary radar, en route (ARSR) | the same, over longer range | L-band, about 1.2–1.4 GHz | no |
| Surface radar | tracks aircraft and vehicles on runways and taxiways | X/Ku-band, about 9–16 GHz | no |
| Secondary radar (SSR / Mode S) | asks at 1030 MHz, and the transponder answers at 1090 MHz with ID and altitude | 1030 / 1090 MHz | needs a working transponder |
| ADS-B | the aircraft broadcasts its own GNSS position about once a second | 1090 MHz, or 978 MHz (UAT) | GNSS can be jammed or spoofed; needs cooperation |
| Space-based ADS-B | satellites receive ADS-B from orbit, including over oceans | 1090 MHz | as ADS-B |
| Multilateration (MLAT / WAM) | ground receivers time the transponder replies to compute a position | 1090 MHz | independent of the aircraft's GNSS |

## Short-term paired fixes

The rebuild runs to 2028. Until then, the useful fixes pair a new path or source with the old one, so a single failure stays a degradation, not an outage. None of them is new technology; they're standard for any network that can't fail.

| Problem | Paired short-term fix | Why it helps | Long-term replacement |
|---|---|---|---|
| One copper circuit carries the feed | Add a second path on a different medium and route: fiber plus licensed microwave, or plus a satellite link (LEO or GEO) | a backhoe, flood or fire can't take out both | full fiber, satellite and wireless network |
| Backup shares the primary's route | Audit the physical route of every primary and backup pair: building entry, conduit, carrier and central office | the May 9 failure mode is found before it happens | network designed for diversity from the start |
| Legacy endpoints can't take fiber speeds | Carry the old circuits unchanged over the new fiber: TDM over IP pseudowires (SAToP, RFC 4553; CESoPSN, RFC 5086) and media converters at each end | the new link's reliability arrives without replacing the old computers yet | new endpoints and a native IP data network |
| A dropout leaves controllers blind | Pair sources: primary radar plus Mode S plus ADS-B plus multilateration, fused at the facility | if one source or link drops, the others still show the traffic | the same fusion over the new network |
| GNSS jamming or spoofing | Cross-check ADS-B positions against radar and multilateration; flag disagreements | one faked source is caught by the independent ones | the same, with better monitoring |
| Failures are found by controllers | Monitor circuit health (error rates, latency, failover events) with alarms ahead of an outage | a degrading line is swapped before it fails | monitoring built into the new network |

### Why the phone-style approach is a pair, not a replacement

Phones find themselves the way ADS-B does: from GNSS, plus cell towers and Wi-Fi. Aviation already uses that idea (ADS-B, space-based ADS-B, crowdsourced receiver networks, Remote ID for drones). It can't replace radar, for four reasons:

- GNSS can be jammed or spoofed, and both have increased sharply near conflict zones. Radar measures where the aircraft is, not where it says it is.
- It needs the aircraft to cooperate. A failed transponder, one switched off, or bad intent makes the aircraft invisible to ADS-B but not to primary radar.
- Safety use needs certified accuracy, timing and integrity alarms. Phone location drifts, lags and stops without warning.
- Cell networks are built for the ground. At cruise altitude, phone coverage is patchy.

It also doesn't touch the copper problem. GNSS positions still have to reach the control facility over the same kind of link.

## What a downstream data chain should do

Commerce, freight and logistics systems don't run on the FAA's internal network. They read commercial ADS-B aggregators, carrier messages and FAA SWIM feeds. An upstream outage reaches them as silence, gaps or a late burst of data, not as wrong values. The [Global Unit Data Loads](GLOBAL-UNIT-DATA-LOADS.md) spec already sets the rules; here is how they map to the same pairing idea.

| Upstream risk | Paired fix in the data chain | Spec rule |
|---|---|---|
| One feed provider goes quiet | Take air positions from at least two providers, with different receiver networks | [ISO data in UTF-8: air row](GLOBAL-UNIT-DATA-LOADS.md) |
| Late or out-of-order data after an outage | Order by source time, not arrival time; accept late data | [Non-browser data chains](GLOBAL-UNIT-DATA-LOADS.md) |
| Gaps in a track | Mark the gap; never interpolate a position or infer arrival | store-and-forward rule |
| Silence read as status | A quiet feed never clears an ETA, a delay flag or a shipment status | air legacy network rule |
| A burst after reconnection | Queue it (Cloudflare Queues), process each message idempotently by device ID, sequence and source time | idempotency rule |
| Spoofed or wrong positions | Cross-check providers; disagreements beyond a set distance are held for review | security table |

## The same pattern in 2000s commerce stacks

The FAA case is extreme, but the shape is familiar from the same era of enterprise systems: broadband-era streaming platforms, SAP ECC, nightly EDI batches over leased lines, and T1 or MPLS links to warehouses.

| FAA | Commerce equivalent | Paired short-term fix |
|---|---|---|
| copper circuit between facilities | leased line or VPN between ERP and WMS | a second path through the edge (Cloudflare) with signed requests |
| old computers can't take fiber speed | ECC or the WMS can't take event-rate updates | buffer at the edge and send at the rate the old system can take; keep its interfaces unchanged |
| same 50-year data architecture | the same batch file sent over a faster pipe | a canonical record in a system of record (Xano) beside the ERP, read by every new surface |
| radar plus ADS-B | ERP plus Shopify/marketplace events | reconcile two sources; flag disagreements instead of trusting either one |
| backup on the same route | backup on the same cloud region or vendor | a second provider or region for the paths that can't stop |

"Pulling copper up and putting fiber down" without changing the data architecture is the same as a lift-and-shift migration: the line is faster, and the bottleneck moves to the endpoint.

## Open questions

- [ ] Which ADS-B and flight-data providers does the fo1 air leg use, and do they draw on different receiver networks?
- [ ] Do any warehouses or carriers in the chain still depend on a single leased line or MPLS circuit?
- [ ] What's the confirmed date and cause of the Northeast ground stop linked to the Philadelphia TRACON cable?

## Sources

- GAO-26-107992 report and summary (September 2026)
- Holland & Knight: Brand New Air Traffic Control System, state of play
- AIN: surface radars and 67% fiber; Rocheleau on the ATC overhaul
- Washington Examiner: overhaul gains ground
- Mexico Business News: revamp progresses
- KVIA / CNN: $12.5 billion down payment
- CBS58 / CNN: FAA equipment issues
- Flying Magazine: Newark 90-second radar outage
- Philadelphia Inquirer: Philadelphia ATC
- AeroCorner: failed circuit and cut backup cable
- Barchart / AP: redundant aviation safety net
- Yahoo / CNN: inside the Newark meltdown
- Airways Magazine: Northeast ground stops
- RFC 4553 (SAToP) and RFC 5086 (CESoPSN): TDM over packet networks
- EUROCONTROL ASTERIX (categories 048 and 062)
- ONVIF (video management interoperability)
- PMTiles and COPC specifications
- Apple HTTP Live Streaming (RFC 8216); MPEG-DASH (ISO/IEC 23009-1)
- Reuters: aging air traffic control system, Compaq computers and parts bought on eBay
- FAA: floppy disk phase-out from air traffic control facilities by 2028 (as reported by Fox and GV Wire, November 2026)
- HBO statements on the HBO GO outage during the Game of Thrones season 4 premiere (April 2014)
- Microsoft: estimate of Windows devices affected by the CrowdStrike update (July 2024)
- CrowdStrike: preliminary post-incident review (July 2024)
- US DOT: investigation of Delta's recovery after the July 2024 outage
- AWS: summary of the Amazon DynamoDB service disruption in us-east-1 (October 2025)
- Microsoft Azure: post-incident review, Azure Front Door (October 2025)
- Cloudflare: outage on November 18, 2025 (post-mortem)
- Google Cloud: incident report for the June 12, 2025 Service Control outage
