const { HtmlBasePlugin } = require("@11ty/eleventy")

// The book lives at persephonepunch.github.io/crm-sync-setup/book/. It is BUILT, not committed:
// the Pages workflow runs this and uploads ../book with the rest of the repo.
module.exports = function (ec) {
  ec.addPassthroughCopy({ assets: "assets" })
  ec.addPlugin(HtmlBasePlugin)
  // Rebuild when a doc or the summary changes, not just the templates.
  ec.addWatchTarget("../*.md")
  ec.addWatchTarget("../docs/*.md")
  ec.addWatchTarget("../posts/*.md")
  ec.addWatchTarget("SUMMARY.yml")
  ec.ignores.add("node_modules/**")
  return {
    dir: { input: ".", includes: "_includes", data: "_data", output: "../book" },
    pathPrefix: process.env.BOOK_PREFIX || "/crm-sync-setup/book/",
  }
}
