---
title: "CSP from the edge: Cloudflare headers, Hydrogen nonces, reports in Xano"
description: "Where a Content Security Policy can be set on a Shopify, Hydrogen or Cloudflare-fronted site, why it belongs in a response header and not a meta tag, and how to roll it out: report-only first, violation reports collected by a Worker and kept in Xano, then enforcement one route group at a time. Covers Cloudflare Transform Rules and client-side security, per-response nonces in a Worker, Hydrogen's createContentSecurityPolicy, and how to read each kind of report."
canonical: https://persephonepunch.github.io/crm-sync-setup/csp-cloudflare-xano-reports.html
category: "Security"
date: 2026-11-26
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CSP-CLOUDFLARE-XANO-REPORTS.md
licence: CC-BY-4.0
tags:
  - security
  - cloudflare
  - xano
  - shopify
  - hydrogen
keywords:
  - Content Security Policy
  - CSP report-only
  - Reporting-Endpoints
  - report-uri
  - CSP nonce
  - strict-dynamic
  - Cloudflare Transform Rules
  - Cloudflare client-side security
  - Hydrogen createContentSecurityPolicy
  - useNonce
  - CSP violation reports
  - Xano
---
# CSP from the edge: Cloudflare headers, Hydrogen nonces, reports in Xano

> A Content Security Policy tells the browser which scripts, frames and connections a page may use. Send it from the server or the edge, start in report-only mode, collect the reports in a store you own, and enforce it only after the reports go quiet.

**Audience** Platform engineer, Shopify or Hydrogen developer, security reviewer
**Status** Current · Version 1.0
**Owner** Platform engineer (role)

---

## Where a CSP can come from

| Surface | Who sets the header | Per-response nonce | Notes |
| --- | --- | --- | --- |
| Cloudflare Transform Rule (Modify Response Header) | Cloudflare, from a rule in the dashboard; no code | No: the value is fixed | Good for static sites, or a report-only policy with no nonce |
| Cloudflare Worker | Your Worker code | Yes | The full pattern below: nonce, report-only, collector |
| Hydrogen on Oxygen | `createContentSecurityPolicy` in `app/entry.server.jsx` | Yes | Enforced by default; reporting is yours to add |
| Shopify Online Store theme | Shopify | No | Shopify sends its own CSP (framing and mixed content); a theme cannot replace it |
| Cloudflare client-side security | Cloudflare adds its own report-only policy | Not applicable | Script and connection inventory; it reports to Cloudflare, not to you |

A browser checks every policy a response carries, each on its own. Cloudflare's monitoring policy and yours can sit on the same response without conflict: each produces its own reports for its own endpoint.

## Why a header, not a meta tag

A `<meta http-equiv="Content-Security-Policy">` tag applies only after the browser has parsed up to it. It cannot set `frame-ancestors`, `report-uri`/`report-to` or `sandbox`, and anything that can edit the template can edit the policy. A header from the server or the edge arrives before any page code runs. Every option in this article uses a header.

## The rollout

1. **Report only.** Send `Content-Security-Policy-Report-Only`. Nothing is blocked; browsers report what would have been.
2. **Collect.** A Worker endpoint receives the reports, removes duplicates and sensitive data, and stores one row per distinct violation.
3. **Cover every page.** Reports arrive only from pages someone opens, so open each page once (from the sitemap and the route list) instead of waiting for traffic.
4. **Fix.** Work through the reports by directive (see *Reading the reports*).
5. **Enforce one route group at a time.** After about 14 days with no unexplained reports for a group, switch its header to `Content-Security-Policy`. Pages that handle keys or admin actions first, marketing pages last.

## Option A: a Cloudflare Transform Rule

Without writing code, Cloudflare can add a header to every response for a hostname:

1. **Rules → Transform Rules → Modify Response Header → Create rule.**
2. **Match:** hostname equals your host (narrow it with a path if only part of the site is ready).
3. **Action:** *Set static*, header `Content-Security-Policy-Report-Only`, value:

```text
default-src 'self'; script-src 'self' 'report-sample'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; report-uri https://example.com/csp-report
```

The value is the same on every response, so it cannot carry a nonce. For pages with inline scripts, either list each script's hash (`'sha256-…'`) or use Option B. A Transform Rule also replaces a header of the same name that the origin sent, so don't use one on a route whose origin already sets its own CSP.

## Option B: a Worker with a nonce per response

