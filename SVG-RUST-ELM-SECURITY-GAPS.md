---
title: "SVG, Rust and Elm: the security gaps illustration"
description: "One diagram that follows a single SVG file from source to base64 to the browser, through an Elm client, TLS, Cloudflare, Xano and a Rust service, two TLS pipelines, JVM, iPaaS and Wasm stacks, and VM, Docker and Kubernetes isolation — with 31 numbered gaps and their fixes, a second illustration of browser, machine and agent callers, the assumptions that break as a system adds commerce, goes global and becomes AI-legible, and a list of known foot guns."
canonical: https://persephonepunch.github.io/crm-sync-setup/svg-rust-elm-security-gaps.html
category: "Security"
date: 2026-10-13
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SVG-RUST-ELM-SECURITY-GAPS.md
licence: CC-BY-4.0
ogImage: https://persephonepunch.github.io/crm-sync-setup/og/svg-rust-elm-security-gaps.png
ogImageAlt: "SVG, Rust and Elm: the security gaps. Three panels: an SVG holding patient metadata and a cookie-stealing script, which never runs through img but runs when inlined; Rust code where a consent grant moved into one send cannot be reused; and Elm, where views are pure and ports are the only exit to JavaScript, but the browser is still untrusted."
tags:
  - security
  - architecture
  - consent
keywords:
  - SVG
  - base64
  - data URI
  - Rust ownership
  - Elm
  - WebAssembly
  - Shopify Functions
  - machine code
  - bare metal
  - no_std
  - TLS
  - CORS
  - Cloudflare Full (strict)
  - Next.js hydration
  - Consent Mode v2
  - idempotency key
  - MuleSoft
  - Salesforce Commerce Cloud
  - SAP
  - Celigo
  - Magento
  - Kubernetes Secrets
  - confidential VM
  - PCI DSS
  - PHI
  - prompt injection
  - excessive agency
  - MCP token passthrough
  - AP2 mandate
  - foot gun
about:
  - Data security for PII, PCI and PHI
  - SVG and base64 encoding
  - Rust and Elm language guarantees
  - Runtime and container isolation
alternativeHeadline: "Encoding is not a security boundary — and neither is a compiler, a sandbox or TLS on its own"
---

# SVG, Rust and Elm: the security gaps illustration

**For architects, CISOs and developers who need one picture of where PII, card data and PHI are actually exposed.**

> Base64 changes how data is written, not who can read it. Compiling changes what code can do.
> TLS protects the wire, not the endpoints. Sandboxes limit reach, not readership.
> **Only encryption, server-side authorization and contracts decide who can read the data.**

---

## From cron to agents: who binds the systems, and where security has to live

Before APIs, data mostly stayed inside one cloud or one data center. When it had to move, a developer wrote an EDI or ETL mapping, someone reviewed it, and a cron job ran it — nightly, or every 15 minutes. **The binding between systems happened at build time**, and security lived at the perimeter, on the SFTP server and in the reviewed mapping.

APIs and iPaaS (integration platform as a service: hosted tools such as MuleSoft, Celigo or Boomi that connect one system's API to another's) moved the binding to **event time**: every order or update travels on its own, in seconds, through integration code. Security moved into API keys, scopes and signed webhooks.

AI agents move it to **runtime**. A model decides, per request, which systems to connect and what data to move — and the same model can be steered by anything it reads. So AI now does much of the *binding* between systems. It must not do the *security*. If the thing that chooses the connection also decides what is allowed, the security is only as strong as the model's resistance to a well-phrased instruction.

