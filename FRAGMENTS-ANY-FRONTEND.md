---
title: "Fragments on Any Frontend — One Webflow Source, Every Platform"
description: "The platform-agnostic fragment architecture: sections authored once in Webflow mount verbatim on AEM, WordPress, Astro, Next, 11ty, or a Shopify theme — markup travels through two worker rails, behavior and identity never leave the worker."
canonical: https://persephonepunch.github.io/crm-sync-setup/fragments-any-frontend.html
category: "Specs"
date: 2026-08-03
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/FRAGMENTS-ANY-FRONTEND.md
---
# Fragments on any frontend — one Webflow source, every platform

**What this is:** the architecture that lets a section authored once in
Webflow render verbatim on any consuming platform — AEM, WordPress, Astro,
Next, 11ty, a Shopify theme — without exports to maintain or copies that
drift.

**The one-line contract:** edit the section in Webflow, publish, and every
platform reflects it within a minute. Markup travels; behavior never does.

**Companion:** [the AEM adoption path](./aem-scaffold-webflow-export.html)
is this architecture worked end-to-end on an Adobe estate, with proof
screenshots from a live tenancy.

---

## 1. The split that makes it work

Webflow is the **authoring plane**: designers own layout, type, and copy
there, with full visual tooling. The consuming platforms own their **glass**
— routing, content wells, platform-native pages. Neither imports the other.

Between them sit two small worker rails, and a rule:

> **Markup travels. Behavior never does.**

A fragment arrives as clean HTML — scripts stripped, internal links
rewritten. Everything interactive on the consuming page (login, consent,
popups, forms) comes from the worker's own embeds, which are already
framework-agnostic. That is why the same fragment works everywhere: there is
nothing platform-specific inside it.

---

## 2. The two rails

| Rail | What it does |
|---|---|
| **Fragment proxy** — `/wf-fragment?id=<dom-id>&page=<path>` | Extracts ONE element by DOM id from the published source page: script- and iframe-stripped, internal links rewritten, served with open CORS, edge-cached 60 seconds. |
| **Stylesheet resolver** — `/wf-css` | The source site's compiled CSS URL is publish-hashed and rotates on every Webflow publish. This endpoint resolves the *current* URL and redirects to it — a stable `<link href>` no republish can rot. |

Both rails enforce a source allowlist (which sites may be extracted from)
and resolve the consuming origin to a tenant — a page can only mount
fragments its tenant is entitled to.

One deliberate exclusion: **prices and inventory never travel as fragments.**
A fragment is a snapshot; commerce data must be live at render time
(price-transparency rules like the EU Omnibus directive assume nothing
less). Product surfaces ride a separate live-JSON rail and render through a
web component, so a price on any platform is always the store's price now.

---

## 3. The authoring contract (Webflow side)

- Give the section a **semantic DOM id** on the published page — that id is
  the fragment's address. Discoverable ids beat generated hashes.
- Convert to a **Component only when the element repeats** across Webflow
  pages (navigation, footer). A one-page section gains nothing from it; the
  proxy extracts from one source page either way.
- **Publish is the deploy.** The 60-second fragment cache is the entire
  release pipeline — no build, no export, no ticket.

---

## 4. The platform matrix

Per platform, exactly three things change: how the fragment mounts, at what
tier it is fetched, and what "publish" means on that platform. The rails and
the behavior planes are identical bytes everywhere.

| Platform | Mount primitive | Fetch tier | Publish verb | Status |
|---|---|---|---|---|
| AEM / Edge Delivery | authorable block in the Universal Editor | client | Sites API | **shipped, live** |
| Shopify theme | Liquid section (runtime) or baked section push | client or baked | theme asset API | **shipped, live** |
| 11ty | component or shortcode at build time | build | git push | prototyped |
| WordPress / Drupal | shortcode or block, fetched server-side | SSR | REST API | pattern ready |
| Astro | component at build time | build | git push | pattern ready |
| Next / Nuxt / SvelteKit | server component / load function | SSR or ISR | git push / deploy | pattern ready |

Two notes on fetch tiers:

- **Server and build tiers put the fragment in the initial HTML** — no CORS
  in play, and answer engines see the markup without executing anything.
  Prefer them where the platform offers the tier.
- **Static builds freeze fragments until the next build.** Fine for copy;
  never acceptable for prices — which is exactly why commerce data has its
  own live rail (§2).

---

## 4a. The other way to share UI — the compile comparison

The conventional answer to "one design, many platforms" is a compiled
component library: build the sections as React or Vue components, publish a
package, make every consumer install it. It works — at a price the fragment
rail was designed not to pay.

