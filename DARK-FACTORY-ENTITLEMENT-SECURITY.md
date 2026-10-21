---
title: "Entitlement Security"
description: "Updated for php2shell (CVE-2026-109618 and CVE-2026-109619): patch PHP and keep the Cloudflare WAF rules in Block. Where the vulnerability lives — IoT firmware, game bundles, 3D/BIM assets — with the Unity, Trimble and ImageMagick receipts, Rust in the loop so no C parser ever sees the sender's bytes, the PHP, JVM and plugin estates runtime by runtime, four cloud data transports (ERP on Azure, CRM plugins, EDI on AWS, the GCP audience bus) with their AI challenge, AI task binding across Cloudflare, Xano and Rust, one subject across every channel when the CMP is a per-site browser cookie, why no platform yet handles 3D securely, and the entitlement architecture that survives AI-speed extraction."
canonical: https://persephonepunch.github.io/crm-sync-setup/entitlement-security.html
category: "Security"
date: 2026-07-19
modified: 2026-10-21
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/DARK-FACTORY-ENTITLEMENT-SECURITY.md
licence: CC-BY-4.0
ogImage: https://persephonepunch.github.io/crm-sync-setup/og/dark-factory-entitlement-security.png
ogImageAlt: "Entitlement Security: one subject, every channel. Left, today: uk, ca and fr country sites each keep consent in a browser cookie, with four red gaps and a JVM bus polled every 15 minutes feeding the Google Merchant and Shopify audiences. Right, the fix: every device reaches a Cloudflare Worker, Xano is the system of record, and an event socket feeds four clouds and both audiences the same answer."
tags:
  - entitlement
  - security
  - firmware
  - sbom
  - ledger
  - architecture
about:
  - Entitlement-based security
  - Firmware distribution security
  - Dark factory / lights-out manufacturing
  - 3D and BIM asset security
  - AI-assisted reverse engineering
alternativeHeadline: "Concede the artifact, defend the ledger — executable content is safe in proportion to what the runtime denies it"
citation:
  - name: "Unity Security Update Advisory (CVE-2025-59489)"
    url: https://unity.com/security/sept-2025-01
  - name: "NVD — CVE-2025-59489"
    url: https://nvd.nist.gov/vuln/detail/CVE-2025-59489
  - name: "CISA ICS Advisory — Trimble Cityworks (CVE-2025-0994)"
    url: https://www.cisa.gov/news-events/ics-advisories/icsa-25-037-04
  - name: "CISA alert — Trimble Cityworks security updates"
    url: https://www.cisa.gov/news-events/alerts/2025/02/07/trimble-releases-security-updates-address-vulnerability-cityworks-software
  - name: "ImageMagick — Security Policy"
    url: https://imagemagick.org/script/security-policy.php
  - name: "image crate — Limits"
    url: https://docs.rs/image/latest/image/struct.Limits.html
  - name: "resvg / usvg"
    url: https://github.com/linebender/resvg
  - name: "Google Threat Intelligence — data theft from Salesforce instances via Salesloft Drift"
    url: https://cloud.google.com/blog/topics/threat-intelligence/data-theft-salesforce-instances-via-salesloft-drift
  - name: "AWS B2B Data Interchange"
    url: https://aws.amazon.com/b2b-data-interchange/
  - name: "Google Merchant API"
    url: https://developers.google.com/merchant/api
  - name: "Hyperscaler vs Distributed (companion)"
    url: https://crm-sync.dev/docs/hyperscaler-vs-distributed
  - name: "PHP security advisory — CVE-2026-109618 and CVE-2026-109619 (21 October 2026)"
    url: https://www.php.net/archive/2026.php#2026-10-21-5
  - name: "Cloudflare — protections against the php2shell vulnerability"
    url: https://blog.cloudflare.com/php-vulnerabilities-waf-protection/
  - name: "Node.js — October 21, 2026 security releases (CVE-2026-111497)"
    url: https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
  - name: "Socket — LiteLLM PyPI package and Docker images compromised"
    url: https://socket.dev/blog/litellm-compromise
  - name: "Shopify Storefront Web Components"
    url: https://shopify.dev/docs/api/storefront-web-components
  - name: "Data Layer — WordPress, Astro, Headless (companion)"
    url: https://www.crm-sync.dev/pages/knowledge-base#wordpress-web-components
  - name: "CRM Sync Setup Reference"
    url: https://www.crm-sync.dev/pages/knowledge-base#setup-guide
---
# Entitlement Security

**Status:** Living reference · **Scope:** Where the vulnerability actually lives in modern business operations — IoT firmware, game platforms, 3D/BIM assets — and the entitlement architecture that survives it. Written from production experience shipping commerce on Roblox/Shopify rails and 3D asset pipelines against PIM/BIM systems.

