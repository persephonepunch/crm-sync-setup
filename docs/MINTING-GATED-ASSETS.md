---
title: "CRM Sync — Minting Gated Assets"
description: "How to mint a gated asset from a source URL, and why that source URL being PUBLIC is the thing that most often defeats the gate. Covers publish vs. mint, the two-copies problem, and the safe order of operations."
canonical: https://persephonepunch.github.io/crm-sync-setup/minting-gated-assets.html
category: "Security"
date: 2026-08-16
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/docs/MINTING-GATED-ASSETS.md
---

# CRM Sync — Minting Gated Assets

**Version:** 1.0
**Date:** 2026-08-16
**Scope:** `POST /assets/mint`, the source-URL contract, and the operational rule that keeps a gated asset actually gated.

---

## Publishing and minting are different jobs

These two get confused because both end with a file in object storage. They are not the same operation and they do not produce the same thing.

| | **Publish** | **Mint** |
|---|---|---|
| Where | PIM Sync (asset infrastructure) | CRM Sync vault (`/assets/mint`) |
| Stored as | the file, as-is | encrypted with a per-asset key |
| Who can read it | anyone with the URL | only a subject holding a grant |
| Record of access | none | every unwrap on a ledger |
| Key | n/a | rotatable per asset |
| Link lifetime | permanent | **120 seconds** |

Publish is for the things you want found: product images, a GLB a storefront renders, a spec sheet. Mint is for the things you sell or control: STL and 3MF print files, firmware, licensed documents.

A file that is meant to be paid for does not belong on the publish path.

---

## Minting from a URL

`/assets/mint` accepts either inline bytes or a source URL:

```http
POST https://crm-sync.dev/assets/mint
Authorization: Bearer <your token>
Content-Type: application/json

{ "slug": "widget-v3-stl", "url": "https://cdn.example.com/path/widget-v3.stl" }
```

`data_b64` is accepted instead of `url` when you have the bytes in hand.

Requires `caps.assets3d.publish` — the 3D Publisher add-on — or platform credentials.

The vault fetches your URL with an ordinary `GET`, encrypts what comes back under a freshly generated key, and stores the sealed copy. It does not care which host the bytes came from: a Shopify CDN URL, a Webflow asset URL, and a public R2 URL all work identically.

---

## ⚠️ The source URL is a PUBLIC URL

This is the part that catches people, and it is worth stating plainly:

> **The URL you mint from is a public URL. Anyone who has it can download the file directly, without a grant, without a token, and without ever touching the vault.**

Shopify CDN links, Webflow asset links, and public R2 links are all openly readable by design — that is what makes them fetchable by `mint` in the first place. The same property that lets the vault ingest them lets anyone else ingest them.

### What minting does and does not do

Minting **copies**. It does not move, and it does not revoke.

After a successful mint the file exists **twice**:

1. **Sealed**, inside the vault — encrypted, grant-gated, ledgered, with 120-second download links.
2. **Open**, still serving at the source URL you passed in — unchanged, unprotected, permanent.

The vault has no ability to delete an object from Shopify's CDN, Webflow's CDN, or a bucket it does not own. Nothing in the mint response indicates the source is still exposed, because from the vault's side nothing is wrong.

The failure is silent. The asset looks gated — the record page renders, grants work, the ledger fills up — while anyone holding the original link bypasses all of it. For a paid asset, the symptom is not an error. It is revenue that never arrives.

---

## The safe order of operations

**Do not publish a gated asset publicly and then mint it.** Reverse the order, or clean up after yourself.

**Preferred — never public at any point:**

1. Keep the file out of any public bucket or CDN.
2. Mint it with `data_b64`, or from a URL that requires credentials you control and can revoke.
3. Distribute only the vault's record page.

**Acceptable — public briefly, then closed:**

1. Upload to your own storage.
2. Mint from that URL.
3. **Delete the source object.** Confirm the original URL now 404s.
4. Distribute only the vault's record page.

**Wrong:**

1. Publish the STL to a storefront CDN.
2. Mint it.
3. Sell access. *(The file was already free to anyone who looked.)*

If you are minting something that was already public for a while, treat it as compromised — assume the link circulated, and mint a revised file rather than the one that was exposed.

---

## What you hand out afterwards

Give people the record, never the payload:

| Surface | Safe to share | Contains |
|---|---|---|
| `GET /assets/<slug>/get` | ✅ yes | public record page |
| `GET /assets/<slug>/record` | ✅ yes | provenance detail |
| `GET /assets/<slug>/card` | ✅ yes | embeddable card |
| `POST /assets/<slug>/unwrap` | — | issues a link after a grant check |
| `GET /assets/<slug>/payload?t=` | ❌ **no** | the actual bytes |

`unwrap` returns `{ "ok": true, "url": "…/payload?t=…", "expires_in": 120 }`. That URL is single-purpose and short-lived; it is the output of a grant decision, not something to publish, email, or paste into a support ticket.

---

## Operations

- **`POST /assets/<slug>/rotate`** — new key, existing grants preserved. Run this if a payload link leaked.
- **`GET /assets/<slug>/ledger`** — who unwrapped, when. This is the audit answer, and it only tells the truth if the source URL was closed; downloads that bypassed the vault leave no trace here.
- **`GET|POST /assets/<slug>/grants`** — read or widen the policy: public, named people, or redeemed invite. Policy can also close access with an expiry. The publisher is never locked out of their own asset.
- **`POST /assets/<slug>/invite`** / **`GET /assets/<slug>/accept`** — grant by invitation.

---

## Why the formats matter here

Media CDNs accept presentation formats. Cloudinary 3D, for example, takes `.glb` for upload (`.usdz` in beta) and converts other inputs to GLB on delivery.

**STL and 3MF are manufacturing formats**, and they are the ones with commercial value in a print workflow: 3MF carries materials, colours, and build metadata used to produce a physical object. Converting an STL to GLB in order to store it keeps what renders and discards what manufactures.

The vault takes the bytes you give it, whatever they are — STL, 3MF, firmware, documents — because it is not in the business of rendering them. It is in the business of proving what they are, where they came from, and who was allowed to have them.

---

## Checklist

- [ ] Is this asset meant to be paid for or access-controlled? → mint, do not publish.
- [ ] Was the source URL ever public? → delete it after minting, and verify it 404s.
- [ ] Am I sharing the record page rather than a `payload?t=` link?
- [ ] Has a payload link leaked? → `rotate`.
- [ ] Does the ledger reflect real access? → only if no public copy survives.
