---
title: "CRM Sync — Where Your Code Runs Is a Business Decision"
description: "What you are actually buying when you choose a runtime: VMs, containers and isolates priced by what they cost per customer and what they put at risk. Why WASM and Rust changed the question, and why the runtime became a data governance decision the moment AI started writing and running the code."
canonical: https://persephonepunch.github.io/crm-sync-setup/where-code-runs.html
category: "Security"
date: 2026-08-17
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/docs/WHERE-CODE-RUNS.md
---

# Where Your Code Runs Is a Business Decision

**Version:** 1.1
**Date:** 2026-08-17
**For:** The person who signs off on the stack and is accountable for what it holds.

> **The runtime is the smallest unit of blast radius you can buy.**
> Every control you pay for above it — encryption, policy, audit — assumes the code stayed inside the box it was given. You are choosing the box.

---

## What you are actually buying

Every option is answering one question: **when two workloads share a machine, what stops one from reaching the other?**

There are three answers on the market, and they price very differently.

| | You are paying for | Per customer | Ready in |
|---|---|---|---|
| **Virtual machine** | A whole operating system, per workload | Gigabytes | Tens of seconds |
| **Container** | A share of one operating system | Megabytes | Milliseconds |
| **Isolate** | A slice of memory, no operating system at all | Kilobytes | Instantly |

That is not a technical table. It is a cost-per-customer table, and it decides whether serving one more tenant is a rounding error or a line item.

**Virtual machines** give every customer their own machine. You can say that to an auditor and it will hold. You will also license, patch and monitor an operating system for each one, and you will keep them running before demand arrives, because something that takes ninety seconds to start cannot answer a spike.

**Containers** put many customers on one operating system. You get density, portability and speed, and you take on the consequence: **they share a kernel, so they share a fate.** When a kernel flaw is found, it is not one customer's problem. Patching that kernel is now a permanent obligation with a named owner and a response time.

**Isolates** give each request a slice of memory inside a running process. There is no operating system underneath to license, patch or breach.

---

## Three things an isolate does not have, and what each one saves you

This is where the commercial case sits, and none of it is about speed.

**No disk.** Not a locked-down one — none. There is no path to write a credential to, nothing left behind after a request, nothing to scan, and no copy of customer data sitting outside the system that governs customer data. The most common way data ends up somewhere it should not be is that something wrote a file. That cannot happen here.

**No operating system.** The whole category of attack that container escape belongs to needs an operating system underneath to escape into. Take it away and the category goes with it — along with the patch cycle, the CVE watch and the person who owns both.

**Nothing granted by default.** Code reaches only what it was explicitly handed. On a conventional server, code can reach anything the server can reach and your protection is that it chose not to.

**What you give up, plainly:** anything that genuinely needs a machine. Long-running processes, local files, arbitrary binaries, GPU work. That work still needs a machine, and you should still buy one for it.

---

## Two models of trust, and why the default decides the outcome

The same question one layer up: **what can this code reach unless somebody stops it?**

**Node and Bun** hand your application everything, and hand every library you install exactly the same powers. A package can read files, open connections and start processes, and at runtime it is indistinguishable from code your own team wrote. That is the trade for the fastest development ecosystem in existence, and for most of twenty years it was a good trade.

The exposure is not exotic. A large dependency tree plus inherited authority is how supply-chain compromise happens, and the number of dependencies only goes up.

**WebAssembly and Rust** invert it. A module starts with nothing and receives only the capabilities it is explicitly given. It cannot open a file unless someone handed it a way to open files. Rust adds a compiler that prevents the specific bug classes behind most critical vulnerabilities, rather than trusting a reviewer to catch them.

> **Node asks you to take powers away. WASM asks you to give them.**

Defaults decide outcomes, because the default is what happens on the busy day when nobody had time to review the change. Starting from nothing fails safe. Starting from everything fails open.

---

## Secrets: why a file in a repository is the wrong shape

Almost every stack starts the same way — credentials in a `.env` file, committed or nearly committed, copied into CI, pasted into a chat when a colleague is stuck. It works, until it doesn't, and the reason it fails is worth stating precisely.

