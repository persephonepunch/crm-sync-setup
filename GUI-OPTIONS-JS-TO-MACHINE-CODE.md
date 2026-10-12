---
title: "GUIs when you still ship JavaScript: Webflow, Elm, Javy, Tauri and Rust down to machine code"
description: "A field guide to interface options for a stack that keeps its JavaScript and TypeScript: Webflow with TypeScript embeds and Workers side by side, Elm and SVG islands, Shopify Functions compiled from JS with Javy, Rust in the browser through WebAssembly, Tauri around an existing web UI, native Rust GUIs (iced, egui, Slint), and no_std firmware with no GUI at all — compared by what JavaScript remains at runtime and where trust is enforced."
canonical: https://persephonepunch.github.io/crm-sync-setup/gui-options-js-to-machine-code.html
category: "Specs"
date: 2026-10-12
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/GUI-OPTIONS-JS-TO-MACHINE-CODE.md
licence: CC-BY-4.0
tags:
  - architecture
  - security
  - webflow
  - firmware
keywords:
  - Elm Architecture
  - iced
  - egui
  - Slint
  - Tauri
  - Electron
  - Javy
  - QuickJS
  - Shopify Functions
  - WebAssembly
  - wasm-bindgen
  - Leptos
  - Dioxus
  - Yew
  - no_std
  - ESP32-C6
  - Content-Security-Policy
  - wasm-unsafe-eval
  - Kakao Pay
  - PCI DSS
  - SAQ A
about:
  - GUI architecture
  - JavaScript and TypeScript dependencies
  - Rust and WebAssembly
  - Embedded firmware
alternativeHeadline: "Keep the JavaScript in the view; move the decisions somewhere it cannot reach"
---

# GUIs when you still ship JavaScript: Webflow, Elm, Javy, Tauri and Rust down to machine code

**For the team that has a Webflow site, TypeScript embeds and a Worker today, and keeps being told to rewrite it in Rust.**

> The question is never *how do we get rid of JavaScript*. It is **which decisions JavaScript is
> allowed to make** — and the answer, in every option below, is as few as possible.

---

## The rule that makes the choice easy

The Ondol Life thermostat states it in one line: **the unit enforces every limit; the app only asks.** The 49 °C cap lives in firmware compiled for the device's own processor. The phone, the TV and the desktop app may display it, request a change to it, and be refused. None of them can move it.

