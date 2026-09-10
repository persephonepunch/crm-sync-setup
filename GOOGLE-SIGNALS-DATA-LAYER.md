---
title: "When Google Signals was deprecated, what changed for data layer funnel requirements"
description: "Two dated changes — Signals out of GA4's reporting identity (12 Feb 2024) and Signals stripped of ad authority in favour of Consent Mode ad_storage (15 Jun 2026) — turned five optional data layer fields into required ones. Challenge, Solution and Benefit for each, with the event contract, the verification steps, and an honest account of what no tagging change can recover."
canonical: https://persephonepunch.github.io/crm-sync-setup/google-signals-data-layer.html
category: "Specs"
date: 2026-09-10
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/GOOGLE-SIGNALS-DATA-LAYER.md
licence: CC-BY-4.0
alternativeHeadline: "Signals was a subsidy. The data layer now pays for identity, consent and reach."
verified_on: 2026-09-10
verified_by: published-sources
method: "Platform behaviour and dates taken from Google's published changes and contemporaneous industry write-ups, cited inline. The event contract and the verification procedure are design recommendations from the CRM Sync stack, not a measured claim about any particular property — Section 10 states how to check each one against your own container."
review_by: 2027-03-10
supersedes: []
keywords:
  - Google Signals
  - Google Signals deprecated
  - data layer
  - GA4 funnel
  - reporting identity
  - Consent Mode v2
  - ad_storage
  - user_id
  - enhanced conversions
  - remarketing audience shrink
  - cross-device tracking
  - GTM data layer requirements
about:
  - name: Google Analytics 4
  - name: Consent Mode v2
  - name: Data layer and tag management
  - name: First-party identity
  - name: Conversion measurement and remarketing
citation:
  - name: "GA4 — Google signals removed from the reporting identity (Loves Data)"
    url: https://www.lovesdata.com/blog/google-signals-will-be-removed/
  - name: "Google Signals removed in GA4 (Louder)"
    url: https://louder.com.au/2024/01/12/google-signals-removed-in-ga4/
  - name: "Google Signals loses its ad authority — the June 2026 Consent Mode takeover (Analytico)"
    url: https://www.analyticodigital.com/blog/google-signals-consent-mode-june-2026
  - name: "GA4 + Google Ads data controls: what changes June 15, 2026 (Dataslayer)"
    url: https://www.dataslayer.ai/blog/ga4-google-ads-data-controls-june-15-2026
---
# When Google Signals was deprecated, what changed for data layer funnel requirements

**For:** Analytics engineering, marketing ops, and the person who owns the tag container
**Status:** Both changes are in force. The second one landed 15 June 2026.
**See also:** [`CONSENT-RESOLUTION-PATTERN.md`](consent-resolution-pattern.html) · [`SEGMENTS-GA4-BIDDING.md`](segments-ga4-bidding.html) · [`FEATURE-SPEC-UA-MIGRATION.md`](feature-spec-ua-migration.html)

---

## 0. TL;DR

Google Signals was a subsidy. While it ran, Google supplied — from its own signed-in
population, at no cost to your tagging — cross-device identity, demographic and interest
dimensions, and a fallback route into remarketing audiences. A thin data layer was survivable
because Google was quietly paying the difference.

It stopped paying in two instalments. In February 2024 Signals was removed from GA4's
**reporting identity**, so cross-device stitching and demographics left your reports. In June
2026 Signals lost its **ad authority**, and Consent Mode's `ad_storage` became the sole control
on the GA4 → Google Ads flow, so Signals stopped acting as a fallback into audiences.

Nothing about the tag changed. What changed is that anything the funnel needs to know must now
be **declared by you, in the data layer, before the tag fires**. Five fields that were optional
are now load-bearing: a durable `user_id`, a Consent Mode v2 default set before any tag, the
resolved consent state stamped on every event, consent-gated hashed user data, and every
segmentation dimension declared explicitly rather than inferred.

**One-line recommendation:** *Ecommerce parameters alone are no longer a funnel. They are a pile
of events with nobody attached to them.*

---

## 1. Two dates, two different failures

