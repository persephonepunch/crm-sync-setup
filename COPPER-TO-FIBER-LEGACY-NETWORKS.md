---
title: "Copper to Fiber: 2000s-Era Network Debt and Short-Term Paired Fixes"
description: "Why aging copper telecom lines still carry US air traffic radar data, what failed at Newark in 2025, why fiber alone doesn't fix it, and the paired, short-term fixes (diverse paths, legacy circuits over IP, radar plus ADS-B, multi-feed data chains) that cover the gap until the long rebuild lands. With what a downstream commerce or logistics data chain should do."
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
---

# Copper to Fiber: 2000s-Era Network Debt and Short-Term Paired Fixes

Nov 14, 2026 · Yoonsun Lee

**Related knowledge base:**
[Global Unit Data Loads — Data Type Management](GLOBAL-UNIT-DATA-LOADS.md) ·
[ISO data in UTF-8: space, sea, air and LiDAR](GLOBAL-UNIT-DATA-LOADS.md) ·
[Hyperscaler vs Distributed](HYPERSCALER-VS-DISTRIBUTED.md)

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