**Tags:** [#CRA](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act) · [#Art-14 — 11 September 2026](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) · #firmware · [#CRA-checklist](https://www.crm-sync.dev/pages/pim-sync#cra-checklist)

> **Update, 21 October 2026 — php2shell.** Two critical flaws in the PHP runtime itself,
> CVE-2026-109618 and CVE-2026-109619, allow unauthenticated remote code execution on every PHP
> web server from 5.4 on, and attack traffic was seen before disclosure.
> **[Cloudflare deploys protections against the php2shell vulnerability →](https://blog.cloudflare.com/php-vulnerabilities-waf-protection/)**
> Its WAF rules are on by default for every plan, Free included; paid plans should confirm they
> are in Block. Then patch to PHP 8.5.12, 8.4.27, 8.3.36 or 8.2.35 — a plugin update does not fix
> it. [What to do, in order](#update-21-october-2026-php2shell-is-the-runtime-not-the-plugin).
> **The same day:** Node.js fixed a Brotli out-of-bounds write that permits remote code execution
> (CVE-2026-111497), and a poisoned LiteLLM 1.107.0 shipped a credential stealer through PyPI and
> Docker. [Both, and what to do](#the-same-day-nodejs-cve-2026-111497-and-the-litellm-release).

![One subject, every channel. A strip across the top: OneTrust's CDN, Shopify storefronts and Webflow hosting all answer through Cloudflare, so the brand's namespace sits where the traffic already is. Left, today: uk.brand.com, ca.brand.com and fr.brand.com each keep consent in a browser cookie under different rules, with four red gaps — cookie scope across markets, a dangling subdomain that can forge consent, plugin wildcards readable in the theme, and a session ID instead of a subject — and four clouds feeding the Google Merchant and Shopify audiences through a JVM bus polled every 15 minutes. Right, the fix: web, mobile, POS, chatbot, IoT and firmware reach a Cloudflare Worker, the Buy app, which checks market, purpose and freshness with Rust types; Xano is the system of record, a KV namespace holds the projection, and an event socket feeds Azure, CRM SaaS, AWS and GCP only when the posture allows, with a Rust gRPC writer stamping posture onto BigQuery and Merchant rows so both audiences are socketed to the same answer.](https://persephonepunch.github.io/crm-sync-setup/assets/one-subject-every-channel.svg)

*[Open the SVG full size](https://persephonepunch.github.io/crm-sync-setup/assets/one-subject-every-channel.svg) (1600 × 920) · [Download the PDF](https://persephonepunch.github.io/crm-sync-setup/assets/one-subject-every-channel.pdf) · [JPG](https://persephonepunch.github.io/crm-sync-setup/assets/one-subject-every-channel.jpg). Gaps are marked in red; the walkthrough is [One subject, every channel](#one-subject-every-channel-when-consent-is-a-browser-cookie) below.*

---

## The setup: why we don't use Flash

Every era has a technology everyone uses, everyone distrusts, and everyone keeps using anyway — until the day it becomes indefensible. Flash was the canonical case: a content format that was secretly a runtime. Every SWF file was a program wearing a document costume, so every place a Flash file could land — an ad slot, an email, a forum avatar — was a code-execution surface. No amount of patching fixed that, because the flaw wasn't a bug; it was the *design*. Content that executes is an attack surface by definition. Flash didn't die because HTML5 was prettier. It died because the model was unfixable.

The uncomfortable part: we never actually stopped using Flash's model. We renamed it.

- **SVG** is an image format that can carry scripts — a picture that executes. Every system that inlines untrusted SVG inherits the Flash problem.
- **XML** (and its industrial descendants, including BIM interchange formats) brings external-entity resolution — a *document* that can be made to read your filesystem or call your network.
- **PDF** ships an embedded scripting engine, launch actions, and attached files — a "read-only" format that has carried three decades of code execution. PDFs, XML, and SVG CDATA all hold the same exposure: a document class the parser must partially *run* to display.
- **CDATA + base64 *is* Flash.** A CDATA section holding a base64 blob is an opaque binary smuggled inside a document — a payload the parser cannot inspect and the consumer is expected to decode and trust. That is structurally identical to the SWF-in-a-webpage model, and it is everywhere in enterprise interchange: BIM payloads, signed-XML envelopes, "portable" report formats.
- **Self-extracting and expanding EXEs** — the standard firmware and driver delivery vehicle — are archives fused with programs, routinely carrying embedded endpoints, credentials, and unlock logic.
- **Game engine bundles** ship your assets and logic inside a runtime on hardware you will never control.

Each of these is "content that executes" or "value inside the artifact." Each is Flash with better branding. And AI just did to all of them what it does to every obscurity-based defense: reduced the cost of unpacking, tracing, and extracting from weeks of specialist effort to minutes of assisted analysis. The time tax was the security model. The time tax is gone.

## The receipts: where the vulnerability lives now

This is not a hypothetical argument. Two documented 2025 events mark the two ends of the artifact problem, and a third, older and still recurring, sits between them.

**Unity — CVE-2025-59489.** A runtime flaw (untrusted search path) affecting applications built on Unity 2017.1 and later — which is to say, a substantial fraction of every game shipped in eight years. The remediation, per [Unity's own advisory](https://unity.com/security/sept-2025-01): rebuild and redistribute every affected application. There is no server-side fix, **because the vulnerable thing is the shipped bundle itself.** One flaw in a bundled runtime replicates into millions of client-side artifacts, each needing individual rebuilding. When value and logic ship inside the artifact, so do the vulnerabilities — at 1:1 scale with your distribution success.

**Trimble Cityworks — CVE-2025-0994.** A deserialization flaw in the asset-management platform that holds the infrastructure records of local governments, utilities, and manufacturers — [actively exploited](https://www.cisa.gov/news-events/ics-advisories/icsa-25-037-04), added to CISA's Known Exploited Vulnerabilities catalog, with attackers observed delivering in-memory loaders and Cobalt Strike through it. Here the artifact problem inverts: the vulnerability lives in the **silo monolith** — one on-premises application ingesting opaque blobs, holding the entire asset graph, unjoinable by outside systems and therefore unauditable by them. The properties that make such platforms commercially entrenched — proprietary data shape, organizational depth in institutions that patch slowest — are precisely the properties that maximize blast radius.

**ImageMagick — CVE-2016-3714, "ImageTragick," and the decade of CVEs behind it.** The third pole is neither the artifact nor the silo but **the parser** — the thing that opens the file. ImageMagick's delegate system passed parts of a filename into shell commands, so a crafted image achieved remote code execution simply by being processed. It is the canonical case because of where it lives: embedded in upload pipelines, thumbnailers, CMSes and asset services, usually as a transitive dependency nobody deliberately chose, frequently invoked automatically on user-supplied input, and often running with more privilege than the request that triggered it. The same shape recurs across media and 3D/CAD parsers — SketchUp, FBX and USD each carry their own histories.

> **Sidebar — who is actually running it, and what it exposes**
>
> Almost nobody chooses ImageMagick. It arrives with a CMS, a base image, or a dependency three
> levels down, so *do we use it* is not a question anyone can answer honestly — only *does
> anything in our stack generate a preview.*
>
> Which is why our claim is not that we don't run it. The claim is that it would not matter if
> we did.
>
> **Where it lives.** The PHP `Imagick` extension is the largest single exposure — **WordPress
> uses it whenever it is available**, falling back to GD, for every upload, resize and thumbnail;
> Drupal, Joomla, Magento and Laravel's Intervention Image follow the same pattern. In Ruby,
> MiniMagick shells out to the CLI and rmagick binds natively, historically behind CarrierWave,
> Paperclip and ActiveStorage. Python's Wand binds to MagickWand, though most of that ecosystem
> defaults to Pillow. In Node the wrappers `gm` and `imagemagick` are legacy; the modern path is
> sharp on libvips. And then the ones nobody inventories: Docker base images, CI runners,
> document and attachment preview pipelines, avatar services, image proxies.
>
> **What it exposes.** The `delegates.xml` system maps formats to *external commands* and passes
> filenames into shell invocations — insufficient filtering there is what made ImageTragick remote
> code execution from an uploaded image. Its own **MVG and MSL** formats can reference local files
> and remote URLs. **Format is determined by content, not extension**, so a file named `.jpg`
> holding MVG is processed as MVG and validating the extension buys nothing. Constructs like
> `label:@/path` read local files *into the output image*, making the thumbnail you hand back the
> exfiltration channel. `url:` and delegate fetches give SSRF. And PDF, EPS and PS **delegate to
> Ghostscript**, so a "generate a PDF preview" feature quietly chains two heavily targeted
> parsers — people rarely realise the second one is there.
>
> **The hardening is known and unevenly applied**: a `policy.xml` disabling MVG, MSL, `url:` and
> the PS/EPS/PDF delegates, with caps on memory, area and time. Every deployment should do it,
> and a `policy.xml` is a file someone has to remember — which makes it the weakest kind of
> control there is.
>
> **The structural version is to make the parser's success irrelevant.** Grant the attacker the
> whole win: assume the parse is compromised. Now count what the compromised process can reach.
> Our media buckets have **no public domain and no direct origin** — every byte is served through
> a Worker, so there is no address at which stored content exists independently of the code that
> decides who may have it. Tenancy is in the **object key prefix**, not in a query parameter, and
> filenames are normalised to a restricted character set with path separators stripped, so a
> crafted name cannot walk out of its own namespace. The serve path sends `nosniff`
> unconditionally and renders inline only what is on a render allow-list; everything else comes
> back as an octet-stream attachment, which is how the SVG question answers itself. And the
> cross-origin rules **nest**: the allow-list that decides who may *read* a response is strictly
> wider than the one that decides who may read it *as the signed-in user*, and the literal origin
> `null` — which any sandboxed frame on the internet can assume at will — is never reflected into
> either. Same gates for the Shopify storefront and the Webflow mirror, because both load their
> media through the same path.
>
> That is the whole argument in miniature. A parser you cannot audit sits inside a runtime with
> no ambient network, no host origin, no reachable neighbour and no authority it was not handed —
> the Shopify Functions bargain again, applied to somebody else's C code.

What makes the parser pole distinct is the trigger. Unity's flaw needs you to have shipped something. Trimble's needs you to run the silo. **The parser is invoked by the act of receiving a file at all** — accepting an upload is sufficient. An organisation that ships nothing and runs no monolith still has this surface the moment it lets a partner send it a model, a document or an image.

It also reframes what custody can and cannot do. Encrypting an asset, granting it to a named recipient and ledgering every served byte is a containment and attribution control: it proves what was delivered, to whom, and when, and a rotated key heals a suspected leak without a recall. **It does not make a hostile file safe to open.** That is a validation problem, and it belongs on the way in — reject external resource references, cap decompression ratios, determine the type from the bytes rather than the declaration, parse in isolation with a hard timeout, and where possible re-serialise so what you store is your own output rather than the sender's input. That last step needs something to do the re-serialising, and [Rust in the loop](#rust-in-the-loop-re-encode-before-anything-parses) below names it. Custody and validation are two controls, and a vendor claiming the first has not delivered the second.

Between those two poles sits everything a modern operation ships and stores: **IoT and device firmware** (expanding EXEs with embedded secrets), **game and metaverse distribution** (Roblox and Unity bundles carrying your product's 3D twins), **3D/BIM assets in business operations** (models locked in PIM/BIM silos, exchanged as executable-adjacent XML). The vulnerability does not live in your network perimeter. It lives in your artifacts and your silos — the two places perimeter security cannot reach.

## The long-run AI requirement: JSON records, not a single Java bundle

The receipts share a shape: value and logic fused into one thing you cannot hand out in pieces. That shape has a second cost that arrives more slowly than a CVE. **AI does not use your application. It uses your data** — and it needs that data in a form it can be handed one record at a time.

The enterprise default is the single bundle: a Java WAR or EAR, a content package, a JCR repository, an object graph persisted with the platform's own serialisation. The data's shape lives inside the code that owns it, so the only ways in are the application's own screens or an export somebody scheduled. That was tolerable when the reader was a person. An agent asks a different question — *give me this one asset's state, now, joined against operations* — and the bundle can answer only by handing over last night's snapshot or the application's whole authority. Neither is an entitlement.

Typed JSON records answer it directly. Each record is addressable by its own key, validated against a published schema, readable as text, and small enough to carry its own grant. An agent can be given exactly one record under exactly one capability, and what it was given can be ledgered by the byte. It is the Shopify Functions contract again, typed JSON in and typed JSON out, applied to data at rest instead of code in flight.

The deeper difference is where each model decides that data can be trusted. Shopify's Catalog and its Wasm Functions run on **JSON arriving in real time from a live endpoint**: every invocation receives a typed payload, checks it against a schema, and earns its permission on that request, so where the data came from is established fresh each time. The single bundle assumes the opposite. **Its data's shape and origin are taken as permissioned by the architecture boundary** — the object came from inside the application, so it is trusted, and nothing is re-checked once it is past the perimeter. Trust by location held while the boundary held. An agent reads from outside it, at AI speed, and a deserialisation flaw like Cityworks' is exactly an attacker's object arriving through a door the architecture had already marked as inside.

The same assumption runs through time as well as space. **A firmware bundle is trusted because it was compiled** — signed at the factory, so it is taken as secure for as long as it is in the field. npm, pip and Cargo extend the same trust to every dependency: if it resolved, installed and built, it is treated as ours. A lockfile and its hashes prove that today's package is the same one as yesterday's, not that yesterday's was safe, and the install step itself runs code — npm lifecycle scripts, Python build backends, Rust `build.rs` — before anyone has read what arrived. `event-stream` in 2018, xz-utils in 2024 and the self-propagating npm worm of 2025 are all this one assumption failing. The compile is a moment of provenance, not a permanent grant. Which is why the Shopify Functions bargain still matters after the build: a sandbox that denies network and filesystem limits a poisoned dependency to whatever its two typed ports can carry.

| Long-run requirement | Typed JSON records | Single Java bundle |
|---|---|---|
| Hand an agent one item | One record, one key, one grant | The app's API or the app's authority — usually the whole of it |
| Freshness | Read the record now | Whatever the last export captured |
| Audit what was disclosed | Ledger the record and the bytes served | Reconstruct from application logs, if they exist |
| Schema change | Version the schema; old readers fail loudly | Redeploy the bundle; every consumer moves at once |
| Fixing a flaw | Rotate a grant, re-validate a record | Rebuild and redeploy the whole artifact — the Unity remediation |
| What the parser must do | Read data | Serialised formats rebuild objects, which means running code |

The last row is the security one, and it is Cityworks again. Native serialisation formats, Java's `ObjectInputStream` and .NET's binary formatters alike, do not read data; they **reconstruct objects**, and reconstructing an object runs its code. That is why deserialisation is a vulnerability class rather than a bug: the 2015 Java gadget chains through Apache Commons Collections and CVE-2025-0994 in Cityworks' .NET stack are the same flaw ten years apart. A JSON parser builds maps, lists, strings and numbers, and nothing else.

That is a narrower surface, not a safe one. JSON still needs size and nesting limits, a rule for duplicate keys, schema validation on the way in, and — in JavaScript — a guard against `__proto__` keys polluting the prototype. And JSON stops being data the moment a library is allowed to choose the class from a field in the payload; polymorphic typing in Jackson and its peers reopened the gadget problem inside JSON. The requirement is plain data with a published schema, not the letters J-S-O-N.

None of this is *rewrite the Java*. The JVM is a runtime, not a boundary, and a Java service emitting typed records behind a capability check meets the requirement as well as anything else. What does not meet it is the bundle as the unit of access. **Keep the platform; change what crosses its edge.** Records out, grants per record, schemas published, and no format crossing the boundary that asks the receiver to run something to read it.

Which leaves the obvious objection: if data and assets are always streaming, what is ever guaranteed? Nothing, up front, and that is the point. A stream cannot be proven safe in advance, so **security moves from a one-time guarantee to a per-request one**. Every payload is validated against its schema at the edge, with size and depth caps, and rejected rather than repaired; every asset is typed from its bytes, served `nosniff`, and rendered inline only from an allow-list. The data streams, but **the code does not**: a Content-Security-Policy with nonces or hashes, Subresource Integrity on anything third-party and Trusted Types on the DOM mean only scripts pinned in advance can run, whatever arrives alongside them. Each request runs where a bad one costs little — a Wasm sandbox or an isolate with no filesystem and no ambient network, reaching only what it was bound to and disclosing only what was granted. And every serve is ledgered and every grant is short-lived, so a leak is a fact you can look up and a rotation that ends it in seconds, not a recall. The bundle earned trust once, at compile time, and kept it. The stream earns it on every request, and loses it the moment a request fails.

## One architecture, two trust models: Elm, iced and Webflow + Xano

The JSON-versus-bundle argument has a cleaner illustration than any enterprise platform: the same application architecture, built once inside a compiler and once across a network.

**The Elm Architecture** — and **iced**, the Rust GUI library modelled on it — has four parts. *State* is the single source of truth. A *Message* is a typed description of something that happened. *update(state, message)* is the only place state may change. *view(state)* draws the interface and can change nothing. A Webflow front end on a Xano backend has the same four parts, spread across two services and the internet:

| The Elm Architecture | Role | Webflow + Xano |
|---|---|---|
| State (`struct App`) | The single source of truth | Xano tables — the records are the state |
| Message (`enum Message`) | A typed account of what happened | The JSON request to an endpoint, `POST /lead {…}` |
| `update(state, message)` | The only place state changes | The endpoint's function stack: validate, then write |
| `view(state)` | Renders, mutates nothing | Webflow pages, CMS bindings and embeds reading Xano |

The shared discipline is real. Data flows one way: a click never edits a record, it sends a message, and the update decides. The view is disposable, which is why the same backend can sit behind Webflow, 11ty or a native app. And messages have a closed shape.

The difference is **where that shape is enforced**, and it is the whole of this article in one comparison. In iced, `Message` is a Rust enum: a message the program does not declare cannot be constructed, and the compiler proves it before anything runs. `update` trusts its input because its input could only have come from its own code. That is the single-bundle model at its most honest — trust by compile, inside one process, and correct *because* nothing crosses a boundary. Webflow + Xano has no such proof. The endpoint's declared inputs play the enum's part, but anyone on the internet can send a request, so the guarantee the compiler gives iced for free has to be re-earned on every call: schema validation, a capability check, a grant per record. State lives in a shared database, read by people and agents alike, rather than in one process's memory. **Same architecture; the compiler's guarantee becomes the edge's job.**

### SVG: a picture, or a program

The setup section called SVG a picture that executes. That is a property of the renderer, not the format. A browser rendering an SVG document will run its scripts and fetch its references. Elm draws SVG through its own virtual DOM — `elm/svg` views are typed values, not strings — and Elm's virtual DOM refuses `<script>` elements, inline `on*` handlers and `javascript:` URLs outright, so a view cannot be talked into executing what it displays. On the Rust side, **resvg** (with its parser, usvg) renders SVG as a static picture: it implements no scripting and no animation, and with external references switched off an SVG becomes geometry and paint and nothing more. The file did not change. The runtime denied it — the Shopify Functions principle again, at the scale of one image.

### The Adobe-clone case: an InDesign in Rust

The clearest working example is a desktop one. **DesignCraft** is an open-source InDesign clone written in Rust — the same File menu, IDML and EPUB export, Print Booklet, an Interactive panel — and its binary names its parts: **egui** for the interface, **usvg/resvg** for SVG, **quick-xml** and **roxmltree** for XML, **krilla** and **pdf-writer** for PDF, **rustybuzz** and **skrifa** for type. (egui is immediate-mode — it redraws the interface from state every frame rather than dispatching messages through an `update` — so it shares Elm's state-drives-view rule without the typed message log.)

A layout application is the parser pole in its purest form. Its entire job is to open files other people made: IDML, which is zipped XML; placed SVG, PDF and images; fonts. In C++, each of those parsers carries the memory-corruption class that produced a decade of ImageMagick and font-engine advisories, and Rust removes that class at compile time. It does not remove the logic class. roxmltree resolves no external entities, which closes XXE by design, but an IDML archive still needs a decompression cap, a placed SVG still needs its external references off, and a font is still a program for a hinting engine. Outbound, the question reverses: an *interactive* PDF export can carry actions that the reader's viewer will run, so what a layout tool writes deserves the same allow-list as what it reads.

That is the Adobe use case reduced to the article's terms. Rust makes the parser memory-safe; it does not make the file trustworthy. A desktop tool can lean on the compiler because its boundary is one machine and one user. **The moment the same layouts are served to a storefront or handed to an agent, the boundary is the network again**, and the per-request rules above apply to every page, every SVG and every PDF it produces.

## The exception that proves it: Shopify Functions

If executable content is an attack surface by definition, consider the case that ought to be the
worst of all and is not. **Shopify Functions let third parties upload compiled WebAssembly that
runs inside Shopify's own infrastructure**, on the checkout path, for every merchant who installs
the app. Arbitrary vendor code, executing in the payment flow of a platform carrying a
significant share of global commerce.

It is not a catastrophe, and the reasons are the whole argument in miniature. A Function has **no
network and no filesystem** — it cannot open a socket, read a file, or call home. It receives a
typed JSON input and returns a typed JSON output, and the platform validates the output against
what that extension point is allowed to change: a discount, a cart transform, a delivery option.
Execution is bounded, so it cannot hang or mine. The sandbox is a property of the runtime rather
than a policy anyone has to enforce.

Set that beside ImageMagick and the contrast is exact. ImageMagick's delegate system **shells
out** — maximum I/O, invoked automatically on untrusted input, running with whatever privilege
the host handed it. Shopify's runtime takes everything away and hands back two typed ports. Both
are running content someone else authored. One was a decade of remote code execution; the other
is a checkout extension point nobody writes advisories about.

The lesson is not *don't run untrusted content*. Modern operations run it constantly and cannot
stop. The lesson is that **executable content is safe in proportion to what the runtime denies
it** — and that this is an architectural property, not a diligence one. It survives a supplier
who ships something hostile, deliberately or otherwise, because the guarantee never depended on
the supplier.

We are not admiring this from outside. It is the substrate this platform runs on. A Cloudflare
Worker is a V8 isolate with **no filesystem and no ambient network**, and every external reach it
has is declared as a binding: this KV namespace, that R2 bucket, that database, that AI endpoint.
Anything not declared does not exist to the code. A leaked credential cannot read a bucket the
worker never bound, because there is no path to reach for.

And the entitlement model in this article is the same idea moved one layer up. **A binding says
what the code may reach. A capability says what a subject may reach.** Same shape, different
altitude — declared rather than assumed, enforced by the runtime rather than by the caller's good
behaviour, and unchanged by whether the caller is a person, an agent or a machine on a line at
3 a.m. Arguing for entitlement security while running on ambient-authority infrastructure would be
a position, not an architecture.

Which is exactly the shape a validation pipeline should take. Parsing an untrusted model, document
or image is running someone else's content in all but name. Do it where a crash costs nothing: no
network, no filesystem, a hard timeout, a typed input and a typed output. Shopify has already
demonstrated the pattern at a scale nobody else has had to survive.

## Hardening what you already run

The bargain above is an architecture, and most estates cannot adopt one this quarter. So take
the same principle down to the stack you actually have. The order matters: shrink what the
parser may do, then take work away from it, then make sure the controls in front cannot be
walked around.

**Start with the file almost nobody has opened.** ImageMagick reads a `policy.xml` —
usually `/etc/ImageMagick-6/policy.xml` or `/etc/ImageMagick-7/policy.xml` — and ships
permissive by default on most distributions. Deny the coders that exist to reference other
things: `MVG` and `MSL` first, then `PS`, `EPS`, `PDF`, `XPS`, and `URL`, plus `SVG` unless
something genuinely needs it. On ImageMagick 7 you can revoke the whole delegate mechanism in
one line rather than naming formats one at a time. Then set the resource ceilings — memory,
map, area, width, height, disk, time, `list-length` — because the decompression bomb does not
need a CVE and a timeout is the only thing that stops it. Confirm with `identify -list policy`
that the file you edited is the file the binary loads; multiple installs and a stale
`MAGICK_CONFIGURE_PATH` are the usual reason a correct policy does nothing. And read it as
ImageMagick does — an earlier permissive entry can shadow the restriction you added below it.

For ImageMagick 7, the core of it is a dozen lines:

```xml
<policymap>
  <policy domain="delegate" rights="none" pattern="*" />
  <policy domain="coder" rights="none" pattern="{MVG,MSL,PS,EPS,PDF,XPS,URL,HTTP,HTTPS,FTP,SVG}" />
  <policy domain="path" rights="none" pattern="@*" />
  <policy domain="resource" name="memory" value="256MiB" />
  <policy domain="resource" name="map" value="512MiB" />
  <policy domain="resource" name="area" value="128MP" />
  <policy domain="resource" name="width" value="16KP" />
  <policy domain="resource" name="height" value="16KP" />
  <policy domain="resource" name="disk" value="1GiB" />
  <policy domain="resource" name="time" value="30" />
  <policy domain="resource" name="list-length" value="32" />
</policymap>
```

The `path` line is the one the sidebar implies without naming. It refuses the `@` indirection,
which is how `label:@/etc/passwd` turns a thumbnail into the exfiltration channel.

**Treat Ghostscript as its own decision.** The PDF, EPS and PS delegates hand the file to
Ghostscript, which is a language interpreter with its own history of sandbox escapes; `-dSAFER`
has been the default since 9.50 but has been bypassed before. If nothing in the product needs
PostScript rendering, uninstalling Ghostscript removes the chain outright and is worth more
than any policy line. If something does need it, that job belongs on a worker that holds no
credentials and no network route worth having.

**WordPress** picks `WP_Image_Editor_Imagick` whenever the extension is present and falls back
to GD otherwise, so the decision is already made for you unless you make it. The
`wp_image_editors` filter lets you return GD alone, which is the single highest-value change on
a site that only ever resizes JPEGs and PNGs. Separately, PDF upload thumbnails are the
Ghostscript chain arriving through the media library — if you do not need them, stop generating
them. Constrain `upload_mimes` to the types the site genuinely accepts, and keep
`ALLOW_UNFILTERED_UPLOADS` off. The plugin surface matters more than core here: any gallery,
optimiser or PDF-preview plugin can reintroduce the delegate path core just gave up.

**Drupal** defaults to the GD toolkit in core, and ImageMagick only arrives through the contrib
toolkit module. That makes the question explicit rather than implicit: check which toolkit is
selected under the image toolkit settings, and if it is ImageMagick, confirm the estate needs
what it adds. The module passes arguments to a binary, so the `policy.xml` on that host is the
real control, not a Drupal setting.

**Magento is where this stops being about images.** Adobe Commerce lets you choose the image
adapter — GD2 or ImageMagick — in developer settings, and either way the parser is running
inside a system that holds customer PII and sits in PCI DSS scope. That changes what a
successful parse is worth. On a content site, code execution in the image pipeline costs you
the content site. In commerce it lands in the cardholder data environment, next to order
records, customer addresses and the checkout itself.

Two things make it sharper than the CMS cases. First, the upload path is not only
administrative: customizable options accept customer file uploads, so untrusted bytes reach the
parser from the storefront side. Second, `pub/media` serves that user-supplied content **from
the same origin as checkout**, which means a file that renders as a document rather than an
image is script on the payment page — the Magecart pattern exactly, and the reason the serve
rules in this article are not fussiness. Set the adapter deliberately, harden `policy.xml` on
the host, keep execution off the media directory, and then do the thing that actually reduces
scope: move media ingest and delivery to a separate origin so the parser is not in the CDE at
all. PCI rewards that structurally — scope follows the data and the systems that touch it, so
taking the pipeline out of the environment is worth more than hardening it inside.

**AEM** does most raster work in its own libraries, but the DAM Update Asset workflow can shell
out through a command-line process step for the formats it will not handle natively — EPS,
PostScript and some PSD and AI paths — and that step is where ImageMagick and Ghostscript enter
an authoring environment that holds far more than images. Audit which renditions actually
require it, remove the step where they do not, and apply the same `policy.xml` on any host that
keeps it. The Cloud Service direction is the instructive one: Adobe moved asset processing off
the author runtime into isolated compute, which is the Shopify Functions bargain reached from
the other end — not a safer parser, a parser that holds nothing.

**Then put work where the parser is not.** Cloudflare's image transformation runs resize,
crop and format conversion at the edge and returns bytes the platform authored, which is
precisely the incidental hardening the media platforms get and the 3D pipeline does not. Every
transform served that way is a parse your origin never performed.

**On a hosted platform, the edge is the only place you own.** This is the governance argument
rather than a performance one. With Webflow or Shopify there is no host to configure, no
`policy.xml`, no way to set a response header on someone else's CDN — so Cloudflare Rules is
where policy can exist at all. Response header transform rules will put
`X-Content-Type-Options: nosniff` and a `Content-Disposition` on media paths, which applies this
article's own serve discipline to bytes served by a platform that never asked your opinion.
Origin rules route a path prefix somewhere else entirely, which is how media ingest and delivery
leave the commerce origin without migrating the storefront. Cache rules decide what is allowed
to persist at the edge, and normalisation in a transform rule means the canonical form of a URL
is settled before anything downstream interprets it — the same reason naming rules carried the
content-addressed asset paths. None of it touches the vendor's stack, which is the point: it is
policy you can state, version and audit for surfaces you do not control. Cloudflare's managed WAF
rules cover known ImageMagick exploitation patterns, and upload scanning on the higher plans
inspects file content rather than trusting the declared type — worth having, though it is
detection and the format is content-sniffed, so it is a layer and not the boundary. Rate limit
the upload endpoints, because resource exhaustion needs no vulnerability at all. Put Turnstile
on public upload forms and Access in front of `wp-admin`, `/user/login` and the AEM author tier,
since most real exploitation needs an authenticated upload first.

**The PHP estates need this named path by path, because of how they generate derivatives.**
WordPress does its resizing at upload, which is bad enough. Drupal image styles and Magento's
catalog image cache generate on *request* — the derivative is built when someone first asks for
that URL. So on those two, **an unauthenticated GET can trigger an ImageMagick parse**, with no
upload and no account, and a URL pattern that varies can trigger a great many of them. That is
the parse you cannot see in an upload log, and it is precisely what edge rules are good at
containing.

| Estate | The path that matters | Rules to put in front | What it denies |
|---|---|---|---|
| **WordPress** | `/wp-content/uploads/*` | Response header transform forcing `nosniff`, and `Content-Disposition: attachment` for anything not a known image type; WAF custom rule refusing `.php` under the uploads prefix; rate limit on `admin-ajax.php` and the media REST route; Access on `/wp-login.php` and `/wp-admin` | Script executing on your own origin from the media library; the upload-to-RCE classic; brute force against the one door most exploitation needs |
| **Drupal** | `/sites/default/files/*`, and especially `/sites/default/files/styles/*` | The same header transform and `.php` refusal on the files prefix; **cache rule plus rate limit on the `styles` prefix**, so a derivative is generated once and a varying URL cannot mint parses on demand; Access on `/user/login` | An anonymous request stream that turns image styles into a parser DoS, and an image style request that reaches the origin at all after the first |
| **Magento** | `/media/*`, and `/media/catalog/product/cache/*` | Header transform on `/media/*` first, because this origin also serves checkout; cache rule and rate limit on the resize cache prefix; WAF and rate limit on customizable-option upload endpoints; Access on the admin path; **origin rule moving `/media/*` to object storage** | The stored-file-to-script chain that becomes card skimming on the payment page, and — with the origin rule — the parser's presence in PCI scope at all |
| **Any PHP origin** | Every writable directory | Refuse execution of `.php` under any upload or cache prefix; enable the managed ruleset covering ImageMagick and PHP exploitation patterns, in Block — it carries the php2shell rules since 21 October 2026; normalise the URL in a transform rule before anything downstream interprets it | The gap between what the application thinks a path is and what the filesystem resolves it to |

Two honest limits on all of it. The managed ruleset matches known patterns, so it is detection
and not a boundary — the format is decided by content, and a novel payload is still a parse. And
an origin rule that moves `/media/*` elsewhere only reduces PCI scope if the *new* location is
genuinely outside it; pointing the prefix at a second server in the same environment moves the
path and keeps the problem.

**And close the door the rest depends on.** Every edge control above is worth nothing if the
origin answers on its own address. Lock the origin to Cloudflare with authenticated origin
pulls, or remove inbound reachability entirely with a tunnel so the host has no listening port
to find. This is the one people skip, and it is the one that decides whether the others are
controls or decoration.

None of this makes the parser safe. It makes the parser less useful to reach: fewer formats it
will touch, less work sent to it, less it can do when it succeeds, and no path to it that
bypasses the things in front. That is the same sentence as the section above, written for an
estate that cannot be rebuilt this quarter.

### Update, 21 October 2026: php2shell is the runtime, not the plugin

Everything above treats PHP as the host that *calls* a dangerous parser. On 21 October 2026 the
host itself became the parser pole. Two flaws disclosed together as **php2shell** —
[CVE-2026-109618 and CVE-2026-109619](https://www.php.net/archive/2026.php#2026-10-21-5) — let
an unauthenticated request reach remote code execution in the PHP runtime. The first turns
out-of-memory handling into corruption: PHP is interrupted while request data is half
initialised, and cleanup treats it as valid. The second leaves request state alive after its
memory is freed, so **a later request handled by the same worker can use it** — on a commerce
origin, one shopper's request reading what another's left behind. PHP's own advisory lists
PHP-FPM, Apache with `mod_php`, `php-cgi`, FrankenPHP and LiteSpeed as affected, and says
plainly that there is no complete mitigation short of updating.

This is the sidebar's argument arriving from the other side. **No `policy.xml`, plugin update or
theme change touches it** — as [Cloudflare put it](https://blog.cloudflare.com/php-vulnerabilities-waf-protection/),
these flaws are in the PHP runtime, so updating website code or a plugin alone does not fix
them. Every WordPress, Drupal, Magento and Laravel estate in the table above is in scope
whether or not it ever touched ImageMagick.

In order:

1. **Patch the runtime.** The fixed releases are **PHP 8.5.12, 8.4.27, 8.3.36 and 8.2.35**. If
   a host manages PHP for you, the update is theirs to apply and yours to confirm. An estate on
   a branch older than 8.2 has no release to install, which turns an end-of-life PHP version
   from technical debt into an open incident.
2. **Confirm the edge is blocking.** Cloudflare shipped rules for php2shell about nine hours
   before disclosure, after the flaw leaked and attack traffic appeared, and has been
   protecting WAF-enabled zones by default since 03:02 UTC on 21 October — on every plan,
   Free included. Free zones get them through the Cloudflare Managed Free Ruleset with nothing
   to switch on. On Pro, Business and Enterprise, check that the **Cloudflare Managed Ruleset**
   is deployed and its "Anomalous Execution" rules are in **Block**, not Log. Then filter
   Security › Security Analytics › Events by the rule IDs in Cloudflare's post to see whether
   you were already being probed. Attackers were mutating payloads to get past the first
   signatures, so this is detection that buys time, not a boundary.
3. **Shrink what reaches a PHP worker.** Large requests are one way to drive PHP into memory
   pressure. Cap upload sizes, refuse uploads on routes that do not need them, and rate limit
   the endpoints the table names — `admin-ajax.php`, the media REST route, customizable-option
   uploads, the on-request resize caches. Cloudflare is clear these reduce exposure and do not
   replace the fix.
4. **Make the edge the only way in.** The rules above protect only traffic that passes through
   them. An origin still answering on its own address is unprotected, which is why
   [closing that door](#hardening-what-you-already-run) — authenticated origin pulls or a tunnel
   with no listening port — is the step that decides whether step 2 counts. Two wildcards
   quietly reopen it. A **wildcard DNS record** (`*.brand.com`) left as DNS-only — the grey
   cloud rather than the orange — sends every invented subdomain straight to the origin, around
   the WAF and its php2shell rules; proxy it or delete it, and check forgotten records for the
   same thing. And the **catch-all rewrite** that WordPress, Drupal, Magento and Laravel all use
   sends every unknown URL to one `index.php`, so every path anyone invents is a request into
   the vulnerable runtime and a way to push its workers toward the memory pressure the first
   CVE needs. Neither wildcard is the vulnerability. Both decide how much of the internet can
   reach it.

#### A layered setup: allow list, Rust boundary, claims and extras

The steps above are a response. The setup below is the shape that makes the next runtime flaw
smaller before anyone has heard of it. Each layer can only narrow what the one before it let
through, and each is owned somewhere different:

| Layer | Where it runs | What it decides | What it does to php2shell |
|---|---|---|---|
| **1 · Cloudflare allow list** | WAF custom rules and the Managed Ruleset, on the zone | Only known hosts, methods and paths get in; known attack signatures are blocked | Invented subdomains, direct `.php` calls and the published payloads never reach the origin |
| **2 · Rust boundary** | A Worker on the route, compiled to Wasm | The request must parse into a declared market and route, under a size cap | The catch-all rewrite only ever sees routes the site actually serves, and no oversized body arrives |
| **3 · Xano claims and extras** | The system of record, read by the Worker | Who the caller is, what they may do, and what personal data exists | PHP never holds identity or profile data, so stale state has much less to expose |
| **Origin lock** | Authenticated origin pulls or a tunnel | That layers 1–3 are the only way in | No path around the stack |

**Layer 1 — the Cloudflare allow list.** A positive model rather than a list of known-bad: say
what is allowed and block the rest. Three custom rules in Block, ahead of the Managed Ruleset
(also in Block):

```
# Rule 1 — only the hosts this origin serves; a wildcard subdomain ends here
not http.host in {"uk.brand.com" "ca.brand.com" "fr.brand.com"}

# Rule 2 — only the methods the site uses
not http.request.method in {"GET" "HEAD" "POST"}

# Rule 3 — nothing calls a PHP file by name; the front controller is reached by rewrite
http.request.uri.path contains ".php"
```

Rule 3 is a WordPress problem as written, because `wp-admin` and `wp-login.php` are PHP files
by name. Move them to their own hostname behind Cloudflare Access, which the hardening section
already asks for, and the rule holds. Add rate limiting on the routes that accept bodies.

**Layer 2 — the Rust boundary.** The allow list knows hosts and paths as strings. The boundary
knows them as types. A Worker in front of the origin parses every request into a declared
market and a declared route, with a size cap per route, and refuses anything that does not
parse. The catch-all rewrite behind it stops being a wildcard, because nothing undeclared ever
arrives:

```rust
#![forbid(unsafe_code)]

#[derive(Debug, PartialEq)]
pub enum Market { Uk, Ca, Fr }

// The only routes the PHP origin serves. Anything else is refused here, so a
// catch-all rewrite to index.php never sees it.
#[derive(Debug, PartialEq)]
pub enum Route { Home, Page(String), Product(String), Cart, MediaUpload }

#[derive(Debug, PartialEq)]
pub enum Refused { UnknownHost, Method, UnknownRoute, TooLarge }

const MAX_BODY: u64 = 64 * 1024;          // pages and cart posts
const MAX_UPLOAD: u64 = 8 * 1024 * 1024;  // the one route that takes a file

pub fn admit(host: &str, method: &str, path: &str, body_len: u64) -> Result<(Market, Route), Refused> {
    let market = match host {
        "uk.brand.com" => Market::Uk,
        "ca.brand.com" => Market::Ca,
        "fr.brand.com" => Market::Fr,
        _ => return Err(Refused::UnknownHost),          // *.brand.com stops here
    };
    let slug = |s: &str| !s.is_empty() && s.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-');
    let parts: Vec<&str> = path.trim_matches('/').split('/').collect();
    let route = match (method, parts.as_slice()) {
        ("GET", [""]) => Route::Home,
        ("GET", ["pages", p]) if slug(p) => Route::Page(p.to_string()),
        ("GET", ["products", p]) if slug(p) => Route::Product(p.to_string()),
        ("GET" | "POST", ["cart"]) => Route::Cart,
        ("POST", ["media", "upload"]) => Route::MediaUpload,
        ("GET" | "POST", _) => return Err(Refused::UnknownRoute), // includes any *.php
        _ => return Err(Refused::Method),
    };
    let cap = if route == Route::MediaUpload { MAX_UPLOAD } else { MAX_BODY };
    if body_len > cap { return Err(Refused::TooLarge); }  // memory pressure starts at the edge
    Ok((market, route))
}
```

`promo.brand.com` is an unknown host. `/wp-content/x.php` and `/random/../../etc` are unknown
routes. A 10 MB post to the cart is too large. None of them reaches PHP, and the `Market` that
comes out is the same type the consent check further down uses — so the market a request was
admitted under is the market its data is allowed to feed. The media upload route is the one
place a file arrives, and it goes to the [Rust stage](#rust-in-the-loop-re-encode-before-anything-parses),
not to PHP.

**Layer 3 — Xano claims and extras.** The first two layers decide what may reach the origin.
This one decides what the origin ever holds. Following the [claims-and-extras model](https://crm-sync.dev/docs/hyperscaler-vs-distributed),
the Worker reads, in order: the token, which proves identity and nothing more; the account
status, checked before any write; the **claims** in `user_claims`, the identity links to Google
and Shopify; the **extras** in `user_extras`, profile and preference fields that are cleared when
marketing consent is withdrawn; and the entitlement. The decision is made at the gate, and the
PHP origin renders pages and takes cart posts without ever being handed a claim or an extra.

That is what changes the second CVE. CVE-2026-109619 lets a later request read state an earlier
one left behind in the same worker. If identity, profile and consent live in Xano and are read
at the gate, there is far less in a PHP worker's memory for that stale state to expose: no
customer profile, no consent record, no linked account. The flaw is unchanged. What it can
reach is not.

#### Where else PHP hides: Shopify apps and Adobe Commerce

**Shopify apps.** Shopify's own platform is not PHP, so a Shopify storefront has no PHP runtime
to patch. Its apps are another matter. Many run on PHP — Laravel, or Shopify's own PHP API
library — on servers their developers host, and Shopify sends traffic to them: **App Proxy**
forwards storefront requests under `/apps/…` to the app's server, and **webhooks** post order and
customer events to it. Two things make that sharper than a single site. An app server holds
Admin API tokens for every store that installed it, so code execution there is a breach of
every merchant at once. And checking the App Proxy signature or the webhook HMAC *in PHP* does
not help, because php2shell fires while PHP is processing the request, before the app's own
code runs.

- **If you build the app:** patch PHP, put the App Proxy and webhook endpoints behind the same
  allow list, and verify the HMAC in a Worker — over the raw body for webhooks, over the query
  string for App Proxy — so an unsigned request never reaches PHP. That is layer 2 above, with
  Shopify's signature as one of the types.
- **If you run the store:** list the installed apps that take App Proxy traffic or hold broad
  scopes, ask each vendor whether their backend is PHP and patched, and remove the ones that
  cannot answer. The theme wildcard table applies to their storefront scripts as well.

**Adobe Commerce and Magento.** These are PHP end to end, and the Magento row of the edge table
already puts the image pipeline inside PCI scope; php2shell puts the whole runtime there. Two
setups need different steps:

- **Self-hosted Magento or Magento Open Source behind Cloudflare:** everything in this section
  applies as written — patch, Managed Ruleset in Block, the allow list, the boundary, the
  origin lock. Keep the admin URL on its own hostname behind Access.
- **Adobe Commerce on cloud infrastructure:** the edge is Fastly with Adobe's WAF, not
  Cloudflare, so Cloudflare's rules never see the traffic unless you have deliberately put a
  Cloudflare zone in front. Ask Adobe whether its WAF carries php2shell protection, and confirm
  the patched PHP release is in your environment. The PHP branch is set in `.magento.app.yaml`,
  and a redeploy is how a new platform image reaches the store.

Adobe Experience Manager is Java, not PHP, so php2shell does not touch it. Its DAM process steps
and their ImageMagick and Ghostscript calls remain the risk the hardening section describes.

**Across Adobe's products, the two exposures stack.** ImageMagick reaches Adobe estates by two
different doors, and in Commerce it opens inside the same PHP process php2shell attacks:

| Adobe product | Runtime | Where ImageMagick enters | php2shell | What to do |
|---|---|---|---|---|
| **Adobe Commerce on cloud infrastructure** | PHP | The ImageMagick image adapter, when selected, with the `imagick` extension enabled in `.magento.app.yaml` | Yes | Use the GD2 adapter unless you need ImageMagick; confirm the patched PHP and redeploy; ask Adobe about Fastly WAF coverage |
| **Magento Open Source and self-hosted Commerce** | PHP | The same adapter, through the PHP `Imagick` extension | Yes | Everything in this section, plus a hardened `policy.xml` on the host |
| **AEM 6.5 and Managed Services** | Java | A command-line process step in the DAM Update Asset workflow, calling ImageMagick and Ghostscript for EPS, PS, PSD and AI | No | Audit which renditions need the step, remove it where they do not, `policy.xml` on any host that keeps it |
| **AEM as a Cloud Service** | Java | Asset processing runs in Adobe's isolated asset compute, not on the author tier | No | Nothing on the host to patch — the parser holds nothing, the Shopify Functions bargain reached from Adobe's side |

The Commerce rows are the worst case in this article. With the ImageMagick adapter on, a
customer's upload or an unauthenticated request for an uncached product image size is decoded
by C code **inside a PHP worker**: two parsers that have each produced remote code execution,
in one process, in PCI scope, reachable without an account. A crash or a takeover in either is
a crash or a takeover of the other. Switching to GD2 removes one of the two. Patching PHP fixes
the other. Moving media ingest to the [Rust stage](#rust-in-the-loop-re-encode-before-anything-parses)
in a Worker, and catalog images to an origin outside the commerce stack, takes both out of the
request path.

#### The same day: Node.js CVE-2026-111497 and the LiteLLM release

PHP was not the only runtime with a bad Wednesday.

**Node.js — CVE-2026-111497.** The [October 2026 security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
fixes an out-of-bounds write in Node's Brotli decoder that permits remote code execution, rated
high, on the 22.x, 24.x and 26.x lines, alongside three other high-severity fixes for TLS
hostname checks and DNS. The fixed releases are **22.23.4, 24.22.1 and 26.12.1**, and Node's own
note is blunt: end-of-life versions are always affected, so an odd-numbered or retired line has
no patch at all. The reach is wider than code that calls `zlib`: `fetch()` decompresses Brotli
responses on its own, so any Node service that fetches from a server it does not control can
hand that server's bytes to the decoder. The fix is a cherry-pick of an upstream Brotli commit,
which is worth watching in anything else that bundles the library.

*Is Node managed?* It depends where it runs, and it is the same question as PHP's — the runtime,
not the package, so `npm update` does not fix it:

| Where the JavaScript runs | Who patches the runtime | What to do |
|---|---|---|
| Cloudflare Workers, and Shopify Oxygen, which runs on Cloudflare's open-source Workers runtime | The platform. These are not Node.js processes, and there is no runtime version for you to set | Nothing to install. Your `nodejs_compat` code runs on the platform's implementation, updated by the platform |
| A managed functions platform | Usually the platform, within the major version you selected | Confirm the patch has rolled, and move off any end-of-life major |
| Your own servers and containers — a Shopify app on Node, a self-hosted Next.js or Remix app | You | Install 22.23.4, 24.22.1 or 26.12.1 and rebuild images; the base image tag pins the runtime |
| Developer machines and CI runners | You | Same versions. Build tools such as Vite and Wrangler run on Node and fetch from the network |

**LiteLLM 1.107.0 — a poisoned AI gateway.** At 11:39 UTC on 21 October a malicious LiteLLM
1.107.0 was [published to PyPI](https://socket.dev/blog/litellm-compromise), with matching
container images on GitHub's registry and Docker Hub — and for a time the floating `latest`,
`main-latest` and `main-stable` tags resolved to the same image. The wheels drop a `cook.pth`
file and a `sitecustomize.py` into the Python environment, so the payload runs on **any** Python
start, not only when LiteLLM is imported. It collects cloud and Kubernetes credentials, SSH and
signing keys, `.env` files, browser data and AI tool tokens — and, where `DATABASE_URL` is set,
LiteLLM's own stored provider keys — and sends them to a lookalike domain. The release
provenance names a source owner one hyphen away from the real one. It is the project's second
supply-chain compromise this year.

- Block 1.107.0 and stop deploying the affected tags or digests, floating tags included. Pin
  `1.106.2` (the version investigators point to) by digest, not by tag.
- If Python ran anywhere 1.107.0 was installed, treat every secret that environment could read
  as exposed. Rotate from a clean machine, and do not run the affected `pip` or `python` to clean
  up — starting Python re-runs the payload.

This is the trust-by-compile section happening live: the package resolved and installed, so it
was treated as ours, and the install put code in the path of every interpreter start. It is also
the "AI strategy is not a JVM" argument in one incident. An AI gateway is built to hold every
model provider's key in one process, which makes it the most valuable thing an attacker can
poison. The [task binding](#ai-task-binding-cloudflare-binds-xano-grants-rust-checks) model keeps
provider keys as bindings on a Worker, issues each agent call a grant for one task, and ledgers
the call — so a compromised component in the request path finds no master key to take.

The structural reading is the same as everywhere else in this article. **Media ingest that has
already moved to a Worker and the Rust stage below never hands a hostile body to a PHP process
at all**, and a storefront that serves from Shopify or Webflow has no PHP runtime of its own to
patch. php2shell does not change the architecture this article argues for. It is what that
architecture is for: a flaw in someone else's runtime, on an ordinary Wednesday, with the patch measured in
hours and the exposure measured in whatever the runtime could reach.

## Rust in the loop: re-encode before anything parses

Everything above shrinks what ImageMagick may do. The structural step is to stop handing it, or
any C parser, the sender's bytes at all. Put a small Rust stage first in every ingest loop:
determine the type from the bytes, check it against an allow-list, decode under hard limits,
and re-encode. Everything downstream — the CMS, the thumbnailer, the DAM, an agent — only ever
sees bytes your own code wrote. That is the re-serialisation the custody paragraph asked for,
with a name on it.

**1 · The stage.** The `image` crate's decoders for PNG, JPEG, WebP and GIF are pure Rust, and
building it with only those features is itself an allow-list: a format that was not compiled in
cannot be parsed.

```toml
[dependencies]
image = { version = "0.25", default-features = false, features = ["png", "jpeg", "webp", "gif"] }
```

```rust
#![forbid(unsafe_code)]
use image::{ImageError, ImageFormat, ImageReader, Limits};
use std::io::Cursor;

#[derive(Debug)]
pub enum Rejected { Format, Image(ImageError) }
impl From<ImageError> for Rejected { fn from(e: ImageError) -> Self { Rejected::Image(e) } }
impl From<std::io::Error> for Rejected { fn from(e: std::io::Error) -> Self { Rejected::Image(e.into()) } }

pub fn sanitize(bytes: &[u8]) -> Result<Vec<u8>, Rejected> {
    // Type from the magic bytes, never from the filename or the declared MIME type.
    let mut r = ImageReader::new(Cursor::new(bytes)).with_guessed_format()?;
    match r.format() {
        Some(ImageFormat::Png | ImageFormat::Jpeg | ImageFormat::WebP | ImageFormat::Gif) => {}
        _ => return Err(Rejected::Format),
    }
    let mut lim = Limits::default();
    lim.max_image_width = Some(8192);
    lim.max_image_height = Some(8192);
    lim.max_alloc = Some(64 << 20);          // decompression-bomb ceiling, inside a 128 MB isolate
    r.limits(lim);
    let img = r.decode()?;                   // trailers, polyglots, metadata and scripts gone
    let mut out = Cursor::new(Vec::new());
    img.write_to(&mut out, ImageFormat::Png)?; // what you store is your output
    Ok(out.into_inner())
}
```

Decoding produces a typed `DynamicImage`: pixels, dimensions, a colour type, and nothing else.
That is the iced comparison above, moved to the edge — a malformed file cannot become anything
except an error, because there is no other value the decoder can return.

**2 · SVG goes through usvg.** Same idea, with the tools this article already named. usvg parses
an SVG into a tree of paths, paint and text; it has no model for scripts, event handlers or
`foreignObject`, so they do not survive the round trip. Give it an image-href resolver that
refuses external files, then either rasterise with resvg or write the normalised tree back out
with `Tree::to_string`. Either way the stored SVG is one usvg wrote.

**3 · Run it where a crash costs nothing.** Compile the stage to `wasm32` and run it inside a
Worker, or under wasmtime with fuel metering and a memory cap. That is the Shopify Functions
bargain applied to your own ingest: no filesystem, no network, bytes in, bytes out, a hard
ceiling on time and memory. A decoder bug, should one exist, panics inside a sandbox that holds
nothing worth reaching.

**4 · Route only re-encoded output downstream.** WordPress, Drupal image styles, Magento's resize
cache and AEM renditions then process your PNG, not the sender's file. ImageMagick can stay
installed, policy and all, but it never parses hostile input. The on-request derivative problem
from the PHP estates shrinks with it: a GET that mints a thumbnail is now parsing a file you
authored.

**5 · Gate the Rust supply chain too.** The trust-by-compile section already flagged `build.rs`
as code that runs at install. `#![forbid(unsafe_code)]` covers your crate, not its
dependencies, so add `cargo-deny` and `cargo-audit` in CI, `cargo-vet` for the decoder crates,
and a CycloneDX SBOM from `cargo-cyclonedx`. The SBOM ties the stage back to the CRA evidence
this article ends on.

| | ImageMagick in the loop | Rust in the loop |
|---|---|---|
| Memory-corruption class | Present — a decade of CVEs | Removed at compile time in safe code |
| Shell-out / delegates | Possible by design | No delegate mechanism exists |
| Format coverage | Every coder that shipped | Only the features compiled in |
| What is stored | The sender's bytes | Your re-encoded output |
| Safety depends on | A `policy.xml` someone remembers | The runtime and the type system |
| Runs in | A host process with ambient privilege | A Wasm sandbox with no filesystem or network |
| Trust model | Single bundle — trusted once installed | Per request — every file earns it |
| AI-speed access | Every agent-triggered parse reaches C | Agents only read sanitised output |

Four honest limits. **Logic bugs remain**: Rust removes memory corruption, not logic flaws, so
bombs still need the `Limits` and pathological inputs still need a timeout. **Format coverage
is narrower**: PSD, EPS, AI, HEIC and the 3D/CAD formats in the next section have thin or
partial Rust support, so reject them at the edge or quarantine them to an isolated worker that
holds no credentials. **Re-encoding changes files**: PNG output loses JPEG compression and
drops colour profiles and EXIF, so re-encode JPEG to JPEG where size matters and carry
provenance in your own ledger rather than in the file. **An isolate caps memory**: a Worker's
128 MB will not decode a very large image, so route oversize files to a container sandbox under
the same rules — no credentials, no network route worth having, a hard timeout.

## Runtime by runtime: where the trust breaks

The receipts name products. Underneath they are runtimes, and the AI question is the same for
each one: **when an agent touches this estate, what does it inherit?**

A note on grouping. Strictly, only some of these are JVMs: Salesforce runs Apex on its own
multitenant Java platform and AEM is Java on Apache Sling. Cityworks is .NET, and Unity ships C#
through Mono or IL2CPP. They share the trait that matters here — a managed runtime that rebuilds
objects and trusts whatever is already inside the process. That is the "JVM is a runtime, not a
boundary" point from the JSON section, and the .NET and Mono cousins inherit it whole.

| Estate | Runtime | Where trust breaks | AI challenge | Cloudflare · Xano · Rust benefit |
|---|---|---|---|---|
| **WordPress** | PHP, Imagick → ImageMagick → Ghostscript | Every upload is parsed by C code running with the site's privileges | Agents that draft posts or import media trigger the same parse at machine speed, and plugin REST routes hand them admin-shaped capabilities | The Rust stage re-encodes before WordPress sees the file; edge rules on `/wp-content/uploads/*`; agent writes go through a Worker that holds the application password, so the agent never does |
| **Adobe Commerce (Magento)** | PHP, GD2 or ImageMagick, inside PCI scope | Customer file uploads and the on-request resize cache, served from the checkout origin | One admin integration token reaches orders, customers and the cardholder environment together | Media off-origin to R2 behind a Worker; Rust re-encode; a Xano grant scopes an agent to one order, not to the integration |
| **Adobe Experience Manager** | JVM — Sling, OSGi, the JCR | The DAM Update Asset workflow shells out for EPS, PS, PSD and AI | The repository is one tree under one ACL model, so an agent's service user tends to get a broad path | Renditions built from re-encoded bytes; content leaves as typed JSON records, one grant per path |
| **Salesforce** | Apex on Salesforce's Java platform; connected apps and managed packages | A plugin's OAuth token acts with the plugin's whole scope | In August 2025 OAuth tokens stolen from the Salesloft Drift integration were used to export Salesforce data from many organisations. An agent on a connected app is that same shape | The token stays in the Worker; the agent gets a per-task grant naming objects and fields; every query is ledgered |
| **Trimble Cityworks** | .NET on IIS, on-premises | Deserialisation of attacker-shaped objects — CVE-2025-0994 | A municipality's whole asset graph sits behind one application identity, and an agent reading it inherits that identity | Records leave as typed JSON through a Worker, where a payload can only become data; the silo stays the system of record |
| **Unity** | C# on Mono or IL2CPP, shipped to the client | The bundle is the runtime — CVE-2025-59489 needed a rebuild | AI unpacks a bundle in minutes, so anything inside it is published | The bundle rule: derivatives only, entitlement checked at the Worker, masters in R2 behind per-grant URLs |
| **Shopify apps** | Apps on their own hosts with Admin API tokens; theme app extensions in the storefront; Functions in Wasm | An app's token carries every scope it was granted until it is revoked | One app's `read_customers` is every customer, and an agent acting through the app holds all of it | Functions are already the target model. For the rest, the Worker holds the token and answers the agent with one cart or one order, under a Xano grant |

Read down the last column and it says one thing three ways. **Cloudflare decides what can be
reached. Xano records who was granted it. Rust decides what the bytes can become.**

## Nobody supports 3D files securely

Say it plainly, because the market has not: **there is no platform today that accepts a 3D or CAD
file, validates it, and can prove who opened it.** Every vendor does one of those three things and
calls it the set.

The media platforms — Cloudinary, and the asset side of suites like OpenText — are built around a
real and different job: ingest an image or a video, *transform* it, deliver it fast and cached.
That pipeline is their product, and it incidentally hardens images, because a re-encoded raster is
a new file the platform authored. A JPEG that arrives hostile leaves as bytes the CDN produced.

3D does not get that. Models arrive as **pass-through bytes** — stored and delivered, not parsed,
not re-emitted, not inspected — because no transform pipeline exists for GLB, STEP, IFC, USD or
Apple's zipped USDZ the way one exists for JPEG. So you get CDN delivery with none of the incidental safety, which is the
worst combination available: fast global distribution of a file nobody looked inside.

And the reason nobody built that pipeline is the reason it matters. **Validating a model means
parsing it, and the parser is the attack surface** — the same lesson ImageTragick taught for
images, waiting to be relearned on formats with far more structure: external resource references,
zip containers, layer composition, scripting-adjacent scene description. Building it safely
requires the Shopify Functions bargain — no network, no filesystem, typed in, typed out, hard
timeout — and almost nobody has bothered, because the market treats a model as a picture that
spins.

Meanwhile the third leg is missing entirely. A storage link, once shared, is shared forever, and
no media CDN can tell you which customer opened which revision of a part. For an image that is an
acceptable loss. For a controlled part file, a firmware image, or a model under licence, it is the
whole question.

### The descriptor gap, and why it is Markdown

There is a second absence underneath. Media platforms describe an asset with tags and
transformation parameters, because that is what a delivery pipeline needs. An **artifact** needs
something else: provenance, licence, the entitlement that governs it, the SBOM or certificate it
is bound to, the market it may be sold into, and the validation it passed.

That description has to travel — from a repository to a CMS, into a product feed, onto a channel,
and into the context window of a model being asked about it. **Markdown with YAML frontmatter is
the only form that survives all of those**, and survives them in a way both a person and a machine
read the same: it diffs in Git, renders as a page, parses as structured data, and needs no vendor
runtime to open. A proprietary asset record in a DAM is legible to that DAM. A front-matter block
is legible to everything, including the next tool nobody has built yet.

Which is the whole argument in a different key. The artifact travels; the descriptor travels with
it; the **grant** stays behind and decides who may open either.

## The dark factory raises the stakes to maximum

A lights-out facility is the limit case: no operator to click "approve," no one watching at 3 a.m., every firmware fetch and version promotion machine-to-machine by definition. Authorization *must* be a mandate — a scoped, revocable, machine-verifiable grant — because nothing else is present to hold authority. And the incumbent posture there is perimeter mythology at industrial scale: air-gaps that stopped being real a decade ago, vendor VPNs with shared credentials, firmware on USB sticks. A production line with nobody in the building is the highest blast radius in commerce, defended by the oldest assumptions in computing — while regulation is already writing the audit requirements the old model cannot produce. The [EU Cyber Resilience Act (CRA)](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act) ([Regulation (EU) 2024/2847](https://eur-lex.europa.eu/eli/reg/2024/2847/oj)) has two clocks running, and the near one is the sharp one: **from 11 September 2026, Article 14 reporting obligations apply — manufacturers must report actively exploited vulnerabilities and severe incidents to ENISA and national CSIRTs, including for products already on the EU market.** Full application — essential cybersecurity requirements, secure-update obligations, conformity assessment, CE marking — follows on 11 December 2027, alongside IEC 62443 and NIS2. Read the September obligation carefully: you cannot report active exploitation you cannot see. A vendor whose distribution model is expanding EXEs and whose audit trail is whatever the silo logged has no mechanism to *know* a vulnerability is being exploited, let alone produce the report. The reporting deadline is, quietly, an evidence-ledger mandate.

## Entitlement security: the model that survives

The architecture that survives AI-speed extraction concedes the artifact and defends the ledger. Its rules are few:

**1 · The bundle rule (absolute).** Anything shipped into a client bundle — game platform, installer, device image — is public on arrival. Design for it: masters never leave the asset system; platforms receive baked-down, watermarkable derivatives that are *meant to be losable*. Client-side asset protection is not a control; it is a delay that AI has already collected.

**2 · One grant engine, five subjects.** Every access decision is the same primitive — an entitlement: a scoped, revocable, auditable grant issued by an event. The subjects vary; the engine does not:
- an **invitation** (a person you chose),
- a **purchase** (a person who paid),
- a **commission** (a person who distributes),
- an **agent mandate** (a machine acting for one of the above — same grant, tighter dimensions: spend caps, expiry, task scope),
- a **device attestation** (hardware fetching firmware — the dark factory's subject).

A "mandate for AI agents" is not a new security category. It is permissions for machines, running on the engine you already need for people.

**3 · The envelope: searchable head, gated payload.** Wrap every distributed asset — 3D model, firmware image, document — in a plain-data envelope: a metadata head (name, version, taxonomy, provenance, license, published hash) that is inert, machine-searchable, and lands in *your* warehouse, joinable against usage, conversions, and incidents; and a payload reference that is entitlement-gated (short-lived, per-grant signed URLs). This is the direct answer to both silo failures: the head is what BIM platforms won't let you index; the gate is what executable formats never had. JSON carries no scripts; the envelope has no executable surface.

**4 · Healing encryption, per row.** The fortress model always faced a false choice: never share (the silo — unjoinable, unauditable, commercially suffocating) or export plaintext — and a shared plaintext file is a trojan horse in *both directions*: it carries your value out uncontrolled, and it returns as the opaque re-importable blob that deserialization attacks ride in on (that is the Cityworks shape). Per-row encryption dissolves the dilemma. Every asset payload gets its own key; keys are wrapped per-grant (the JWE pattern), so **possession is not access** — the ciphertext can be distributed in real time, cached anywhere, mirrored by anyone, and it remains inert. And the encryption *heals*: rotating a row key or revoking a grant re-wraps server-side without recalling a single distributed copy — the copies in the wild simply go dark at their next unwrap. A leak stops being an event you contain and becomes a key you retire. Formerly risky asset distribution — live BIM models to subcontractors, firmware to third-party integrators, 3D masters to manufacturing partners — becomes a real-time operation, because the security was never in the file.

**5 · Sign in a ceremony, publish the hashes.** Signing keys live in a controlled ceremony and never inside any artifact — a ripped bundle yields nothing mintable. Released hashes go to a transparency ledger, which makes the cheapest AI-era supply-chain attack — the lookalike installer — *detectable by anyone*. Per-copy serials give every leak an attribution.

**6 · Precision over copilots.** Where AI operates the system, it runs as a precision tool runner: a small, curated toolset for one job, where the entitlement boundary *is* the AI's capability surface — enforced at the data plane on every call, never by the prompt. A runner cannot be talked into a tool it was never granted; the injection ceiling is the grant ceiling. Every invocation writes a ledger row, which means the AI's operation *produces* the compliance evidence as a side effect.

**7 · Mini slingshots, not fortresses.** The monolith is the fortress, and the fortress is the breach: one perimeter, one blast radius, too big for anyone to audit. Build many small, grant-scoped, individually auditable services — each too small to breach interestingly, each cheap to lose and redeploy. The only monolith worth keeping is the append-only ledger, and the ledger never ships to a client.

## The leaders still lead — the bridge is the gap

None of this displaces the undisputed leaders. Siemens and Rockwell run the world's factories; their platforms are the system of record for physical operations, and that is not changing — nor should it. What has changed around them is speed and shape: **AI now moves against operational data in real time, and the leaders' functional data shape was designed for a different era** — historians, asset graphs, and proprietary interchange formats built for batch reporting and human-paced workflows, exchanged as exactly the opaque-blob documents this article opened with. Making that data addressable by fast-moving AI *without* making it the next deserialization surface is the bridge problem, and it is extra work the platforms were never designed to do themselves.

The gap has a measurable signature: **the 24-hour/15-minute inheritance.** The enterprise interchange layer still runs on scheduled windows — classic EDI moves on daily and intraday trading-partner cycles by protocol culture (files, acknowledgment windows, retransmission contracts); SAP crosses company boundaries on IDoc batch runs and nightly deltas; and even the newest CDP-class platforms from Salesforce and Adobe refresh standard segments on 12–24-hour cycles, selling "rapid" hourly tiers and streaming carve-outs as premium upgrades. That pattern is the tell: batch is not a limitation the incumbents haven't fixed — it is the amortization schedule of their architecture. Recomputing against silo-shaped storage is expensive, so the delay window is *priced*, not solved. Batch is the wrong-shape problem expressed in time — and an AI consumer asking a question *now* against yesterday's window gets a wrong answer delivered with confidence.

The full wound map and its heal are diagrammed in the companion piece — [BIM Fortress Exposure vs the Event-Socket Heal](https://crm-sync.dev/share/bim-fortress-event-socket) — drawn A+-respectful for Trimble estates: the record stays theirs; the gate and the receipts are the more.

That bridge is what the entitlement substrate is for, and it is a coexistence layer by construction: the envelope gives the leaders' functional data a searchable, inert, warehouse-joinable head without touching the system of record; healing per-row encryption lets that data move to AI consumers at real-time speed while possession stays separated from access; the grant engine scopes every AI tool-call to an entitlement boundary; and the ledger hands Insights Hub, FactoryTalk, and the auditors behind them the evidence trail regulation now demands. The substrate has no batch core to upgrade from — an event lands as a consent-stamped, grant-scoped row in the same cycle it happened in, because rows-with-grants were the unit of exchange from the start, and real-time is the default physics rather than the premium tier. The leaders keep the factory. The substrate keeps the gate and the receipts — and feeds everything back into the platforms the operation already trusts.

## Four clouds, four data transports

The bridge problem has four common transports, and in most enterprises each one lives on a
different cloud. None of them is replaced. Each gets the same three additions at its edge.

| Transport | Where it usually runs | How data moves | AI challenge | Cloudflare · Xano · Rust benefit |
|---|---|---|---|---|
| **ERP — SAP S/4HANA, Dynamics 365** | Azure: RISE with SAP or SAP on Azure; Dynamics on Dataverse | IDocs, OData and BAPI calls; Dataverse events to Service Bus | ERP copilots run as service principals with ERP-wide roles, and batch IDoc windows mean the agent answers from last night | A Worker takes the event and carries IDs, not documents; Xano holds the grant; the agent asks for one material or one purchase order |
| **CRM plugins — Klaviyo, Salesforce** | Each vendor's SaaS, each with its own copy | Shopify app sync, connected-app OAuth, scheduled exports | Every plugin keeps a full copy of the customer, every copy needs its own consent state, and each plugin token is ambient authority over its copy | Xano is the source of truth for identity and consent; the Worker forwards IDs and consent flags under one narrow key per interface; a suppression travels as an event, not a nightly job |
| **EDI on AWS — X12, EDIFACT** | AWS Transfer Family (AS2, SFTP) and B2B Data Interchange, into S3 | Positional files on trading-partner windows: 850 order, 856 ship notice, 810 invoice | An agent needs one shipment's state now. The file holds a batch, lands in S3 as a full payload copy, and an LLM reading raw X12 guesses at segment positions | B2B Data Interchange emits JSON; EventBridge notifies a Worker; a Rust parser types each transaction set into a record with a published schema; the agent reads the record, never the file |
| **Audience event bus — Google Merchant Center, BigQuery** | GCP: Pub/Sub, BigQuery, the Merchant API | Product feeds out; GA4 and conversion exports in; audiences joined in BigQuery | BigQuery is where everything joins, and an agent querying it runs as a service account that can read the whole dataset. The Merchant feed is published to Shopping and AI surfaces as written | The Worker's egress gate checks consent before anything is published; Xano carries consent per row; feed items are validated against schema before the Merchant API; agents get aggregates through clean-room templates, never rows |

The pattern in the last column is the [owned-event binding](https://persephonepunch.github.io/crm-sync-setup/svg-rust-elm-security-gaps.html#binding-owned-events-vs-latent-ipaas-and-the-clean-room-for-ai)
from the companion piece: a signed event, a gate at the edge, IDs on the queue, an idempotent
writer, and a ledger row for every yes and no. Each cloud keeps its own controls as the floor.
The [Hyperscaler vs Distributed](https://crm-sync.dev/docs/hyperscaler-vs-distributed) comparison
covers what those controls are, and where each one stops at its own edge.

## AI task binding: Cloudflare binds, Xano grants, Rust checks

Every row in the last two tables ends on the same requirement. **An agent should receive one
task, not one platform.** Task binding is how that gets enforced rather than requested:

1. **The event arrives signed** — a webhook, an EventBridge or Pub/Sub delivery, a Service Bus
   message. The Worker checks the signature on the raw body and takes an idempotency key from
   the event ID.
2. **Xano issues the grant**: one task, the record IDs it covers, the purpose, the region and an
   expiry. The grant is a row, so revoking it is a write and auditing it is a read.
3. **The Worker holds every credential.** The ERP service principal, the Salesforce token, the
   Shopify Admin token and the BigQuery service account are bindings on the Worker. The agent
   never sees one.
4. **Rust checks the shape** of what the agent asks for and of what comes back, inside the
   isolate. A tool the program does not declare cannot be constructed.
5. **The ledger records the call** — the grant that allowed it, the task, the bytes returned.

The check in step 4 is small enough to read in full:

```rust
#![forbid(unsafe_code)]
use serde::Deserialize;

// The only tasks an agent can ask for. A tool name or field not declared here
// is a parse error, not a request.
#[derive(Debug, PartialEq, Deserialize)]
#[serde(tag = "tool", deny_unknown_fields)]
pub enum Task {
    ReorderMaterial { material: String, qty: u32 },  // ERP: one requisition
    ReadShipment { asn: String },                    // EDI: one 856
    SuppressProfile { profile: String },             // CRM: one consent change
    PublishOffer { offer_id: String },               // GCP: one Merchant offer
}

// Issued by Xano, held by the Worker, never by the agent.
pub struct Grant { pub task: Task, pub purpose: &'static str, pub expires: u64 }

#[derive(Debug, PartialEq)]
pub enum Denied { Malformed, Expired, OutOfScope }

pub fn authorize(grant: &Grant, now: u64, tool_call: &str) -> Result<Task, Denied> {
    let asked: Task = serde_json::from_str(tool_call).map_err(|_| Denied::Malformed)?;
    if now >= grant.expires { return Err(Denied::Expired); }
    if asked != grant.task { return Err(Denied::OutOfScope); }
    Ok(asked)
}
```

`{"tool":"ExportAllCustomers"}` is malformed, not denied — there is no such value to deny. An
extra `"all": true` is malformed too. The right tool aimed at a different shipment is out of
scope. That is the iced `Message` enum from earlier, moved to the network edge, and it is the
gate the [AI-strategy-is-not-a-JVM](https://crm-sync.dev/docs/hyperscaler-vs-distributed) argument asks for: deterministic,
memory-safe, and outside the model.

| Task | Bound to | Never reaches |
|---|---|---|
| Reorder one material | One SAP or Dynamics purchase requisition, one plant, under a spend cap | The ERP role the service principal holds |
| Read one shipment | One 856 record, typed | The S3 bucket of raw EDI files |
| Suppress one profile | One consent change, propagated as an event to Klaviyo and Salesforce | Either CRM's customer export |
| Publish one offer | One validated Merchant API item | BigQuery rows, or any other offer |

The model can be as capable as you like behind that line. **Capability is not authority**, and in
a bound task the authority is a row in Xano, a binding on a Worker and a type in Rust.

## One subject, every channel: when consent is a browser cookie

Every enterprise has the same three facts, and the figure at the top of this article draws them.
**The CMP is per site** — each country domain loads its own banner and keeps its own answer.
**Four clouds sit behind a JVM bus** that moves data on a schedule, when the business now needs
it in real time. And **the Google Merchant audience and the Shopify audience both need the same
answer** about the same person, so they have to plug into the same socket, not two exports.

### The example breach

This is a composite, not a reported incident, and none of it is a defect in OneTrust or any other
CMP. It is what a browser-only deployment of any consent banner records, at enterprise scale.

A brand runs `uk.brand.com`, `ca.brand.com` and `fr.brand.com`. Each theme loads the CMP script
with its own domain ID, and each choice lands in an `OptanonConsent` cookie and, with consent
logging on, in the vendor's cloud. The three markets do not share rules:

| Site | Regime | What differs |
|---|---|---|
| `uk.brand.com` | UK GDPR and PECR | Consent for non-essential cookies, with the Data (Use and Access) Act 2025 relaxing some low-risk analytics cookies as its provisions commence |
| `ca.brand.com` | PIPEDA, and Québec's Law 25 | Law 25 requires privacy by default: anything that identifies, locates or profiles a person starts switched off |
| `fr.brand.com` | GDPR as applied by the CNIL | Refusing must be as easy as accepting, and the CNIL recommends keeping a choice for six months before asking again |

Four things break, and each is numbered in red in the figure:

1. **Cookie scope across markets.** Scope the cookie to `.brand.com` and a choice made under UK
   rules is replayed on `fr.brand.com`, where it was never valid. Scope it per host instead and a
   withdrawal on one site never reaches the other two. Neither setting is right, because the
   cookie was never the right place for the record. With separate country domains — `brand.co.uk`,
   `brand.ca`, `brand.fr` — nothing can be shared at all.
2. **A dangling subdomain.** Any host under `brand.com` may set a cookie for `.brand.com`. A
   forgotten campaign site, `promo.brand.com`, still CNAMEd to a service nobody pays for, can be
   claimed by someone else and used to write "accept all" into every market's consent cookie.
3. **Plugin wildcards in the visible theme.** The theme source is public, so it is a map. See the
   table below.
4. **A session ID, not a subject.** The record is keyed to a browser identifier held in the
   vendor's log. The till, the app, the chatbot and the devices never present that cookie, so they
   cannot read the answer and cannot write one. Sharing across domains needs a known person — the
   vendor's own [cross-domain consent](https://developer.onetrust.com/onetrust/docs/cross-domain-cross-device)
   works once you pass a signed user ID — which is the same thing as saying the brand needs its own
   subject record first.

Then the data moves. GA4 exports events to BigQuery, an audience job builds segments, and a JVM
service bus (MuleSoft, webMethods, TIBCO — whichever the estate grew up with) carries ERP, CRM and
EDI records across four clouds, typically on a 15-minute poll. A withdrawal on `fr.brand.com`
reaches the Google Merchant and Ads audience after the next poll and the next refresh, reaches
the Shopify audience through a separate marketing-consent field on its own schedule, and never
reaches the till, the app or the device at all. Every minute in between is a send without
consent, and nothing in the estate can say which ones.

### Plugin wildcards in the visible theme

| Wildcard | Where it shows | What it exposes | Fix |
|---|---|---|---|
| `Domain=.brand.com` on a consent or session cookie | Plugin config in the theme, or the `Set-Cookie` header | Every subdomain can read and overwrite it — the forging path in break 2 | Host-only cookies; the `__Host-` prefix makes the browser enforce it |
| `Access-Control-Allow-Origin: *` | App proxy and plugin endpoints the theme calls | Any site can read the response from a visitor's browser | An explicit origin list; never reflect `null` |
| `postMessage(msg, "*")` | Inline plugin and widget scripts | Consent state and tokens posted to any frame that asks | The exact target origin, and check `event.origin` on receipt |
| `script-src *` or `https:` | The CSP, if there is one | Any script from anywhere runs beside the checkout | Nonces or hashes, as the per-request section says |
| `*.brand.com` in a plugin's allowed origins | CMP and widget config objects | Trust extended to every subdomain, dangling ones included | Name the hosts; remove DNS records that point at nothing |

AI reads this table faster than any person. Theme source, response headers and DNS are all public,
and an agent given a domain will enumerate subdomains and pull every wildcard out of the theme in
seconds.

### The fix: Xano decides, the Cloudflare namespace carries it

There is a reason the fix belongs on Cloudflare. **OneTrust's CDN and geolocation endpoint,
Shopify storefronts and Webflow hosting all already answer through Cloudflare** — every one of
them returns a `cf-ray` header. Each vendor owns its own zone on that network, and the brand cannot
run code in theirs. The brand's own namespace is the one place on that shared network the brand
controls, so the fix sits where the traffic already is rather than adding a hop.

1. **Xano is the system of record.** Every choice is a row: subject, market, purpose, source, time.
   The CMP is one source among several, and its cookie becomes an input, not the answer.
2. **The "Buy" app is a Worker per brand** in a Workers for Platforms dispatch namespace, in front
   of the storefront. It verifies the signature on every event, checks market, purpose and
   freshness, and fails closed.
3. **A KV namespace holds the projection**, keyed `consent:{market}:{subject}` and stamped with the
   ledger version it came from. Pages read it on every request. It is never the truth.
4. **The event socket replaces the bus in the middle.** A Cloudflare Queue fans each event out to
   Azure Service Bus, AWS EventBridge, GCP Pub/Sub and the CRM vendors over their own HTTPS publish
   APIs — but only on the links the posture allows. Each cloud keeps its own bus; nothing sits
   between them polling.
5. **A Rust writer speaks gRPC next to the data.** The BigQuery Storage Write API and the Merchant
   API both take gRPC. A Worker's outbound fetch is not a gRPC client, so a small `tonic` service on
   Cloud Run receives from Pub/Sub and writes rows and offers with the posture version on each one.
6. **Both audiences are socketed.** The Shopify audience reads the same posture through the
   customer's marketing consent, written by the socket, and the Google Merchant and Ads audience
   reads rows that carry the same version. Two audiences, one answer, seconds apart.

### Every device, one record

| Channel | Identity it presents | How the choice arrives | What Rust checks |
|---|---|---|---|
| **Web — uk, ca, fr** | An anonymous ID, then a subject once signed in | The CMP choice, recorded with its site and rules as the source | The market of the site matches the market of the posture |
| **Mobile app** | The app user's JWT | The in-app consent screen writes straight to Xano | The event's schema and the posture version |
| **POS** | A staff session plus the customer's ID | Marketing opt-in at the till, against the store's market | The store's market, not the customer's last web visit |
| **Chatbot or agent** | `crm_jwt` under a mandate | Asked in the conversation, written as a row | The `Task` enum from the previous section |
| **IoT device** | Device attestation | The owner's account link; service telemetry is not marketing | Telemetry purpose: service, never ads |
| **Firmware fetch** | Device attestation plus the SBOM hash | The entitlement, not a banner | The manifest type and the published hash |

None of these channels ever had a cookie to read. All of them can read a row.

### Binding the market into the type

The check that makes break 1 impossible is a few lines, and it runs inside the Worker before
anything leaves for a bus, an audience or a feed:

```rust
#![forbid(unsafe_code)]
use serde::Deserialize;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize)]
pub enum Market { Uk, Ca, Fr }

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize)]
pub enum Purpose { Analytics, Ads, Personalisation }

// Projected from Xano into the KV namespace; `version` is the ledger row it came from.
#[derive(Debug, Deserialize)]
pub struct Posture { pub market: Market, pub granted: Vec<Purpose>, pub version: u64 }

#[derive(Debug, PartialEq)]
pub enum Denied { Stale, WrongMarket, NotGranted }

// Called before any event leaves for a bus, an audience or a feed.
pub fn may_send(p: &Posture, dest: Market, purpose: Purpose, ledger_head: u64) -> Result<(), Denied> {
    if p.version < ledger_head { return Err(Denied::Stale); }   // projection behind the record: fail closed
    if p.market != dest { return Err(Denied::WrongMarket); }    // a fr choice never feeds a uk audience
    if !p.granted.contains(&purpose) { return Err(Denied::NotGranted); }
    Ok(())
}
```

A French choice cannot feed a UK audience, because `Market::Fr != Market::Uk` is decided before the
send, not discovered in an audit. A projection that is behind the ledger is refused rather than
trusted. A market the program does not declare cannot be deserialised at all.

Three honest limits. **KV is eventually consistent** — a write can take up to about a minute to
reach every location — so the `Stale` check compares against the ledger head on anything that
leaves, and a withdrawal is enforced from the moment it is written to Xano, not when KV catches
up. **Anonymous visitors stay per site** until they are known; that is the law working, not a gap,
and the banner still does that job. **Rust makes the check exact, not the policy right** — which
purposes each market allows is a legal decision, and it lives as rows that legal can change, not
in the code.

## The asymmetry, stated once

## The asymmetry, stated once

A flaw in a bundled runtime costs the ecosystem a global rebuild. A flaw in a silo monolith costs its deepest customers an active breach. A flaw in a grant-scoped service costs one revoked entitlement and one redeployment — and the ledger answers, with evidence, the only question that matters in the incident: *who accessed what while it was vulnerable?* That is the question neither the bundle model nor the silo model can answer today, and the one every auditor, regulator, and dark factory will be asking from here on.

*Diagram companion: [BIM Fortress Exposure vs the Event-Socket Heal](https://crm-sync.dev/share/bim-fortress-event-socket) — the fortress wound map and the heal, in two charts. Delivery-side companion: [File System Agnostic Publishing](https://www.crm-sync.dev/pages/knowledge-base#universal) covers the same architecture from the storefront direction. Setup: [CRM Sync Setup Reference](https://www.crm-sync.dev/pages/knowledge-base#setup-guide).*
