---
title: "The spec is the source — a writing layer for designers and analysts"
description: "Configuration files are the specification, and the only part of a build a non-developer could plausibly own. Write the intent in plain language, generate the config from it, check it against closed vocabularies — and get the developer and compliance documentation from the same file. Includes a vocabulary for permission, entitlement, mandate, key custody and chain of thought, and why CSR, SSR and ISR say nothing about where authority lives."
canonical: https://persephonepunch.github.io/crm-sync-setup/spec-is-the-source.html
category: "Specs"
date: 2026-09-07
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/SPEC-IS-THE-SOURCE.md
licence: CC-BY-4.0
---
# The spec is the source

Every application in an estate is already configured by a small text file — a `.toml`, a block of
frontmatter, a manifest. Those files decide what a thing may touch, where it appears and how it
ships. They are treated as developer housekeeping, and they are the wrong thing to treat that way:
**they are the specification, and they are the only part of the build a non-developer could
plausibly own.**

This proposes writing them the other way round. A person describes what they want in plain
language, in a document; the configuration is generated from it; the guarantees are checked on the
way through. The spec stops being a description of the build and becomes the thing the build is
made from.

Designed to be authored by a designer or a business analyst, and to produce — from the same file,
without a second pass — the documentation a developer and a compliance reviewer each need. Three
properties come with it because they are what describing a capability properly produces:
**global, agentic, and scaling on demand.**

---

## Vocabulary

Six terms this depends on, several of which are used loosely elsewhere. A document arguing for
closed vocabularies should start with its own.

**Permission** — what an *application* may reach. Declared in a manifest or a binding, granted at
install, refusable at runtime. A property of the software, not of the person using it.

**Entitlement** — what a *subject* may see or do. Attached to a person or an account, usually
granted by a purchase, a plan or a role. An application may be permitted to read orders while a
particular customer is not entitled to see a particular one.

**Mandate** — what an *agent* may do on someone's behalf, and within what bounds. Scope, spend cap,
expiry, counterparty, revocation — carried as a signed document rather than a session, so a party
that never spoke to you can verify it. A role says who someone is; a mandate says what a piece of
software may do for them, until when, and up to how much.

**Rules-based entitlement** — entitlement decided by evaluating conditions at the moment of the
call, rather than looked up as a static assignment. Role-based access answers "what is this
person"; rules-based answers "given this subject, this context, this consent state and this time,
is this action allowed" — and produces a different answer for the same person an hour later, which
is the whole point.

**Key custody** — where a credential lives and who can produce it. Not the same as secrets
management: that assumes compute you control and an identity your platform granted. Custody is the
prior question of whether there is anywhere at all to hold a key — and for a template or a visual
site, there is not.

**Chain of thought** — an agent's own account of its reasoning. Useful for diagnosis and for showing
a person why something was proposed. It is **not** authority and must never be an input to a
decision: it is unverifiable text produced by the party being restricted. The mandate governs what
may happen; the chain of thought only explains what was intended.

### Data rendering, and the word "server"

Three rendering terms get used as if they said something about where authority lives. They do not.
Each describes only where HTML is assembled.

| Term | Where the HTML is assembled | What it says about keys, rules and evidence |
|---|---|---|
| CSR | In the browser, after JavaScript loads and fetches data | Nothing. A caller that does not execute scripts receives an empty shell |
| SSR | On your deployment, per request, then hydrated in the browser | **Nothing.** The process is discarded after the response — no clock, no shared state, nowhere for a credential to persist |
| ISR | Pre-rendered and regenerated on a schedule or on demand | Nothing, and it adds staleness by design — the output is a cached artefact between regenerations |
| Liquid | On the platform's servers, per request, with no hydration | Nothing — and note that the server is *theirs*. Rendering happens server-side while you have no server, which is exactly why the template cannot hold a key |

**"It renders on the server" is not "there is a server."** The confusion runs both ways. A framework
doing SSR sounds like it has a server and has only a request. Liquid sounds like it has none and is
in fact rendered by a very capable one — belonging to the platform, unavailable to you for anything
but rendering. The question is never where the HTML was assembled. It is whether something durable
exists that can hold a key, keep a clock, evaluate a rule the same way for every caller, and write
a record.

