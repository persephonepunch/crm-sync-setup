---
title: "Compile to update — the estate by seven lifecycle stages"
description: "Every application in a Shopify, Webflow, Cloudflare and Xano estate described by the same seven stages: compile, permissions, render, bundle, deploy, version, update. No recommendation — each cell states what happens, who owns it, and what the smallest possible change is. The empty cells are the informative ones."
canonical: https://persephonepunch.github.io/crm-sync-setup/compile-to-update.html
category: "Specs"
date: 2026-09-07
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/COMPILE-TO-UPDATE.md
licence: CC-BY-4.0
tags:
  - architecture
  - migration
  - xano
  - webflow
  - shopify
---
# Compile to update — the estate by seven lifecycle stages

Every application in the estate, described by the same seven stages. No recommendation is made
here and nothing is compared on merit — each cell states what happens, who owns it, and what the
unit of change is. Where a stage does not exist for a surface, the cell says so; **an absent stage
is usually the most informative thing on the row.**

## The seven stages

- **Compile** — source becomes a checked artefact. Types resolved, errors surfaced before anything
  ships. A surface with no compile step moves faster and catches less.
- **Permissions** — what the artefact may touch, and who may invoke it. Two questions, often
  answered in different places. The distinction that matters is whether reach is *declared* —
  stated in configuration and refusable — or *implicit* in whatever the process happens to hold.
- **Render** — where output is produced, and for whom. A browser, an edge location, a crawler, or
  nothing at all. Several surfaces render for no human and are the ones that matter most to an agent.
- **Bundle** — packaging into one deployable unit. The boundary of what ships together, and
  therefore of what must be re-tested together.
- **Deploy** — how the unit reaches its host, and who is able to perform that action.
- **Version** — how a release is identified after the fact, and whether it can be rolled back
  independently of anything else.
- **Update** — how a change reaches production, and what the smallest possible change is. The stage
  where cost and lead time actually live, because it happens weekly rather than once.

## The estate, stage by stage

| | Shopify theme · Liquid | Shopify app · admin + theme extension | Webflow site · + Designer Extension | Cloudflare Worker · behaviour layer | Xano · data plane and rules |
|---|---|---|---|---|---|
| **Compile** | None for templates. Liquid is interpreted at render; a syntax error surfaces on the page. Theme JavaScript can be built with Vite — TypeScript, code splitting, tree shaking — without adding a framework | `tsc` on the app and each extension; the CLI type-checks before it will deploy | Site: none. Extension: `tsc`, and a deploy guard that refuses on failure | `tsc --noEmit`, then a bundler; a type error stops the deploy | Function stacks validate on save; Lambda steps are JS/TS executed on Deno |
| **Permissions** | Structural — the language cannot execute arbitrary code, and **cannot hold a secret**. Storefront data only, plus a script lock on payment templates | Declared as access scopes in the manifest. **The install mints the credential** — this is what the bundle is for | Site: none, and no secret storage. Extension: scoped to the workspace that installed it, under the app's own identity | **Declared as bindings.** A store the config does not name is unreachable at runtime, not merely unused | Per-endpoint auth plus the rule artefact every path calls; entitlements signed and verifiable |
| **Render** | Server-side by the platform, to a browser and to crawlers | Admin UI in an isolated frame; theme extension renders into the storefront | Static pages from the CDN; extension renders inside the Designer | Edge — HTML, JSON, feeds, and events for callers with no browser at all | Does not render. Returns records and decisions |
| **Bundle** | The theme itself; assets uploaded per file. A Vite build produces split chunks that ship as ordinary theme assets | The CLI packages app and extensions as one version | One archive per extension | One worker bundle plus static assets, in a single upload | No bundle step. The stack is the artefact |
| **Deploy** | Theme push, or an editor change published by a merchant | CLI deploy; install by listing or a custom-distribution link — **no Plus required** | Site: publish from the Designer. Extension: upload the bundle | One command, pinned to one config and one environment | Saved, then live; releases can be packaged and promoted between environments |
| **Version** | Theme version, and the git history of the theme repo | App version per deploy; extensions versioned with it and rolled back together | Site publish history; extension version in its manifest | Version metadata bound into the runtime — the worker can name the code that answered a request | Named releases; the ledger records which decision was made under which |
| **Update** | **Smallest unit in the estate:** one Liquid file, or a merchant editing content with no developer involved | A new app version. Scope changes require re-consent by the merchant | Content: publish, no build. Extension: rebuild and re-upload | Redeploy the worker — behaviour changes on every surface at once, with no host site republished | **A rule can change without a deploy**, which is what makes conditional authorisation practical — and why the evidence layer is the compensating control |

### How to read the empty cells

Liquid has no compile and no bundle, which is exactly why a content change is cheap there and why
the language forbids arbitrary code — the safety had to come from somewhere other than a build
step. Xano has no bundle and no render, which is why a rule can change without a release and why
the audit trail carries the weight a release process would otherwise carry. Neither absence is a
deficiency; both are the trade that makes the surface good at its stage.

## The same seven stages for a rebuilt storefront

Stated for comparison, on the same terms, with no adjectives.

| | Rebuilt storefront · JavaScript framework | What changes against the row above |
|---|---|---|
| Compile | Full application build; type-check, transpile, route compilation | Added where the theme had none |
| Permissions | Route middleware for the perimeter; per-record checks written by hand in each path | Implicit rather than declared — a check must be remembered, and nothing fails when it is not |
| Render | Server-rendered and hydrated in the browser | Comparable, at a higher operational cost |
| Bundle | Application bundle plus per-route chunks | Added where the theme had none |
| Deploy | Build and deploy the application | Content changes now pass through a build |
| Version | Deployment id per release | Comparable |
| Update | **Smallest unit is a deployment.** A copy change compiles, bundles and deploys the application | The unit of change grows by two stages — which is the whole of the lead-time difference |

The load-bearing row is *Update*. Everything else is a matter of taste or budget; the unit of
change determines how long a content correction takes and who has to be available for it.

## What the inventory shows

- **Two surfaces have declared permissions** — the worker, where reach is a binding, and Xano,
  where the rule is an artefact every path calls. Everywhere else, permission is either structural
  (Liquid) or written by hand and therefore forgettable.
- **Bundling is one discipline, not several.** A manifest, a typed source tree, a CLI that
  packages, a host that runs it in an isolated frame — the same shape whether the host is a
  commerce admin or a site designer. The same review and the same pipeline apply.
- **The bundle exists for key custody, not distribution.** Neither a theme nor a visual site can
  hold a secret — anything in either is readable by whoever can edit it, and much of it ships to
  the browser. Installing an application is the only mechanism by which those surfaces acquire an
  authenticated identity, with the secret on a server they never see and the reach declared in the
  manifest beforehand. Both platforms converged on the identical model, which is the tell that it
  is the load-bearing part.
- **No enterprise tier is triggered** by anything in the first table. Applications install on
  standard commerce plans, by listing or by custom link. The capabilities that do require an
  upgrade are checkout-adjacent and none appear here.
- **Only one row renders for nobody.** The worker and Xano produce output for scheduled jobs,
  webhooks and automated buyers — callers with no browser. That row is where consent, authorisation
  and idempotency have to live, because it is the only one still running when nothing is being
  rendered.
