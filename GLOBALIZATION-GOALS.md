# Globalization — Goal Checklist (Pending / Review State)

Status board for the globalization parameters of the chat-commerce platform
(chatbot, Knowledge Base, market storefronts). Each entry is a **goal** with
its current state. States:

- **[LIVE]** — deployed and verified in production
- **[REVIEW]** — mechanism live; content awaiting the human review pass
  (drafts never ship)
- **[PENDING]** — specified, not yet wired
- **[PARKED]** — specified and deliberately deferred until scope is defined

> Companion to the Chatbot / Globalization KB Functional Spec (private
> implementation repo) and the CRM Sync Functional Spec in this repo.
> Security custody for all credentials referenced by these rails follows
> `AGENCY-HANDOFF.md` (Interactive Key Rotation).

---

## 1. Language understanding (shopper input)

- [x] **[LIVE]** Multilingual product search — cross-lingual embeddings
      (multilingual model, 1024-d) over the English catalog; verified
      matrix: **en, fr, es, de, ja, ko, zh, th** (e.g. "souris" / "Maus" /
      "마우스" → mice; "teclado" / "キーボード" → keyboards).
- [x] **[LIVE]** Unicode-safe query handling — CJK/Thai queries route to
      semantic retrieval by design; an unparseable query can never degrade
      to "browse all".
- [x] **[LIVE]** Multilingual KB retrieval — bilingual+ vector index with a
      **mandatory locale filter** (no cross-locale bleed), persona-resolved
      (geo + language).

## 2. Locale detection (consent posture)

- [x] **[LIVE]** Fallback chain: user profile signals → geo-IP
      (edge-injected) → browser language → default.
- [x] **[LIVE]** Consent-free by construction: locale never derives from
      advertising identifiers; ad/analytics signals remain separately
      consent-gated (Consent Mode v2).

## 3. Content localization (authored output)

- [x] **[LIVE]** Per-locale override model — `draft → reviewed → published`
      lifecycle with full audit log; **drafts never ship** to any surface
      (site, vectors, builds).
- [x] **[LIVE]** First reviewed override in production: en-CA metric pass
      (SI-first units on the Canada build only).
- [ ] **[REVIEW]** fr-CA Knowledge Base corpus — translations exist for the
      chatbot's vector index; the human review pass that persists them as
      publishable override rows is pending. The moment rows are reviewed,
      fr-CA pages ship automatically (no engineering step).
- [ ] **[PENDING]** Chat answers in the shopper's language beyond fr —
      retrieval is already cross-lingual; the machine-translation
      answer-out step (cached per article + language) is specified, not
      wired.
- [ ] **[PENDING]** German + APAC content reviews — same override lifecycle
      as fr-CA, per market activation order.

## 4. Market storefronts (publishing)

- [x] **[LIVE]** Market-segmented builds — one repo, `MARKET` variable
      selects the content slice (overrides, locale routes, FAQ locale
      filter); a new market deploy = one variable on a new Pages project.
- [x] **[LIVE]** Locale route mechanism — reviewed translations render as
      `/<locale>/knowledge-base/…` pages through a locale-aware listing
      template.
- [x] **[LIVE]** Self-publishing content loop — content changes upstream
      are fingerprint-detected and rebuild every market site automatically
      (~15-minute cadence, change-gated, no human steps).
- [x] **[LIVE]** FAQ locale segmentation — each market ships only its
      locales (e.g. UK-specific answers no longer appear on the US site).
- [ ] **[PENDING]** Per-market product visibility — all products currently
      ship to all markets; a market-visibility column is the defined
      mechanism.
- [ ] **[PENDING]** Canada market activation — rail is ready end-to-end;
      awaits the fr-CA review pass (§3) and a go decision.

## 5. Commerce-platform surfaces

- [ ] **[PARKED]** Shopify-rendered surface localization (checkout,
      notification emails) via the Translations API (resource GID +
      enabled ISO locale + content digest). Fully specified including
      scope additions and the merchant re-consent step; deferred until the
      omni-channel scope is defined.
- [ ] **[PENDING]** Edge page translation option (streaming HTML rewrite +
      cached machine translation) — proven pattern on a sibling production
      property; candidate for instant market previews ahead of content
      review.

## 6. Reporting & governance

- [x] **[LIVE]** Localization audit trail — every override change recorded
      (actor, source, status transition).
- [ ] **[PENDING]** Per-market language coverage in the quarterly
      Security-Scaling Report (`AGENCY-HANDOFF.md` §G): % corpus reviewed
      per active locale, machine-vs-reviewed answer ratio, locale-detection
      fallback distribution.

---

*State legend is normative: anything marked LIVE has been verified in
production (language matrix, override rendering, publish loop). This board
is updated when goals change state; the source-of-truth requirements live in
the functional specs.*
