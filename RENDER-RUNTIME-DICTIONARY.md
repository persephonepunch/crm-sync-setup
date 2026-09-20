---
title: "Render and Runtime: A Working Dictionary"
description: "Precise definitions for business analysts and designers — ISR, islands, Astro, Eleventy, Petite Vue, HTMX, Liquid, PHP passthrough, Deno against Node, keys against cookies, UAT, boundary pipelines, TDD, adversarial testing and SRI — each with the distinction that changes a decision."
canonical: https://persephonepunch.github.io/crm-sync-setup/render-runtime-dictionary.html
category: "Specs"
date: 2026-09-20
tags:
  - architecture
  - security
  - testing
  - webflow
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/RENDER-RUNTIME-DICTIONARY.md
licence: CC-BY-4.0
---

# Render and Runtime: A Working Dictionary

![Five bands. Sources — GraphQL, streaming, system of record and object store — converge on a heavy-stroked boundary containing four numbered gates: subject, entitlement, consent, shape, with a refusal exit marked by a cross. One arrow labelled ALLOWED leaves it and fans to five renderers: React and Next.js serialising state, Astro islands, Eleventy, Shopify Liquid, WordPress PHP. A wrapper band compares PWA, iOS and Android native, Tauri, Electron and Unity by reach rather than authority. A final band contrasts a decision made inside the renderer against one made below it.](https://crm-sync.dev/kb/media/docs/render-boundary-map.png)

**For the business analyst and the designer sitting in an architecture review.**

> Every term below is defined by **the decision it changes**. A definition that does not change a
> decision is trivia, and trivia is why glossaries go unread.

---

## The pivot the rest of this depends on

**AI pivot, privacy.** Privacy was historically a *disclosure* discipline: show a notice, collect
a choice, honour it at render time. That model assumed the reader was a person who would see only
what the page displayed.

An agent does not read a page. It reads the payload, the API, the export and the index — and
then it **infers**, joins and acts. Two consequences reorganise the discipline:

1. **Withholding is no longer a rendering decision.** Data that reaches the client is disclosed, whether or not it was displayed.
2. **A machine states an inference with the confidence of a fact.** The governance failure is no longer a wrong number. It is a *confident* wrong number, produced at speed, from inputs that were each individually correct.

Which is why the terms below are worth precision: they mostly describe **where computation
happens and what crosses a boundary** — and that has become a privacy question rather than a
performance one.

---

## Rendering models

**Server-side rendering (SSR).** HTML is assembled on a server for each request. The client
receives a document. Whatever the server included is disclosed; whatever it omitted was never
sent.

**Client-side rendering (CSR).** The server sends a shell plus JavaScript; the browser builds the
document. The data must therefore travel to the browser to be rendered there.

**Hydration.** A page arrives as server-rendered HTML and then JavaScript "wakes it up" —
attaching handlers and reconstructing component state. **The structural requirement is the
important part: to rebuild the tree, the client must receive the data the server rendered from.**
Props crossing into a hydrated component are serialised into the page and are readable in
view-source.

**ISR — Incremental Static Regeneration.** Pages are pre-built as static files and re-generated
periodically or on demand, rather than per request. A cache with a build step.

> **The decision it changes:** an ISR page is generated *once* and served to *everyone* until it
> regenerates. Anything personalised, entitlement-dependent or consent-dependent that gets baked
> into it is disclosed to the next visitor. ISR and per-subject content are close to incompatible,
> and the failure is silent.

**Islands architecture.** The page ships as ordinary HTML; only designated interactive components
hydrate. The rest is inert markup that never becomes a component.

> **The decision it changes:** less JavaScript, and — more importantly — **less serialised state**,
> because only islands need their data shipped. The boundary is narrower by construction rather
> than by discipline.

---

## Frameworks, described by what they ship

**Astro.** Static-first, islands by default, ships **zero JavaScript** unless a component is
explicitly marked interactive. Content-heavy sites end up as documents rather than applications.

**Eleventy (11ty).** A static site generator with **no client runtime at all** by default. It
runs at build time, emits HTML, and is finished. Nothing of Eleventy exists at request time.

**Petite Vue.** A ~6 KB subset of Vue designed to add small reactive behaviours to
server-rendered HTML — sprinkles on a document, not a framework that owns the page.

**HTMX.** The server returns **HTML fragments**; the client swaps them into the DOM. There is no
client-side application state, therefore no serialisation of it.

**Next.js.** A React framework with server components, client components and a hydration model.
Powerful, and it carries a client runtime that must be fed state.

### HTMX against Next.js — the distinction that matters

Both can produce the same interaction. They differ in **what crosses to the browser**.

| | HTMX | Next.js |
|---|---|---|
| What the server returns | An HTML fragment | HTML plus a serialised payload for hydration |
| Client-side state | None | The component tree |
| What an attacker reads in the response | What was rendered | What was rendered **and** what was passed as props |
| Where a permission check must live | Server, unavoidably — there is nowhere else | Server, but the framework offers a convincing-looking client alternative |

> **The decision it changes:** HTMX has no props to leak because it never serialises state.
> Next.js can be made equally safe, but safety is a *practice* there and a *property* in HTMX.
> Choosing between them is choosing how much depends on everybody remembering.

---

## Template languages, and a distinction people get backwards

**Liquid.** A template language created at Shopify and **open-sourced**, which is why it is not
only Shopify's. Jekyll uses it. **Eleventy supports it** as a first-class template language, via
the `liquidjs` implementation. The same `{% raw %}{% for %}{% endraw %}` and
`{% raw %}{{ }}{% endraw %}` syntax you write in a Shopify theme runs in a static build.

It is **deliberately sandboxed** wherever it runs: no arbitrary code, no network calls, no
filesystem. That constraint is the reason it was adopted for multi-tenant themes in the first
place — a language that cannot execute arbitrary code is the only kind you can safely hand to
thousands of strangers.

> **The decision it changes:** Liquid's limits are a security feature, and they cut both ways.
> It cannot be made to do harm, and it cannot be made to *enforce*. Logic placed in Liquid is
> presentation wearing the costume of a rule.

### The same language, twice — and the difference is everything

**11ty's Liquid and Shopify's Liquid are the same language.** A template can be genuinely
portable between them. What differs is not syntax:

| | Liquid in Eleventy | Liquid in Shopify |
|---|---|---|
| **Implementation** | `liquidjs` (JavaScript) | Shopify's original Ruby implementation |
| **When it runs** | **Build time**, once, on your machine | **Every request**, on Shopify's infrastructure |
| **What is in scope** | Your data files | Shopify's commerce objects — `product`, `cart`, `customer` |
| **Output** | Files on disk | A response, assembled per visitor |
| **At request time** | Nothing of Liquid exists | The renderer, the object model, the customer's session |

The implementations are close but not identical — Shopify's commerce **objects and filters are
Shopify's, not the language's**, and a theme that leans on them will not run in Eleventy without
data standing in for them.

**Why this matters more than the PHP comparison below.** With WordPress and Eleventy someone can
argue the difference lies in the languages. Here the language is **held constant**. Same syntax,
same sandbox, same mental model — and one produces a static file while the other runs a renderer
against a live session on every request.

Which isolates the variable exactly: **the security posture of a page is a property of its
runtime, not of the language that wrote it.** Nothing about Liquid tells you whether a decision
made in it is enforceable. Only *where and when it runs* does.

**PHP passthrough (WordPress, Drupal).** PHP executes on the server and emits HTML. The browser
receives a document.

**And here is the part worth stating plainly: the HTML that WordPress emits and the HTML that
Eleventy emits are indistinguishable.** A browser cannot tell which produced a page, and neither
can a visitor. Identical artifact.

The entire difference is on the server, and it is total:

| | Eleventy | WordPress / Drupal PHP |
|---|---|---|
| When it runs | Build time, then never | **Every request** |
| What exists at request time | A file on disk | A language interpreter with database and filesystem access |
| Attack surface at request time | The web server serving a file | The interpreter, the application, the plugins, the theme |
| What a template can do | Nothing — it already ran | Anything PHP can do |

> **The decision it changes:** "we render server-side to HTML" describes both and distinguishes
> nothing. The question that distinguishes them is **what is still running when the request
> arrives.** For a brochure site the answer should be *nothing*, and choosing a runtime that
> answers *an interpreter* is a decision someone should have made deliberately.

---

## Publishing, and front matter as a machine index

**Jekyll.** A Ruby static site generator that uses **Liquid** for templating — the same language
as the entry above. Its lasting contribution is not the tool. It is a convention.

**GitHub Pages.** Static hosting served directly from a repository. It will run Jekyll for you,
**or serve files exactly as committed** if a `.nojekyll` file is present at the root. Both modes
are ordinary static hosting: a file on disk, no runtime, nothing executing when a request
arrives.

**YAML front matter.** The fenced block at the top of a source file, before the content:

```
---
title: "Render and Runtime: A Working Dictionary"
description: "Precise definitions for the architecture review…"
canonical: https://example.org/render-runtime-dictionary.html
category: "Specs"
date: 2026-09-20
tags: [architecture, security, testing]
---
```

Jekyll introduced it as a way to pass variables into a template. It has outlived that purpose
entirely.

### The decision it changes

**Front matter is a machine index that travels inside the document.**

That sentence is doing more work than it appears to. Structured metadata usually lives somewhere
else — a CMS record, a database row, a sidecar file, an HTML `<meta>` tag emitted at render.
Every one of those can drift from the content it describes, and most eventually do. Front matter
cannot, because moving the file moves the index, and changing one in a commit shows the other
in the same diff.

Four properties follow, and each answers a failure the alternatives have:

| Property | The failure it avoids |
|---|---|
| **Readable without rendering** | A build step, a crawler, a worker or an agent parses the metadata without executing a template or loading a browser. HTML `<meta>` is only machine-readable *after* someone renders the page |
| **Version-controlled with the content** | The pairing is enforced by a commit rather than by whoever remembered to update the other system |
| **Diffable** | A category change, a canonical change or a retitle is a reviewable line in a pull request, not a silent edit in an admin panel |
| **Portable** | It survives dropping Jekyll, changing host, or changing renderer. It is text at the top of a text file |

### Where this lands in practice

A docs corpus with disciplined front matter is **queryable before it is rendered**. An index can
be built by reading the first twenty lines of each file: titles, canonicals, categories, dates,
tags — no HTML parsing, no headless browser, no scraping heuristics that break when the theme
changes.

That is the same argument the descriptor makes about assets, arriving from the publishing side:
**metadata that must survive belongs beside the content in a form both a person and a machine can
read**, not inside a rendered artifact that a transform will discard.

And the convention genuinely outlived its tool. **You can keep front matter and drop Jekyll
entirely** — serve the repository raw with `.nojekyll`, render however you like, and have a
separate system read the front matter to build the index. The metadata contract survives the
renderer, which is the property that made it worth adopting in the first place.

> **The trap, stated once:** front matter only indexes what it actually contains. A `description`
> that drifted from the document, a `canonical` pointing at a page that no longer exists, a
> `date` left at the value it had when the file was created — each is a machine index confidently
> describing something that is no longer true. It is worth a check in CI, because nothing else
> will notice.

## Runtimes

**Node.js.** A JavaScript runtime whose process has, by default, **whatever access the operating
system granted it** — filesystem, network, environment. A dependency five levels down can read a
file or open a socket without declaring it, because nothing requires declaration.

**Deno.** A JavaScript runtime that starts with **nothing** and receives only what was granted at
launch: `--allow-net` for named hosts, `--allow-read` for named paths, `--allow-env` for named
variables. Deny by default, declared before the code runs, **enforced by the runtime**.

> **The decision it changes:** in Node, "this library cannot reach the internet" is a claim about
> code you have read. In Deno it is a property of how the process was started. Same language,
> categorically different assurance — which is why an untrusted transformation belongs in the
> second.

---

## Secrets and sessions

**Cookie.** A value the browser stores and presents on subsequent requests. It is an
**identifier**; the server decides what it means. Sessions, consent state and preferences live
here.

**Encryption key.** The means to **read a value**. Not an identifier, and not something a browser
should ever hold for data it is not entitled to.

| | Cookie | Key |
|---|---|---|
| What it is | A claim to be someone | The ability to read something |
| If compromised | Impersonation, until revoked | Disclosure of everything it ever encrypted |
| Revocation | Works — invalidate the session | **Does not work retroactively.** Ciphertext already copied stays readable |
| Blast radius | One subject, one session | Every record under that key, for all time |

> **The decision it changes:** cookie compromise is an incident you close. Key compromise is a
> disclosure you announce. This is why keys live in an HSM and are **non-exportable**, and why
> per-subject or per-tenant keys are worth the operational cost — they bound the second row.

---

## Testing and release control

**UAT — User Acceptance Testing.** Verification that a system does what its users need, usually
before release.

> **The decision it changes:** in security and compliance gating, **most UAT cases are expected to
> fail the operation.** You are testing refusal, not function. A suite where every case succeeds
> has tested the product and not its boundary.

**TDD — Test-Driven Development.** The test is written first and defines the expected behaviour;
the code is written to satisfy it. Tests become a specification rather than an afterthought.

**Adversarial testing** — the *GAN* sense, borrowed from generative adversarial networks where one
model's job is to defeat another. Here it means a suite whose purpose is **to attack the thing
under test**: malformed input, escalated scope, replayed tokens, traversal paths, expired
mandates. TDD asks *does it work*. Adversarial testing asks *what happens when someone tries*.

**Boundary pipeline.** A CI stage that exercises the permissions boundary specifically — every
route, every subject class, every refusal — and **blocks the release** when one stops refusing.
The distinguishing property is that it blocks. A pipeline that reports is a pipeline people learn
to scroll past.

**SRI — Subresource Integrity.** An attribute stating the hash a script or stylesheet must match.
The browser fetches it, hashes it, compares, and **refuses to execute on a mismatch**.

```html
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>
```

It defends against a compromised CDN or a third-party host serving different bytes. It does not
defend against a compromise of your own page — an attacker who can edit the HTML can edit the
hash beside it — and it says nothing about whether the file was safe when you pinned it.

> **The decision it changes:** SRI **fails closed**, which is correct for a security control and
> dangerous on the wrong file. Pin static third-party libraries. **Never pin a file you
> regenerate** — its bytes change every deploy, and the page then breaks in the customer's
> browser rather than in your pipeline.

---

## The consequence, once every entry above is read together

Astro, Eleventy, HTMX, Next.js, Liquid in two runtimes, a PHP theme, a Jekyll build. Each entry
describes a different way to turn data into a document, and **not one of them is where a
permission can be enforced.**

Which is the useful conclusion rather than a disappointing one: if the boundary is server-side,
holding the entitlement in a system of record and refusing at an edge the renderer never sees,
then **the renderer becomes a choice about authoring, performance and taste — not about
security.** Any of them can front the same data binding, including one nobody has written yet,
and including a caller that is an agent rather than a browser.

Worked through in [Fragments for Any Front End](https://www.crm-sync.dev/pages/knowledge-base#fragments-any-frontend),
which shows one fragment mounting on six platforms — and is explicit that it only works because
nothing security-relevant is inside it.

## Supplementing a standard operating procedure

These terms are useful in a procedure when each appears as a **decision with an owner**, not as a
description. Three worked examples:

- *"Interactive components are islands; personalised content is never ISR-cached."* — a rendering rule with a disclosure reason.
- *"Untrusted transformations run under a deny-by-default runtime with network and filesystem withheld."* — a runtime rule naming what is withheld rather than what is used.
- *"SRI is applied to third-party libraries at fixed versions only, and a pipeline check asserts every published hash against the file currently served."* — a control plus the test that keeps it true.

**Related:** [QA and Release Gating for Agents, Mandates and Robots](https://www.crm-sync.dev/pages/knowledge-base#qa-release-gating)
· [Server-Side, Or It Didn't Happen](https://www.crm-sync.dev/pages/knowledge-base#server-side-or-it-didnt-happen)
· [Permissions for AI — capability, not perimeter](https://www.crm-sync.dev/pages/knowledge-base#capability-not-perimeter)