The phrase "Google Signals was deprecated" collapses two changes that broke different things and
demand different fixes. Separating them matters, because a team that only fixed the first one is
currently losing audience reach and does not know it.

| Date | What changed | What it took away | What it forces |
|---|---|---|---|
| **12 Feb 2024** | Signals removed from GA4's **reporting identity** | Cross-device stitching, demographics and interests in reports | A durable `user_id` on every step |
| **15 Jun 2026** | Signals loses **ad authority**; Consent Mode `ad_storage` becomes the sole control on GA4 → Google Ads | Signals as a fallback into remarketing audiences | Consent Mode v2 correctness, and match quality you supply |

Restated as prose, because the distinction is the whole document. On 12 February 2024, Google
removed Signals from the GA4 reporting identity; collection did not stop, but reporting fell back
to the three remaining methods — User ID, Device ID, and Modeling. That is a **reporting**
failure: your funnel numbers got worse while your audiences kept working. On 15 June 2026, the
second change landed: Signals stopped being the gatekeeper for the Google Ads data flow, and the
`ad_storage` signal inside Google Ads took over as the sole authority. Existing remarketing
audiences continued to exist but populate only with users who granted `ad_storage`, so audience
sizes fell in proportion to any shortfall in consent capture. That is an **activation** failure:
your reports look the same, and your reach quietly shrank.

A team that treated February 2024 as "the Signals thing" and moved on has an unfixed June 2026
problem, and the symptom — smaller audiences, higher CPAs, no error anywhere — does not announce
itself.

---

## 2. What Signals was actually paying for

Three things, and it is worth naming them separately because each one now has a different
replacement and a different cost.

**Identity.** Signals resolved sessions from the same signed-in Google user into one person
across devices. Replacement: your own `user_id`. Cost: engineering, once. Coverage: better than
Signals, because it includes people who are not signed into Google at all.

**Dimensions.** Age, gender and affinity categories came from Google's profile of that user.
Replacement: first-party attributes you already hold — lifecycle stage, customer tier, market,
predicted value band. Cost: a decision about which attributes actually drive spend. Coverage:
different rather than equivalent, and generally more commercially useful.

**Reach.** Signals let a signed-in user enter an audience even where your own consent capture was
imperfect. Replacement: consent rate plus match quality. Cost: real, ongoing, and partly outside
your control. Coverage: **worse**. This is the one that cannot be engineered back, and Section 9
says so plainly.

---

## 3. Challenge · Solution · Benefit — cross-device stitching

**Challenge.** A funnel that runs `view_item` and `add_to_cart` on a phone and `purchase` on a
laptop used to close itself, because Signals resolved both sessions to one signed-in user. Since
February 2024 those are two device IDs, and the funnel reports a drop-off that never happened.
Every step-to-step conversion rate in a considered-purchase category is understated — and not
uniformly. The understatement is worst exactly where the consideration window is longest, which
tends to be where the margin is.

**Solution.** Push a durable `user_id` on **every** funnel step, not only at purchase. It must be
your own identifier, stable across sessions and devices, and set the moment identity becomes
known — login, order lookup, a recognised email — rather than at checkout.

```js
dataLayer.push({
  event: 'view_item',
  user_id: 'xano_1234',          // durable spine, present on every step
  ecommerce: { items: [{ item_id: 'SKU-1', price: 49.00 }] }
});
```

**Benefit.** Identity is reconstructed at the step level rather than only at the transaction, so
the funnel measures behaviour instead of device fragmentation. This is strictly better than what
Signals provided: it covers visitors who never sign into Google, it works in every market, and it
survives the next platform change because the identifier is yours.

---

## 4. Challenge · Solution · Benefit — consent as a funnel input

**Challenge.** Before June 2026, a signed-in consenting user could still reach Google Ads even
where `ad_storage` was not granted, because Signals supplied a parallel route. That route is
closed. `ad_storage` is now the only authority. A banner that sets consent late, sets the wrong
signal, or never replays the stored choice on a single-page route change will empty the audience
— with no error, no warning, and no visible gap in the GA4 report.

