---
title: "CRM Sync — Vault, Consul and the Config Manager"
description: "A feature map from HashiCorp Vault onto the CRM Sync config manager, and from Consul onto the Worker and its runners. Starts with the interface, because that decides who can operate any of it — and marks honestly where HashiCorp is still the right answer."
canonical: https://persephonepunch.github.io/crm-sync-setup/hashicorp-mapped.html
category: "Security"
date: 2026-08-16
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/docs/HASHICORP-MAPPED.md
---

# Vault, Consul and the Config Manager

**Version:** 1.0
**Date:** 2026-08-16
**Scope:** How HashiCorp's two governance products map onto what a designer or business analyst runs on Webflow, Xano and Cloudflare.

---

## Start with the interface

Before any feature row, the thing that decides who can hold the capability at all: **how you operate it.**

| | Interface | What that means |
|---|---|---|
| **Vault** | Command line | The `vault` binary and an HTTP API. There is a web console, but it is an *operator* console — it assumes you already know policies, engines, mount paths and lease semantics. |
| **Consul** | Code, dev only | Service definitions, intentions and proxy config are written as HCL and manifests and shipped through a pipeline. The UI observes a topology it cannot author. |
| **CRM Sync** | A browser | The configurator and the Designer Extension, on Webflow, Xano and Cloudflare. Set a policy, mint a key, revoke a grant, read the ledger — no terminal. |

This is not packaging trivia. **A control that exists only behind a CLI belongs to whoever has the CLI.** That is a real access-control decision, made accidentally, and it is why governance work queues behind a platform team that never asked for it.

The primitives are the same. The gate is who is allowed to hold them.

---

## Vault → the config manager

Vault is a secrets engine. The config manager is a propagation plane that stores secrets along the way. Close on primitives, divergent on delivery.

| Vault concept | What it is there | On Webflow / Xano / Cloudflare | Position |
|---|---|---|---|
| Barrier encryption | Every write encrypted before storage sees it | AES-256-GCM per-document envelope in KV, KEK derived with HKDF | Parity |
| Transit engine | Sign and encrypt as a service | Ed25519 signing in the Worker, public half at `/.well-known/jwks.json` | **CRM Sync** |
| KV v2 secrets | Versioned storage with rollback | One config document per tenant. Rollback comes from Xano and Webflow's ~15-minute point-in-time restore, not the blob | **Vault** |
| HCL policies | Path-based ACLs per capability | Capability grants plus field-level authority — platform-owned fields stripped from tenant writes | **Vault** |
| Auth methods | AppRole, OIDC, Kubernetes, cert, cloud IAM | Bearer keys for machines; humans carry a Xano-issued **JWE** minted per auth event, claims sealed through every hop | Different |
| Leases and TTL | Every secret renewable and revocable | Token leases with a preflight check, 600-second entitlements, 120-second asset links, optional expiry at mint | Partial |
| Audit devices | Every request logged, sensitive values HMAC'd | Hash-chained ledger in D1 where `UNIQUE(tenant, stream, prev_hash)` is the compare-and-swap — a break is detectable | **CRM Sync** |
| Namespaces | Partitions inside one cluster you operate | Ownership instead of partitioning — the customer brings their own Xano workspace, so there is no shared store to misconfigure | **CRM Sync** |
| Dynamic secrets | Creates a real downstream credential, valid for minutes | Not for downstream systems. Shopify, Xano and Google credentials are long-lived and stored, which is what the envelope protects | **Vault** |
| Unseal ceremony | Shamir quorum or KMS auto-unseal after restart | No seal state. Rotation is the ceremony, and it is two-role: the human executes the privileged write, the agent prepares and verifies | Different |

---

## Consul → the Worker and its runners

Vault maps concept by concept. Consul does not, and that is the interesting part.

Consul exists to make a **fleet** of services find each other, prove who they are and stay healthy. Most of what it does answers questions a fleet creates. Remove the fleet and those questions do not get better answers — they stop being asked.

| Consul concept | In Docker / Kubernetes | On Webflow / Xano / Cloudflare | Position |
|---|---|---|---|
| Interface | HCL, manifests, Envoy config through a pipeline | A browser. Changing who may call what is a grant on a row, not a commit and a deploy | **CRM Sync** |
| Service catalog | Services register so others can locate them | Nothing to discover — one Worker. `/stack/config` advertises the planes; agents read `/.well-known/agent-card.json` | *Collapses* |
| Health checking | Liveness and readiness probes; is the process up? | `/health`, plus `preflightTokens()` — asks whether the **credential** is still valid before a destructive job. A healthy process holding an expired token is exactly how a truncated read once read as an empty set | **CRM Sync** |
| Consul KV | Distributed key/value fronting ConfigMaps | The tenant config document, already edge-replicated — the same plane as above, not a second store | Parity |
| Connect service mesh | An Envoy sidecar per pod, mTLS between them | No sidecar, no pod-to-pod hop. Trust rides *in the call*: an Ed25519-signed mandate verified per action against a published key | Different |
| Intentions | Declarative service-to-service allow/deny | `caps.a2a` — agent-to-agent authorization as a capability grant on a row, revocable individually and immediately | **CRM Sync** |
| DNS interface | CoreDNS resolves `svc.consul` names | Worker routes. No internal service names because there are no internal services | *Collapses* |
| Multi-datacenter federation | WAN gossip joins clusters; failover to a replica | Three **independent** legs — Cloudflare, Xano, Shopify — each authoritative for a different slice. Failing over is not restoring a copy | **CRM Sync** |
| Rolling deploy | Drain, replace, wait for readiness, repeat | One artifact, one `wrangler deploy`, global in seconds. No drain because there is no instance to drain | **CRM Sync** |
| Scheduler (Nomad / K8s) | Places and restarts long-running workloads | The **runners**: an agent loop at `/mcp` executing scoped tools under a signed mandate, authorized by a row at call time and ledgered. It schedules *authority*, not processes | Different |

**Consul asks:** which instance should I talk to, and can I trust it?
**The runner asks:** is this actor allowed to do this, right now?

---

## Where HashiCorp is still the right answer

A comparison that only flatters itself is not evidence.

**Vault** — dynamic database credentials, acting as a private PKI certificate authority, SSH certificate signing, and the breadth of its secret-engine ecosystem. If you need a credential minted inside a downstream system and destroyed minutes later, that is Vault's signature feature and there is no equivalent here. Vault also wins on policy depth and on versioned rollback of the secret itself.

**Consul** — anything with a genuine fleet: stateful workloads, long-running processes, GPU jobs, services that must live in containers you control. If pods really do need to find and authenticate each other, you need a mesh, and none of the above replaces one.

The claim is narrower than displacement. For a team whose surface is a website, a catalogue and a set of agents acting on a customer's behalf, the fleet was never the shape of the problem — and the operational cost of governing one is exactly the part a designer or BA cannot carry.

---

## The three-minute version

The same argument as a film: the fortress, the distributed gold, and the keys staying in your hand.

**[Keys to the Castle](https://youtu.be/jp7sOvo1a6Y)** — 3 minutes.

The written companion, with the film embedded, is at **[crm-sync.dev/keep-the-castle](https://crm-sync.dev/keep-the-castle)**.
