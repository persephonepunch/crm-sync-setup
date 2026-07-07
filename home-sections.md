# CRM Sync — Home Page Section Spec (design-sync.myshopify.com)

Build spec for the CRM Sync marketing home, section by section, for rebuilding in
Webflow. **Copy is verbatim.** `**bold**` marks emphasis spans (heavier weight in the
source). Faithful HTML mirror: **`home.html`** (same folder). Live (password-gated):
design-sync.myshopify.com.

**Design system (monochrome):** ink `#0a0a0a` on paper `#fff`; faint 44px grid ground;
sans body + `Roboto Mono` for eyebrows/kickers (uppercase, letter-spaced); hero `h1`
weight **100** with `**bold**` spans at 600; section `h2` weight 200; square borders,
no rounding; primary button = solid ink, ghost = outline.

---

## 0 · Header / nav  (sticky, blur)
- **Brand:** `CRM Sync` + logo mark — `https://crm-sync.dev/brand/crm-sync/logos/crm-mark-1600.png`
- **Nav links:** Difference (`#difference`) · How it works (`#segment`) · Mission (`#mission`) · Build vs buy (`#build`)
- **CTA (solid):** `Connect a segment` → `#segment`

---

## 1 · Hero  (`#hero`)
- **Eyebrow:** The CRM your ads and AI agents can use — not just your team
- **H1 (weight 100, bold spans):** Turn your Shopify Customer Segments into **Google Smart Bidding** audiences — consented and real-time.
- **Lede:** Your Shopify Email and Customer Segments are already free and GA4-linked. CRM Sync turns that **same segment** into a **tagged, consented, immediately-flagged conversion** for Google Smart Bidding — the part Klaviyo was never built for. One segment, two activations: email **and** ads.
- **Answer box** (left ink rule, grey fill) — label **IN ONE LINE**:
  CRM Sync is a Shopify-native, consent-first alternative to Klaviyo that turns your existing Shopify Customer Segments into Google Smart Bidding audiences — tagged with consented identity, valued with real revenue, and flagged the moment a conversion happens.
- **Buttons:** `Connect a segment → Smart Bidding` (solid → `#segment`) · `See how it beats Klaviyo` (ghost → `#difference`)

---

## 2 · Compare strip  (`#difference`) — 3 columns
| Eyebrow | Copy |
|---|---|
| vs HubSpot | HubSpot bolts AI onto the CRM you log into. **CRM Sync is the CRM an AI logs into.** |
| vs Attio | Attio is data-driven for your team. **CRM Sync is data-addressable for your agents.** |
| vs Klaviyo | Klaviyo emails the segment. **CRM Sync bids on it.** |

---

## 3 · The shift  (band)
- **Kicker:** The funnel got repriced
- **H2:** Marketing was built on the page view. The funnel now pays for the **consented login**.
- **Body:** Consent Mode v2, the decay of third-party cookies, first-party identity — the last two years quietly moved the funnel's unit of value from the anonymous page view to the consented, logged-in identity. A page view **depreciates**: cookie-fragile, anonymous, disposable. A consented login **appreciates**: durable, addressable, worth money — and the only thing an AI agent or an AI answer engine can act on. Most marketing apps still pivot on the page view. We build on the login.

---

## 4 · One segment, two activations  (`#segment`) + flow diagram
- **Kicker:** One segment, two activations
- **H2:** The **same** Shopify segment drives your email and your Google Smart Bidding.
- **Body:** Shopify Customer Segments are native, free, and GA4-linked. CRM Sync reads the **same segment live** (`customerSegmentMembers`), consent-gates it against Consent Mode v2, weights it by real revenue, and hands Google a **tagged, immediately-flagged conversion**. Klaviyo's segments are trapped in Klaviyo and never touch your Google bidding.
- **Flow diagram** (bordered; first node inverted/ink):
  - **Source · Shopify** — Customer Segment (native, free, GA4-linked)
  - **Activation 1 · Shopify Email** — Sends to the segment — free, built in.
  - **Activation 2 · CRM Sync** — Consent gate → revenue value → Google Smart Bidding (Customer Match + conversion value).
  - **Result** — Smart Bidding on the **tagged, consented, immediately-flagged conversion** — the bid optimizes on truth, not a latent anonymous page view.

---

## 5 · Mission  (`#mission`)
- **Kicker:** Mission
- **Pull-quote (left ink rule):** Make the **consented login** the unit of value across commerce — measured, biddable, and agent-addressable — on the infrastructure a store already owns.
- **Body:** A consented login is a real person who said yes, signed in, and can be acted on — by your team, and by their agent. CRM Sync makes that consented identity fresh, portable, and usable at the moment of decision, so a store's own data drives its ads, its AI-answer visibility, and its agentic checkout — without a million-dollar CDP or a lock-in CRM.

---

## 6 · Use what you already have  (band)
- **Kicker:** Use what you already have
- **H2:** Shopify already ships a built-in **Email tool and a CRM** — Customer Segments, connected to Google.
- **Body:** You're paying Klaviyo for what Shopify hands you for free. **Take advantage of the connection.** CRM Sync activates your native Shopify Email and Customer Segments for Google Smart Bidding — so one consented segment drives **both** your email and your ads, GA4-linked, with nothing new to build.

---

