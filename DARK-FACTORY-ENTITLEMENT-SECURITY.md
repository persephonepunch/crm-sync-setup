---
title: "Dark Factory Entitlement Security"
description: "Where the vulnerability lives — IoT firmware, game bundles, 3D/BIM assets — with the Unity, Trimble and ImageMagick receipts, Rust in the loop so no C parser ever sees the sender's bytes, why no platform yet handles 3D securely, and the entitlement architecture that survives AI-speed extraction."
canonical: https://persephonepunch.github.io/crm-sync-setup/dark-factory-entitlement-security.html
category: "Security"
date: 2026-07-19
modified: 2026-10-21
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/DARK-FACTORY-ENTITLEMENT-SECURITY.md
licence: CC-BY-4.0
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
  - name: "Shopify Storefront Web Components"
    url: https://shopify.dev/docs/api/storefront-web-components
  - name: "Data Layer — WordPress, Astro, Headless (companion)"
    url: https://www.crm-sync.dev/pages/knowledge-base#wordpress-web-components
  - name: "CRM Sync Setup Reference"
    url: https://www.crm-sync.dev/pages/knowledge-base#setup-guide
---
# Dark Factory Entitlement Security

**Status:** Living reference · **Scope:** Where the vulnerability actually lives in modern business operations — IoT firmware, game platforms, 3D/BIM assets — and the entitlement architecture that survives it. Written from production experience shipping commerce on Roblox/Shopify rails and 3D asset pipelines against PIM/BIM systems.

**Tags:** [#CRA](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act) · [#Art-14 — 11 September 2026](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) · #firmware · [#CRA-checklist](https://www.crm-sync.dev/pages/pim-sync#cra-checklist)

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
| **Any PHP origin** | Every writable directory | Refuse execution of `.php` under any upload or cache prefix; enable the managed ruleset covering ImageMagick and PHP exploitation patterns; normalise the URL in a transform rule before anything downstream interprets it | The gap between what the application thinks a path is and what the filesystem resolves it to |

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

## The asymmetry, stated once

A flaw in a bundled runtime costs the ecosystem a global rebuild. A flaw in a silo monolith costs its deepest customers an active breach. A flaw in a grant-scoped service costs one revoked entitlement and one redeployment — and the ledger answers, with evidence, the only question that matters in the incident: *who accessed what while it was vulnerable?* That is the question neither the bundle model nor the silo model can answer today, and the one every auditor, regulator, and dark factory will be asking from here on.

*Diagram companion: [BIM Fortress Exposure vs the Event-Socket Heal](https://crm-sync.dev/share/bim-fortress-event-socket) — the fortress wound map and the heal, in two charts. Delivery-side companion: [File System Agnostic Publishing](https://www.crm-sync.dev/pages/knowledge-base#universal) covers the same architecture from the storefront direction. Setup: [CRM Sync Setup Reference](https://www.crm-sync.dev/pages/knowledge-base#setup-guide).*
