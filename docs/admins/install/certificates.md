---
title: Hostnames and Certificates
description: The three hostnames every deployment needs and how their certificates are issued. Plain single-name certificates are enough.
---

# Hostnames and Certificates

Every deployment uses three hostnames. Each has its own certificate for exactly one name. Plain single-name certificates are enough.

| Value | Example | Serves |
|---|---|---|
| `hosts.service` | `eduide.example.org` | Landing page, `/api/v1`, public status |
| `hosts.instance` | `instance.eduide.example.org` | All IDE sessions, as `https://<instance host>/<instance id>/` |
| `hosts.webview` | `webview.instance.eduide.example.org` | Webviews of all sessions. Fixed name: `webview.` plus the instance host |

The three names must differ. The session routes catch every path on the installation and webview host, so the service host cannot be shared with them.
The instance host and the webview host should be subdomains of the service host, because the service sends `Strict-Transport-Security` with `includeSubDomains`.
If they are not, see the HSTS setting in [Installing EduIDE](installing.md#hsts).

## DNS

Point all three names at the address of the Gateway. Three `A` or `AAAA` records, or three `CNAME` records, are enough.

## Certificates

With `gateway.create: true` the chart renders a Gateway with an HTTPS listener per hostname and an HTTP listener on port 80 for ACME.
cert-manager reads the Gateway annotations and issues one certificate per HTTPS listener.

```yaml
gateway:
  create: true
  className: envoy
certManager:
  issuerRef: {name: letsencrypt, kind: ClusterIssuer}
```

If your ClusterIssuer solves HTTP01 only through a shared Gateway, let the chart create a namespaced Issuer that solves through the Gateway of the deployment:

```yaml
issuer:
  create: true
  name: letsencrypt
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.org
```

With your own Gateway, create three certificates yourself and reference them from its listeners.
The control plane chart alerts when a certificate of the namespace expires within 21 days or is not ready for an hour (`monitoring.rules.certificates`).
