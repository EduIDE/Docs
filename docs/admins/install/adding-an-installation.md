---
title: Adding an Installation
description: Standing up a new EduIDE installation for a course, department or university.
---

# Adding an Installation

An installation is one namespace on one cluster, with its own hostnames,
branding and identity provider. Adding one is a file, a GitHub Environment and
an approval — not a bespoke deployment.

## 1. Describe it

Two files under `environments/<name>/` in the deployment repository. They are
split by who reads them: `env.yaml` configures the **deploy** and Helm never
sees it; `values.yaml` configures the **chart** and the workflow never
interprets it.

`env.yaml` is deploy metadata only:

```yaml
apiVersion: eduide.dev/v1
kind: Environment
metadata:
  name: bonn
  displayName: EduIDE Bonn
  tier: production          # test | staging | production
spec:
  cluster: eduide           # must match a file in clusters/
  namespace: eduide-bonn    # every namespace carries the eduide- prefix
  platform:
    chartVersion: 2.0.0
    channel: release        # release | main
```

`values.yaml` is a plain Helm values file: hosts, Gateway `parentRefs`, Keycloak
and branding. Nothing else — image tags, app definitions, the preload list and
the storage class are all derived or come from the cluster.

## 2. Create the GitHub Environment

Named exactly as the directory, holding:

| Secret | What |
|---|---|
| `KUBECONFIG` | the cluster's kubeconfig |
| `THEIA_KEYCLOAK_COOKIE_SECRET` | `dd if=/dev/urandom bs=32 count=1 \| base64 \| tr -d -- '\n' \| tr -- '+/' '-_'` |

The admin API token is a repository secret and is inherited.

Add required reviewers for anything `tier: production` or `staging`. **Do not**
add them to an environment that deploys automatically — the approval gate blocks
the automation outright and the run waits forever.

## 3. Bootstrap the cluster

```
Actions -> Bootstrap cluster -> cluster: <name>, dry_run: true
```

This derives the Gateway's listeners, the certificate's hostnames and the
monitored namespaces from every environment that claims the cluster. Adding an
installation therefore needs no second file edited — and cannot end up with a
certificate that omits it, which is exactly how one environment ran for six
months on a certificate covering only its neighbours.

Read the diff, then run it again with `dry_run: false`.

## 4. Outside the repositories

- **DNS** for all four hostnames.
- **Keycloak**: a client matching `clientId`, with redirect URIs for the landing
  and instance hosts, post-logout redirect URIs for the landing host, and web
  origins for both. See [Access Control](../platform/access-control.md).
  catches it.
- **The webview wildcard certificate**, which cert-manager cannot issue over
  HTTP-01. It goes in the cluster's bootstrap environment as
  `THEIA_WILDCARD_CERTIFICATE_CERT` and `_KEY`.

## 5. Deploy

```
Actions -> Deploy (dispatch) -> environment: <name>
```

The deploy asserts which cluster it reached before touching anything, shows a
`helm diff` before applying, runs `--wait --atomic`, and prints a summary read
back from the cluster rather than echoed from its inputs.

## A note on identity

An installation with no identity provider configured yet must say so explicitly
with `keycloak.allowUnauthenticated: true`. The chart otherwise refuses to
render.

That flag exists because the oauth2-proxy configuration is emitted regardless of
whether Keycloak is enabled — the operator mounts it into every session pod by
literal name, so it cannot be conditional. Left at the chart's defaults it points
the proxy at a host that does not exist, and sessions fail at the proxy rather
than running unauthenticated. That is the worst of both outcomes, so the chart
makes you choose deliberately.