**A file in a repository is copied by design.** Every clone is another copy. Every fork, every CI runner, every laptop, every backup. You cannot revoke a copy you do not know about, and you cannot count them. The failure is not that someone was careless; it is that the format's whole purpose is duplication, and you are using it to hold the one thing that must not duplicate.

The second failure is quieter: a credential in version control is in the **history**, not just the working tree. Removing it in a later commit does not remove it. It is still in the diff, still in every clone taken before the fix, and still readable by anyone who ever had access.

### What a secret store changes

**Business definition:** the credential stops being a file that copies and becomes a value the system holds.

- **One copy, and no person holds it.** It is written once and never displayed again. No dashboard shows it, no log prints it, no support process can retrieve it.
- **Revocable centrally.** One action ends its use everywhere, immediately, without a deploy or a hunt for copies.
- **Rotatable without touching code.** The value changes; the code that reads it does not.
- **Absent from the diff.** Nothing to leak in a pull request, because nothing about it is in the repository at all.

Cloudflare and Vault both deliver that, by different routes. **Cloudflare pushes**: the value is written into the runtime at deploy and read as an environment value — it never travels again, and there is no token an attacker could steal to fetch it. **Vault pulls**: the application asks at runtime, holding a token, and policy decides. Vault's model is more flexible and needs a policy to be safe; Cloudflare's is narrower and safe by construction.

**Utility use case:** a contractor finishes an engagement. With credentials in a repository you are auditing clones, rotating everything they might have touched, and hoping. With a secret store you revoke one key, and the ledger shows what it did while it was valid.

### The hazard the command line reintroduces

A secret store does not help if the value passes through a terminal. Vault's most-copied documented form puts the secret directly on the command line:

```
vault kv put secret/app api_key=REAL_VALUE       ← now in shell history and scrollback
```

Both tools have safe forms — piping, stdin, `@file` — but the default is what people copy, and shell history, terminal scrollback and screen shares are all real disclosure paths. **Treat any command containing a live credential as a disclosure**, including one you intend to paste later and forget.

---

## Key ceremony: the control banks use, and why it applies here

The riskiest moment in a credential's life is not while it is stored. It is the moment it **exists in the open** — being generated, being loaded, being rotated. Encryption protects it before and after. Nothing protects it during, except procedure.

**Business definition:** a key ceremony is a scripted, witnessed procedure for creating or rotating a key, arranged so that no single person is ever in a position to take it.

This is not a software convention. It comes from payments and cryptography, where the stakes forced it early:

- **Banking and card payments** — loading keys into hardware security modules is done under **split knowledge and dual control**: the key is assembled from components held by separate custodians, and no one custodian can reconstruct it. PCI's key-management requirements mandate exactly this for manual clear-text key operations.
- **Certificate authorities** — a root signing ceremony is scripted in advance, performed by named officers, witnessed, and recorded. The root key of a public CA is created once, in a room, on camera.
- **DNS** — the DNSSEC root key ceremony is held in public, filmed, and published, precisely so that no participant has to be trusted individually.

The common thread is not paranoia about the algorithm. It is that **the algorithm was never the weak point** — the person holding the key at the moment it existed was.

**What it buys you commercially:** the ability to answer "who could have taken this?" with *nobody, and here is the record*. That is a different answer from "we trust our team," and it is the one that survives an audit, an incident review or a due-diligence question.

**Utility use case:** a platform key needs rotating. One person prepares the change and verifies the result but never touches the value. Another executes the privileged write. The secret appears in no transcript, no log and no chat. Afterwards the ledger shows a key changed, when, and by which fingerprint — and there is no copy of the old value anywhere for anyone to find.

**What it costs:** coordination. Two people and a written procedure, for an operation that one person could technically do alone in a minute. That cost is the control. A ceremony one person can complete unaccompanied is not a ceremony — it is a habit.

---

## Why the practice that worked last year stopped working

Start from what already works, because it does work.

**A restricted server, role-based access and human supervision is a good control.** It has protected serious systems for decades and it is not obsolete. But it rests on four assumptions, and they are load-bearing:

