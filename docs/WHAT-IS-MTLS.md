---
title: "What Is mTLS? Mutual TLS for Devices, Services and Agents"
description: "mTLS is mutual Transport Layer Security: both ends of a connection show a certificate and verify the other's before any data flows. What it proves, what it doesn't, where it runs in this stack (Rust with rustls, Cloudflare Workers and the edge), and why one certificate per device, held outside the gateway, is what makes it worth having."
category: "Security"
date: 2026-11-04
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/docs/WHAT-IS-MTLS.md
licence: CC-BY-4.0
links:
  - "https://persephonepunch.github.io/crm-sync-setup/book/signing-keys-by-proxy/|Signing Keys by Proxy"
tags:
  - mtls
  - tls
  - pki
  - certificates
  - iot
  - rust
  - ai-security
---

# What Is mTLS?

**mTLS is mutual TLS: mutual Transport Layer Security.** In ordinary TLS, the kind every website uses, only the server shows a certificate. Your browser checks the server; the server doesn't check you with a certificate, and asks for a password or a cookie later, once the connection is open. In mTLS **both sides show a certificate and both verify the other** during the handshake. The client, whether a device, a service or an AI agent, proves who it is with its own certificate and private key before a single byte of data flows.

## TLS and mTLS side by side

| | TLS | mTLS |
|---|---|---|
| **Who shows a certificate** | The server | The server and the client |
| **Who verifies** | The client checks the server | Each checks the other |
| **How the client proves who it is** | Later, inside the connection: a password, cookie, API key or token | In the handshake: a certificate and a private key it never sends |
| **What a stolen credential gets** | A copied API key or token works from anywhere until it expires | The certificate is public; without the private key it proves nothing |
| **Typical use** | Browsers to websites | Device to backend, service to service, edge to origin, agent to API |

## What happens in the handshake

1. The client says hello; the server sends its certificate, **and asks for the client's**.
2. The client checks the server's certificate against the roots it trusts.
3. The client sends its own certificate and signs the handshake with its private key, proving it holds the key and not just a copy of the certificate.
4. The server checks the client's certificate against the CA it trusts **for clients**, and checks it isn't revoked or expired.
5. Only then does application data flow. A client without a valid certificate never reaches your code.

The CA the server trusts for clients is usually **your own** private CA, not a public one. That's deliberate: a public CA will issue a certificate to anyone who controls a domain, and you don't want every domain owner on the Internet able to connect to your device backend.

## What mTLS proves, and what it doesn't

mTLS proves **who is connecting**. It doesn't prove **what they may do**. A device with a valid certificate may still be past its warranty, an agent may hold a certificate but no mandate for this market, and a service may be allowed to read but not to write. That decision is a **grant**, checked live at the system of record on each action. This is the rule [Signing Keys by Proxy](./SIGNING-KEYS-BY-PROXY.md) states as *a certificate is not a grant*.

| Question | Answered by |
|---|---|
| Is this really device `D-1042`? | mTLS: its certificate and the key it proved it holds |
| Is `D-1042`'s certificate still good? | Expiry, and revocation in the inventory |
| May `D-1042` send readings for this site today? | A grant in Xano, the system of record |
| Did the shopper behind this agent consent? | Consent at the system of record, not the certificate |
| Was this reading really produced by `D-1042`? | A signature over the reading itself, so it survives the gateway |

The last row matters for IoT. mTLS protects one hop. If TLS ends at a gateway, as it does on a NetScaler or a load balancer, the backend only knows what the gateway forwarded. A device that also **signs its data at the source** lets the backend check the reading itself, even if the gateway is compromised.

## Where mTLS runs in this stack

| Hop | Who presents the client certificate | Who checks it | How |
|---|---|---|---|
| **Device → edge** | Each device, with its own certificate | Cloudflare at the edge | Client certificates checked by the edge; the Worker reads the result from `request.cf.tlsClientAuth` |
| **Edge → origin** | Cloudflare | Your origin | [Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/): the origin refuses anyone without Cloudflare's client certificate, so nobody can skip the edge |
| **Worker → partner API** | The Worker | The partner's server | A Workers [mTLS certificate binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/mtls/): the key is held by Cloudflare, not in your code |
| **Service → service** | Each Rust service | The other Rust service | `rustls` on both sides, examples below |
| **SAP → integration** | The integration user | Integration Suite | A client certificate on the integration user, as in Signing Keys by Proxy |

## Rust: an mTLS client

