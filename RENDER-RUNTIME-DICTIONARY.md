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

## Models, and where a language decision belongs

**Ladder tree.** A routing structure for model work. The **tree** branches first — on direction,
content class, and whether protected terms are present — and each branch ends in a **ladder**
whose rungs escalate from cheapest and most deterministic to most expensive: a cache, then a
termbase substitution, then a specialised model, then a general one, then a person.

> **The decision it changes:** each rung is a **gate, not a score.** Work climbs because a rung
> *declined* — the segment contained a glossary term, the direction was register-sensitive, the
> content class was legal — never because a confidence number was low. A model's self-reported
> confidence is precisely the thing that must not do the routing, since it is produced by the
> component being evaluated.

**Frontier model.** The largest current models, available as a hosted API — you send text, you
receive text, the weights are not yours and the version moves when the vendor moves it.

**Open-weight model.** Weights you can download and run: Qwen, Llama, and translation-specific
models like **m2m100**. Quality typically trails the frontier and the gap has been narrowing.

| | Frontier | Open weight |
|---|---|---|
| Where the text is processed | **Their infrastructure** | **Yours** |
| Version | Moves when they move it | Pinned by you |
| Cost shape | Per token, scales with use | GPU capacity, scales with peak |
| Quality ceiling | Highest available | Behind, and closing |
| What leaves your boundary | **The text** | Nothing |

> **The decision it changes:** this reads as a quality-versus-cost question and is usually a
> **data-residency** question wearing a quality costume. Sending a customer's message to a hosted
> API is a cross-border transfer of whatever that message contains. Running open weights in your
> own runtime means the text never leaves. For low-stakes content the frontier is the obvious
> choice; for anything carrying personal data the question is not *which is better* but *may this
> text be there at all.*

**Translation boundary design.** Deciding **where** translation happens and **what crosses** to
get it done — as distinct from choosing a model.

Three properties decide it:

- **Direction is asymmetric.** KO→EN and EN→KO are different problems with different failure modes. m2m100's distinguishing feature is translating **directly between pairs rather than pivoting through English**, which matters most for CJK↔CJK, where a pivot loses honorifics and register twice.
- **A translation is a derived work, and it inherits the classification of its source.** Translated personal data is still personal data. Translated medical text is still medical text. The output does not become lower-risk by changing language, and pipelines routinely treat it as though it does.
- **A specialised translation model cannot be instructed.** m2m100 will not respect a glossary or preserve a product name, because it has no instruction channel. That is a routing fact: any segment containing a protected term must skip that rung entirely, not be corrected afterwards.

> **The decision it changes:** the boundary is not where the best output comes from — it is where
> the source text is allowed to be at the moment it is processed. Design that first; choose the
> model inside it.

## Data shape, and the cost of an object

**Struct layout (C).** A type *is* a memory layout. A field access compiles to a single load at
a known offset, there is no type information at runtime, and an array of structs is one
contiguous block.

**Object protocol (Python).** A type is an object. Every value is a heap allocation with a
header — a refcount and a type pointer — and attributes live in a per-instance dictionary, so
`obj.field` is a hash lookup and possibly a walk up the inheritance order. Even an integer is a
heap object.

> **The decision it changes:** it is not attribute speed, it is **layout**. A list of a million
> Python objects is a million pointers to scattered allocations, each a probable cache miss. An
> array of structs is one block the prefetcher can read. That single fact is why NumPy, Polars
> and Arrow exist — each is a thin Python object wrapping **one raw C buffer**, so the data keeps
> C's layout and only the handle is Pythonic. `__slots__` is the middle ground: it removes the
> instance dictionary and restores fixed offsets. Reach for it on anything instantiated in bulk.

The general form, and it recurs: **Python's memory safety is borrowed from its interpreter, and
its flexibility is purchased with indirection.** Both are paid for in C — increasingly in Rust.

**JSON-LD.** A JSON serialisation of linked data: an object syntactically, an RDF graph
semantically, with `@id` making nodes referenceable and `@graph` letting several coexist. On a
product page it is what a crawler reads to learn the offer.