## 7 · Governance, built in  (band, two paragraphs)
- **Kicker:** Governance, built in
- **H2:** Consent and data rights aren't a bolt-on — they're wired into the **activation plane**.
- **Body 1:** **Customer data redaction.** Delete and redact requests — GDPR/CCPA right-to-be-forgotten — are honored at the data plane, so a redaction instantly removes that customer from every audience and Smart-Bidding activation. Not chased across a dozen tools.
- **Body 2:** **Consent updates live in the preference history — and tag the Google Signal.** Every change a customer makes is written to their user preference history, and that consent state tags the **Google Signal** (Consent Mode v2) that gates Smart Bidding. A CRM will store the history; it won't propagate it to Google. Here, activation only ever runs on **current** consent.

---

## 8 · Agentic commerce, enabled  (band)
- **Kicker:** Agentic commerce, enabled
- **H2:** The login is connected to **agentic carts** and Google-powered search checkouts.
- **Body:** When an AI agent shops for a customer, the **consented login carries into the cart** — with **A2A** and **AP2 grants and permissions** enabled. A scoped mandate governs every agent action: what it may buy, the spend cap, the expiry — and settlement runs on real payment rails. Google-powered search checkouts transact on the **same consented identity under the same mandate**, not a cookie or an anonymous session. Your CRM has no verb for this; CRM Sync was built for it.

---

## 9 · Point of difference  (band) — 5-cell grid
- **Kicker:** Point of difference

| # | Heading | Copy |
|---|---|---|
| 01 | Consent-first, not page-view-first | We optimize the appreciating asset — the **consented login** — while marketing apps still pivot on the depreciating page view. It's the shift the funnel already made; most tools haven't. |
| 02 | One segment, two activations — GA4-linked | Your Shopify segment drives Shopify Email (free) **and** Google Smart Bidding (CRM Sync) from a single, consistent definition. Klaviyo's segments never touch your Google bidding. |
| 03 | Smart Bidding on the tagged, immediately-flagged conversion | Consented identity + real revenue + real-time flag → the algorithm **bids on truth**. Everyone else feeds it a latent, anonymous, page-view-inferred conversion. |
| 04 | Agent-addressable and AEO-ready by construction | The same consented data an **AI answer engine cites** and an **agent transacts on** under a scoped mandate. Page view → consented login → agent-transactable is one continuous line. |
| 05 | Productized, not DIY | The "$300 Salesforce you built yourself" — done and maintained, including the consent, compliance, integration, and agent tail those viral posts quietly skip. |

---

## 10 · The future CRM  (band) — compare matrix
- **Kicker:** The future CRM
- **H2:** Today's CRMs **organize** customers. The future CRM **activates** them.
- **Body:** HubSpot and Attio store your customers; Klaviyo emails them. None turn a consented segment into a Smart-Bidding conversion, an agent action, or an AI-answer citation — and none ride the free Shopify data you already have.
- **Matrix** — columns: **Capability** · **CRM Sync** *(the future CRM — highlighted)* · HubSpot · Attio · Klaviyo. CRM Sync column = ✓ on every row; the other three = — (none).
  1. Consent as a runtime primitive (not a suppression checkbox)
  2. One segment → email *and* Google Smart Bidding
  3. Smart Bidding on a tagged, consented, real-time conversion
  4. Agent-addressable under scoped mandates
  5. AEO / answer-engine grounding
  6. Nothing to build — activates your existing Shopify segments
  7. Consent history that tags the Google Signal (Consent Mode v2)
  8. Agentic carts + Google search checkout (A2A / AP2 grants & permissions)
- **Foot-note:** The flexibility that makes Attio powerful is the flexibility that makes it hard to set up. CRM Sync has **no data model to configure** — it rides the Shopify Customer Segments you already have, so time-to-value is measured in minutes, not a rollout.

---

## 11 · Build vs buy  (`#build`) — bordered callout
- **Kicker:** Can I just build this myself?
- **H2:** Everyone's building the **$300 Salesforce**. Here's the 90% the posts skip.
- **Body:** A weekend build gets you a table and a webhook. It does not get you the tail that actually carries the risk — and that tail is the moat:
- **List (— dashes):**
  - Consent evaluated at the moment of action, not wired once
  - Mandate-scoped authority for AI agents (spend, scope, expiry)
  - Customer Match / Smart Bidding on a tagged, flagged conversion
  - AEO-grounded structured data an answer engine can cite
  - Integrations kept current as Shopify & Google ship changes
  - Audit trail, revocation, and someone on call
- **Closing:** We already built it — including all of the above. You get the outcome without becoming the maintenance team.

---

## 12 · Final CTA  (bordered band)
- **Text:** Build the funnel on the **consented login** — not the page view.
- **Buttons:** `Connect a segment` (solid → `#segment`) · `Get the app` (ghost → `https://crm-sync.dev/get`)

---

## 13 · Footer
- **Links:** Difference (`#difference`) · How it works (`#segment`) · Mission (`#mission`) · Docs (`https://persephonepunch.github.io/crm-sync-setup/`)
- **Note:** Shopify-native, consent-first. Works with Shopify Email & Customer Segments (free), GA4, and Google Smart Bidding. Not affiliated with Klaviyo, HubSpot, or Attio; names are used for comparison only. Klaviyo leads on advanced lifecycle email, SMS, and deliverability — CRM Sync is for stores whose email is served by Shopify and whose growth is paid, AI-answer, and agent-led.

---

### Page meta (SEO)
- **Title:** CRM Sync — Turn Shopify Customer Segments into Google Smart Bidding
- **Description:** CRM Sync is a Shopify-native, consent-first alternative to Klaviyo that turns your existing Shopify Customer Segments into Google Smart Bidding audiences — tagged with consented identity, valued with real revenue, and flagged the moment a conversion happens.
