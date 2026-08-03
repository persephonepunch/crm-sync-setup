---
title: "The AI Dialog — Terms for Designers and BAs"
description: "Plain definitions of the words the AI-first architecture keeps using — silent failure, event bus, hydration, judgment, mandate, system of record, privacy streaming — with the parameters each framework actually evaluates. Written for the people who ship the work but didn't pick the vocabulary."
canonical: https://persephonepunch.github.io/crm-sync-setup/ai-dialog-terms.html
category: "Global"
date: 2026-08-03
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/AI-DIALOG-TERMS.md
---
# The AI dialog — terms for designers and BAs

**Who this is for:** the designer who owns the page and the analyst who
owns the number, sitting in a meeting where engineers say "it fails
silently on the event bus" and everyone nods. This page is the context
nobody hands you. Each entry: what the word means, plainly, and — where a
term is a *framework* — the parameters it actually evaluates, because a
framework without parameters is a vibe.

**An honesty note:** some of these terms are industry-standard (system of
record, event bus, hydration). Some are ours (judgment-based loading, the
helmet, chain pricing). Each entry says which. Definitions are written to
be used in a meeting, not to survive a computer-science exam.

---

## 1. The moving parts

**Fragment** *(ours)* — a section of a page, authored once in Webflow,
that other platforms display verbatim by fetching it. Not a copy: a feed.
Edit the original, and every platform shows the edit within a minute.

**Symbol** *(Adobe's design term; Webflow's legacy name for what it now
calls Components; our cross-platform usage)* — in the design tools
(Illustrator, XD, Animate), a reusable element defined once: edit the
symbol, every instance updates. Webflow adopted the word, then renamed
its version **Components** — same idea, nav and footer defined once.
Developers know the word differently: in Ruby, a symbol (`:name`) is an
**immutable, unique identifier** — a name interned once, so every
reference points to the same single thing and comparison is instant;
JavaScript's `Symbol` primitive makes the same guarantee. The two senses
are secretly one: a symbol is **one canonical identity that is referenced
everywhere and copied nowhere.** That is exactly the cross-platform usage
in this stack — the nav's DOM id is the symbol; AEM, Shopify, and every
other consumer hold references to it, never copies of it.

**Hydration** *(industry)* — the moment JavaScript "wakes up" static
HTML: the page paints first as an inert document, then scripts attach the
working parts — the login avatar, the consent buttons, the live prices.
"Conversions that hydrate" means the conversion signal exists **only if
that wake-up step runs and succeeds.** Nothing about the visible page
tells you whether it did — which is why the term matters to a BA: the
page can look perfect while the number it was supposed to send never left
the browser.

**Event bus** *(industry)* — the in-page announcement channel. When
something meaningful happens — consent granted, user signed in, a
purchase completed — an *event* is announced, and any listening component
reacts. It replaces the old world where every signal was assumed from a
page view. The catch: an announcement no one wires up is never made, and
there is no error for silence.

**Function, not SaaS-bound** *(ours, as a distinction)* — a small piece
of server-side logic that runs on the edge (a Cloudflare Worker) and
belongs to *you* — as opposed to a feature that lives inside a SaaS
vendor's product and works only while you subscribe. A SaaS feature is
rented behavior; a function is owned behavior. The practical difference
appears the day you leave: functions travel, features don't.

**A function on the server vs. an if/then on the client** *(the
distinction under everything)* — an if/then on the client is a decision
made inside the visitor's browser: it evaluates whatever the browser
happens to know, it can be skipped by an ad blocker or a script that
never loaded, and when it fails, it fails silently. A function on the
server runs where the record lives: it cannot be skipped by the browser,
it consults the authoritative row rather than a local guess, and when it
fails, it fails *loudly* — a status code, a log line, an alarm. The
division of labor follows: **presentation may be decided on the client;
authority, money, and consent must be decided by a server function.**
Every silent failure in §5 is, at root, an authority decision that was
left to a client if/then.

**The helmet** *(ours)* — the first script on every page. It loads the
protective layer before anything else: consent defaults (denied until
granted), the event bus, and then — only as needed — everything else.
Named for what it does: nothing else gets on the field without it.

---

## 2. The decision layer

**Intent** *(framework — parameters required)* — what a subject is
trying to do, stated precisely enough to be judged. Its parameters:
**subject** (which human or agent), **target** (which page, section, or
record — usually an address like `#segment-hero`), **scope** (what may
change if it succeeds), and **horizon** (when the intent expires).
An intent without these four is a wish.

**Judgment** *(framework — parameters required; ours)* — a decision made
at the moment of action instead of configured in advance. The six
parameters every judgment in this architecture evaluates:

1. **Consent state** — does permission exist *right now*?
2. **Entitlement row** — is this subject granted this capability on this
   asset? (A grant is a database row: insert to grant, delete to revoke.)
3. **Demonstrated need** — does the page or task actually require what is
   about to load or run?