Read every option in this article against that rule. An interface is safe in proportion to how little it decides, and the language it is written in matters far less than where its decisions are allowed to land. That is the same argument the [Dark Factory article](DARK-FACTORY-ENTITLEMENT-SECURITY.md#one-architecture-two-trust-models-elm-iced-and-webflow-xano) makes about the Elm Architecture: the compiler's guarantee holds inside one program, and the moment there is a network in the middle, the edge has to earn it again.

So you can keep your JavaScript and TypeScript. What changes is the job they are given.

## The options

### 1. Webflow with TypeScript embeds, and a Worker bundled beside it

**What it is.** Webflow owns layout and content. A TypeScript bundle, built with Vite, adds behaviour to the page. A Cloudflare Worker, a second TypeScript bundle, sits in front of the data. Two bundles, one contract between them.

**What JavaScript remains.** All of it — in the page and at the edge.

**Where trust lives.** In the Worker and behind it in Xano, never in the page. The page script can be read, modified and replayed by anyone, so it holds no secrets and decides nothing that matters. The contract is a published JSON schema: TypeScript types are generated from it for both bundles, so the page and the Worker cannot silently drift, and the Worker validates every request against it regardless.

**Fits.** Marketing sites, storefronts, and any interface designers must be able to change without a release. This is the default, and it is a good one, provided the page stays a view.

### 2. Static HTML with a small behaviour layer

**What it is.** Eleventy, or Webflow's export, renders HTML ahead of time. petite-vue or HTMX adds the interactive parts.

**What JavaScript remains.** A few kilobytes, loaded only where a page needs it.

**Where trust lives.** The same place as option 1. The gain is surface: less script means less to pin under a Content-Security-Policy, less to audit, and less to break.

**Fits.** Content-heavy pages and forms. The [Render and Runtime dictionary](RENDER-RUNTIME-DICTIONARY.md) defines islands, HTMX and the rest.

### 3. Elm islands, drawing SVG

**What it is.** Elm is a typed functional language that compiles to JavaScript and is built on the architecture iced later borrowed: state, typed messages, one `update`, a pure `view`. An Elm program mounts into a single element, so it can live as an island inside a Webflow page. It talks to the page and to the Worker through *ports*, which are typed channels in and out.

**What JavaScript remains.** One compiled file, with no npm runtime dependencies. Elm's package registry does not accept JavaScript in third-party packages, which removes most of the supply-chain exposure that npm carries by default.

**Where trust lives.** Inside the island, the compiler guarantees that every message is one the program declared, and Elm is known for programs that do not throw at runtime. At the ports, that guarantee ends: anything arriving from JavaScript is decoded and checked. Past the Worker, it is option 1 again.

**The SVG case.** `elm/svg` builds images as typed values, not strings. Elm's virtual DOM refuses `<script>` elements, inline `on*` handlers and `javascript:` URLs, so an interface cannot be talked into running what it draws. For charts, diagrams and interactive drawings, this is the strongest browser-side option in this list. [Safe SVG](SAFE-SVG.md) covers the static side of the same problem.

**Fits.** One complicated, stateful widget — a configurator, an estimator, a floor-plan sketcher — inside an otherwise ordinary page.

### 4. Shopify Functions written in JavaScript, compiled with Javy

**What it is.** Javy, a Shopify-originated project now maintained under the Bytecode Alliance, compiles JavaScript into a WebAssembly module. It does this by bundling **QuickJS**, a small JavaScript engine, with your script's bytecode. It is how Shopify Functions accept JavaScript and TypeScript: you write the discount, cart transform or delivery rule in JS, and what Shopify runs is Wasm.

**What JavaScript remains.** Your JavaScript, interpreted by a JavaScript engine that is itself inside the Wasm sandbox. This is not an interface; it is the *logic* half of one, moved off the page and into a runtime that denies it everything.

**Where trust lives.** In Shopify's sandbox: no network, no filesystem, typed JSON in, typed JSON out, a bounded instruction count. A bug in your function, or a hostile dependency bundled into it, can only affect what that extension point is permitted to change.

**The trade.** An interpreter inside Wasm costs instructions that compiled Rust does not, so on large carts a JS function reaches Shopify's limits sooner. The usual path is to start in JavaScript with Javy, where the team already works, and move a function to Rust when the numbers say so. The sandbox is the same either way.

**Fits.** Every checkout rule a merchant needs, written by a team that does not write Rust.

#### A Javy build is not a safer import — it is a narrower one

It is tempting to read Javy as a more secure way to `import` JavaScript. It is not an import mechanism at all, and it does not make code safer. The bundler resolves every `import` at build time, Javy compiles the bundle and a JavaScript engine into one Wasm module, and the code inside is exactly as buggy, or as hostile, as it was before. What changes is what it can reach:

| | `import` in a browser page | JavaScript compiled with Javy, run by Shopify |
|---|---|---|
| When imports resolve | At runtime; the browser may fetch modules from URLs | At build time; everything is bundled, nothing is fetched later |
| What the code can reach | Whatever the page can: the DOM, readable cookies, `fetch` to any origin the CSP allows | Only the JSON it is handed; it can only return JSON |
| A malicious dependency could | Read the page, skim form input, send it elsewhere | Return a wrong discount, which Shopify still checks against what that extension point may change |
| An infinite loop | Freezes the tab | Hits the instruction limit and is stopped |
| Safety comes from | The CSP, SRI and the author's care | The sandbox the module runs in |

Run the same module in a host that grants network or file access and none of the right-hand column holds. **The sandbox makes it safe, not the compiler.**

The guarantee is an allow-list in both directions. On the way in, each Function declares a GraphQL **input query** naming exactly the fields it receives — cart lines, prices, customer tags — and nothing outside that query reaches the code. On the way out, it may only return operations from its extension point's schema, and Shopify rejects anything else. It is not a stream: each run is one payload in, one result out, and the Function keeps nothing afterwards.

In Rust's terms, the Function is handed a **shared borrow** of the cart and returns *proposed* changes, while Shopify keeps the only mutable reference and applies them itself:

| Rust ownership | Shopify Function |
|---|---|
| `&T` — read, never change | The input JSON: the cart can be read, not edited |
| Only the owner holds `&mut T` | Shopify owns the cart and applies changes itself |
| The borrow ends with the scope | The Function exits after one call and keeps nothing |
| Checked by the **compiler**, before anything runs | Checked by the **sandbox**, on every call |

The last row is the difference that matters. Ownership is a compile-time rule about memory inside one program. Shopify's is a runtime rule between two parties, which is why it holds just as well for JavaScript, a language with no ownership at all. **A Function is an allow-listed, read-only borrow of the cart: it sees only what it asked for, can only propose, and Shopify keeps sole ownership.**

#### The same shape at the payment: separate wallets such as Kakao Pay

Payment wallets apply the same pattern one step later, to the most sensitive data in the transaction. Kakao Pay is a separate, Korean-regulated payment service that runs its own authentication and holds its own card and account data. The Ondol Life Worker integrates it in two server-side calls:

1. **Ready.** The Worker sends the order total to Kakao Pay with a secret key that never leaves the Worker, and receives a transaction ID and a redirect URL. The transaction ID is stored server-side, because a transaction ID in a query string is a payment anyone can complete.
2. **The customer pays inside Kakao Pay** — its app or its page, under its authentication. The card number is entered there, or was stored there already.
3. **Approve.** Kakao Pay returns the customer with a one-time token, and the Worker exchanges the token and the stored transaction ID for the approved result.

At no point does a card number reach the page, the Worker, Xano or Shopify. The merchant receives an approval and an amount — the read-only borrow again — while the wallet keeps sole ownership of the card. Shopify's own checkout works the same way for cards: the storefront never handles a card number.

That is what narrows PCI DSS scope. PCI obligations follow the systems that store, process or transmit cardholder data, so a merchant that only redirects to a wallet and receives a result has far less in scope than one whose pages take card numbers — typically the shortest self-assessment, SAQ A, rather than a full one. Scope narrows; it does not disappear. The merchant still secures the pages that launch the redirect, the secret key, and the approve step, which is why the redirect host must be registered with Kakao Pay and the key is held only by the Worker. The wallet's own compliance is the wallet's: Kakao Pay is supervised under Korea's electronic-finance rules, and a merchant whose acquirer asks for evidence of PCI DSS compliance should request the provider's attestation directly rather than assume it.

There is a sovereignty benefit as well. The customer's card and Kakao account data stay with a Korean provider under Korean regulation. Ondol Life's own systems receive only what the approval contains, which is what lets the Korean launch keep personal data in Korea without moving card data across a border it was never going to cross.

### 5. Rust in the browser through WebAssembly

**What it is.** Two shapes. **DOM frameworks** — Leptos, Dioxus, Yew — render ordinary HTML elements from Rust. **Canvas frameworks** — egui through eframe — draw the whole interface onto a canvas with WebGPU or WebGL. CADCraft's web build is the second kind: a full AutoCAD-style interface running from one Wasm module.

The three DOM frameworks, defined by the choice each one makes:

- **Leptos** — *fine-grained reactivity, no virtual DOM.* State lives in signals, and when a signal changes only the exact text or attribute that reads it is updated, the approach SolidJS made popular in JavaScript. It is built for full-stack work: the same Rust renders on the server, hydrates in the browser, and calls back to the server through *server functions*, typed Rust functions that the framework turns into HTTP endpoints. Closest to a Rust Next.js.
- **Dioxus** — *React's model, many targets.* Components, hooks and an `rsx!` macro that reads like JSX, over a virtual DOM. Its distinguishing bet is reach: one codebase builds for the web, for desktop and mobile (through a system web view, much like Tauri), and for server rendering. Closest to a Rust React Native.
- **Yew** — *the oldest of the three, and the one nearest Elm.* Its original component model was the Elm Architecture almost verbatim — a `Message` type and an `update` method — and it later added React-style function components and hooks, with an `html!` macro over a virtual DOM. It is aimed mainly at single-page applications in the browser.

| | Leptos | Dioxus | Yew |
|---|---|---|---|
| Model | Signals, fine-grained updates | React-style components and hooks | Elm-style messages, then React-style hooks |
| Virtual DOM | No | Yes | Yes |
| Markup | `view!` macro | `rsx!` macro | `html!` macro |
| Server rendering | Built in, with server functions | Built in, with server functions | Supported; browser-first |
| Targets | Web (client and server) | Web, desktop, mobile, server | Web |
| Nearest JavaScript relative | SolidJS / Next.js | React / React Native | React, with Elm roots |

All three still load through a small `wasm-bindgen` glue file, and all three need `'wasm-unsafe-eval'` in a strict Content-Security-Policy. Unlike egui, they render ordinary HTML, so search engines and screen readers see a normal page.

**What JavaScript remains.** A small generated glue file from `wasm-bindgen`. It cannot be zero, because Wasm reaches the browser's APIs through JavaScript.

**Where trust lives.** The same edge as options 1 to 3: Wasm in a tab is still running on the user's machine, under the user's control. What Rust adds is memory safety inside the module and one language from interface to server.

**The cost to know about.** A strict Content-Security-Policy blocks WebAssembly compilation unless it allows `'wasm-unsafe-eval'`, which is a narrower grant than `'unsafe-eval'` but still a deliberate one. Canvas interfaces also start from nothing for accessibility: screen readers see a canvas, not a form, unless the framework builds an accessibility tree for them.

**Fits.** Heavy, computational interfaces — CAD, 3D, image editing — where the browser is a delivery channel for an application, not a document.

### 6. Tauri around the web UI you already have

**What it is.** A native app whose interface is your existing HTML, CSS and JavaScript, shown in the operating system's own web view, with a Rust process behind it. The Ondol Life thermostat is built this way: the same web app runs as a PWA, as a Tauri desktop app, and later as a TV app.

**What JavaScript remains.** All of the interface. Tauri replaces the backend, not the frontend.

**Where trust lives.** In the Rust process, behind an explicit list of commands. The thermostat's frontend can call exactly four: `intake_model`, `content_address`, `electrical_requirements` and `size_circuit`. Each takes typed arguments that are decoded and checked before any Rust runs, and nothing else exists to call. That list is the Elm `Message` enum stretched across a process boundary, enforced by the runtime rather than a compiler. The app's Content-Security-Policy lives in its configuration and limits the web view to its own files, its own IPC and named hosts. And the Rust side keeps the parser rule: intake hashes and describes an incoming model and **never opens it**, because parsing is the attack surface and this process holds the user's filesystem.

**Fits.** Desktop and mobile apps where the interface is already web, and some work — files, hashing, hardware, sizing calculations — must happen with native access but behind a narrow door.

**Electron, for contrast,** ships Chromium and Node.js inside every app. It is the same shape, with a far larger bundle and Node's full reach available to code that is not careful to give it up.

### 7. Native Rust GUIs

No web view and no JavaScript; the interface compiles to machine code for the desktop.

- **iced** uses the Elm Architecture directly: `State`, an `enum Message`, `update`, `view`. The compiler rejects a message the program did not declare.
- **egui** is immediate-mode: it redraws the interface from state every frame instead of dispatching messages. It is fast to build with and powers DesignCraft (an InDesign clone) and CADCraft. It shares Elm's rule that state drives the view, without the typed message log.
- **Slint** describes the interface in its own declarative markup and compiles it to native code, including for **microcontrollers**. Of the three it is the one that reaches a device's own screen. Check its licensing terms before shipping, since they differ from the MIT and Apache licences common in Rust.

**Where trust lives.** Inside one process, the compiler does the work the edge does for options 1 to 5. That is real, and it is also the single-bundle model from the [Dark Factory article](DARK-FACTORY-ENTITLEMENT-SECURITY.md#the-long-run-ai-requirement-json-records-not-a-single-java-bundle): correct while nothing crosses the boundary, and back to per-request checks the moment the app talks to a server.

**Fits.** Professional desktop tools, and kiosk or appliance screens.

### 8. No GUI on the device: firmware compiled to machine code

**What it is.** The Ondol Life solar-dock controller is a `no_std` Rust library with no dependencies, compiled for the RISC-V core of an ESP32-C6. It holds the controller rules, the sensor contract and an 18-byte Bluetooth status record, and nothing that draws.

**What JavaScript remains.** None on the device. The interface is whichever of options 1 to 7 reads the Bluetooth record.

**Where trust lives.** Here, and only here. The 49 °C cap, the sensor fault rules and the refusal of an over-limit setpoint (a Bluetooth error returned to the app) are compiled into the unit. Every interface above it can be wrong, compromised or replaced, and the shower still does not go above 49 °C. The firmware's own tests check exactly that, including that a 121 °F request is refused.

**Fits.** Anything that can hurt someone. This is where the decisions belong; the GUI is a view of them.

## Putting it together: Webflow, Beautiful Soup, Eleventy and modules

The Ondol Life site is options 1, 2 and 4 combined into one pipeline, and it is the clearest answer to *what do we do with the JavaScript we have*. Each layer has one job, and the security layer is never the page.

**Design: Webflow.** Designers author pages, components and CMS content — including tags and categories per product, per language — in Webflow. Webflow is the authoring tool, not the production server.

**Transform: Beautiful Soup.** A Python sync reads the published Webflow site through the Webflow Data API and parses each page with Beautiful Soup. Along the way it:
- lifts the navigation and footer out of every page into shared templates, so they render once;
- replaces marked elements (`data-component="onboard"`, or a mapped class) with Eleventy components;
- moves every Webflow-hosted image to R2 under a content-hashed key, served by the Worker with a year-long cache;
- **strips every Google tag Webflow emitted and reports it** — the only thing allowed to load a Google tag is the consent script, after consent;
- refuses to invent a tag: a term that is not in the controlled vocabulary is reported, not accepted.

This is the one place the stack scrapes HTML, and it does so on purpose: Webflow's published output *is* the authored content, and parsing it avoids writing the same vocabulary twice. It also makes the sync a filter. Whatever Webflow adds to a page, only what the sync recognises reaches production.

**Build: Eleventy.** Eleventy renders the transformed pages to static HTML from the templates and data the sync produced.

**Behaviour: modules.** Interactivity arrives as small ES modules loaded with `<script type="module">` — a behaviour layer per need, not one application bundle. Every one of them is pinned by the site's Content-Security-Policy, which the site enforces.

**Commerce: the Shopify SDKs.** Shopify's Storefront Web Components (`<shopify-store>`, `<shopify-context>`, `<shopify-data>`) load as a module with a **public** Storefront token, which can read the catalogue and create carts and nothing else. Checkout happens on Shopify. Checkout logic runs as Shopify Functions — JavaScript through Javy, or Rust — inside Shopify's sandbox.

**Security: Cloudflare and Xano.** The Worker sits in front of everything that matters: it serves media, validates form submissions and API calls before anything is written, holds the secrets, and applies consent and, where an endpoint can be abused, a size cap and a per-IP rate limit. Xano holds the records. Its access keys are being split by what each one opens — write, subject, retention and mail — so that a leaked key is bounded by what its kind of door allows, instead of one shared key opening all of them. The page holds no secret and decides nothing; it asks, like the thermostat.

| Layer | Tool | Language | Decides |
|---|---|---|---|
| Design | Webflow | — (visual) | How it looks |
| Transform | Beautiful Soup sync | Python | What is allowed to reach production |
| Build | Eleventy | JavaScript (build time only) | Which HTML is generated |
| Behaviour | ES modules | JavaScript / TypeScript | Nothing that matters — it asks |
| Commerce | Storefront Web Components, Shopify Functions (Javy or Rust) | JS, Wasm | Cart display in the page; checkout rules in the sandbox |
| Security | Cloudflare Worker + Xano | TypeScript, XanoScript | Every request, every record |

JavaScript is present in four of the six layers, and in none of them is it trusted. That is the pattern the whole article argues for.

## The comparison

| Option | You write | JavaScript at runtime | Runs as | Where trust is enforced | SVG / drawing | Fits |
|---|---|---|---|---|---|---|
| 1. Webflow + TS + Worker | TypeScript | All of it, page and edge | Browser + V8 isolate | Worker and Xano, per request | Browser SVG; sanitise or serve as files | Sites, storefronts |
| 2. Static HTML + petite-vue / HTMX | HTML, a little JS | A few KB, per page | Browser | Server, per request | Browser SVG | Content and forms |
| 3. Elm island | Elm | One compiled file, no npm runtime | Browser | Compiler inside; decoders at ports | Typed SVG; no script, handlers or `javascript:` | One complex widget |
| 4. Javy (Shopify Functions) | JavaScript / TypeScript | Your JS, inside QuickJS, inside Wasm | Shopify's Wasm sandbox | Sandbox: no I/O, typed JSON in and out | None | Checkout and cart logic |
| 5. Rust → Wasm (Leptos, Dioxus, egui web) | Rust | A small `wasm-bindgen` glue file | Browser | Same edge as 1–3 | Canvas or DOM; check accessibility | CAD, 3D, editors in a tab |
| 6. Tauri | Your web UI + Rust | All of the UI | OS web view + native Rust | Typed command allow-list + CSP | Browser SVG in the web view | Desktop and mobile apps |
| 7. iced / egui / Slint | Rust (+ `.slint` markup) | None | Native machine code | Compiler, inside one process | resvg or the framework's own canvas | Desktop tools, kiosks, MCU screens |
| 8. `no_std` firmware | Rust | None | Machine code on the device | Compiled into the unit; the app only asks | None — there is no GUI | Safety limits |

## Gentle or total: an Elm island in Webflow against a full egui app

Options 3 and 5 both bring a compiler's guarantees into the browser, and teams weighing a move to Rust often jump straight to the second. The difference is scope. **An Elm island adds one widget to a site that keeps working as it is. An egui app replaces the whole interface.**

The island fits the pipeline above without changing it. The designer places an empty block in Webflow marked `data-component="estimator"`; the Beautiful Soup sync already maps marked elements to Eleventy components, so the component renders a mount point and loads one compiled file:

```html
<div id="estimator"></div>
<script type="module">
  import "/assets/estimator.js";              // compiled Elm, self-hosted, pinned by the CSP
  const app = Elm.Main.init({
    node: document.getElementById("estimator"),
    flags: { locale: "ko", sku: "ONDOL-120" }  // page config, decoded and checked on arrival
  });
  app.ports.requestQuote.subscribe(q =>       // Elm asks; the Worker decides
    fetch("/api/quote", { method: "POST", body: JSON.stringify(q) })
      .then(r => r.json()).then(app.ports.quoteReceived.send));
</script>
```

| | Elm island in Webflow | Full Rust egui app |
|---|---|---|
| What changes | One box on one page | The entire interface, rewritten in Rust |
| Designers | Keep designing everything in Webflow | Leave the process; the interface is code |
| Content and CMS | Unchanged: Webflow CMS, the sync, Eleventy | Rebuilt, or fed in through code |
| What the browser receives | Ordinary HTML with one interactive area | One canvas element |
| Search engines | Read the page as usual | See an empty canvas |
| Accessibility | Ordinary elements that screen readers understand | Extra work before a screen reader sees more than a canvas |
| Download | One compiled JavaScript file, typically tens of kilobytes | A Wasm module, usually megabytes |
| Content-Security-Policy | No change | Must allow `'wasm-unsafe-eval'` |
| Learning curve | A small functional language, no memory rules | Rust's ownership and borrowing, plus the egui API |
| Toolchain | `elm make`, one file out | Rust, a Wasm target, and Trunk or `wasm-bindgen` |
| If it does not work out | Delete one box; the site is unchanged | Going back is a second rebuild |

The underlying reason is who draws the pixels. egui draws its own — text, layout, every widget — so it brings everything with it and gives up what the browser provides for free: HTML, search, screen readers, and the designers' tool. Elm renders ordinary HTML and SVG, so it takes over only the part it is handed.

Neither moves the trust boundary. The island asks through a port and the Worker validates the request like any other; an egui app in a tab is equally under the user's control. **Elm makes the widget correct. Only the edge makes the system trustworthy.**

egui is still the right call when the browser's free features do not matter and rendering does: CAD, page layout, 3D editors, and one Rust codebase shipped to both desktop and web, as CADCraft and DesignCraft are. Those are applications that happen to run in a tab. A site of content, products and a few interactive tools is not, and for that the gentle path fits: Webflow for the pages, an Elm island where one tool's state gets complicated, and Rust where the safety limits live.

## Updating: what recompiles, and how the Worker reaches Webflow

Every compiled option raises the same practical question: when something changes, is it a rebuild? For code, yes. For data, no. Designing for that split decides how often anyone has to touch a compiler.

### A Wasm dashboard

| Change | Recompile? | Why |
|---|---|---|
| Rust logic, components, a new chart type | Yes | The code is compiled into the `.wasm` file |
| Markup inside `rsx!` or `view!` | Often not, while developing | Dioxus and Leptos can hot-reload markup edits without a full rebuild |
| CSS in a separate stylesheet | No | The browser loads it on its own |
| The dashboard's data — orders, leads, sensor readings | No | Fetched at runtime from the Worker or Xano as JSON |
| Settings, flags, labels, translations | No, if loaded as JSON at startup | Yes only if they were compiled in as constants |

In development, `trunk serve` (Yew, egui), `dx serve` (Dioxus) and `cargo leptos watch` (Leptos) rebuild on save, and incremental builds take seconds; the first build and an optimised release build take longer. On deploy, a code change produces a new `.wasm` file with a content-hashed name, so browsers fetch it instead of a cached copy. Data changes go live the moment the API returns them. **Compile the logic, fetch the data** — the same rule as the [JSON-records section](DARK-FACTORY-ENTITLEMENT-SECURITY.md#the-long-run-ai-requirement-json-records-not-a-single-java-bundle) of the Dark Factory article. The other compiled pieces follow it too: the TypeScript Worker is rebuilt and redeployed with `wrangler deploy`, and a Shopify Function is recompiled and published as a new app version with `shopify app deploy`.

### The Worker compiles; Webflow's head and footer only load

Webflow's site-wide **Head code** and **Footer code** are the obvious place for behaviour, and the worst place to keep it: pasted code there has no build, no tests, no version history and no review. So the stack keeps exactly one line in Webflow and everything else in the Worker:

```html
<!-- Webflow → Site settings → Custom code → Footer code. The only line written in Webflow. -->
<script src="https://<worker>/embed/webflow-preview.js" data-sitekey="<turnstile site key>" defer></script>
```

The loader reads the Worker's address from its own `src`, so that line is the only place the address is written. Everything it loads — the header's account menu, the chat launcher, the newsletter form handler — is built and served by the Worker:

- **Source.** Components are ES modules in the repository, and header and footer markup are design files. Both are the source of truth.
- **Compile.** A build step turns them into what the Worker serves. Design HTML is `JSON.stringify`-ed into a generated TypeScript module, which is immune to the backticks, `${` and backslashes that break hand-pasted code. The modules can also be flattened into one classic-script bundle, with each component in its own scope, for pages that need a single embed. Generated files say so at the top and are never edited by hand.
- **Ship.** `wrangler deploy`. The new header, footer or form behaviour is live on the next page load, with no change in Webflow.

The built Eleventy site and Webflow's own `.webflow.io` copy stay in step through the same mechanism. On the built site, the Beautiful Soup sync swaps marked elements for components at build time. Webflow's hosted copy is never built, so the loader performs the same swap in the browser — and on the built site it finds nothing left to swap and does nothing.

### Webflow components: who designs, who decides

| Component | Webflow owns | The Worker's code owns | Change it by |
|---|---|---|---|
| **Header** | Layout, logo, navigation, an empty element marked `component-account` | The `<ondol-header>` account menu that replaces that element: sign-in, session | Design: publish in Webflow. Behaviour: rebuild and deploy |
| **Footer** | Layout, links, the newsletter form's design | The chat launcher, the newsletter submission, consent | Same split |
| **Form** | The fields, the button, the success block (`.w-form-done`) and the error block (`.w-form-fail`), and their text | The **submission only**: it detaches Webflow's handler from that one form, posts to Xano — or to the form's own `action` when the designer set one — and then shows Webflow's own success or error block | Copy and layout in Webflow; endpoint and rules in code |
| **Validation** | The browser check: `required` fields and boxes stop an empty or unticked submission before anything is sent | **The real check**, in the Worker and Xano: the email, the consent, and in Korea the itemised cross-border disclosure and its own required box | The browser check is courtesy; the server check is the authority |
| **Load** | Nothing beyond the one loader line | Deferred scripts, each component defined once, one run per page even when two addresses load it, Google tags only after consent, all within the Content-Security-Policy | Rebuild and deploy |
| **State** | None that matters | Interface state in the component — the button disables while sending and comes back if Xano refuses; durable state in Xano; the visitor's consent regime from the Worker | Records change in Xano with no compile at all |

Two details carry the rest. Webflow's own spam protection is removed from the newsletter form: it waits for a Turnstile token issued for `webflow.io`, which never arrives on the real domain, so it would leave the button permanently disabled. Abuse is handled where it can be enforced instead — Xano rate-limits sign-ups by IP, and EU sign-ups are confirmed by email before they count. The browser also applies the same email rule Xano does, so a mistake shows before anything is sent. And every one of these behaviours is pinned by an end-to-end test against Webflow's real markup — that Xano is posted to rather than Webflow, that Webflow's error block keeps the designer's text and the button returns, that a Korean visitor sees the disclosure in the form — so a designer's edit in Webflow and a code change in the Worker are checked against the same page.

#### Which forms still need the Turnstile checkbox

Removing Webflow's checkbox from the newsletter does not mean the site has no Turnstile. Turnstile is Cloudflare's checkbox (reCAPTCHA is Google's), and the Worker checks a token from its own widget, on the real domain, wherever a form can be turned into a weapon or a cost:

| Form | Turnstile | Why |
|---|---|---|
| **Newsletter** | No | Webflow's widget is bound to `webflow.io` and can never pass on the real domain. A sign-up sends nothing and buys nothing, so Xano's per-IP rate limit and email confirmation for EU sign-ups are enough |
| **Email sign-in link** | Yes, before anything is sent | Without it, the endpoint mails a link to any address typed in — a free way to flood someone's inbox from your domain |
| **Order and inquiry** | Yes | The buy button can be embedded on any site, so an order could be created from anywhere. Every site that embeds it must be on the widget's hostname list |
| **Loyalty enrolment** | Yes | Same discipline as leads |

Turnstile is anti-abuse, not a security boundary. It raises the cost of volume; it does not decide what may be stored. The consent gate and the content-address check hold with it switched off, which is why the Worker lets requests through when Turnstile is unconfigured — and logs every time it does. A consent gate that let requests through would be a violation; a bot filter that does is a site that still works.

If the newsletter ever does attract sign-ups the rate limit lets through, the fix is the same as on the other forms: a Turnstile widget registered for the real domain, with the Worker verifying the token. Switching Webflow's checkbox back on would only bring back the disabled button.

### A/B gating: Xano decides, the Worker serves, a vanilla loader picks

The same split extends to experiments without adding a testing vendor's script to every page. This is a proposed pattern, not yet built into Ondol Life, and it uses only the pieces above:

1. **Xano decides the variant.** A conditional in an endpoint's function stack — if this subject is eligible and their hashed ID falls in the first half, then `b`, else `a` — reads the split from an experiment *record*, not from code. Eligibility is part of the same decision: market, signed-in or not, and whether the visitor's consent allows the result to be measured. Because the subject's ID is hashed, the same visitor always gets the same variant.
2. **The Worker serves both builds under namespaced paths.** Both variants are compiled ahead of time and deployed together, each under its own immutable path — `/embed/exp/newsletter-copy/a/newsletter.js` and `.../b/newsletter.js`. Same origin, so the Content-Security-Policy does not change. The Worker asks Xano once per subject and caches the answer, so a page load does not wait on the database.
3. **A vanilla loader picks.** The one loader line in Webflow's footer is unchanged. It asks the Worker for the assignment and loads the matching path — plain JavaScript, no framework, nothing to install.

Three rules keep it honest:

- **A variant changes presentation, never authority.** It may change copy, layout or the order of steps. It may not change a price, a limit, a consent requirement or what the server accepts — the Worker and Xano validate both variants identically. The thermostat's boundary applies: a gate may change what a feature looks like, never move a ceiling.
- **The assignment is made on the server.** A coin flip in the browser is fine for a colour and useless for anything that matters, because the visitor controls it. Xano's answer is the one that counts.
- **Rollback is a record change.** Set the split to 100% `a` in Xano and every visitor is back on the original at the next page load, with no compile and no deploy. Ending an experiment is a deploy that removes the losing path.

#### The same gate for market rules — with one difference

The mechanism carries over directly to *if US, if Korea*: which form rules, newsletter rules and payment components load for a visitor. The difference is that **a market rule is not an experiment**. It is never a percentage split, it is never left to a variant record someone might edit for a test, and when the market is unknown it **fails toward the stricter rules**, not toward the default. The Worker already works this way: it resolves the visitor's consent regime on the server, and the newsletter handler treats an unknown region as needing the Korean disclosure.

Most market differences are *rules*, and rules are data, so they belong in one compiled bundle, read from the Worker at load time:

| Rule | United States | Korea |
|---|---|---|
| Where the sign-up is stored | The US Xano | The Korea team's Xano, once configured — the data stays in Korea |
| Cross-border disclosure | None | Until Korean storage is live: the itemised disclosure and its own required box, in the Webflow form |
| Consent model | Opt-out, honouring Global Privacy Control | Opt-in before collection |
| Language | English | Korean, including error and confirmation text |
| If the rules cannot load | — | The form says so and the button stays off |

Changing any of these is a record or configuration change, with no compile. Separate, namespaced bundles are for *code* that only one market needs — the Kakao Pay buy button is the example, loaded only where Kakao Pay is offered — so a US visitor never downloads it at all. The test is the one this whole section uses: if it is a rule, fetch it; if it is code, compile it, and let the server decide which code a market receives.

One browser detail decides how components are namespaced. A custom element's tag name can be defined only once per page, so if both variants define `<ondol-newsletter>`, the loader must make sure only one of them ever loads. Variants that need to coexist on a page, for a side-by-side preview, take namespaced tags such as `<ondol-newsletter-b>`.

**The pattern in one line:** Webflow designs every component, and the Worker decides what each one does. Design changes publish from Webflow with no compile. Behaviour changes compile once, in the Worker, and reach every page through one line nobody edits.

## Choosing

1. **Start with where the decision must live, not the interface.** If it can hurt someone or cost money, it goes in firmware (8), a sandbox (4) or behind the edge (1). The interface is chosen afterwards.
2. **Keep the JavaScript you have.** Options 1, 2, 3 and 6 all keep a web UI. Moving decisions out of the page is the security win; rewriting the page is not.
3. **Use Javy before Rust for Shopify logic.** The sandbox is identical, and the team already writes JavaScript. Move a function to Rust when instruction counts demand it.
4. **Reach for Elm for one hard widget, not a whole site.** It earns its keep where state is complicated and drawing must not execute.
5. **Choose native Rust only when the browser is in the way** — heavy rendering, device screens, offline tools. Its compiler guarantees end at the first network call, like everyone else's.
6. **Whatever you choose, pin the code and validate the data.** A Content-Security-Policy on every web surface, typed schemas at every boundary, and nothing that crosses a boundary allowed to run.

## Further viewing

- [*Why I'm so bullish about Rust in 2026*](https://youtu.be/WhjEL817Onw) — Dreams of Code (video).
- [Javy](https://github.com/bytecodealliance/javy) — JavaScript to WebAssembly, the toolchain behind JavaScript Shopify Functions.
- [Shopify Functions](https://shopify.dev/docs/apps/build/functions) — the sandbox options 4 and 8 are measured against.
- [Kakao Pay developers](https://developers.kakaopay.com) — the ready and approve flow.
- [PCI DSS document library](https://www.pcisecuritystandards.org/document_library/) — the self-assessment questionnaires, including SAQ A.
- [Leptos](https://leptos.dev) · [Dioxus](https://dioxuslabs.com) · [Yew](https://yew.rs)
- [The Elm Architecture](https://guide.elm-lang.org/architecture/) · [iced](https://iced.rs) · [egui](https://www.egui.rs) · [Slint](https://slint.dev) · [Tauri](https://tauri.app)