> **The decision it changes:** it is **an object at the edge and a row everywhere it is used.**
> A Merchant crawler turns one `Product` object into one row — `offers.price` becomes a price
> column, `gtin`/`mpn`/`brand` become identifier columns — so a missing attribute is a missing
> column, with no error and no partial credit; the offer is simply never seen. It also cannot be
> authored in a rich text field, because rich text sanitises HTML and a `<script type=
> "application/ld+json">` does not survive. Generate it from the record and inject it, or the
> object and the row have different parents.

**BQML.** Model training expressed in SQL and executed inside BigQuery — `CREATE MODEL … AS
SELECT …` — so the features are columns in a table rather than fields in a document.

**pLTV — predicted lifetime value.** A model output estimating a customer's future value, fitted
on an observation window and scored forward. In this estate: features over days 0–7, label over
days 7–97.

> **The decision it changes:** pLTV is a **weight, not an entitlement.** It may rank an audience
> or bias a bid. It may never decide whether a subject is permitted to do something, because a
> score is a description of the past and a permission is a statement about the present. This is
> the same separation that keeps the warehouse out of authorisation.

**Revenue value automation.** Feeding a modelled value — pLTV, predicted margin, propensity —
into a bidding or targeting system so spend follows expected return rather than a flat rule.

> **The decision it changes:** the automation is only as lawful as the **gate in front of it.**
> Every person in an uploaded audience is checked for consent per signal at the moment of upload,
> jurisdiction following the subject rather than the store, and a withdrawal **removes** rather
> than pauses. The model does not know any of that and must not be asked to — the check belongs
> between the score and the upload, where it can refuse and leave a record.

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

## Allow-lists, and where each one belongs

**Allow-list.** A named set of permitted things, where everything unnamed is excluded. Its
opposite is a **deny-list**, which names the forbidden and permits the rest.

> **The decision it changes:** a deny-list has to anticipate. An allow-list does not — anything
> invented after the code was written is excluded by default, because nobody added it. That is
> the entire argument, and it is why the estate uses allow-lists at every crossing.

**Construct, don't filter.** The stronger form. Rather than taking the incoming thing and
removing what is bad, **build a new one and copy across only what is named.**

> **The decision it changes:** a filter that misses something passes it. A construction that
> misses something simply does not carry it. Removing a `<script>` tag from an SVG requires you
> to have thought of `<script>`; rebuilding the SVG from a list of permitted elements drops
> `<script>` without ever having heard of it.

**Where they belong.** Not one place. An allow-list sits at **every boundary crossing**, on the
side that bears the consequence:

| Moment | What is listed | Protects |
|---|---|---|
| Before a request reaches the origin | Accepted upload types, at the edge | The origin from ever seeing the file |
| On ingest | Accepted formats | The parser from formats nobody declared |
| On write | Declared schema fields | The record from junk |
| Before publishing | Artifact classes that may be made public | Irreversibility — a published address cannot be recalled |
| On read | Fields a response may contain | The subject from over-disclosure |
| On serve | Types that may render inline | The browser from executing an upload |
| Before DOM injection | Permitted elements and attributes | The document from script inside an asset |

**The caveat:** seven allow-lists do not add up to a boundary. Each protects one crossing; none
answers *may this subject have this thing.* That remains the permissions check in front of them.

**The test when adding one:** ask who suffers if the wrong thing gets through, and put the list
on their side of the line.

## Shopify Functions and the WASM bargain

**WebAssembly (WASM).** A portable binary instruction format executed in a sandbox. Its defining
property is what it **lacks**: no filesystem, no network, no ambient anything, unless the host
explicitly grants it.

**Shopify Functions.** Server-side customisation of Shopify's own logic — discounts, shipping
rules, payment customisation, cart transforms — compiled to WASM and run by Shopify at the point
the decision is made. You write Rust, JavaScript or anything that targets WASM; Shopify runs it.

The contract is narrow on purpose:

| | Shopify Functions |
|---|---|
| Input | A typed payload Shopify constructs |
| Output | A typed result Shopify validates |
| Network | **None** |
| Filesystem | **None** |
| Time | A hard limit, measured in milliseconds |
| Where it runs | Shopify's infrastructure, inside checkout's own decision path |

