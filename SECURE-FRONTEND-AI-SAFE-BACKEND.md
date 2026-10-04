---
title: "Secure frontend, AI-safe backend: Webflow collections, fallback publishing and grants"
description: "How a Webflow site published as static files pairs each publishing step with a permission: collections as MVC, fallbacks that fail toward less exposure, review switches as publish grants, and where TLS, memory safety and authorization each fit."
canonical: https://persephonepunch.github.io/crm-sync-setup/book/secure-frontend-ai-safe-backend/
category: "Security"
date: 2026-10-04
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SECURE-FRONTEND-AI-SAFE-BACKEND.md
licence: CC-BY-4.0
tags:
  - security
  - entitlement
  - webflow
  - architecture
  - xano
  - aeo
---

# Secure frontend, AI-safe backend: Webflow collections, fallback publishing and grants

A static site built from Webflow has no login, no session and no server deciding anything at request time. That makes it fast and hard to break, and it moves every security decision to two other places: **the build**, which decides what becomes public, and **the runtime behind it**, which decides what each caller may do. This article describes how the two pair up in the development patterns used across CRM Sync, PIM Sync and the client sites built on them, and why the pattern holds when AI writes much of the code and makes many of the calls.

This knowledge base is itself published both ways, from one set of Markdown files in GitHub:

