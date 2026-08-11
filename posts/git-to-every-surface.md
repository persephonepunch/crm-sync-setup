---
name: Git to Every Surface — the Article Pipeline
slug: git-to-every-surface
summary: One markdown commit becomes a Webflow article, a Shopify metaobject, and an AEM Content Fragment — with hashtags as the filter dimension and ALT text carried from the source.
category: Specs
doc-group: Posts
hashtags: [content:kb/specs, content:page/design]
---
## The article is a shape

This post was not typed into a CMS. It is a markdown file in a public repository, and everything you are reading is a projection of that file.

The pipeline it rides:

- **Git** holds the source — the body, the front-matter, the hashtags, the image ALT text. Editing is a diff; a bad edit is a revert.
- **Webflow** renders it — the article lands in the Docs collection with its category, its hashtag references, and its `source-url` provenance stamp.
- **Shopify** mirrors it as a metaobject, readable by the storefront and its AI agents.
- **AEM** mirrors it as a Content Fragment, served headlessly from the publish tier.

## Ownership stays honest

The ingest only manages items it created. An article authored in Webflow carries no repository `source-url`, and the ingest will never touch it. Two origins, one collection, zero overwrites.

## Why hashtags are records

The tags on this post are not strings — they are references into a Hashtags collection whose rows carry the canonical `tag-key` (`content:kb/specs`), the kind, and the JSON-LD anchor. A tag is data you can join on, not decoration.