4. **Mandate scope and cap** — under whose authority, bounded by what
   spending or action limit?
5. **Freshness** — is the record being consulted still inside its truth
   window (a price older than a minute is not a price)?
6. **Ledger obligation** — will the outcome be recorded where an audit
   can find it?

**Judgment-based loading** *(ours)* — the helmet applying those
parameters to JavaScript: each script loads only when the judgment
passes, instead of firing because someone configured a trigger last
quarter. The same idea applied to integrations is the **AI tool runner**:
a tool call happens only when the row says yes, now, under this mandate.

**Mandate** *(industry term, our parameters)* — the signed permission an
AI agent acts under. Parameters: scope (what it may do), cap (how much it
may spend), rail (which payment method), expiry, and revocation (one row
deleted, agent stopped).

---

## 3. The record

**System of record (SoR)** *(industry)* — the one place a fact is
authoritative: writes land there first, disputes resolve there. Here,
that is Xano — the rows for identity, consent, entitlement. Everything
else — every page, cache, CRM copy, share card — is a **projection**: a
display copy that can be regenerated at any time precisely because it is
never the original.

**Latent collision** *(ours)* — a decision made now against a record
that arrives later: the ad bid placed on last week's inferred conversion,
the agent acting on a permission revoked an export ago. Latency turns
records into liabilities at exactly the moment they're consulted. The
cure is structural, not heroic: the record and the decision must share a
clock.

---

## 4. The money

**Chain pricing vs. SLA pricing vs. the ceiling tier** *(ours)* — three
ways to be charged for your own data. **SLA pricing**: the data sits in
the vendor's silo and you pay for the storage plus the promise of access.
**The ceiling tier** (Zapier, n8n, Airtable): data is metered *per
motion* with a monthly ceiling — the busier your business, the more your
own data costs, and the month you grow is the month the workflow pauses.
**Chain pricing**: the record stays in your system of record, and fees
attach only where operated work happens. The tell: ask what happens at
the ceiling, and what happens when you leave.

**Boundary before the fee** *(ours)* — consent and entitlement are
evaluated before any commercial event and independent of the plan. No
fee unlocks a bypass; no lapsed invoice switches the gate off. Trust is
not a tier.

---

## 5. The failure, and the fix

**Silent failure** *(industry term, sharpened)* — a failure with no
alarm, because the metric everyone watches keeps moving. The canonical
case: a client-side-only Shopify store. Checkout is Shopify-hosted, so
**revenue never stops** — while the analytics events, plugin writes, and
consent history quietly go dark. Orders complete; the data plane
starves; the damage books as "market conditions" weeks later. Rule of
thumb for any review: *a failure that pays out at checkout has no alarm
attached to it — go looking.*

**Privacy streaming** *(ours)* — the course correction: logging where
every event is consented **before** it fires, redacted at the source,
streamed in real time, and ledgered on arrival. Four revenue effects:
bidding algorithms get true conversions instead of inferences; budget
follows observed signals; a ledgered stream that stops is *visible* (the
alarm silent failures lack); and a consented stream is the only one that
keeps flowing as browsers and regulators tighten. Unconsented logging is
a signal with an expiry date.

**Arrow, not line** *(ours)* — every connection in the system points one
way and says who moved, toward what, under whose judgment. Four verbs
cover all of it: rails **pull**, planes **hydrate**, events **emit**,
tools **call**. If a diagram shows a line instead of an arrow, ask which
direction the data actually flows — the answer is the audit.

**The hash** *(industry mechanism, our framing)* — the `#section-name`
at the end of a URL. One id is four addresses at once: where a fragment
is extracted from, the deep link a human lands on, the target a share
link is minted against, and the `@id` an answer engine cites. The same
address resolving identically for crawler, human, and agent is the
cheapest verifiable claim on the web.

**AEO** *(industry: answer-engine optimization)* — being findable and
*citable* by AI answer engines, not just ranked by search. In practice:
structured data with stable addresses, so when an engine answers a
question it can point at your exact section — and an agent can act on
what it cited.

---

## 6. The wrap — security, privacy, and AI judgment on demand

Read back through the entries and they collapse into three sentences.

**Security** is not a product here; it is the shape of the arrows — every
connection one-directional, every arrow authority-checked against a row,
no standing credentials parked anywhere for an attacker to live in.
**Privacy** is not a checkbox; it is the order of operations — consent
evaluated before any signal fires, redaction at the source, the gate
standing prior to and agnostic to any fee. And **AI judgment on demand**
is the mechanism that makes both real: the six parameters of judgment,
evaluated at the moment of action — load time for a script, call time for
a tool, render time for a price — instead of configured in advance and
trusted to stay true.

That is the whole dialog. When the meeting uses these words, this is what
they are supposed to mean — and if a vendor uses them without parameters,
now you know what to ask.

---

*Companion: [Fragments on Any Frontend](./fragments-any-frontend.html) —
the architecture these terms come from, demonstrated live on AEM and
Shopify.*