- **[The CRM Sync book](https://persephonepunch.github.io/crm-sync-setup/book/)**: every article in chapters, laid out like the Rust book (mdBook), with search and prev/next. Eleventy builds it from the Markdown on every push.
- **[The knowledge base on crm-sync.dev](https://www.crm-sync.dev/pages/knowledge-base)**: the same articles on the Shopify storefront, published through the Webflow and GitHub pipeline.

It extends [Same frontend, AI-secure backend](https://persephonepunch.github.io/crm-sync-setup/book/why-xano-runtime-as-a-service/#same-frontend-ai-secure-backend), which covers the runtime half (the worker as the gate, Xano as the record). This article covers the publishing half, and the vocabulary for both.

## 1. Vocabulary

**Memory safety** is the guarantee that a program reads and writes only memory it owns, only within the bounds it was given, and only while that memory is still valid. A memory-safe language enforces this for every line, whoever wrote it: Rust at compile time, Python, Java and JavaScript at run time through a garbage collector and bounds checks. It is a property of the running software, not of its data, its network or its permissions.

**Runtime and memory**

| Term | Definition |
| --- | --- |
| Memory safety | See above. Removes use-after-free, buffer overflows and data races as a class. |
| Use-after-free | Using memory after it has been released, so the program reads whatever now occupies it. |
| Buffer overflow (over-read) | Reading or writing past the end of a block of memory. Heartbleed was an over-read. |
| Data race | Two threads changing the same value at the same moment without coordination. |
| Immutability | A value that can't change after it's set. Rust's default; it limits accidental change. It is not undo or rollback. |
| Safe code | Rust code without the `unsafe` keyword, where the compiler enforces every memory rule. |

**Identity and permission**

| Term | Definition |
| --- | --- |
| TLS | Encryption of data in transit between two machines. It ends where the connection terminates. |
| Encryption at rest | Encryption of stored data on disk and in backups. It doesn't decide who the database answers. |
| Authentication | Establishing who the caller is: a person, an app or an agent. |
| Authorization | Deciding what that caller may do, to which record, now. Always the application's job. |
| Claim | A statement inside a signed token about the caller, such as their ID or entitlements (Xano custom claims). |
| Capability (cap) | Permission for one action on one kind of resource, written `<plane>:<resource>:<verb>`. |
| Grant | The act, and the record, of giving a capability. Grant = insert, revoke = delete, audit = read. |
| Mandate | A signed, scoped, expiring, revocable grant that lets an agent act for someone. Agents bring mandates, never keys. |
| Least privilege | Giving a caller only what the current task needs, for only as long as it needs it. |
| Row scoping | Querying by record ID **and** owner, so a valid caller still reaches only their own rows. |
| Fail closed | When a check can't be completed, the answer is no. |

**AI and publishing safety**

| Term | Definition |
| --- | --- |
| Publish layer | Everything a build emits. It is public to every reader, crawler and answer engine, permanently. |
| Publish grant | The decision that a piece of content may enter the publish layer, or be indexed from it. |
| Review switch | A field (`reviewed`, `claims_checked`) whose state is the publish-to-engines grant for one item. |
| Fallback publishing | What the pipeline emits when a template, locale or field is missing. Safe only if each fallback emits less. |
| Field allowlist | A template that names its public fields. Fails closed when a field is added. Its opposite, a denylist, fails open. |
| Mass assignment | A request that sets fields it shouldn't, such as `"role": "admin"`, because the input wasn't restricted to named fields. |
| Over-fetching | Returning or rendering more of a record than the reader needs; the output-side twin of mass assignment. |
| Build-time refusal | A pipeline stopping on disagreement instead of guessing, the content equivalent of code that doesn't compile. |
| Answer engine | A search or AI system that quotes content directly in its answer. It quotes what was indexed, not what was meant. |
| `noindex` | A page instruction that keeps it out of search and answer-engine indexes while it stays readable. |
| Hide vs enforce | The interface hides what a caller can't do; the server refuses it. Only the second is a control. |

## 2. Five layers, five different questions

Security controls are often compared as if they compete. They don't: each answers a different question, and a system can pass four and still leak through the fifth.

| Layer | The question it answers | What provides it | What it never covers |
| --- | --- | --- | --- |
| **In transit** | Can anyone read or change the data on the wire? | TLS, provided by Xano, Cloudflare and GitHub Pages | Anything after the data is decrypted |
| **At rest** | Can anyone read the stored data from the disk or a backup? | Database and storage encryption, usually managed | Who the database answers |
| **In the running program** | Can the software be made to read or write memory it doesn't own? | Memory safety: Rust, or a garbage-collected runtime | Whether the program's logic is right |
| **In the logic** | Is this caller allowed to do this, to this record, now? | Authentication and authorization: Xano claims, capability caps, row checks | What the build already made public |
| **At publish** | What does the build put where everyone, including crawlers and answer engines, can read it? | The publishing rules in this article | Anything decided at runtime |

TLS and its limits are covered in depth in [What TLS actually buys, and where it stops](https://persephonepunch.github.io/crm-sync-setup/book/trust-roots-across-clouds/#what-tls-actually-buys-and-where-it-stops), and the difference from row-level encryption in [Transport encryption and row-level encryption](https://persephonepunch.github.io/crm-sync-setup/book/capability-not-perimeter/#transport-encryption-and-row-level-encryption-answer-different-questions). [The stack, and which layer may refuse](https://persephonepunch.github.io/crm-sync-setup/book/what-survives-the-transform/#the-stack-and-which-layer-may-refuse) gives each layer of the CRM Sync stack its single question.

The first three are largely handled by platforms. **The logic layer is always yours**, on any platform, and it is where most real breaches happen: an endpoint that returns another customer's order because it never checked ownership is perfectly encrypted and perfectly memory-safe. The **publish layer** is the one a static architecture adds. Anything the build emits is a grant to every reader, forever, so it needs the same discipline as an API response.

For how permission itself is modeled here (a scoped claim for one action, not a role for the whole building), see [Permissions for AI, in plain terms](https://persephonepunch.github.io/crm-sync-setup/book/capability-not-perimeter/#3-how-crm-sync-does-it-in-three-steps).

## 3. Memory safety, in one section

Memory safety (defined in [section 1](#1-vocabulary)) does not mean code can't be undone or rewound; Rust programs roll back transactions like any other. What it removes is three classes of bug:

- **Use-after-free**: using memory after handing it back, like reclaiming a coat with a ticket you already returned. Rust won't compile it.
- **Buffer overflow**: reading past the end of what you were given. Rust checks the bounds.
- **Data race**: two threads changing the same value at once without coordination. Rust's ownership rules forbid it.

**Heartbleed** (2014) is why this matters for TLS. OpenSSL, written in C, had a buffer over-read in its heartbeat feature: a request claiming a larger payload than it sent got back up to 64 KB of whatever sat in adjacent memory, including passwords, session cookies and private TLS keys. The encryption was sound; the code implementing it wasn't. TLS libraries written in Rust, such as rustls, rule that class of bug out in safe code.

What makes memory safety relevant to AI is that **the compiler doesn't care who wrote the code**. AI-generated Rust faces the same ownership checks as human Rust, and code that breaks them never ships. In C or C++ a plausible-looking AI-written overflow compiles and runs. Python gets its memory safety from its interpreter instead, as [Render and Runtime: a working dictionary](https://persephonepunch.github.io/crm-sync-setup/book/render-runtime-dictionary/#data-shape-and-the-cost-of-an-object) explains.

Where Rust actually runs in this estate: Shopify Functions accept Rust compiled to WebAssembly (see [the October 1 brief](https://persephonepunch.github.io/crm-sync-setup/book/shopify-october-1-scripts-cart-catalog/)), and the game11ty demo ships a `no_std` Rust GLB parser. The book above is *laid out* like the Rust book but built with Eleventy on Node.js, so it inherits no memory-safety guarantee from the resemblance.

## 4. Webflow as MVC

The sync that turns a Webflow site into static files is a model-view-controller split, and each seam is where a permission belongs.

| Part | What it is here | Who writes it |
| --- | --- | --- |
| **Model** | Each Webflow CMS collection, pulled through the Data API into `_data/wf/<collection>.json`, one record per item and locale | Editors, in Webflow |
| **View** | Nunjucks templates: a hand template in `_includes/templates/<collection>.njk` if one exists, otherwise one generated from the Webflow template page | Developers, in the repo |
| **Controller** | The sync script plus the Eleventy build, triggered by Webflow's `site_publish` and `collection_item_published` webhooks | The pipeline, in CI |

Two rules keep the parts from leaking into each other. **Markup travels; behavior never does**: a Webflow page arrives as clean HTML, and everything interactive (login, consent, forms) comes from the repo's own components, as described in [Fragments on Any Frontend](https://persephonepunch.github.io/crm-sync-setup/book/fragments-any-frontend/#1-the-split-that-makes-it-work). And **each item has one writer**: the ingest only manages items it created, so a Webflow-authored article and a Git-authored one share a collection without overwriting each other ([Git to Every Surface](https://persephonepunch.github.io/crm-sync-setup/book/git-to-every-surface/#ownership-stays-honest)).

Components follow the same split. A designer marks an element in Webflow (`data-component="account"`, or the class `component-account`), and the sync swaps it for the repo's `components/account.njk`, passing only the element's `data-*` attributes, other classes and visible text as props. Webflow decides *where*; the repo decides *what runs*.

## 5. Fallback publishing: every fallback fails toward less exposure

A static pipeline needs fallbacks, because Webflow will always be partly unfinished: a template page not yet published, a locale not yet translated, a field not yet bound. The rule that makes fallbacks safe is that **each one must publish less, never more**.

| When this is missing | The pipeline falls back to | Why that direction |
| --- | --- | --- |
| A hand template | A template generated from the Webflow template page | The designer's bound fields are the public ones |
| A usable Webflow template page | A schema template: the name, rich-text fields and images only | Plain-text fields often hold internal notes, so they stay out |
| Any template page | The data only, with no detail pages | No page is safer than a guessed page |
| A component file in the repo | The element as Webflow drew it, plus a report | Nothing runs that the repo didn't write |
| A published Korean locale | English chrome for Korean pages, and no `hreflang` pair | Don't link pages that don't exist |
| A review sign-off | The page publishes, but `noindex`, out of the sitemap, with no JSON-LD | Unaudited text is never what an answer engine quotes |

**The fallback that wasn't safe enough.** The schema template rendered every rich-text field, on the reasoning that rich text is content and plain text is notes. One collection had a rich-text field named `us_claim_note`: an internal note about a regulatory claim. It was empty, so nothing had leaked, but the next note typed into it would have been published. The fix was a hand template that **lists its public fields** instead of excluding private ones. An allowlist fails closed when someone adds a field; a denylist fails open.

**Review switches are publish grants.** Legal pages carry a `reviewed` switch and product pages a `claims_checked` switch. Until a human (working with AI-assisted regulatory audits) turns it on, the page is published so reviewers can read it in place, but it is marked `noindex`, left out of the sitemap and given no structured data. Turning the switch on is the grant that lets search and answer engines quote it.

## 6. Pairing each seam with a grant

Every point where data crosses from one owner to another gets a named grant, enforced in a named place.

| Seam | The grant | Enforced in | What happens without it |
| --- | --- | --- | --- |
| Collection field → page | Public-field allowlist in the hand template | The build | An internal note is published |
| Draft → search and answer engines | The review switch | The build: `noindex`, sitemap, JSON-LD | Unaudited legal or product claims get quoted |
| Webflow element → running code | Component placement; props from `data-*` only | The build | Designer-controlled script runs on the page |
| Page → per-user data | Capability caps and row scope | The worker and Xano, per call | One customer sees another's records |
| Page → analytics and ad tags | Consent, denied by default until granted | The consent ladder, before any tag loads | Personal data leaves before consent |
| Agent → action | A scoped, expiring mandate | The function tool, per call | A perfectly signed record of an unauthorized purchase |

Three rules from elsewhere in the book make the runtime rows hold:

- **The interface hides; the server enforces.** A component may hide a button the caller's caps don't allow, but the worker refuses the call regardless. *"A function reachable from front-end JavaScript is not a control; it's a suggestion"* ([Server-Side or It Didn't Happen](https://persephonepunch.github.io/crm-sync-setup/book/server-side-or-it-didnt-happen/#the-rule-that-makes-it-safe)).
- **Authority is resolved per call, not at login.** Scope, cap, expiry and consent state are checked before each effect ([Server-Side Function Tools](https://persephonepunch.github.io/crm-sync-setup/book/server-side-function-tools/#what-a-function-tool-actually-is)), and revocation is only as fast as that check ([Paired permissions on machine endpoints](https://persephonepunch.github.io/crm-sync-setup/book/machine-endpoint-grant-impact/#1-two-statements-not-one)).
- **Identity is not authority.** A signature proves who acted; only the grant proves they were allowed to ([Two Ways to Give an Agent a Key](https://persephonepunch.github.io/crm-sync-setup/book/agent-key-custody-models/#2-identity-is-not-authority)).

Consent follows the same shape: deny everything synchronously before any tag exists, then replay the stored decision, then load tags into an already-correct state ([Consent Resolution on Higher-Order Load](https://persephonepunch.github.io/crm-sync-setup/book/consent-resolution-pattern/#2-the-load-contract)).

## 7. The same seams in a Python backend

Xano gives you these controls through its interface. In a Python backend such as FastAPI, you bind them yourself, and the binding points are the same seams.

| Seam | Webflow pipeline | Python backend |
| --- | --- | --- |
| What may come in | The sync reads only fields the collection schema defines | A Pydantic input model with `extra="forbid"`, so a request can't slip in `"role": "admin"` (mass assignment) |
| What may go out | The hand template's public-field allowlist | `response_model=UserPublic`, which drops any field the model doesn't name, even if the code returns the whole row |
| Who is calling | The worker's `/auth/me`, which returns the caller's caps | A dependency that verifies the token and loads the user before the endpoint runs |
| What they may do | Capability caps, `<plane>:<resource>:<verb>` | Role or scope dependencies; Casbin for policy files; Django's permissions and `django-guardian` per object |
| Which rows | The worker scopes every query to the caller | Query by ID **and** owner, never ID alone; or Postgres row-level security |
| Values into code | Props escaped as JSON; Webflow's `{{` escaped before templating | Bound SQL parameters instead of string formatting |
| Secrets | Never in Webflow or the static output | Environment variables or a secrets manager; `SecretStr` keeps them out of logs |

The row rule is the one most often missed:

```python
@app.get("/orders/{order_id}", response_model=OrderPublic)
def get_order(order_id: int, user: User = Depends(get_current_user)):
    order = session.exec(
        select(Order).where(Order.id == order_id, Order.user_id == user.id)
    ).first()
    if not order:
        raise HTTPException(404)   # 404, not 403: don't confirm the record exists
    return order
```

Why the enforcement point sits in the backend rather than in database rules for this kind of runtime is covered in [Why Xano + AI + e-commerce](https://persephonepunch.github.io/crm-sync-setup/book/why-xano-runtime-as-a-service/#6-supabase-firebase-and-the-enforcement-point).

## 8. Why this is safe for AI-written code

AI changes two things at once: it writes more of the code, and it makes more of the calls. The pattern constrains both.

**Build-time refusals constrain what AI builds.** The content pipeline borrows the compiler's stance: when something disagrees, the build stops instead of guessing.

- The book's build stops if a document's front-matter category disagrees with the chapter it's listed under, and names the file.
- The FAQ pull refuses to write when Webflow holds 7 items and the repository holds 42, rather than deleting 35.
- The sync only ever rewrites the folders it generates; hand-written templates and components are never touched.

The rule that keeps these useful: **never relax a refusal to make a build pass.** A refusal an AI assistant can switch off is a suggestion, the same way a client-side check is.

**Runtime identity constrains what AI does.** An agent calls the same endpoints a person's app does, with a token. That token should carry only what the task needs, expire, and be checked on every call, as described in [Permissions for AI Agents](https://persephonepunch.github.io/crm-sync-setup/book/entitlement-strategy/#5-permissions-for-ai-agents-the-subject-the-incumbents-never-modeled).

Neither replaces the other. Memory-safe code still serves the wrong customer's data if the ownership check is missing, and a perfect ownership check can still be bypassed by a memory bug like Heartbleed.

## 9. Checklist

**Publishing**

- [ ] Each collection with detail pages has a hand template that lists its public fields.
- [ ] No field is public because of its type alone; internal notes are named and kept out.
- [ ] Every review switch maps to `noindex`, sitemap exclusion and no JSON-LD until it's on.
- [ ] Each fallback publishes less than the step above it.
- [ ] Components get props from `data-*` attributes only, and no secret ever appears in Webflow.

**Runtime**

- [ ] Every per-user read is scoped to the caller's own rows, and a miss returns 404.
- [ ] The interface hides by caps; the worker enforces the same caps on every call.
- [ ] Agent tokens are scoped to one task, expire, and are checked per call.
- [ ] No tag loads before the consent decision is replayed.

**Pipeline**

- [ ] Disagreements stop the build with a named file; no refusal has an override flag.
- [ ] TLS, encryption at rest and memory safety are confirmed for each platform, and none is cited as covering the logic layer.

## Sources

- [The CRM Sync book](https://persephonepunch.github.io/crm-sync-setup/book/), the Rust-book-style edition of this knowledge base.
- [The CRM Sync knowledge base](https://www.crm-sync.dev/pages/knowledge-base) on the Shopify storefront, published through Webflow and GitHub.
- [Permissions for AI, in plain terms](https://persephonepunch.github.io/crm-sync-setup/book/capability-not-perimeter/) · [Entitlement Strategy](https://persephonepunch.github.io/crm-sync-setup/book/entitlement-strategy/) · [Server-Side Function Tools](https://persephonepunch.github.io/crm-sync-setup/book/server-side-function-tools/) · [Consent Resolution on Higher-Order Load](https://persephonepunch.github.io/crm-sync-setup/book/consent-resolution-pattern/) · [Fragments on Any Frontend](https://persephonepunch.github.io/crm-sync-setup/book/fragments-any-frontend/)
- Heartbleed: [CVE-2014-0160](https://nvd.nist.gov/vuln/detail/CVE-2014-0160). rustls: [github.com/rustls/rustls](https://github.com/rustls/rustls).
