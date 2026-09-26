# SOC 2 Review Checklist

As of 2026-09-26

A SOC 2 report is an auditor's opinion on your controls, measured against the AICPA Trust Services Criteria. Security (the Common Criteria, CC1 to CC9) is always in scope; Availability, Confidentiality, Processing Integrity and Privacy are added by choice. Each item below is a control the auditor will ask about, with the evidence that proves it.

## Type I and Type II

| Report | What it proves |
| --- | --- |
| Type I | Controls are designed correctly on one date. Evidence: policies, configuration, one sample of each control. |
| Type II | Controls operated throughout a period, usually 3 to 12 months. Evidence: samples drawn from across the whole period, so every recurring control needs a dated record each time it runs. |

## Before the audit: scope

*Required.* Decide what is being attested before collecting anything. Scope drift is the most common reason a first audit runs late.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | System description written: services, infrastructure, software, people, data, and the boundaries of the system | The system description the auditor will publish in section 3 of the report |
| [ ] | Criteria chosen: Security plus any of Availability, Confidentiality, Processing Integrity, Privacy | Scoping memo agreed with the auditor |
| [ ] | In-scope environments listed: production only, or production and the pipeline that deploys to it | Asset inventory with owner per system |
| [ ] | Subservice organisations named, and carved out or included (cloud host, database host, payment processor) | Vendor list with the carve-out decision per vendor |
| [ ] | Complementary user entity controls listed: what your customers must do for your controls to work | CUEC list in the system description |
| [ ] | Readiness assessment done and gaps closed before the observation period starts | Gap list with each item closed and dated |

## CC1 Control environment

*Required.* Whether the organisation takes control seriously: who is accountable, and whether people are hired, trained and held to it.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Code of conduct, acknowledged by every employee and contractor | Signed acknowledgements, dated |
| [ ] | Organisation chart and named security owner | Current org chart; role description for the security owner |
| [ ] | Background checks for people with access to production or customer data | Check completion per sampled hire |
| [ ] | Security awareness training at hire and yearly | Training completion records per sampled person |
| [ ] | Oversight: leadership reviews security at a set interval | Meeting minutes or review record per interval |

## CC2 Communication and information

*Required.* Whether people inside and outside know the rules and have a way to report problems.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Security policies published internally and reviewed yearly | Policy set with review dates and approver |
| [ ] | A way for staff and customers to report security issues | Published contact or form; sample of reports received |
| [ ] | Customers told about changes that affect their security obligations | Customer notices, terms, or status page history |

## CC3 Risk assessment

*Required.* Whether you look for what could go wrong, including fraud, and decide what to do about it.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Risk assessment at least yearly, covering fraud and changes to the business | Dated risk assessment and risk register |
| [ ] | Each risk has an owner and a treatment: accept, reduce, transfer, avoid | Risk register columns filled for every row |
| [ ] | New vendors, markets and technology trigger a risk review | Review records tied to each change |

## CC4 Monitoring activities

*Required.* Whether you check that controls still work, and fix what you find.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Controls tested internally between audits | Internal review results, dated |
| [ ] | Deficiencies tracked to closure with an owner and a date | Issue tracker entries with closure evidence |

## CC5 Control activities

*Required.* Whether written policies turn into controls that actually run.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Each policy maps to controls and each control to an owner | Control matrix |
| [ ] | Technology controls chosen to meet the risks found in CC3 | Control matrix references the risk register |

## CC6 Logical and physical access

*Required.* The largest section and where most exceptions are found. Who can reach what, and whether that is still right.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Single sign-on with multi-factor authentication for every production and admin system | Identity provider settings; MFA enforcement screenshot per system |
| [ ] | Least privilege: access granted by role, approved before it is given | Access request tickets with approval, per sampled grant |
| [ ] | Access reviews every quarter for production, admin and data systems | Signed review per quarter, with removals made |
| [ ] | Leavers lose access the same day | Leaver date versus access removal date, per sampled leaver |
| [ ] | Operator and admin pages behind an identity-aware gateway, not a shared key | Gateway policy; login log showing named users |
| [ ] | Shared and service credentials held as platform secrets, never in source code or chat | Secret store listing; repository scan result |
| [ ] | Keys rotated on a schedule and when people with access leave | Key register: fingerprint, last rotation date, who rotated it |
| [ ] | Encryption in transit (TLS) and at rest for customer data | Configuration evidence per data store |
| [ ] | Physical access to offices and devices controlled; cloud data centres covered by the provider's report | Office access log or remote-only statement; provider SOC 2 |
| [ ] | Endpoint security on staff laptops: disk encryption, screen lock, updates | Device management report |

## CC7 System operations

*Required.* Whether you notice when something goes wrong, and what you do next.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Logging on production and admin actions, kept long enough to investigate | Log retention settings; sample log entries |
| [ ] | Alerting on errors and outages that reaches a named person | Alert rules; a sample alert and its response |
| [ ] | Vulnerability scanning on a schedule, with findings fixed by severity deadline | Scan reports and fix dates |
| [ ] | Penetration test at least yearly | Test report and remediation evidence |
| [ ] | Incident response plan with roles, severity levels and customer notification | The plan, reviewed yearly |
| [ ] | Incident response tested: a real incident or a tabletop exercise | Post-incident review or exercise record |

