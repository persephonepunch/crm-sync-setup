---
title: "Asset Management, Security and AI"
description: "A media manager's pipeline: what a re-encode destroys and what it protects, metadata and provenance, raster and mesh compression including Draco and KTX2, programmatic resize from UIkit to the edge, Webflow and Shopify's media models, Cloudinary and OpenText and filesystem handling compared against an R2-backed DAM, and the ImageMagick precautions for WordPress, Drupal, Magento and AEM."
canonical: https://persephonepunch.github.io/crm-sync-setup/what-survives-the-transform.html
category: "Specs"
date: 2026-09-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/WHAT-SURVIVES-THE-TRANSFORM.md
licence: CC-BY-4.0
tags:
  - architecture
  - media
  - performance
  - security
about:
  - Digital asset management
  - Image and mesh compression
  - Responsive and programmatic resize
  - Asset metadata and provenance
  - Media pipeline security
alternativeHeadline: "Every transform authors a new file — which is what makes it safe, and what makes it forget"
citation:
  - name: "UIkit — Image component"
    url: https://getuikit.com/docs/image
  - name: "Google Draco"
    url: https://github.com/google/draco
  - name: "KHR_draco_mesh_compression (glTF)"
    url: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_draco_mesh_compression
  - name: "Cloudflare R2"
    url: https://developers.cloudflare.com/r2/
  - name: "Cloudflare Rules"
    url: https://developers.cloudflare.com/rules/
  - name: "C2PA — Content Credentials"
    url: https://c2pa.org/
---

# Asset Management, Security and AI