A nonce is a random value issued fresh for each response. A script runs only if it carries that response's nonce, so a script injected into the page, which can't know the value in advance, doesn't run.

```js
// The Worker wraps every HTML response. Templates opt a script in with nonce="__CSP_NONCE__".
const REPORT_PATH = "/csp-report";
const policy = (n) => [
  "default-src 'self'",
  `script-src 'self' 'nonce-${n}' 'strict-dynamic' https: 'report-sample'`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "report-to csp",
  `report-uri ${REPORT_PATH}`,
].join("; ");

export default {
  async fetch(request, env, ctx) {
    const res = await handle(request, env, ctx); // your existing routes
    if (!(res.headers.get("Content-Type") || "").includes("text/html")) return res;
    if (res.headers.has("Content-Security-Policy") || res.headers.has("Content-Security-Policy-Report-Only")) return res;
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    const body = (await res.text()).replaceAll("__CSP_NONCE__", nonce);
    const out = new Response(body, res);
    out.headers.set("Content-Security-Policy-Report-Only", policy(nonce));
    out.headers.set("Reporting-Endpoints", `csp="${REPORT_PATH}"`);
    return out;
  },
};
```

Rules that make this safe:

- **Only templates get the nonce.** Never add it to every `<script>` the page contains: that also trusts injected scripts, and the policy protects nothing.
- **HTML only.** A script file that another site loads runs under that site's policy, not yours, so a CSP on a `.js` response does nothing.
- **Skip responses that already have a policy,** such as pages proxied from another platform.
- **`'strict-dynamic'`** lets a nonced script load the scripts it needs. Browsers that support it ignore `'self'` and `https:`, which remain only as a fallback for older ones.
- **`'report-sample'`** puts the first 40 characters of a blocked inline script in its report, so each report names its script.
- **Inline handlers** (`onclick="…"`) can't carry a nonce. They show up as `script-src-attr` reports. Move them into a nonced script with `addEventListener`.

## Option C: Hydrogen

Hydrogen builds the policy for you. In `app/entry.server.jsx`, `createContentSecurityPolicy` returns `{nonce, header, NonceProvider}`. The `nonce` goes to `renderToReadableStream`, `NonceProvider` wraps the app, and `header` is set as `Content-Security-Policy`. In `app/root.jsx`, `useNonce()` gives the nonce to `Scripts`, `ScrollRestoration` and `LiveReload`, and third-party scripts load through Hydrogen's `<Script>` component, which adds the nonce for you. Extra sources are passed as options, for example `styleSrc: ["'self'", "https://cdn.shopify.com", "https://some-custom-css.cdn"]`.

Shopify's documentation for this covers nonces but not reporting. It doesn't mention report-only mode or a reporting endpoint, and the header it sets is enforced from the first deploy. To roll out the same way as Options A and B, send the header in report-only mode with your collector appended:

```js
const {nonce, header, NonceProvider} = createContentSecurityPolicy({
  styleSrc: ["'self'", "https://cdn.shopify.com"],
});
responseHeaders.set("Content-Security-Policy-Report-Only", `${header}; report-uri https://example.com/csp-report`);
// After the reports go quiet: responseHeaders.set("Content-Security-Policy", header);
```

Shopify marks that page *Legacy Hydrogen*: it covers Hydrogen 2026-04 and earlier. For 2026-10 and later, check the current Hydrogen docs and the migration guide before relying on the same calls.

## Cloudflare client-side security

Cloudflare's client-side security (formerly Page Shield) builds an inventory of the scripts and connections your pages use and flags malicious ones. The free bundle includes CSP reporting and the script inventory on every plan. Its script monitor works by adding its own report-only policy, with Cloudflare's endpoint as the report address. It complements your policy without replacing it:

- **Cloudflare tells you** which scripts run and whether any of them are known bad.
- **Your policy and collector tell you** which scripts would be blocked, on which page, in a store you own and can join with the rest of your data.

The paid tier adds policies that enforce a CSP from the Cloudflare dashboard. Before enforcing in two places, choose one owner for the enforcing header: a policy managed both in the dashboard and in code drifts apart.

## Collecting reports, and keeping them in Xano

Browsers send reports in two formats: the older `report-uri` format, one JSON object with a `csp-report` key, and the Reporting API, a JSON array of `{type: "csp-violation", body}` sent to the endpoint named in `Reporting-Endpoints`. Chrome uses the Reporting API when both are set; Firefox and Safari use `report-uri`. Set both.

**Point browsers at a Worker, not straight at Xano.** A report endpoint is public by design: browsers can't attach an API key, and anyone can post to it. In front of the store, the Worker:

- **Reads the body before replying, then answers `204`** and does the storing after the response.
- **Caps the body size and the posts per IP,** and drops malformed JSON.
- **Cuts every URL to origin and path.** Query strings can carry tokens.
- **Stores no visitor IP.**
- **Stores one row per distinct violation per day:** a hash of directive, blocked source, page and line. A popular page with one inline script produces one row a day, not one row per visit.

Forward each new distinct row to Xano with a server-side key. Xano is then the ledger you can audit and join with release and page data:

```js
// After dedupe: one call per NEW violation, never one per report.
await fetch(`${env.XANO_BASE}/csp_violation`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.XANO_CSP_WRITE_TOKEN}` },
  body: JSON.stringify({ day, hash, directive, blocked, page, line, sample, disposition }),
});
```

