# Consent, Cookies & Preferences — User Guide

**Status:** Live · **Class:** User guide · **Surface:** every CRM Sync–connected page

How consent works on a CRM Sync–connected site: what the banner asks, what each
preference controls, how to change or reset your choices, and where every change
is recorded.

---

## The consent banner

On your first visit a banner offers three choices:

- **Accept All** — grants every category below.
- **Customize** — opens the Cookie Preferences panel for per-category choices.
- **Reject** — declines everything non-essential.

Until you choose, **all measurement is denied by default**. The site's scripts are
ordered consent-first: the denied default is set before any analytics ever loads,
and your stored choice replays on every later visit before measurement starts. A
returning visitor is measured exactly according to their last saved decision — never
more.

## The Cookie Preferences panel

| Preference | What it controls |
|---|---|
| **Essential** | Basic site functionality and security. Always on. |
| **Terms of Service** | Your acceptance of the terms of service agreement. |
| **Privacy Policy** | Your acceptance of the privacy policy and data-handling practices. |
| **Analytics & Cookies** | First-party analytics (visit measurement). Off = analytics storage stays denied. |
| **Marketing** | Personalized content, offers, and advertising signals. Off = advertising storage, ad user data, and ad personalization stay denied. |

Choices are stored on your device and — when you are signed in — recorded to your
account as an audited consent event (what changed, when, how, under which consent
version). Choices made while signed out are kept on the device and synced to your
account automatically the next time you sign in.

## Changing your preferences later

The banner hides after you choose, but every page keeps two footer controls:

- **Cookie Preferences** — reopens the panel with your current choices pre-filled.
  Save applies the change immediately: the measurement flags flip on the spot, your
  account record updates, and downstream surfaces (advertising audiences, partner
  projections) reconcile from the same record.
- **Reset Consent** — the stronger action. It clears your stored choice, rotates the
  site's anonymous identifier, re-applies the denied defaults, and shows the banner
  again as if you were a new visitor. Use this to start over completely — for
  example on a shared device.

## How consent changes propagate

A marketing-consent change is escalated only when the state actually *transitions*
(granted to revoked, or back). On a real transition:

- the advertising signal for your identity is suppressed or re-activated,
- audience memberships used for advertising drop or re-include you immediately,
- and if you revoke, the store's native email-marketing consent is set to
  unsubscribed as well.

Re-saving the same choice never re-fires any of this — it is recorded, not re-acted.

## Do Not Sell or Share — how it differs

The **Do Not Sell or Share My Personal Information** switch (Privacy & Permissions →
Privacy) is a separate instrument from cookie consent: it is a CCPA / CPRA sharing
opt-out, not a consent withdrawal. It operates as an orthogonal plane — when it is
on, cross-context sharing (advertising audiences, partner identifier projections,
peer and agent sharing) is blocked fail-closed **even if your marketing consent is
granted**. First-party surfaces you consented to keep working. The stricter signal
always governs a shared surface.

## Where your history lives

Open **Privacy & Permissions → Me** for your **Activity log**: every consent grant,
revocation, preference save, and form interaction, timestamped and attributed to the
channel it came from (banner, preferences panel, newsletter form, opt-out link).
The same records power the **Export my data** bundle on the Privacy tab, and every
boundary that enforces your choices reads from that same system of record.

## Notes on "cookies" specifically

Consent state is kept in your browser's local storage (not a tracking cookie), and
for signed-in users in the account database. Analytics cookies exist only after you
grant Analytics; advertising flags only after you grant Marketing. Reset Consent
clears the site's own stored state — your browser's cookie jar for third parties can
additionally be cleared in browser settings, but with consent denied those cookies
are not set in the first place.

---

*CRM Sync · consent-first measurement · your choices, audited and enforced.*
