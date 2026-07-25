---
title: "SOC / SOX Application Review — AI Middleware, Reinforced Security, Data Scaling"
description: "The application-review checklist across the four IT General Control domains plus AI requirements and dependency/failover — and why the foundation holds: AI as free-to-use middleware, security reinforcement that fails closed, and data scaling on one session-keyed ledger, with SOC-aligned controls built in rather than bolted on."
canonical: https://persephonepunch.github.io/crm-sync-setup/soc-sox-app-review.html
category: "Security"
date: 2026-07-25
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SOC-SOX-APP-REVIEW.md
---
# SOC / SOX Application Review

**Status:** Living reference · **Scope:** The application-review checklist an operator or auditor can walk — IT General Controls (ITGC), AI requirements, dependency & failover — and the Operational Success Management foundation underneath it.

**Tags:** #SOC2 · #SOX · #ITGC · #AI-middleware · #failover · #separation-of-duties

---

## Three promises, one plane

- **AI as free-to-use middleware.** The AI plane costs nothing extra to adopt: no per-seat license, no platform rebuild. Agents ride the entitlements you already run — your systems stay, the AI sits beside them and answers the operational question *while it happens*.
- **Security reinforcement.** Every control fails closed. Consent, mandates, and audit are cryptographic and offline-verifiable — an outage costs throughput, never compliance. The AI does not weaken the estate; it inherits and reinforces the estate's permission model.
- **Data scaling.** One session-keyed universal ledger — orders, tax, consent, engagement — that grows by adding channels, not by re-platforming. Revenue from Shopify today; game and social channels land in the same ledger tomorrow.

SOC-aligned controls and security are **built into the data path, not bolted on** — the checklist below is walkable because the mechanisms already exist.

