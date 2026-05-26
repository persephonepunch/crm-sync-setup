# Webflow App Requirements Checklist (2026)

A comprehensive, downloadable checklist for building, submitting, and maintaining a Webflow Marketplace app. Based on [Webflow's official Marketplace guidelines](https://developers.webflow.com/data/v2.0.0-beta/apps/docs/marketplace-guidelines) and the latest platform changes through May 2026.

---

## How to Use

Copy this file into your project and check off items as you complete them. Items marked **(mandatory)** will block your Marketplace submission if unmet. Items marked **(recommended)** are best practices that improve approval odds and app quality.

---

## 1. App Registration & Setup

### 1.1 Workspace & Access

- [ ] **Create app in Workspace Settings** — Apps & Integrations > Develop **(mandatory)**
- [ ] **Enable 2FA on workspace admin account** — required before submission **(mandatory)**
- [ ] **Select app type** — Designer Extension, Data Client, or Hybrid **(mandatory)**
- [ ] **Select installation scope** — single-site restriction or broad workspace access
- [ ] **Install Webflow CLI** — `npm i -g @webflow/webflow-cli` (Designer Extensions only)

### 1.2 App Configuration

- [ ] **App name set** — max 30 characters, unique, clear, memorable **(mandatory)**
- [ ] **Client ID obtained** — from Workspace Settings > Apps & Integrations **(mandatory)**
- [ ] **Client Secret stored securely** — never in source control **(mandatory)**
- [ ] **Redirect URI configured** — exact match required (trailing slashes matter) **(mandatory)**
- [ ] **OAuth scopes selected** — minimum required; locked after publication **(mandatory)**
- [ ] **Installation URL set** — for Data Client and Hybrid apps **(mandatory)**

### 1.3 Designer Extension Manifest (webflow.json)

- [ ] **`name` set** — descriptive, unique app identifier **(mandatory)**
- [ ] **`apiVersion` set to `"2"`** — current Designer API version **(recommended)**
- [ ] **`size` configured** — `default` (240×360), `comfortable` (320×460), or `large` (800×600)
- [ ] **`publicDir` set** — build output directory (defaults to `/public`)
- [ ] **`appIntents` defined** — if app connects to canvas elements
- [ ] **`featureFlags` set** — `expandedAppModes: true` for persistent visibility across Designer modes

---

## 2. Authentication & OAuth

### 2.1 OAuth 2.0 Flow (Authorization Code Grant)

- [ ] **Authorization URL correct** — `https://webflow.com/oauth/authorize` **(mandatory)**
- [ ] **Required parameters sent** — `client_id`, `response_type=code`, `redirect_uri`, `scope` **(mandatory)**
- [ ] **`state` parameter included** — CSRF protection token **(recommended)**
- [ ] **Token exchange implemented** — `POST https://api.webflow.com/oauth/access_token` **(mandatory)**
- [ ] **Authorization code used once** — codes are single-use, valid 15 minutes **(mandatory)**
- [ ] **Redirect URI exact match** — must match app settings precisely **(mandatory)**
- [ ] **Token revocation implemented** — `POST https://webflow.com/oauth/revoke_authorization` **(recommended)**

### 2.2 Token Management

- [ ] **Access tokens stored securely** — database or environment variables, not plain text **(mandatory)**
- [ ] **Tokens never in client-side code** — no tokens in HTML, JS, or frontend bundles **(mandatory)**
- [ ] **Separate tokens per use case** — do not reuse tokens across different purposes **(recommended)**
- [ ] **Token rotation implemented** — regular rotation schedule **(recommended)**
- [ ] **Compromised tokens revoked immediately** — incident response plan in place **(mandatory)**

### 2.3 Scope Management

- [ ] **Minimum scopes requested** — principle of least privilege **(mandatory)**
- [ ] **Scopes in OAuth URL match app settings** — must be equal to or subset **(mandatory)**
- [ ] **Scope changes planned** — adding scopes after publication requires re-approval **(mandatory)**
- [ ] **Document why each scope is needed** — prepared to justify during review **(recommended)**

---

## 3. Security & Data Protection

### 3.1 Secrets Management

- [ ] **Client secret not in source control** — use environment variables or secrets manager **(mandatory)**
- [ ] **API keys stored securely** — environment variables or dedicated secrets management **(mandatory)**
- [ ] **All connections over HTTPS** — API calls, redirect URIs, webhooks **(mandatory)**
- [ ] **Tokens named descriptively** — for auditability **(recommended)**
- [ ] **Rotate exposed secrets immediately** — incident response procedure **(mandatory)**

### 3.2 Webhook Security

- [ ] **Webhook HMAC signatures verified** — SHA-256 using `client_secret` **(mandatory)**
- [ ] **Timestamp validated** — `x-webflow-timestamp` within 5 minutes (300,000ms) **(mandatory)**
- [ ] **HMAC format correct** — compute over `timestamp:request_body` string **(mandatory)**
- [ ] **Webhooks return HTTP 200** — acknowledge receipt promptly **(mandatory)**

### 3.3 Code Security (Designer Extensions)

- [ ] **No `eval()` statements** — avoid vulnerability-prone patterns **(mandatory)**
- [ ] **No direct DOM manipulation** — use Webflow APIs only **(mandatory)**
- [ ] **No excessive global variables** — scope variables properly **(mandatory)**
- [ ] **No externally hosted iframes** — except for authentication flows **(mandatory)**
- [ ] **CSS scoped/namespaced** — prevent conflicts with Webflow native styles **(mandatory)**
- [ ] **Only official Webflow APIs used** — no separate packages manipulating Webflow **(mandatory)**
- [ ] **Proper CORS policies implemented** — for backend communications **(recommended)**

### 3.4 Security Headers (Data Clients)

- [ ] **`X-Content-Type-Options`** — set to `nosniff` **(recommended)**
- [ ] **`X-Frame-Options`** — set appropriately **(recommended)**
- [ ] **`Strict-Transport-Security`** — HSTS enabled **(recommended)**

---

## 4. Privacy & Compliance

### 4.1 Privacy Requirements

- [ ] **Privacy Policy URL provided** — valid, accessible URL **(mandatory)**
- [ ] **Terms of Service URL provided** — valid, accessible URL **(mandatory)**
- [ ] **Policy covers data collected** — what data, how obtained **(mandatory)**
- [ ] **Policy covers data usage** — purposes and processing **(mandatory)**
- [ ] **Policy covers data storage** — location, security measures **(mandatory)**
- [ ] **Policy covers data transfers** — third-party sharing, international transfers **(mandatory)**
- [ ] **Policy covers contact information** — how users can reach you **(mandatory)**

### 4.2 Data Protection

- [ ] **Sensitive data encrypted** — in transit and at rest **(mandatory)**
- [ ] **Unauthorized access prevented** — security measures in place **(mandatory)**
- [ ] **Consent requested for personal data** — clear opt-in mechanisms **(mandatory)**
- [ ] **Data subject requests handled** — respond within 30 days (GDPR) **(mandatory)**
- [ ] **Minimal data collected** — only what app needs **(recommended)**

### 4.3 Content Compliance

- [ ] **Content properly licensed** — rights and permissions for all content **(mandatory)**
- [ ] **No trademark infringement** — no unauthorized use of others' marks **(mandatory)**
- [ ] **No offensive content** — nothing offensive, insensitive, or illegal **(mandatory)**
- [ ] **Accurate affiliations** — honestly indicate partnerships/endorsements **(mandatory)**

---

## 5. App Store Listing

### 5.1 Required Text

- [ ] **App name** — max 30 characters, unique **(mandatory)**
- [ ] **Publisher name** — max 20 characters **(mandatory)**
- [ ] **Short description** — max 100 characters, action-oriented value proposition **(mandatory)**
- [ ] **Long description** — max 10,000 characters, Markdown supported, no hyperlinks **(mandatory)**
- [ ] **Feature list** — max 5 key capabilities **(mandatory)**
- [ ] **Website URL** — valid link to app's main website **(mandatory)**
- [ ] **Support email** — valid contact email **(mandatory)**
- [ ] **Categories selected** — up to 5 from 19 available categories **(mandatory)**

### 5.2 Visual Assets

- [ ] **App logo** — 900×900px, 1:1 ratio, logomark only (no text logotypes) **(mandatory)**
- [ ] **App avatar** — 512×512px, 1:1 ratio (for submission form) **(mandatory)**
- [ ] **Publisher logo** — 20×20px, recognizable at small size **(mandatory)**
- [ ] **Screenshots** — 1280×846px, minimum 4 recommended **(mandatory)**
- [ ] **Screenshots show actual workflows** — core features, readable text **(mandatory)**
- [ ] **Consistent screenshot styling** — cohesive look across all images **(mandatory)**
- [ ] **Promo video** — 1-2 minutes, YouTube-hosted **(recommended)**

### 5.3 Monetization

- [ ] **All fees disclosed** — subscriptions, in-app purchases, charges **(mandatory)**
- [ ] **No hidden charges** — transparent, honest pricing **(mandatory)**
- [ ] **No ads displayed** — apps must not show advertisements **(mandatory)**
- [ ] **No deceptive practices** — no misleading pricing **(mandatory)**

### 5.4 Branding

- [ ] **No unauthorized trademarks** — no others' logos or copyrighted materials **(mandatory)**
- [ ] **Accurate company identity** — no impersonation **(mandatory)**
- [ ] **Accurate contact information** — valid, real contact details **(mandatory)**
- [ ] **One developer account only** — multiple accounts prohibited **(mandatory)**

---

## 6. Designer Extension Quality

### 6.1 UI Design

- [ ] **Vertical layout** — stack components vertically in narrow panel **(mandatory)**
- [ ] **Full-width elements** — buttons and inputs span panel width **(mandatory)**
- [ ] **No horizontal scrolling** — all content fits within iframe width **(mandatory)**
- [ ] **4px spacing rhythm** — consistent spacing in multiples of 4 **(recommended)**
- [ ] **Sentence case** — all text, headings, and buttons **(recommended)**
- [ ] **No keyboard shortcuts** — do not invoke app via keyboard **(mandatory)**
- [ ] **Follow Webflow design patterns** — no confusing new UI conventions **(mandatory)**
- [ ] **Component icons for components only** — proper icon usage **(mandatory)**
- [ ] **Webflow Figma UI Kit referenced** — consistent with platform look **(recommended)**

### 6.2 Accessibility

- [ ] **WCAG best practices followed** — W3C accessibility guidelines **(recommended)**
- [ ] **Alternative text for images** — screen reader support **(recommended)**
- [ ] **Keyboard navigation supported** — all features keyboard-accessible **(recommended)**
- [ ] **Sufficient color contrast** — readable in all conditions **(recommended)**

### 6.3 Bundle Requirements

- [ ] **Bundle size under 5MB** — `bundle.zip` file size limit **(mandatory)**
- [ ] **Relative asset paths** — e.g., `./styles.css` not absolute paths **(mandatory)**
- [ ] **Build before bundle** — pre-compile frameworks before `webflow extension bundle` **(mandatory)**
- [ ] **Version notes included** — with each bundle upload **(recommended)**

### 6.4 Code Quality

- [ ] **Meaningful variable/function names** — clear, descriptive identifiers **(mandatory)**
- [ ] **Proper indentation** — consistent code formatting **(mandatory)**
- [ ] **Well-organized source** — readable, maintainable structure **(mandatory)**
- [ ] **`webflow.notify()` for errors** — user-facing error messages use Webflow API **(recommended)**
- [ ] **`webflow.canForAppMode()` checked** — verify actions allowed before executing **(recommended)**
- [ ] **Event listeners cleaned up** — unsubscribe when no longer needed **(recommended)**

---

## 7. Data Client Quality

### 7.1 API Usage

- [ ] **API v2 used** — v1 deprecated March 2025; v1 apps delisted August 2024 **(mandatory)**
- [ ] **Version number in write requests** — required since September 2025 **(mandatory)**
- [ ] **Rate limits handled** — implement retry with backoff for 429 responses **(mandatory)**
- [ ] **Webhooks preferred over polling** — reduce API usage **(recommended)**
- [ ] **Webflow SDK used** — includes built-in exponential backoff **(recommended)**

### 7.2 Rate Limits

| Plan | Requests/Minute |
|---|---|
| Starter & Basic | 60 |
| CMS, eCommerce & Business | 120 |
| Enterprise | Custom |

- [ ] **Rate limit headers monitored** — `X-RateLimit-Remaining`, `Retry-After` **(mandatory)**
- [ ] **Site publish limited** — max 1 successful publish per minute **(mandatory)**

### 7.3 Webhooks

- [ ] **HTTPS destination URLs** — webhooks must accept HTTPS **(mandatory)**
- [ ] **HTTP 200 returned promptly** — confirm receipt **(mandatory)**
- [ ] **Idempotent handlers** — same event twice produces same result **(recommended)**
- [ ] **Retry tolerance** — Webflow retries max 3 times, 10-minute intervals **(mandatory)**
- [ ] **Max 75 webhooks per trigger type** — respect subscription limits **(mandatory)**

### 7.4 Error Handling

- [ ] **Standard HTTP codes handled** — 400, 401, 404, 429, 500 **(mandatory)**
- [ ] **Structured error responses parsed** — use cause tags and messages **(mandatory)**
- [ ] **Graceful degradation** — app doesn't crash on API errors **(mandatory)**

---

## 8. Submission & Review

### 8.1 Pre-Submission Checklist

- [ ] **2FA enabled** — on workspace admin account **(mandatory)**
- [ ] **App fully functional** — all features working end-to-end **(mandatory)**
- [ ] **Backend services operational** — all APIs accessible during review **(mandatory)**
- [ ] **OAuth flow tested** — approve and deny paths both work **(mandatory)**
- [ ] **Installation/onboarding flow tested** — fresh install experience verified **(mandatory)**
- [ ] **Error handling complete** — clear, helpful error messages **(mandatory)**
- [ ] **Documentation prepared** — clear setup and usage guides **(recommended)**

### 8.2 Demo Requirements

- [ ] **Demo account provided** — active account with all features enabled **(mandatory)**
- [ ] **Premium features accessible** — gated/paid features unlocked for reviewer **(mandatory)**
- [ ] **Test credentials included** — API keys, login details as needed **(mandatory)**
- [ ] **Sample data available** — realistic data for evaluating features **(mandatory)**
- [ ] **Demo video** — 2-5 minutes, shows install through usage (Data Client/Hybrid) **(mandatory)**
- [ ] **Demo video shows OAuth flow** — both approve and deny paths **(mandatory)**
- [ ] **Demo video format** — Loom (private), YouTube (unlisted), or Google Drive **(mandatory)**

### 8.3 Common Rejection Reasons

- Security/safety concerns
- Offensive or inappropriate content
- Intellectual property infringement
- Impersonation of another company
- Multiple developer accounts
- Non-functional backend during review
- Performance issues
- Incomplete submissions or missing demo video
- Deceptive or hidden pricing
- Text-based logos (must use logomarks)
- Hyperlinks in long description
- v1 API usage
- OAuth scope mismatches

---

## 9. Post-Launch & Maintenance

### 9.1 Updates

- [ ] **Updates submitted via same form** — select "App Update" type **(mandatory)**
- [ ] **Only App Name + Client ID required** — modify only changed fields **(mandatory)**
- [ ] **All updates reviewed** — same process as initial submission **(mandatory)**
- [ ] **Designer Extension bundles versioned** — upload new bundle versions separately **(mandatory)**
- [ ] **Version notes maintained** — with each bundle upload **(recommended)**

### 9.2 API Version

- [ ] **Stay on API v2** — v1 endpoints scheduled for full removal late 2026 **(mandatory)**
- [ ] **Version numbers in write requests** — required since September 2025 **(mandatory)**
- [ ] **Monitor deprecation notices** — migrate before sunset **(mandatory)**

### 9.3 Quality

- [ ] **Performance monitored** — address issues promptly; persistent problems cause removal **(mandatory)**
- [ ] **User feedback incorporated** — gather feedback, conduct usability testing **(recommended)**
- [ ] **Support email maintained** — responsive to user inquiries **(mandatory)**
- [ ] **Documentation kept current** — reflects latest app functionality **(recommended)**
- [ ] **App reflects listed functionality** — listing must match actual features **(mandatory)**

### 9.4 Grounds for Removal

- Persistent performance issues
- Error-prone or unmaintained apps
- Privacy/data protection non-compliance
- Policy violations (false info, plagiarism, data manipulation)
- Failure to migrate to current API versions
- Deceptive practices

---

## Quick Reference: Key Dates

| Date | Requirement |
|---|---|
| Aug 2024 | Apps using v1 auth delisted from Marketplace |
| Mar 2025 | Webflow API v1 fully deprecated |
| Apr 2025 | Webhook signature verification required for site tokens |
| Sep 2025 | Version numbers required in all write requests |
| Late 2026 | V1 endpoints scheduled for full removal |

---

## Resources

- [Marketplace Overview](https://developers.webflow.com/data/v2.0.0-beta/docs/marketplace/overview)
- [Marketplace Guidelines](https://developers.webflow.com/data/v2.0.0-beta/apps/docs/marketplace-guidelines)
- [Listing Your App](https://developers.webflow.com/data/v2.0.0-beta/docs/marketplace/listing-your-app)
- [Submitting Your App](https://developers.webflow.com/data/v2.0.0-beta/docs/marketplace/submitting-your-app)
- [OAuth Reference](https://developers.webflow.com/data/reference/oauth-app)
- [Scopes Reference](https://developers.webflow.com/data/reference/scopes)
- [Rate Limits](https://developers.webflow.com/data/reference/rate-limits)
- [Designer Extensions](https://developers.webflow.com/data/v2.0.0-beta/docs/designer-extensions)
- [Design Guidelines](https://developers.webflow.com/data/designer/docs/design-guidelines)
- [Register an App](https://developers.webflow.com/apps/data/docs/register-an-app)
- [Working with Webhooks](https://developers.webflow.com/data/docs/working-with-webhooks)
- [Marketing Your App](https://developers.webflow.com/data/v2.0.0-beta/docs/marketing-your-app)
- [Submit Your App](https://developers.webflow.com/submit)

---

*Last updated: May 2026. Requirements are subject to change — always check [developers.webflow.com](https://developers.webflow.com) for the latest.*
