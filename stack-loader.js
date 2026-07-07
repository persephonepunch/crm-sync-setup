/* ==========================================================================
   stack-loader.js — the Higher-Order Stack loader (Layer 1 · Behavior).
   ONE shared higher-order function that every surface uses — Brand Designer,
   CRM, PIM, Design Sync, and this storefront nav — so the behavior stack is
   DRY: one canonical source, loaded per-need.

     Tier A (always-on, fail-closed):  GA4 under Consent Mode v2 + the
       consent-gated dataLayer / event bus (measurement + consent + agent
       mandates all ride one auditable bus).
     Tier B (per-need, lazy):  GSAP · UIkit JS · petite-vue · GraphQL.

   Look (UIkit CSS / brand theme.css) is Layer 2 — loaded separately in <head>,
   NOT here. This file never carries brand CSS.

   Usage (in <head>, the "helmet"):
     <script src="…/stack-loader.js"
             data-ga4="G-XXXXXXXXXX"
             data-use="uikit"></script>          <!-- nav needs UIkit JS -->
     <!-- Brand Designer declares more: data-use="uikit,petite-vue,gsap" -->

   API (window.CRMStack):
     CRMStack.use('uikit'|'gsap'|'petite-vue'|'graphql') -> Promise<global>
     CRMStack.consent.grant({...}) / .deny()   Consent Mode v2 signals
     CRMStack.bus.emit(name, data) / .on(name, fn)   consent-aware event bus
     CRMStack.gtag(...)                         raw gtag
   ========================================================================== */
(function () {
  if (window.CRMStack) return;
  var S = document.currentScript || (function () { var s = document.scripts; return s[s.length - 1]; })();
  var D = (S && S.dataset) || {};

  /* ---- Tier B registry (one canonical SOURCE each) --------------------- */
  var REG = {
    gsap:   { globals: ['gsap'],        src: ['https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'] },
    uikit:  { globals: ['UIkit'],       src: ['https://cdn.jsdelivr.net/npm/uikit@3.21.6/dist/js/uikit.min.js',
                                              'https://cdn.jsdelivr.net/npm/uikit@3.21.6/dist/js/uikit-icons.min.js'] },
    'petite-vue': { globals: ['PetiteVue'], src: ['https://unpkg.com/petite-vue@0.4.1/dist/petite-vue.iife.js'] }
  };

  var cache = {};
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var existing = [].slice.call(document.scripts).some(function (x) { return x.src === src; });
      if (existing) return res();
      var el = document.createElement('script');
      el.src = src; el.async = true; el.crossOrigin = 'anonymous';
      el.onload = res; el.onerror = function () { rej(new Error('load ' + src)); };
      document.head.appendChild(el);
    });
  }
  function pick(names) { for (var i = 0; i < names.length; i++) if (window[names[i]]) return window[names[i]]; }

  function use(name) {
    if (name === 'graphql') return Promise.resolve(graphql);        // no external dep
    var spec = REG[name];
    if (!spec) return Promise.reject(new Error('unknown module: ' + name));
    if (cache[name]) return cache[name];
    cache[name] = spec.src.reduce(function (p, s) { return p.then(function () { return loadScript(s); }); }, Promise.resolve())
      .then(function () { return pick(spec.globals); });
    return cache[name];
  }

  /* ---- Tier B · GraphQL (thin fetch, no Apollo) ------------------------ */
  function graphql(endpoint, query, variables, headers) {
    return fetch(endpoint, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
      body: JSON.stringify({ query: query, variables: variables || {} })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.errors) throw j.errors; return j.data;
    });
  }

  /* ---- Tier A · GA4 Consent Mode v2 + consent-gated bus ---------------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  var SIGNALS = ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization'];
  function deniedAll() { var o = {}; SIGNALS.forEach(function (k) { o[k] = 'denied'; }); return o; }

  // fail-closed: everything denied until explicit consent (synchronous, before GA4 loads)
  gtag('consent', 'default', Object.assign(deniedAll(), { wait_for_update: 500 }));
  gtag('js', new Date());

  // GA4 measurement ID is pulled from the Config app (per-shop KV), not hardcoded.
  // Only the PUBLIC measurement ID (G-XXXX) reaches the client; the Measurement
  // Protocol API secret stays server-side in the worker and is rotated via the
  // Interactive Key Ceremony — it is never shipped to the browser.
  function initGA4(id) {
    if (!id) return;
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id));
    gtag('config', id, { send_page_view: true });
    window.CRMStack && (window.CRMStack.ga4 = id);
  }
  function readGA4(c) {
    c = c || {};
    return c.ga4_measurement_id || c.GA4_MEASUREMENT_ID || c.ga4 ||
      (c.google && (c.google.ga4_measurement_id || c.google.measurement_id)) ||
      (c.config && (c.config.GA4_MEASUREMENT_ID || c.config.ga4_measurement_id)) || '';
  }
  var CONFIG_URL = D.config || '';   // e.g. https://<worker>/config?shop=<shop>.myshopify.com
  if (D.ga4) {                        // explicit override wins
    initGA4(D.ga4);
  } else if (CONFIG_URL) {
    fetch(CONFIG_URL, { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (c) { initGA4(readGA4(c)); })
      .catch(function () {});
  }

  var subs = {};
  var bus = {
    emit: function (name, data) {
      var payload = Object.assign({ event: name }, data || {});
      window.dataLayer.push(payload);                 // measurement + consent + AP2/A2A ride this
      (subs[name] || []).forEach(function (fn) { try { fn(data); } catch (e) {} });
      return payload;
    },
    on: function (name, fn) { (subs[name] = subs[name] || []).push(fn); return function () {
      subs[name] = (subs[name] || []).filter(function (f) { return f !== fn; }); }; }
  };
  var consent = {
    grant: function (partial) {
      var o = {}; SIGNALS.forEach(function (k) { o[k] = 'granted'; });
      gtag('consent', 'update', Object.assign(o, partial || {}));
      bus.emit('consent_update', { state: 'granted' });
    },
    deny: function () { gtag('consent', 'update', deniedAll()); bus.emit('consent_update', { state: 'denied' }); }
  };

  /* ---- expose the higher-order function -------------------------------- */
  window.CRMStack = { use: use, gtag: gtag, bus: bus, consent: consent, graphql: graphql, ga4: '', _reg: REG };

  /* ---- auto-preload the per-need modules declared via data-use --------- */
  (D.use || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (m) {
    use(m).catch(function (e) { (window.console || {}).warn && console.warn('[CRMStack]', e.message); });
  });
})();
