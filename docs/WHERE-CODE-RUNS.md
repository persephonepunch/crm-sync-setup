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

## Why this stopped being an engineering preference

For twenty years the runtime was a matter of taste. That ended when the code started being written and run by something other than a person.

**Your systems now execute code nobody read.** An agent composes a call, generates a transformation, runs a query, and does it a thousand times before anyone looks. The review step that used to sit between *code exists* and *code runs* is not in that path any more.

When that is true, the runtime becomes the enforcement point, because it is the last thing standing between generated code and your customers' data.

| What you will be asked | What answers it |
|---|---|
| Could this have read data it was not asked for? | Only if the runtime gave it a way to reach it |
| Could a credential have been written to disk? | Only if there is a disk |
| Could one customer's request have seen another's? | Only if they shared a kernel, or a process's memory |
| Can you show what it was *able* to do, not just what it did? | Only if capability was granted rather than assumed |

That last line is the difference between an audit trail and a guarantee, and it is the one that decides a deal. **A log tells you what happened. A boundary tells you what was possible** — and when the actor writes its own next instruction, only the second answer holds.

This is why the runtime and the permission model are one conversation. A rule saying an agent may read one record is worth exactly what the runtime does when it reaches for a second. On ambient authority, policy is advice. On a capability boundary, policy is enforcement.

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