| | Compiled component library (React / Vue) | Fragment rail |
|---|---|---|
| Distribution unit | npm package of components | published markup at a DOM id |
| Consumer requirement | same framework, compatible version, build pipeline | one fetch — or one script tag |
| Framework lock-in | every consumer runs the framework | none; HTML + CSS land anywhere |
| Update propagation | version bump → rebuild → redeploy **every** consumer | publish once; live everywhere in 60 seconds |
| Who edits the section | developers, in JSX / SFC | designers, in Webflow |
| Runtime cost per page | framework + hydration, on every consumer | none — fragment markup is inert |
| Behavior | bundled into components, duplicated per app | one worker plane hydrating hooks on all surfaces |
| Design tokens | a theme provider per framework | CSS custom properties with literal fallbacks |
| Drift risk | each consumer pins its own version | structurally zero — one source, no copies |
| Where it wins | app-grade interactive UI, typed props | brand and content surfaces that must never drift |

The last row is the honest one: these approaches **compose rather than
compete**. A Next or React application can mount fragments for its brand
chrome — navigation, footer, marketing sections — while keeping its
framework for application UI; the fragment arrives as plain HTML and never
conflicts with the host's renderer. What the rail refuses is making the
*framework* a precondition for the *brand*: the stack itself stays
framework-free, reaching for a small reactive layer (petite-vue) only where
a surface actually carries reactive state, and never requiring a consumer
to compile anything to receive design.

---

## 4b. Beneath the fragments — additive compile, one system of record

**Non-destructive, higher-order, progressive — and strictly additive.** The
stack never asks a platform to become something else. A working page
compiles *upward*: first the regulatory baseline (consent before any signal
fires), then per-need behavior, then brand tokens, then fragments — each
layer an opt-in script or stylesheet, each removable by deleting one tag,
none rewriting what the host already does. Adoption is not a migration and
removal is not a teardown; that is what non-destructive means here, and it
is the opposite of the rip-and-replace that platform vendors call
"modernization."

**The system of record, defined.** A system of record is the one place
where a fact is *authoritative* — where writes land first and disputes
resolve. Every other copy is a projection with lineage back to it. In this
architecture **Xano holds the rows**: identity, consent, entitlement,
catalog mappings. Fragments, metaobjects, CDN caches, even the copies
inside a CRM are projections — regenerable at any time precisely because
they are never the record. A fragment can be wrong for sixty seconds; a row
cannot be wrong at all.

**The AI tool runner replaces the per-tenant ESB.** An enterprise service
bus earns its keep by routing and transforming between systems — and pays
for it by holding standing credentials to every one of them, licensed per
tenant, one perimeter around everything. The replacement is not another
bus: it is an **AI tool runner** — an agent loop executing scoped tools
under a signed mandate, where every call is authorized by a row *at call
time*, ledgered, and individually revocable. Orchestration becomes
ephemeral: authority exists for the duration of one call, per tenant, and
there is no resident middleware to breach or to license. The integration
layer stops being a product you install and becomes a permission you grant.

<div class="uk-video-wrap" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5rem 0 0.5rem;">
<iframe src="https://www.youtube-nocookie.com/embed/mT5bhj1Wygg" title="Event-Driven Architecture" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

*Watch: Event-Driven Architecture — the messaging pattern this section
argues with. Events decouple the systems; the open question is always who
holds the authority when one fires. The bus answers with standing
credentials; the tool runner answers with a row, at call time.*

**Two patterns, one grid.** Read the construction against the two
architectures the industry already names. **Event-driven** is the
horizontal axis: the stack's event bus (consent changes, auth changes,
`crm_pim_ready`) decouples the planes, and the tool runner grounds every
event's authority in a call-time row instead of a resident bus.
**Vertical slice** is the other axis: a fragment is a *vertical slice* in
the strict sense — one feature cut through every layer at once (authored
section → stylesheet → identifiers → record) that ships independently,
instead of a change negotiated across each platform's horizontal layers.
The nav is a slice; the hero is a slice; a product card is a slice. Slices
travel; the event plane coordinates; the rows decide. That grid — vertical
slices over an event-driven substrate, both answering to the record — is
the whole architecture in one sentence.

**Fees follow the chain, not the silo.** Two pricing physics:

| | Data that stops (SLA pricing) | Data everywhere (chain pricing) |
|---|---|---|
| Where the data lives | the vendor's silo | your system of record |
| What you pay for | the place it is kept, plus the promise of access | operated services, when the chain does work |
| Reaching a new surface | another integration project, another fee | already reachable — the plane runs everywhere by construction |
| When you leave | the data stops at their boundary | the rows were always yours; projections regenerate |

