---
title: "Hyperscaler vs Distributed: Webflow, Xano and Cloudflare Decision Ladders"
description: "Where compute should live, from hyperscalers and GPU neoclouds to edge networks. Opens with task runners, data bindings, and GPUs as a rented place (CoreWeave, Oracle OCI) versus GPU code compiled from Rust to bytecode. Then the frame-budget origin: how game engines already ration the GPU, why C and C++ renderers such as Flash and SVG parsers forced isolation that Rust and Wasm remove, how Shopify Functions already run Wasm as a security boundary inside checkout, and the Rust path for new work: a Webflow page, a Cloudflare compile and a Xano record. Then the strategy: bind before you allocate, with the cost and security case for running distributed data and AI binding before any GPU is allocated. Then incremental knowledge against general-purpose AI: evidence weighting, ranking, and falling back to a larger token model only when the ranked data can't answer. Then context and data streams that scale by direction before intent is tokenized or vectorized. Then why Kubernetes and VMs limit reach but not what a model may weigh, how AWS, Google Cloud and Azure each control data moving between workloads, what an enterprise has to add on top, and policy management as a service: rules authored in Webflow and Xano, enforced by Cloudflare above every cloud, worked through one order that reaches Salesforce and Klaviyo on AWS, SAP or Dynamics on Azure, Google Ads on Google Cloud and a Shopify Function; and one Worker behind any theme, a Webflow export or a Shopify theme through the App Proxy, with an allowlist that mirrors Kakao Pay's registered domains; a sandbox that restricts outside data before it reaches on-prem; and why an AI strategy is not a JVM: security for AI as permissions as architecture, with the stack and the heap as a model for which data and grants may outlive a call; immutable and dynamic data in KV; claims and extras as layered permissions for people; and why a one-domain consent banner such as OneTrust has to fold into the data design that AI services read. Then two decision ladders, for orchestration and for AI binding, across Webflow, Cloudflare and Xano, plus what each rung does to residency, latency, cost, audit scope and failure modes in enterprise infrastructure."
canonical: https://crm-sync.dev/docs/hyperscaler-vs-distributed
category: "Specs"
date: 2026-10-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/HYPERSCALER-VS-DISTRIBUTED.md
licence: CC-BY-4.0
ogImage: https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-og-csb.png
ogImageAlt: "Hyperscaler vs Distributed: task runners, data bindings and two kinds of GPU as challenge, solution and benefit. Jobs with no owner become one runner per path; code that can reach anything becomes bindings declared in config; GPUs rented as a cluster train at scale but the data leaves; portable GPU bytecode keeps small GPU work with the data."
tags:
  - architecture
  - edge
  - xano
  - cloudflare
  - webflow
  - ai
  - infrastructure
keywords:
  - hyperscaler vs edge network
  - CoreWeave vs Cloudflare
  - AEM Edge Functions Fastly
  - Xano data sovereignty
  - system of record data gating
  - Workers AI binding
  - decision ladder
  - AI weighting
  - retrieval ranking
  - context assembly before tokenization
  - Shopify Functions WebAssembly
  - Wasm sandbox security
  - Rust Wasm Webflow Xano
  - Workers Builds Rust
  - Kubernetes data boundary
  - AWS vs Google Cloud vs Azure data perimeter
  - policy management as a service
  - Cloudflare over hyperscalers
  - sandbox before on-prem
  - least privilege for AI
  - permissions as architecture
---
# Hyperscaler vs Distributed: Webflow, Xano and Cloudflare Decision Ladders

**For:** teams choosing where logic, data and models run when the front end is Webflow, the edge is Cloudflare and the system of record is Xano.
**Premise:** you don't pick a hyperscaler *or* an edge network. You pick, for each decision, the lowest rung that can make it correctly.
**Companions:** [The AI ladder](https://persephonepunch.github.io/crm-sync-setup/ai-ladder-escalation-and-mandates.html) for escalation and mandates; [Why Xano is the runtime as a service](https://persephonepunch.github.io/crm-sync-setup/why-xano-runtime-as-a-service.html); [Process Management Guide](https://persephonepunch.github.io/crm-sync-setup/process-management.html) for the Webflow, Xano, Cloudflare and Shopify data layer; [Render and Runtime dictionary](https://persephonepunch.github.io/crm-sync-setup/render-runtime-dictionary.html) for terms.
**Download:** diagrams as image or PDF: challenge, solution, benefit ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.pdf)) · the frame-budget origin ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-frame.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-frame.pdf)) · bind before you allocate ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.pdf)) · incremental knowledge and AI weighting ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.pdf)) · directional streams ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.pdf)) · the thread ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.pdf)) · the two ladders ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.pdf)) · the system-of-record gate ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.pdf)) · media, 3D render and the GPU ([image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.jpg), [PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.pdf)).

## Challenge, solution, benefit