---

## Why now, and not five years ago

Two things changed at once. Visual platforms became genuinely capable — a site or a data model can
now be built by someone who does not write code, and it is a real application rather than a
prototype. And a model can now read a paragraph of intent and produce the exact configuration a
machine needs.

What has not changed is the layer between them. It is still written by developers, in developer
vocabulary, as a side effect of building. Which puts the one artefact both a business analyst and a
model can read in the hands of the group least interested in it being readable.

**The failure this prevents.** A model asked to change a configuration file will do it,
confidently, and the file is where the guarantees live — what may be reached, which environment
ships, which permission is granted. Nothing about the format resists a plausible-looking wrong
answer, and a config that is edited rather than generated has no statement of intent to check the
edit against. The answer is not to keep models away from these files. It is to make the intent the
source and the file the output, so a wrong edit contradicts something written down.

---

## The lifecycle, in the words a person would use

| Stage | The question, as asked | What the writer produces | What it generates |
|---|---|---|---|
| Intent | What should this do, and who is it for? | A paragraph, and the one sentence that says when it is working | The document's own header — title, owner, status, date |
| Surface | Where does it appear? | A named place: this page, this collection, this block, this email | The route, the template binding, the block registration |
| Audience | Who may see it, and who may change it? | Named groups in plain words — customers, staff, an agent acting for a customer | Permission scopes and entitlement grants |
| Facts | What does it need to know? | A list of named things — price, availability, the date consent was given | Fields, types and the table or metafield they live in |
| Proof | How would we show it worked? | One checkable statement per claim | The test, and the evidence record it writes |
| Change | What happens when this needs updating? | Who may edit it, and what must be re-checked | The version stamp and the review gate |

Nothing in the third column requires knowing what a build is. Everything in the fourth is what a
developer would otherwise have written by hand, in a file the writer never sees.

### The same thing, in both languages

What the writer writes, under **Audience**:

> Customers who have bought before can see the loyalty balance on their account page. Staff can see
> it for any customer. An agent acting for a customer can read it but never change it.
>
> If someone withdraws marketing consent, the balance stays visible to them and stops being usable
> for targeting.

What is generated:

```
audience:
  customer:      read  · own record · requires prior_purchase
  staff:         read  · any record · requires role:support
  agent:         read  · own record · never write

on consent_withdrawn(marketing):
  visible: true
  usable_for_targeting: false
```

Every value to the left of a colon comes from a fixed list. There is no free text, which is the
whole reason this can be generated reliably. The second block is not shown to the writer — it is
shown to the reviewer, the auditor and the machine, and because it was generated from the paragraph
above it, a disagreement between the two is a detectable error rather than an argument about what
was meant.

---

## Three things a template cannot decide

Client-rendered template code cannot hard-code dynamic utility, and it cannot hard-code permission.
Three facts in particular must be produced by a server resource the agent can reach — rendered
there, deployed there, and answered per request.

| Fact | Why it cannot be baked in | What it needs |
|---|---|---|
| **Location** | Market, jurisdiction, tax treatment, eligibility and availability all differ by where the buyer is — and a machine caller arrives with none of the browser signals a page would use to guess | Resolved server-side per request, and stated in the response rather than inferred |
| **Entitlement** | What this subject may see or do is not a property of the page. Anything a template can decide, a reader can read — and anything client script decides, a reader can change | Decided where the record is, returned as an answer, never as a rendering instruction |
| **Timeline** | Consent granted when, price valid until when, mandate expires when, what the price was thirty days ago. All of it moves without anyone visiting | Held as a record with time in it, answerable retrospectively |

### Show and hide means nothing to an agent

A conditional that hides an element, a class that sets it to display none, a template branch that
renders one panel instead of another — all of it is presentation. An agent does not render, so a
hidden element is not a hidden element. It is an available one. A price styled out of view still
shipped, and a section behind a client-side check was in the payload the whole time.

