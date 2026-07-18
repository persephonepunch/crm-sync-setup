# BIM Fortress Exposure vs the Event-Socket Heal

**Status:** Companion diagram to [Dark Factory Entitlement Security](https://crm-sync.dev/share/dark-factory-entitlement-security) · **Scope:** One picture of where the fortress *model* bleeds — an era's architecture, not any vendor's failing — and one picture of the event-socket layer that heals each wound, feeding AI consumers in real time under entitlement boundaries.

**Read this the way it is meant:** Trimble is an A+ platform — the system of record for the physical world's assets, earned over decades. This is not "Trimble is exposed, use something else." This is "the A+ system of record is now being asked for things no silo-era architecture can be asked to provide — real-time AI addressability, warehouse-joinable evidence, plaintext-free sharing — and *you need more* is a different sentence than *you need different*." The diagrams below show the more.

---

## Diagram 1 · The exposure: the fortress holds everything, and everything leaves as plaintext

The fortress model has two doors, and both are the breach. Inbound: opaque blobs the monolith must deserialize to use — the door CVE-2025-0994 walked through ([actively exploited, CISA KEV](https://www.cisa.gov/news-events/ics-advisories/icsa-25-037-04)). Outbound: plaintext file exports to every subcontractor and partner — uncontrolled copies that carry value out and, re-imported, carry payloads back in.

```
                        THE FORTRESS (BIM / WMS / ERP silo)
                 ┌─────────────────────────────────────────────┐
   opaque blobs  │  ┌───────────────────────────────────────┐  │
  (XML/IFC/PDF/  │  │        MONOLITH  (one process,        │  │
   CDATA+base64) │  │         one perimeter, one CVE)       │  │
 ───────────────►│  │                                       │  │
  deserialized   │  │   • entire asset graph inside         │  │
  to be used ────┼──┼─► • proprietary index — unjoinable    │  │
  = RCE door     │  │   • audit = whatever the silo logs    │  │
 (CVE-2025-0994) │  └───────────────────────────────────────┘  │
                 │        │                    │               │
                 └────────┼────────────────────┼───────────────┘
                          ▼                    ▼
                 plaintext file export   batch interchange
                 to subcontractors       (EDI 24h windows,
                          │              nightly deltas,
                          ▼              15-min "real-time" tiers)
              THE TROJAN HORSE (both directions)      │
              • carries value OUT, uncontrolled       ▼
              • comes BACK as an opaque blob     AI asks "now?"
                → re-enters the RCE door         gets yesterday,
              • no revocation: a copy is         with confidence
                forever
```

Three structural wounds, none patchable: **possession equals access** (every shared file is a permanent uncontrolled copy), **the index belongs to the silo** (nothing joins your warehouse, so nothing is auditable from outside), and **cadence is priced, not solved** (batch windows are the amortization schedule of silo-shaped storage).

## Diagram 2 · The heal: the event socket, the grant engine, and AI robots on mandates

The healing architecture inverts the flow: events — an order, a scan, a consent change, a model share, a firmware fetch — land on an edge socket in the second they happen, are stamped and grant-checked once, and fan out as *rows* to the warehouse and as *grants* to consumers. In our reference deployment the commerce events are Shopify orders and the warehouse is BigQuery — but the head lands in whichever warehouse you already run; that is the point of owning the index.

```
  EVENTS (real time)          THE EVENT SOCKET (edge worker)
  order · QR scan ·        ┌──────────────────────────────────┐
  consent · model share ──►│  consent stamp · grant check     │
  · firmware fetch         │  (ONE engine, five subjects:     │
                           │   invitation / purchase /        │
                           │   commission / agent mandate /   │
                           │   device attestation)            │
                           └──────┬──────────────┬────────────┘
                    rows, same cycle       append-only
                           │               EVIDENCE LEDGER
                           ▼               "who accessed what
                  YOUR WAREHOUSE            while vulnerable?"
             (BigQuery / Snowflake /              ▲
              Databricks — joinable:              │ every unwrap,
              assets × orders × scans             │ every tool call
              × consent × incidents)              │
                           │                      │
                           ▼                      │
        ┌──────────────────────────────────┐      │
        │      THE ENVELOPE (per asset)    │      │
        │  head: searchable metadata ──► warehouse│
        │  payload: ciphertext, per-row key,      │
        │  wrapped PER GRANT — possession ≠ access│
        │  · revoke grant → copy goes dark        │
        │  · rotate key  → leak becomes a         │
        │    retired key, not a breach            │
        └────────────────┬─────────────────┘      │
                         ▼                        │
            AI ROBOTS / PRECISION TOOL RUNNERS ───┘
            curated toolset per job; the entitlement
            boundary IS the capability surface —
            injection ceiling = grant ceiling;
            every invocation writes the ledger
```

## The mapping: each wound, its heal

| Fortress wound | Event-socket heal |
| --- | --- |
| Opaque blob in → deserialization RCE | Envelope in: inert JSON head, no executable surface — nothing is run to be read |
| Plaintext export → two-way trojan horse | Ciphertext + per-grant keys: distribute in real time, possession ≠ access |
| A shared copy is forever | Healing encryption: revoke the grant or rotate the row key — copies in the wild go dark at next unwrap |
| Index owned by the silo → unjoinable, unauditable | Head lands in *your* warehouse — assets join orders, scans, consent, incidents |
| Audit = whatever the monolith logged | Append-only ledger answers the incident question with evidence, per unwrap and per tool call |
| Batch cadence (24h/15-min tiers) | Rows land in the cycle the event happened — real-time is the default physics, not a premium SKU |
| AI bolted on as a broad-context copilot | Precision tool runners under mandates — the grant ceiling is the injection ceiling |
| One perimeter, one blast radius | Mini slingshots: grant-scoped services, individually auditable; the only monolith is the ledger, and it never ships |

## For Trimble consulting teams

If you deploy, integrate, or run Cityworks and Connect estates, this is written for your practice, not against it. Your clients hold an A+ system of record — and they are starting to ask you for three things the record was never designed to produce:

1. **"Make it AI-addressable."** Their AI initiatives want to query asset data *now*, joined against operations — not through last night's export. The envelope gives every Trimble-side asset a searchable, inert metadata head in the client's own warehouse (BigQuery, Snowflake, Databricks — whichever they already run), without moving or re-platforming the record.
2. **"Let us share models without losing them."** Subcontractor workflows are structurally plaintext today. Per-grant encrypted payloads make sharing a real-time operation where possession is not access — a revoked grant goes dark; a leak becomes a retired key. That is a feature you can put in front of a client next quarter, not a migration.
3. **"Answer the auditor."** Post-KEV, every security review asks the same question: *who accessed what while it was vulnerable?* The append-only evidence ledger answers it per-unwrap and per-tool-call — the artifact CRA-era audits will demand, generated as a side effect of normal operation.

The engagement shape is deliberately small: one asset class enveloped, one warehouse join stood up, one ledger answering one auditor — beside the estate, never inside it. **No ground-up rewrite is needed — that is the point of the layer.** Compare the alternative remediation model: when Unity's runtime flaw (CVE-2025-59489) hit, the only fix was rebuilding and redistributing every application, because the vulnerability lived inside the artifacts. The socket lives *beside* the estate, so adopting it is additive — nothing existing is rebuilt, re-platformed, or taken offline. The record stays Trimble's. The gate, the receipts, and the AI-readiness become billable practice offerings on top of the platform your clients already trust. That is the "more."

## The coexistence line, one more time

The fortress keeps its job as the system of record — Trimble, the WMS, the ERP stay exactly where they are. The event socket doesn't replace them; it stands at their door: stamping, gating, enveloping, and ledgering everything that moves in or out, so the data those platforms hold becomes safely addressable by AI at the speed AI actually asks. The leaders keep the factory. The socket keeps the gate and the receipts.

*Architecture and receipts in full: [Dark Factory Entitlement Security](https://crm-sync.dev/share/dark-factory-entitlement-security) · Delivery-side companion: [File System Agnostic Publishing](https://crm-sync.dev/share/wordpress-web-components) · Setup: [CRM Sync Setup Reference](https://www.crm-sync.dev/pages/knowledge-base#setup-guide)*
