---
title: "QA and Release Gating for Agents, Mandates and Robots"
description: "What changes in a test suite when the caller is an AI agent or a machine with an actuator — adversarial refusal tests, mandate enforcement, a release gate that fails closed, and what Subresource Integrity actually protects."
canonical: https://persephonepunch.github.io/crm-sync-setup/qa-release-gating.html
category: "Security"
date: 2026-09-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/QA-RELEASE-GATING.md
licence: CC-BY-4.0
tags:
  - security
  - architecture
  - testing
  - agents
---

# QA and Release Gating for Agents, Mandates and Robots

**For QA leads, release managers, and whoever signs that a build may ship.**

> A test suite written for people asks *does it do what the user wanted*. A suite written for
> agents has to ask the opposite question far more often: **does it refuse what the caller had
> no authority to ask for** — and when the caller has an actuator, does it refuse *safely*.

---

## 1 · What is new, and why the old suite does not cover it

Test suites were built around two callers: a person clicking, and a process calling with a
credential. Both are slow, both are few, and both mostly ask for things they are entitled to.

The caller changed, in three ways that break those assumptions.

**Agents ask for everything.** An agent will attempt combinations a person never would, at a rate
a person never could, and it does not get discouraged. Any path that is reachable will be reached.
Coverage measured as *"the happy paths are tested"* stops meaning anything.

**Authority became a separate question from identity.** A person is who they are. An agent is
acting **for** someone, within bounds, until a moment. Authenticating the agent tells you almost
nothing — a valid identity with no valid mandate must be refused, and that refusal is now the
thing under test.

**And some agents have bodies.** A software refusal is an HTTP status. A machine refusal is a
state change in the physical world: a print head mid-layer, a valve half-closed, a floor element
at temperature, a vehicle in motion. **Refusal has to be safe, not merely correct.**

### Mandates when the actuator is physical

A mandate for a software agent carries a subject, a scope, limits and an expiry. When the agent
drives something, four more properties stop being optional:

| Property | Why it is different with an actuator |
|---|---|
| **Safe state on expiry** | A mandate ending mid-action must leave the machine somewhere survivable. "Permission lapsed" cannot mean "stopped wherever it was" |
| **Bounded physical envelope** | Not just *may it act* but *how far, how hot, how fast, how much*. A spend limit has a physical twin and it needs stating in the same artifact |
| **Local verification** | The device verifies the mandate itself, offline, because the network is not a safety dependency. Same rule as firmware signature checking |
| **Revocation the device honours** | Revoking centrally and hoping is not revocation. Either the mandate is short-lived enough that expiry *is* the revocation, or the device must confirm |

The test consequence: for anything with an actuator, **the expiry and revocation cases are safety
tests, not permission tests**, and they belong to whoever signs off on safety rather than to QA
alone.

---

## 2 · Two kinds of test, and the ratio that matters

**TDD tests** assert the system does what it should. They are the ones that get written.

**Adversarial tests** assert the system **refuses** what it should. They are the ones that get
skipped, because a passing refusal test looks like nothing happened.

For security and compliance gating the second category carries almost all the value. A useful
heuristic when reviewing a suite: **count the assertions that expect a failure.** If that number
is small relative to the whole, the suite tests the product and not its boundary.

---

## 3 · The gate mechanics

A test list is worthless without a gate that stops a release. The shape that works:

- **The gate blocks, it does not report.** A suite whose output is a report is one people learn to scroll past.
- **Known failures are named individually**, in a file, with an owner and a reason. Not a threshold, not a percentage.
- **A listed failure that starts passing is itself a failure.** Otherwise the exception list only grows.
- **A skipped critical test fails the gate.** Skipping is the most common way a suite quietly stops covering something.
- **Fix, do not list.** The exception file is for things genuinely blocked on someone else, and every entry is a small debt with a date.

---

## 4 · The list

Grouped by what each group protects. The suite names in brackets are where these live in this
estate; substitute your own.

### Permissions and entitlement `[entitlement-config · security-gates]`

- A request with **no subject** is refused, not defaulted to anonymous-with-read.
- A subject with a **valid identity and no permission** is refused.
- A permission checked on **one route** is checked on every route reaching the same resource, including exports, admin paths and machine endpoints.
- **Delegation cannot amplify.** A grantor cannot grant what it does not hold, cannot grant the granting permission, and cannot exceed its own scope.
- A **revoked subject** is refused at the next request, not at token expiry.
- **Hidden is not withheld:** a response that omits a field in the UI does not contain it in the payload. Assert on the serialized response, not the rendered output.

### Mandates and agents `[mandate-enforcement · ucp-protocol · chat-governance]`