The client loads its own certificate and key, and trusts only your private CA for the server. A sketch with `reqwest` built with its `rustls-tls` feature:

```rust
// Sketch: a device or service calling the backend over mTLS.
use reqwest::{Certificate, Client, Identity};

fn mtls_client(cert_and_key_pem: &[u8], private_ca_pem: &[u8]) -> reqwest::Result<Client> {
    let me = Identity::from_pem(cert_and_key_pem)?;          // this client's certificate + private key
    let ca = Certificate::from_pem(private_ca_pem)?;         // the CA that signed the server
    Client::builder()
        .use_rustls_tls()
        .identity(me)                                         // shown in the handshake
        .tls_built_in_root_certs(false)                       // trust only your CA, not every public one
        .add_root_certificate(ca)
        .build()
}
```

## Rust: an mTLS server

The server requires a client certificate signed by your client CA. With `rustls` 0.23, the verifier refuses a client that shows no certificate or a certificate from anyone else:

```rust
// Sketch: a Rust service that only talks to clients holding a certificate from your CA.
use std::sync::Arc;
use rustls::{server::WebPkiClientVerifier, RootCertStore, ServerConfig};

fn mtls_server_config(
    client_ca: Vec<rustls::pki_types::CertificateDer<'static>>,
    my_chain: Vec<rustls::pki_types::CertificateDer<'static>>,
    my_key: rustls::pki_types::PrivateKeyDer<'static>,
) -> anyhow::Result<ServerConfig> {
    let mut roots = RootCertStore::empty();
    for ca in client_ca { roots.add(ca)?; }                   // your client CA only
    let verifier = WebPkiClientVerifier::builder(Arc::new(roots)).build()?; // a client cert is required
    Ok(ServerConfig::builder()
        .with_client_cert_verifier(verifier)
        .with_single_cert(my_chain, my_key)?)
}
```

After the handshake, read the client certificate's identity (its subject or SAN, for example `device:D-1042`) and look up that device's **grant** in Xano before acting. The handshake proves who; the grant decides what.

## On Cloudflare Workers

crm-sync runs on Workers, where Cloudflare terminates TLS. When client certificates are required at the edge, the Worker doesn't see the handshake; it reads the result:

```ts
// The edge already ran the handshake; refuse anything it didn't verify.
const auth = request.cf?.tlsClientAuth;
if (!auth || auth.certVerified !== "SUCCESS") return new Response("client certificate required", { status: 403 });
const device = auth.certSubjectDN;   // then look up this device's grant in Xano
```

For outbound calls to a partner that requires mTLS, an mTLS certificate binding in the Worker's configuration presents the certificate for you; the private key stays with Cloudflare and never appears in your code or logs.

## One certificate per device, held outside the gateway

mTLS is only as good as where the private keys live. Three rules make it worth having:

- **One certificate per device, service and agent.** A shared certificate means one leak impersonates every device, and revoking it locks them all out at once. One each means you revoke exactly the one that leaked.
- **Short-lived certificates.** Hours or days, renewed automatically, so a leaked key expires on its own. Long-lived certificates turn every leak into a revocation project.
- **Keys outside the appliance.** A gateway that holds every device's key in memory is one memory-disclosure bug away from losing all of them, which is the NetScaler lesson. Keep keys on the device (ideally in a secure element), in an HSM, or with the edge platform, never pooled in the box in the middle.

## The inventory lives in Xano

Every certificate is a record in the system of record, so revocation is a write, not a hunt:

| Field | Why |
|---|---|
| `subject` (device, service or agent ID) | Which one this is |
| `serial`, `issuer`, `fingerprint_sha256` | Which certificate exactly, and which CA chain it depends on |
| `not_before`, `not_after` | When it expires, so renewal happens before lockout |
| `revoked_at`, `revoked_reason` | Checked on every action; set it and the next request is refused |
| `grant_id` | The permission this identity holds, separate from the certificate |

When a CA is distrusted or a gateway leaks, the inventory answers the first question in minutes: *which of our certificates chain through it, and which devices hold them?*

## Related

- [Signing Keys by Proxy: AI Security, Globalization, Tools and Permissions](./SIGNING-KEYS-BY-PROXY.md)
- [Cloudflare: Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/) and [mTLS for Workers](https://developers.cloudflare.com/workers/runtime-apis/bindings/mtls/)
- [rustls](https://docs.rs/rustls/) and [reqwest](https://docs.rs/reqwest/)

*Code is illustrative: check crate versions and feature flags before you build. Patterns, not claims about any firm.*
