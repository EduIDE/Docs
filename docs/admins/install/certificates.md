---
title: Certificates and DNS
description: The four hostnames every installation needs, why one of them must be a wildcard, and the two ways to get a certificate for it.
---

# Certificates and DNS

Read this before you install. The wildcard requirement below is the single thing
most likely to delay a new installation, because it often needs a request to a
DNS or PKI team that takes days.

## Four hostnames per installation

For an installation whose landing page is at `eduide.example.edu`:

| Hostname | Serves |
|---|---|
| `eduide.example.edu` | the landing page |
| `service.eduide.example.edu` | the REST service the landing page calls |
| `instance.eduide.example.edu` | session ingress |
| `*.webview.instance.eduide.example.edu` | **per-session webviews** |

All four need DNS pointing at your Gateway's external address. The fourth is a
**wildcard record**, because every session gets its own subdomain under it.

:::caution Check your DNS policy first
Some institutions do not hand out wildcard records, or require a specific
approval. Find out before you plan the rest of the install — there is no
configuration that avoids the wildcard if you want webviews.
:::

## Why the wildcard exists

Inside the IDE, anything rendered in a panel — a Markdown preview, a notebook, a
rendered PDF, embedded documentation — is served from its own origin so that it
cannot script against the IDE itself. Those origins are
`<something>.webview.instance.<your host>`.

Without the wildcard, sessions still start and the IDE still loads. **Only the
previews break**, with an opaque failure inside the IDE. That means this is
usually discovered by a student weeks after go-live rather than by you during
installation.

## Why ACME cannot issue it over HTTP-01

This is the part that catches people out.

cert-manager will happily issue certificates for the first three hostnames using
an **HTTP-01** challenge: it serves a token over plain HTTP on port 80 at that
exact hostname, and the CA fetches it.

That cannot work for a wildcard. To prove control of `*.webview.instance.<host>`
you would have to serve a token at every possible name under it, which is
infinite. **The ACME specification therefore does not permit HTTP-01 for
wildcards at all** — it is not a cert-manager limitation and no configuration
changes it.

You have two options.

## Option A — DNS-01 (recommended)

With a **DNS-01** challenge, cert-manager proves control by writing a TXT record
into your zone, which works for a wildcard because it proves control of the
whole zone. This is the better answer: cert-manager then issues *and renews* the
wildcard automatically, and you never think about it again.

It needs an API credential for your DNS zone. cert-manager has built-in support
for Route53, CloudDNS, AzureDNS, Cloudflare, DigitalOcean, ACME-DNS and RFC-2136
dynamic updates, plus community webhook providers for many university DNS
systems.

**Ask your DNS team for a scoped API credential before assuming this is
impossible.** RFC-2136 works with BIND, which many universities run.

Store the credential as a Secret, then set `gatewayAcmeIssuer.solvers` in the
cluster chart values:

```yaml
gatewayAcmeIssuer:
  enabled: true
  email: platform@example.edu
  solvers:
    # DNS-01 for the wildcard
    - dns01:
        cloudflare:
          apiTokenSecretRef: { name: cloudflare-api-token, key: token }
      selector:
        dnsNames: ["*.webview.instance.eduide.example.edu"]
    # HTTP-01 for everything else
    - http01:
        gatewayHTTPRoute:
          parentRefs:
            - group: gateway.networking.k8s.io
              kind: Gateway
              name: theia-shared-gateway
              namespace: eduide-system
```

Then simply list the wildcard alongside the other names:

```yaml
managedCertificates:
  enabled: true
  certificates:
    - name: eduide-tls
      secretName: eduide-tls
      dnsNames:
        - eduide.example.edu
        - service.eduide.example.edu
        - instance.eduide.example.edu
        - "*.webview.instance.eduide.example.edu"
```

## Option B — bring your own wildcard certificate

If you cannot get a DNS-01 credential, obtain the wildcard some other way — a
commercial CA, or your institution's certificate service — and hand it to the
cluster chart.

```bash
cat wildcard.crt | base64 | tr -d '\n'   # -> certificate
cat wildcard.key | base64 | tr -d '\n'   # -> key
```

```yaml
wildcardTLSSecret:
  create: true
  name: eduide-webview-tls
  certificate: "<base64 of the full chain>"
  key: "<base64 of the private key>"
```

and point the webview listener at it:

```yaml
gateway:
  listeners:
    - name: prod-webview
      hostname: "*.webview.instance.eduide.example.edu"
      tlsSecretName: eduide-webview-tls
```

The trade-off is that **this does not renew itself.** Put the expiry date in
whatever your team uses to track such things. A wildcard that expires takes out
every webview at once.

## Nothing tells you when a certificate is wrong

This is worth internalising, because it has already cost one installation six
months.

Gateway API **never compares a certificate's names against the listener's
hostname.** A listener whose Secret holds a certificate for an entirely
different host reports:

```
Programmed=True   Accepted=True   ResolvedRefs=True
```

Everything looks healthy. The first symptom is a browser certificate warning.
The second is subtler and much more confusing: the landing page loads (the user
clicks through the warning), then its JavaScript calls `service.<host>` — a
different origin — and the browser **silently blocks that request** because that
certificate is invalid too. The launch never reaches the server, so there is
nothing in any log to find.

**Verify explicitly, and never with `curl -k`:**

```bash
for h in eduide.example.edu service.eduide.example.edu instance.eduide.example.edu; do
  echo | openssl s_client -connect "$h:443" -servername "$h" 2>/dev/null \
    | openssl x509 -noout -checkhost "$h"
done
```

Each should print `Host <name> matches certificate`. Then check the wildcard by
testing a name under it:

```bash
h=probe.webview.instance.eduide.example.edu
echo | openssl s_client -connect "$h:443" -servername "$h" 2>/dev/null \
  | openssl x509 -noout -checkhost "$h"
```

And confirm a browser would accept it — `%{ssl_verify_result}` must be `0`:

```bash
curl -s -o /dev/null -w '%{http_code} %{ssl_verify_result}\n' https://eduide.example.edu
```

## Adding an installation later

When you add a second installation to a cluster, its three non-wildcard names
must be added to the certificate, and it needs its own webview wildcard.

A certificate that covers your existing installations but not the new one will
not fail anything visibly — see above. Re-check with the commands in this page
after every change.

:::tip Only put names with a listener on a certificate
cert-manager proves each name with its own challenge. A name on the certificate
that has no matching Gateway listener will fail its HTTP-01 challenge with a
404, and that one pending challenge **blocks the whole certificate** — including
every name that would otherwise have worked.
:::

## Checklist

- [ ] Four DNS records per installation, one of them a wildcard
- [ ] DNS policy permits wildcards, or Option B is agreed
- [ ] A DNS-01 credential obtained, or a wildcard certificate obtained and its
      expiry tracked
- [ ] Every hostname verified with `openssl ... -checkhost`, not `curl -k`
- [ ] `ssl_verify_result` is `0` for the landing page **and** the service host