> **The decision it changes:** the limitations are the product. A Function **cannot** call your
> API mid-checkout, cannot read a file, cannot wait. That sounds like a constraint list and is
> actually a guarantee: **a Function cannot do anything it was not handed**, so a compromised or
> simply wrong Function produces a bad discount, not a breach. This is the exception that proves
> the rule the rest of this dictionary makes — it is the one place in a commerce stack where
> customisation runs *inside* the decision rather than beside it, and it is safe precisely
> because the runtime denies by default.

The corollary is the honest one: **anything your Function needs must be in the input.** If a
decision depends on live data, it belongs in the payload Shopify builds, not in a call the
Function makes — because the Function cannot make one.

## Why this arrangement is secure, in plain terms

For the reader who does not write code and has to sign something.

The estate runs on three vendors and one rule. The rule is that **the decision about who may
have what is made in one place, on a server, before anything is sent** — and the three vendors
are chosen so that none of them can overrule it.

**Shopify is secure here because it refuses.** It will not run your arbitrary code on its
servers. Its template language cannot make network calls. Its customisation points are sandboxed
Functions that cannot reach outside their input. It bans file types it considers unsafe — SVG
most visibly. Every one of those is Shopify declining to do something a merchant might want,
and every one removes a way to be attacked. **The limitations are the security.**

**Webflow is secure here because it is somewhere else.** Content is authored there and served
from Webflow's own domain, so a problem with a Webflow asset is a problem on Webflow's origin —
not on the origin that takes payments. It re-encodes uploaded images, which quietly destroys
anything hidden inside them. And it generates the technical markup rather than letting an
author hand-write it, which removes a whole class of mistake. **Separation is the security.**

**Cloudflare is secure here because it is in front and it can refuse.** Every request passes it
before reaching anything else. It enforces rules that need no code — what may be uploaded, how a
file must be handled, how often anyone may ask. And the small programs it runs at the edge start
with **no access to anything** and receive only what they are explicitly given. **Refusal before
arrival is the security.**

**What none of them does is decide who you are and what you are allowed.** That is the system of
record, and it is deliberately not a vendor feature — because a permission that lives inside one
vendor's product cannot be asked by the other two, and would have to be rebuilt, differently and
slightly wrongly, in each.

> **The short version, for a signature:** three suppliers that each refuse a different thing,
> and one record that decides. No supplier can grant access. The record cannot execute code. And
> the parts that handle files never hold the credentials that would make a mistake expensive.

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

**Self-improving code generation (RSI).** A loop rather than a one-shot: a system generates code
or tests, runs them, reads the result, and refines. Distinct from **SRI** below, which is a hash
pin on a script and shares only the letters.

> **The decision it changes — and this is an opportunity, not a hazard.** Adversarial refusal
> tests have always been the thinnest part of any suite, and the reason is **economic, not
> technical**: a person writing the four-hundredth malformed-input case is expensive and bored,
> so estates write the happy paths and a handful of refusals and call it covered. Generation
> collapses that cost. What was unaffordable becomes routine.
>
> The consequence is bigger than coverage. **It converts an assertion into evidence.** "Our
> boundary refuses unauthorised callers" is a claim someone has to take on trust. Four hundred
> generated attempts, four hundred refusals, re-run on every build, is a record — and it is the
> form a regulator, an auditor or a customer's security review actually wants. The estate already
> argues that the refusal is the record; this is what makes producing that record affordable.
>
> Two more become practical at the same time. **Mutation testing** — deliberately break a check
> and assert the suite notices — was historically too slow to run in CI and is now cheap enough
> to point at the permissions boundary on every merge. And **incident-to-test synthesis** turns a
> postmortem into a permanent case, so the same failure cannot return quietly.

**The one rule that keeps it worth having.** The system that generates must not be the system
that judges. A generator optimises toward its signal, so *"the tests pass"* produces tests that
pass — by weakening assertions or encoding a current bug as expected behaviour. A green suite it
authored **and** scored is the generator agreeing with itself. Keep the expected refusals
human-authored and in version control so generation aims at a fixed target, and treat a generated
test that passes on first run with suspicion: the useful ones fail, because they found something.

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
