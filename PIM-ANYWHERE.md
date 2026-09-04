---
title: "PIM Anywhere — One Catalog Record, Any Frontend"
description: "The PIM plane treats the catalog as a plane, not a page: the store's own record is the single live source, and every surface — AEM, Webflow, WordPress, Next, plain HTML — renders a projection via a two-tag embed. The same record ships to Google through the Merchant API."
canonical: https://persephonepunch.github.io/crm-sync-setup/pim-anywhere.html
category: "Specs"
date: 2026-08-04
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/PIM-ANYWHERE.md
licence: CC-BY-4.0
---
# PIM Anywhere — one catalog record, any frontend

The PIM plane treats the catalog as a **plane, not a page**: the store's own
`products.json` is the single live record, and every surface renders a
projection of it. Prices are never baked into a page (the Omnibus rule —
live by construction), and no surface holds a copy that can drift.

Two projections ship from the same record:

| Audience | Projection | Endpoint |
|---|---|---|
| Humans, on any site | `<pim-collection>` web component | `GET /pim/collection` (public CORS proxy, 60s edge cache) |
| Google (Shopping / agents) | Merchant API ProductInput rows | `GET /pim/merchant-feed` (Merchant API `ProductInput` shape) |

Discovery is machine-readable: `GET https://crm-sync.dev/stack/config` →
`pim` block (element script, endpoints, element name).

## The embed — identical on every platform

Two tags. No build step, no framework dependency, no iframe. The component
is a native custom element; CSS ships as literal monochrome values (L1) that
brand tokens may override via `theme.css`.

```html
<script src="https://crm-sync.dev/embed/pim-elements.js" defer></script>
<pim-collection handle="all" limit="8" shop="your-store.myshopify.com"
                store="https://www.your-store.com"></pim-collection>
```

Attributes: `handle` (collection, default `all`) · `limit` (1–50) ·
`shop` (tenant store domain; omit on origins already paired to a tenant) ·
`store` (PDP link base — cards always link to the store-canonical PDP) ·
`currency` (display currency for `Intl.NumberFormat`).

### AEM / Edge Delivery
Add the script to the page head (or an embed block); place the element in
any block or fragment. Verified live on AEM Edge Delivery. The component
emits `crm_pim_ready` / `crm_pim_rendered` on the shared stack-loader
event bus.

### Webflow
Page settings → custom code (or an Embed element) — paste both tags.
Webflow pages hold no dynamic product data by design: the component is how
a Webflow page shows live catalog without Webflow Commerce.

### WordPress
A Custom HTML block (Gutenberg) or a text widget — paste both tags. No
plugin. Works identically in classic themes and block themes.

### Anything else
Astro, 11ty, Next, Nuxt, Svelte, Drupal, Salesforce Experience, plain HTML —
same two tags. If it renders HTML, it renders the catalog.

## The two rails Google ships

The Merchant API keeps both eras in one surface. `DataSource.FetchSettings`
is the batch era encoded as schema — `frequency`, `dayOfWeek`, `timeOfDay`,
`timeZone`, and a `fetchUri` with `username`/`password` fields for SFTP file
pulls. A cron schedule and a file credential, as API fields: it exists so
file-feed pipelines can keep running on a clock.

PIM Anywhere rides the other rail: `ProductInput`, pushed from the live
record at the moment the record changes. No schedule, no fetch window, no
credential stored in a schema — the projection is computed and pushed when
truth changes, and the observation ledger timestamps it. Scheduled fetch
answers "when should we read your file"; the push rail answers "the record
changed — here is the current state." The migration that matters is not
Content API to Merchant API; it is the fetch rail to the push rail.

## Data alignment — where each axis lands

The Merchant API organizes ingestion as **data-source families**. The
orthogonal record lands on them one-to-one — the alignment is structural,
not a mapping project:

| Record axis | Merchant API family | Status |
|---|---|---|
| The live record (system of record) | `PrimaryProductDataSource` → `ProductInput` | **Live** — the merchant feed ships from it today |
| Market × price (per-market variants, FX) | `RegionalInventoryDataSource` | Aligned — regional price/availability project from the same market rows |
| Physical location / stores | `LocalInventoryDataSource` | Aligned |
| Channel and campaign enrichment | `SupplementalProductDataSource` | Aligned — supplemental attributes ride the same record, per channel |
| Price reductions + the observation ledger | `PromotionDataSource` | Gate live — a reduction publishes only with a verified 30-day reference; the promotion source inherits the gate |
| Reviews and knowledge surfaces | `ProductReviewDataSource` | Later |

The consequence: adding a Merchant capability is choosing which axis to
project, not building a new pipeline. The gate — deterministic checks, then
verdicts — rides every one of these pushes, because they all pass through
the same mapping.

## Why this shape

Every platform migration and every new channel re-implements "show the
products, correctly priced." The PIM plane makes that a **solved, additive
tag** instead of a rebuild: adopt without migrating, remove without teardown.
The same record that renders the human card is the record Google's Merchant
API receives — syndication as *current state*, never retrospective export.