Which matters more than it sounds, because conditional visibility *was* the permission model for
twenty years: you could not click what you were not shown. That assumption held for exactly as long
as every caller had eyes. **For a machine caller, the only permission that exists is what the server
declined to return.** Not what was hidden, not what was disabled, not what sat behind a modal.

This is also the practical test for what may live in a template at all. If getting it wrong is a
visual inconvenience, it can be decided in the theme. If getting it wrong means a person saw a
price they should not have, an agent acted on an entitlement that had lapsed, or a jurisdiction got
the wrong tax treatment, it belongs on the server — and the response has to state it, because there
is nobody on the other end to look at anything.

---

## What the bundle is actually for

A theme cannot hold a secret. Anything in a template is readable by anyone with access to it, and
much of it ships to the browser as a matter of course. The client data layer is the same by
construction. So a theme can only ever call endpoints that are safe to call anonymously. It cannot
authenticate to anything, on any plan, with any amount of care. The same is true of a visual site
builder's pages.

Both platforms solved it the same way: **installing an application mints a credential.** The
application holds identity, the secret lives on a server the browser never sees, and the install
produces a token scoped to one store or workspace, revocable by uninstalling.

### Why this is unfamiliar, and specifically unfamiliar to enterprise teams

Key custody is not secrets management, and the difference causes the argument. An enterprise team
already has a good model: secrets live in a vault, an application fetches them at runtime, and its
right to fetch comes from an identity the platform granted — a managed identity, an instance role,
a service principal.

**That model assumes compute you control.** It is how the identity gets attached in the first
place. A theme and a visual site have no such compute: nothing runs that you own, so there is no
identity to attach and nowhere to fetch to. The vault is not the wrong tool — there is simply
nothing on that side of the line to hold a credential.

An enterprise team hears "the credential is created by the vendor's install flow" and reasonably
flinches. The answer is that its reach was declared in a reviewable file before it existed, and
revoking it is an uninstall rather than a ticket.

So the bundle's real utility is **key custody, not distribution**. It is the only mechanism by
which a surface that structurally cannot hold a key acquires an authenticated identity. Everything
else the bundle does — versioning, review, rollback — is ordinary software hygiene available
elsewhere. This part is not, and it is why both platforms converged on an identical model without
coordinating.

It also explains a property that otherwise looks like a coincidence: the surfaces that cannot hold
secrets are the same ones that cannot execute arbitrary code. A rendering layer that anyone may
edit must be unable to do damage. The bundle is not a workaround for that limitation. It is the
paired half of it.

---

## "But we need a modern build"

The rebuild case is two claims wearing one coat: *we need modern build tooling*, and *we need
somewhere to manage data logic and restrictions*. Both are fair. Neither requires a component
framework, and they come apart cleanly.

**The tooling half is solved, and it is not a framework.** A vanilla theme build with Vite gives
TypeScript, code splitting, tree shaking, hot reload and a proper asset pipeline. No framework, no
hydration, no component runtime, no second rendering model competing with the template. The theme
stays as it is and the JavaScript it loads is built like software rather than pasted like a snippet
— which is the actual complaint behind most "the theme is unmaintainable" arguments. Code splitting
matters more here than in a framework, not less: a theme loads on every page of a storefront.

**The data-logic half is what this document is about.** Restrictions, eligibility, what a subject
may see, what an agent may do — the part that was genuinely hard, and the honest reason people
reached for a framework, because at least it gave somewhere structured to put it. It was expensive
because it was bespoke. Generated from a document against a closed vocabulary, it stops being
bespoke: the logic is the same on every surface because it came from one source, it is checkable
because the intent is written beside it, and it is enforced where it has to be rather than wherever
a component happened to sit.

What is left of the framework case is **component ergonomics** — a genuine preference held by good
engineers for good reasons, but a preference rather than a capability, and charged to the Update
stage. Take the build tooling without the framework, and the restrictions from the specification
rather than from components, and the rebuild is left arguing a developer experience against a lead
time.

---

## Four rules that make it work

1. **Closed vocabularies, everywhere.** Every generated value comes from a fixed list — audiences,
   surfaces, permissions, field types. A model asked to pick from twelve options is reliable; a
   model asked to invent a configuration key is not. This is the single design decision the whole
   approach rests on.
