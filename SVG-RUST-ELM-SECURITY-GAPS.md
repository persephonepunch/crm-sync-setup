---
title: "SVG, Rust and Elm: the security gaps illustration"
description: "One diagram that follows a single SVG file from source to base64 to the browser, through an Elm client, TLS, Cloudflare, Xano and a Rust service, two TLS pipelines, JVM, iPaaS and Wasm stacks, and VM, Docker and Kubernetes isolation — with 31 numbered gaps, where each appears, and the control that closes it."
canonical: https://persephonepunch.github.io/crm-sync-setup/svg-rust-elm-security-gaps.html
category: "Security"
date: 2026-10-13
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SVG-RUST-ELM-SECURITY-GAPS.md
licence: CC-BY-4.0
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

`<img src>` renders in the browser's image sandbox: no script, no outside references, no DOM. Inlining promotes the file to a node in your document, where script runs. [Safe SVG for Webflow and UIkit](SAFE-SVG.md) shows how to keep stylable, animatable SVG without spending that sandbox: an allow-list sanitizer, then inline. For anything an uploader supplied, display it with `<img>`, send `Content-Security-Policy: sandbox` on `.svg` responses, and serve uploads from a separate asset domain.

Treat an exported chart as the data it shows. An SVG of patient results is PHI, wherever it is cached or shared — the same point [What Survives the Transform](WHAT-SURVIVES-THE-TRANSFORM.md) makes about XMP inside media files.

## Rust: ownership as access control

Rust appears three times in the diagram. Each idea maps to a chapter of [The Rust Book](https://doc.rust-lang.org/book/):

- **The Rust service** at the end of the request path. A `ConsentGrant` is moved into the function that sends data out, so one consent cannot cover two exports ([ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)). A reporting function that takes `&PatientRecord` cannot change it; only `&mut` can, and only one at a time ([references and borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)). A `Pii<T>` wrapper whose `Debug` prints `[REDACTED]` and which does not implement `Serialize` cannot reach a log line or a JSON response. And with no [`unsafe`](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html), whole classes of memory bugs are ruled out.
- **Bare metal.** [`#![no_std]`](https://docs.rust-embedded.org/book/intro/no-std.html) firmware, where memory safety is the only wall. [Firmware Asset Publishing](FIRMWARE-ASSET-PUBLISHING.md) covers the publishing side.
- **The Shopify Function** in lane E: [Rust compiled to Wasm](https://shopify.dev/docs/apps/build/functions/programming-languages/rust-for-functions), with no network access. Gap 22 covers the host imports that remain.

```rust
pub fn send_to_ads(data: Pii<Email>, grant: ConsentGrant) -> Result<(), Error> { /* … */ }

let grant = consent::verify(&req)?;   // the only way to get one
send_to_ads(email, grant)?;
send_to_ads(other_email, grant)?;     // compile error: use of moved value `grant`
```

The limit is printed on the Rust box: **types force a check to happen; they cannot prove the check is the right one.**

## Elm: no hidden side effects

Elm is the first box of the request path. Functions are pure, so a view that renders patient data cannot send it anywhere. Opaque types decide in one module what any screen may show. [Ports](https://guide.elm-lang.org/interop/ports.html) are the only exit to JavaScript, which gives you one list to audit, and Elm packages cannot contain JavaScript.

The box's "does not" side is gap 8. The browser is untrusted: anyone can edit the compiled JavaScript or call the API directly. Elm protects your users from your own bugs, not your server from attackers — the same split the [Dark Factory article](DARK-FACTORY-ENTITLEMENT-SECURITY.md#one-architecture-two-trust-models-elm-iced-and-webflow-xano) draws between the Elm Architecture and Webflow + Xano. Every rule has to be enforced again in the Worker or Xano.

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
| 12 | Server fetch runs before consent | Browser request; Next server (lane A) | Gate server fetches on the consent cookie ([Consent Resolution](CONSENT-RESOLUTION-PATTERN.md)) |
| 13 | `NEXT_PUBLIC_` compiles into the bundle | Next server (lane A) | Secrets server-only; scan the built bundle in CI |
| 14 | TLS is hop by hop on a data bus | Cloudflare Worker (lane B) | Sign messages; encrypt fields end to end; mTLS |
| 15 | Unverified or replayed webhooks | Shopify webhook back (lane B) | Verify the HMAC on the raw body; reject stale events |
| 16 | Queue rows outlive the message | Queue · webhook table (lane B) | Store IDs, not payloads; purge processed rows |
| 17 | Admin tokens at the edge | Cloudflare Worker (lane B) | Least-privilege scopes, short lifetimes, rotation ([Shopify Token Management](SHOPIFY-TOKEN-MANAGEMENT.md)) |
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

## Related

- [Safe SVG for Webflow and UIkit](SAFE-SVG.md) — inline SVG without inheriting the upload's privileges
- [GUIs when you still ship JavaScript](GUI-OPTIONS-JS-TO-MACHINE-CODE.md) — Webflow, Elm, Javy, Tauri and Rust down to machine code
- [Dark Factory Entitlement Security](DARK-FACTORY-ENTITLEMENT-SECURITY.md) — one architecture, two trust models
- [Where Your Code Runs Is a Business Decision](https://persephonepunch.github.io/crm-sync-setup/where-code-runs.html) — VMs, containers and isolates
- [What Survives the Transform](WHAT-SURVIVES-THE-TRANSFORM.md) — metadata, re-encodes and where media should live
- Also published on the game11ty reference site: [SVG/Rust/Elm: The Security Gaps Illustration](https://persephonepunch.github.io/game11ty/svg-rust-elm/) and [Machine Code/Rust/WASM, SVG/Native, Server/Client](https://persephonepunch.github.io/game11ty/machine-code-rust-wasm/)