- **Rate** — a person acts at human speed, so supervision can happen *while* it happens
- **Enumerable actions** — someone in a role does a knowable set of things; you granted the role because you could picture the work
- **Stable intent** — a person's actions follow a plan you can ask them about, and they are the same person before and after reading a document
- **Accountability** — the subject has a name, a contract and consequences, and that backing does more work than the permission model does

### What generated code breaks

**Rate.** An agent takes thousands of actions before anyone looks. Review after the fact is not supervision, it is forensics — you cannot intervene in something that has finished.

**Enumerable actions.** The agent composes its next action from the result of the last one. The action set is not knowable in advance because it is being written at runtime. You granted a role; the behaviour inside that role is now open-ended.

**Stable intent.** This one has no human equivalent. An employee does not change objective because a customer record contained a sentence instructing them to. An agent processing untrusted content can have its instructions rewritten *by the data it was asked to handle*. Role-based access assumes the subject's intent originates with the subject.

**Accountability.** The agent runs as a service account, or as the user. The access model sees one authorised subject performing permitted operations — and it is correct, every individual action is permitted. The harm is in the **sequence**, and a role has no concept of a sequence.

### Why a filesystem compounds it

File permissions grant access to **paths**, which is coarse in two directions. Read access to a directory covers everything in it, including what lands there tomorrow. And a filesystem **persists** — something written now is readable later by anything holding the path, including the next run and any process nobody audited.

The realistic failure requires no violation at all. An agent with legitimate read access writes an intermediate file — a cache, an export, a debug dump — into a location a more broadly readable process can see. No rule was broken. The data moved anyway.

On a runtime with no disk, that sequence has no first step.

### The distinction underneath

> **Role-based access answers *who is acting*. Capability answers *what this code can reach at all*.**

For a person, "who" is a sound proxy for "what will happen", because a human is bounded by judgment and consequence as well as by permission. For generated code that proxy has nothing behind it. It will do whatever the next generated instruction says, inside its permissions, at machine rate.

### Where the older model is still right

**A restricted server with role-based access remains sufficient when:**

- volume is low enough for a person to stay in the loop **per action**, not per batch
- the code paths are deterministic and were reviewed before they ran
- the process never reads untrusted input — no customer text, no web content, no uploaded documents

Hold all three and the established practice is fine, and cheaper. It is the third that usually fails first, because the reason to deploy an agent at all is to have it read things nobody has time to read.

### Why this is the hardest part to hear

This is not a story about people being careless. **It is a story about expertise depreciating.**

The practice was correct. It was correct last year. The engineers who hold it most firmly are usually the ones who learned it most thoroughly — who can explain why least privilege matters, who have configured it properly, who have been right about it in every previous argument. Their confidence is earned.

What changed is not the quality of the practice but the shape of the actor it was designed for. Every assumption above was safe when the subject was a person or a program a person wrote and reviewed. None of them was ever written down as an assumption, because none of them needed to be.

That is the difficult part commercially. The risk is not the team that does not know. It is the team that knows very well, is applying a control correctly, and has no signal that the ground moved — because nothing failed, no alert fired, and the practice still looks exactly as sound as it did when it was.

**The only durable answer is a check that asks rather than a convention that is remembered.** A runtime with no disk does not require anyone to have kept up. A capability that must be granted does not depend on someone recalling that the assumptions changed.

---

## Provision and package are not the same word

One word does three jobs. Conflating them puts a customer's laptop in the same column as your storage, and it produces the wrong answer to the only question a buyer actually asks: *what does it cost to add one more customer?*

### Provisioning a resource

**Business definition:** buying capacity on your side of the line, before anyone uses it.

**What it costs:** on a traditional stack, this is where the money goes — servers sized, networks drawn, licences counted, capacity bought ahead of demand and paid for whether it arrives or not. On an edge stack you are creating a namespace rather than a machine: nothing runs while idle, there is no capacity to size, and the bill follows use rather than intent.

**Utility use case:** a manufacturer needs EU firmware records held separately from US ones for residency reasons. You create a second storage bucket and point the EU tenants at it. On the old model that is a procurement conversation and a lead time. Here it is one command, and the cost starts when the first file lands.

### Provisioning a tenant

**Business definition:** the step between *sold* and *serving*.