2. **One direction only.** The document generates the configuration. Nothing edits the configuration
   directly, and a change made there is overwritten on the next generation — which sounds harsh and
   is the point: it means the document is always what is running.
3. **Generated files are checked, not trusted.** Output is validated before it ships, and a value
   outside its vocabulary fails the build rather than reaching production. The writer never has to
   be right about syntax, only about intent.
4. **The proof section is not optional.** A stage with no checkable statement produces no test, and
   a claim with no test is where the silent failures live. Making it a required heading is the
   cheapest governance available.

---

## The framework, named

| Property | What the writer states | What it produces | Why it cannot be added later |
|---|---|---|---|
| **Global** | Which markets this is for, and what differs in each — price, availability, tax treatment, language, required disclosures | Per-market variants, locale routing, the feed's country fields, translated surfaces, the jurisdiction the consent record is judged against | A capability written for one market has one market's assumptions baked into every surface it touched. Retrofitting is not translation; it is finding every place a single price or a single rule was assumed |
| **Agentic** | Who may act, on whose behalf, within what bounds — and what proof exists afterwards | The mandate shape, the rules evaluated per call, the machine-callable surface, the evidence record | Permission implied by an interface evaluates to nothing for a caller with no eyes. A capability built for people only is not partially agent-ready; it is closed to them |
| **Scale on demand** | What must be true at the moment of asking, rather than prepared in advance | Composition per call, enrichment only where requested, cost that tracks decisions rather than traffic | Pre-computation is a shape, not a setting. A capability designed around a nightly job has that job's staleness written into everything downstream |

They arrive together because they are the same act. A writer stating which markets, who may act, and
what must be true at the moment of asking has described all three without being asked to think about
any of them as architecture.

---

## Documentation is the by-product, not a deliverable

Every project promises documentation and produces it once, at the end, in a format nobody reads
twice. That is not a discipline problem. It is that documentation which describes a build is a
second copy of the truth, and second copies drift.

Turn the direction round and the problem disappears. **The document generates the configuration, so
the document is what is running.** A stale specification produces a stale configuration, which fails
its own check — drift stops being something that must be noticed and becomes something that breaks
a build.

Which is why compliance gets a real artefact rather than an export: one document per capability,
stating what was intended, who was granted what, and how it is proved, in the language of the
obligation rather than the implementation, and current by construction. The developer's half is the
same file read differently — the generated output, the vocabularies it was checked against, and the
tests the Proof section produced.

---

## What is simple, and what is not

**Simple.** Writing one document per capability: six headings, each a question already asked in a
kickoff, no syntax to learn because the vocabularies constrain the answers. Changing it: edit the
paragraph, regenerate, and the change is visible as a difference in both the intent and the
configuration at once. Reviewing it: a reviewer reads the prose and the generated output side by
side, and a disagreement between them is a defect rather than a discussion.

**Not simple, and not skippable.** Choosing the vocabularies — the lists of audiences, surfaces,
permissions and field types. A week of decisions, made by people who understand the estate, and the
whole project, because a generator pointed at an open vocabulary produces exactly the confident
wrong output this exists to prevent. And writing the generator and the checks: real engineering,
owned by engineers, and the reason this is not a threat to them.

The trade, stated plainly: **a week of decisions once, in exchange for every capability after it
being describable by the person who wants it.**

---

## What each group gets

| Group | What changes for them |
|---|---|
| Business analysts | The specification is the deliverable, and it is executable rather than a document that becomes stale the week after handover |
| Designers and content | A surface and its rules are described in the same document as the content, by the person who owns the content, without a ticket |
| Developers | Stop hand-maintaining configuration that restates a decision made elsewhere; own the generator, the vocabularies and the checks — the part that needed engineering judgement all along |
| Audit and compliance | One document per capability stating what was intended, what was granted and how it is proved — in the language of the obligation rather than the implementation |

The developer row is the one to lead with in a sceptical room. This does not remove engineering from
the process; it moves it from transcription to design. Somebody has to build the generator, choose
the vocabularies, and write the checks that make a wrong document fail loudly — and none of that is
work a business analyst can do.