## CC8 Change management

*Required.* Whether what runs in production is what was reviewed and tested.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Every production change is reviewed by someone other than its author | Pull request approvals, per sampled change |
| [ ] | Tests run and pass before deploy; a failing test blocks the deploy | CI run linked to each sampled change |
| [ ] | Deploys come from the reviewed main branch, not a personal branch | Deploy record showing the commit and branch |
| [ ] | Each deployed version is traceable to a commit | Version tags or deploy log mapping version to commit |
| [ ] | Separate development, staging and production, with production data kept out of development | Environment list and data handling rule |
| [ ] | Emergency changes allowed, then reviewed after the fact | Emergency change log with retrospective approval |
| [ ] | Configuration, prompts and model settings treated as code when they change production behaviour | Commit history for configuration, prompts and thresholds |

## CC9 Risk mitigation

*Required.* Whether you are ready for disruption and whether your vendors meet the same bar.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Vendor inventory with the data each vendor receives | Vendor list with data categories |
| [ ] | Each critical vendor's SOC 2 or ISO 27001 report read yearly, with its user controls met | Report on file, date read, CUEC response |
| [ ] | Data processing agreement with every vendor that touches personal data | Signed DPAs |
| [ ] | Backups taken and a restore tested | Backup schedule; restore test record |
| [ ] | Business continuity plan for losing a key vendor or person | The plan, reviewed yearly |
| [ ] | Insurance appropriate to the risks (cyber, professional liability) | Policy summary |

## A1 Availability

*Optional.* Add when customers depend on the service being up.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Uptime target stated and measured | SLA or target; uptime report |
| [ ] | Capacity monitored with a threshold that triggers action | Monitoring dashboard and threshold |
| [ ] | Disaster recovery plan with recovery time and point objectives, tested | DR test record against the stated objectives |

## C1 Confidentiality

*Optional.* Add when you hold customers' confidential business information.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Data classified, with handling rules per class | Classification policy |
| [ ] | Confidential data deleted when retention ends | Retention schedule; deletion job record |
| [ ] | Public files and pages contain no internal hostnames, keys or customer data | Search of served files, dated |

## PI1 Processing integrity

*Optional.* Add when correctness of processing is the product: payments, orders, calculations.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Inputs validated on the server, never trusted from the browser | Test showing a modified price or amount is rejected |
| [ ] | Outputs reconciled against an independent record | Reconciliation report, e.g. orders versus payment processor |
| [ ] | Errors surface visibly instead of reporting false success | Test showing a backend outage returns an error |

## P Privacy

*Optional.* Add when you process personal information. SOC 2 Privacy does not replace GDPR, PIPA or state privacy laws; map each separately.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Privacy notice published and matches what the system does | Notice; data map showing each purpose |
| [ ] | Consent recorded where required, checked on the server | Consent records with timestamp and version |
| [ ] | Access, correction and deletion requests handled within a deadline | Request log with response dates |
| [ ] | Personal data used only for the purposes stated | Data map against the notice |
| [ ] | Cross-border transfers disclosed and lawful for each market | Transfer register per country |

## AI and LLM vendors

*Optional.* Not a separate criterion. These are the questions auditors now ask under CC6, CC8, CC9, Confidentiality and Privacy when a model or AI API is in the system.

| Done | Control | Evidence |
| --- | --- | --- |
| [ ] | Each AI vendor on the vendor list, with its security report and a DPA | Vendor entry, report date, signed DPA |
| [ ] | Written answer on whether the vendor keeps or trains on your data, and for how long | Contract clause, not a marketing page |
| [ ] | Where inference runs, and whether that is lawful for each market's personal data | Region per route; transfer register |
| [ ] | A model score never decides what a person may access; authorisation stays deterministic | Architecture note naming the authorisation check |
| [ ] | An outage at the AI vendor degrades to a safe default, not to no control at all | Fallback test result |
| [ ] | Prompts, criteria and thresholds versioned and re-tested against a fixed evaluation set when changed | Evaluation results kept with each commit |
| [ ] | AI request logs keep routing and outcome, not message content | Log schema |

## What the auditor samples in a Type II

- Policy acknowledgements for sampled employees
- New hires and leavers: access granted and removed, against their dates
- Production changes: review and test proof for each
- Quarterly access reviews for the whole period
- Incident tickets and their resolution
- Vendor reports read during the period
- Backup restore records
- Training completion

## Common exceptions

| Finding | Criterion |
| --- | --- |
| MFA not enforced on an admin or operator system | CC6 |
| No access review in one or more quarters | CC6 |
| A leaver kept access for days | CC6 |
| A deploy went to production from an unreviewed or unmerged branch | CC8 |
| An outage that no alert reported; a customer noticed first | CC7 |
| No restore test during the period | CC9 / A1 |
| Vendor reports on file but never read, or out of date | CC9 |
| Incident response plan exists but was never exercised | CC7 |

SOC 2 is a US attestation. It does not show compliance with GDPR, Korea's PIPA or other national privacy laws; map those separately, market by market.