That last clause is where the defect hides. The
[consent resolution pattern](consent-resolution-pattern.html) documents a measured case: a
returning visitor who had already consented ran an entire session at the denied default, because
nothing replayed the stored choice — the banner only fires on a *new* save. The `_ga` cookie was
readable on the device the whole time.

**Solution.** Set the Consent Mode v2 default before any tag, with `wait_for_update`, then update
it from durable state on every load — not only when the banner is answered.

```js
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
// …then replay the stored decision on every load, and update on a new one.
```

Then treat consent as a **funnel dimension**, not a wrapper: stamp the resolved state onto each
step event so the funnel can be segmented by consented versus modelled traffic instead of
averaging the two into a number that describes neither.

**Benefit.** The audience shrink becomes measurable rather than mysterious. You can state, per
step, what share of the funnel is eligible for remarketing at all — which converts an unexplained
bidding problem into a consent-rate problem, which is a thing a team can actually work on.

---

## 5. Challenge · Solution · Benefit — demographics and interests

**Challenge.** Age, gender and affinity dimensions came from Signals. Any saved report, audience
definition, dashboard or bidding rule built on them has been running on modelled or absent data
since February 2024. The reports still render. The segments still have names. They no longer mean
what they meant when someone built them.

**Solution.** Anything the funnel needs to segment on has to be carried as an event parameter or a
user property that you own and can defend: customer tier, lifecycle stage, market of sale,
acquisition channel, predicted lifetime value band. Register each one as a custom dimension so it
is queryable rather than merely present in the payload.

**Benefit.** Segments become first-party and durable — defined by your commercial model rather
than by a third party's inference about a person. They are portable to any downstream system, they
survive platform policy changes, and they are explicable in a privacy review, which an inferred
demographic attribute is not.

---

## 6. Challenge · Solution · Benefit — match quality replaces signed-in reach

**Challenge.** With Signals no longer bridging to Google Ads, conversion attribution and audience
membership depend on whether Google can match the event to a user using data **you** supply. A
funnel that pushes only anonymous ecommerce events turns a modest consent rate into an even
smaller usable audience, because consent and matchability multiply rather than add.

**Solution.** Attach consent-gated user-provided data — SHA-256 hashed email or phone — to the
same pushes. Hash server-side, or before the push. Raw personal data must never enter the data
layer, where every script on the page can read it.

```js
dataLayer.push({
  event: 'purchase',
  user_id: 'xano_1234',
  user_data: { sha256_email_address: 'a1b2…' },   // only when ad_user_data is granted
  ecommerce: { transaction_id: '1001', value: 49.00, currency: 'USD' }
});
```

The gate is not decorative. Sending hashed identifiers for a visitor who denied `ad_user_data` is
a consent violation that happens to still be a hash.

**Benefit.** Recovers a meaningful share of the reach Signals used to supply, on a legal basis you
can evidence, and improves attribution accuracy for the consented population rather than merely
counting it more precisely.

---

## 7. Challenge · Solution · Benefit — where the funnel's truth now lives

**Challenge.** With identity partly resolved by modelling and reporting gated by consent, the GA4
funnel exploration is a blended estimate. Modelling requires traffic thresholds before it engages,
and it fills **reporting only** — a modelled user never enters an ad audience. Two properties with
identical tagging can legitimately report different funnels.

**Solution.** Treat GA4 as the collection and activation surface, and the BigQuery export as the
analysis surface. Every step event needs `user_id`, the resolved consent state, and step
ordinality, so the funnel can be rebuilt from raw events with consented and modelled traffic
reported separately rather than blended.

**Benefit.** One reproducible funnel number instead of an interface figure that moves with
platform policy — plus the raw substrate for predicted-value modelling and any bidding signal
built downstream of it.

---

## 8. The event contract, in one place

Every funnel step event should carry the following. Read as prose rather than as a lookup table,
because a table read by a retrieval system arrives as one undifferentiated block.

