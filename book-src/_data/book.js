// The book, built from the repo's own Markdown. SUMMARY.yml says WHICH docs and in WHAT order;
// each doc's front-matter `category` says WHICH CHAPTER (one writer each). A doc listed under a
// chapter its category disagrees with stops the build, naming the file.
//
// Produces { title, chapters: [{n, title, pages}], pages: [...in reading order], search: [...] }.
const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")
const matter = require("gray-matter")
const MarkdownIt = require("markdown-it")

const ROOT = path.resolve(__dirname, "../..")
const REPO = "https://github.com/persephonepunch/crm-sync-setup/blob/master/"
const PAGES = "https://persephonepunch.github.io/crm-sync-setup/"

const md = new MarkdownIt({ html: true, linkify: true })
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim()
const slugify = (s) => text(s).toLowerCase().replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const day = (d) => (d instanceof Date ? d.toISOString() : String(d || "")).slice(0, 10)

module.exports = () => {
  const summary = yaml.load(fs.readFileSync(path.join(__dirname, "..", "SUMMARY.yml"), "utf8"))
  const errors = []

  // Pass 1: every doc's slug, so links between docs can point into the book.
  const slugOf = new Map()   // repo-relative path -> slug
  for (const ch of summary.chapters) for (const src of ch.docs) {
    const slug = path.basename(src, ".md").toLowerCase()
    if ([...slugOf.values()].includes(slug)) errors.push(`${src}: slug "${slug}" is taken by another doc`)
    slugOf.set(src, slug)
  }

  // A relative link or image in a doc: into the book when the target is in it, else to GitHub
  // (Markdown) or the Pages site (anything else). Absolute URLs are left alone.
  const resolve = (from, href, isImage) => {
    if (/^([a-z]+:|#|\/\/)/i.test(href)) return href
    const [p, frag] = href.split("#")
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(from), p))
    if (!isImage && slugOf.has(target)) return `../${slugOf.get(target)}/${frag ? "#" + frag : ""}`
    return (target.endsWith(".md") ? REPO : PAGES) + target + (frag ? "#" + frag : "")
  }

  const chapters = [], pages = [], search = []
  summary.chapters.forEach((ch, ci) => {
    const chapter = { n: ci + 1, title: ch.title || ch.category, pages: [] }
    ch.docs.forEach((src, di) => {
      const file = path.join(ROOT, src)
      if (!fs.existsSync(file)) { errors.push(`${src}: listed in SUMMARY.yml but not in the repo`); return }
      const { data: fm, content } = matter(fs.readFileSync(file, "utf8"))
      if (fm.category && fm.category !== ch.category)
        errors.push(`${src}: category "${fm.category}" but listed under "${ch.category}" — change one`)

      let html = md.render(content)
        .replace(/(<a\b[^>]*\bhref=")([^"]+)"/g, (_, a, h) => `${a}${resolve(src, h, false)}"`)
        .replace(/(<img\b[^>]*\bsrc=")([^"]+)"/g, (_, a, h) => `${a}${resolve(src, h, true)}"`)
        .replace(/<table\b[^>]*>/g, (t) => `<div class="table-wrap">${t}`).replace(/<\/table>/g, "</table></div>")

      // The doc's own H1 becomes the page title (doc.css hides a leading one anyway).
      const h1 = html.match(/^\s*<h1>(.*?)<\/h1>/)
      const title = fm.title || fm.name || (h1 ? text(h1[1]) : path.basename(src, ".md"))

      // Ids on h2/h3, numbered h2s (2.3.1 style, like a Rust book chapter), and the page TOC.
      const toc = [], used = new Set()
      let h2 = 0
      const number = `${ci + 1}.${di + 1}`
      html = html.replace(/<h([23])>(.*?)<\/h\1>/g, (_, level, inner) => {
        let id = slugify(inner) || "section", k = 2
        while (used.has(id)) id = `${slugify(inner)}-${k++}`
        used.add(id)
        // Number h2s 2.3.1-style, unless the author already numbered it ("1. Summary", "§2").
        if (level === "2") { ++h2; if (!/^\s*(§\s*)?\d+(\.\d+)*[.)]?\s/.test(text(inner)))
          inner = `<span class="secno">${number}.${h2}</span> ${inner}` }
        toc.push({ id, level: +level, text: text(inner) })
        return `<h${level} id="${id}">${inner}</h${level}>`
      })

      // Search: one entry per h2 section, so a hit lands on the section, not the top.
      const parts = html.split(/(?=<h2 id=")/)
      for (const part of parts) {
        const m = part.match(/^<h2 id="([^"]+)">(.*?)<\/h2>/)
        const body = text(m ? part.slice(m[0].length) : part)
        if (body || m) search.push({ s: slugOf.get(src), t: title, h: m ? text(m[2]) : "", a: m ? m[1] : "",
          b: body.slice(0, 1800) })
      }

      // The description is often the opening paragraph, truncated; don't print it twice.
      const description = fm.description || fm.summary || ""
      let showSummary = !!description
      const firstP = (html.match(/<p>(.*?)<\/p>/s) || [])[1]
      const stem = (s) => text(s).replace(/[….\s]+$/, "").slice(0, 80).toLowerCase()
      if (description && firstP && text(firstP).toLowerCase().startsWith(stem(description))) showSummary = false

      const page = {
        src, slug: slugOf.get(src), number, title, chapter: chapter.title, chapterN: chapter.n,
        description, showSummary, date: day(fm.date),
        tags: fm.tags || fm.hashtags || [], canonical: fm.canonical || "",
        source: REPO + src, raw: PAGES + src, html, toc,
      }
      chapter.pages.push(page)
      pages.push(page)
    })
    chapters.push(chapter)
  })

  if (errors.length) throw new Error("SUMMARY.yml:\n  " + errors.join("\n  "))
  pages.forEach((p, i) => { p.prev = pages[i - 1] || null; p.next = pages[i + 1] || null })
  // prev/next hold whole pages; trim them so the data stays small and acyclic.
  const stub = (p) => p && { slug: p.slug, title: p.title, number: p.number }
  pages.forEach((p) => { p.prev = stub(p.prev); p.next = stub(p.next) })
  return { title: summary.title, chapters, pages, search }
}
