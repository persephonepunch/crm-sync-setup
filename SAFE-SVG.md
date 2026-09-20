---
title: "Safe SVG for Webflow and UIkit"
description: "Inline SVG without inheriting the upload's privileges — an allow-list sanitiser, async hydration, monochrome paint, and where GSAP and Lottie actually sit."
canonical: https://persephonepunch.github.io/crm-sync-setup/safe-svg.html
category: "Webflow"
date: 2026-09-20
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SAFE-SVG.md
licence: CC-BY-4.0
tags:
  - webflow
  - security
  - performance
---

# Safe SVG for Webflow and UIkit

**For front-end developers using UIkit or Webflow who need styleable, animatable SVG.**

> `<img src="x.svg">` renders in the browser's image sandbox — no script, no external
> references, no DOM. Injecting the same file inline promotes it to a node in your document,
> where `<script>` runs and `on*` handlers fire. **Inlining buys stylability by spending the
> sandbox.** This component buys it back.

UIkit's `uk-svg` injects the file "including all attributes." That is correct for a logo in your
own repository and unsafe for anything an uploader supplied. `safe-svg.js` parses, walks and
**rebuilds the markup from an allow-list** before injection, so a construct invented after it was
written is dropped by default rather than permitted by omission.

## Use it

```html
<link rel="stylesheet" href="https://persephonepunch.github.io/crm-sync-setup/safe-svg.css">
<script src="https://persephonepunch.github.io/crm-sync-setup/safe-svg.js" defer></script>
```

Then either form. The second takes a **custom attribute in Webflow's settings panel**, so it
needs no embed block:

```html
<safe-svg src="/assets/mark.svg" label="CRM Sync"></safe-svg>
<div data-safe-svg="/assets/mark.svg" data-label="CRM Sync"></div>
```

Nothing is fetched until the element is within 200px of the viewport. Add `eager` for
above-the-fold marks. Omit the label and the mark is `aria-hidden`; supply one and it becomes
`role="img"`.

## What survives, and what does not

| Kept | Dropped |
|---|---|
| Structure and paint: `path`, `g`, `circle`, `rect`, gradients, `clipPath`, `mask`, filters | `script`, `foreignObject`, `image`, `a`, `iframe` |
| `id`, `class` and `data-*`, so animation selectors still work | Every `on*` handler |
| `href` pointing at a **same-document fragment** (`#id`) | `href` or `xlink:href` to any URL, including `data:` and `javascript:` |
| Geometry, transforms, `viewBox` | `style`, and any attribute containing `url(`, `expression(` or `javascript:` |
| | **SMIL** — `animate`, `set`, `animateTransform`, which can rewrite an attribute after sanitising |

Verified against twelve vectors: embedded `script`, `onload` on the root, `onclick` on a path,
`foreignObject` carrying HTML, external and `xlink:` `use` references, SMIL rewriting `href`,
`set` writing `onload`, `javascript:` anchors, `data:` images, `style` and `fill` with external
`url()`. All stripped; benign markup intact.

**A known cost:** because `<a>` is dropped, its children go with it. A linked SVG loses the
linked content. That is fail-safe rather than fail-open, and putting the link on a wrapping HTML
element instead is the fix.

## Animation — three patterns, one question

The question is **who supplies the program**: the asset, your code, or a description a library
interprets.

**1. The asset animates itself.** SMIL, or JavaScript embedded in the SVG — the technique in
Chris Gannon's self-contained GSAP demos, where CSS, fonts and script live inside one file. It
works, it is genuinely elegant, and it needs full DOM privilege to run. **It cannot be
sanitised, because the script is the feature.** Such a file is source code wearing a media
extension: version it, review it, ship it from your repository. Never accept one through an
upload form, and never point this component at one expecting the animation to survive.

**2. Your code animates a sanitised asset.** GSAP targeting nodes from outside. The asset
carries no program; your trusted script does the work. This is the pattern to build on, and
`id`, `class` and `data-*` survive sanitising so your selectors still resolve.

Async injection races anything that assumed the nodes existed, so hook the event rather than
`DOMContentLoaded`:

```js
document.addEventListener("safe-svg:ready", (e) => {
  gsap.to(e.detail.svg.querySelectorAll("[data-spin]"), { rotation: 360, repeat: -1, duration: 8 });
});
```

**3. Lottie is a different problem.** Its input is JSON, not SVG — `lottie-web` interprets the
description and generates the DOM itself. An SVG sanitiser never sees it. An untrusted Lottie
file therefore needs its own treatment: a trusted source, or validation of the JSON before the
library reads it. Loading the library asynchronously changes when it runs, not what it is
permitted to do.

## Monochrome by default

`safe-svg.css` sets paint from the page, never from the asset: injected paths inherit
`currentColor`, so a mark is ink on ground and follows the surrounding text colour. Put
`.on-ink` on a dark block and the mark inverts with it. `class="preserve"` opts an asset out and
keeps its own fill and stroke.

The box is reserved before hydration so async injection does not shift layout, and a failed
fetch hides the element rather than leaving a gap.

## Where this sits

Sanitising is a **client-side convenience on top of a server-side decision, not a substitute for
one**. The serve path still decides what may render inline at all — SVG is deliberately absent
from the media render allow-list, so an uploaded SVG is returned as a download whatever the front
end would like to do with it.

Decide it where it can be enforced. A client can only spend the safety a server provided; it can
never create any.