![From cron to agents. Three lanes. Cron EDI and ETL: an ERP's batch file waits in an SFTP drop folder until a cron job runs a reviewed mapping into a warehouse or storefront. APIs and iPaaS: a Shopify order becomes a signed webhook that an iPaaS or Worker flow maps and forwards to the ERP, CRM and Google Merchant within seconds. AI agents: a person asks an agent for an outcome; the agent proposes, and a deterministic gate checks the user and agent identity, a signed mandate and a tool allowlist, writes every decision to a ledger, and only then reaches Shopify, Xano, Google Merchant or SAP. Four cards show where security has to live: the data, the identity, the authority and the gate. A table compares the three eras.](https://persephonepunch.github.io/crm-sync-setup/assets/cron-to-agents.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/cron-to-agents.svg) (1600 × 1090) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/cron-to-agents.pdf) · [JPG](https://persephonepunch.github.io/crm-sync-setup/assets/cron-to-agents.jpg).*

| Era | Who binds the systems | When | Where security lived | What fails |
| --- | --- | --- | --- | --- |
| Cron EDI / ETL | A developer's mapping, reviewed | On a schedule | The perimeter, SFTP, the mapping | Plaintext batch files (gap 31), stale data |
| APIs and iPaaS | Integration code or iPaaS flows | Per event, in real time | API keys, scopes, signed webhooks | Broad keys (M1), middleware copies (gaps 18, 28) |
| AI agents | A model, choosing at runtime | Per request, on the fly | Outside the model: a deterministic gate | Injection (A1), excessive agency (A2), token passthrough (A3) |

Security can no longer ride along with the binding. It has to attach to four things the model can't rewrite:

1. **The data.** Consent state is a field on every record, and a record without it is refused, whoever asks (M3, gap 20).
2. **The identity.** The user *and* the agent are each identified, and every token is scoped to one tool's audience (A3).
3. **The authority.** A signed mandate carries the amount, merchant, expiry and a one-time nonce, and it is checked on every call (A4).
4. **The gate.** Deterministic code at the endpoint says yes or no, and writes every grant and denial to an append-only ledger (A7).

**The model proposes. Deterministic systems decide. Every grant and denial is recorded.** The rest of this article maps where that breaks today, from a single SVG file to SAP.

## The security gaps illustration

![The full illustration, top to bottom: one SVG with a hidden script and patient metadata, the same file as a base64 data URI, and the three ways a page can display it; definitions of base64, compile, machine code and bare metal; what each layer checks and misses from an Elm client through TLS, Cloudflare, Xano and a Rust service; TLS hops in Next.js hydration and a CRM-to-Shopify data bus; JVM, iPaaS and Wasm stacks compared on isolation, network access, memory safety, supply chain, patching, Consent Mode v2 and idempotency; VM, Docker and Kubernetes isolation and transport; and 31 numbered security gaps, each with a fix.](https://persephonepunch.github.io/crm-sync-setup/assets/svg-rust-elm-security-gaps.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/svg-rust-elm-security-gaps.svg) (1600 × 4290) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/svg-rust-elm-security-gaps.pdf) (233 KB, one vector page) · [JPG](https://persephonepunch.github.io/crm-sync-setup/assets/svg-rust-elm-security-gaps.jpg). The diagram is shown here as an image, never inlined, so its SVG cannot run code on this page — gap 3, applied to itself.*

## How to read it

| Mark | Meaning |
| --- | --- |
| Solid box | Data passes through and a control holds |
| Dashed box | A gap: data is stored, cached or exposed there, or code can run |
| Dashed circle with a number | One of the 31 gaps listed at the bottom of the diagram and below |
| Dashed arrow | Traffic that is plaintext by default (between Kubernetes pods) |
| Grey arrow labeled TLS | One TLS session; the data is decrypted in the box at each end |
| "decrypts here" | Inside this box the data is plaintext, whatever the arrows say |

The diagram reads top to bottom in seven bands:

1. **One SVG, three ways in.** The source holds a hidden `<script>` and patient details in `<metadata>`. Base64 turns it into a `data:` URI without changing any of it. Display decides whether the script runs: never through `<img>`, always when inlined or loaded in `<object>` or `<iframe>`.
2. **Four words that get confused.** Base64 is an encoding. A compile translates source into a different program. Machine code is what the CPU runs, and it disassembles. Bare metal is code with no operating system underneath, so a memory bug there owns the device.
3. **The request path.** Six boxes from the Elm client to a Rust service, each split into what it checks and what it doesn't.
4. **TLS protects each hop, not the data.** Lane A: a Next.js server render followed by client-side hydration. Lane B: a CRM-to-Shopify data bus.
5. **Same data, three stacks.** Lane C is JVM middleware (Salesforce, MuleSoft, Salesforce Commerce Cloud). Lane D is an iPaaS chain (SAP, Azure, Celigo, Magento). Lane E is Wasm (Shopify Functions, Cloudflare Workers). A table compares them on isolation, network access, memory safety, supply chain, patching, Consent Mode v2 and idempotency.
6. **Isolation and transport.** Where the wall sits in a virtual machine, a Docker container and a Kubernetes cluster, and how data crosses it.
7. **The gaps.** All 31, each with its fix.

## SVG: a picture, or a program

An SVG is XML. Besides shapes it can carry `<script>`, `onload=` handlers, `<foreignObject>` with embedded HTML, outside references, and text and metadata that hold names and IDs. Base64 keeps every one of those, about a third larger, and hides `<script` from any filter that only reads text.

`<img src>` renders in the browser's image sandbox: no script, no outside references, no DOM. Inlining promotes the file to a node in your document, where script runs. [Safe SVG for Webflow and UIkit](https://persephonepunch.github.io/crm-sync-setup/safe-svg.html) shows how to keep stylable, animatable SVG without spending that sandbox: an allow-list sanitizer, then inline. For anything an uploader supplied, display it with `<img>`, send `Content-Security-Policy: sandbox` on `.svg` responses, and serve uploads from a separate asset domain.

Treat an exported chart as the data it shows. An SVG of patient results is PHI, wherever it is cached or shared — the same point [What Survives the Transform](https://persephonepunch.github.io/crm-sync-setup/what-survives-the-transform.html) makes about XMP inside media files.

## Rust: ownership as access control

Rust appears three times in the diagram. Each idea maps to a chapter of [The Rust Book](https://doc.rust-lang.org/book/):

- **The Rust service** at the end of the request path. A `ConsentGrant` is moved into the function that sends data out, so one consent cannot cover two exports ([ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)). A reporting function that takes `&PatientRecord` cannot change it; only `&mut` can, and only one at a time ([references and borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)). A `Pii<T>` wrapper whose `Debug` prints `[REDACTED]` and which does not implement `Serialize` cannot reach a log line or a JSON response. And with no [`unsafe`](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html), whole classes of memory bugs are ruled out.
- **Bare metal.** [`#![no_std]`](https://docs.rust-embedded.org/book/intro/no-std.html) firmware, where memory safety is the only wall. [Firmware Asset Publishing](https://persephonepunch.github.io/crm-sync-setup/firmware-asset-publishing.html) covers the publishing side.
- **The Shopify Function** in lane E: [Rust compiled to Wasm](https://shopify.dev/docs/apps/build/functions/programming-languages/rust-for-functions), with no network access. Gap 22 covers the host imports that remain.

```rust
pub fn send_to_ads(data: Pii<Email>, grant: ConsentGrant) -> Result<(), Error> { /* … */ }

let grant = consent::verify(&req)?;   // the only way to get one
send_to_ads(email, grant)?;
send_to_ads(other_email, grant)?;     // compile error: use of moved value `grant`
```

The limit is printed on the Rust box: **types force a check to happen; they cannot prove the check is the right one.**

### Where memory gets managed: compile time, not runtime

A common mental model is that Rust compiles to bytecode and a runtime manages its memory, the way the JVM does. Neither is true, and that is the point of Rust. **The JVM manages memory at runtime; Rust proves it at compile time.**

![Where memory gets managed. Five pipelines split by a line between build time and run time. Rust: the compiler and borrow checker prove each memory access and insert each free, then ship native machine code that runs with no runtime manager. Rust to Wasm: the same proof, shipped as a Wasm module that V8 or Wasmtime compiles at load and walls off, still with no garbage collector. Java and Kotlin: javac ships bytecode, and the JVM's JIT and garbage collector manage memory while running. Elm and TypeScript: compiled to JavaScript, with V8's garbage collector at runtime. C: machine code with no ownership check, and memory freed by hand. Three cards draw the security consequences.](https://persephonepunch.github.io/crm-sync-setup/assets/memory-compile-vs-runtime.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/memory-compile-vs-runtime.svg) (1600 × 820) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/memory-compile-vs-runtime.pdf) · [JPG](https://persephonepunch.github.io/crm-sync-setup/assets/memory-compile-vs-runtime.jpg). The black tag marks where memory is managed in each pipeline.*

| Language | What the compiler produces | Becomes machine code | Who frees memory | When safety is checked |
| --- | --- | --- | --- | --- |
| C | Machine code | At build time | You (`malloc` / `free`) | Never: bugs become exploits |
| Rust | Machine code | At build time | Compiler-inserted [drops](https://doc.rust-lang.org/book/ch15-03-drop.html), decided by ownership | At compile time; only bounds checks run |
| Java / Kotlin (JVM) | Bytecode | While running (JIT) | A garbage collector | At runtime |
| C# / .NET | IL bytecode | While running (JIT) | A garbage collector | At runtime |
| JavaScript / TypeScript | JavaScript | While running, in V8 | A garbage collector | At runtime |
| Elm | JavaScript | While running, in V8 | JavaScript's garbage collector | Types at compile time; memory at runtime |
| Rust to Wasm | A Wasm module (portable bytecode) | When the host loads it | Rust's ownership, inside the host's memory wall | Compile time, plus the host's sandbox |

Rust to Wasm is the one case with bytecode, and even there nothing manages memory at runtime: the host only puts a wall around the module's memory.

Three consequences for security:

- **No runtime to patch, but you rebuild.** A JVM security fix can ship as a runtime update. A Rust fix means recompiling and redeploying the binary.
- **Secrets can be wiped.** Rust frees memory at a known point, so [`zeroize`](https://docs.rs/zeroize/latest/zeroize/) can overwrite a key when it goes out of scope. JVM Strings can't be changed and the garbage collector may copy them, so a secret can't be reliably erased (gap 19).
- **Nothing to escape, except `unsafe`.** The compile-time proof holds everywhere except inside `unsafe` blocks — the first thing to search for in a Rust review.

**Is a garbage collector like Redis or a cache?** Only in that both decide when something is removed. A garbage collector reclaims memory **inside one process**, and only what nothing refers to any more, so it never removes something in use. A cache such as Redis or Workers KV is **a separate store of copies**, shared across processes, that removes entries by policy (expiry, least recently used) even if someone will ask for them again. Neither one erases securely: memory freed by a garbage collector keeps its bytes until it is reused, and an expired cache entry may survive in snapshots and replicas. A cache is also one more copy of the data — sessions and PII in a cache need [the same access controls](https://redis.io/docs/latest/operate/oss_and_stack/management/security/) as the database (gaps 6 and 11).

## Elm: no hidden side effects

Elm is the first box of the request path. Functions are pure, so a view that renders patient data cannot send it anywhere. Opaque types decide in one module what any screen may show. [Ports](https://guide.elm-lang.org/interop/ports.html) are the only exit to JavaScript, which gives you one list to audit, and Elm packages cannot contain JavaScript.

The box's "does not" side is gap 8. The browser is untrusted: anyone can edit the compiled JavaScript or call the API directly. Elm protects your users from your own bugs, not your server from attackers — the same split the [Dark Factory article](https://persephonepunch.github.io/crm-sync-setup/book/dark-factory-entitlement-security/#one-architecture-two-trust-models-elm-iced-and-webflow-xano) draws between the Elm Architecture and Webflow + Xano. Every rule has to be enforced again in the Worker or Xano.

## Wasm, containers and VMs limit reach, not readership

A Wasm module gets its own linear memory and can only call what its host gives it. A Worker runs in its own V8 isolate. A container shares the host kernel; a VM brings its own. Each is a wall around what code can *reach*. None decides who can *read* the data inside it. [Where Your Code Runs Is a Business Decision](https://persephonepunch.github.io/crm-sync-setup/where-code-runs.html) prices the same options by cost and risk.

Two container facts tie straight back to band 1. [Kubernetes Secrets are base64](https://kubernetes.io/docs/concepts/configuration/secret/) in etcd until you [turn on encryption at rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/) — gap 24 is gap 1 again. And pod-to-pod traffic is plaintext by default until a [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) and mTLS or WireGuard say otherwise.

## Gap index and fixes

Where each numbered circle appears, and the control that closes it.

| # | Gap | Where it appears | Fix |
| --- | --- | --- | --- |
| 1 | Base64 is not encryption | Band 1, base64 data URI | Encrypt or tokenize; never base64 a secret, key, token or card number |
| 2 | Encoding hides payloads from filters | Band 1; Cloudflare edge | Decode first, then sanitize |
| 3 | SVG executes when inlined | Band 1; Xano; Magento (lane D) | Display with `<img>`; CSP sandbox; a separate asset domain |
| 4 | CORS is not access control | Cloudflare edge | Server-side authorization per record; deny by default |
| 5 | The edge sees plaintext | TLS; Cloudflare edge; TLS Full (strict) | [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/); a BAA before PHI; field encryption |
| 6 | Logs keep what they're sent | Xano; lanes A and B | Scrub fields or disable body logging; redacting types |
| 7 | SVG carries data, not just pixels | Band 1, metadata and `<img>` | Strip metadata; classify an export as the data it shows |
| 8 | The client is untrusted | Browser · Elm | Enforce every rule again on the server |
| 9 | Compiled is not hidden | Machine code definition | Secrets stay server-side; ship only scoped, short-lived tokens |
| 10 | Hydration ships data into the page | Browser hydrates (lane A) | Pass only what the screen needs; fetch PII after consent |
| 11 | Shared caches mix customers | CDN · edge (lane A) | `Cache-Control: private, no-store` on personalized routes |
| 12 | Server fetch runs before consent | Browser request; Next server (lane A) | Gate server fetches on the consent cookie ([Consent Resolution](https://persephonepunch.github.io/crm-sync-setup/consent-resolution-pattern.html)) |
| 13 | `NEXT_PUBLIC_` compiles into the bundle | Next server (lane A) | Secrets server-only; scan the built bundle in CI |
| 14 | TLS is hop by hop on a data bus | Cloudflare Worker (lane B) | Sign messages; encrypt fields end to end; mTLS |
| 15 | Unverified or replayed webhooks | Shopify webhook back (lane B) | Verify the HMAC on the raw body; reject stale events |
| 16 | Queue rows outlive the message | Queue · webhook table (lane B) | Store IDs, not payloads; purge processed rows |
| 17 | Admin tokens at the edge | Cloudflare Worker (lane B) | Least-privilege scopes, short lifetimes, rotation ([Shopify Token Management](https://persephonepunch.github.io/crm-sync-setup/shopify-token-management.html)) |
| 18 | Middleware sees everything | MuleSoft; SFCC (lane C) | Mask fields in transforms; turn off payload logging |
| 19 | The JVM has no in-process sandbox | Salesforce core; SFCC (lane C) | Isolate services; scan dependencies; patch fast ([JEP 411](https://openjdk.org/jeps/411)) |
| 20 | Consent isn't carried with the event | Google Merchant (lanes C, E); Customer Privacy API (lane E) | Attach [Consent Mode v2](https://developers.google.com/tag-platform/security/guides/consent) state at capture; drop when denied |
| 21 | Retries duplicate writes | Google Merchant (C, E); Azure (D); Worker (E) | One idempotency key per event; [duplicate detection](https://learn.microsoft.com/en-us/azure/service-bus-messaging/duplicate-detection); upsert on stable IDs |
| 22 | Wasm host imports are the door | Shopify Function (lane E) | Grant the fewest imports possible |
| 23 | Containers share the kernel | Docker panel | Non-root, dropped capabilities, seccomp; a VM for untrusted code |
| 24 | Kubernetes Secrets are base64 | Kubernetes panel, etcd | etcd encryption with a KMS provider, or an external vault |
| 25 | Pod traffic is plaintext by default | Kubernetes panel, arrow between nodes | Default-deny NetworkPolicy; mTLS or WireGuard |
| 26 | Secrets baked into images | Docker panel | [Build secrets](https://docs.docker.com/build/building/secrets/); image scanning; inject at runtime |
| 27 | The host can read VM memory | Virtual machine panel | Confidential VMs (AMD SEV-SNP, Intel TDX); keys in an HSM or KMS |
| 28 | The iPaaS keeps copies | Celigo (lane D) | Mask fields in the flow; short retention; confirm region and DPA |
| 29 | Integration credentials are too broad | SAP S/4HANA (lane D) | Least privilege per interface; managed identity; rotation |
| 30 | Checkout JavaScript gets skimmed | Magento (lane D) | Patch; CSP and Subresource Integrity; PCI DSS 4.0 script inventory |
| 31 | Batch files sit in plaintext | SAP S/4HANA (lane D) | PGP-encrypt; delete after pickup; prefer APIs or queues |

## Browser, machine and agent: three callers, one endpoint

The same Worker or Xano endpoint is called by three kinds of caller, and each one fails differently. A **browser** is a person whose code you can't trust. A **machine** is code with no person behind it. An **agent** is code choosing what to do for a person who isn't watching.

![Browser vs Machine vs Agent. Three caller cards: a browser (a person and every script on the page, proving identity with a session cookie, consent as a banner choice, limited by same-origin policy, CSP, SameSite cookies and CORS); a machine (a service account with no person behind it, proving identity with an API key, HMAC or mTLS, carrying consent only as data, limited by scopes and network policy); and an agent (a model choosing tools for a user, proving identity with a delegated token and a signed mandate, limited by a tool allowlist, mandate check, budget and approval). Arrows meet at one endpoint that must ask which kind of caller it is. A table compares failure, replay, leaks, consent and audit. A band traces assumptions from a JVM that never leaves the VM through commerce, global and AI-legible stages. Seventeen lettered gaps have fixes.](https://persephonepunch.github.io/crm-sync-setup/assets/browser-machine-agent-gaps.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/browser-machine-agent-gaps.svg) (1600 × 2022) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/browser-machine-agent-gaps.pdf) · [JPG](https://persephonepunch.github.io/crm-sync-setup/assets/browser-machine-agent-gaps.jpg). Gaps here are lettered: B for browser, M for machine, A for agent.*

The endpoint's first question is **which kind of caller is this?** One rule for all three fails all three:

| Caller | The endpoint requires |
| --- | --- |
| Browser | A user session, CSRF protection, and server-side authorization per record |
| Machine | A verified signature or mTLS, a narrow scope, and an idempotency key |
| Agent | The user **and** the agent identified, a valid mandate, an allowed tool, and an audit entry |

| Gap | Fix |
| --- | --- |
| B1 Client checks are suggestions | Authorize every request on the server, per record |
| B2 Third-party tags see the page | CSP, [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity), a script inventory (PCI DSS 6.4.3) |
| B3 Tokens readable by XSS | [HttpOnly, Secure, SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies); nothing in `localStorage` |
| B4 Tags fire before consent | Consent Mode default denied; load tags after the choice |
| B5 Hydration ships data | Pass only what the screen shows; fetch PII after consent |
| M1 Keys too broad, too long | Least-privilege scopes, short lifetimes, rotation |
| M2 No person in the loop | Act as a named service, log it, cap what it can change |
| M3 Consent drops out | Carry consent state as a field; refuse records without it |
| M4 Replays duplicate writes | [Verify the HMAC on the raw body](https://shopify.dev/docs/apps/build/webhooks/subscribe/https); one idempotency key per event |
| M5 Payloads persist | Store IDs, not payloads; purge queues; scrub logs |
| A1 [Prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | Treat fetched content as data; approve side effects outside the model |
| A2 [Excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) | One narrow tool per task; read and write as separate tools |
| A3 Token passthrough | Audience-bound tokens per tool; never forward the user's token ([MCP security best practices](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)) |
| A4 Mandate replay or drift | Sign amount, merchant, expiry and nonce ([AP2](https://ap2-protocol.org/)); check every call |
| A5 Exfiltration by tool | Egress allowlist; no raw-URL tools; filter outputs for PII |
| A6 Retries double-spend | An idempotency key on every side-effecting tool call |
| A7 No record of why | Log user, agent, mandate, tool and inputs to an append-only ledger |

## Assumptions that break as you grow

A JVM that never leaves its VM can get away with assumptions that stop holding one stage at a time. Each stage keeps every problem from the stages before it.

| Assumption | A JVM that never leaves the VM | When you add commerce | When you go global | When you add LLMs: AI-legible |
| --- | --- | --- | --- | --- |
| Trust boundary | The VM is the wall; inside is trusted | Payments, tax and tag scripts run outside it | Clouds and regions multiply the walls | Your content is input to someone else's model |
| Identity | One app, one user table, one session store | Customers, guests, staff, payment tokens | Local logins and age rules per market | An agent acts for a user: identify both |
| Where data lives | In the heap and one database | Card data enters PCI scope; webhooks leave | Residency: where each copy lives is a legal question | Prompts, embeddings and model logs are new copies |
| Consent | Not modeled: the app owns its data | Marketing consent and order data diverge | GDPR, CPRA, PIPA, CASL: the defaults differ | Training and retrieval each need their own yes |
| Time and money | One clock, one currency, one locale | Retries and refunds need idempotency keys | Currencies, tax, FX, time zones, languages | An agent can spend: a mandate with amount and expiry |
| Failure | An exception stays in the log | A failure can charge twice or lose an order | One region down mustn't take the others | A plausible wrong answer looks like success |
| Audit asks | Who logged in? | Who paid, refunded or changed a price? | Which law applied, and where did the data go? | Which user, agent, mandate and source? |
| Readable by | Your own team | Auditors, the PCI assessor, payment partners | Regulators in every market | Crawlers, answer engines and agents |

The last column is the one teams plan least for. Making a system legible to AI — structured data, `llms.txt`, clean JSON-LD, Markdown descriptors — is how answer engines and agents find and recommend it. The same legibility makes it readable, quotable and steerable by every model that fetches it, so anything an agent can read is something an attacker can phrase as an instruction (A1).

## VM, container or managed database — and the storage wrappers

Where the database runs decides who patches it, where its data sits, and which wall you are relying on. In every case the **app points to the database**: connections start at the app, and the database never connects back to it.

```
Hardware (cloud host)
└─ Hypervisor                       ← the wall between VMs
   └─ VM: guest OS (its own kernel)
      └─ Database process
         └─ Data files ─── on an attached virtual disk (EBS, Persistent Disk, Managed Disks)
```

| | VM | Container | Managed database |
| --- | --- | --- | --- |
| **What it holds** | Its own OS kernel, plus whatever you install | The app process and its libraries; it shares the host's kernel | You never see the machine; you get an address or an API |
| **Where the data lives** | On an attached virtual disk you can detach, snapshot and reattach | On a mounted persistent volume, or it disappears with the container | Provider storage, with backups and replicas included |
| **Who patches the OS and engine** | You | You patch the image; the platform patches the node | The provider |
| **The wall** | The hypervisor (gap 27) | One shared kernel (gap 23) | The provider's tenancy, plus your access settings |
| **What you still secure** | Disk and snapshot encryption, the database port, the OS | Image secrets (gap 26), pod traffic (gap 25), Secrets (gap 24) | Who can reach it, with which credential, and whether anything is public |

A managed service moves the operating system and the patching to the provider. **It does not move the access model.** Keys, IAM bindings, bucket policies and public toggles stay yours — that is the shared responsibility line, and almost every public data leak sits on your side of it.

### Container, Docker, Kubernetes, and a container in the cloud

Four words, four different layers. They are easy to blur because they usually appear together.

| Layer | What it is | Analogy |
| --- | --- | --- |
| **Container** | The thing itself: an app and its libraries packaged as an [OCI image](https://opencontainers.org/), run as an isolated process that shares the host's kernel | A shipping container |
| **Docker** | A tool that builds images from a `Dockerfile` and runs containers on **one machine** | The crane and packing crew at one dock |
| **Kubernetes** | An [orchestrator](https://kubernetes.io/docs/concepts/overview/): runs many containers across **many machines**, restarts and scales them, networks them, and stores their config and Secrets. It doesn't build images | The port's scheduling system across every dock |
| **A container in the cloud** | Someone else runs the machines. You hand over an image | Renting space in a port someone else operates |

The same image runs under all of them. Build it once with Docker, and it can run on a laptop, in a Kubernetes cluster or on a cloud service unchanged.

"A container in the cloud" comes in three amounts of control:

| You want | Use | You manage | The provider manages |
| --- | --- | --- | --- |
| Kubernetes, without running its control plane | Managed Kubernetes: AWS EKS, Google GKE, Azure AKS | Your Kubernetes objects, node settings, network policy, Secrets | The control plane, and usually node patching |
| Just run this image, no cluster | Serverless containers: AWS [Fargate](https://aws.amazon.com/fargate/) and App Runner, Google [Cloud Run](https://cloud.google.com/run/docs/overview/what-is-cloud-run), Azure [Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/overview) | The image, its settings, who may call it | Machines, scaling, patching |
| A container next to a Worker | [Cloudflare Containers](https://developers.cloudflare.com/containers/), started and addressed from a Worker | The image and the Worker that fronts it | Machines, placement, scaling |

A **Cloudflare Worker is not a container**. It is a V8 isolate: lighter, starting in milliseconds, with no filesystem and no kernel of its own. That is why the Worker sits in front and a container is reached only through it, when you need a full Linux process.

Security follows the layer, not the brand. The image carries its own risks wherever it runs (secrets baked into layers, gap 26). Kubernetes adds cluster risks (Secrets as base64, gap 24; plaintext pod traffic, gap 25). A serverless container service removes the cluster risks but keeps the image risks and your access settings.

### Kubernetes Secrets and SVG bundles: the same wrapper

A Kubernetes Secret and an SVG that embeds images as `data:` URIs use base64 for the same reason: to carry bytes inside a text format (YAML for one, XML for the other). In both, anyone who gets the text can decode it in one line, and a scanner that only reads text sees nothing but the encoded string.

![Kubernetes Secret vs SVG bundle. Left: Secret YAML with a base64 password is stored in etcd as base64 unless encryption at rest is on, read through the API server where RBAC decides who may get or list it, and mounted into a pod decoded; committed to Git, the base64 stays in history. Right: an SVG embeds patient metadata and a base64 nested SVG carrying an onload handler; the browser decodes it and either draws it through img with no script, or, inlined, runs the outer file's script on your origin; anyone with the file decodes every embedded byte. A table compares the two, and three cards give the shared lesson.](https://persephonepunch.github.io/crm-sync-setup/assets/k8s-secret-vs-svg.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/k8s-secret-vs-svg.svg) (1600 × 960) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/k8s-secret-vs-svg.pdf) · [JPG](https://persephonepunch.github.io/crm-sync-setup/assets/k8s-secret-vs-svg.jpg).*

They differ in one way that matters: **only the Kubernetes Secret can be locked.** The cluster puts RBAC in front of it and can encrypt it in etcd with a KMS provider. An SVG has no lock to turn on — once the file is shipped, its bytes *are* its contents. And only the SVG can execute: an inlined outer SVG runs its script, while a nested SVG loaded through `<img>` or `<image>` is drawn as a picture.

The shared lesson:

- **Decode before you scan** (gap 2). Secret scanners must decode `data:` values; SVG sanitizers must open nested data URIs before judging them.
- **Keep secrets out of both** (gap 1). A Secret YAML committed to Git and an SVG with an embedded payload leak the same way: to everyone who gets the file.
- **Only one has a lock** (gaps 24 and 7). Turn on RBAC and etcd encryption for Secrets. For SVG, carry nothing private at all — no patient labels, no IDs in `<metadata>`.

### The wrappers, by provider

| Service | What it is | How you reach it | Public by default? | Encryption at rest | Classic foot gun |
| --- | --- | --- | --- | --- | --- |
| [Cloudflare D1](https://developers.cloudflare.com/d1/) | Serverless SQLite | A Worker binding; a REST API with an account token | No | Yes | An account-wide API token used where a binding would do |
| [Cloudflare KV](https://developers.cloudflare.com/kv/) | Global key-value, cached at the edge | A Worker binding | No | Yes | Eventually consistent: wrong for idempotency or counters (gap 21) |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | S3-compatible object storage | A Worker binding, S3 API keys, presigned URLs | No, until you enable [public access](https://developers.cloudflare.com/r2/buckets/public-buckets/) | [Yes](https://developers.cloudflare.com/r2/reference/data-security/) | Public access is per bucket: one bucket mixing public and private files exposes both |
| [Durable Objects](https://developers.cloudflare.com/durable-objects/) | A single, strongly consistent instance with its own storage | Only through a Worker | No | Yes | Putting a per-user object's ID somewhere a stranger can guess it |
| [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) | A connection pool to your existing Postgres or MySQL | A Worker binding | — | Credentials held by Cloudflare | Forgetting the database behind it still needs TLS and its own allowlist |
| AWS S3 | Object storage | IAM, bucket policies, presigned URLs | No: [Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html) is on for new buckets | Yes, by default | A bucket policy with `"Principal": "*"` |
| AWS RDS | Managed Postgres, MySQL, SQL Server and others | A host name and a database user, or IAM auth | Only if "publicly accessible" is set | [Chosen at creation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html); can't be switched on later in place | "Publicly accessible" plus an open security group |
| AWS DynamoDB | Managed key-value and document | IAM | No | Yes, by default | IAM policies with `dynamodb:*` on `*` |
| GCP Cloud Storage | Object storage | IAM, signed URLs | No, with [public access prevention](https://cloud.google.com/storage/docs/public-access-prevention) | Yes, by default | Granting [`allAuthenticatedUsers`](https://cloud.google.com/iam/docs/principals-overview): that means any Google account, not your users |
| GCP Cloud SQL | Managed Postgres, MySQL, SQL Server | Private IP, the Cloud SQL Auth Proxy, or IAM auth | Only with a public IP and authorized networks | Yes, by default | Authorizing `0.0.0.0/0` to reach a public IP |
| GCP Firestore / BigQuery | Managed document store / warehouse | IAM | No | Yes, by default | A dataset shared too broadly, or exported to a public bucket |
| Azure Blob Storage | Object storage | Entra ID roles, account keys, SAS tokens | No: [anonymous access](https://learn.microsoft.com/en-us/azure/storage/blobs/anonymous-read-access-prevent) is off by default on new accounts | [Yes, by default](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption) | [Account keys](https://learn.microsoft.com/en-us/azure/storage/common/shared-key-authorization-prevent) grant everything; long-lived SAS tokens leak |
| Azure SQL / Cosmos DB | Managed relational / multi-model | Entra ID or keys, private endpoints | Depends on network settings | Yes, by default | A primary key embedded in an app instead of Entra ID |
| Xano | A managed backend: database plus API | Xano's API with a token; never the database port | No | Managed by Xano | An endpoint left without auth or per-record checks (gap 4) |

"Encrypted at rest by default" means the provider's disks are encrypted. It does not mean your data is hidden from anyone who holds a valid key, token or IAM role — and those are what leak. For PII, card data and PHI, keep the access model narrow, prefer identity-based access over long-lived keys, and encrypt sensitive fields yourself where the provider would otherwise see them.

## Known foot guns

A **foot gun** is a feature, API or default that makes it unusually easy to shoot yourself in the foot: a perfectly natural-looking use causes the bug, outage or leak. The blame lands on the design, because the design invites the mistake. The remedy is the same every time: **make the safe path the default, and make the dangerous path explicit and loud** — the way Rust spells it `unsafe` and React spells it `dangerouslySetInnerHTML`.

| Foot gun | What happens | Instead |
| --- | --- | --- |
| `el.innerHTML = svgFromCms` (or `{{ html \| safe }}`) | An uploaded SVG's `<script>` runs on your origin (gap 3) | `<img src>`, or sanitize first ([Safe SVG](https://persephonepunch.github.io/crm-sync-setup/safe-svg.html)) |
| `atob()` called "decrypt" | Anyone reverses it; the secret was never hidden (gap 1) | Real encryption, or a token that means nothing on its own |
| Cloudflare SSL mode **Flexible** | Plain HTTP from the edge to your origin (gap 5) | Full (strict) |
| Reflecting the request's `Origin` with `Access-Control-Allow-Credentials: true` | Any site can make credentialed reads of your API. (Browsers already refuse `*` with credentials; echoing the origin bypasses that.) | An explicit origin allowlist; CORS is not authorization (gap 4) |
| A secret in a `NEXT_PUBLIC_` variable | Compiled into every visitor's JavaScript (gap 13) | Server-only variables; scan the bundle in CI |
| A Kubernetes Secret YAML in Git | base64 in history forever (gap 24) | Sealed or external secrets; etcd encryption |
| `docker build --build-arg API_KEY=…` | The key lives in the image history (gap 26) | `docker build --secret` |
| `console.log(req.body)` in a Worker, or body logging in Xano | Every payload copied into logs (gap 6) | Log IDs and outcomes, never bodies |
| Verifying a webhook HMAC on re-serialized JSON | Valid webhooks fail, so someone turns verification off (M4) | Verify on the raw body, then parse |
| Workers KV as the idempotency store | [Eventually consistent](https://developers.cloudflare.com/kv/concepts/how-kv-works/): two retries both see "not seen yet" (gap 21) | A Durable Object or a database unique constraint |
| `#[derive(Debug, Serialize)]` on a struct holding PII | PII prints in logs and ships in JSON | A `Pii<T>` wrapper with a redacting `Debug` and no `Serialize` |
| `unsafe` in a file parser "for speed" | One malformed upload corrupts memory | Safe Rust; measure before reaching for `unsafe` |
| An Elm port that sends the whole model to JavaScript | Every field crosses into code Elm can't protect | Ports that carry only the fields the JS needs |
| Consent Mode with defaults left at `granted` | Tags collect before the visitor chooses (B4) | Default `denied`; update after the choice |
| An agent tool that fetches any URL it is given | Prompt injection turns it into an exfiltration channel (A5) | An allowlisted fetch, or no fetch tool at all |
| Forwarding the user's OAuth token to a tool or MCP server | Token passthrough: the tool can act as the user anywhere (A3) | A token issued for that tool's audience only |
| A service account with `SAP_ALL` or full Shopify Admin scopes | One leaked key is the whole ERP or store (gap 29) | One narrow credential per interface |
| One R2, S3 or Blob bucket for both public and private files | Making the public files public exposes the private ones too | One bucket per audience |
| Granting `allAuthenticatedUsers` on GCP | Any Google account on the internet can read it | Name your own users, groups or service accounts |
| An Azure storage account key in app config | Full control of the whole account if it leaks | Entra ID roles and managed identity; disable shared-key auth |
| RDS "publicly accessible" with a wide security group | The database port answers the internet | Private subnets; reach it through the app or a proxy |

## Related

- [Safe SVG for Webflow and UIkit](https://persephonepunch.github.io/crm-sync-setup/safe-svg.html) — inline SVG without inheriting the upload's privileges
- [GUIs when you still ship JavaScript](https://persephonepunch.github.io/crm-sync-setup/gui-options-js-to-machine-code.html) — Webflow, Elm, Javy, Tauri and Rust down to machine code
- [Dark Factory Entitlement Security](https://persephonepunch.github.io/crm-sync-setup/dark-factory-entitlement-security.html) — one architecture, two trust models
- [Where Your Code Runs Is a Business Decision](https://persephonepunch.github.io/crm-sync-setup/where-code-runs.html) — VMs, containers and isolates
- [What Survives the Transform](https://persephonepunch.github.io/crm-sync-setup/what-survives-the-transform.html) — metadata, re-encodes and where media should live
- Also published on the game11ty reference site: [SVG/Rust/Elm: The Security Gaps Illustration](https://persephonepunch.github.io/game11ty/svg-rust-elm/) and [Machine Code/Rust/WASM, SVG/Native, Server/Client](https://persephonepunch.github.io/game11ty/machine-code-rust-wasm/)
