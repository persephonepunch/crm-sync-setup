/*! safe-svg — inline SVG for Webflow/UIkit without inheriting the upload's privileges.
 *
 * WHY THIS EXISTS. An <img src="x.svg"> is rendered in the browser's image sandbox: script does
 * not run, external references are blocked, the DOM is unreachable. Injecting the same file
 * inline — which is what UIkit's uk-svg does, "including all attributes" — promotes it to a node
 * in YOUR document, where <script> executes and on* handlers fire. Inlining buys stylability by
 * spending the sandbox.
 *
 * That trade is correct for a logo in your own repository and unsafe for anything an uploader
 * supplied. This component makes it safe for both by sanitising before injection: the markup is
 * parsed, walked, and rebuilt from an ALLOW-LIST. Anything not named is dropped, so a construct
 * invented after this was written is removed by default rather than permitted by omission.
 *
 * USAGE — either form, both hydrate asynchronously on viewport approach.
 *   <safe-svg src="/assets/mark.svg" label="CRM Sync"></safe-svg>
 *   <div data-safe-svg="/assets/mark.svg" data-label="CRM Sync"></div>   <- Webflow-friendly
 *
 * ANIMATION — three patterns, and only one of them is a sanitiser question.
 *   1. The asset animates itself (SMIL, or JS embedded in the SVG as in Chris Gannon's
 *      self-contained GSAP demos). The file carries its own program and needs full DOM
 *      privilege to run it. That cannot be sanitised, because the script IS the feature. Such a
 *      file is SOURCE CODE, not media: version it, review it, ship it from your repository, and
 *      never accept one through an upload form.
 *   2. Your code animates a sanitised asset — GSAP targeting nodes from outside. The asset
 *      carries no program at all. This is the safe pattern, and `id`, `class` and `data-*`
 *      survive sanitising so your selectors still work. Listen for `safe-svg:ready`, because
 *      async injection races anything that assumed the nodes were already there.
 *   3. Lottie is not this problem. Its input is JSON, which lottie-web interprets into DOM it
 *      generates. An SVG sanitiser never sees it, so an untrusted Lottie file needs its own
 *      treatment — trusted source, or validation of the JSON before the library reads it.
 *
 * Colour: paths inherit currentColor, so the mark is ink on ground and follows the text colour.
 * Add class="preserve" to keep the file's own fill and stroke.
 */