`user_id` is a durable, first-party identifier, present on **every** step and not only at
purchase; it is required, and it is the single highest-value field in the contract. The four
Consent Mode v2 signals — `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`
— must be defaulted to denied before any tag loads and updated from durable state on every load;
they are required, and `ad_storage` alone now controls whether the event can reach Google Ads at
all. The resolved consent state should also be stamped onto the event itself as a parameter, so
the funnel can be segmented by it after the fact; this is strongly recommended rather than
strictly required, and it is what makes the audience shrink diagnosable. Hashed user-provided data
(`sha256_email_address`, hashed phone) is required wherever remarketing or enhanced conversions
matter, and must be gated on `ad_user_data`. Business dimensions — tier, lifecycle, market,
predicted value band — are required for any segment that a saved report or bidding rule depends
on, since nothing is inferred for you any more. Step ordinality, an explicit integer position in
the funnel, is recommended, and it is what allows the funnel to be rebuilt from raw events without
guessing at ordering from timestamps.

---

## 9. What none of this fixes

No data layer change recovers a visitor who denied `ad_storage`. There is no tagging configuration,
server-side container, or identifier scheme that puts a non-consenting user into a Google
remarketing audience, and any vendor offering one is describing either a consent violation or a
product that will stop working.

The honest levers are three, and only three: raise the consent rate through banner design and
value exchange, raise the match rate for the users who did consent, and raise the value you
extract per consented identity so that a smaller audience still pays. The first is a design and
legal problem, the second is an engineering problem, and the third is a commercial one.

There is a second limitation worth stating. Modelling closes gaps in GA4 reporting when a property
meets Google's traffic thresholds. It does not close gaps in activation, it is not auditable, and
you cannot inspect it. Treating a modelled funnel number as a measurement is a category error —
useful for direction, unusable as evidence.

Finally, this document's platform facts are sourced from Google's published changes and
contemporaneous write-ups, cited below. The event contract in Section 8 is a design
recommendation from the CRM Sync stack, not a measured claim about any specific property. Section
10 exists so you do not have to take it on trust.

---

## 10. How to check your own funnel in about twenty minutes

1. **Is `user_id` on every step, or only at purchase?** In GA4 DebugView, walk a session from
   `view_item` to `purchase` and confirm the parameter is present on each event. If it appears
   only at the end, your funnel is measuring devices.
2. **Does consent default before the first tag?** Load the page with the network panel open and
   confirm the `gtag('consent','default',…)` call precedes any GA4 or Ads request. Anything that
   fires first fired without a decision.
3. **Does a returning consented visitor start granted?** Accept, close the browser, return. Read
   the `gcs` parameter on the first hit of the new session. `G111` means the stored decision was
   replayed; `G110` means it was not, and the whole session will run denied.
4. **Is `ad_storage` actually reaching Google Ads?** Check audience sizes against the same period
   before 15 June 2026. A step change dated to that day is the second deprecation, not seasonality.
5. **Do your saved segments still rest on demographics?** Open each audience definition and look
   for age, gender or affinity conditions. Anything that still uses them has been running on
   modelled or missing data since February 2024.

Steps 1 to 3 are pass/fail in a browser. Steps 4 and 5 are inventory work, and they are the ones
most often skipped.

---

## Sources

- Loves Data — [Google signals will be removed from the reporting identity](https://www.lovesdata.com/blog/google-signals-will-be-removed/)
- Louder — [Google signals removed in GA4](https://louder.com.au/2024/01/12/google-signals-removed-in-ga4/)
- AccuraCast — [Google signals removed from reporting identity: what this means for you](https://www.accuracast.com/newsletter/ga4-google-signals-reporting-identity/)
- Analytico — [Google Signals loses its ad authority: the June 2026 Consent Mode takeover](https://www.analyticodigital.com/blog/google-signals-consent-mode-june-2026)
- Dataslayer — [GA4 + Google Ads data controls: what changes June 15, 2026](https://www.dataslayer.ai/blog/ga4-google-ads-data-controls-june-15-2026)
- Seresa — [Google Signals loses ad authority June 15: remarketing lists shrink](https://seresa.io/blog/attribution-measurement/google-signals-loses-ad-authority-june-15-remarketing-lists-shrink)