- An agent with a **valid identity and no mandate** is refused.
- An **expired** mandate is refused, including one that expires mid-session.
- A mandate for **another subject** is refused.
- A mandate **exceeding its limit** — spend, quantity, scope, physical envelope — is refused at the limit, not after it.
- A **replayed** mandate is refused.
- A **revoked** agent is refused even holding an unexpired mandate.
- Every agent action **writes a record naming the agent, the subject it acted for, and the mandate id.**

### Consent and privacy `[consent-banner · conversion-consent · gdpr-compliance]`

- Tags and pixels **do not fire before** a choice exists.
- A **decline is recorded server-side**, and the record survives the session.
- A **broken consent tool is detectable** — the row count going to zero reads as an alarm, not as quiet.
- An **erasure request reaches every plane**, and the test asserts on each one rather than on the orchestrating call returning 200.
- Consent state is **not inferable from a cache or a CDN variant**.

### Assets and media `[embed-integrity · worker-static]`

- An uploaded file is served with the **stored** content type, never the declared one.
- `nosniff` is present **unconditionally** on any user-supplied content route.
- Anything outside the render allow-list is returned as an **attachment**.
- A **traversal filename** cannot escape its tenant prefix.
- **SVG is never inlined** from an untrusted source.
- An **archive entry** naming `../`, an absolute path or a symlink is refused before extraction.

### Supply chain and integrity `[sbom-pinning · embed-integrity]`

- Every shipped artifact has an **SBOM generated at build**, not scanned afterwards.
- A **modified artifact fails verification** — flip one byte, expect refusal.
- **Secret scanning runs against the compiled binary**, not only the source.
- **SRI hashes match the files actually served** — see the next section, including the trap.
- A **published digest** exists somewhere the serving host does not control.

### Tenancy and isolation `[tenant-isolation · project-isolation]`

- A request scoped to tenant A **cannot read** tenant B, on any route, including error messages and counts.
- A **client identifier never appears** in executable code.
- **Fixtures point at a test tenant**, never at a real one.

### Release mechanics `[js-load-order · config-envelope]`

- The deploy **records which commit it shipped**. A build that cannot say is a build nobody can roll back from with confidence.
- **Load order holds** — anything that must run before consent is known actually does.
- **Rollback is tested**, on the real target, not assumed.

---

## 5 · What SRI is, and where it bites

**Subresource Integrity** lets a page state, in the HTML, what a script or stylesheet must hash
to. The browser fetches the file, hashes it, compares, and **refuses to execute it on a
mismatch**.

```html
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>
```

**What it protects against:** a compromised CDN, a hijacked third-party host, a dependency whose
maintainer ships something different tomorrow. Anyone who can change the bytes at that URL —
without also changing your HTML — is stopped.

**What it does not protect against:** a compromise of your own origin, because an attacker who
can edit your page can edit the hash beside it. Nor does it help if the script was already
malicious when you pinned it. **SRI proves the file has not changed. It does not say the file is
safe.**

### The property that matters, and the trap

**SRI fails closed.** A mismatch means the script does not run at all. That is exactly what you
want from a security control, and exactly what makes it dangerous on the wrong file.

**Do not pin a file you regenerate.** If a script is emitted by your own build or served by a
worker, its bytes change with every deploy — and every deploy then breaks the page until the
hash is re-registered and the site republished. The control turns a routine deploy into a
release ceremony, and it fails silently on the customer's side rather than in CI.

The rule that falls out:

| Pin it | Do not pin it |
|---|---|
| Static third-party libraries at a fixed version, on someone else's CDN | Anything your worker or build generates |
| Files that change on a release you control end-to-end | Anything edited more often than it is released |

If a self-hosted script genuinely needs integrity, the better pattern is a **tiny unpinned
loader** that fetches a versioned, pinned payload — so the thing in the HTML stops changing.

**And it needs a test**, because this failure appears in production and not in CI: assert that
every `integrity` attribute in published HTML matches the hash of the file currently being
served. That check is cheap, and it is the difference between finding out in a pipeline and
finding out from a customer.

---

## 6 · Using this list

1. Read it against your suite and mark each line **covered / partial / absent**. Absent is the useful column.
2. For every absent line, write the **adversarial** case first — the one expecting refusal.
3. Put the whole thing behind a gate that **blocks**, with named exceptions carrying owners.
4. For anything with an actuator, route the expiry and revocation cases to **safety review**, not only QA.

**Download:** [`QA-RELEASE-GATING.md`](https://raw.githubusercontent.com/persephonepunch/crm-sync-setup/master/QA-RELEASE-GATING.md)
· [view rendered](https://persephonepunch.github.io/crm-sync-setup/qa-release-gating.html)
