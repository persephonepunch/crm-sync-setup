// The search index, fetched by assets/book.js on first use (not on page load).
exports.data = { permalink: "/search-index.json", eleventyExcludeFromCollections: true }
exports.render = ({ book }) => JSON.stringify(book.search)