(() => {
  "use strict";

  // Structure and paint only. No scripting, no embedding, no animation — SMIL `animate`/`set`
  // can rewrite an attribute after sanitisation, including href, so the elements go too.
  const ELEMENTS = new Set([
    "svg", "g", "defs", "symbol", "use", "title", "desc",
    "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
    "text", "tspan", "textPath",
    "linearGradient", "radialGradient", "stop",
    "clipPath", "mask", "pattern", "marker", "filter",
    "feGaussianBlur", "feOffset", "feBlend", "feColorMatrix", "feMerge", "feMergeNode",
  ]);

  const ATTRS = new Set([
    "d", "points", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry",
    "width", "height", "viewBox", "preserveAspectRatio", "transform", "transform-origin",
    "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap",
    "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity", "stroke-miterlimit",
    "opacity", "color", "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform",
    "spreadMethod", "clip-path", "clip-rule", "mask", "filter", "patternUnits", "markerWidth",
    "markerHeight", "refX", "refY", "orient", "in", "in2", "result", "stdDeviation", "dx", "dy",
    "values", "mode", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline",
    "letter-spacing", "id", "class", "role", "aria-hidden", "aria-label", "xmlns",
  ]);

  // `style` is not on the allow-list at all: it can carry url() into an external fetch, and the
  // brand rule is that paint comes from CSS on the page, not from the asset.
  const URL_ATTRS = new Set(["href", "xlink:href"]);

  const cache = new Map();

  /** Rebuild `node` into `out` keeping only what is named. Returns nothing; mutates `out`. */
  function copyInto(node, out, doc) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) { out.appendChild(doc.createTextNode(child.nodeValue)); continue; }
      if (child.nodeType !== 1) continue;                       // comments, CDATA, PIs: dropped
      const name = child.localName;
      if (!ELEMENTS.has(name)) continue;                        // script, foreignObject, animate…
      const el = doc.createElementNS("http://www.w3.org/2000/svg", name);
      for (const a of Array.from(child.attributes)) {
        const an = a.name.toLowerCase();
        if (an.startsWith("on")) continue;                      // every event handler
        if (URL_ATTRS.has(an)) {
          // A same-document fragment only. No http(s), no data:, no javascript:, no protocol-relative.
          if (/^#[A-Za-z][\w.:-]*$/.test(a.value)) el.setAttribute(an, a.value);
          continue;
        }
        // data-* is allowed so animation code can target nodes. It cannot execute; it is inert
        // until something on the page reads it, and that something is your own script.
        if (!ATTRS.has(a.name) && !/^data-[\w-]+$/.test(an)) continue;  // case-sensitive: viewBox, not viewbox
        if (/url\s*\(|expression\s*\(|javascript:/i.test(a.value)) continue;
        el.setAttribute(a.name, a.value);
      }
      out.appendChild(el);
      copyInto(child, el, doc);
    }
  }

  /** Parsed, walked, rebuilt. Returns an <svg> element or null. */
  function sanitize(text) {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    if (doc.querySelector("parsererror")) return null;
    const src = doc.documentElement;
    if (!src || src.localName !== "svg") return null;
    const out = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const a of Array.from(src.attributes)) {
      if (a.name.toLowerCase().startsWith("on")) continue;
      if (ATTRS.has(a.name)) out.setAttribute(a.name, a.value);
    }
    if (!out.getAttribute("viewBox")) {
      const w = src.getAttribute("width"), h = src.getAttribute("height");
      if (w && h) out.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
    }
    copyInto(src, out, document);
    return out;
  }

  async function load(url) {
    if (!cache.has(url)) {
      cache.set(url, fetch(url, { credentials: "omit", mode: "cors" })
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
        .then((t) => sanitize(t)?.outerHTML ?? null)
        .catch(() => null));
    }
    return cache.get(url);
  }

  async function hydrate(host, url, label) {
    const html = await load(url);
    if (!html) { host.setAttribute("data-safe-svg-state", "failed"); return; }
    host.innerHTML = html;
    const svg = host.firstElementChild;
    if (!svg) return;
    svg.setAttribute("focusable", "false");
    if (label) { svg.setAttribute("role", "img"); svg.setAttribute("aria-label", label); }
    else svg.setAttribute("aria-hidden", "true");
    host.setAttribute("data-safe-svg-state", "ready");
    // Async injection races any animation code. Hook this instead of DOMContentLoaded:
    //   document.addEventListener("safe-svg:ready", e => gsap.to(e.detail.svg.querySelectorAll("path"), {...}))
    host.dispatchEvent(new CustomEvent("safe-svg:ready", { bubbles: true, detail: { host, svg, src: url } }));
  }

  // Async by default: nothing is fetched until the element is near the viewport.
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, obs) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          obs.unobserve(e.target);
          const t = e.target;
          hydrate(t, t.getAttribute("src") || t.dataset.safeSvg, t.getAttribute("label") || t.dataset.label);
        }
      }, { rootMargin: "200px" })
    : null;

  function watch(el) {
    if (el.__safeSvg) return;
    el.__safeSvg = true;
    el.setAttribute("data-safe-svg-state", "pending");
    const eager = el.hasAttribute("eager") || el.dataset.eager !== undefined;
    if (eager || !io) hydrate(el, el.getAttribute("src") || el.dataset.safeSvg, el.getAttribute("label") || el.dataset.label);
    else io.observe(el);
  }

  class SafeSvg extends HTMLElement { connectedCallback() { watch(this); } }
  if (!customElements.get("safe-svg")) customElements.define("safe-svg", SafeSvg);

  const scan = (root = document) => root.querySelectorAll("[data-safe-svg]").forEach(watch);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => scan());
  else scan();
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) {
      if (n.hasAttribute?.("data-safe-svg")) watch(n);
      n.querySelectorAll?.("[data-safe-svg]").forEach(watch);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.SafeSVG = { sanitize, load, scan };
})();
