// The book's behaviour: sidebar toggle, theme picker, search, keyboard paging, and the
// "On this page" highlight. No dependencies; storage is a convenience and may be absent.
(() => {
  const html = document.documentElement
  const base = document.body.dataset.base || "/"
  const store = {
    get: (k) => { try { return localStorage.getItem(k) } catch (e) { return null } },
    set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} },
  }
  const narrow = () => matchMedia("(max-width:900px)").matches

  // ---- sidebar ----
  const toggle = document.getElementById("toggle-sidebar")
  const setSidebar = (open) => {
    if (narrow()) html.classList.toggle("show-sidebar", open)
    else { html.classList.toggle("no-sidebar", !open); store.set("book-sidebar", open ? "open" : "closed") }
    toggle.setAttribute("aria-expanded", String(open))
  }
  setSidebar(narrow() ? false : store.get("book-sidebar") !== "closed")
  toggle.addEventListener("click", () => setSidebar(toggle.getAttribute("aria-expanded") !== "true"))
  const current = document.querySelector(".chapters a.on")
  if (current) current.scrollIntoView({ block: "center" })

  // ---- themes ----
  const tb = document.getElementById("theme-button"), tm = document.getElementById("theme-menu")
  const active = () => html.getAttribute("data-theme") || "light"
  const mark = () => tm.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.theme === active())))
  const closeThemes = () => { tm.hidden = true; tb.setAttribute("aria-expanded", "false") }
  mark()
  tb.addEventListener("click", (e) => { e.stopPropagation(); tm.hidden = !tm.hidden; tb.setAttribute("aria-expanded", String(!tm.hidden)); if (!tm.hidden) tm.querySelector('[aria-checked="true"]').focus() })
  tm.addEventListener("click", (e) => {
    const t = e.target.closest("button")?.dataset.theme
    if (!t) return
    if (t === "light") html.removeAttribute("data-theme"); else html.setAttribute("data-theme", t)
    store.set("book-theme", t); mark(); closeThemes(); tb.focus()
  })
  document.addEventListener("click", (e) => { if (!tm.hidden && !tm.contains(e.target)) closeThemes() })

  // ---- search: index fetched on first open, one entry per section ----
  const bar = document.getElementById("searchbar"), input = document.getElementById("search")
  const results = document.getElementById("results"), st = document.getElementById("search-toggle")
  let index = null
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
  const openSearch = (open) => {
    bar.hidden = !open; st.setAttribute("aria-expanded", String(open))
    if (open) {
      input.focus()
      if (!index) fetch(base + "search-index.json").then((r) => r.json()).then((d) => { index = d; run() })
        .catch(() => { results.innerHTML = '<li class="none">Search is unavailable offline.</li>' })
    }
  }
  st.addEventListener("click", () => openSearch(bar.hidden))
  const run = () => {
    const q = input.value.trim().toLowerCase()
    if (!index || q.length < 2) { results.innerHTML = ""; return }
    const terms = q.split(/\s+/).filter((t) => t.length > 1)
    const scored = []
    for (const e of index) {
      const t = e.t.toLowerCase(), h = e.h.toLowerCase(), b = e.b.toLowerCase()
      let score = 0
      for (const term of terms) {
        const s = (t.includes(term) ? 10 : 0) + (h.includes(term) ? 5 : 0) + (b.includes(term) ? 1 : 0)
        if (!s) { score = 0; break }   // every term must match somewhere
        score += s
      }
      if (score) scored.push([score, e])
    }
    scored.sort((a, b) => b[0] - a[0])
    const hl = (s) => terms.reduce((acc, term) => acc.replace(new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"), esc(s))
    const snippet = (b) => {
      const i = Math.max(0, b.toLowerCase().indexOf(terms[0]) - 60)
      return (i ? "…" : "") + b.slice(i, i + 180) + "…"
    }
    results.innerHTML = scored.length ? scored.slice(0, 30).map(([, e]) =>
      `<li><a href="${base}${e.s}/${e.a ? "#" + e.a : ""}"><div class="rt">${hl(e.t)}</div>` +
      (e.h ? `<div class="rh">${hl(e.h)}</div>` : "") + `<div class="rb">${hl(snippet(e.b))}</div></a></li>`).join("")
      : '<li class="none">No matches.</li>'
  }
  input.addEventListener("input", run)

  // ---- keys: S or / search, ← → turn pages, Esc closes ----
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)
    if (e.key === "Escape") { if (!bar.hidden) { openSearch(false); st.focus() } closeThemes(); return }
    if (typing) return
    if (e.key === "s" || e.key === "S" || e.key === "/") { e.preventDefault(); openSearch(true) }
    else if (e.key === "ArrowLeft") document.querySelector('.pager a[rel="prev"]')?.click()
    else if (e.key === "ArrowRight") document.querySelector('.pager a[rel="next"]')?.click()
  })

  // ---- On this page: highlight the section in view ----
  const links = [...document.querySelectorAll('.onpage a[href^="#"]')]
  const heads = [...document.querySelectorAll(".doc h2[id], .doc h3[id]")]
  if (links.length && heads.length) {
    let cur
    const update = () => {
      let h = heads[0]
      for (const x of heads) { if (x.getBoundingClientRect().top < 120) h = x; else break }
      if (h === cur) return
      cur = h
      links.forEach((a) => a.classList.toggle("on", a.hash === "#" + h.id))
    }
    addEventListener("scroll", update, { passive: true })
    update()
  }
})()