![Task runners, data bindings and two kinds of GPU, in four rows. Task runner: jobs with no owner, spread across crons, webhooks and queue consumers, become one runner per path (a Worker cron and queues at the edge, Xano tasks for the record, idempotency keys), so every job has an owner, a retry policy and a log. Data binding: code that can reach any store becomes bindings declared in config (env.KV, env.DB, env.AI and one Xano endpoint), so the config is the access list. GPU as a place: scarce GPUs are rented as clusters from CoreWeave or Oracle OCI, running NVIDIA-only code such as CUDA and PTX, giving training at scale while the data leaves your boundary. GPU on the device: small GPU work sent away to a cluster becomes portable SPIR-V bytecode run through wgpu on any GPU, written in Rust or another shader language, so small GPU work stays with the data. Rows 3 and 4 split GPU work by size; they don't compete.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.svg) (1600 × 744) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-csb.pdf).*

Read each row left to right. Rows 1 and 2 decide **who may run and what it may touch**. Rows 3 and 4 decide **whether the data goes to the GPU, or the GPU code goes to the data**. They split GPU work by size rather than competing for the same job: training and large models need a rented cluster, while previews, real-time 3D and upscaling can run on the GPU the person already has. Neither row is the goal. The goal is the gate described below, and both kinds of GPU sit under it.

### Four definitions

| Term | What it is | In this stack | Where it sits on the spectrum |
|---|---|---|---|
| **Task runner** | The thing that starts a job, retries it and records the result, as opposed to the code the job runs. | Worker cron triggers and Queues for edge jobs; Xano background tasks for jobs that change the record. Each job carries an idempotency key, so a retry can't apply twice. | Either end. Run it where the data the job changes lives. |
| **Data binding** | A named handle to a resource, declared in configuration and handed to the code at runtime. The code can only reach what is bound; there is no URL or credential to copy. | Cloudflare bindings (`env.KV`, `env.DB`, `env.R2`, `env.AI`, a Durable Object namespace) in `wrangler.toml`; Xano endpoints reached through one bound service. | Edge. The binding list is the security boundary. |
| **GPU as a place** (CoreWeave, Oracle OCI) | GPUs you rent by the cluster. CoreWeave is a neocloud that sells little else; Oracle Cloud Infrastructure is a hyperscaler whose Superclusters link tens of thousands of NVIDIA GPUs over RDMA. Code for them is usually NVIDIA-only: CUDA, or PTX, which Rust can also target through Rust CUDA. | Rung 4 of the AI ladder: training, fine-tuning, self-hosted large models. | Centralized. The data travels to the GPU, so residency and egress are part of every job. |
| **GPU on the device** (portable GPU bytecode) | GPU programs compiled to SPIR-V, a portable bytecode that wgpu translates for any Vulkan, Metal or DirectX GPU. Rust (through rust-gpu) is one source language; GLSL, HLSL and WGSL also compile to it. | Kernels shipped with the application: in a native app, on your own server or, after translation to WGSL, in a browser through WebGPU. | The device, at the far distributed end, past the edge. The data stays where it already is. |

**What portable GPU bytecode does and doesn't buy.** SPIR-V is to a GPU roughly what WebAssembly is to a CPU: one compiled artifact, many targets. That makes *small* parallel work portable, such as image transforms, embeddings or physics, and lets it run on the user's own device, so the data never leaves. It doesn't make a phone into a training cluster, and three limits apply:

- **Maturity.** rust-gpu calls itself early-stage and not yet production-ready. Shader languages that already compile to SPIR-V are the safer route today.
- **Browsers take WGSL, not SPIR-V.** WebGPU in a browser accepts only WGSL, so SPIR-V has to be translated first (wgpu's naga translator does this).
- **The edge has no GPU for your code.** Cloudflare Workers run Rust as WebAssembly on CPUs. Workers AI runs Cloudflare's model catalogue on its GPUs, but you can't upload your own kernels to it. GPU bytecode belongs on the device, a server or a rented cluster, not inside a Worker.

**In business terms: SPIR-V is the `.wasm` of the GPU.** The pipeline has the same shape as the Rust-to-Wasm path below: write in a source language, compile once to a portable file, and let each platform do the last step for its own hardware.

| GPU layer | What it is | The Rust-to-Wasm parallel |
|---|---|---|
| Rust (rust-gpu), GLSL, HLSL, WGSL | The source languages teams write in | Rust or TypeScript source |
| rust-gpu, glslang, DXC, naga | The compilers | Trunk and wasm-bindgen |
| **SPIR-V** | The portable program, owned by no single vendor | The `.wasm` file |
| **wgpu** | The runtime adapter. Each time the app runs, it finds the GPU, translates the program for it, and hands it work and data | The Workers runtime, or a browser |
| Vulkan, Metal, DirectX | The platform APIs. Only Vulkan runs SPIR-V directly; for Metal and DirectX, naga translates first | The browser engines: V8, WebKit |
| **Driver** | Vendor software on the operating system. It does the final compile into the chip's own instructions | The engine's JIT compiler |
| **Firmware** | Vendor software on the chip itself, such as NVIDIA's GSP firmware and VBIOS. It schedules work, manages power and enforces memory isolation | CPU microcode and BIOS |
| **GPU** | The silicon | The CPU |

The data doesn't travel inside the program. It moves separately, into *buffers*, and the result lands in a *render target*: the frame, or viewport, the person sees. The program is the recipe; the buffers are the ingredients.

**Below every sandbox: firmware and drivers.** The bottom two software layers belong to the vendor and run beneath anything you build. wgpu's validation and Rust's memory safety protect the layers above them; a flaw in a driver or in firmware can only be fixed by a vendor patch. The NVIDIA container escape, explained in the neocloud section below, was in the Container Toolkit, not the firmware, but the lesson is the same: the fix is the vendor's to ship, and your job is to know you need it.

**The MPN: the part number that ties a GPU to its patches.** An MPN (manufacturer part number) names the exact hardware model, the same way it names a product in a PIM. On a GPU it is the join key between the physical card and everything the vendor publishes about it: which driver and firmware branches support it, which security bulletins apply, and when it reaches end of life. Vendor bulletins list affected product families and software versions, so the MPN is how you find out which of them is yours.

- **Inventory each GPU you run or rent** as a record: MPN, firmware version, driver version and container toolkit version. A bulletin then becomes a query, not a hunt.
- **Ask a neocloud for the same record.** On rented capacity you can't read the firmware yourself, so the MPN, firmware and driver versions, and the patch window belong in the contract and its audit rights.
- **Don't collect it from people's devices.** On the device rung the GPU model is a fingerprinting signal. WebGPU deliberately gives a page only coarse adapter information, so code there should adapt to what the adapter can do, not to its part number.

**Optimizing the bytecode: a frame for a person, or throughput for a model.** The same compile step serves two very different customers, and each is optimized for a different finish line.

| | Browser render, for people | AI work, for models |
|---|---|---|
| The goal | Every frame on time: about 16.7 ms at 60 Hz. A missed frame is a visible stutter | The most results per dollar and per watt: inferences, tokens or embeddings per second |
| What gets optimized | Size and startup. Shrink the Wasm (`opt-level = "z"`, `wasm-opt`; the demo build in this article is 32 KB), compile while downloading, keep shaders small, and prepare pipelines before the first frame | Math and memory. Lower precision (FP16, INT8), fused kernels that make one pass over the data instead of several, memory layouts that keep the GPU fed, and large batches |
| Precision | An eye can't see a one-bit color error, so 8 bits per channel is enough | Models often tolerate lower precision too, but it changes outputs, so every reduction is measured against a reference |
| Where the final compile happens | On the person's device, at load time, for whatever GPU is there | Usually ahead of time, for one known GPU: an NVIDIA TensorRT engine, for example, is built for a specific GPU model and software version |
| Portability vs peak speed | Portable first: one Wasm or WGSL file for every device | Peak speed first: CUDA and per-GPU engines, which tie the work to one vendor |
| What "done" means | The page looks right and feels smooth to a person | The output matches the reference within a set tolerance |
| The security risk | Untrusted code from the web running on someone's device, so the browser validates and sandboxes it | The data. The optimized kernels are native and privileged, and a model reads what a person never sees, such as hidden SVG text |

In business terms: a browser render is a print shop making one poster while the customer waits, so speed to the first copy and a small file matter most. AI work is a factory line producing a million units, so the cost per unit matters most, and the line is retooled for one specific machine.

Three rules follow for this stack:

- **Bytecode for people ships small and portable, to the device.** Wasm and WGSL, budgeted like a frame, with nothing personal leaving the device.
- **Bytecode for models is compiled per GPU, on the top rung, and tracked by part number.** An engine built for one GPU model and driver must be rebuilt when either changes, which is one more reason to keep the MPN, firmware and driver record above.
- **Small models can use the people path.** Runtimes such as ONNX Runtime Web run a model in the browser through WebGPU or Wasm. It is slower than a tuned server engine but portable, and the data stays on the device, which is often the better trade for personal data.

## The frame-budget origin

The GPU started out rationed. NVIDIA was founded in 1993 to make 3D graphics for games, and a game engine has a fixed budget, about 16.6 ms per frame at 60 frames per second, on whatever GPU the player happens to own. It can't buy more GPU, so it removes everything it doesn't need before it shades a single pixel. Data-center AI dropped that discipline, reserving GPUs by contract before demand was known. "Bind before you allocate" brings it back.

![The frame-budget origin. Two paired pipelines. Game engine, on a 16.6 ms frame budget: frame budget, culling, level of detail, streaming and mipmaps, batching, the player's GPU, and a render farm only for cinematics and lightmaps. Bind before you allocate, on a GPU and token budget: GPU budget, the gate, rank then fall back, edge cache, queues, device first, and a rented GPU cluster only for what is left. Renderers: Flash Player in C++ is replaced by Ruffle in Rust compiled to Wasm; SVG renderers in C by librsvg in Rust and resvg; ImageMagick in C by Rust image decoders that can run as Wasm at the edge; a native renderer isolated in a cluster pod becomes a safe renderer moved to the device or edge. Compile once, render cheap: Rust source is optimized at build into a compact Wasm bundle, compiled while it downloads, and run without JIT warm-up or GC pauses, with WebGPU for the GPU part. Timeline: 1993 NVIDIA founded for 3D games; 1999 GeForce 256 sold as the first GPU; 2006 to 2007 CUDA; 2012 AlexNet trained on two gaming cards; late 2010s mining GPUs turn into GPU clouds; 2020s GPUs reserved by contract.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-frame.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-frame.svg) (1600 × 1186) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-frame.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-frame.pdf).*

| Game engine, under a frame budget | Bind before you allocate, under a GPU budget |
|---|---|
| **Frame budget**: 16.6 ms is fixed, and the work fits the budget | **GPU and token budget**: context assembly caps what reaches a model |
| **Culling**: off-screen or hidden objects are never drawn | **The gate**: ineligible or unconsented data is never sent |
| **Level of detail**: distant objects get simpler meshes | **Rank, then fall back**: a small model first, a larger token model only below the threshold |
| **Streaming and mipmaps**: reuse loaded textures at the size needed | **Edge cache**: reuse answers and transforms, after the gate |
| **Batching**: group draw calls so the GPU isn't interrupted | **Queues and task runners**: group jobs per subject and region |
| **The player's GPU** renders the frame | **Device first**: previews and real-time 3D stay on the person's device |
| **Render farm**: only cinematics and lightmaps that can't be real-time | **Rented GPU cluster**: only what is left after the funnel |

**How the GPU left the player's desk.** NVIDIA sold the GeForce 256 in 1999 as the first "GPU". CUDA (2006–07) opened the same parallel hardware to any workload. AlexNet, the 2012 network that started modern deep learning, was trained on two gaming cards. GPUs bought for crypto mining later became the stock of the first GPU clouds. Each step moved the GPU further from the person who owned it and closer to a balance sheet that has to borrow to buy it.

### The renderers: C and C++ parsers, and what Rust fixes

The renderers that sit next to the GPU have their own history, and most of it was written in C and C++. Those languages leave memory management to the programmer, so a crafted file can overflow a buffer and run code. Microsoft and the Chromium project have each reported that about 70% of their serious security bugs are memory-safety bugs.

| C or C++ renderer | What went wrong | Rust replacement | What changes |
|---|---|---|---|
| **Flash Player** (C++) | A browser plugin that parsed untrusted SWF files, with years of exploits; Adobe ended it on 31 December 2020 | **Ruffle**, a Flash emulator in Rust compiled to WebAssembly | The same SWF files play inside the browser's sandbox, with memory safety |
| **SVG renderers** in C | librsvg began in C; a crafted SVG could reach memory bugs in the parser | **librsvg**, rewritten in Rust, and **resvg** | Memory-safety bugs are designed out of the parser and renderer |
| **ImageMagick** (C) | Hundreds of format coders; ImageTragick in 2016 | Rust image decoders | Memory-safe decoding that can run as Wasm inside a Worker |

This is an allocation point, not only a security one. A C renderer that parses untrusted files has to be isolated: a locked-down pod in a cluster, far from the data and paid for separately. A memory-safe renderer can run on the device or at the edge, next to the data. Safety moves the render to the left of the spectrum, which is where "bind before you allocate" wants it. Rust removes memory-safety bugs; it doesn't remove logic bugs, and code marked `unsafe` still needs review. See [SVG, Rust and Elm: the security gaps](https://persephonepunch.github.io/crm-sync-setup/svg-rust-elm-security-gaps.html) for the wider picture.

### Compile once, render cheap: the Wasm bundle

A WebAssembly bundle moves work from every run to a single build:

1. **Optimized at build.** A release build with link-time optimization, then `wasm-opt`, is paid for once, by the developer, not on every page load or request.
2. **A size budget, like a frame budget.** The bundle is downloaded before it runs, so it gets a budget. Split it, and load what isn't needed on first render later.
3. **Streamed compile.** Browsers compile WebAssembly while it is still downloading, and decoding it is faster than parsing the equivalent JavaScript.
4. **Predictable runtime.** Rust compiled to Wasm has no garbage collector and no JIT warm-up, so a frame or a request costs the same the first time as the hundredth.

The limits: Wasm reaches the DOM and the GPU only through JavaScript bindings (WebGPU for the GPU, which is how wgpu runs in a browser), a large bundle can cost more to download than it saves at runtime, and Workers cap bundle size. Measure the bundle like a frame: if it doesn't fit, it isn't done.

### Shopify Functions: Wasm as a checkout security boundary

Shopify already runs this model in production, inside cart and checkout. A Shopify Function is a WebAssembly module that Shopify runs for discount, delivery, payment and validation logic, in place of the Ruby Scripts that came before it. The format is what makes it safe to run third-party code on the path where money changes hands:

| Wasm property | What Shopify enforces | Security benefit |
|---|---|---|
| **No ambient access** | The module reads its input only through imported API functions and returns operations. No filesystem; no network, except a fetch target limited to custom apps on Enterprise stores, where Shopify makes the HTTP call on the function's behalf | The code has no outbound path of its own, so it can't send cart or customer data anywhere, and a prompt or payload injected into the cart has nowhere to go |
| **Declared input** | An input query names the fields the function receives | Data minimisation by schema: a field not in the query never reaches the code. This is the gate's redaction, done by Shopify |
| **Deterministic** | No randomness and no clock | The same input gives the same output, so a decision can be replayed for audit, and there is no timing channel to probe |
| **Hard budget** | 256 kB binary, 10,000 kB linear memory, 512 kB stack, and for carts up to 200 lines, 11 million instructions, 128 kB input and 20 kB output | A runaway or hostile module is stopped by an instruction count, not a timeout, so one bad function can't stall checkout for everyone |
| **No URL** | Shopify Functions are never invoked directly by URL | There is no public endpoint to scan, authenticate or rate-limit |
| **Server-side** | The module runs on Shopify, not in the browser | A price computed in the browser can be edited in the browser; a price computed in a Function can't |

This is bind before you allocate, at checkout scale: Shopify sizes the sandbox, the function reads only the fields it declared, decides, and hands back operations for Shopify to apply. Nothing is allocated to it beyond the budget, and nothing leaves it.

The limits: Wasm isolates the function, it doesn't make the function correct; a wrong discount rule is applied to every cart, so test it like any other release. Shopify strongly recommends Rust, because a JavaScript Function carries a JavaScript engine inside its module and spends the instruction budget faster, which is how large carts fail. Custom apps that use the Function APIs need Shopify Plus. See [October 1: script tags, Functions, the cart](https://www.crm-sync.dev/pages/knowledge-base#shopify-october-1-scripts-cart-catalog) for the migration and the language choice.

### Shopify apps: where the Wasm sits, the security rules, and the deprecation calendar

**The Wasm bundle is one slot in a Shopify app, not the whole app layer.** A Shopify app has several parts, and only Shopify Functions run as Wasm:

| Part of a Shopify app | Where it runs | What it's made of |
|---|---|---|
| **Shopify Functions** | Shopify's servers, during cart and checkout | **Wasm**, compiled from Rust, or from JavaScript through Javy. Deterministic, no network, hard limits. Discounts, delivery and payment rules, validation, bundles |
| Checkout and customer account UI extensions | The buyer's browser, in a sandboxed Web Worker | JavaScript or TypeScript drawing Shopify's own components. Not Wasm |
| Theme app extensions (app blocks and app embeds) | The storefront theme, turned on by the merchant in the theme editor | Liquid, JavaScript and CSS |
| Web pixels | A sandbox on the storefront and checkout, gated by the customer's privacy choices | JavaScript, for analytics and conversion events only |
| Embedded admin app | An iframe in the Shopify admin, using App Bridge and session tokens | Your web app, hosted wherever you choose |
| App backend: webhooks, App Proxy, APIs | Your own servers, such as a Worker in front of Xano | Any language |

The same Rust source can build two different artifacts: a **Shopify Function**, Wasm on Shopify's servers that decides prices and rules, and a **browser bundle**, Wasm on the device that draws and computes on the page. The browser bundle reaches a storefront through an app embed block or through the App Proxy described below. It runs like any page script; it gets neither the Function's checkout privileges nor its limits.

**The security rules a public app must meet.** These are Shopify's App Store requirements and data rules, and each one is permissions as architecture:

| Rule | What Shopify requires | What it binds |
|---|---|---|
| Encryption in transit | A valid TLS certificate; all traffic between client and app server encrypted, with no certificate errors (requirement 3.1.1) | The wire |
| Least-privilege scopes | Request only the access scopes the app needs, and be ready to justify them; sensitive scopes such as `read_all_orders` need approval (3.2) | What the app may reach |
| OAuth first | Authorize through OAuth immediately on install and on reinstall, before any other step (2.3) | Who granted the access |
| Session tokens | Embedded apps authenticate with session tokens, without third-party cookies or local storage (1.1.1) | Each admin request |
| Mandatory compliance webhooks | Subscribe to `customers/data_request`, `customers/redact` and `shop/redact`; answer with a 2xx, reject a bad HMAC with `401`, and complete the action within 30 days, even if the app stores no personal data | Data subject rights |
| Protected customer data | Level 1 for any customer data: minimize, encrypt at rest and in transit, set retention. Level 2 adds name, address, email and phone: encrypted backups, limited staff access, access logs that are reviewed, and data protection reviews if selected | Personal fields, field by field |
| Current APIs only | New public apps must use the GraphQL Admin API (since 1 April 2025); an app using APIs deprecated within 90 days can't be submitted | Time: no new code on a dying surface |

In this architecture the Worker carries most of these rules once, for every theme: it checks the App Proxy HMAC, holds the session, answers the compliance webhooks and routes them to the subject's home Xano instance, and Xano's ledger records that each request was completed within 30 days.

**Delisting.** Shopify publishes one automatic rule, in its API versioning policy: "If your app continues to use unsupported resources after the upgrade deadline, it's delisted from the Shopify App Store." Merchants are also blocked from installing it for at least seven days, and see warnings in the admin until seven days after the last use of an unsupported resource. The Partner Dashboard's API health report lists which calls need changing. Shopify doesn't publish an inactivity or install-count rule. Beyond the versioning rule, its requirements say the review team may reject an app at its discretion, and that breaking the rules can lead to "removal of reviews, demotion or delisting of your app, or termination of your Partner account" (requirement 1.3). An app whose core functionality has changed since it was listed must be resubmitted for a full review. Developers report delistings after missing the response window on a Shopify governance email, and in some cases every app under the same Partner account was delisted at once. Those reports are anecdotal, but the pattern is familiar: one account is one perimeter. Three practices follow:

- **Give the Partner account a named owner and a response deadline** shorter than Shopify's, and route Shopify's review and governance emails to a shared inbox, not one person.
- **Keep the listing true.** Re-check the listing against the app before each release, so the claims and the scopes match what the app does.
- **Don't let the app hold the data.** If the listing goes down, merchants lose the app's interface, not their records: the system of record stays in Xano, and the Worker can serve a merchant directly while the listing is restored.

**Case: the October 2026 checkout hijack.** Between 10 and 14 October 2026, attackers used a few third-party Shopify apps to send some shoppers to fake payment pages. Shopify's own checkout wasn't breached; what the apps sent to stores was changed.

- **Hulk Product Options.** The app's script loaded from Shopify's CDN, then fetched its configuration from the developer's own API. One field, `advanced_users.custom_js`, was meant to hold custom JavaScript, and it had been replaced with about 22.7 KB of attack code. The code attached a handler to the checkout button, sent the shopper once to a lookalike domain that collected card and billing details, then passed them on to the real checkout, so the order looked normal in the admin. Shopify temporarily disabled the app's theme extension.
- **Selleasy.** Its developer, Logbase, said an unauthorized party reached one of its internal tools and added a script to store settings, live from 07:47 to 15:00 UTC on 13 October.
- **Swym Wishlist Plus** was named by merchants. Swym hasn't confirmed it, and one report says a value meant to be a plain text label carried HTML with an event handler. The three apps were reported missing from the App Store afterwards.

The review checked the code the app shipped; it couldn't check what that code fetched later. Remote configuration can change without a release, which is why it is useful, and that is also why a compromised configuration system reaches every store that reads it. In this article's terms the slot was the right shape, but the gate was missing on the app's own config path:

| The question | What went wrong | The rule in this design |
|---|---|---|
| What runs first? | Reviewed code, delivered from Shopify's CDN | Keep it. App embeds are visible and can be switched off |
| What does it fetch afterwards? | Unsigned configuration from the developer's API | Sign config bundles and verify them before applying, like the policy bundle; deny on a bad or stale signature |
| How is that content handled? | A data field executed as code | No code fields in remote configuration. Insert text with `textContent`, never `innerHTML` |
| Who can change it? | An internal tool that reached many stores at once | Two-person approval and an audit log for any change that reaches more than one store |
| Where can checkout go? | Off-domain, to a lookalike | Checkout links are built only from allowlisted origins, and a synthetic test fails on any off-domain redirect |

**Was it linked to the deprecation calendar? No public evidence says so, and the facts point the other way.** Hulk Product Options was already on the approved slot: its script loaded from Shopify's CDN, and Shopify responded by disabling the app's theme extension, which is the app-embed route the calendar moves apps toward, not a deprecated script tag. The attack used no deprecated feature; it came through the app's own configuration feed. The dates don't connect either: the exploit began on 10 October, nine days after the 1 October script-tag freeze, which doesn't apply to app embeds, and six days before API version 2025-10 retired on 16 October. HulkApps has said only that "an exploit on October 10 introduced unauthorized configurations." The apps' later removal from the App Store most likely followed the breach, though neither Shopify nor the developers have said why.

So the calendar and the breach answer different questions. The calendar fixes *how app code gets onto the page*: through a slot the merchant can see and switch off. It doesn't govern *what that code fetches once it's running*. Migrating to app embeds is necessary, and it isn't sufficient; the configuration path needs its own gate.

**The same gap applies to any executable, and most of all to firmware.** A review, a scan or a signature proves what was delivered at one moment. What matters is what runs later, and what it loads after the check. The NVIDIA container escape was this gap at a smaller scale: a time-of-check, time-of-use flaw.

| Executable | Checked when | What can change after the check | The gate |
|---|---|---|---|
| Shopify app embed | At App Store review | The configuration it fetches at runtime | Signed configuration, no code fields |
| Browser Wasm bundle | At build | Anything it fetches or is told to load | A content security policy that allowlists where it may connect |
| Shopify Function | At every deploy | Nothing: no network, declared input only | Already gated. This is the model the others aim for |
| Container image | At build and scan | A tag that points to a new image; what the runtime mounts into it | Pin images by digest, sign them, and keep the GPU toolkit patched |
| Driver and firmware | Signed by the vendor at release | The update channel, its configuration, and anything below the operating system | Accept only signed images, verify at boot, attest the device, roll out in stages |

Firmware is the hardest case. It runs below every sandbox in this article, survives a reinstall of the operating system, and few tools can inspect it. One firmware image ships to every unit of a part number, so a bad update reaches the whole fleet at once: the castle vault again. A signature doesn't settle it either. If the vendor's update channel is compromised, the malicious update arrives signed, as in the 2019 ShadowHammer attack on ASUS's Live Update tool. The defenses are the same rules applied lower down: an inventory by MPN and firmware version, updates only from the vendor's channel and rolled out in stages, measured boot, and device attestation where the hardware offers it. On rented GPUs, NVIDIA's attestation for confidential computing lets a job check what it is running on before it receives data.

**What a remote load through Cloudflare protects, and what CORS doesn't.** Everything in the Hulk attack was visible in the browser. The app's script, on every storefront, called `productoption.hulkapps.com/api/v2/store/get_all_relationships` and ran whatever came back in `advanced_users.custom_js`. That visibility is how a developer found the attack in the browser's developer tools, and it is also why it worked: the page trusted a third-party endpoint to send code, and nothing between the two checked it.

**Hard-code nothing in the theme you wouldn't publish.** Whatever a client-side render needs is readable by anyone: the theme's Liquid output, its JavaScript, app embed settings, and every network call the page makes. Never put these in a theme: API keys or tokens (other than ones designed to be public, such as a Storefront API token with read-only scopes), internal tool or admin URLs, third-party configuration endpoints keyed by shop domain, pricing or discount logic (that belongs in a Function), or switches that unlock behavior. The theme should carry only a proxy path, a version number, a content hash and public IDs.

**Load remote code and configuration through the Worker, not straight from a vendor.** The page calls the store's own App Proxy path. Shopify signs the request; the Worker verifies the HMAC, fetches the configuration from Xano with a server-side secret, checks its signature, keeps only the fields the schema allows, and returns data, never code. Wasm and JavaScript bundles are named by version, served immutable, and pinned in the theme by hash.

```html
<!-- In the theme: a path, a version and a hash. Nothing secret. -->
<script type="module">
  const cfg = await (await fetch("/apps/crm/config?v=42")).json(); // App Proxy: same origin, signed by Shopify
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch("https://assets.example.com/app-42.wasm", { integrity: "sha384-..." }), {} // bytes must match
  );
  document.querySelector("#option-label").textContent = cfg.label; // text, never innerHTML
</script>
```

```js
// In the Worker, behind the App Proxy: data fields only, whatever the source contains.
const ALLOWED = ["label", "badge", "max_options"];
if (!(await verifyAppProxy(url, env.SHOPIFY_APP_SECRET))) return new Response("", { status: 401 });
const raw = await getSignedConfig(env, shop); // fetched with a server secret; throws on a bad signature
const cfg = {};
for (const k of ALLOWED) if (["string", "number", "boolean"].includes(typeof raw[k])) cfg[k] = raw[k];
return Response.json(cfg, { headers: { "Cache-Control": "no-store" } });
```

A `custom_js` field injected upstream never reaches the page: the allowlist drops it, and the theme has no code path that would run it. Each control covers one part of the path, and none covers it alone:

| Control | What it protects | What it doesn't |
|---|---|---|
| **CORS allowlist** on the Worker: reflect only listed origins, with `Vary: Origin` | Which other sites' pages can read your API's responses in a browser | It isn't authentication: `curl` ignores it, and a plain `<script src>` needs no CORS. It can't stop an allowed origin from receiving bad data, which is exactly the Hulk case |
| **App Proxy with HMAC** | The request came through Shopify, for that shop, on the store's own domain; no vendor endpoint appears in the theme | What the response contains |
| **Server-side secret and signed configuration** | Only your pipeline can change configuration; tampering in transit or in storage fails the signature | A compromised signing tool, as with Selleasy's internal tool. That needs two-person approval and an audit log |
| **Schema allowlist in the Worker** | Code fields are dropped even if they were injected upstream | A malicious value inside an allowed text field, which is why the page inserts text with `textContent` |
| **Integrity hash on Wasm and JavaScript** | The bytes that run are the version you pinned | What that version does with its inputs. Cross-origin fetches need the asset to send CORS headers for the check to run |
| **Content security policy**, where you control the page's headers (a Webflow export served by the Worker) | Where page code may load scripts from and send data to; a lookalike checkout domain is refused | Pages whose headers the platform sets for you |

For a public, immutable bundle, `Access-Control-Allow-Origin: *` is fine, because there is nothing to protect in reading it. For an API that returns store or customer data, list the origins and never echo the request's `Origin` back unchecked.

**Nothing secret runs in the client: anything visible on inspect is safe to show. Script injection is contained: the page runs only pinned code, and receives only signed data, never code.** Contained, not eliminated: what remains is a compromised signing tool, a bug in your own code, or a malicious extension on the shopper's device.

**Once the gates pass: AI-assisted data binding.** The gates aren't only a cost. Data that has passed them is typed, minimized, labeled with its consent and region, signed, and stripped of code. That is the shape a model handles well, so the work that usually goes into hand-written glue code can be assisted:

- **Mapping fields.** A model proposes how a vendor's fields map onto the Xano schema (`option_title` to `label`, a size chart to `max_options`) instead of someone writing each mapping by hand.
- **Classifying and labeling.** It suggests a consent purpose, a region or a sensitivity level for a new field, and flags one that looks personal.
- **Drafting the binding.** It writes the allowlist row, the schema entry and the test that goes with them.
- **Reconciling.** It matches records across Shopify, the CRM and the ERP when identifiers disagree, and explains each match.

The rule that keeps this safe: **the model proposes, the gate decides.** A proposal is data, not an action. It holds no credentials and binds nothing on its own; it becomes a change only after the same schema allowlist, the tests below and a person's approval have passed it. Because the model sees only what already passed the gates, a wrong proposal costs a failed test, not a leak. The benefit is speed with a paper trail: bindings are written faster, every one is a reviewed diff with a test, and there is less hand-written glue code, which is where bugs like a label rendered through `innerHTML` come from.

**Tests are the thresholds, and Rust runs them as you work.** In Rust, tests are part of the language and the toolchain: a `#[test]` function sits next to the code it checks, and `cargo test` runs it with no extra framework. The gate's thresholds become tests, so a change that breaks one can't ship:

```rust
use serde_json::{Map, Value};

const ALLOWED: [&str; 3] = ["label", "badge", "max_options"];
const MAX_POLICY_AGE_SECS: u64 = 300;

/// Keeps only allowlisted fields that hold plain values; code never passes.
pub fn allow(raw: &Map<String, Value>) -> Map<String, Value> {
    ALLOWED
        .iter()
        .filter_map(|k| match raw.get(*k) {
            Some(v @ (Value::String(_) | Value::Number(_) | Value::Bool(_))) => Some((k.to_string(), v.clone())),
            _ => None,
        })
        .collect()
}

/// Fail closed: a policy older than the threshold denies.
pub fn policy_fresh(age_secs: u64) -> bool {
    age_secs <= MAX_POLICY_AGE_SECS
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn code_fields_never_pass() {
        let raw = json!({ "label": "Size", "custom_js": "hijack()", "badge": { "html": "<img onerror>" } });
        let cfg = allow(raw.as_object().unwrap());
        assert_eq!(Value::Object(cfg), json!({ "label": "Size" }));
    }

    #[test]
    fn stale_policy_denies() {
        assert!(policy_fresh(300));
        assert!(!policy_fresh(301));
    }
}
```

Two layers run at different moments. On every save, the editor's rust-analyzer runs `cargo check` by default, so type and ownership errors appear as you type. The tests run on every save too when a watcher such as `bacon test` is running, and they always run in the build: put `cargo test` before the compile in the Workers Builds command, so a failed threshold stops the deploy. The same tests judge every AI-proposed binding, which is what makes accepting AI help safe: the threshold doesn't care who wrote the change.

One more check to run: a third-party tracker's snapshot marks 126 apps delisted, 89 of them dated 15 October 2026, with every cause unverified. Some may be fallout from the hijack and some from the 2025-10 retirement, but those dates come a day before the 16 October cutoff, so the versioning rule alone doesn't explain them. Shopify publishes no list of delisted apps; trackers diff the App Store over time. If you run a public app, check its listing status in the Partner Dashboard.

**The deprecation calendar.** Shopify releases a new API version every quarter, on the first day of the quarter at 17:00 UTC, and supports each version for at least 12 months. A request for a retired version *falls forward* to the oldest supported version, so old code keeps receiving answers in a newer shape. Read the `X-Shopify-API-Version` response header to see which version actually answered. The dated changes that matter here, as of October 2026:

| Date | Change | Replacement | Status |
|---|---|---|---|
| 1 Oct 2024 | REST Admin API becomes legacy | GraphQL Admin API | Done |
| 1 Apr 2025 | New public apps must use GraphQL | GraphQL Admin API | Done |
| 28 Aug 2025 | Plus stores: `checkout.liquid` and script tags on the Thank you and Order status pages turned off | Checkout and customer account UI extensions, web pixels | Done |
| 1 Jan 2026 | No new legacy custom apps created in the Shopify admin | Apps created in the Dev Dashboard, with a client credentials grant for tokens | Done |
| 15 Apr 2026 | Shopify Scripts can no longer be edited or published | Shopify Functions | Done |
| 30 Jun 2026 | Shopify Scripts stop running | Shopify Functions | Done |
| 26 Aug 2026 | Non-Plus stores: Thank you and Order status script tags turned off | Customer account UI extensions, web pixels | Done |
| 1 Oct 2026 | `scriptTagCreate` and `scriptTagUpdate` return errors on every API version; existing storefront script tags keep running | App embed blocks in a theme app extension; web pixels for analytics | Done |
| 16 Oct 2026, 15:00 UTC | API version 2025-10 stops being accessible; apps still using unsupported resources are delisted | 2026-01 or later | Done |
| 16 Jan 2027, 15:00 UTC | API version 2026-01 stops being accessible | 2026-04 or later | **Next** |
| 1 Mar 2027 | Shopify stops injecting script tags into storefronts | App embed blocks; web pixels | Coming |

After that, a version retires every quarter on the 16th at 15:00 UTC: 2026-04 in April 2027, 2026-07 in July 2027, 2026-10 in October 2027. Shopify CLI refuses to deploy UI extensions that target a version more than 12 months old, so the tooling blocks a stale app before the cutoff does. Fields can also be removed between versions: something deprecated in one release can be gone in the next.

Read the calendar as one direction of travel. Each deprecation moves code out of open page scripts, which could read and change anything on the page, into a slot with a declared boundary: Ruby Scripts into Wasm Functions, `checkout.liquid` into sandboxed UI extensions, script tags into app embeds the merchant can see and switch off, and tracking into web pixels that respect consent. Shopify is applying permissions as architecture to its own platform. An app built on those slots from the start has much less to migrate.

### The Rust path: a Webflow page, a Cloudflare compile, a Xano record

Ruffle keeps old SWF files playable. New interactive work doesn't need the SWF format or an emulator: write it in Rust, compile it to Wasm once, and nest it in the stack this article already uses. Each system keeps one job, and none of them takes on another's:

| Layer | Its job | What it holds | What it never does |
|---|---|---|---|
| **Webflow** | The page | Layout, CMS copy, a `<canvas>` and one module script tag; or a Webflow Cloud app mounted at a path such as `my-site.webflow.io/my-app` | Compile code, hold the binary, or hold personal data |
| **Cloudflare** | The compile, the serve and the gate | Workers Builds turns a git push into a `.wasm` bundle; Workers static assets serve it; the gate Worker signs R2 URLs and checks posture | Hold the truth |
| **Xano** | The record | Sign-in, entitlements, consent, saved state, signed media URLs | Run the Wasm, or parse an untrusted file |
| **The device** | The render | The compiled module, run with WebGPU and a WebGL2 fallback | Send anything the gate didn't allow |

**The compile happens once, on Cloudflare.** Rust isn't preinstalled in the Workers Builds image, so the build command installs it. Trunk then fetches `wasm-bindgen` and `wasm-opt` itself, and the size check makes the frame budget a build failure rather than a guideline:

```bash
# Workers Builds › build command
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --target wasm32-unknown-unknown
. "$HOME/.cargo/env"
cargo install --locked trunk          # compiles from source: cache it, or fetch the release binary
trunk build --release --dist dist     # with filehash = false in Trunk.toml, so the Webflow tag never changes
find dist -name '*.wasm' -size +3M | grep -q . && { echo "wasm over budget"; exit 1; } || true
```

```jsonc
// wrangler.jsonc — the deploy command stays `npx wrangler deploy`
{ "name": "rust-app", "compatibility_date": "2026-10-19", "assets": { "directory": "./dist" } }
```

Wrangler sets each file's `Content-Type` from its extension, so `.wasm` is served as `application/wasm`, and the default `ETag` revalidation means a new build is picked up without renaming the file.

**The page only loads it.** In a Webflow custom code embed:

```html
<canvas id="app"></canvas>
<script type="module">
  import init from "https://app.example.com/rust-app.js";
  init();
</script>
```

Module scripts and streamed Wasm are fetched with CORS, so a Worker on a subdomain needs a `_headers` file in `dist` that sends `Access-Control-Allow-Origin` for the Webflow domain, and `www` and the bare domain count as different origins. A Webflow Cloud app at a mount path avoids that: it runs on the Workers runtime under the site's own domain. If the site sets a Content Security Policy, `script-src` needs `'wasm-unsafe-eval'`.

**Xano is reached through the gate.** The module calls the gate Worker with `fetch`, the gate checks posture and forwards to Xano, and Xano answers with data and signed, expiring R2 URLs. Results go back the same way. Xano never sees the binary, and the device never sees a field the gate removed.

What the path buys, against the rest of this article:

- **Memory safety where the file is parsed.** The parser is Rust, inside the browser's sandbox. There is no plugin, and no C renderer to isolate in a pod.
- **The device stage of the funnel.** Rendering on the person's GPU is the first 30% the illustrative funnel removes before anything reaches the edge, let alone a GPU cluster.
- **Cost paid at build, not per request.** Optimization, `wasm-opt` and the size check run once per push, in Workers Builds.
- **A system of record that only decides.** Xano holds the truth and grants access; it doesn't execute or parse anything the person supplied.

The limits: Wasm reaches the page and the GPU only through JavaScript bindings; a bundle over budget costs more to download than it saves; and Rust removes memory-safety bugs, not logic bugs. Keep Ruffle for the SWF files you already have, with the same hosting rules (`application/wasm`, `'wasm-unsafe-eval'`, CORS on the file's origin).

## The strategy: bind before you allocate

Rent or buy GPUs last. Every request first passes through the cheaper distributed layers, and each layer either answers it or removes data from it. A GPU is sized only for what is left. That ordering is where both the cost saving and the security saving come from, and it can be shown with arithmetic before any GPU contract is signed.

![Bind before you allocate, an illustrative funnel of one million requests. The device handles 30%, leaving 700,000. The binding gate denies 10% and redacts personal fields from 12 to 3, leaving 630,000. The edge cache answers 40%, after the gate, leaving 378,000. Workers AI triage settles 70%, leaving 113,400. Only 113,400 reach GPU allocation, as redacted, signed payloads. Result: about 89% fewer GPU calls and about 97% fewer personal-field exposures. Net saving equals GPU cost avoided minus the cost of Workers, Workers AI and the cache.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.svg) (1600 × 788) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-funnel.pdf).*

**The rates in the diagram are illustrative, not measurements.** They show the method. Replace each one with the pass-through rate you measure at that stage.

### The cost case

GPU spend scales with the requests that reach it:

```
requests_at_gpu = requests × (1 − device) × (1 − denied) × (1 − cached) × (1 − triaged)
gpu_cost        = requests_at_gpu × gpu_seconds_per_request × price_per_gpu_second
net_saving      = gpu_cost(all requests) − gpu_cost(requests_at_gpu) − (Workers + Workers AI + cache cost)
```

| Stage | Removes | Still travelling | Cost of the stage |
|---|---|---|---|
| Incoming | | 1,000,000 | |
| 1 · Device | 30%: previews and real-time 3D on the person's GPU | 700,000 | None to you; the person's device does the work |
| 2 · Binding gate | 10%: unconsented, out-of-policy or unbound requests | 630,000 | One Worker invocation and a Durable Object read |
| 3 · Edge cache | 40%: repeat transforms and answers | 378,000 | Cache storage and reads |
| 4 · Workers AI triage | 70%: easy cases a small model can settle | 113,400 | Workers AI inference, priced per use |
| 5 · GPU allocation | | **113,400** | Sized for about 11% of the original demand |

Two things make the saving larger than the request count suggests. GPU capacity is bought for the peak, and the device and cache stages remove the most repetitive, burst-prone traffic first. And a smaller, steadier GPU workload can often run on a few GPU pods of your own (media ladder rung 3) instead of a rented cluster (rung 4).

### The security case

Count the personal fields that leave each boundary, not just the requests:

| | Requests reaching a GPU | Personal fields per request | Personal-field exposures |
|---|---|---|---|
| GPU first | 1,000,000 | 12 | 12,000,000 |
| Bind before you allocate | 113,400 | 3, after redaction at the gate | **340,200**, about 97% fewer |

The other savings don't show up in the count:

- **The device stage sends nothing.** Data that never leaves the person's device has no transit, retention or processor terms to negotiate.
- **The gate runs before the cache.** A cached answer is never served without the posture check, so caching can't become a way around consent.
- **Triage stays on the edge network.** Easy cases are settled by small models under one data-processing agreement, not shipped to a GPU provider.
- **What reaches the GPU is redacted and signed.** A provider breach, or a prompt injection, exposes three fields of 113,400 requests, not twelve fields of a million. Every payload is tied to the ledger state that allowed it.

### What to measure before sizing GPUs

1. The share of requests the device can serve: previews, real-time 3D, small on-device models.
2. The gate's deny rate and the number of fields it redacts, per market.
3. The cache hit rate, measured after the gate.
4. The share of cases Workers AI settles, and how often its answer is overturned later. A triage that misroutes hard cases costs quality, not just money.
5. GPU-seconds per remaining request, and the peak-to-average ratio of what reaches the GPU.

If the remaining demand is small and steady, own a few GPU pods. If it is large or bursty, rent. Either way, the decision is made on the 11%, not on the 100%.

## Incremental knowledge vs boil the ocean

There are two ways to make AI know your business. **Boiling the ocean** means putting everything you have into a general-purpose model, by training or fine-tuning it, and hoping the answers come out right. **Incremental knowledge** means leaving the model general and giving it, for each question, only the ranked evidence that question needs. The first changes *model weights* with GPUs. The second changes *evidence weights* with rows, and reaches a GPU only when it must. That makes it the knowledge side of "bind before you allocate".

![Incremental knowledge vs boil the ocean, and what AI weighting weighs. Six comparisons. Starting point: a model trained or tuned on everything, versus a general model that reads only what is retrieved. Adding knowledge: retraining with GPU hours, versus one new row in minutes. Fixing a wrong answer: retraining, versus correcting or demoting the source. Erasure: the fact stays in the weights, versus deleting the row. Citations: none, versus every answer citing its rows and weights. GPU need: up front, versus only for cases weighting can't settle. AI weighting: score equals authority times freshness times eligibility times relevance, with eligibility zero when consent or rights don't allow the use. Illustrative authority tiers: system of record 1.0, reviewed spec 0.8, knowledge base 0.6, inbox and tickets 0.4, open web 0.2. Rank first, fall back last: rank the data; if the top score clears the threshold, a small model answers from the ranked rows and the answer is cited; if not, a larger token model answers with more context, tokens and cost and a higher error risk, and the answer is flagged for the record or a person to confirm.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.svg) (1600 × 1100) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-weighting.pdf).*

| | Boil the ocean (general purpose) | Incremental knowledge |
|---|---|---|
| Adding a fact | Retrain or fine-tune: GPU hours and a new model version | Add one row to the index: minutes, no GPU |
| Fixing a wrong answer | Retrain, or prompt around it | Correct or demote the source; the next answer changes |
| Erasure requests | The fact stays in the weights until the next retrain | Delete the row; it is gone from the next answer |
| Audit | The model can't say where a fact came from | Every answer cites its rows and their weights |
| GPU spend | Up front, before the first answer | Only for the cases ranking can't settle |

This knowledge base works the incremental way. A new article is one line in the book's summary, and it is listed and searchable after the next index run. No model is retrained.

Fine-tuning still has a place: tone, output format, and narrow classification tasks a small model must do fast. It is the wrong tool for facts, because facts change, and a fact held in the weights can't be cited, corrected or erased on its own.

### AI weighting: evidence, not parameters

*Weighting* here means how strongly an answer favours a piece of evidence, not a model's parameters. It matches the definition in [AI enabled forms with LLM weighting](https://persephonepunch.github.io/crm-sync-setup/ai-enabled-forms.html): a weight is set by what the corpus can prove, not by the model alone.

```
score = authority × freshness × eligibility × relevance
```

| Factor | What it measures | How it is set |
|---|---|---|
| Authority | How much the source can be trusted | By tier (illustrative): system of record 1.0, reviewed spec 0.8, knowledge base 0.6, inbox and tickets 0.4, open web 0.2 |
| Freshness | How recently the source was true | Decays at a half-life set per tier: hours for a price, months for a policy |
| Eligibility | Whether this use is allowed at all | 1 or 0, from the gate: consent, rights, market. Never a fraction |
| Relevance | How well the source matches the question | Retrieval similarity, the only factor a model computes |

Because eligibility multiplies, a source that the gate doesn't allow scores zero however relevant it is. The model never sees it, so it can't leak it.

### Rank first, fall back to a larger token model last

1. **Rank the data.** Score every candidate row and keep the top few, with their weights.
2. **Check the threshold.** The top score must clear it, and the top rows must broadly agree with each other.
3. **If it clears:** a small model phrases what the rows say. It uses few tokens and has a low error risk, and every claim cites a row. To fix the answer, fix the row.
4. **If it doesn't:** fall back to a larger token model, with more context, more tokens and a higher cost per answer. It fills the gaps from its own weights, which is exactly where the error risk lives. Its answer is flagged as low confidence, and the record or a person confirms it before anyone acts on it.

The fallback is a deliberate trade, not a failure: you accept a bigger error risk in exchange for an answer, and you label it as such. Count how often it fires. A rising fallback rate means the evidence is missing, not that the model is too small, and the fix is a row, not a GPU.

## Context and data streams: scale by direction, tokenize last

Everything above happens before a model reads a single token. This section names that boundary. Context reaches a model from two streams that run in opposite directions and scale in opposite ways, and both should be finished (typed, gated and ranked) before the person's *intent* is turned into tokens or vectors.

![Context and data streams: scale by direction, tokenize intent last. Outbound: catalog and content from the system of record fan out through the edge cache into typed outbound context with tier, freshness and market. Inbound: events, forms and questions from people and agents fan in through the gate and a queue partitioned per subject and region, into typed inbound context holding one subject's consented state. Both meet in context assembly, which joins by key, ranks by weight, drops ineligible rows and caps the token budget. Only then is the intent, with the assembled context, tokenized or vectorized. Rules: direction sets the scaling; filter while typed; gate before embedding; tokens are the bill.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.svg) (1600 × 660) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-streams.pdf).*

| | Outbound stream | Inbound stream |
|---|---|---|
| Carries | What you publish: products, prices, policies, articles | What people and agents send: events, forms, questions, consent |
| Shape | Fans out: one source, many readers | Fans in: many sources, one record per subject |
| Scales by | Cache: more readers cost almost nothing at the edge | Partition: per subject and per region (Durable Objects, queues, one Xano instance per jurisdiction) |
| Arrives as | Claims with tier, freshness and market attached | One subject's consented state, and nothing about anyone else |
| Fails | Stale: serve the last good copy, marked with its age | Closed: no posture means no context |

**Why direction matters.** Each stream scales in its own way. Scaling the outbound stream means adding cache, not compute. Scaling the inbound stream means adding partitions, not making one database bigger. A design that sends both streams through the same pipe, such as one vector store holding catalog and customer text together, has to scale both the expensive way and loses the boundary between them.

**Why tokenize last.** *Intent* is what the person wants, and it only becomes tokens (for a model to read) or vectors (for a similarity search) at the end. Before that line the context is typed: every field still has a name, a source tier, a market and a consent state, so it can be filtered, joined and capped. After the line it is text and numbers:

- **Fields can't be filtered after they become text.** A model can be told to ignore a field, but it can't be prevented from reading it. Only typed data can be removed.
- **A vector of personal data is still personal data.** Research has shown that text embeddings can be partly inverted back to the original text. Gate before embedding, and keep each subject's vectors in their home region, never in a shared index.
- **Tokens are the bill.** Every token past the line is paid for, on every call. Context assembly caps the budget, and the ranking from the previous section decides what fits.
- **Context assembly is cheap; the model is not.** Joining by key, ranking and dropping ineligible rows run in a Worker on typed data. Doing the same work inside a prompt costs tokens and can't be audited.

Read with the funnel above: the device, gate, cache and triage stages all sit before the tokenization line. "Bind before you allocate" and "tokenize last" are the same rule seen from the cost side and from the data side.

## The thread, in one picture

![Hyperscaler vs distributed: the thread. A spectrum runs from centralized to distributed: hyperscalers (AWS, Azure, Google Cloud), neoclouds (CoreWeave), edge networks (Cloudflare, Fastly, Akamai), and the person's own device. Four questions sit along it. CoreWeave or Cloudflare: different layers, use both. Hyperscaler or distributed: keep the core central and the edge in front. Where do AEM Edge Functions run: on Fastly Compute behind Adobe's managed CDN, in beta. Can Xano distribute Kubernetes: no, one instance per jurisdiction with an edge router and gate. The answers feed an orchestration ladder and an AI binding ladder, which lead to the enterprise impact.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.svg) (1600 × 750) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-thread.pdf).*

This article began as four questions, each asked after the one before was answered. Read the diagram top to bottom: the spectrum, then the questions placed on it, then what the answers add up to.

1. **CoreWeave or Cloudflare?** Different layers. CoreWeave rents dense GPU clusters for training and serving large models. Cloudflare runs the network between users and applications: CDN, DDoS protection, DNS, a firewall, zero trust, and a developer platform (Workers, R2, D1, KV, Workers AI). A model trained or hosted on one can sit behind the other.
2. **Hyperscaler or distributed?** A hyperscaler brings the work to the data center; an edge network brings the data center to the user. Most production systems keep the core central and put the edge in front.
3. **Where do AEM Edge Functions run?** Adobe rents its edge. The functions are JavaScript modules deployed to Adobe's managed CDN, which runs on Fastly Compute, and they are reached through origin-selector rules in `cdn.yaml`. The feature is in beta.
4. **Can Xano distribute Kubernetes?** No. Xano hides its infrastructure from you, and each instance is a regional island. Distribution happens one level up: one Xano instance per jurisdiction, with an edge router and gate in front.

## One spectrum, three models

| | Hyperscaler | Neocloud (GPU cloud) | Edge network |
|---|---|---|---|
| Examples | AWS, Azure, Google Cloud | CoreWeave | Cloudflare, Fastly, Akamai |
| Footprint | Few, huge regions | Few, dense GPU sites | Hundreds of small sites |
| Optimized for | Throughput, rich state, every service in one place | Raw GPU compute | Latency, global reach, request handling |
| Typical work | Databases, data pipelines, enterprise back ends | Training, fine-tuning, large-model serving | CDN, security, edge functions, small-model inference |
| Data model | Centralized, strongly consistent | Centralized, job-scoped | Cached, replicated, eventually consistent |
| You pay in | Distance from the region; egress fees | Scarcity and commitment | Depth: little room for heavy state |

Past the edge sits the **device**: the person's own phone, laptop or console, and its GPU. It isn't a vendor's network, but it is the most distributed place compute can run, and the only one where data never travels.

The lines are blurring. Hyperscalers sell edge products such as CloudFront, Lambda@Edge and Azure Front Door, and edge networks keep adding storage, databases and GPU inference. The model you start from still decides what is cheap and what is hard.

**Rented edges.** Not every edge belongs to the vendor that sells it. AEM Edge Functions run on Fastly, and Webflow Cloud apps deploy to Cloudflare Workers through Wrangler. So "edge" in a vendor's diagram can mean someone else's network, with someone else's limits, logging and data-processing terms. Ask whose edge it is before you write consent or residency logic for it.

## The edge distributes; the system of record decides

![The edge distributes and the system of record decides. A request reaches a Cloudflare Worker that acts as router and gate. The Worker reads the subject's posture from a per-subject Durable Object, routes writes to the subject's home Xano instance (EU, US or KR, each with Postgres and a ledger), and sends only signed, gated payloads downstream. Xano pushes a projection to the Durable Object after each write. Four rules: Xano wins disagreements; fail closed; personal data stays in its home instance; the signature binds the posture and the ledger head hash.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.svg) (1600 × 760) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-gate.pdf).*

*System of record data gating* means the system of record holds the truth, and nothing leaves until a gate has checked that truth at the moment of the action.

- **One Xano instance per sovereignty boundary.** Each regional instance owns its subjects' records and its own append-only ledger. Personal data never replicates between instances. Only an opaque routing key, saying which region a subject lives in, is shared.
- **The edge does the distributing.** A Worker resolves the subject to its home region and routes there. In practice "distributed Kubernetes" is several regional Xano instances behind one global router, not one cluster stretched across regions.
- **Durable Objects are projections, not truth.** Each subject's Durable Object caches the posture derived from the ledger, so the gate can decide without a round trip. Writes go to Xano first and the Durable Object is updated afterwards. If they disagree, Xano wins.
- **The gate enforces at egress.** Before anything goes to an ad platform, a CRM or an agent tool, the Worker checks the posture, strips or blocks what it doesn't allow, and signs the decision. The signature binds the posture to the ledger head hash, so an auditor can verify what was allowed and which ledger state allowed it.
- **Fail closed.** A projection that is stale beyond its threshold, or a regional instance that can't be reached, means deny. That is what makes it a gate rather than a log.

Xano suits the system-of-record role: deterministic, auditable logic in Postgres with its own API layer. It is a poor fit for the gate itself, because it lives in a few regions and would add latency to every request. Keep the hot path in Workers and Durable Objects, and keep Xano as the slower, authoritative write path.

### Regional language weights: loaded by audience and data set, selectively to native

The same split applies to the model itself. Instead of one large model that knows every language and every market, ship a small base model plus regional pieces: a *language adapter* (a small set of extra weights, such as a LoRA, that tunes the base model for Korean or English) and a *data set* for that audience, such as a market's catalog and glossary. The edge chooses which pieces a person gets; the system of record decides which pieces may exist and who may receive them. *Native* here means the person's own device: a browser through WebGPU or Wasm, or a native app.

- **Weights are records with an owner.** Each base model, adapter and data set has a manifest row in Xano: version, language, region, the data sets it was trained on, their consent basis and license, and a retirement date. The files are immutable, named by version and hash, and stored in object storage in their home region. KV holds only the pointer to the current manifest version.
- **The audience picks the bundle.** The Worker already knows the subject's region, locale and consent posture. It resolves those to one bundle, for example base model, Korean adapter and Korean catalog, and returns signed, expiring URLs for exactly those files.
- **Load only what native needs.** An adapter is megabytes; a base model is hundreds of megabytes or more. The device downloads the base once and swaps small regional pieces, chosen by what the GPU can do, not by its part number. A device that can't run it falls back to the edge or a server.
- **What may ship to native, and what may not.** Weights trained only on public material (catalogs, translations, glossaries, product copy) can ship to any device. Weights trained on personal data can memorize it, so they are treated as personal data: they stay in their home region on the server and never ship to a device, because a download can't be recalled. A person's own context isn't baked into weights at all; it is fetched through the gate at request time and dropped at the end of the call.
- **Fail closed.** A stale manifest, a failed signature or an unclear posture means the base model with no regional data set, or no model.

A Korean shopper on `www.example.kr` gets the Korean adapter and the Korean catalog, served from the Seoul-region bucket. A US shopper on the same build gets the English adapter and the US catalog, and never receives the Korean pieces. Cloudflare R2 offers enforced jurisdictions only for the EU and FedRAMP; elsewhere, such as Asia-Pacific, a location hint is a preference, not a guarantee, so weights tied to Korean data belong in the Seoul Xano instance's own storage.

In business terms: one chain of stores, with signage and shelves stocked by market. Head office (the system of record) decides what each market may stock, the trucks (the edge) deliver it, and each store (the device) keeps only its own market's stock. A customer's personal file never goes on the shelf.

### Kubernetes and VMs limit reach, not what a model may weigh

A common assumption is that a model running in Kubernetes inside a VM can only weigh the data on that VM. It can weigh whatever it can **reach**, and the VM doesn't decide that:

- **A cluster spans many VMs.** Its nodes are VMs, and by default any pod can talk to any other pod, on any node, in plaintext.
- **Pods can leave.** Unless egress is blocked, a pod reaches the internet, and with a cloud identity it reaches the buckets, databases and model endpoints that identity allows.
- **The VM wall protects the machine, not the data.** It keeps other tenants out of your memory. It doesn't stop your own workloads reading each other.

Inside one cluster, reach is set by five controls, and the model sees only what they let through:

| Control | What it decides |
|---|---|
| Default-deny `NetworkPolicy` | Which pods may open a connection at all |
| Service mesh mTLS with workload identity | Which service is really calling |
| Authorization policy (OPA, Cedar, Istio `AuthorizationPolicy`) | Which call is allowed: this service, this method, this purpose |
| Workload identity mapped to cloud IAM | Which buckets, databases and models the pod can touch |
| An egress gateway with an allowlist | Where data may leave to |

Between VMs, clusters or clouds, data moves only through a gate, and the rules are enforced at every hop rather than carried inside the data:

1. **The sending gate decides,** in deterministic code, not a prompt: who asks, for what purpose, under which consent, in which region. It strips the fields the receiver doesn't need.
2. **The payload carries a signed label:** purpose, consent state, region, expiry and the ledger head hash that allowed it, issued for one receiver and valid briefly.
3. **The receiving gate checks again** with its own policy, and rejects anything expired, off-purpose or out of region. It doesn't take the sender's word.
4. **The model comes last.** Ranking, embedding and inference run only on what passed both gates, which is where eligibility becomes the 0-or-1 factor in the weighting.

The limit: a copy that has landed can't be recalled. Rules decide what is sent; they can't follow a copy after it arrives. So send IDs, redacted fields or the answer instead of the records; prefer expiring tokens to standing access; and use confidential VMs (AMD SEV-SNP, Intel TDX) where the host itself isn't trusted.

### The hyperscalers compared: what each controls, and what an enterprise adds

All three clouds have strong controls for data moving between workloads. Each one stops at its own edge:

| Control | AWS | Google Cloud | Azure |
|---|---|---|---|
| Org-wide guardrails | Organizations [SCPs and RCPs](https://aws.amazon.com/about-aws/whats-new/2024/11/resource-control-policies-restrict-access-aws-resources) | Organization Policy; IAM deny policies | [Azure Policy](https://learn.microsoft.com/en-us/azure/governance/policy/overview) on management groups |
| Data perimeter (nothing leaves the org) | SCPs and RCPs with `aws:ResourceOrgID`; VPC endpoint policies ([data perimeter](https://docs.aws.amazon.com/whitepapers/latest/building-a-data-perimeter-on-aws/perimeter-overview.html)) | [VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview) | Private Link; [network security perimeter](https://learn.microsoft.com/en-us/azure/private-link/network-security-perimeter-concepts) for supported PaaS services |
| Pod identity | EKS Pod Identity, IRSA | Workload Identity Federation for GKE | Microsoft Entra Workload ID on AKS |
| In-cluster network and admission policy | VPC CNI network policy; Gatekeeper or Kyverno | GKE Dataplane V2; Policy Controller | Azure CNI with Cilium; Azure Policy for AKS |
| Service to service | VPC Lattice ([App Mesh](https://docs.aws.amazon.com/app-mesh/latest/userguide/what-is-app-mesh.html) support ended 30 September 2026) | Cloud Service Mesh | Istio-based service mesh add-on |
| Application authorization | [Verified Permissions](https://docs.aws.amazon.com/verifiedpermissions/latest/userguide/what-is-avp.html) (Cedar) | No managed engine; run OPA or Cedar | No managed engine; run OPA or Cedar |
| Finding sensitive data | Macie | Sensitive Data Protection | Microsoft Purview |
| Data in use | Nitro Enclaves; SEV-SNP instances | Confidential VMs; Confidential GKE Nodes | Confidential VMs; AKS confidential nodes |
| Keys | KMS, CloudHSM, external key store | Cloud KMS, Cloud EKM | Key Vault, Managed HSM |
| Model guardrails | Bedrock Guardrails | [Model Armor](https://docs.cloud.google.com/model-armor/model-armor-vertex-integration) | Content Safety [Prompt Shields](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection) |

What none of them gives an enterprise running more than one cloud, or serving more than one jurisdiction:

- **One rule for every cloud.** Each policy language (IAM JSON, Organization Policy constraints, Azure Policy definitions, Rego) covers its own cloud. The same rule gets written three times and drifts.
- **Purpose and consent as policy inputs.** IAM answers which identity may call which API. It has no field for "this person allowed marketing use in the EU until March".
- **A decision log tied to the record.** Each cloud logs its own denials. None records which ledger state allowed a given payload to leave.
- **Rule changes without a platform engineer.** Privacy, legal and marketing operations own the rules, but the tools are infrastructure-as-code pipelines.

The per-cloud controls stay. They are the floor: they make sure nothing reaches a bucket, a cluster or a model except along the path the gate controls. The enterprise adds the layer above them.

### Policy management as a service: Webflow and Xano author, Cloudflare enforces

The missing layer can be built from the stack this article already uses, with Cloudflare at the top, in front of every hyperscaler:

| Layer | Its job | What it never does |
|---|---|---|
| **Webflow** | The policy console: pages where privacy, legal and operations read the rules in plain language and propose changes, as a Webflow Cloud app or member-gated pages | Store a rule or make a decision |
| **Xano** | The policy store: tables for purposes, data classes, regions and rules (who, what, purpose, region, consent → allow, redact or deny), each version with its author and approver, in the append-only ledger. It publishes a signed, versioned bundle | Sit in the request path |
| **Cloudflare** | Enforcement above every cloud: the gate Worker evaluates the bundle, held in Durable Objects, on every request; Access checks identity; [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) and [Workers VPC](https://developers.cloudflare.com/workers-vpc/) (in beta) reach private services in AWS, Google Cloud and Azure without public ingress; [AI Gateway](https://developers.cloudflare.com/ai-gateway/features/dlp/) applies DLP and guardrails in front of model providers; the [Data Localization Suite](https://developers.cloudflare.com/data-localization/) keeps processing in-region | Hold the truth |
| **The hyperscalers** | Run the workloads and keep the floor: perimeters, workload identity, confidential compute. Accept traffic only from the gate's path | Decide purpose or consent |

A rule change moves through it like any other record:

1. **Propose** in the Webflow console, in plain language mapped to fields.
2. **Approve** in Xano: a second person signs off, and the rule's tests run against recorded decisions before it can publish.
3. **Publish** a signed bundle with a version number. Xano pushes it to the Durable Objects; a bundle older than its threshold means deny.
4. **Enforce** at the edge on every request, before any cloud, any egress fee or any GPU.
5. **Record** each decision, signed with the bundle version and the ledger head hash, back to Xano.

Why this is the optimized version: a rule is written once and applies in front of all three clouds; the people who own the rules change them without an infrastructure pipeline, but not without review; denials happen before data reaches a cloud, which is bind before you allocate again; and an auditor reads one log.

The limits:

- **Cloudflare is another processor.** It needs a data-processing agreement, and regional processing has to be configured, not assumed.
- **Low-code isn't low review.** Every rule needs tests and a second approver; a console that publishes on save is a foot gun.
- **The gate is only as strong as the floor under it.** Anything with direct cloud credentials can go around it, so each cloud's perimeter must refuse access that didn't come through the gate's path.
- **The gate has to be the strongest code in the system:** small, deterministic and memory-safe.

### Worked example: one order, four platforms

A retailer sells on Shopify, keeps customers in Salesforce and Klaviyo, runs finance on SAP S/4HANA or Dynamics 365, and buys audiences in Google Ads. Each sits on a different cloud, and each needs a different slice of the same order:

| System | Where it runs | Needs from the order | Floor you control |
|---|---|---|---|
| **Shopify** and its Functions | Shopify's platform; Functions run inside its checkout, with no network access | A loyalty tier for the discount Function | The Function's input query: only declared fields reach it |
| **Salesforce, Klaviyo** (CRM) | SaaS, hosted on AWS | Email and an order summary, for marketing | API scopes on the integration user; your own AWS account for any export bucket, under SCPs and RCPs |
| **SAP S/4HANA or Dynamics 365** (ERP) | Azure | Full order lines and billing address, for invoicing | A private endpoint reached only through Cloudflare Tunnel; the network security perimeter and Azure Policy |
| **Google Ads** (audiences) | Google Cloud | A hashed email for Customer Match, nothing else | The BigQuery audience dataset inside a VPC Service Controls perimeter |
| **Xano** | Its regional instance | The whole record, and the rules | The system of record and the policy store |
| **Cloudflare** | Above all of them | Nothing kept | The gate Worker, Durable Objects, Tunnel and Workers VPC |

Salesforce and Klaviyo are SaaS: you don't control their AWS accounts, so there the floor is the integration's scopes and the data-processing agreement. The SCPs and RCPs apply to your AWS account, where any staging bucket or Lambda lives.

The order moves like this:

1. **Shopify sends `orders/create`.** The gate Worker verifies the HMAC on the raw body and writes the order to Xano first. Xano is the truth.
2. **The gate reads the customer's posture** from their Durable Object: consent per purpose (including Consent Mode v2's `ad_user_data` and `ad_personalization`), home region, and the bundle version.
3. **It applies one rule per destination,** all from the same published bundle:

| Destination | Allowed when | Fields sent | Otherwise |
|---|---|---|---|
| ERP on Azure | Always: the contract needs an invoice | Order lines, billing address, tax IDs | n/a |
| CRM on AWS | Marketing consent granted for this region | Email, order total, product categories | Transactional fields only; no marketing profile |
| Google Ads on Google Cloud | `ad_user_data` and `ad_personalization` both granted | A SHA-256 hash of the normalized email | Nothing |
| Workers AI segmenting | Analytics consent granted | A pseudonymous ID and category counts | Aggregate counts only |
| Back to Shopify | Always | A `loyalty_tier` metafield computed from ERP and CRM totals | n/a |

4. **Each payload is signed** with the bundle version and the ledger head hash, and sent over its own path: Workers VPC to the ERP's private endpoint, the CRM's API with a scoped token, the audience upload into the perimeter-protected dataset.
5. **Checkout enforces without a network call.** At the next purchase, the Shopify discount Function reads `loyalty_tier` through its input query. It never sees the email, the address or the CRM. The decision was made at the gate; the Function only applies it.

When marketing consent is withdrawn, one rule record changes in Xano, a new bundle publishes, and every flow above changes on the next request: the CRM stops receiving profiles, Google Ads gets nothing, and the ERP keeps invoicing. Nobody edits three clouds' IAM.

The platforms themselves already work this way. `shopify.dev` and the Shopify Dev Dashboard answer from Cloudflare (`server: cloudflare`), while Shopify's DNS steers other hosts, such as the Partner Dashboard, to a Google edge in front of its Google Cloud core. Hydrogen storefronts on Oxygen run on Cloudflare: [Shopify's own write-up](https://shopify.engineering/how-we-built-oxygen) describes a gateway Worker that routes each request with Workers for Platforms' dynamic dispatch. Webflow Cloud apps run on the [Cloudflare Workers runtime](https://developers.webflow.com/webflow-cloud/environment). Cloudflare on top of a hyperscaler isn't an add-on to this stack; it is how the stack's own vendors are built.

### One Worker, any theme: a Webflow export and a Shopify theme with the same permissions

Because the gate is its own origin with one contract, the page in front of it is interchangeable. A vanilla Webflow export (HTML, CSS and JavaScript, with no Webflow CMS or form backend behind it) can be served from `webflow.io`, a custom domain, a `.kr` domain, or rebuilt as a Shopify native theme, and it behaves identically. The page holds no token, no rule and no reasoning. It loads one component and calls the Worker; the Worker and Xano decide what that visitor may see and do. Moving the page to another domain changes one allowlist row, not the code.

There are two doors into the same Worker, and both end at the same subject in Xano and the same rules:

| Door | Used by | How the Worker knows who is calling |
|---|---|---|
| **CORS** | The Webflow export on any domain; a Shopify theme calling the Worker's own domain | The `Origin` header, matched against the published allowlist; the visitor's session token |
| **Shopify App Proxy** | A Shopify theme calling `/apps/crm/...` on the store's own domain | Shopify's HMAC `signature` on the query string, and `logged_in_customer_id` |

**The allowlist is a policy record, not a config file.** It lives in Xano with the other rules and ships in the same signed bundle. Each row says what one origin may do:

```json
{ "origins": [
  { "origin": "https://example.webflow.io", "host": "webflow",         "consent": "crm-sync-banner",          "region": "US", "kakao_registered": false },
  { "origin": "https://shop.example.com",   "host": "shopify-proxy",   "path": "/apps/crm", "consent": "shopify-customer-privacy", "region": "US", "kakao_registered": true },
  { "origin": "https://www.example.kr",     "host": "webflow-export",  "consent": "crm-sync-banner",          "region": "KR", "kakao_registered": true }
] }
```

- **`consent`** names where the visitor's choice comes from: your own banner on a Webflow page, or Shopify's Customer Privacy API in a theme. The gate reads the right one per origin, so the same rule sees the same answer.
- **`region`** routes the subject to its home Xano instance. A Korean origin goes to the Seoul instance, with consent to the cross-border transfer captured before anything leaves it.
- **`kakao_registered`** mirrors a list the Worker doesn't control. Kakao Pay checks that the `approval_url`, `cancel_url` and `fail_url` it redirects to are on a domain registered for the merchant in the [Kakao Pay developer center](https://developers.kakaopay.com/). The gate builds those URLs only from rows marked `true`, so an unregistered domain is refused the Kakao Pay rail at the gate, with a clear reason, instead of failing at Kakao mid-payment. Adding a domain is a two-place change: the Xano row and Kakao's console.

```js
// CORS door: an exact match from the bundle. Never reflect an Origin that isn't listed.
const entry = bundle.origins.find((o) => o.origin === request.headers.get("Origin"));
if (!entry) return new Response(null, { status: 403 });
const cors = { "Access-Control-Allow-Origin": entry.origin, "Vary": "Origin" };

// Kakao Pay redirects go only to a domain Kakao has on file for the merchant.
if (rail === "kakaopay" && !entry.kakao_registered) return deny("kakao_domain_not_registered");
const kakaoBase = entry.origin + (entry.path || "");
```

**The App Proxy door, verified in the Worker.** A Shopify theme can call `https://shop.example.com/apps/crm/...` on its own domain; Shopify forwards it to the Worker and [signs the query string](https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies). The Worker recomputes the signature with the app's secret before anything else:

```js
// Shopify App Proxy: drop `signature`, join repeated keys with commas, sort the "k=v" pairs,
// concatenate with no separator, HMAC-SHA256 with the app secret, compare in constant time.
async function verifyAppProxy(url, secret) {
  const q = new URLSearchParams(url.search);
  const sig = q.get("signature") || "";
  q.delete("signature");
  const vals = {};
  for (const [k, v] of q) (vals[k] ??= []).push(v);
  const msg = Object.keys(vals).map((k) => `${k}=${vals[k].join(",")}`).sort().join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  const fresh = Math.abs(Date.now() / 1000 - Number(q.get("timestamp"))) < 300;
  const a = enc.encode(mac), b = enc.encode(sig);
  return fresh && a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}
```

A valid signature proves Shopify sent the request, not that the customer owns the data asked for: the Worker still checks that `logged_in_customer_id` maps to the subject whose records it returns. Three App Proxy facts shape the design. Shopify strips `Set-Cookie` from proxy responses, so the session is the signed parameters, not a cookie. A response sent as `Content-Type: application/liquid` is rendered inside the store's theme. And merchants can rename the proxy path, so links are built from the `path_prefix` parameter, never hard-coded.

What this keeps constant, whichever page is in front:

- **Permissions.** Every request is decided by the gate against the same bundle. The theme can't grant itself anything.
- **Data reasoning.** Eligibility, ranking and model calls run in the Worker and Xano. The page receives decisions and allowed fields, never the records the decision was made from.
- **Audit.** Every door writes the same signed decision, with the bundle version and the ledger head hash, to the same ledger.

See [Fragments for any frontend](https://persephonepunch.github.io/crm-sync-setup/fragments-any-frontend.html) for the component side of the same idea.

### Sandbox before on-prem: a smaller perimeter, owned privately

Data from outside (a partner feed, an agent's output, an upload, a SaaS export) shouldn't land on-prem as it arrives. It lands first in a sandbox that can reach nothing, is restricted there, and only the reduced, labeled result is let in. The on-prem perimeter shrinks because less data, from fewer systems, ever reaches it, and what does arrive is managed privately by the internal teams that own it.

| Stage | Where | What happens |
|---|---|---|
| **1. Land** | A private R2 bucket and a Queue, written only by the gate Worker | Raw data arrives in a zone with no route to on-prem and no credentials for anything else. The Worker deletes each object once it is promoted or rejected; an [R2 lifecycle rule](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) removes anything left after a day. |
| **2. Restrict** | Workers, with rules from Xano | Schema and size checks; files parsed by memory-safe parsers; data classification; the consent and purpose check; personal fields redacted or tokenized |
| **3. Label** | The gate | Each record that passes is signed with its data class, purpose, region and bundle version. A record that fails stays in the sandbox with its reason, for its owner to review. Nothing is dropped silently. |
| **4. Promote** | On-prem pulls; nothing pushes in | An on-prem service pulls labeled records from a [Queues pull consumer](https://developers.cloudflare.com/queues/configuration/pull-consumers/) over outbound HTTPS and acknowledges them. Its API token is [limited to the on-prem egress addresses](https://developers.cloudflare.com/fundamentals/api/how-to/restrict-tokens/) and expires. On-prem opens no inbound port. |
| **5. Own** | On-prem, by internal stakeholders | Each data domain has a named internal owner. Only reduced fields arrive, so fewer people need access, and no outside processor handles the result. |

A Queue message holds at most 128 KB, so a reduced record travels in the message itself; anything larger stays in the sandbox and the message carries a short-lived link to it.

What it buys:

- **A smaller audit scope.** Card and identity numbers tokenized in the sandbox never reach on-prem, which can keep those systems out of PCI DSS scope and its equivalents.
- **Residency.** The sandbox runs in-region; only what may move ever reaches the site.
- **Clear ownership.** Internal stakeholders manage a smaller, already-labeled set instead of triaging raw feeds.
- **One direction.** On-prem asks; nothing can push into it. In practice that behaves like a data diode.

Where it breaks:

- **The sandbox holds the raw data.** It needs the strictest controls of all: short retention, encryption, service-only access, no person browsing it, and a data-processing agreement for the provider it runs on. If that is too much, run the sandbox in an on-prem DMZ instead.
- **Private isn't safe by itself.** A smaller perimeter reduces exposure to outsiders, not insiders. Internal teams still need least-privilege roles, access logs and patching.
- **Keep the token vault apart.** If the table that maps tokens back to real values sits beside the tokenized data on-prem, the original data has been rebuilt with extra steps.
- **Promotion rules are policy.** They are versioned, tested and approved in Xano like every other rule, not hard-coded in a Worker.

### An AI strategy is not a JVM: permissions as architecture

Java tried to secure code from inside one shared runtime. Everything ran in the JVM, trusted by default, and a Security Manager checked permissions from within. Few applications used it, and it never became the boundary it was meant to be: Java deprecated it in [JEP 411](https://openjdk.org/jeps/411) and permanently disabled it in JDK 24 with [JEP 486](https://openjdk.org/jeps/486). Isolation moved out of the runtime, to processes, containers and services.

Many AI strategies are repeating the JVM's design. One model or agent platform becomes the runtime, it is connected to the CRM, the ERP, the ad accounts and the file shares, and safety is a layer inside it: a system prompt, a guardrail model, an instruction not to. That is a security manager written in English, and it fails the same way: whatever gets inside inherits everything the runtime can reach.

**Security for AI is permissions as architecture.** The model is a component with no authority of its own. Every capability it uses is a separate, explicit grant, issued and checked at a barrier outside it:

| | AI as a runtime (the JVM pattern) | Permissions as architecture |
|---|---|---|
| Where authority lives | In the platform the model runs in | In gates outside the model |
| Default | Connected to everything; prompts say "don't" | Connected to nothing; each tool, field, purpose and region is granted |
| How a rule holds | An instruction or a guardrail model, which can be argued with | Deterministic code, which can't |
| One prompt injection reaches | Every system the platform can reach | Only what that one call was granted |
| Changing a rule | Re-prompt, re-tune, redeploy | Change a policy row; the next request follows it |
| What an auditor reads | What the model said | What it was allowed to do, signed, with the ledger state that allowed it |

The least-privilege barrier has the same properties everywhere in this article: deny by default; grants per call, per purpose, per field and per region; expiry on every grant; a signature on every decision; fail closed when the policy or the ledger can't be read; and the gate written as the smallest, most deterministic, memory-safe code in the system. The model can be as capable as you like behind that barrier, because capability is not authority.

The concern people have about AI is pointing at a real problem: ambient authority, a system that can reach more than any one task needs. The answer isn't a better-behaved model. It is a structure in which behavior doesn't decide what can be reached.

### Stack and heap: a memory model for data and permissions

Programs keep data in two kinds of memory, and the split between them is a useful model for both data modeling and permissions.

- **The stack** holds the data for one function call: its local variables, of a size known in advance. It is set up when the call starts and freed automatically, all at once, when the call returns. It is fast and private to the call.
- **The heap** holds data that has to outlive the call, or whose size isn't known in advance. It is allocated on request and reached through references, so many parts of a program can share it. Something has to decide when it is freed: an owner in Rust, a garbage collector in Java and JavaScript, the programmer in C.

Most memory bugs live at the boundary. Use-after-free, double free and leaks are heap bugs: the question of who owns the memory, and when it ends, was answered wrongly. The worst stack bug is a reference that **escapes**: a pointer to a call's local data kept after the call has returned. Rust refuses to compile that, with the error "[borrowed value does not live long enough](https://doc.rust-lang.org/error_codes/E0597.html)" ([the stack and the heap](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#the-stack-and-the-heap), in the Rust Book).

The same split, applied to the systems in this article:

| | Memory | Data modeling | Permissions |
|---|---|---|---|
| **Stack** | Lives for one call; freed on return; private to the call | The request's working set: the decoded token, the consent decision, decrypted fields, the context assembled for one model call | A grant issued for this request, which expires with it |
| **Heap** | Outlives the call; shared by reference; needs an owner | Records in the system of record, caches, queues, logs, embeddings | Standing access: roles, service accounts, long-lived tokens |
| **Ownership** | One owner decides when the memory ends | Each record has one system of record that may change or delete it | Each standing grant has one owner who can revoke it |
| **Escape** | A reference outlives its frame | Request data written into a log, a cache, KV or a vector index | A per-call token stored and reused later |

The rules that follow:

- **Keep sensitive data stack-shaped.** Decrypt, use and drop it inside the call. A decision about one request should leave nothing behind but the signed decision.
- **Promote to the heap only on purpose.** Writing request data into a lasting store is a promotion, and it goes through the gate with a label, the same way the sandbox promotes records to on-prem.
- **Give everything on the heap an owner, a lifetime and a reader list.** A record without an owner can't be deleted on request; one without an expiry is kept forever; one without a reader list is readable by anyone who finds it.
- **Block escapes in the types, not in review.** Rust stops a reference outliving its frame at compile time. In a service, the equivalents are a `Pii<T>` wrapper that can't be serialized or logged, [`zeroize`](https://docs.rs/zeroize/latest/zeroize/) on secrets when they go out of scope, and a gate that is the only code allowed to write to a lasting store.

For AI the mapping is direct. A model's context window is stack: assembled for one call, from what the gate allowed, and gone when the call ends. Long-term memory, fine-tuning data and embeddings are heap: they outlive the conversation, so each needs an owner, a region, the consent it was made under and a way to delete it. Most AI data leaks are escapes, where something placed in one call's context ends up in a store that outlives it.

#### In business terms: who clears the file room

Picture a company handling paperwork.

- **The stack is a meeting whiteboard.** Everything on it is for one meeting, one function call. When the meeting ends the board is wiped, automatically and completely. It is fast and private, and nothing on it survives the meeting.
- **The heap is the shared file room.** Anything that has to outlast the meeting goes into a folder there, and people across the company can be handed a slip saying where it is. The hard questions all live in the file room: who may open a folder, who may change it, and who throws it away, and when.
- **Ownership answers "who throws it away?"** Every folder has exactly one accountable owner, and it is shredded when the owner is done. Others can be lent access: many people may read, or one may edit, never both at once.

Each language runs the file room differently:

| Language | Who clears the file room | In business terms | What goes wrong |
|---|---|---|---|
| **C** | The programmer, folder by folder | No records policy: every employee shreds their own files | Forget, and storage fills up (a leak). Shred too early, and someone works from a destroyed file, which is how most serious security bugs are exploited. |
| **Java** | A garbage collector sweeps periodically, removing what nobody refers to | Facilities staff dispose of files on their own schedule | Nothing in use is shredded, so that class of bug is gone. Cleanup costs extra space and occasional pauses, and a secret can't be guaranteed destroyed on time: the crew may have copied it while tidying. |
| **Python** | Each object counts who uses it and is freed at zero; a collector handles circular cases | A sign-out sheet on every folder | Safe for ordinary code, but much of Python's speed comes from libraries written in C, such as NumPy and image and model loaders, so C's risks sit underneath. |
| **JavaScript and Next.js** | A garbage collector in V8, like Java's | The same facilities crew | Memory corruption isn't the main business risk; data lifetime is. A long-running server keeps anything stored outside a request alive across requests, so one customer's data can reach the next, and data rendered on the server is copied into the page sent to the browser. Both are escapes. |
| **Rust** | Nobody sweeps; the ownership rules are checked before the software ships | An auditor approves the records plan before the company opens | Every folder has one owner and is shredded the moment the owner is done. A plan that could shred a file in use, or keep a slip to a wiped whiteboard, is rejected at build time rather than found in production. |

The trade, for a business: C is fast and cheap to run and expensive when it fails, because its mistakes surface as breaches. Java, Python and JavaScript buy safety at runtime, paid for in memory and pauses, and give up control over *when* data is destroyed. Rust buys safety at build time: more effort up front, then no cleanup overhead, predictable disposal, and secrets wiped exactly when their owner finishes.

Most organizations run their data the Java way: a retention job sweeps eventually. Permissions as architecture runs it the Rust way. Each record has an owner, a lifetime and access rules decided before it is stored, and the system enforces them instead of people remembering to.

### Immutable and dynamic data: what goes in KV, and what doesn't

Workers KV is built for data that is read constantly and written rarely. A write is visible at once in the location that made it, and [can take up to 60 seconds](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) (or the reader's `cacheTtl`) to appear everywhere else; two writes to the same key race, and the last one wins. KV also has no [jurisdiction restriction](https://developers.cloudflare.com/data-localization/compatibility/) for where its values are stored. So the dividing line is whether the value changes, and whether a reader acting on the old value causes harm:

| Data | Changes | Where it belongs | Why |
|---|---|---|---|
| A published policy bundle, keyed by version (`policy:v42`) | Never; a new version gets a new key | KV | Immutable: every location agrees, however late it reads |
| The pointer to the current version (`policy:current`) | Rarely | KV, with the stale-bundle threshold in the gate | A reader that lags a minute uses the previous version, which was also signed and valid |
| Allowlists, translations, the docs index | Rarely | KV | Read on every request; a short lag is harmless |
| Revoked tokens (a denylist that expires with the token) | Write once | KV | Each entry is written once and never edited; the up-to-60-second gap between locations is a known, stated window |
| Consent, entitlements, a checkout in progress, idempotency keys, counters | Constantly | A Durable Object per subject, or Xano | Needs one consistent answer now; KV's last-write-wins and lag would let two requests both pass |
| Personal data | Varies | Xano in the subject's region, or a Durable Object restricted to a jurisdiction | KV can't be pinned to a jurisdiction |

The rule: in KV, write new keys instead of changing old ones, and name them by version. Anything that must be current, per person, or kept in a region goes to a Durable Object or to Xano.

### Claims and extras: layered permissions for people

Signing in proves who someone is. It shouldn't decide everything they may do. CRM Sync's `/auth/me` keeps identity, profile and permission in separate layers, and each layer can only narrow what the one before it allows:

| Layer | Holds | Changes | Lives in |
|---|---|---|---|
| **Token** | The subject ID and an expiry, signed | Never during its life; revoked on logout | The JWT, checked by the Worker; revocations in a KV denylist |
| **Account status** | Active or deleted | Rarely | Xano, checked before anything else runs |
| **Claims** | Identity links: the Google subject, the Shopify customer ID | Rarely; reconciled at sign-in | Xano, `user_claims` |
| **Extras** | Profile and preference fields | Often; cleared when marketing consent is withdrawn | Xano, `user_extras` |
| **Entitlement** | What this person may use: roles and capability caps | When they buy, are granted or lose access | Xano, returned to the page as a hint only |
| **The decision** | Whether this call, for this purpose, is allowed | Every request | The gate Worker |

Four design rules come out of it:

- **The token proves identity, nothing more.** Roles and preferences aren't baked into it, because a seven-day token can't take back a permission withdrawn on day two.
- **Check status before any write.** A deleted account is refused before any identity reconciliation runs. On 31 August 2026 the order was reversed, and a stale token for a deleted account created a real Shopify customer on every call.
- **Extras follow consent.** Profile fields that exist for marketing are cleared when marketing consent is withdrawn. Transactional records stay, because they rest on the contract, not on consent.
- **The page hides; the Worker decides.** Entitlements reach the page so it can hide controls a person can't use. Hiding is a convenience. Every request is still decided at the gate.

Agents get none of this by default. An agent acts under a mandate issued for a task, with its own cap and expiry, never under the person's sign-in.

### `Arc`, row gating, claims and extras: who may share what

Rust's `Arc<T>` (*atomically reference counted*) lets many parts of a program share one value in memory. `Arc::clone` doesn't copy the data; it hands out another handle and adds one to a counter. When the last handle is dropped, the counter reaches zero and the value is freed, with no garbage collector. An `Arc` is read-only by default; changing the value needs a lock, `Arc<Mutex<T>>`, so only one holder writes at a time, and the compiler won't let you skip it. (Rust Workers run as single-threaded Wasm, where the non-atomic `Rc` is usually enough; `Arc` matters when threads really share data.)

In the file-room picture, an `Arc` is one master document with a sign-out sheet: everyone gets a handle to the same copy, the sheet counts who still holds one, and the last one to hand it back shreds it. What an `Arc` doesn't have is a clerk. Holding a handle *is* the permission. That is the whole difference from the system of record.

**`Arc` against row-based gating.** Row-based gating checks every read: in Xano, an endpoint that requires authentication and filters each query on `$auth.id`; in Postgres, a row-level security policy. Each row comes back only to its owner or to a role allowed to see it.

| | `Arc` (shared in memory) | Row-based gating (Xano, Postgres) |
|---|---|---|
| When access is checked | Once, before the value is shared | On every read |
| Granularity | The whole value | Per row, and per field through the response shape |
| Who can read | Anyone holding a handle | Only the row's owner, or a role allowed to read it |
| How long it lasts | Until the last handle is dropped, or the process stops | Until a rule or a person deletes it |
| History | None: an overwritten value is gone | Ledger and audit log |
| Right for | Data that is the same for every request: the verified policy bundle, the field allowlist, the public keys that verify tokens, a parsed schema | Data that belongs to someone: orders, consent, profiles |
| How it fails | A handle in the wrong place exposes the whole value | A query that forgets the filter returns everyone's rows. Keep the filter in one shared function, and test it |

The rule that joins them: **an `Arc` may hold only data that every reader would pass the row gate for**, which means data no person owns. Load it once, verify it, share it, and replace it with a new version rather than editing it, the same rule KV follows.

**`Arc` against claims and extras.** Each layer of `/auth/me` has a different owner and lifetime, so each belongs in a different kind of memory:

| Layer | Shared in an `Arc`? | Where it belongs instead | Why |
|---|---|---|---|
| Policy bundle, allowlist, token-verifying keys | **Yes** | Loaded once per version | The same for everyone, and immutable |
| The verified token | No | The request: stack-shaped, dropped at the end of the call | It belongs to one caller and expires |
| Account status | No | Read fresh from Xano before any write | A cached status is how a deleted account kept creating customers on 31 August 2026 |
| Claims (`user_claims`) | No | The request, after the gate reads them from Xano | Identity links are personal data |
| Extras (`user_extras`) | No | Xano, read per request through the row gate | Personal, change often, and are cleared when consent is withdrawn; a shared copy would outlive the withdrawal |
| Entitlement | No | A per-subject Durable Object, as a projection of Xano | Must reflect a revocation now, not when the last handle is dropped |
| The decision | No | The request, signed, then gone | It answers one call, for one purpose |

In business terms: the `Arc` is the rules posted on the wall, which everyone may read and nobody signs out. Claims are the badge that says who you are. Extras are the preferences card inside your own folder. Row gating is the clerk who checks your badge every time you ask for a folder. Post only rules on the wall; anything with a person's name on it goes through the clerk.

### OneTrust is a session log for one domain

A consent banner such as OneTrust works like a hosted key-value session log: it records what this browser chose on this site, in the `OptanonConsent` cookie and, with consent logging turned on, in OneTrust's cloud. That suits one website. It doesn't stretch across many:

- **Each domain is configured separately.** Every domain loads its own OneTrust script with its own domain ID, and an anonymous visitor's choice stays with that domain.
- **Sharing needs a known person.** [Cross-domain consent](https://developer.onetrust.com/onetrust/docs/cross-domain-cross-device) works only once the visitor is identified: your team passes a user ID, signs a JWT with that ID as its subject, uploads the public key to OneTrust, creates a Consent Group, and turns on records of consent in the geolocation rule.
- **Some callers have no browser.** An App Proxy request, a server-to-server feed, an agent or a model call never shows a banner or carries its cookie.

So horizontal scale (more domains, more storefronts, more agents) can't rest on the banner. Consent has to become part of the data design that the AI services read:

1. **Treat the banner as one input.** OneTrust on one site, Shopify's Customer Privacy API in a theme, your own banner on a Webflow export: each origin's allowlist row names its source.
2. **Normalize into the subject's posture.** The gate records every choice in Xano with its source, time and region, and projects the result into the subject's Durable Object.
3. **Read posture, not cookies.** Pages, agents, feeds and model calls all ask the same posture, so a choice made on one domain applies on every other once the person is known.
4. **Withdrawals apply everywhere.** A withdrawal from any source takes effect across all of them on the next request.

The identity layer above already signs JWTs, so the same subject ID can be passed to OneTrust when its own cross-domain profile is wanted. OneTrust then mirrors the posture; it doesn't replace it.

## The decision ladders

![Two decision ladders. Orchestration, bottom to top: Webflow publish; Cloudflare Worker; Durable Object; Xano as the system of record; hyperscaler or BYOC cluster. AI binding, bottom to top: no model; Workers AI binding; AI Gateway to a hosted model; agent with tools on Xano; dedicated GPUs. Each rung names the condition that earns the next. Rules on every rung: Xano wins disagreements, fail closed when the projection is stale, personal data stays home, data leaves only through the signed gate.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.svg) (1600 × 770) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-ladders.pdf).*

Start every decision at rung 0 and climb only when the *climb when* condition is true. Each rung adds cost, latency or audit scope, so a decision made higher than it needs to be is paying for something it doesn't use.

### Orchestration: where the logic runs

| Rung | Runs on | Use it for | Climb when… | What it gives up |
|---|---|---|---|---|
| 0 | Webflow publish | Pages, CMS collections, static output from a CDN | A request needs a decision, not a page | Per-request logic |
| 1 | Cloudflare Worker | Routing, caching, auth and consent checks, the gate | The decision needs memory of one subject | Durable state |
| 2 | Durable Object | Per-subject posture, rate limits, coordination | The action must change the record | Authority: it is a projection |
| 3 | Xano, the system of record | Business rules, Postgres, the append-only ledger, one instance per region | One instance can't meet residency or load | Edge latency |
| 4 | Hyperscaler or BYOC cluster | Xano Enterprise in your own AWS, Azure or Google Cloud account; warehouses; batch | A contract or a regulator requires it | Simplicity: you now run accounts, networks and licences |

### AI binding: where the model runs, and what it may touch

| Rung | Runs on | Use it for | Climb when… | What it gives up |
|---|---|---|---|---|
| 0 | No model | Deterministic rules in a Worker or a Xano function | The input is language, images or a fuzzy match | Nothing; start here |
| 1 | Workers AI binding (`env.AI`) | Small models at the edge: classify, embed, moderate, translate | The task needs a frontier model | Model size |
| 2 | AI Gateway to a hosted model | Claude, Gemini or GPT behind one gateway with logs, caching and rate limits | The model must read or write records | Data stays outside the model, so it also has no context |
| 3 | Agent with tools on Xano | Tool calls to Xano endpoints, each write passing the gate under a mandate | Hosted models fail on cost, privacy or tuning | A smaller audit scope: the model now acts |
| 4 | Dedicated GPUs | Self-hosting, fine-tuning or training on neocloud or hyperscaler GPUs | The model weights are the product | Operational simplicity and a variable bill |

Rung 4 has a sideways exit. When the work is small and parallel rather than a large model, portable GPU bytecode can run on the user's device or your own server instead of a rented cluster. That keeps the data where it is, at the cost of the maturity limits above.

The ladders are independent. A Webflow page (orchestration rung 0) can call an edge classifier (AI rung 1), and a Xano agent (AI rung 3) still answers to the gate at orchestration rung 1. What they share is the four rules in the band under the diagram.

## Media, 3D render and the GPU

![Media, 3D render and the GPU: where each step runs and what protects it. Three workloads across five places, from closest to the person to closest to the GPU. Images: client preview on the device; Cloudflare Images transforms at the edge; a private original in R2 or S3, with Xano holding the record and key; batch processing in C with libvips or ImageMagick pods on Kubernetes; Adobe Firefly Services as a hosted API. 3D game render: real-time render on the player's GPU through WebGPU or native code; glTF and KTX2 asset delivery from the edge; an asset catalog in the system of record; build and bake jobs on Kubernetes with the GPU Operator; offline or streamed rendering on CoreWeave- or OCI-class GPUs. AI media: on-device models; Workers AI at the edge; consent and rights in the system of record; self-hosted models on GPU node pools; hosted generative APIs. Protection rules: base64 is not protection; Kubernetes Secrets are only base64 by default, so enable encryption at rest; lock down ImageMagick with policy.xml; strip EXIF and use signed, expiring URLs.](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.svg) (1600 × 774) · [Download the image](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.jpg) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/hyperscaler-vs-distributed-media.pdf).*

Media is where the spectrum costs the most, because the payloads are large and they often carry people: faces, voices, locations. Read the grid left to right. The further right a step runs, the further the file travels and the more systems hold a copy. The heavy boxes on the left are the only places where the media never leaves the person's device.

### Media ladder

| Rung | Runs on | Use it for | Climb when… | What it gives up |
|---|---|---|---|---|
| 0 | The device | Previews, real-time 3D on the player's GPU, small on-device models | The work needs the original, or more GPU than the device has | Nothing leaves, so nothing to protect in transit |
| 1 | The edge | Resize, format and crop on request; cached asset delivery; Workers AI captions and moderation | The job is a batch, or needs a library the edge can't run | No GPU for your own code; CPU time limits |
| 2 | Kubernetes, CPU pods | libvips or ImageMagick batches in C; texture compression; bakes | The work is parallel enough to need a GPU | You now run the cluster and its secrets |
| 3 | Kubernetes, GPU pods | Lightmaps, upscaling, self-hosted image models, through the NVIDIA GPU Operator | Steady demand beats a rented cluster, or the GPUs you need aren't available | Media stays in your account, but you buy the capacity |
| 4 | Hosted GPU or API | Render farms and pixel streaming on CoreWeave- or OCI-class GPUs; Adobe Firefly Services | Only when the scale or the feature can't be had lower down | The file leaves your boundary under someone else's retention terms |

### Four terms the grid relies on

- **ImageMagick.** An open-source image library and toolset, written in C, from ImageMagick Studio. It isn't an Adobe product. Adobe's hosted equivalents are the Photoshop and Lightroom APIs in Firefly Services. ImageMagick reads hundreds of formats, and that breadth is its risk: a crafted file can reach a coder you never meant to use, as ImageTragick did in 2016. Run it with a `policy.xml` that allows only the formats you accept and caps memory, time and pixel count, and run it in a pod with no network access to the rest of the system.
- **C-level render optimization.** Making the native layer do less work, rather than adding hardware. In practice: decode once and stream in tiles instead of loading whole images (libvips works this way, and for resize pipelines it is usually faster and lighter on memory than ImageMagick), keep pixels in one buffer instead of copying between libraries, encode straight to the delivery format (AVIF or WebP for images, KTX2 for textures), and never re-encode an already-compressed file. Only move work to a GPU when it is parallel enough to repay the transfer. Resizing a single image rarely is; a lightmap bake or an upscaling model usually is.
- **base64.** A way to write bytes as text. It makes a file about a third larger and protects nothing: anyone who can read the text can decode it. Don't put media in base64 inside JSON, KV or the CMS. Store the binary in a private bucket and pass a signed, expiring URL.
- **Kubernetes Secrets.** By default these are only base64-encoded in etcd, not encrypted. Protected data in a cluster needs encryption at rest turned on (or an external KMS provider), RBAC that limits who can read Secrets, and media credentials scoped to one bucket and one job. CoreWeave runs its GPUs as a Kubernetes service, and Oracle's OKE runs GPU node pools, so the same rule applies whether the cluster is yours or rented.

**3D game render.** Real-time rendering belongs on the player's GPU. WebGPU in the browser takes WGSL shaders, and native engines take SPIR-V, which is where the Rust-to-bytecode path from the opening section is most useful. The edge delivers assets (glTF meshes, KTX2 textures) and never renders. The cluster bakes and compresses. Rented GPUs earn their place only for offline render farms, or for pixel streaming, when the player's device can't render the scene at all. The asset catalog in the system of record decides who receives which asset version under which licence, through the same gate as any other data.

### The 3D viewport: load out of sight, show only finished frames

A 3D viewport in a page works like the gate: the data is prepared out of sight and released to the visible layer only when it is complete. The person sees finished frames, never the work.

**Step 1: compress for the trip.** Three kinds of compression save bytes in three different places:

| Layer | Standard | What it saves | Still compressed on the GPU? |
|---|---|---|---|
| Mesh geometry | Draco (Google's library) or meshopt, carried inside glTF through Khronos extensions | Download size, often 5 to 10 times smaller | No. It is decoded to plain vertex buffers first |
| Textures | KTX2 with Basis Universal (Khronos) | Download size and GPU memory | Yes. It is converted into formats the GPU reads directly (BC7, ASTC, ETC2) |
| The program | SPIR-V or WGSL | Portability | It is compiled, not compressed |

Draco helps the download, not the drawing: the GPU never sees it. It is also lossy, since it rounds coordinates to fewer bits. That is fine for showing a product or a room, and wrong for engineering data. Use it on the display copy of a CAD model, and keep the STEP or native CAD file as the system of record.

**Step 2: load out of sight, show finished.** A 3D frame passes through five stages, and only the last is visible:

1. **Fetch** the glTF, Draco and KTX2 files from the edge.
2. **Decode** off the main thread: Three.js's `DRACOLoader` runs a Wasm decoder in a Web Worker, so the page keeps responding.
3. **Upload** the decoded buffers and textures to the GPU.
4. **Draw** into a *back buffer*, an off-screen frame. With `OffscreenCanvas`, a worker can do this away from the page's main thread.
5. **Present.** On the display's beat, the finished back buffer swaps to the front and the compositor layers it into the page.

**Shadow DOM is the boundary, not the backstage.** A *Shadow DOM* is a web component's private subtree: page styles and scripts can't rearrange what's inside by accident, which is how Google's `<model-viewer>` packages its canvas. It does not hide or delay anything; a component's shadow content renders like any other. The off-screen staging is the back buffer and the worker. Two cautions: a closed shadow root is encapsulation, not security, since other scripts on the page can still reach it; and what is hidden from the eye is not hidden from a machine reader. Shadow content is in the accessibility tree, and an agent reading the page reads it.

**The same pattern in a browser, an app and an operating system.** *Code* computes what the next frame should be; *animation* is the frames changing over time; the *frame rate* is how often the visible layer is allowed to change.

| | Browser | Native app | Operating system |
|---|---|---|---|
| The sealed component | A web component with a Shadow DOM | A view or scene with its own state | A process, isolated from other processes |
| Off-screen work | Web Worker, `OffscreenCanvas`, the WebGL or WebGPU back buffer | Background and render threads, the swap chain's back buffer (Metal, Vulkan, DirectX) | Each app's window drawn to its own off-screen surface |
| The beat that releases a frame | `requestAnimationFrame` | `CADisplayLink` on iOS, `Choreographer` on Android | The compositor (Windows DWM, macOS WindowServer, a Wayland compositor) on the display's refresh |
| The visible layer | The page's composited layers | The app's window | The screen |

The frame rate sets the budget. At 60 Hz each frame has 16.7 ms; at 120 Hz, 8.3 ms. In a browser, JavaScript, layout and drawing all share that budget on the main thread, so decoding a large mesh there misses frames, which the person sees as stutter. Moving the work to a worker, compressing what crosses the network, and drawing into a back buffer keeps the visible layer on the beat.

In business terms: a theater. The crew sets the next scene backstage (the worker and the back buffer) while the audience watches the current one. The stage manager calls the change on the beat (the display refresh), and the curtain opens only on a finished set. A Shadow DOM is a set piece built by its own crew, which the rest of the production can't rearrange. It isn't locked against the audience. The frame rate is how many scene changes the show promises each second.

The same rule runs through this article: prepare and check out of sight, release only finished and permitted work to the visible layer, and keep the budget for each release small enough to hit.

### Strip before egress

The media grid's last box is one rule: **clean the file before it leaves, and hand it out only through a link that expires.** *Egress* is data leaving your system: a photo sent to a customer, a partner, a CDN, a model or a social platform.

**Remove EXIF GPS and device IDs.** Phones and cameras write hidden metadata, EXIF, into every photo. It doesn't show in the picture, but anyone can read it from the file:

- **GPS coordinates:** where the photo was taken, often someone's home or a warehouse.
- **Device identifiers:** the camera or phone model, and sometimes a serial number that ties many photos to one person or device.
- **Timestamps and software:** when it was taken and what edited it.

Stripping deletes those fields and keeps the image. A product photo shot at someone's house and published unstripped publishes the house's location to everyone who downloads it.

**Signed, expiring URLs only.** Instead of a permanent public link such as `…/photos/1234.jpg`, the system issues a link with a signature and an expiry built in: this one file, for the next few minutes. Changing any part of the link breaks the signature, and after the expiry it stops working. A link that is forwarded, scraped or left in a log goes dead on its own, and no one can guess the next file's address.

The two halves cover different things. Stripping controls *what* is in the file when it leaves; signed URLs control *who* can fetch it, and for how long. The original stays in the private bucket, as the system of record; only a cleaned copy travels, briefly.

Two cautions:

- **Strip the copy that leaves, and check it.** Removing metadata in an editor doesn't clean copies made earlier, and some image services keep metadata unless told not to. Inspect the output, for example with `exiftool`, as part of the release check.
- **Expiry limits the link, not the copy.** Anyone who fetched the file while the link worked still has it. That is why stripping comes first: whatever does get saved has nothing in it you didn't mean to share.

### Why a GPU neocloud is too big to bind tightly

Two terms first, because the contrast is the point:

| | What it is | In business terms | What you send it |
|---|---|---|---|
| **Microservice** | A small service with one job and its own API, owned by one team: price a cart, check consent, resize an image | A specialist department with a service window: you hand over one form, it hands back one answer, and it only ever sees that form | A request: small, labeled, checked by the gate, gone when it is answered |
| **Neocloud** | A cloud provider that mostly rents GPUs for AI, such as CoreWeave, Lambda, Crusoe or Nebius, as opposed to a hyperscaler that sells everything | A heavy-equipment yard: you rent its machines by the hour or on a long contract, and bring your materials to its site | Your materials: whole datasets, long-running jobs, and the credentials to reach them |

Everything in this article works because each request is small, short-lived, labeled and checked. A microservice fits that shape. A neocloud dependency breaks all four:

1. **It needs bulk data, not a request.** Training and batch inference need whole datasets copied into the provider's storage ahead of time. A dataset can't carry a per-request consent label, and once copied it can't be recalled.
2. **It needs standing access, not a per-call grant.** Jobs run for hours or weeks with credentials to datasets, checkpoints and model registries. In stack-and-heap terms, everything about it is heap.
3. **Your perimeter doesn't reach it.** SCPs and RCPs, VPC Service Controls and Azure Policy govern your own cloud accounts. A neocloud has its own identity system, control plane, administrators and logs; you rely on its operations and a contract.
4. **Its fast path skips the usual controls.** GPU clusters link machines with RDMA networking, InfiniBand or RoCE, to move data between GPUs outside the normal network stack. Network policy, service-mesh mTLS and egress gateways are built for ordinary IP traffic.
5. **Its software is large, native and privileged.** Drivers, CUDA libraries and container runtimes are C and C++ running with high privilege. In [CVE-2024-0132](https://wiz.io/blog/nvidia-ai-vulnerability-deep-dive-cve-2024-0132), a malicious container image could escape the NVIDIA Container Toolkit to the host; the first patch was incomplete and a second CVE followed, fixed in version 1.17.4. On a shared GPU cluster, an escape crosses tenants.
6. **Its outputs are derived data without a clean owner.** Checkpoints and weights can memorize training data, and embeddings can be inverted to recover text. A deletion request can't reach inside trained weights.
7. **Its economics keep data there.** Capacity is reserved by long contract, and egress fees discourage moving data back out.

**The NVIDIA container escape, explained.** A *CVE* (Common Vulnerabilities and Exposures) is a public ID for a known security flaw, so everyone refers to the same bug. A *container* is a sealed box a program runs in, kept away from the machine underneath and from everything else on it; an *escape* is the program breaking out of the box to reach the host.

- **What the toolkit does.** The NVIDIA Container Toolkit connects a container to the machine's GPU. To do that it reaches between the box and the host, which makes it one of the most sensitive pieces of software on a GPU server.
- **What went wrong.** [CVE-2024-0132](https://nvd.nist.gov/vuln/detail/CVE-2024-0132) is a time-of-check, time-of-use flaw in version 1.16.1 and earlier, in its default configuration. The toolkit checked what a container image was setting up, but a specially crafted image could change things between the check and the moment the toolkit acted on it, and so reach the host's files. From there an attacker could run code, escalate privileges, read data or tamper with it. NVIDIA rated it 9.0, critical. Setups using the Container Device Interface (CDI) weren't affected.
- **What an attacker needed.** Only to get their image run on a GPU machine with the vulnerable toolkit. Wiz Research, which found it, estimated a third of cloud environments were exposed.
- **Why the fix took two tries.** NVIDIA's first patch was incomplete, so a follow-up flaw, CVE-2025-23359, was issued. Version 1.17.4 fixes both.

In business terms: each customer's crate is supposed to stay locked in its own bay of the equipment yard. A clerk checks each crate before hooking it up to the shared machinery. A crate built to change its contents right after the check walks out of its bay holding keys to the yard: the machines, and every other customer's crates. On a shared GPU cluster that is the risk: one escape reaches other tenants' data and credentials, below anything a gate can bind. Run toolkit 1.17.4 or later, keep untrusted images off shared GPU hosts, and put sensitive work on dedicated nodes or virtual machines, so an escape reaches only your own host.

So the answer isn't a tighter leash on the neocloud. It is sending it less, later and already reduced:

- **Send the remainder.** The device, the gate, the cache and triage remove most requests before a GPU sees them: about 89% in the illustrative funnel.
- **Minimize the dataset in the sandbox.** Pseudonymize and redact before export; no direct identifiers unless a contract and a legal basis require them.
- **Give each job its own short-lived credentials,** scoped to one bucket prefix and expiring with the job.
- **Isolate the tenancy.** Dedicated nodes or bring-your-own-cloud, and confidential GPU computing where the provider offers it.
- **Write the contract as a control.** Residency, deletion on exit, no reuse of your data for the provider's models, audit rights and breach notice.
- **Own the outputs.** Every checkpoint and model gets an owner, a lineage back to its datasets and their consent basis, and a retirement date.

A microservice is bound by the gate on every call. A neocloud is bound by what you choose to send it, which is why it belongs on the top rung and only for the work nothing lower can do.

**The castle vault and the pockets of coins.** A neocloud is a castle vault: everything in one place, behind one huge wall that must never fail, trusting anyone already inside. The Webflow, Cloudflare and Xano design is coins in small pockets, carried between people who know each other.

| | Castle vault (a neocloud) | Pockets of coins (Webflow, Cloudflare, Xano) |
|---|---|---|
| What's held | Everything, in one place | A little in each place |
| Perimeter | One huge wall that must never fail | Many small walls, each easy to see around |
| One breach costs | The whole vault | One pocket |
| Who is trusted | Anyone inside the walls | Only parties who know each other: signed labels, allowlists, mutual TLS, the gate |
| Built for | Bulk storage and heavy machinery | Small amounts moving quickly between known parties |

Two things keep the image honest. Smaller is not risk-free: each pocket is still someone's, since Cloudflare's edge sees traffic in plaintext, Webflow serves the page and Xano holds the record. The risk is bounded, not gone. And there is still a vault, only a smaller one kept close to home: one Xano instance per region holding what that region needs, while the coins in circulation are the reduced, signed, short-lived payloads. Many pockets mean many small configurations to keep consistent, which is why the allowlists and rules live in one versioned policy bundle instead of being set up place by place.

A neocloud is a vault that is only as safe as its biggest wall. This design keeps small vaults near home and moves small, signed pockets of coins between parties who know each other.

## Impact on enterprise infrastructure

| Concern | Hyperscaler-centred | Distributed, with a system-of-record gate | What changes for the enterprise |
|---|---|---|---|
| Data residency | Chosen by region; replication is a configuration you have to audit | One Xano instance per jurisdiction; only routing keys cross borders | Residency becomes a deployment fact, not a policy document |
| Latency | Good near the region, worse elsewhere | Decisions at the edge; writes travel to the home region | The hot path and the write path are budgeted separately |
| Consistency | Strong inside a region | The ledger is strong; edge projections are eventual and fail closed | Stale data is denied rather than served |
| Egress cost | Charged per GB leaving the cloud | R2 has no egress fees; gated payloads are small | Moving data out costs less and is easier to justify |
| Failure mode | Regional outage stops everything in the region | A region outage stops its subjects; the rest keep working | Outages are scoped per jurisdiction |
| Audit scope | Everything in the account is in scope | Gate, ledger and signing keys are the audited core | A SOC 2 boundary you can draw on one page |
| AI exposure | Models sit next to all the data | Models reach records only through tools behind the gate | Prompt injection can't exfiltrate what the gate won't release |
| Licensing | Usage-based, committed spend | Xano licence per instance (Enterprise); Workers usage | Each new jurisdiction carries a fixed cost |
| Skills | Kubernetes, IAM, networking teams | Workers, Xano and gate design; little cluster operation | Platform headcount moves from operating clusters to writing policy |
| Media and render | Originals, transforms and render farms sit in one account next to everything else | Previews and real-time 3D on the device; transforms at the edge; originals private; GPUs rented per job | Fewer copies of large files that contain people, and a GPU bill that follows the work |
| Vendor concentration | One provider holds compute, data and AI | Edge, system of record and model provider are separate | No single contract can switch the whole system off |

The trade is real. The distributed pattern only pays off if the gate is the single way out. A team that adds a direct database export "just for analytics" has rebuilt the hyperscaler's blast radius without its tooling.

## Decision checklist

- [ ] Every data flow names its system of record, and only that system can change the truth.
- [ ] Each jurisdiction you serve maps to exactly one Xano instance, or a documented reason it shares one.
- [ ] Personal data never replicates between instances; only an opaque routing key is shared.
- [ ] The gate runs at the edge and is the only egress path to ad platforms, CRMs and agent tools.
- [ ] Durable Objects hold projections with a staleness threshold, and stale means deny.
- [ ] Gate decisions are signed, and the signature binds the posture and the ledger head hash.
- [ ] Each AI use names its rung, and the reason it can't run one rung lower.
- [ ] Models reach records only through tools that pass the gate, never through a direct connection.
- [ ] For every "edge" in a vendor diagram, you know whose network it runs on and under which data-processing terms.
- [ ] Rung 4 (BYOC or dedicated GPUs) is reached only by a written contract, regulatory or cost requirement.
- [ ] Untrusted files (SVG, SWF, images) are parsed by memory-safe renderers, or by C renderers isolated in a locked-down pod.
- [ ] Wasm bundles have a size budget, measured on each build, like a frame budget.
- [ ] New interactive work is Rust compiled to Wasm by Workers Builds and loaded by the Webflow page; Ruffle plays only existing SWF files; Xano parses neither.
- [ ] Checkout logic (prices, discounts, delivery, payment, validation) runs as a Shopify Function, in Rust, with an input query that names only the fields it needs and an instruction count measured against the largest cart you sell to.
- [ ] Media originals live in a private bucket, and only signed, expiring URLs leave it; no media travels as base64.
- [ ] EXIF location and device fields are stripped before any image leaves the system of record.
- [ ] ImageMagick runs with a restrictive `policy.xml`, in a pod with no route to the rest of the system.
- [ ] Every cluster that holds protected data has Secrets encryption at rest (or an external KMS) turned on, and checked.
- [ ] Each GPU job names its rung, and why the device or a CPU pod couldn't do it.
- [ ] GPU capacity is sized on the measured demand left after the device, gate, cache and triage stages, not on raw request volume.
- [ ] The gate runs before the cache, so no cached answer skips the posture check.
- [ ] Facts live in ranked, cited rows, not in fine-tuned weights; fine-tuning is kept for tone, format and narrow classification.
- [ ] Eligibility is a 0-or-1 factor set by the gate, so a disallowed source can't be retrieved however relevant it is.
- [ ] Answers from the larger-model fallback are flagged as low confidence and confirmed before use, and the fallback rate is tracked.
- [ ] Outbound and inbound context run as separate streams: outbound scaled by cache, inbound by partition per subject and region.
- [ ] Context is typed, gated and ranked before tokenization; no personal field is filtered by prompt instruction alone.
- [ ] Embeddings of personal data are made only after the gate, and kept in the subject's home region, never in a shared index.
- [ ] Every cluster has default-deny network policy, workload identity and an egress allowlist; the VM boundary isn't counted as a data boundary.
- [ ] Data moving between clusters or clouds carries a signed, short-lived label (purpose, consent, region, ledger head), and the receiver checks it again.
- [ ] Each cloud's perimeter (SCPs and RCPs, VPC Service Controls, Azure Policy and network security perimeter) refuses access that didn't come through the gate.
- [ ] Policy rules live as versioned, tested, two-person-approved records in Xano, and the gate denies on a stale bundle.
- [ ] Allowed origins are rows in the signed policy bundle; the Worker never reflects an unlisted `Origin`.
- [ ] Shopify App Proxy requests are verified by HMAC and timestamp in the Worker, and `logged_in_customer_id` is checked against the data returned.
- [ ] Kakao Pay redirect URLs are built only from origins also registered in Kakao's console; an unregistered domain is refused at the gate.
- [ ] Outside data lands in a sandbox with no route to on-prem; on-prem pulls only labeled, reduced records and opens no inbound port.
- [ ] The token vault is kept apart from tokenized data, and rejected records stay in the sandbox with a reason and an owner.
- [ ] No model or agent platform holds standing access to a system of record; every capability is a separate grant, checked outside the model.
- [ ] Request-scoped data (decrypted fields, consent decisions, a model's assembled context) is dropped at the end of the call; anything written to a lasting store goes through the gate with an owner, an expiry and a reader list.
- [ ] KV holds only immutable or write-rarely values, named by version; consent, entitlements, counters and personal data live in Durable Objects or Xano.
- [ ] Sign-in tokens carry identity only; account status is checked before any write; entitlements reach the page as hints, and the gate decides.
- [ ] Consent from every banner and platform is normalized into one posture per subject, which pages, agents and model calls all read.
- [ ] Every GPU you run or rent has an inventory record (MPN, firmware, driver and container toolkit versions) checked against vendor security bulletins; rented capacity gets the same record and a patch window by contract.
- [ ] Bytecode for people has a size and frame budget checked in the build; bytecode for models is compiled per GPU, tested against a reference output, and rebuilt when the GPU model or driver changes.
- [ ] Every base model, language adapter and data set has a manifest row (version, region, training data, consent basis, license, retirement date); only weights trained on public material ship to devices, and the Worker serves each audience only its own bundle.
- [ ] 3D assets ship as glTF with compressed meshes and KTX2 textures; decoding runs off the main thread, frames are drawn off-screen and presented on the display's beat, and lossy display copies never replace the CAD source.
- [ ] The Shopify app uses only current slots (Functions, UI extensions, app embeds, web pixels); no script tag remains after 1 March 2027, and the API version in use is checked against the response header each quarter.
- [ ] The three compliance webhooks are verified by HMAC, routed to the subject's home region and completed within 30 days; the Partner account has a named owner and a response deadline for Shopify review emails.
- [ ] Every app the store runs fetches only signed configuration with no code fields; inserted text never goes through `innerHTML`; checkout links resolve only to allowlisted origins, and a scheduled checkout test fails on any off-domain redirect.
- [ ] Every executable is gated after its check as well as before: config signed, images pinned by digest, firmware accepted only signed, rolled out in stages, and attested before a job receives data.
- [ ] The theme holds no secret, admin URL or vendor configuration endpoint; remote configuration reaches the page only through the App Proxy and a schema allowlist in the Worker, and every Wasm or JavaScript bundle is pinned by version and integrity hash.
- [ ] AI-proposed bindings (field mappings, labels, allowlist rows) are data until the schema allowlist, the tests and a person approve them; the model holds no credentials and sees only gated data.
- [ ] Gate thresholds (allowed fields, policy age, bundle budget) are Rust tests that run on save through a watcher and always before the compile in the build, so a failure stops the deploy.
- [ ] Shared in-memory values (`Arc`, `Rc`, module-level caches) hold only versioned data no person owns; claims, extras, status and entitlements are read per request through the row gate.
- [ ] Data sent to a GPU neocloud is minimized in the sandbox first; each job has its own expiring, prefix-scoped credentials; every checkpoint and model has an owner, a lineage and a retirement date.
- [ ] Before committing to Enterprise, Xano has confirmed region placement for BYOC on your timeline and whether direct Postgres access is available for verifying the ledger.

## Sources

- Adobe, [AEM Edge Functions](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/edge-functions) and the [Edge Functions overview](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/edge-functions/overview): runs on Adobe's managed CDN, powered by Fastly Compute; beta.
- Adobe, [Set up AEM Edge Functions on AEM as a Cloud Service](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/edge-functions/edge-functions-setup/setup-aemcs): `cdn.yaml` origin selectors.
- Xano, [Xano for Enterprise](https://docs.xano.com/enterprise/xano-for-enterprise) and [Enterprise deployment](https://docs.xano.com/enterprise/enterprise-features/deployment): BYOC on AWS, Azure or Google Cloud; data sovereignty; multiple instances, each separately licensed.
- Xano, [Enterprise-grade multi-tenant control](https://community.xano.com/release-announcements/post/new-enterprise-grade-multi-tenant-control-2DNxiHH69FITNmt): Kubernetes-level tenant isolation and regional clusters in the Tenant Center add-on.
- Webflow, [About the Webflow Cloud edge environment](https://developers.webflow.com/webflow-cloud/environment) and [configuration](https://developers.webflow.com/webflow-cloud/environment/configuration): Webflow Cloud apps run on the Cloudflare Workers runtime and deploy with Wrangler.
- Oracle, [World's largest AI supercomputer in the cloud](https://blogs.oracle.com/cloud-infrastructure/post/worlds-largest-ai-supercomputer-in-the-cloud): OCI Superclusters with NVIDIA GPUs over RDMA networking.
- Khronos Group, [SPIR-V](https://www.khronos.org/spirv/): the portable intermediate language for GPU programs.
- wgpu, [wgpu.rs](https://wgpu.rs/) and [naga](https://github.com/gfx-rs/wgpu/tree/trunk/naga): the Rust GPU runtime over Vulkan, Metal, DirectX and WebGPU, and its shader translator.
- W3C, [WebGPU: GPUAdapterInfo](https://www.w3.org/TR/webgpu/#gpuadapterinfo): adapter details limited to reduce fingerprinting.
- Hu et al., [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685): small adapter weights that tune a frozen base model.
- Cloudflare, [R2 data location](https://developers.cloudflare.com/r2/reference/data-location/): enforced jurisdictions (EU, FedRAMP) versus location hints.
- NVIDIA, [TensorRT support matrix](https://docs.nvidia.com/deeplearning/tensorrt/latest/getting-started/support-matrix.html): supported GPUs, precisions and software versions for compiled inference engines.
- WebAssembly, [Binaryen](https://github.com/WebAssembly/binaryen): the toolkit behind `wasm-opt`.
- ONNX Runtime, [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/): running models in the browser through WebGPU or Wasm.
- NVIDIA, [Product Security](https://www.nvidia.com/en-us/security/): security bulletins by product and software version.
- Google, [Draco](https://github.com/google/draco), and Khronos, [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_draco_mesh_compression): mesh compression and its glTF extension.
- Khronos, [KTX](https://www.khronos.org/ktx/) and [KHR_texture_basisu](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_basisu): textures that stay compressed on the GPU.
- MDN, [Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) and [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
- Google, [`<model-viewer>`](https://modelviewer.dev/): a 3D viewport packaged as a web component.
- Rust GPU, [rust-gpu](https://github.com/Rust-GPU/rust-gpu): Rust to SPIR-V, maintained by the community since 2024, early-stage.
- [rustc_codegen_nvvm](https://lib.rs/crates/rustc_codegen_nvvm) (Rust CUDA): Rust to PTX, early development; NVIDIA, [The Rust + GPU ecosystem](https://nvidia.github.io/cuda-rust/appendix/ecosystem.html), which also covers cuda-oxide.
- Kubernetes, [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) (stored unencrypted in etcd by default) and [Encrypting confidential data at rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/).
- ImageMagick, [Security policy](https://imagemagick.org/script/security-policy.php): `policy.xml` coder, resource and path limits.
- [libvips](https://www.libvips.org/): a demand-driven, streaming image library in C.
- Cloudflare, [Images](https://developers.cloudflare.com/images/): transformations at the edge.
- Adobe, [Firefly Services](https://developer.adobe.com/firefly-services/): Photoshop, Lightroom and Firefly APIs.
- NVIDIA, [GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/index.html): GPU drivers and scheduling on Kubernetes.
- Morris et al., [Text Embeddings Reveal (Almost) As Much As Text](https://arxiv.org/abs/2310.06816), EMNLP 2023: embeddings can be inverted to recover much of the input text.
- Microsoft Security Response Center, [A proactive approach to more secure code](https://msrc.microsoft.com/blog/2019/07/a-proactive-approach-to-more-secure-code/): about 70% of Microsoft's security bugs are memory-safety issues.
- Chromium, [Memory safety](https://www.chromium.org/Home/chromium-security/memory-safety/): about 70% of serious Chromium security bugs are memory-safety problems.
- Adobe, [Flash Player end of life](https://www.adobe.com/products/flashplayer/end-of-life.html), 31 December 2020; [Ruffle](https://ruffle.rs/), a Flash Player emulator written in Rust.
- [librsvg](https://gitlab.gnome.org/GNOME/librsvg), the GNOME SVG library, now written in Rust; [resvg](https://github.com/linebender/resvg), an SVG renderer in Rust.
- NVIDIA, [Corporate timeline](https://www.nvidia.com/en-us/about-nvidia/corporate-timeline/); Krizhevsky, Sutskever and Hinton, [ImageNet classification with deep convolutional neural networks](https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks), NeurIPS 2012 (trained on two GTX 580 GPUs).
- Shopify, [Function APIs: limitations and resource limits](https://shopify.dev/docs/api/functions): binary, memory, instruction, input and output limits; no randomness or clock; fetch limited to custom apps on Enterprise stores.
- Shopify, [About Shopify Functions](https://shopify.dev/docs/apps/build/functions) and [WebAssembly for Functions](https://shopify.dev/docs/apps/build/functions/programming-languages/webassembly-for-functions): never invoked by URL; input read through imported API functions; Rust strongly recommended.
- Cloudflare, [Workers Builds build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/) (Ubuntu 24.04; Rust is not among the preinstalled tools) and [Static assets headers](https://developers.cloudflare.com/workers/static-assets/headers/) (`Content-Type` from the file extension; `ETag` revalidation).
- Webflow, [Webflow Cloud](https://developers.webflow.com/webflow-cloud/intro): apps deploy from GitHub and are served at a path on the site's domain, on the Workers runtime.
- [Trunk](https://trunkrs.dev/): builds Rust to Wasm for the browser, fetching `wasm-bindgen` and `wasm-opt`.
- Ruffle, [Using Ruffle](https://github.com/ruffle-rs/ruffle/wiki/Using-Ruffle): self-hosting, `application/wasm`, `'wasm-unsafe-eval'`, CORS and network options.
- AWS, [Resource control policies](https://aws.amazon.com/about-aws/whats-new/2024/11/resource-control-policies-restrict-access-aws-resources) and [Building a data perimeter on AWS](https://docs.aws.amazon.com/whitepapers/latest/building-a-data-perimeter-on-aws/perimeter-overview.html); [Amazon Verified Permissions](https://docs.aws.amazon.com/verifiedpermissions/latest/userguide/what-is-avp.html); [AWS App Mesh](https://docs.aws.amazon.com/app-mesh/latest/userguide/what-is-app-mesh.html) (support ended 30 September 2026).
- Google Cloud, [VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview) and [Model Armor with Vertex AI](https://docs.cloud.google.com/model-armor/model-armor-vertex-integration).
- Microsoft, [Azure Policy](https://learn.microsoft.com/en-us/azure/governance/policy/overview), [Network security perimeter](https://learn.microsoft.com/en-us/azure/private-link/network-security-perimeter-concepts) and [Prompt Shields](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection).
- Shopify, [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) and [App requirements checklist](https://shopify.dev/docs/apps/launch/app-requirements-checklist): TLS, scopes, OAuth, session tokens, consequences including delisting (1.3), the 90-day deprecated-API rule.
- Shopify, [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance) and [Protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data): the three mandatory webhooks, the 30-day deadline, level 1 and level 2 requirements.
- Shopify, [API versioning](https://shopify.dev/docs/api/usage/versioning): quarterly releases, 12 months of support, falling forward.
- Shopify, [Shopify Scripts will be deprecated on June 30, 2026](https://shopify.dev/changelog/shopify-scripts-will-be-deprecated-on-june-30-2026) and [Script tags will stop running on March 1, 2027](https://shopify.dev/changelog/online-store-script-tags-deprecation).
- Shopify, [checkout.liquid](https://shopify.dev/docs/storefronts/themes/architecture/layouts/checkout-liquid) and [Order status script tags](https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation/order-status): Thank you and Order status cutoffs for Plus (28 August 2025) and non-Plus (26 August 2026) stores.
- Rust standard library, [`std::sync::Arc`](https://doc.rust-lang.org/std/sync/struct.Arc.html); PostgreSQL, [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
- The Rust Book, [How to Write Tests](https://doc.rust-lang.org/book/ch11-01-writing-tests.html); rust-analyzer, [check on save](https://rust-analyzer.github.io/book/configuration.html); [bacon](https://dystroy.org/bacon/): a background checker and test runner.
- MDN, [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) and [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
- Kaspersky, [Operation ShadowHammer](https://securelist.com/operation-shadowhammer-a-high-profile-supply-chain-attack/90380/): a signed, malicious update delivered through ASUS Live Update.
- NVIDIA, [Attestation](https://docs.nvidia.com/attestation/index.html): verifying GPU state for confidential computing.
- Roman Zipp, [Shopify shops hit with ongoing Checkout Hijack attack](https://romanzipp.com/blog/shopify-hit-with-phishing-attack): the `advanced_users.custom_js` field, the checkout-button handler and the lookalike domains.
- Proactivo Commerce, [Was Shopify Hacked? The October 2026 Checkout Hijack](https://proactivocommerce.com/blogs/insights/was-shopify-hacked-checkout-hijack), and Tech Business News, [Shopify stores caught in fake checkout attack](https://www.techbusinessnews.com.au/news/shopify-stores-caught-in-fake-checkout-attack-as-hijacked-apps-redirect-shoppers/): timeline, Selleasy's statement, Shopify's response.
- Shopify Developer Community, [No new legacy custom apps from January 1, 2026](https://community.shopify.dev/t/starting-january-1-2026-you-will-not-be-able-to-create-new-legacy-custom-apps-this-will-not-impact-any-existing-apps/26798), and developer reports of delisting after a missed governance email ([one](https://community.shopify.dev/t/my-app-has-been-temporarily-delisted/38502), [portfolio-wide](https://community.shopify.com/t/our-entire-app-portfolio-was-delisted-due-to-one-app-10-apps-offline-merchants-impacted-need-guidance/689638)): anecdotal.
- Shopify, [About app proxies](https://shopify.dev/docs/apps/build/online-store/app-proxies) (prefix and subpath, `path_prefix`, `application/liquid`, stripped `Set-Cookie`) and [Authenticate app proxies](https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies) (HMAC-SHA256 over sorted parameters).
- Kakao Pay, [Developer center](https://developers.kakaopay.com/): online payment API, with redirect URLs on the merchant's registered domains.
- Cloudflare, [Queues pull consumers](https://developers.cloudflare.com/queues/configuration/pull-consumers/), [Queues limits](https://developers.cloudflare.com/queues/platform/limits/) (128 KB messages), [R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) and [restricting API tokens](https://developers.cloudflare.com/fundamentals/api/how-to/restrict-tokens/) by client IP and expiry.
- Wiz Research, [CVE-2024-0132](https://wiz.io/blog/nvidia-ai-vulnerability-deep-dive-cve-2024-0132): a container escape in the NVIDIA Container Toolkit; with its follow-up CVE-2025-23359, fixed in 1.17.4. NIST, [NVD entry for CVE-2024-0132](https://nvd.nist.gov/vuln/detail/CVE-2024-0132): a time-of-check, time-of-use flaw in 1.16.1 and earlier; CDI setups not affected.
- Cloudflare, [Write key-value pairs](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) (visibility across locations, last write wins) and [Data Localization Suite compatibility](https://developers.cloudflare.com/data-localization/compatibility/) (no jurisdiction restriction for KV storage).
- OneTrust, [Cross domain and cross device consent](https://developer.onetrust.com/onetrust/docs/cross-domain-cross-device): a known user ID, a customer-signed JWT, an uploaded public key, a Consent Group and records of consent.
- The Rust Programming Language, [The stack and the heap](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#the-stack-and-the-heap); Rust error [E0597](https://doc.rust-lang.org/error_codes/E0597.html), a borrowed value that does not live long enough.
- OpenJDK, [JEP 411: Deprecate the Security Manager for Removal](https://openjdk.org/jeps/411) and [JEP 486: Permanently Disable the Security Manager](https://openjdk.org/jeps/486), delivered in JDK 24.
- Shopify Engineering, [How we built Oxygen](https://shopify.engineering/how-we-built-oxygen): a gateway Worker in Cloudflare routing to storefront Workers through Workers for Platforms' dynamic dispatch.
- Cloudflare, [Workers VPC](https://developers.cloudflare.com/workers-vpc/) (beta), [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/), [AI Gateway DLP](https://developers.cloudflare.com/ai-gateway/features/dlp/) and the [Data Localization Suite](https://developers.cloudflare.com/data-localization/).
- MDN, [WebAssembly.compileStreaming()](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/compileStreaming_static): compiling while the module downloads.
- CNCF, [From data residency to digital sovereignty](https://cncf.io/blog/2026/06/16/from-data-residency-to-digital-sovereignty-architectural-patterns-for-cloud-native-platforms): a shared Kubernetes control plane still centralizes administrative authority.
