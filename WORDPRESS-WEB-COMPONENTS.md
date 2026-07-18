# CRM Sync on a Custom WordPress Theme — Shopify Web Components from Your Webflow Design

**Status:** Living guide · **Scope:** One Webflow design, delivered as a custom WordPress theme or an EmDash/Astro site, with the storefront behavior riding along unchanged — Shopify Storefront Web Components for commerce, CRM Sync embeds for consent, identity, and the connected data plane.

---

## The premise: the design moves, the behavior layer doesn't have to

Webflow is the design source of truth. When a project outgrows Webflow hosting — a client standardized on WordPress, an editorial team that lives in a CMS, a performance budget that wants static output — the export conversation usually turns into a rebuild conversation. It doesn't have to.

The CRM Sync architecture deliberately keeps **all storefront behavior out of the page builder**:

- **Commerce UI** is [Shopify Storefront Web Components](https://shopify.dev/docs/api/storefront-web-components) — native custom elements served from Shopify's CDN. No React, no bundler, no framework runtime. They work in any HTML document.
- **Consent, identity, legal, and search** are CRM Sync worker embeds — plain `<script>` tags pointing at `crm-sync.dev`. Same property: any HTML document.

A Webflow export is vanilla HTML/CSS. Vanilla HTML plus two sets of platform-neutral script tags is a complete storefront. That means the WordPress (or Astro) migration is a **theme-packaging problem, not a rebuild** — and theme packaging is a solved problem with two mature tools.

## The Web Components block (production pattern)

This is the pattern running in production on the OMEN build — a Webflow-designed page where product data, pricing, variants, and cart actions are handled entirely by Shopify's custom elements. It is the block you carry into every delivery target in this guide:

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

## The migration in one sentence

Export the Webflow design; convert it with [Udesly](https://www.udesly.com/) (fast loop, Webflow stays canonical) or [Pinegrow](https://pinegrow.com/) (native theme, WordPress becomes canonical) — or re-home it in [EmDash](https://github.com/emdash-cms/emdash) on Astro; carry the Shopify Web Components block and the CRM Sync script tags across verbatim; connect keys per the [Setup Reference](https://www.crm-sync.dev/pages/knowledge-base#setup-guide). The design moved. The behavior layer never noticed.

---

*Machine-readable appendix: the HTML render of this document ships duplicated in-depth HowTo schema — one `HowTo` for the WordPress delivery, one for the EmDash/Astro delivery — so answer engines can cite either path independently.*