**Companion reading — why the big-machine rebuild is the wrong-size answer:** [The Wrong-Size Tool](https://www.crm-sync.dev/pages/knowledge-base#wrong-size-tool) walks the public escalation ladder from one ERP scoping failure to material weakness, securities litigation, and delisting. This checklist is the alternative: controls that hold *after* go-live.

*Alignment claim, stated precisely: aligned to the SOC 2 Trust Services Criteria — design-alignment, not an attestation. SOX ITGC domains are the frame external auditors test; the evidence plane here is what your signing officers draw on.*

## ITGC 1 · Access controls

*Managing who can access systems and data — provisioning, deprovisioning, periodic review.*

- ✓ Access by explicit invitation only; unique identity per human **and** per AI agent
- ✓ Deprovisioning revokes live sessions immediately (token denylist), not just future logins; agent mandates expire on their own clock
- ✓ Least privilege with separation of duties by persona — no single role designs, builds, signs off, and holds keys; reviewers never promote
- ✓ Key lifecycle: ceremony-based rotation on a fixed cadence; secrets never enter logs or transcripts
- Cadence: quarterly access recertification, read from the Agent permissions and Teams views, outcome recorded as evidence

## ITGC 2 · Change management

*Changes tested, approved, and documented before deployment.*

- ✓ Environment separation: Stage, Production, and a key-gated Deploy-Live realm
- ✓ Author, approver, and deployer are different personas — enforced by role, not policy memo
- ✓ Pre-deploy validation: deploy guards and test harnesses run before anything ships
- Cadence: promotion rides a dedicated `release:promote` capability; deploy-to-commit traceability and the break-glass procedure are part of the standing review

## ITGC 3 · IT operations

*Backup and recovery, job scheduling, incident management.*

- ✓ Scheduled jobs carry reconcile backstops; every job is idempotent and cursor-gated, so re-runs are safe by construction
- ✓ The system of record is backed up independently of the enforcement cache — the cache can be rebuilt from truth at any time
- ✓ Outage resilience is designed per dependency: writes buffer and replay when a leg recovers
- Cadence: incident runbook (detect → contain → rotate → evidence) and human alerting on control failure

## ITGC 4 · Program development / acquisition

*How new systems or major changes are developed or acquired.*

- ✓ Security requirements live in the design: consent and entitlement are enforced in the data path
- ✓ A pipeline security baseline governs dependencies and supply chain
- Acquisition is reviewed through the ERP-failure lens — the [seven documented reasons ERP implementations fail](https://www.techtarget.com/searcherp/feature/7-reasons-for-ERP-implementation-failure): unrealistic goals, wrong expertise, operational underestimation, inadequate testing, unverified vendor claims, insufficient stakeholder communication, incomplete requirements. Every one is operational; every one is answerable before commitment, not after.

## AI requirements — ITGC applied to non-human actors

- ✓ **Agent identity.** An agent is never an extension of a human session. It holds its own identity, registry entry, and credential.
- ✓ **Bounded authority.** Authority is a signed, spend-capped, expiring, scope-limited mandate — offline-verifiable against a published public key. No mandate, no money movement; a stale mandate is refused, never settled twice.
- ✓ **Human accountability.** Every agent maps to the accountable human who granted it; grants are team-scoped and revocable.
- ✓ **Consent parity.** Agents are bound by the subject's consent state exactly as trackers are. A revoke gates agent action from the next session forward.
- ✓ **Complete audit, including refusals.** Every agent call — and every denial — lands in an immutable log. Tool-call records are secret-redacted by design.
- ✓ **Constrained tool surface.** Agents act through typed, allowlisted tools; the tool contract is the permission boundary, not free-form access.
- ✓ **The inheritance principle.** An AI deployed into an estate inherits that estate's permission model. If the estate cannot answer *what did the servers do*, neither can its AI. The entitlement plane is what makes an estate AI-deployable at all — and it is free to adopt.
- Cadence: recurring adversarial vetting of agent flows (injection attempts, cap exceedance, revoked-consent purchases), with dated evidence; AI-transparency disclosures tracked alongside the CRA clock.

## Dependency & failover

- ✓ Every dependency is named, with its role and its outage behavior: access and consent **fail closed**; writes queue and reconcile; authorization verifies offline even when every leg is dark
- ✓ Reconciliation is exactly-once — replays cannot double-settle
- ✓ The anti-monolith doctrine is the standing design answer: no single vendor going dark takes the controls with it
- Cadence: per-leg outage drills with retained evidence, and a subservice-organization map recording which controls are inherited from vendor SOC 2 reports versus owned here

## The gaps this review finds in real estates

Four gaps recur in otherwise well-run estates. Each one is a *join that doesn't exist* — two systems that are individually healthy and jointly blind. This is what the review above surfaces, and what middleware closes without replacing either side.

**SAP that doesn't handle RMA.** The ERP owns the order ledger, but the return lifecycle runs somewhere else — a mailbox, a spreadsheet, a channel the ERP never sees. Refunds move money outside the system of record. *Control consequence:* revenue recognition and the completeness assertion break — the exact class of failure that becomes a material-weakness disclosure. *The join:* returns run as a tracked lifecycle whose refund lands back on the immutable order audit, keyed to the same session as the sale.

**Customer service that doesn't link to WMS.** Service makes promises — replacement shipped, return received, refund on the way — that the warehouse cannot confirm and service cannot verify. Promises without evidence. *Control consequence:* the operation attests to states it cannot prove; disputes are decided by whoever kept better notes. *The join:* the fulfillment event is the evidence — service reads the same stamped, ledgered events the warehouse writes.

**Fraud that doesn't link to CRM.** Fraud scoring sees transactions but not the person: no tenure, no consent posture, no history. Loyal customers get declined; serial abusers rotate identities beneath the threshold. *Control consequence:* the control exists but acts on incomplete data — precision failure in both directions, unmeasured. *The join:* one identity spine under every transaction, so risk decisions read the same customer record marketing and service do — and every decline is logged as a refusal, not silence.

**Consent that doesn't link to CRM.** Consent is captured at a banner and stays there. The customer record — and every downstream activation reading it — never learns about the revoke. *Control consequence:* the estate acts on data whose permission was withdrawn; the regulator's server-side question — *what did the servers do after the revoke?* — has no answer. This is the gap behind the fine tables. *The join:* consent is an event on the identity spine, enforced at the data path — a revoke gates segments, engagement, and agents from the next session forward, and the enforcement is itself in the ledger.

Four gaps, one shape: **the record exists, the join doesn't.** The wrong-size answer is replacing the systems that hold the records. The right-size answer is the station between them.

## The foundation: Operational Success Management

ERP implementations fail for operational reasons — all seven documented causes are variants of *the system only looked like it worked until operations asked it a question.* The foundation here inverts each failure mode into a standing management discipline. That is Operational Success Management: **operations is not a rollout phase that ends at cutover — it is the thing the product continuously manages, with evidence.**

| ERP failure mode | The OSM discipline | The mechanism |
| --- | --- | --- |
| Unrealistic goals | Verify against live operations before attesting | Go-live wizard: never self-attest — open a real connection |
| Wrong expertise | Architecture before implementation | The station, not another destination; human executes, agent verifies |
| Operational underestimation | Run the product on itself | The store's own consent, orders, and sessions feed its own ledger |
| Inadequate testing | The unhappy paths are the test suite | Fail-closed denials, outage replays, revoked-consent paths deliberately exercised |
| Unverified vendor claims | Every claim ships with its verification | Public-key verify on certificates and mandates; dry-run previews; verify-after-deploy gates |
| Insufficient stakeholder communication | Every stakeholder has an operational view | Choose-your-view personas — BA, QA, DPO, designer, release manager — separation of duties by design |
| Incomplete requirements | Requirements as checkable constraints | Validators and lint over one-time applies; a living gap register |

Go-live is when management starts, not when the project ends. The controls above hold afterward because the same plane that runs the business produces the evidence — in real time, on every change, in systems you own.

---

*Related: [The Wrong-Size Tool](https://www.crm-sync.dev/pages/knowledge-base#wrong-size-tool) · [Cybersecurity for AI](https://www.crm-sync.dev/pages/knowledge-base#cybersecurity-for-ai) · [Security & Compliance Posture](https://www.crm-sync.dev/pages/knowledge-base#security-posture) · Print this page for the PDF edition.*
