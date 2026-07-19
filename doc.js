/* ==========================================================================
   doc.js — renders a source .md into the CRM Sync reference-doc shell.
   Config comes from <body> data-attributes:
     data-md      : path to the source markdown (required)
     data-kicker  : mono eyebrow above the headline
     data-sub     : curated lede (HTML allowed via **bold**); falls back to meta
     data-source  : GitHub "view source" URL
     data-pdf     : path to the generated PDF for the download button
   The first H1 in the markdown becomes the 100-weight hero headline.
   Bold **spans** inside that H1 render heavy — thin headline, bold emphasis.
   ========================================================================== */
(function () {
  var body = document.body;
  var cfg = {
    md: body.dataset.md,
    kicker: body.dataset.kicker || 'Reference',
    sub: body.dataset.sub || '',
    source: body.dataset.source || '',
    pdf: body.dataset.pdf || '',
    title: body.dataset.title || ''
  };

  var ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    md: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M7 15V9l3 3 3-3v6M17 9v6"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>',
    git: '<svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 20 4.8 4.9 4.9 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A4.9 4.9 0 0 0 5 4.8a5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 0 0-.9 2.5V22"/></svg>'
  };

  // ---- markdown text normalisation (no emojis) ---------------------------
  function clean(md) {
    return md
      .replace(/✅/g, '✓')      // ✅ -> ✓
      .replace(/❌/g, '✗')      // ❌ -> ✕
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2B00}-\u{2BFF}]️?/gu, '') // strip pictographs
      .replace(/️/g, '');
  }

  // ---- pull the h1 + **Key:** meta lines off the top ---------------------
  function parseHead(md) {
    var lines = md.split('\n');
    var title = '', meta = [], i = 0;
    for (; i < lines.length; i++) {
      var m = lines[i].match(/^#\s+(.*)$/);
      if (m) { title = m[1].trim(); i++; break; }
    }
    for (; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line === '' ) continue;
      if (line === '---') { i++; break; }
      var mm = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
      if (mm) { meta.push({ k: mm[1].trim(), v: mm[2].trim() }); continue; }
      break; // real body content begins
    }
    return { title: title, meta: meta, body: lines.slice(i).join('\n') };
  }

  function inline(s) { // minimal **bold** for meta values / lede
    return s.replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  // ---- build the sticky download / nav bar -------------------------------
  function bar() {
    var b = document.createElement('nav'); b.className = 'docbar';
    var parts = ['<div class="inner">',
      '<a href="./">' + ICON.back + 'Docs index</a>',
      '<span class="spacer"></span>'];
    if (cfg.pdf)    parts.push('<a class="dl" href="' + cfg.pdf + '" download>' + ICON.pdf + 'PDF</a>');
    if (cfg.md)     parts.push('<a class="dl" href="' + cfg.md + '" download>' + ICON.md + 'Markdown</a>');
    // GitHub sends X-Frame-Options: deny — when this page is shown inside the
    // store/site modal iframe the Source link must escape the frame.
    if (cfg.source) parts.push('<a href="' + cfg.source + '" target="_blank" rel="noopener">' + ICON.git + 'Source</a>');
    parts.push('</div>');
    b.innerHTML = parts.join('');
    document.body.insertBefore(b, document.body.firstChild);
  }

  function render(md) {
    var head = parseHead(clean(md));
    document.title = cfg.title || head.title || document.title;

    // hero
    var meta = head.meta
      .filter(function (m) { return !/^see also$/i.test(m.k); })
      .map(function (m) { return '<span>' + m.k + ': <b>' + inline(m.v) + '</b></span>'; })
      .join('');
    var sub = cfg.sub
      ? inline(cfg.sub)
      : (head.meta[0] ? inline(head.meta[0].v) : '');
    document.getElementById('hero').innerHTML =
      '<div class="kicker">' + cfg.kicker + '</div>' +
      '<h1>' + inline(head.title) + '</h1>' +
      (sub ? '<p class="sub">' + sub + '</p>' : '') +
      (meta ? '<div class="meta">' + meta + '</div>' : '');

    // body
    marked.setOptions({ gfm: true, breaks: false });
    var art = document.getElementById('doc');
    art.innerHTML = marked.parse(head.body);
    art.querySelectorAll('table').forEach(function (t) {
      var w = document.createElement('div'); w.style.overflowX = 'auto';
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    // Docs render inside the store's KB modal iframe. THIRD-PARTY links (eur-lex,
    // digital-strategy, vendor advisories) open a NEW WINDOW — navigating the frame
    // to a framing-refusing host blanks the modal, and _top would eject the visitor
    // from the store. Site-family links (crm-sync.dev deep links, sibling docs) keep
    // the whole-page _top swap so KB deep links work without a recursive modal-in-
    // modal. Covers the HERO too — the Tags meta row previously escaped rewriting,
    // and its in-frame EU-site navigation was the field-reported blank.
    var FAMILY = /^https?:\/\/((www\.)?crm-sync\.dev|persephonepunch\.github\.io)\//i;
    [document.getElementById('hero'), art].forEach(function (root) {
      root.querySelectorAll('a[href^="http"]').forEach(function (a) {
        a.target = FAMILY.test(a.href) ? '_top' : '_blank';
        if (!a.rel) a.rel = 'noopener';
      });
    });
  }

  bar();
  fetch(cfg.md, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    // YAML front matter is machine metadata (AI/Jekyll readers) — human render skips it.
    .then(function (t) { return t.replace(/^---[ \t]*\n[\s\S]*?\n---[ \t]*\n/, ''); })
    .then(render)
    .catch(function (e) {
      document.getElementById('hero').innerHTML =
        '<div class="kicker">' + cfg.kicker + '</div><h1>Could not load</h1>';
      document.getElementById('doc').innerHTML =
        '<p class="doc-status">Load error (' + e.message + '). Read the ' +
        '<a href="' + cfg.md + '">raw markdown</a>' +
        (cfg.source ? ' or <a href="' + cfg.source + '" target="_blank" rel="noopener">source on GitHub</a>' : '') + '.</p>';
    });
})();