![The media pipeline in four bands. An asset passes ingest, an isolated parse holding no credentials and no network, transform, store, and serve. Below it two parallel lines: embedded metadata — XMP, IPTC, EXIF, GPS, C2PA — terminates at a cross on the transform, while the descriptor beside the file runs the full width and reaches the agent. A third band shows 3D passed through untransformed; a fourth defines asset, rendition, descriptor and entitlement.](https://crm-sync.dev/kb/media/docs/media-pipeline-dam.png)

**For media managers, DAM owners, front-end leads and the person who has to answer why the
product page is four megabytes.**

> A transform is not an edit. When a pipeline resizes an image it does not modify the original —
> it authors a new file. That single fact decides both halves of this document: it is why a
> transformed asset is safe, and it is why your metadata is gone.

Most media problems in a commerce estate come from treating those two consequences separately.
The performance team owns compression. The brand team owns metadata. The security team owns
uploads. They are the same pipeline, and each decision one team makes silently settles a question
for the other two.

## The vocabulary, fixed here

Five words that get used interchangeably and should not be.

| Term | Means | Is not |
|---|---|---|
| **Asset** | The original file as delivered by whoever made it, with its metadata intact. | What you serve. You should almost never serve the original. |
| **Rendition** | A derived file produced by a transform — a size, a format, a crop. | A copy. It has different bytes, different metadata and a different risk profile. |
| **Metadata** | Fields carried *inside* the file: EXIF, IPTC, XMP. Capture data, rights, captions. | The DAM's database record. One travels with the file; the other does not. |
| **Descriptor** | A separate, readable record of what the asset *is* — variants, rights, usage, provenance. | A MIME type. MIME says how to decode bytes, not what they depict or who may have them. |
| **MIME type** | The transport-level declaration of format, e.g. `image/avif`, `model/gltf-binary`. | A guarantee. It is declared by whoever uploaded, and most parsers ignore it anyway. |

The distinction that does the most work later is **asset versus rendition**. A DAM that stores
only renditions has thrown away the thing it exists to hold. A CDN that serves originals has
skipped the step that protects it.

## What a transform destroys, and why that is mostly good

Re-encoding an image discards everything that is not pixels unless the pipeline is explicitly
told otherwise. That is not a bug — it is the mechanism.

| Carried in the original | Survives a default re-encode | Why it matters to you |
|---|---|---|
| Pixel data | Yes, lossily | The only thing most pipelines are configured to preserve. |
| EXIF — camera, lens, **GPS coordinates** | No | Stripping is a privacy win you get for free. A product shot from a studio carries that studio's address. |
| IPTC / XMP — creator, credit, rights, caption | No | A licensing exposure. The rights statement you paid for is deleted by the resize. |
| ICC colour profile | Usually, if configured | Drop it and brand colour shifts. This is the one people notice. |
| **Embedded hostile payload** | No | The reason a re-encode is a security control: the output is bytes your pipeline authored. |
| C2PA content credentials | No | Provenance signatures do not survive an unaware transform, which increasingly matters for AI-generated and AI-edited assets. |

**So the rule is not "preserve metadata" or "strip metadata."** It is: strip everything on the
rendition, keep everything on the asset, and carry rights and provenance in a descriptor that
does not depend on surviving a codec. A field that only exists inside the file will eventually
be deleted by a resize nobody told you about.

## Compression: two different problems wearing one word

### Raster

Format choice beats quality tuning, and both beat arguing about it. AVIF is the smallest at
equivalent quality and the slowest to encode; WebP is the safe default with effectively universal
support; JPEG remains the fallback. The practical answer is to let the delivery layer negotiate
per request rather than picking one and storing it — which is the case for edge transformation
made in the next section.

Two failure modes are worth naming because they look like nothing from the outside. Serving a
2400px image into a 400px slot costs the user the full download and shows no visible defect,
so nobody reports it. And re-compressing an already-lossy file compounds artefacts each pass —
a rendition generated from a rendition, which is what happens when a DAM stores derivatives and
transforms those.

### Mesh

3D is where media managers are newest and the defaults are worst. A glTF file is a container:
geometry, plus textures, plus material definitions.

| Lever | What it compresses | Typical effect | What it costs |
|---|---|---|---|
| **Draco** (`KHR_draco_mesh_compression`) | Geometry only — positions, normals, UVs | Large reduction on vertex-heavy meshes | Lossy by quantization; requires a decoder on the client; decode time on load |
| **meshoptimizer** (`EXT_meshopt_compression`) | Geometry, optimised for runtime | Smaller wins than Draco on size | Much faster decode — usually the better trade for interactive viewers |
| **KTX2 / Basis Universal** | Textures, as GPU-ready supercompressed data | Often the largest single win available | Transcode step; different quality characteristics from JPEG/PNG |
| Polygon reduction | Geometry, before any encoding | Unbounded | Irreversible; a craft decision, not a pipeline setting |

**The counterintuitive part, and the one that saves the most bytes: textures usually dominate.**
A team that enables Draco and stops has compressed the smaller half of the file. If you do one
thing to a 3D catalogue, convert the textures to KTX2. If you do two, add meshopt before Draco
unless your viewer is load-time-bound rather than interaction-bound.

Mesh compression is also where **mesh size** stops being a delivery question and becomes a rights
question. A model compressed for web viewing is a poor basis for manufacture, which is
deliberate: the viewable rendition and the manufacturable asset should not be the same file. That
is a permissions decision expressed as a compression setting, and it is the cleanest example in
this document of the two teams settling each other's questions.

## Programmatic resize: four rungs, in order of what they ask of the browser

| Approach | Mechanism | Works without JavaScript | Use when |
|---|---|---|---|
| Native `<img>` with `srcset`/`sizes`/`loading="lazy"` | The browser picks and defers | **Yes** | Always, for content images. This is the baseline everything else should degrade to. |
| [UIkit `uk-img`](https://getuikit.com/docs/image) | JS component bringing `srcset`, `sizes` and lazy loading to **background** images via `data-src` | **No** | A background image genuinely is decoration — CSS backgrounds have no native lazy or responsive mechanism, and this supplies one. `uk-img="loading: eager"` opts a hero out. |
| Platform-generated variants (Webflow, Shopify) | The platform writes `srcset` for you at upload | Yes | You accept the platform's breakpoints and formats in exchange for never thinking about it. |
| Edge transformation | Resize, crop and format negotiation at the CDN, from one stored original | Yes | You want one asset, many renditions, and a parse your origin never performs. |

The `uk-img` row carries the progressive-enhancement caveat that decides where it belongs.
Because it is a JavaScript component writing a CSS background, **the image does not appear at all
if the script does not run** — and a CSS background is invisible to assistive technology and to
crawlers regardless. That is acceptable for a decorative band and wrong for a product shot. The
rule that follows is simple: content is an `<img>` with an `alt`; decoration may be a background.
If you cannot say which one an asset is, it is content.

## Webflow and Shopify: opinionated in different directions

Webflow gives a media manager three controls and generates the rest. Responsive variants and
`srcset` are produced at upload. Loading mode is set per image — lazy by default, eager for
anything above the fold, which is the one setting that is routinely wrong on hero images.
Interaction state is a separate layer, and the trap there is loading-state work that assumes an
image has already arrived.

**Both platforms are heavy-handed with media, and that is what makes them safe to use.**
Webflow decides your breakpoints and formats at upload and hands back markup you did not write.
Shopify bans formats outright — most visibly SVG — and routes everything through its own CDN and
URL grammar. Read as restrictions, those look like limitations. Read as policy, they are the
bargain the Shopify Functions section already described, applied to media instead of code:
**you cannot misconfigure what you are not permitted to configure.**

Look back at the failures in the previous sections. Every one is a decision somebody made
wrongly — a Content-Type echoed back from an upload, a parser left on its shipped defaults, a
file served inline from an origin that also serves checkout. Webflow and Shopify remove most of
those decisions from the person least equipped to make them. A merchant with no security team
gets competent `srcset`, a re-encoded raster whose bytes the platform authored, and no SVG
executing on their own origin — without knowing any of those words. That is a genuinely good
outcome and it deserves to be said plainly rather than treated as an obstacle to route around.

**So the honest summary is: heavy-handed, secure, and usable without risk by people who should
not have to think about any of this.** For most teams that is the correct trade, and a platform
generating competent markup automatically beats a bespoke pipeline nobody maintains.

The cost is narrow and specific. The decision is made at upload, and it is not revisable per
surface later — you take their breakpoints, their formats and their grammar wherever that asset
subsequently appears. That only becomes a problem at a scale and a variety most estates never
reach. This document is written for the estate that has reached it, not for the one still served
well by the defaults.

Where you have outgrown it, the recovery is not migration — it is
[Cloudflare Rules](https://developers.cloudflare.com/rules/) in front. Response header transforms
set caching and content-type discipline on media paths you do not own; origin rules move a path
prefix to storage you do control without touching the storefront. It is the only place policy
can exist when the origin belongs to someone else.

## Where the media actually lives: four models

| Model | Transform | Storage economics | Metadata handling | Where it breaks |
|---|---|---|---|---|
| **Cloudinary** (transform-first SaaS) | Its product. Deep, URL-addressable, excellent | Priced on transformations and delivery — costs scale with traffic | Strong for raster; configurable stripping | 3D and CAD are pass-through bytes, and the pricing model punishes exactly the high-traffic success you wanted |
| **OpenText** (enterprise DAM/CMS) | Present, governance-led rather than delivery-led | Enterprise licensing | Strongest of the four — rights, workflow, retention | Delivery performance and developer ergonomics; media reaches the web through something else anyway |
| **Filesystem / Next.js `public/`** | `next/image` at request time, or none | Cheap until it is not | None. The filesystem has no opinion | No governance, no rights record, no audit. Optimisation on the app server puts a parser in the request path, and the host's image optimisation is metered |
| **R2-backed DAM** (object store + Worker) | At the edge, or on an isolated worker | Storage and operations priced; **egress is not** | Whatever you build — which is the honest cost | You are assembling it. Nothing here is free the way a SaaS feature is free |

**The egress line is the one that changes decisions at scale.** Media is the largest thing most
estates ship, and in the conventional model the bill grows with exactly the traffic the business
is trying to win. Object storage without egress fees removes the term from the equation, which
means a campaign that goes unexpectedly well does not produce an unexpected invoice. That is a
structural difference, not a discount, and it is the single strongest argument for an R2-backed
DAM over a delivery-priced one.

State the counterweight, because it is real: Cloudinary's transformation pipeline is better than
what you will build in a quarter, and OpenText's rights and retention model is better than what
you will build in a year. The R2 position wins on economics and on control of the serve path. It
loses on everything that arrives finished in a product you can buy. Choose accordingly, and
notice that the two can be combined — governed originals in one system, delivery from another.

## ImageMagick, and what a media manager should require

**ImageMagick is the software that almost certainly resizes your images.** It is a
thirty-year-old open-source toolkit — a command-line program and a set of language bindings —
that reads, converts and transforms well over a hundred image formats. Almost nobody chooses it.
It arrives underneath a CMS, a plugin or a base container image, and it does the work every time
someone uploads a photograph and the system produces a thumbnail.

It matters to a media manager for one reason: **validating a file means parsing it, and the
parser is the attack surface.** ImageMagick's own design compounds this. It determines format
from file *content* rather than extension, so checking that a file ends in `.jpg` proves nothing.
It hands PDF, EPS and PostScript to Ghostscript, chaining a second interpreter behind an innocent
"generate a preview" feature. And its delegate system historically passed filenames into shell
commands, which is how a hostile upload became remote code execution in the vulnerability known
as ImageTragick.

| Platform | How it gets there | The one thing to require |
|---|---|---|
| **WordPress** | Uses the Imagick extension whenever it is installed | Force the GD editor if the site only resizes photographs; stop generating PDF thumbnails |
| **Drupal** | Core defaults to GD; ImageMagick arrives via contrib toolkit | Confirm which toolkit is actually selected before assuming |
| **Magento** | Selectable image adapter, inside **PCI scope**, serving `pub/media` from the checkout origin | Move media ingest and delivery off the commerce origin — scope reduction beats hardening |
| **AEM** | The DAM Update Asset workflow can shell out for EPS, PS and some PSD paths | Audit which renditions require it; Adobe's own Cloud Service direction moved processing off the author runtime |

The full hardening detail — `policy.xml`, the Ghostscript decision, the edge and origin controls —
is in [Dark Factory Entitlement Security](https://www.crm-sync.dev/pages/knowledge-base#dark-factory-entitlement-security),
which also explains **why we don't use Flash**: the format was not killed by a better codec, it
was killed by the realisation that content should not carry capability. Every argument in this
section is that one applied to a file your brand team uploaded.

What a media manager should take from it is narrow and non-technical. Ask where the parse happens.
Ask what that process can reach when it succeeds. Ask whether uploaded bytes are ever served from
the same origin as checkout. You do not need to read `policy.xml` to insist that the answer to
the third question is no.

## MIME is not a descriptor, and AI is what makes that expensive

A MIME type answers one question: how should these bytes be decoded. It does not say what the
asset depicts, which variants exist, who may use it, where it came from, or whether a model was
approved for manufacture. Humans fill that gap by looking. Agents cannot.

This is now the binding constraint rather than an abstraction. An AI agent assembling a product
page, answering a question or placing an order needs to resolve an asset to its meaning and its
rights, and `model/gltf-binary` tells it neither. The estate's answer is a readable descriptor
alongside the asset — Markdown with YAML front matter, the same shape the knowledge base already
uses — carrying what the asset is, its variants and their intended surfaces, its rights and
provenance, and the entitlement required to obtain the unwatermarked or manufacturable form.

### This is not a new idea — photography got here first

**XMP is not an Adobe format.** Adobe created it in 2001, published the specification, and it
was standardised as **ISO 16684-1**; the reference toolkit ships under a BSD licence. IPTC Photo
Metadata — the news and stock industry's standard — is *expressed in* XMP. PDF/A **requires** it
for document metadata. darktable, RawTherapee, digiKam and Capture One all write it, and C2PA
uses it to reference a provenance manifest.

Open Adobe Bridge's File Info dialog and the tabs are a catalogue of what a single image can
carry: Description, IPTC Core, IPTC Extension, Camera Data, GPS, Video Data, Audio Data,
Categories, Origin, DICOM, History, Advanced — and **Raw Data, which displays the XMP packet
itself**. Rights statements, contributor contacts, capture coordinates, an editing history, and
in the DICOM case patient and study identifiers. All of it real, all of it structured, and
**all of it discarded by a default re-encode**, as the table at the top of this document says.

Which is why photographers solved this twenty years ago, and solved it the same way. Camera RAW
formats — CR3, NEF, ARW, RAF — are proprietary and largely undocumented, so writing metadata
into them risks corrupting a file whose structure the vendor can change in the next firmware.
The industry's answer was the **XMP sidecar**: `IMG_1234.xmp` beside `IMG_1234.NEF`. The RAW
stays byte-identical forever; the ratings, edits, rights and captions live next to it. Adobe's
own DNG is the exception that proves it — an *open* raw format, and therefore one XMP can safely
be embedded in.

The descriptor argued for here is that pattern, reached from a different constraint. Photography
put metadata beside the asset because the container was not safely writable. We put it beside
the asset because the container will be re-encoded and because an agent needs to read rights
without opening a binary. Same shape, same reason it holds.

**And the same weakness, which is worth naming before someone else does: sidecars get
separated.** Copy the RAW without the `.xmp` and the rights statement is gone, silently, with
the asset looking perfectly intact. That is the failure mode this model inherits, and it is the
argument for keeping descriptors in version control — where the pairing is enforced by a commit
rather than by whoever dragged the folder — and for a system of record that holds the same
fields independently.

### One company wrote most of this stack, and that is why the parsers are dangerous

Follow the formats back and they converge on one vendor. **PDF** is Adobe's, from 1993, now
**ISO 32000**. **PostScript** and **EPS** are Adobe's. **XMP** is Adobe's, now **ISO 16684-1**.
**PSD** and **AI** remain proprietary. **DNG** is Adobe's open raw format. The pattern is
consistent: publish the specification, let it become universal, keep the tooling.

That is worth noticing twice over.

**First, it is the strongest position in this document.** Adobe did not win by having the best
codec. It won by making its formats the ones everything else must read, then selling the tools.
A standard is a better moat than an invention, because nobody needs permission to adopt it and
everybody needs your software to author it well.

**Second, and less comfortably: the formats with the worst parser histories are the same ones.**
The delegate chain that turns a thumbnail request into a second interpreter — PDF, EPS and
PostScript handed to Ghostscript — is Adobe *formats* end to end.

But **Ghostscript is not Adobe's**, and the distinction is the whole point. It was written by
L. Peter Deutsch in 1986, developed by Aladdin Enterprises, and is maintained today by Artifex
Software under a dual AGPL and commercial licence. It is an independent implementation of
Adobe's languages, and it is the one that actually runs — on Linux servers, in container
images, behind ImageMagick's PDF delegate, in most places a thumbnail gets generated.

So the burden splits. **Adobe owns the specifications; a third party Adobe does not fund
carries the security consequences of everyone adopting them.** That is what winning a standard
actually looks like from the outside: the format becomes universal, implementations get written
by people with no relationship to its author, and the risk lands on whoever wrote the parser
that shipped in the base image.

It is worse here than the general case, because PostScript is not a document format. It is a
Turing-complete programming language, which is why Ghostscript needs a `-dSAFER` sandbox at all
— and why that sandbox has had to be repaired more than once. A "generate a PDF preview"
feature is an offer to execute a submitted program.

None of which is hypocrisy on anyone's part. It is arithmetic. **Ubiquity is what makes a parser
worth attacking**, and a format every system must read is a format every attacker studies. The
price of winning the standard is that your format becomes the one worth breaking, whoever ends
up maintaining the code that reads it.

### Where the pattern breaks, and what it explains

Three-dimensional content is the exception, and the exception is instructive.

Mesh compression is **not** Adobe. **Draco** is Google's. **meshopt** is independent.
**KTX2/Basis Universal** came from Binomial, acquired by Google. **glTF** is Khronos. Adobe
arrived in 3D by acquisition — Substance for materials, Mixamo for characters — into a field
whose formats were already set by other people.

That timing explains something this document asserts earlier. 3D formats arrived *after* the era
in which one vendor made a format universal and then had to build the tooling to match, and the
standards came instead from a consortium and a search company with no document-pipeline business
to extend. **Nobody ever had Adobe's incentive to build a safe, ubiquitous transform pipeline for
meshes** — and so, as the section above says, models remain pass-through bytes while a JPEG is
re-encoded by default.

The absence of a transform pipeline for 3D is not an oversight. It is the predictable result of
nobody owning the format the way Adobe owned the page.

### The system of record is the other half

A descriptor beside the file answers *what is this*. It does not answer *which variants exist
right now, and which may this surface serve*. That is a query, and queries need a database.

Xano's [Metadata API](https://docs.xano.com/xano-features/metadata-api) is the shape of that
half: programmatic access to schema, content and a distinct **Files** scope for file storage,
under the same RBAC that governs everything else — and the documentation is careful to note that
effective permission is the narrower of the token's scope and the role's, which is the correct
default for anything touching assets.

Pairing them is what makes optimisation dynamic rather than baked. The descriptor travels with
the asset and states its rights and provenance. The system of record holds the variant set, the
surface bindings and the entitlement, and it can be queried at request time — so a page asks for
the variant appropriate to *this* surface and *this* viewer instead of receiving whatever format
was decided at upload. That is precisely the limitation the Webflow and Shopify section names:
their decision is made at upload and is not revisable per surface. A descriptor plus a queryable
record is how you get it back, without leaving either platform.

Three properties make that work where an embedded field does not. It **survives the transform**,
because it was never inside the file. It is **diffable**, so a rights change is a reviewable
commit rather than a silent metadata write. And it is **readable by both**, which means the
agent and the media manager are looking at the same record — not a database view and a file
header that disagree.

MIME still does its job at the transport layer, and the serve path should still hold a strict
allow-list of what may render inline. That is a safety control. The descriptor is a meaning
control. Conflating them is why so many DAMs can tell you a file is a PNG and not tell you
whether you are allowed to publish it.

## The parser your AI pipeline did not know it had

Everything above concerns assets you publish. This section concerns assets you *ingest*, and it
is where the two halves of this document meet — because a retrieval system is a media pipeline
that happens to produce answers instead of pictures.

PDFs are the dominant enterprise document format, so any system indexing internal documents is
parsing them. The common routes — document loaders, OCR pipelines that rasterise a PDF before
reading it, a thumbnail step using ImageMagick's PDF delegate — end at a PostScript interpreter
for at least some inputs. Most teams do not know it is in the path. It arrived with a base
image.

### The privilege is inverted

This is the part that matters, and it is almost universal.

Enormous care goes into sandboxing the **model**: restricted tools, filtered outputs, guardrails,
evaluation. Meanwhile the **ingestion worker** — the component that actually receives
attacker-supplied documents — runs as an ordinary process holding the embedding API key, the
vector store credentials, database access and a route into the private network.

**The component receiving hostile input has more privilege than the component everyone is
protecting.**

### What that exposes

| Exposure | Why it matters here |
|---|---|
| **Credentials and corpus** | Compromise the ingestion worker and you hold the embedding key, the vector store, and every document already indexed. A retrieval corpus is a deliberately concentrated collection of an organisation's internal documents — a better target than model weights |
| **SSRF from inside the perimeter** | These parsers fetch URLs. An ingestion worker sits within reach of internal APIs and the cloud instance-metadata endpoint, which vends credentials. A document that triggers an outbound request from in there is a pivot |
| **File disclosure into the index** | Constructs like `label:@/path` read a local file into the *rendered output*. If that output is then OCR'd and embedded, **a server-side file becomes an ordinary chunk in the vector store** — retrievable later by asking the assistant a plausible question |
| **Ingestion denial of service** | Decompression and rendering bombs stall the pipeline. Needs no vulnerability; a timeout is the only thing that stops it |

The third row deserves reading twice. **The exfiltration channel is the assistant's own answer.**
No outbound connection is required at any point, so egress monitoring sees nothing and a network
policy prevents nothing. The data leaves by being retrieved.

### This is not prompt injection, and the difference is the point

Two attacks arrive in the same uploaded document. Only one of them gets discussed.

**Prompt injection** is content manipulating the *model*. It makes the assistant misbehave, it is
what the industry threat-models, and there is a growing literature on it.

**Parser compromise** is content executing on the *host*, and it runs before the model is ever
invoked. It does not make the assistant misbehave — it makes your infrastructure misbehave. It is
strictly the worse of the two, and it receives a fraction of the attention, because the parser
is not the part anybody thinks of as AI.

### The same bargain, one layer earlier

The fix is the one this document keeps arriving at: **parse where a compromise costs nothing.**

- Run ingestion in an isolated sandbox with **no credentials and no network**. No embedding key,
  no database, no route inward. Hand it bytes; take back text.
- Prefer pure-library extraction over shelling out to a rasteriser — fewer processes, and no
  delegate system to configure wrongly.
- Harden `policy.xml`, and remove Ghostscript where nothing genuinely needs PostScript rendering.
- Treat the ingestion worker as untrusted infrastructure, because that is exactly what it is.

And it connects back to the descriptor argument. An agent that can read an asset's rights from a
descriptor beside it does not need to open the binary to find out what it may do. **Every parse
avoided is an attack surface that was never presented** — which is the whole of this document,
stated once more at the point where assets stop being published and start being consumed.

## Best practice: the container is the control

The isolation this document keeps prescribing needs a shape, because "sandbox it" is advice
nobody can act on. What follows is the envelope, then what changes per artifact class, then
where the platform layers sit.

### The envelope

One parse, one container, and the container holds nothing worth taking.

| Property | Setting | Why |
|---|---|---|
| **Credentials** | none injected — no API key, no database URL, no cloud role | The parse cannot leak what it was never given |
| **Egress** | denied by default | Kills SSRF, external entity fetches and exfiltration in one rule |
| **Filesystem** | read-only, with one `tmpfs` scratch | Nothing written survives, and nothing on disk is worth reading |
| **Identity** | non-root, all capabilities dropped | A container escape has nowhere to escalate to |
| **Limits** | hard CPU, memory and wall-clock caps | Decompression and rendering bombs need no vulnerability |
| **Lifetime** | one-shot, never reused across tenants | No residue between jobs |
| **Interface** | bytes in, **typed** result out, size-capped | The Functions bargain, in a container |

A worker isolate reaches the same contract by a different route — no filesystem, no ambient
network, bindings granted explicitly — which is why the same discipline can run at the edge for
small inputs and in a container for large ones.

### Per artifact class

| Class | What opens it | Where it goes wrong | Practice |
|---|---|---|---|
| **PDF** | Ghostscript for raster; poppler or a library for text | PostScript is a language, so rendering is executing. The delegate chain is reached by content sniffing, not extension | Extract text with a **library** and never shell out. Rasterise only inside the envelope. Disable the `PDF`, `EPS`, `PS` and `XPS` delegates. Uninstall Ghostscript where nothing needs PostScript |
| **SVG** | An XML parser, then a renderer | It **is** XML — external entities. Inlining promotes it from the image sandbox to a DOM node | Never inline untrusted SVG. Rebuild from an allow-list, or serve as `<img>` so the browser sandboxes it. Keep it off the inline-render list on the serve path |
| **3D — glTF / GLB** | JSON plus binary buffers, then a decoder | External URIs in `buffers` and `images` pull remote content at load. Draco and KTX2 decoders are native code on untrusted input | Reject any external URI reference at ingest — self-contained or refused. Decode inside the envelope |
| **3D — STEP / IFC / USD** | CAD kernels, and `ifcXML` for the XML flavour | No transform pipeline exists, so these are pass-through bytes. `ifcXML` is XML, with the same entity problem. Models are large enough that memory limits matter | Store and serve without parsing. If you must parse, the envelope is not optional. Entitlement carries what the bytes cannot |
| **Firmware** | Nothing should open it | The risk is **distribution**, not parsing. An image that is never parsed can still be installed by the wrong device | Content-address it, sign it, and gate the download on entitlement. Verify the signature on the device, not on the server that served it |

### Where XML throughput meets the Ghostscript problem

They are the same bug wearing different clothes, and it is worth naming because the control is
one line rather than an architecture.

Ghostscript's danger is that a PostScript document **instructs the interpreter**. XML's
equivalent is the external entity: a document that instructs the parser to fetch a local file or
a URL and inline the result. Both turn "read this file" into "do what this file says."

That matters here because **XML is underneath more of this estate than it looks**. SVG is XML.
XMP — the metadata this document spends a section on — is RDF/XML, and it rides inside PDFs,
JPEGs and TIFFs. `ifcXML` is XML. So an XMP read on an uploaded image is an XML parse, and an
XML parse with default settings resolves entities.

**Disable DTD processing and external entity resolution in every XML parser you configure.** One
setting, and it covers SVG, XMP and ifcXML together. It is the `-dSAFER` of the XML world, with
the same caveat: it is a policy inside the parser, not a boundary around it, so the envelope
still does the real work.

### Where the platform layers sit

**The system of record** holds entitlement and the descriptor — who may have which rendition, and
what the artifact is. It is never in the parse path. A record that parsed the file it describes
would be a parser with a database attached, which is the arrangement the whole section exists to
prevent.

**Edge rules** carry the serve-path discipline that needs no code: response headers forcing
`nosniff` and `Content-Disposition` on media paths, origin routing that moves an upload prefix
off the application origin, rate limiting on the ingest endpoint so a parse cannot be minted on
demand, and managed rules as a detection layer — not a boundary, since format is decided by
content.

Neither replaces the envelope. **Rules constrain what a served response may do; the container
constrains what opening the file may do.** Different questions, and only the second one is about
the parser.

## Moving the compile to AI is not a permissions change

There is a move being made across a lot of estates right now: take the step that used to parse,
extract, transform or classify an asset, and hand it to a model instead. It is usually framed as
modernisation, and often it is. It is not a security control, and it is being treated as one.

**Four things stay exactly where they were.**

**The parser did not go away.** Something still decoded those bytes before the model saw
anything — a PDF was rasterised, an image was demuxed, a document was extracted. Handing the
*result* to a model changes who consumes the output. It does not remove the process that opened
the file, and that process is the one this document has been about.

**The model's runtime holds the privilege.** Inference needs an API key, usually network access,
often the document store and the vector index. The model has no permissions of its own; it
inherits whatever the process around it was given. An LLM reading a contract is a process with
credentials reading a contract.

**The output is now untrusted too.** Model output is generated from attacker-reachable input,
so anything downstream that acts on it — a query, a file write, a tool call, a rendered page —
is consuming content an outsider influenced. The transformation added a second untrusted surface
rather than removing the first.

**And nothing was permitted or refused.** No subject was identified, no permission was checked,
no refusal was possible. A processing step changed. That is all that happened.

### What is actually required

The permissions boundary stays where it was, and it stays the same shape: **one place, on the
server, that every path calls, which can refuse.** The model sits *inside* that boundary as
another thing a subject may be permitted to invoke — never as a substitute for it, and never as
the thing deciding.

The discipline to copy is the one this document already named twice: **typed in, typed out, no
ambient authority.** The [Shopify Functions](https://shopify.dev/docs/apps/build/functions)
bargain works because the runtime denies by default and the host grants specific, declared
inputs. Apply the same contract to an inference step and it becomes safe in the same way — it
receives exactly what it was handed, returns a typed result, and reaches nothing else. Apply it
to a model with a database connection and an outbound route and you have not applied it at all.

The half that a boundary cannot supply by itself is the record of who may do what, versioned and
revocable. That is a system-of-record question, and in this estate it is
[Xano](https://docs.xano.com/xano-features/metadata-api) holding the entitlement and the
permissions beside the asset metadata — one row per subject, checked by the same server-side
call regardless of which surface or which model made the request.

**Stated plainly, because it is now the requirement rather than a preference:** an AI step is
permitted work, not permitting work. It belongs behind a permissions boundary with a
system-of-record answering for it, and moving a compile step to a model without that is a change
of implementation dressed as a change of posture.

### The stack, and which layer may refuse

CORS judged alone looks like a broken access control. Rules judged alone look like a partial
security product. A system of record judged alone looks like it never touches the serve path.
Each reads as a gap, and the reading is the mistake: **these are not three partial solutions.
They are four different questions, and each layer answers exactly one of them.**

| Layer | Where it runs | May it refuse? | The question it answers |
|---|---|---|---|
| **System of record** (Xano) | server | yes | Who is entitled to this asset, and which variants exist |
| **Worker** (Cloudflare) | edge, server-side | **yes — this is the boundary** | Do we serve it, or refuse |
| **Rules and response headers** | edge | constrains, does not decide | How may it be handled once served — `nosniff`, disposition, caching, rate limiting |
| **Content platform** (Webflow) | a **separate origin** | no | Where content is authored, and from which origin its assets are served |
| **CORS** | the browser, on your instruction | narrows reads | Who may read this response cross-origin |
| **Presentation** (UIkit) | the browser | **no** | How it looks |

A request passes all four in order. Edge rules apply first — rate limit, managed ruleset, origin
routing. The worker resolves the subject and asks the system of record whether that subject is
entitled. **The worker refuses or serves; this is the only place a decision is made.** If it
serves, it reads from object storage by tenant-prefixed key, normalises the filename, and sets
the content type from a render allow-list with `nosniff`. Then the cross-origin headers decide
who may read the result in a browser, with credentials on a strictly narrower allow-list than
reflection.

Five refusals, five different reasons, nothing redundant. **Defence in depth means layers
answering different questions** — layers answering the same question are duplicated code with
two places to get it wrong.

Which is why the usual complaint dissolves. CORS "fails" as an access control because it was
never asked to be one, and in this arrangement it is not asked to be: entitlement is answered
before the response exists, so the cross-origin rules are free to do the narrow job they are
actually good at. **Paired, they resolve the access question completely.**

### Two layers that contribute something other than a decision

**Webflow contributes origin isolation, which is real, and no authorisation, which is also
real.** Its assets come off its own CDN, so a script that manages to run there is not running on
the origin that serves checkout — the entire reason an SVG is tolerable from a content platform
and refused from your own upload path. Its re-encoding of rasters hardens images incidentally,
as the section above describes. What it cannot do is decide anything: **a content row may
describe an asset; it must never determine who may have it.** A CMS field is an input to the
system, authored by whoever holds a seat, and inputs are not decisions.

**The presentation layer contributes no security at all, and can spend what the others
provided.** It runs in the browser, which the attacker owns — devtools, edited DOM, requests
replayed with no script involved. Nothing there can refuse anything.

The `uk-svg` case is the clean illustration and worth stating because it looks like a hardening
feature. The server sends an SVG; the browser sandboxes it as an image, where script cannot run;
a presentation component then fetches it and injects it inline **with all its attributes**,
which promotes it to a node in your document where script does run. Stylability was bought with
the sandbox. That trade is correct for a logo in your own repository and catastrophic for
anything an uploader supplied — and the front end is the wrong place to make it, which is why
the render allow-list lives on the serve path instead.

**The rule that falls out: decide it where it can be enforced, not where it can be overridden.**
A client can only spend the safety a server provided. It can never create any.

Two things sit outside the stack entirely, and both have their own answers earlier in this
document: the **parser**, which is contained by isolation rather than by permission, and
**provenance**, which travels in a descriptor beside the asset. Those are not gaps in this arrangement. They are
different problems, and conflating them is how estates end up with four mechanisms that all
answer "who" and none that answer "what is this" or "what may it execute".

### What CORS is, precisely

Worth stating exactly, because the assumption is near-universal: **CORS is a browser-enforced
restriction on reading responses, not an access control.** It stops one site's JavaScript from reading
another site's response using the visitor's ambient credentials. It does not stop the request —
a non-browser client ignores it completely — and it does not protect data an endpoint would
return anyway.

What protects an asset is the code that decides whether to serve it: no public bucket origin, so
every read passes something that can refuse; tenancy in the object key rather than a parameter;
filenames normalised so a crafted name cannot traverse; and an allow-list deciding what may
render inline at all. The cross-origin rules narrow what a browser may then *do* with the
response, which is a real and useful second layer and is not the boundary.

The practical consequence for the table above: the serve path is cheap to harden, because header
discipline, origin routing and rate limiting are configuration. The expensive half is everything
CORS was never going to answer — who is entitled to this asset, which variants exist, and who
may change that.

## AI Scoped Remediation

Ordered by how much introducing AI changes the exposure, not by generic severity — because that
is the question an estate is actually asking. Everything here is drawn from the sections above;
this is where it becomes a list someone can work through.

| Exposure | What AI changes about it | Remediation | Residual cost |
|---|---|---|---|
| **Ingestion parser privilege** | Transforms it. The worker receiving hostile documents holds the embedding key, the vector store and a route inward — more privilege than the model everyone is guarding | Parse in an isolated sandbox with **no credentials and no network**. Hand it bytes, take back text. Prefer library extraction over shelling to a rasteriser | An extra hop, and an ingestion path that is slower and harder to debug |
| **File disclosure into the index** | Creates it. A construct that reads a server file into rendered output becomes a retrievable chunk — the exfiltration channel is the assistant's own answer, so no egress control sees it | The isolation above removes the primitive. Additionally, never index the output of a rendering step that ran with filesystem access | Some OCR-dependent pipelines need rework |
| **An AI step mistaken for a permission** | Creates it. Moving a compile step to a model changes implementation, not posture — nothing was identified, checked or refused | Keep the permissions boundary server-side and unchanged; the model sits **inside** it as permitted work. Entitlement stays in the system of record | Discipline, permanently. The shortcut is always available |
| **Model output treated as trusted** | Creates it. Output is generated from attacker-reachable input, so anything acting on it consumes influenced content | Treat model output as untrusted input to the next stage — typed, validated, and never executed or interpolated unescaped | Extra validation at every seam |
| **Rights invisible to an agent** | Sharpens it. A human opens the file and looks; an agent cannot, and `model/gltf-binary` carries neither meaning nor rights | Descriptor beside the asset — rights, variants, provenance — in version control so the pairing survives a copy | Discipline. Nothing enforces a descriptor's existence but review |
| **Provenance lost in transform** | Sharpens it. C2PA credentials do not survive an unaware re-encode, and AI-generated content makes that lineage matter more each year | Carry provenance in the descriptor rather than only inside the file. Preserve C2PA where the pipeline is provenance-aware | Provenance is only as good as the weakest transform in the chain |
| **Variant chosen at upload** | Unchanged by AI, but it is what blocks per-surface serving | Query the system of record at request time instead of baking a decision at ingest | The one genuinely unbuilt item — see the build-cost note below |
| **Edge transformation dependency** | Unchanged | Accept it deliberately: a parser removed from your origin by depending on a vendor's | A trade, not a win. Say so out loud |
| **Lossy mesh compression** | Unchanged | Keep originals. The rendition is not the asset — and a model compressed for viewing is deliberately a poor basis for manufacture | Low if originals are kept, total if they are not |

**The ordering is the argument.** The first four rows did not exist as concerns before an
estate put AI on its documents. The last three are ordinary media-pipeline trades that AI leaves
exactly as it found them. Anyone remediating top-down is fixing the things their AI programme
actually introduced, in the order it introduced them.

## Why the build cost is not what it looks like

The objection to an assembled DAM is that you inherit ingest, entitlement, a rights surface and
variant management. Stated flat, that is a large bill and a fair reason to buy instead.

It is also the wrong unit of account, because **almost none of it is asset-specific.**

An entitlement record does not know it is describing an image. A permissions boundary that
refuses a request does not care whether the resource is a row, a route or a rendition. If an
estate already operates those — and any estate doing commerce, consent or agent access already
does — then adding assets is **binding a new resource type to a boundary that exists**, not
standing one up. In this estate the same `hasCap`-style check guards media, documents, vault
assets and API routes alike; the media path was not given its own authorisation model, which is
precisely why it did not get its own authorisation bugs.

That reverses the usual build-versus-buy reasoning. A dedicated DAM gives you asset features
quickly and brings **its own** permissions model, which then has to be reconciled with the one
you already run — and reconciliation between two authorisation systems is where the real defects
live, not in either system alone.

So the honest bill is short. Serve-path hardening is configuration. Entitlement, ingest and
rights are reuse if you have them and genuinely expensive if you do not. **Variant management is
the one item nobody gets for free** — though edge image transformation supplies the raster half,
leaving the question of which variant a surface may serve, which is a query against the record
you already keep.

## What to do next

1. **Separate assets from renditions in storage.** If one bucket holds both, nothing below this line is enforceable. *Owner: DAM lead.*
2. **Move media ingest and delivery off the commerce origin.** Highest security value per hour spent, and the only item here with a PCI argument behind it. *Owner: Platform.*
3. **Audit loading modes on above-the-fold images.** Lazy heroes are the most common measurable defect in a Webflow or Shopify estate. *Owner: Front-end.*
4. **Convert 3D textures to KTX2 before touching Draco.** Larger win, less client cost. *Owner: 3D/Media.*
5. **Write descriptors for the top fifty assets by traffic.** Enough to prove the shape before committing to a format. *Owner: DAM lead with Content.*
6. **Ask the three ImageMagick questions.** Where does the parse happen, what can it reach, does it share an origin with checkout. *Owner: Security with Platform.*

---

*Companion: [Dark Factory Entitlement Security](https://www.crm-sync.dev/pages/knowledge-base#dark-factory-entitlement-security)
— why content should not carry capability, and the full parser-hardening detail. This document is
the media manager's half of the same argument.*
