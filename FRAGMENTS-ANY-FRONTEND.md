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