**The Xano table `csp_violation`:**

| Field | Type | Notes |
| --- | --- | --- |
| `hash` | text, unique with `day` | Directive + blocked source + page + line; the upsert key |
| `day` | date | UTC day of first sight |
| `directive` | text | `script-src-elem`, `script-src-attr`, `frame-ancestors`, … |
| `blocked` | text | `inline`, `eval`, or an origin + path |
| `page` | text | Origin + path of the page, no query |
| `line` | int | Line in the page, when the browser gives one |
| `sample` | text | First 40 characters of the script (`'report-sample'`) |
| `disposition` | text | `report` while report-only, `enforce` after |
| `release` | text | The deploy version the page came from, so a fix can be checked against the release that shipped it |

Give the Worker a write-only token for this one endpoint, and give reviewers read-only access. Agents reading the ledger through MCP should use a read-only tool.

## Reading the reports

| Directive in the report | What it means | Fix |
| --- | --- | --- |
| `script-src-elem`, blocked `inline` | An inline `<script>` without the nonce | Add `nonce="__CSP_NONCE__"` in the template, or move the code to a file |
| `script-src-elem`, blocked URL | A script file from a host the policy doesn't allow | Add the host deliberately, or serve the file yourself with a pinned version and an integrity hash |
| `script-src-attr` | An inline handler such as `onclick=` | Move it into a nonced script with `addEventListener` |
| `script-src` with `eval` | `eval()` or `new Function()` | Remove it; don't add `'unsafe-eval'` |
| `frame-ancestors` | Another site framed the page | Add the site if it's yours or a partner's; otherwise this is the clickjacking case the directive exists for |
| `connect-src` | A `fetch` or WebSocket to a host not on the list | Add the API host, or route it through your own origin |

Enforce a route group only when every report for it is fixed or explained. A report that arrives after enforcement is a script that was blocked, and someone's page may have broken because of it.

## Worked example: crm-sync.dev

- **Since 26 November 2026,** every HTML page the crm-sync.dev Worker serves carries the report-only policy from Option B. Responses that already have a CSP are left alone, and script files get none.
- **The collector** at `/csp-report` keeps one row per distinct violation per day for 30 days, and an admin route lists them by directive.
- **The first reports** matched the page source exactly: two inline scripts on `/sell` and one on `/keys/vendors`, the scripts that don't carry a nonce yet.
- **To cover every page,** all 157 HTML pages from the sitemap and the route list were opened once in a browser, so pages with little traffic report too.
- **Next,** the templates get nonces and the handlers move, and enforcement follows one route group at a time.

## Sources

- [Content Security Policy in Hydrogen (legacy)](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/content-security-policy) and [current Hydrogen docs](https://shopify.dev/docs/storefronts/hydrogen) — Shopify
- [Client-side security, now open to everyone](https://blog.cloudflare.com/client-side-security-open-to-everyone) — Cloudflare blog
- [Transform Rules: modify response headers](https://developers.cloudflare.com/rules/transform/response-header-modification/) — Cloudflare docs
- [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) and [Reporting-Endpoints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Reporting-Endpoints) — MDN
- [CSP Level 3](https://www.w3.org/TR/CSP3/) and [Reporting API](https://www.w3.org/TR/reporting-1/) — W3C
- [AI Security Middleware runbook: server-only rules](https://files.ysl150.com/runbooks/ai-security-middleware/#runbook-server-only-rules-for-reads-crawlers-regions-and-csp) — YSL150
