/* ==========================================================================
   docs-nav.js — embeddable Docs nav item + tabbed docs modal + responsive
   mobile nav (hamburger) for the CRM Sync / design-sync storefront.

   Drop-in, self-contained, no dependencies. Paste ONE tag into the theme
   (Online Store → Themes → Edit code → theme.liquid, before </body>, or
   Settings → Custom Code):

     <script defer src="https://persephonepunch.github.io/crm-sync-setup/docs-nav.js"
             data-nav=".navlinks" data-cta=".cta"
             data-login-url="/account/login"></script>

   Config (all optional, read from the <script> tag's data-* attributes):
     data-nav        CSS selector for the inline nav-link list   (default ".navlinks")
     data-cta        CSS selector for the primary CTA button      (default ".cta")
     data-login-url  href for the Log in item                     (default "/account/login")
     data-docs-base  base URL the modal iframes load from
                     (default: the folder this script is served from)
     data-breakpoint px width at/below which the nav collapses     (default 720)

   Exposes window.crmDocsModal.open(fileOrIndex) / .close().
   ========================================================================== */
(function () {
  var S = document.currentScript || (function () {
    var s = document.getElementsByTagName('script'); return s[s.length - 1];
  })();
  var D = (S && S.dataset) || {};
  var BASE = (D.docsBase || (S && S.src || '').replace(/[^\/]*$/, '') || '/').replace(/\/?$/, '/');
  var NAV_SEL   = D.nav || '.navlinks';
  var CTA_SEL   = D.cta || '.cta';
  var LOGIN_URL = D.loginUrl || '/account/login';
  var BP        = parseInt(D.breakpoint || '720', 10);

  var TABS = [
    { label: 'Setup',       file: 'setup-guide.html' },
    { label: 'Migration',   file: 'migration-guide.html' },
    { label: 'Process',     file: 'process-management.html' },
    { label: 'GA4 Bidding', file: 'segments-ga4-bidding.html' },
    { label: 'Security',    file: 'security-posture.html' },
    { label: 'All docs',    file: 'index.html' }
  ];

  var ICON = {
    burger: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close:  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ---------- styles (scoped .crm-docs-*) ------------------------------------ */
  var css = '' +
  '.crm-docs-modal-open{overflow:hidden}' +
  /* modal */
  '.crm-docs-ov{position:fixed;inset:0;z-index:2147483000;display:none;background:rgba(10,10,10,.55);' +
  'backdrop-filter:saturate(1.4) blur(3px);padding:28px}' +
  '.crm-docs-ov.crm-docs-show{display:flex;align-items:center;justify-content:center}' +
  '.crm-docs-panel{background:#fff;color:#0a0a0a;width:min(1120px,96vw);height:min(90vh,900px);' +
  'display:flex;flex-direction:column;border:1.5px solid #0a0a0a;box-shadow:0 30px 80px rgba(0,0,0,.35)}' +
  '.crm-docs-bar{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1.5px solid #0a0a0a;' +
  'flex-wrap:wrap}' +
  '.crm-docs-eyebrow{font:600 11px/1 "Roboto Mono",ui-monospace,Menlo,monospace;letter-spacing:.22em;' +
  'text-transform:uppercase;color:#5c5c5c;margin-right:8px;padding-left:4px}' +
  '.crm-docs-tab{font:600 11px/1 "Roboto Mono",ui-monospace,Menlo,monospace;letter-spacing:.1em;' +
  'text-transform:uppercase;color:#5c5c5c;background:#fff;border:1px solid #cfcfcf;border-radius:2px;' +
  'padding:8px 11px;cursor:pointer;white-space:nowrap}' +
  '.crm-docs-tab:hover{color:#0a0a0a;border-color:#0a0a0a}' +
  '.crm-docs-tab.crm-docs-on{color:#fff;background:#0a0a0a;border-color:#0a0a0a}' +
  '.crm-docs-bar .crm-docs-sp{flex:1 1 auto}' +
  '.crm-docs-x{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;' +
  'border:1px solid #0a0a0a;background:#fff;color:#0a0a0a;cursor:pointer;border-radius:2px}' +
  '.crm-docs-x:hover{background:#0a0a0a;color:#fff}' +
  '.crm-docs-frame{flex:1 1 auto;width:100%;border:0;background:#fff}' +
  /* nav items injected inline */
  '.crm-docs-burger{display:none;align-items:center;justify-content:center;width:42px;height:38px;' +
  'border:1.5px solid #0a0a0a;background:#fff;color:#0a0a0a;cursor:pointer;border-radius:2px;margin-left:8px}' +
  '.crm-docs-burger:hover{background:#0a0a0a;color:#fff}' +
  /* mobile drawer */
  '.crm-docs-drawer{position:fixed;top:0;right:0;bottom:0;z-index:2147482000;width:min(320px,86vw);' +
  'background:#fff;color:#0a0a0a;border-left:1.5px solid #0a0a0a;transform:translateX(100%);' +
  'transition:transform .22s ease;display:flex;flex-direction:column;padding:18px 20px;gap:2px;' +
  'box-shadow:-20px 0 60px rgba(0,0,0,.18)}' +
  '.crm-docs-drawer.crm-docs-show{transform:none}' +
  '.crm-docs-drawer .crm-docs-dhead{display:flex;align-items:center;justify-content:space-between;' +
  'padding-bottom:14px;margin-bottom:10px;border-bottom:1.5px solid #0a0a0a}' +
  '.crm-docs-drawer .crm-docs-dh{font:600 11px/1 "Roboto Mono",ui-monospace,Menlo,monospace;letter-spacing:.22em;' +
  'text-transform:uppercase;color:#5c5c5c}' +
  '.crm-docs-drawer a,.crm-docs-drawer button.crm-docs-link{display:block;text-align:left;width:100%;' +
  'font:500 16px/1 "Roboto",-apple-system,system-ui,sans-serif;color:#0a0a0a;text-decoration:none;' +
  'background:none;border:0;border-bottom:1px solid #e6e6e6;padding:15px 2px;cursor:pointer}' +
  '.crm-docs-drawer a:hover,.crm-docs-drawer button.crm-docs-link:hover{color:#5c5c5c}' +
  '.crm-docs-drawer .crm-docs-dcta{margin-top:16px;border:0;background:#0a0a0a;color:#fff;text-align:center;' +
  'font:600 14px/1 "Roboto",sans-serif;padding:15px;border-radius:2px;text-decoration:none;display:block}' +
  '.crm-docs-drawer .crm-docs-dcta:hover{opacity:.85}' +
  '.crm-docs-scrim{position:fixed;inset:0;z-index:2147481000;background:rgba(10,10,10,.4);display:none}' +
  '.crm-docs-scrim.crm-docs-show{display:block}' +
  '@media (max-width:' + BP + 'px){' +
  '  ' + NAV_SEL + '{display:none!important}' +
  '  ' + CTA_SEL + '{display:none!important}' +
  '  .crm-docs-burger{display:inline-flex}' +
  '  .crm-docs-navitem-inline{display:none!important}' +
  '  .crm-docs-ov{padding:0}' +
  '  .crm-docs-panel{width:100vw;height:100vh;border:0}' +
  '}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- modal ----------------------------------------------------- */
  var ov, frame, tabsWrap, built = false;
  function buildModal() {
    if (built) return; built = true;
    ov = document.createElement('div'); ov.className = 'crm-docs-ov'; ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'CRM Sync documentation');
    var panel = document.createElement('div'); panel.className = 'crm-docs-panel';
    var bar = document.createElement('div'); bar.className = 'crm-docs-bar';
    bar.innerHTML = '<span class="crm-docs-eyebrow">Docs</span>';
    tabsWrap = document.createElement('span'); tabsWrap.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
    TABS.forEach(function (t, i) {
      var b = document.createElement('button'); b.className = 'crm-docs-tab'; b.textContent = t.label;
      b.addEventListener('click', function () { select(i); });
      tabsWrap.appendChild(b);
    });
    bar.appendChild(tabsWrap);
    var sp = document.createElement('span'); sp.className = 'crm-docs-sp'; bar.appendChild(sp);
    var x = document.createElement('button'); x.className = 'crm-docs-x'; x.setAttribute('aria-label', 'Close');
    x.innerHTML = ICON.close; x.addEventListener('click', close); bar.appendChild(x);
    frame = document.createElement('iframe'); frame.className = 'crm-docs-frame';
    frame.setAttribute('title', 'CRM Sync documentation');
    frame.setAttribute('loading', 'lazy');
    panel.appendChild(bar); panel.appendChild(frame); ov.appendChild(panel);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  function select(i) {
    var tabs = tabsWrap.querySelectorAll('.crm-docs-tab');
    tabs.forEach(function (t, k) { t.classList.toggle('crm-docs-on', k === i); });
    frame.src = BASE + TABS[i].file;
  }
  function open(which) {
    buildModal();
    var i = 0;
    if (typeof which === 'number') i = which;
    else if (typeof which === 'string') { var f = TABS.findIndex(function (t) { return t.file === which || t.label === which; }); if (f >= 0) i = f; }
    select(i);
    ov.classList.add('crm-docs-show'); document.documentElement.classList.add('crm-docs-modal-open');
  }
  function close() {
    if (ov) ov.classList.remove('crm-docs-show');
    document.documentElement.classList.remove('crm-docs-modal-open');
  }
  window.crmDocsModal = { open: open, close: close };

  /* ---------- nav wiring ------------------------------------------------ */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    var nav = document.querySelector(NAV_SEL);
    var cta = document.querySelector(CTA_SEL);
    var sibling = nav && nav.querySelector('a');           // steal theme classes for visual match
    var sibClass = sibling ? sibling.className : '';

    // 1. inline "Docs" link (desktop)
    if (nav) {
      var docs = document.createElement('a');
      docs.href = '#docs'; docs.textContent = 'Docs';
      docs.className = (sibClass + ' crm-docs-navitem-inline').trim();
      docs.addEventListener('click', function (e) { e.preventDefault(); open(0); });
      nav.appendChild(docs);

      // inline "Log in" link (desktop) — responsive login
      var login = document.createElement('a');
      login.href = LOGIN_URL; login.textContent = 'Log in';
      login.className = (sibClass + ' crm-docs-navitem-inline').trim();
      nav.appendChild(login);
    }

    // 2. hamburger (mobile) — placed after the CTA / at end of header row
    var host = (cta && cta.parentElement) || (nav && nav.parentElement) || document.querySelector('header');
    if (!host) return;
    var burger = document.createElement('button');
    burger.className = 'crm-docs-burger'; burger.setAttribute('aria-label', 'Menu');
    burger.setAttribute('aria-expanded', 'false'); burger.innerHTML = ICON.burger;
    host.appendChild(burger);

    // 3. drawer (mobile) — mirrors links + Docs + Log in + CTA
    var scrim = document.createElement('div'); scrim.className = 'crm-docs-scrim';
    var drawer = document.createElement('div'); drawer.className = 'crm-docs-drawer';
    var head = document.createElement('div'); head.className = 'crm-docs-dhead';
    head.innerHTML = '<span class="crm-docs-dh">Menu</span>';
    var dx = document.createElement('button'); dx.className = 'crm-docs-x'; dx.setAttribute('aria-label', 'Close menu');
    dx.innerHTML = ICON.close; head.appendChild(dx); drawer.appendChild(head);

    // clone the existing nav links
    if (nav) {
      nav.querySelectorAll('a').forEach(function (a) {
        if (a.classList.contains('crm-docs-navitem-inline')) return; // skip our injected inline ones
        var c = document.createElement('a'); c.href = a.getAttribute('href') || '#';
        c.textContent = a.textContent.trim(); c.addEventListener('click', closeDrawer);
        drawer.appendChild(c);
      });
    }
    // Docs (opens modal)
    var dDocs = document.createElement('button'); dDocs.className = 'crm-docs-link'; dDocs.textContent = 'Docs';
    dDocs.addEventListener('click', function () { closeDrawer(); open(0); }); drawer.appendChild(dDocs);
    // Log in
    var dLogin = document.createElement('a'); dLogin.href = LOGIN_URL; dLogin.textContent = 'Log in';
    dLogin.addEventListener('click', closeDrawer); drawer.appendChild(dLogin);
    // CTA (mirrored)
    if (cta) {
      var dCta = document.createElement('a'); dCta.className = 'crm-docs-dcta';
      dCta.href = cta.getAttribute('href') || '#'; dCta.textContent = cta.textContent.trim();
      drawer.appendChild(dCta);
    }
    document.body.appendChild(scrim); document.body.appendChild(drawer);

    function openDrawer() { drawer.classList.add('crm-docs-show'); scrim.classList.add('crm-docs-show');
      burger.setAttribute('aria-expanded', 'true'); }
    function closeDrawer() { drawer.classList.remove('crm-docs-show'); scrim.classList.remove('crm-docs-show');
      burger.setAttribute('aria-expanded', 'false'); }
    burger.addEventListener('click', openDrawer);
    dx.addEventListener('click', closeDrawer); scrim.addEventListener('click', closeDrawer);
  });
})();
