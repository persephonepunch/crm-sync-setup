# Dark Factory Entitlement Security

**Status:** Living reference · **Scope:** Where the vulnerability actually lives in modern business operations — IoT firmware, game platforms, 3D/BIM assets — and the entitlement architecture that survives it. Written from production experience shipping commerce on Roblox/Shopify rails and 3D asset pipelines against PIM/BIM systems.

**Tags:** [#CRA](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act) · [#Art-14 — 11 September 2026](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) · #firmware · [#CRA-checklist](https://www.crm-sync.dev/pages/pim-sync#cra-checklist)

---

## The setup: why we don't use Flash

Every era has a technology everyone uses, everyone distrusts, and everyone keeps using anyway — until the day it becomes indefensible. Flash was the canonical case: a content format that was secretly a runtime. Every SWF file was a program wearing a document costume, so every place a Flash file could land — an ad slot, an email, a forum avatar — was a code-execution surface. No amount of patching fixed that, because the flaw wasn't a bug; it was the *design*. Content that executes is an attack surface by definition. Flash didn't die because HTML5 was prettier. It died because the model was unfixable.

The uncomfortable part: we never actually stopped using Flash's model. We renamed it.

- **SVG** is an image format that can carry scripts — a picture that executes. Every system that inlines untrusted SVG inherits the Flash problem.
- **XML** (and its industrial descendants, including BIM interchange formats) brings external-entity resolution — a *document* that can be made to read your filesystem or call your network.
- **PDF** ships an embedded scripting engine, launch actions, and attached files — a "read-only" format that has carried three decades of code execution. PDFs, XML, and SVG CDATA all hold the same exposure: a document class the parser must partially *run* to display.
- **CDATA + base64 *is* Flash.** A CDATA section holding a base64 blob is an opaque binary smuggled inside a document — a payload the parser cannot inspect and the consumer is expected to decode and trust. That is structurally identical to the SWF-in-a-webpage model, and it is everywhere in enterprise interchange: BIM payloads, signed-XML envelopes, "portable" report formats.
- **Self-extracting and expanding EXEs** — the standard firmware and driver delivery vehicle — are archives fused with programs, routinely carrying embedded endpoints, credentials, and unlock logic.
- **Game engine bundles** ship your assets and logic inside a runtime on hardware you will never control.

Each of these is "content that executes" or "value inside the artifact." Each is Flash with better branding. And AI just did to all of them what it does to every obscurity-based defense: reduced the cost of unpacking, tracing, and extracting from weeks of specialist effort to minutes of assisted analysis. The time tax was the security model. The time tax is gone.

## The receipts: where the vulnerability lives now

This is not a hypothetical argument. Two documented 2025 events mark the two ends of the artifact problem.

**Unity — CVE-2025-59489.** A runtime flaw (untrusted search path) affecting applications built on Unity 2017.1 and later — which is to say, a substantial fraction of every game shipped in eight years. The remediation, per [Unity's own advisory](https://unity.com/security/sept-2025-01): rebuild and redistribute every affected application. There is no server-side fix, **because the vulnerable thing is the shipped bundle itself.** One flaw in a bundled runtime replicates into millions of client-side artifacts, each needing individual rebuilding. When value and logic ship inside the artifact, so do the vulnerabilities — at 1:1 scale with your distribution success.

**Trimble Cityworks — CVE-2025-0994.** A deserialization flaw in the asset-management platform that holds the infrastructure records of local governments, utilities, and manufacturers — [actively exploited](https://www.cisa.gov/news-events/ics-advisories/icsa-25-037-04), added to CISA's Known Exploited Vulnerabilities catalog, with attackers observed delivering in-memory loaders and Cobalt Strike through it. Here the artifact problem inverts: the vulnerability lives in the **silo monolith** — one on-premises application ingesting opaque blobs, holding the entire asset graph, unjoinable by outside systems and therefore unauditable by them. The properties that make such platforms commercially entrenched — proprietary data shape, organizational depth in institutions that patch slowest — are precisely the properties that maximize blast radius.

Between those two poles sits everything a modern operation ships and stores: **IoT and device firmware** (expanding EXEs with embedded secrets), **game and metaverse distribution** (Roblox and Unity bundles carrying your product's 3D twins), **3D/BIM assets in business operations** (models locked in PIM/BIM silos, exchanged as executable-adjacent XML). The vulnerability does not live in your network perimeter. It lives in your artifacts and your silos — the two places perimeter security cannot reach.

## The dark factory raises the stakes to maximum

A lights-out facility is the limit case: no operator to click "approve," no one watching at 3 a.m., every firmware fetch and version promotion machine-to-machine by definition. Authorization *must* be a mandate — a scoped, revocable, machine-verifiable grant — because nothing else is present to hold authority. And the incumbent posture there is perimeter mythology at industrial scale: air-gaps that stopped being real a decade ago, vendor VPNs with shared credentials, firmware on USB sticks. A production line with nobody in the building is the highest blast radius in commerce, defended by the oldest assumptions in computing — while regulation is already writing the audit requirements the old model cannot produce. The [EU Cyber Resilience Act (CRA)](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act) ([Regulation (EU) 2024/2847](https://eur-lex.europa.eu/eli/reg/2024/2847/oj)) has two clocks running, and the near one is the sharp one: **from 11 September 2026, Article 14 reporting obligations apply — manufacturers must report actively exploited vulnerabilities and severe incidents to ENISA and national CSIRTs, including for products already on the EU market.** Full application — essential cybersecurity requirements, secure-update obligations, conformity assessment, CE marking — follows on 11 December 2027, alongside IEC 62443 and NIS2. Read the September obligation carefully: you cannot report active exploitation you cannot see. A vendor whose distribution model is expanding EXEs and whose audit trail is whatever the silo logged has no mechanism to *know* a vulnerability is being exploited, let alone produce the report. The reporting deadline is, quietly, an evidence-ledger mandate.

## Entitlement security: the model that survives

The architecture that survives AI-speed extraction concedes the artifact and defends the ledger. Its rules are few:

**1 · The bundle rule (absolute).** Anything shipped into a client bundle — game platform, installer, device image — is public on arrival. Design for it: masters never leave the asset system; platforms receive baked-down, watermarkable derivatives that are *meant to be losable*. Client-side asset protection is not a control; it is a delay that AI has already collected.

**2 · One grant engine, five subjects.** Every access decision is the same primitive — an entitlement: a scoped, revocable, auditable grant issued by an event. The subjects vary; the engine does not:
- an **invitation** (a person you chose),
- a **purchase** (a person who paid),
- a **commission** (a person who distributes),
- an **agent mandate** (a machine acting for one of the above — same grant, tighter dimensions: spend caps, expiry, task scope),
- a **device attestation** (hardware fetching firmware — the dark factory's subject).

A "mandate for AI agents" is not a new security category. It is permissions for machines, running on the engine you already need for people.

**3 · The envelope: searchable head, gated payload.** Wrap every distributed asset — 3D model, firmware image, document — in a plain-data envelope: a metadata head (name, version, taxonomy, provenance, license, published hash) that is inert, machine-searchable, and lands in *your* warehouse, joinable against usage, conversions, and incidents; and a payload reference that is entitlement-gated (short-lived, per-grant signed URLs). This is the direct answer to both silo failures: the head is what BIM platforms won't let you index; the gate is what executable formats never had. JSON carries no scripts; the envelope has no executable surface.

**4 · Healing encryption, per row.** The fortress model always faced a false choice: never share (the silo — unjoinable, unauditable, commercially suffocating) or export plaintext — and a shared plaintext file is a trojan horse in *both directions*: it carries your value out uncontrolled, and it returns as the opaque re-importable blob that deserialization attacks ride in on (that is the Cityworks shape). Per-row encryption dissolves the dilemma. Every asset payload gets its own key; keys are wrapped per-grant (the JWE pattern), so **possession is not access** — the ciphertext can be distributed in real time, cached anywhere, mirrored by anyone, and it remains inert. And the encryption *heals*: rotating a row key or revoking a grant re-wraps server-side without recalling a single distributed copy — the copies in the wild simply go dark at their next unwrap. A leak stops being an event you contain and becomes a key you retire. Formerly risky asset distribution — live BIM models to subcontractors, firmware to third-party integrators, 3D masters to manufacturing partners — becomes a real-time operation, because the security was never in the file.

**5 · Sign in a ceremony, publish the hashes.** Signing keys live in a controlled ceremony and never inside any artifact — a ripped bundle yields nothing mintable. Released hashes go to a transparency ledger, which makes the cheapest AI-era supply-chain attack — the lookalike installer — *detectable by anyone*. Per-copy serials give every leak an attribution.

**6 · Precision over copilots.** Where AI operates the system, it runs as a precision tool runner: a small, curated toolset for one job, where the entitlement boundary *is* the AI's capability surface — enforced at the data plane on every call, never by the prompt. A runner cannot be talked into a tool it was never granted; the injection ceiling is the grant ceiling. Every invocation writes a ledger row, which means the AI's operation *produces* the compliance evidence as a side effect.

**7 · Mini slingshots, not fortresses.** The monolith is the fortress, and the fortress is the breach: one perimeter, one blast radius, too big for anyone to audit. Build many small, grant-scoped, individually auditable services — each too small to breach interestingly, each cheap to lose and redeploy. The only monolith worth keeping is the append-only ledger, and the ledger never ships to a client.

## The leaders still lead — the bridge is the gap

None of this displaces the undisputed leaders. Siemens and Rockwell run the world's factories; their platforms are the system of record for physical operations, and that is not changing — nor should it. What has changed around them is speed and shape: **AI now moves against operational data in real time, and the leaders' functional data shape was designed for a different era** — historians, asset graphs, and proprietary interchange formats built for batch reporting and human-paced workflows, exchanged as exactly the opaque-blob documents this article opened with. Making that data addressable by fast-moving AI *without* making it the next deserialization surface is the bridge problem, and it is extra work the platforms were never designed to do themselves.

The gap has a measurable signature: **the 24-hour/15-minute inheritance.** The enterprise interchange layer still runs on scheduled windows — classic EDI moves on daily and intraday trading-partner cycles by protocol culture (files, acknowledgment windows, retransmission contracts); SAP crosses company boundaries on IDoc batch runs and nightly deltas; and even the newest CDP-class platforms from Salesforce and Adobe refresh standard segments on 12–24-hour cycles, selling "rapid" hourly tiers and streaming carve-outs as premium upgrades. That pattern is the tell: batch is not a limitation the incumbents haven't fixed — it is the amortization schedule of their architecture. Recomputing against silo-shaped storage is expensive, so the delay window is *priced*, not solved. Batch is the wrong-shape problem expressed in time — and an AI consumer asking a question *now* against yesterday's window gets a wrong answer delivered with confidence.

The full wound map and its heal are diagrammed in the companion piece — [BIM Fortress Exposure vs the Event-Socket Heal](https://crm-sync.dev/share/bim-fortress-event-socket) — drawn A+-respectful for Trimble estates: the record stays theirs; the gate and the receipts are the more.

That bridge is what the entitlement substrate is for, and it is a coexistence layer by construction: the envelope gives the leaders' functional data a searchable, inert, warehouse-joinable head without touching the system of record; healing per-row encryption lets that data move to AI consumers at real-time speed while possession stays separated from access; the grant engine scopes every AI tool-call to an entitlement boundary; and the ledger hands Insights Hub, FactoryTalk, and the auditors behind them the evidence trail regulation now demands. The substrate has no batch core to upgrade from — an event lands as a consent-stamped, grant-scoped row in the same cycle it happened in, because rows-with-grants were the unit of exchange from the start, and real-time is the default physics rather than the premium tier. The leaders keep the factory. The substrate keeps the gate and the receipts — and feeds everything back into the platforms the operation already trusts.

## The asymmetry, stated once

A flaw in a bundled runtime costs the ecosystem a global rebuild. A flaw in a silo monolith costs its deepest customers an active breach. A flaw in a grant-scoped service costs one revoked entitlement and one redeployment — and the ledger answers, with evidence, the only question that matters in the incident: *who accessed what while it was vulnerable?* That is the question neither the bundle model nor the silo model can answer today, and the one every auditor, regulator, and dark factory will be asking from here on.

*Diagram companion: [BIM Fortress Exposure vs the Event-Socket Heal](https://crm-sync.dev/share/bim-fortress-event-socket) — the fortress wound map and the heal, in two charts. Delivery-side companion: [File System Agnostic Publishing](https://www.crm-sync.dev/pages/knowledge-base#universal) covers the same architecture from the storefront direction. Setup: [CRM Sync Setup Reference](https://www.crm-sync.dev/pages/knowledge-base#setup-guide).*