The SLA model charges for data **at rest** and meters your access to your
own record. The chain model holds the record where you put it and charges
only **in motion** — evidence logging, registries, metered publish rails —
never for storing what was already yours.

**The boundary is gated prior to the fee, and agnostic to it.** Consent,
entitlement, and verification evaluate before any commercial event and
independently of the plan: no fee unlocks a bypass, and no lapsed invoice
switches the gate off. Trust is not a tier. The SLA model quietly inverts
this — access to your own record *is* the paid feature, so the boundary and
the bill become the same mechanism, and the gate's integrity inherits the
billing relationship's health.

**The automation-tier ceiling — the third fee model.** Between the SLA silo
and the chain sits the tier most teams actually run: Zapier, n8n, Airtable.
Their model is *data metered per motion, with a ceiling*:

| | Zapier / n8n (cloud) | Airtable | Xano as SoR |
|---|---|---|---|
| Metered unit | tasks / executions per month | records per base, API rate | authority rows — never per-record fees |
| At the ceiling | the workflow **pauses** — the chain stops mid-month | the base stops accepting the record | the record always lands; fees attach to operated services |
| Credential model | standing OAuth grants to every connected system — the per-tenant ESB, rebuilt in miniature | API keys held by every consumer | scoped, call-time authorization; revocation is a row delete |
| Record authority | none — a relay between other systems' records | an accidental SoR that caps out | the system of record, by definition and by design |

Two structural problems hide in that tier. **The ceiling is a scheduled
latent collision:** a paused Zap doesn't fail loudly — it queues, and the
records arrive after the decisions they should have informed. Metering data
per motion means the *busier your business, the more your own data costs
you* — and the month you grow is the month the chain stops. And **the
credential model is the ESB problem at SMB scale:** an automation account
holding standing grants to the store, the CRM, the mailer, and the
spreadsheet is one perimeter around everything, priced per task. The
replacement is the same as at enterprise scale (§4b above): authority per
call, record in your own SoR, fees only where the chain does operated work
— and no ceiling on how often your own record is allowed to be true.

**Data on time, or the latent collision.** A decision made now against a
record that arrives later is not an integration — it is a collision: the
bid placed on a page-view-inferred conversion, the agent acting on an
entitlement that was revoked an export-window ago. Silo pricing
manufactures that latency by design — batch windows, rate-limited access to
your own record — and latency converts records into liabilities at exactly
the moment they are consulted. The chain evaluates the row at call time:
the record and the decision share a clock, which is the only arrangement an
agent acting under a mandate can safely inhabit.

**The foundation: judgment-based loading.** Strip everything above down and
one primitive remains. A conventional script manager loads JavaScript by
static configuration — triggers a human wrote last quarter, firing whether
or not they should. The helmet is a script manager whose additions are
**judgment-based**: every layer loads only when the judgment passes *at that
moment* — consent permits it, the entitlement row grants it, the page
demonstrably needs it. The AI tool runner is the same primitive lifted from
loading to integration: a tool call happens only when the row says yes,
now, under this mandate. One idea, two altitudes — **judgment at load time
and call time, replacing configuration at build time** — and it is the
foundation the whole construction stands on: the additive compile is
judgment about what a page becomes, the fragment TTL is judgment about what
is still true, the chain fee is judgment about when work was actually done,
and the gate before the fee is the judgment no invoice can buy.

---

## 5. The consuming-page discipline

Three rules keep a mounted fragment pixel-true, learned the hard way:

1. **The platform's base styles must never outrank fragment markup.** Every
   frontend ships a reset or utility layer; scope it *away* from mounted
   chrome rather than escalating specificity. The two rules that actually
   bite in practice: link-color resets (`a:any-link` outranks class
   selectors) and image normalization (`img { width/height: auto }` defeats
   HTML attribute sizing).
2. **Behavior planes stay client-side on every platform.** Embeds hydrate
   hooks after paint — login mounts, consent controls, form sockets. Only
   markup moves between tiers.
3. **The design tokens bridge, they don't fork.** The consuming platform's
   own token layer consumes the brand tokens with literal fallbacks
   (`var(--brand-font-body, "…")`), so native content and mounted fragments
   render from one type and color system — fonts self-hosted on the worker,
   no third-party font CDN on any platform.

---

## 5a. Social and microservice data direction

Every arrow in this architecture points one way, and the direction is
itself a datum. Nothing holds a standing two-way channel — that is the
bus's sin, and the ceiling-tier's, restated.

