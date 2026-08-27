---
title: Installing EduIDE
description: Installing the platform on a cluster from the published charts.
---

# Installing EduIDE

EduIDE ships as two Helm charts, published as OCI artifacts to
`ghcr.io/eduide/charts`. They always carry the same version, and that version
is the platform version.

| Chart | Installed | Owns |
|---|---|---|
| `eduide-cluster` | once per **cluster** | CRDs, the conversion webhook, ClusterRoles, cert-manager issuers, the shared Gateway, PodMonitors and dashboards |
| `eduide` | once per **environment** | operator, REST service, landing page, routes, app definitions, image preloading |

The split exists because the two halves have different cardinality. CRDs and a
Gateway must exist once on a cluster; a tenant install exists once per namespace,
and there may be several on the same cluster. Installing cluster-scoped
resources from every tenant deploy is what previously made concurrent deploys
race each other.

## Prerequisites

The cluster must already have:

- **cert-manager**, for the conversion webhook's certificate and for issuing
  hostname certificates
- **Gateway API CRDs** and a Gateway controller. EduIDE is tested with Envoy
  Gateway
- a **storage class** for session volumes

## Cluster half

These two commands are the manual path. Day to day, `bootstrap-cluster.yml` and
`deploy.yml` run them for you — see
[Provisioning](../platform/provisioning.md).

```bash
helm install eduide-cluster oci://ghcr.io/eduide/charts/eduide-cluster \
  --version 2.0.0 -n eduide-system --create-namespace \
  -f cluster-values.yaml
```

`cluster-values.yaml` supplies the Gateway's listeners and the certificate
names. In the TUM installations this file is not written by hand — the
`Bootstrap cluster` workflow derives it from the environment manifests, so
adding an environment does not mean remembering to edit a second file.

## Tenant half

```bash
helm install eduide oci://ghcr.io/eduide/charts/eduide \
  --version 2.0.0 -n eduide-test1 --create-namespace \
  -f values.yaml -f secrets.yaml
```

The chart refuses to install if the cluster chart is absent, rather than letting
the operator crash-loop on a missing CRD.

## What one version pins

A bare install with no overrides pins every image. Nothing floats.

| Value | Source repository | Default |
|---|---|---|
| `versions.ide` | EduIDE — the IDE images | empty, meaning the chart's `appVersion` |
| `versions.cloud` | EduIDE-Cloud — operator and REST service | set by the release |
| `versions.landingPage` | EduIDE-Landing-Page | set by the release |

They are separate because the three repositories release on different cadences,
and a one-line landing-page fix should not rebuild fifteen multi-gigabyte IDE
images.

**Never set a single tag for everything.** A pull request only builds the images
of the repository it came from, so pointing all three at `pr-451` puts most of
the namespace into `ImagePullBackOff`.

## Minimum values

```yaml
hosts:
  configuration:
    baseHost: eduide.example.edu
    landing: eduide
    service: service.eduide
    instance: instance.eduide
  allWildcardInstances: ["*.webview."]

keycloak:
  enable: true
  authUrl: https://sso.example.edu/
  realm: your-realm
  clientId: eduide

gateway:
  parentRefs:
    - { name: theia-shared-gateway, namespace: eduide-system, sectionName: prod-landing }
    - { name: theia-shared-gateway, namespace: eduide-system, sectionName: prod-service }
    - { name: theia-shared-gateway, namespace: eduide-system, sectionName: prod-instances }
    - { name: theia-shared-gateway, namespace: eduide-system, sectionName: prod-webview }
```

Secrets — the Keycloak cookie secret and the admin API token — go in a second
values file, never on the command line. `--set` puts them in the process list
and in Actions debug logs.

**In normal operation you do not write that file.** The deploy workflow
generates it on the runner from the environment's GitHub Environment secrets and
it never reaches the repository. The commands on this page are for a first
install on a new cluster, or for manual intervention when the pipeline is
unavailable — in which case write `secrets.yaml` yourself, keep it out of git,
and delete it afterwards. Everything non-secret belongs in `values.yaml`.

## Four hostnames, not one

Each installation serves:

```
<landing>                        the landing page
service.<landing>                the REST service
instance.<landing>               session ingress
*.webview.instance.<landing>     per-session webviews
```

All four need DNS and all four need to be on a certificate. The webview host is
two labels below the instance host, so a wildcard covering the others does not
cover it — it needs its own certificate, and because it is a wildcard,
cert-manager cannot issue it over HTTP-01.

**A certificate that omits a hostname fails silently.** The Gateway reports the
listener healthy — Gateway API never compares a certificate's names against a
listener's hostname — so the first symptom is a browser warning, and the second
is the landing page being unable to call its own REST service, because the
browser blocks that cross-origin request over an invalid certificate.

## Verifying

```bash
kubectl -n <namespace> get deploy          # operator, service, landing-page, garbage-collector
kubectl -n <namespace> get appdefinitions.theia.cloud
kubectl -n <namespace> get httproute -o wide
curl -sI https://<landing>/                # 200, and TLS must validate without -k
```

Then start a real session from the landing page. Everything above can be healthy
while sessions do not start.
