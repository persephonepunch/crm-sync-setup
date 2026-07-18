# File System Agnostic Publishing

**Status:** Living guide · **Scope:** One Webflow design, delivered as a custom WordPress theme or an EmDash/Astro site, with the storefront behavior riding along unchanged — Shopify Storefront Web Components for commerce, CRM Sync embeds for consent, identity, and the connected data plane.

---

## The premise: the design moves, the behavior layer doesn't have to

Webflow is the design source of truth. When a project outgrows Webflow hosting — a client standardized on WordPress, an editorial team that lives in a CMS, a performance budget that wants static output — the export conversation usually turns into a rebuild conversation. It doesn't have to.

The CRM Sync architecture deliberately keeps **all storefront behavior out of the page builder**:

- **Commerce UI** is [Shopify Storefront Web Components](https://shopify.dev/docs/api/storefront-web-components) — native custom elements served from Shopify's CDN. No React, no bundler, no framework runtime. They work in any HTML document.
- **Consent, identity, legal, and search** are CRM Sync worker embeds — plain `<script>` tags pointing at `crm-sync.dev`. Same property: any HTML document.

A Webflow export is vanilla HTML/CSS. Vanilla HTML plus two sets of platform-neutral script tags is a complete storefront. That means the WordPress (or Astro) migration is a **theme-packaging problem, not a rebuild** — and theme packaging is a solved problem with two mature tools.

## The Web Components block (production pattern)

This is the pattern running in production on the [OMEN build](https://omenphase1-1.webflow.io/) — a Webflow-designed page where product data, pricing, variants, and cart actions are handled entirely by Shopify's custom elements. It is the block you carry into every delivery target in this guide:

```html
<!-- 1 · The loader: one script, no build step -->
<script type="module" src="https://cdn.shopify.com/storefront/web-components.js"></script>

<!-- 2 · The store connection: everything inside inherits it -->
<shopify-store store-domain="your-store.myshopify.com"
               country="US" language="en">

  <!-- 3 · A product context: template renders when data arrives -->
  <shopify-context type="product" handle="hyperx-solocast-usb-microphone">
    <template>
      <h2><shopify-data query="product.title"></shopify-data></h2>
      <p><shopify-data query="product.vendor"></shopify-data></p>
      <div><shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money></div>
      <shopify-variant-selector></shopify-variant-selector>
      <button onclick="getElementById('main-cart').addLine(event).showModal()"
              shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale">
        Add to Cart
      </button>
      <button onclick="document.querySelector('shopify-store').buyNow(event)"
              shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale">
        Buy Now
      </button>
    </template>
    <div role="status">Loading…</div>
  </shopify-context>

  <shopify-cart id="main-cart"></shopify-cart>
</shopify-store>
```

Three properties make this portable:

1. **It's declarative HTML.** Any system that outputs HTML — a PHP template, an Astro component, a Webflow code embed — can carry it verbatim.
2. **It's self-hydrating.** The custom elements register themselves and fetch from the Storefront API; there is nothing for the host platform to initialize.
3. **The CRM Sync layer is the same shape.** The header/footer embeds, the consent banner, the Privacy & Permissions modal, and docs search are all `<script src="https://crm-sync.dev/…">` tags with data attributes. They neither know nor care what rendered the page around them.

## Getting the Webflow design into WordPress: Udesly vs Pinegrow

Two tools own this path, and they sit at deliberately different altitudes. [Udesly](https://www.udesly.com/) is Webflow-first: keep designing in Webflow, run its export conversion, get a WordPress theme with a largely no-code workflow. [Pinegrow](https://pinegrow.com/) is not a page builder — it turns HTML projects (including Webflow exports) into **native** WordPress themes, blocks, and plugins, with exported PHP and JavaScript that runs without Pinegrow or any runtime plugin.

| Tool | Best fit | Strengths | Tradeoffs |
| --- | --- | --- | --- |
| [Udesly](https://www.udesly.com/) | Keep designing in Webflow and convert quickly to WordPress. | Fastest path from Webflow export to WP theme; low-friction workflow; good when Webflow remains the design source of truth. | More opinionated conversion layer; less transparent/native than hand-shaped WP theme work. |
| [Pinegrow](https://pinegrow.com/) | Turn static HTML into a more native WordPress theme or blocks. | Exports native WordPress PHP/JS; self-contained output; flexible with frameworks and custom code; better fit for long-term maintainability. | Higher learning curve; more manual theme architecture work; less "one-click from Webflow" than Udesly. |

**Which one, for a CRM Sync project?** If Webflow stays the design source of truth and you expect to re-export on every design iteration, Udesly's loop is shorter. If WordPress becomes the long-term home and the theme will be maintained as code, Pinegrow's native output is the better foundation. Both carry the Web Components block and the CRM Sync embeds through conversion untouched — they are just markup and script tags.

## Wiring it in WordPress

Wherever the theme comes from, the wiring is the same three moves:

**1 · Enqueue the loaders** — in `functions.php`, so they ship on every page and survive theme updates:

```php
add_action('wp_enqueue_scripts', function () {
  // Shopify Storefront Web Components (module script)
  wp_enqueue_script_module('shopify-wc',
    'https://cdn.shopify.com/storefront/web-components.js', [], null);

  // CRM Sync behavior layer — header/footer, consent, privacy modal
  wp_enqueue_script('crm-sync-footer',
    'https://crm-sync.dev/embed/footer-loader.js', [], null, true);
});
```

**2 · Put the components in templates, not the editor.** WordPress content sanitization (KSES) can strip unknown elements and `shopify-attr--*` attributes from post content for non-admin authors. Custom elements belong in theme template parts (`header.php`, `single-product.php`, a block theme's HTML templates) — that's also where Udesly and Pinegrow put converted Webflow structures, so the defaults land correctly.

**3 · Connect the store.** `store-domain` on `<shopify-store>` plus the CRM Sync tenant configuration — keys, consent surfaces, and the checkout wiring are the same as every other CRM Sync install and are covered end-to-end in the [CRM Sync Setup Reference](https://www.crm-sync.dev/pages/knowledge-base#setup-guide).

## The EmDash / Astro path

[EmDash](https://github.com/emdash-cms/emdash) is a full-stack TypeScript CMS built on Astro — positioned, in [Cloudflare's own words](https://blog.cloudflare.com/emdash-wordpress/), as the spiritual successor to WordPress, with plugins running in sandboxed Worker isolates instead of in-process PHP. For teams that want the WordPress editorial model without the WordPress runtime, it is the same migration with a different landing zone.

The Web Components block needs exactly one adaptation in Astro: mark the loader `is:inline` so Astro ships it untouched instead of bundling it:

```astro
---
// src/layouts/Storefront.astro
---
<script is:inline type="module"
        src="https://cdn.shopify.com/storefront/web-components.js"></script>
<script is:inline defer
        src="https://crm-sync.dev/embed/footer-loader.js"></script>

<shopify-store store-domain="your-store.myshopify.com">
  <slot />  <!-- product contexts render inside pages -->
</shopify-store>
```

Astro's compiler passes unknown elements through as plain HTML — `<shopify-context>`, `<shopify-data>`, and friends need no client directives because they are not framework components; they hydrate themselves. Static output (`astro build`) works: the elements fetch live Storefront API data from the visitor's browser, so the pages stay static while the commerce stays current. EmDash adds the editorial layer (content collections, admin, auth) on top without touching any of it.

## The decentralized path — pinning the export to IPFS with Pinata

The furthest extension of the same argument: if the export is vanilla HTML and the behavior layer is client-side, the "server" can be a content-addressed network instead of a server at all. [Pinata](https://pinata.cloud/) pins the Webflow export to IPFS and serves it through a [dedicated gateway](https://docs.pinata.cloud/gateways/dedicated-ipfs-gateways) with a [custom domain](https://knowledge.pinata.cloud/en/articles/5455526-set-up-a-custom-domain-for-your-gateway) — restricted gateways serve only the CIDs pinned to your account, so the domain serves your site and nothing else. (If you've seen this called a "DAT endpoint": Dat/Hypercore is a sibling peer-to-peer protocol — Pinata is IPFS, and this guide's pattern applies to any content-addressed host.)

Why the stack survives the move intact:

- **Commerce is browser-side.** `<shopify-store>` and friends fetch the Storefront API from the visitor's browser — there is no origin server involved, so an immutable, content-addressed page serves live prices, variants, and cart exactly as a WordPress page would.
- **The CRM Sync layer is CORS-open.** The embeds and worker endpoints answer any origin; sessions are origin-bound as usual, so register the gateway's custom domain as the tenant's callback origin (same per-tenant OAuth configuration as any other domain move).
- **Forms already bypass the host.** Webflow-native form handling never survives an export anywhere — on CRM Sync builds, forms post to the worker's form socket, which works identically from an IPFS gateway.
- **Publishing is versioning.** Every re-pin produces a new CID: content-addressed hosting gives you immutable, cryptographically-named releases of the storefront for free — point the gateway (or DNSLink) at the new CID to release, at the old one to roll back.

The one discipline it demands: keep internal links relative in the export and lean on Webflow's CDN-absolute asset URLs (which the export already does), so the site renders identically whether the root is a domain or a CID.

### DAT/Hypercore vs IPFS — the two decentralized models

The two protocol families answer the same question — "how do peers share data without a server?" — from opposite directions. **IPFS addresses content**: every file hashes to a CID, the address *is* the hash, and a given CID is immutable forever. **Dat/Hypercore addresses authors**: the address is a public key, and it points to a signed append-only log that the keyholder keeps writing to — the address stays stable while the content updates underneath it. (Naming note: Dat was the folder-syncing product of the mid-2010s; [Hypercore](https://hypercore-protocol.org/) is the log primitive that was always inside it, renamed to top billing in 2020 and carried forward today by [Holepunch](https://holepunch.to/).)

| | IPFS | Dat/Hypercore |
| --- | --- | --- |
| Address | Hash of content (CID) | Public key of the writer |
| Updates | New CID per change; repoint the gateway or DNSLink | Same address, append to the log |
| History | Snapshots you choose to keep pinned | Built into the append-only log |
| Discovery | Global public DHT — anyone with the CID can fetch | Key required to find or replicate a feed |
| Commercial hosting | Mature ([Pinata](https://pinata.cloud/), web3.storage, Filecoin) | Essentially none |

For a storefront, IPFS's model is the better fit twice over. The pin-it-for-me industry only exists on the IPFS side — there is no Pinata-of-Hypercore, so a "DAT endpoint" resolves to IPFS in practice. And immutable CIDs are a release-engineering feature, not a limitation: every publish is a cryptographically named artifact, promotion is pointing the gateway at the new CID, and rollback is pointing it back. Hypercore's stable-address, live-updating feed is the right shape for chat and collaborative data (which is exactly where Holepunch took it) — but a storefront wants named releases, and that is what content addressing gives you for free.

## The publishing-cost ledger — Firebase vs the PWA rails

The same portability argument has a price tag. The conventional way to ship an app around a Shopify store is a Firebase-backed build distributed through the app stores; the CRM Sync model is a PWA served from the edge. Two very different meters:

| Cost driver | Firebase (Blaze) | PWA on Cloudflare + Xano |
| --- | --- | --- |
| Hosting / egress | 10GB/mo free, then [$0.15/GB transferred](https://firebase.google.com/docs/hosting/usage-quotas-pricing) | Workers ~$5/mo flat, 10M requests included, zero egress fees |
| Auth | Free to 50K MAU, then ~$0.0055/MAU | PKCE + JWT at the worker — no per-MAU meter |
| Data operations | Firestore ~$0.60/M reads, ~$1.80/M writes | Xano flat plan, unlimited API requests |
| Push | FCM free | Web Push (VAPID) from the worker — free |
| Shipping an update | Deploy free; every client re-downloads on the egress meter | Service-worker version bump on deploy; no review gate |

At hobby scale Firebase is effectively free — its allowances cover a small app entirely. The difference is the shape, not the starting price: every Firebase meter (egress, operations, MAU) is wired to user growth, the exact variable a successful app maximizes. The edge stack's marginal cost per additional install is approximately zero until the request cap, and the bill is a constant either way.

**Distribution is where the real money moves.** A store-distributed app pays the platform 15–30% of every sale — on a $90 one-time purchase, that is $13.50–$27 per copy, plus the developer-program fees and a review cycle on every update. The browser-installed PWA pays card processing (~3%) and nothing else, and the same build feeds native wrappers when a store presence is a choice rather than a requirement. At even 100 sales a month, the avoided store cut is one to two orders of magnitude larger than the entire infrastructure delta — the publishing-cost argument is a distribution argument wearing an infrastructure costume.

## The migration in one sentence

Export the Webflow design; convert it with [Udesly](https://www.udesly.com/) (fast loop, Webflow stays canonical) or [Pinegrow](https://pinegrow.com/) (native theme, WordPress becomes canonical) — or re-home it in [EmDash](https://github.com/emdash-cms/emdash) on Astro; carry the Shopify Web Components block and the CRM Sync script tags across verbatim; connect keys per the [Setup Reference](https://www.crm-sync.dev/pages/knowledge-base#setup-guide). Or skip servers entirely and [pin the export to IPFS with Pinata](https://pinata.cloud/). The design moved. The behavior layer never noticed.

---

*Machine-readable appendix: the HTML render of this document ships duplicated in-depth HowTo schema — one `HowTo` for the WordPress delivery, one for the EmDash/Astro delivery — so answer engines can cite either path independently.*