**Social has two directions, never conflated.** *Outbound* is
presentation: the share card a crawler unfurls from a minted link — a tile
and a title, carrying no routing data, counted by no one, swappable after
the fact because it is *about* the link, not the link. *Inbound* is the
click or scan: a redirect stamped with channel, campaign, and product
identifier, counted in the ledger, joinable to the order it eventually
becomes. A crawler is not a reader; a card is not a visit. Keeping the two
directions in separate artifacts is what keeps attribution honest — the
ledger records who came *from* the video and who came *to* it as two rows,
not one blur.

**Microservices have four verbs, each one-directional.** Rails **pull** —
a consumer fetches markup, stylesheet, or live catalog at the moment of
need, against a short TTL. Planes **hydrate** — embeds bind behavior onto
hooks after paint, downward from the worker, never as markup. Events
**emit** — consent changes, auth changes, readiness signals fan out on the
bus with no expectation of reply. Tools **call** — under a mandate,
authorized by a row at call time, ledgered on completion. Four verbs, four
directions, one authority check per arrow — and no resident channel for an
attacker to live in or a vendor to meter.

**Direction is the data model.** Writes land at the record first and
projections flow outward only; scans flow inward only and settle as rows.
Draw the system and every edge is an arrow, not a line — which is exactly
what makes it auditable: an arrow says who moved, toward what, under whose
judgment. A line says only that two things are entangled.

**The hash is the multiplier — and the trust anchor.** A semantic DOM id
is not one thing; it is four addresses wearing one name. It is the
fragment's *extraction* address on the rail; the *deep link* that opens
the exact section for a human (`#fragments-any-frontend` survives the
minted redirect intact); the *mint target* that turns one page into many
attributable destinations — N addressable sections × M channels is a
combinatorial fan-out from a single authored source; and the *JSON-LD
`@id`* an answer engine cites, anchored to the canonical URL. That last
one is the AEO verification frame: the same `#id` resolves identically
for the crawler that cites it, the human who clicks the citation, and the
agent that transacts against it — one address, three audiences, no
translation layer where trust could leak. A hash that means the same
thing to every reader is the cheapest verifiable claim on the web; nested
well, it turns a page into a lattice of them.

---

## 6. Demonstrated

The full chain runs live on an AEM as a Cloud Service tenancy: Webflow
navigation and footer as symbols, a hero section with its interaction plane,
a capability table, and the worker's login, consent, and modal planes — all
on Adobe's glass, with no AEM-side credentials anywhere.

![The Webflow-authored hero, mounted verbatim on AEM Edge Delivery](https://crm-sync.dev/kb/media/docs/aem-front-live.png)

Details, phases, and the enterprise substrate election are in
[the AEM adoption path](./aem-scaffold-webflow-export.html).

---

## 7. Boundaries

- **No credentials in transport.** The rails serve published, public markup;
  identity and entitlement stay in the worker and its rows.
- **Webflow remains the editing plane for mirrored sections.** A mounted
  fragment is deliberately read-only on the consuming platform — the trade
  that guarantees zero drift.
- **One consuming origin, one tenant.** Fragments resolve through the same
  origin-to-tenant pairing as every other worker surface; an unpaired origin
  gets nothing.

---

## Summary — the data-driven content build, and the AI services it carries

**The content build is data-driven end to end.** Nothing on any surface is
hand-copied: product pages render from identifiers, product cards from the
store's live catalog JSON, knowledge-base rows from the documentation
index, mirrored sections from the published Webflow source, share cards
from the mint's own row. Every surface is a *projection of a record* —
rebuilt on demand, correct by regeneration, never maintained by hand. The
build itself is judgment-based (§4b): a page assembles at load time from
whatever the rows, the consent state, and the page's demonstrated need
permit — vertical slices over an event-driven substrate, both answering to
the record.

**The AI services ride the same substrate, under the same gates.** What
runs today: retrieval-grounded answers over the documentation corpus (the
search that cites its sources), semantic product search, edge translation
of authored content, predictive-value modeling feeding ad bidding — and
the agentic tier: tool calls under signed mandates, spend-capped and
individually revocable, with the tool runner standing where the
integration bus used to. None of it gets a bypass: consent is evaluated
before any signal fires, the entitlement row before any action, the
boundary before any fee. AI here is not a feature bolted to a product —
it is a set of services *licensed by the record*, which is what makes them
safe to offer and safe to meter.

**The one-sentence version:** author once, record once — every surface is
a projection, every behavior a judgment, every fee a motion, and the row
is the only thing that is ever allowed to be true.