**What it costs:** minutes of one person's attention, not infrastructure. Nothing is created in a cloud — a customer is written into a register: their configuration, the key only they hold, the pointer to their own data instance, their domain on the login screen.

**Utility use case:** a merchant buys on Tuesday. By Wednesday they have their own key, their records in their own workspace, and their brand on the sign-in page. Nobody sized anything, nobody waited for a provisioning queue, and no engineer was scheduled. **This is the number that decides whether a business can serve a long tail** — if adding a customer means standing up infrastructure, the tail is uneconomic no matter how good the product is.

### Packaging

**Business definition:** delivering the application to someone else's device.

**What it costs:** a build and a distribution channel — an installer, a store listing, a signing certificate, an update path. It runs in the opposite direction from the other two: provisioning prepares your side to serve, packaging hands something to their side to use.

**Utility use case:** a compliance officer wants the configurator open all day without a browser tab and without a login every morning. You wrap the same web app as a desktop application and hand them an installer. Nothing changed on your side — no new resource, no new tenant. One artifact, delivered.

| | Direction | What it costs | Triggered by |
|---|---|---|---|
| **Provision a resource** | your side, prepared to serve | metered by use; nothing while idle | a new data class, region or storage need |
| **Provision a tenant** | your register, a customer added | minutes, once | a sale |
| **Package** | their device, an app delivered | a build and a distribution channel | a request for how they want to use it |

The distinction earns its keep the moment someone asks what onboarding costs. If provisioning a customer means infrastructure, the answer is a capacity conversation and a lead time. If it means writing a row and minting a key, the answer is minutes — and the gap between those two answers is most of why one business can profitably serve small customers and another cannot.

---

## What each tool was built to solve

Each of these solved a real problem and is good at it. The confusion is usually about which problem is being solved.

| | The problem it solves | What you get | What it costs you |
|---|---|---|---|
| **Vagrant** | Every developer building their own environment from a README | One identical starting point, shared as a file | Identical only at the start. Anything fixed inside a machine, and not written back into the shared file, is invisible to everyone and lost on rebuild |
| **Docker** | Shipping the environment with the application, and fitting more work per server | Portability and density | A shared kernel, a disk in every container, and a patch obligation that never ends |
| **Kubernetes / Nomad** | Keeping many copies alive, placed well and replaced when they fail | Scheduling, health, resilience | An operating discipline. The scheduler is now a system you run, staff and upgrade |
| **Node / Bun** | Building and shipping quickly, with a library for everything | Unmatched speed and ecosystem | Every dependency inherits your application's powers |
| **WASM / Rust** | Running code whose author you do not control | A boundary you can describe, and memory safety the compiler enforces | A smaller ecosystem, a harder language, and real work to grant each capability |
| **Isolates** | Serving many customers per request without buying an operating system for each | No cold start, no per-customer OS, no disk, no kernel | No long-running processes, no local files, no machine work |
| **Local dev on the same runtime** | Local results that actually predict production | The production runtime on your laptop | Data behaviour still differs locally; timing and consistency only show up against the real thing |

---

## How to decide

**Buy virtual machines** when the work is long-running or stateful, needs specialised hardware, or when someone has asked for machine-level separation in writing. Expect to pay for the operating systems that make that true.

**Buy containers** when you have a fleet and a team to run it. Budget the kernel patching as a standing cost with a named owner, because that is the price of the density.

**Buy isolates** when the work is request-shaped — an interface, an API, an agent doing one thing — and you have many customers. You give up the machine and get an environment with nothing to leak onto and nothing to break out of, at a per-customer cost small enough to stop managing.

**Buy WASM and Rust** for the specific job of running code you did not write. That is an increasingly accurate description of AI-generated code, and it is why the choice is on the agenda now rather than in five years.

The sentence worth keeping, whichever way you go:

> **Encryption protects data while it is stored. Capability protects it while it is used. The runtime decides whether the second one is a promise or a property.**

---

## Related

- [Keys to the Castle with Design Ops Tools](./keys-to-the-castle-design-ops.html) — the same argument applied to the tooling around the runtime
- [Minting Gated Assets](./minting-gated-assets.html) — capability applied to a file rather than a request
