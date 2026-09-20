---
title: "Asset Management, Security and AI"
description: "A media manager's pipeline: what a re-encode destroys and what it protects, metadata and provenance, raster and mesh compression including Draco and KTX2, programmatic resize from UIkit to the edge, Webflow and Shopify's media models, Cloudinary and OpenText and filesystem handling compared against an R2-backed DAM, and the ImageMagick precautions for WordPress, Drupal, Magento and AEM."
canonical: https://persephonepunch.github.io/crm-sync-setup/what-survives-the-transform.html
category: "Specs"
date: 2026-09-19
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

## What it costs

| Cost | What it means | Severity |
|---|---|---|
| Descriptors are a discipline | A file without one is invisible to agents, and nothing enforces their existence but review | High — it degrades quietly |
| An R2-backed DAM is assembled | Ingest, transform orchestration and rights UI are yours to build and maintain | High |
| Edge transformation moves the dependency | You have removed a parser from your origin by depending on a vendor's | Medium — stated honestly, this is a trade and not a win |
| Stripping metadata loses provenance | C2PA credentials do not survive an unaware transform | Medium, rising as AI provenance expectations harden |
| Mesh compression is lossy | Draco quantizes; the rendition is not the asset | Low if originals are kept, total if they are not |

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
