---
title: Upgrades
description: Moving an installation to a new EduIDE version.
---

# Upgrades

An upgrade is a version change and a `helm upgrade`. There is no multi-chart
ordering to remember any more — there are two charts, and only one of them is
usually involved.

## What you are upgrading

| Chart | When it changes | Blast radius |
|---|---|---|
| `eduide` | Most upgrades | One installation |
| `eduide-cluster` | CRDs, the conversion webhook, Gateway or issuer changes | **Every installation on the cluster** |

Both carry the same version. Read the release notes to see whether the cluster
chart changed; if it did, upgrade it first and expect it to affect everyone.

## Before

- Read the release notes, particularly for CRD changes.
- Check what you are running: `helm list -n <namespace>`.
- Know how to go back: [Rollback](rollback.md).
- On a cluster with more than one installation, upgrade a test one first.

## Upgrading an installation

```bash
helm upgrade eduide oci://ghcr.io/eduide/charts/eduide \
  --version <new-version> -n <namespace> \
  -f values.yaml -f secrets.yaml \
  --wait --timeout 15m
```

Keep the same release name and the same values files. Changing the release name
is not an upgrade — Helm treats it as a new install and will refuse to adopt the
existing resources.

:::tip Preview it first
`helm diff upgrade` (from the helm-diff plugin) shows what will change before
anything is applied. On a live installation this is worth the extra step.
:::

### `--wait` and image preloading

The preloading DaemonSet pulls every IDE image onto every node. On an upgrade
that changes the image set, that can take longer than a sensible Helm timeout.

Either allow a generous `--timeout`, or drop `--wait` and watch the rollout
yourself:

```bash
kubectl -n <namespace> rollout status deploy/operator-deployment
kubectl -n <namespace> rollout status deploy/service-deployment
kubectl -n <namespace> rollout status deploy/landing-page-deployment
```

Note the `-deployment` suffix; the Deployments are not named `operator` or
`service`.

## Upgrading the cluster chart

```bash
helm upgrade eduide-cluster oci://ghcr.io/eduide/charts/eduide-cluster \
  --version <new-version> -n eduide-system \
  -f cluster-values.yaml --wait
```

CRDs are ordinary templates in this chart rather than files in `crds/`, which
means `helm upgrade` genuinely updates them — unlike many charts, where CRD
changes need a manual `kubectl apply`.

That cuts both ways: a CRD change lands the moment you upgrade, for every
installation on the cluster at once. **A release that changes a stored CRD
version cannot be undone by rolling back the tenant chart** — see
[Rollback](rollback.md).

## What visitors see during an upgrade

From chart 2.4.0, the landing page never shows Envoy's raw
`no healthy upstream`. While it has no ready pod, Envoy answers with a static
page instead: "EduIDE is currently unavailable", with a German line below and a
reload every 30 seconds. The status code stays 503. It needs Envoy Gateway;
set `maintenancePage.enabled: false` if you route with something else.

An upgrade rarely gets that far. The landing page and REST service start a new
pod before stopping an old one and drain for 10 seconds before shutting down.
With `landingPage.replicas` and `service.replicas` at 2 they also survive a
node going away, with a PodDisruptionBudget each. On a single-node cluster set
`podDisruptionBudget.enabled: false`, or every `kubectl drain` hangs.

To show the page on purpose, for maintenance that takes longer than an upgrade,
scale the landing page to 0 and back:

```bash
kubectl -n <namespace> scale deploy/landing-page-deployment --replicas=0
kubectl -n <namespace> scale deploy/landing-page-deployment --replicas=<your landingPage.replicas>
```

The next `helm upgrade` also brings it back. Only the landing page shows the
page: the REST service and running sessions keep their own errors, and students
already in an IDE keep working.

## After

- All four Deployments Ready, no pod in `ImagePullBackOff`.
- The landing page returns 200 **and its TLS validates without `-k`**.
- Start a real session and open something in a webview panel. Everything above
  can be healthy while sessions do not start.
- If the AppDefinition set changed, check the landing page offers what you
  expect.

## Upgrading from 2.4 or 2.5.0 to 2.5.1 and later

Chart 2.5.1 turns on the session hardening described in
[Session Hardening](../security/session-hardening.md). Most of it needs nothing
from you, but some of it refuses to render, or quietly changes behaviour, until
you act. Go to 2.6.2 directly: 2.6.x adds only the items listed at the end.

### The upgrade fails without these

- **`keycloak.cookieSecret`.** The chart no longer ships a default and fails to
  render without one. Set a unique value per installation, see
  [Access Control](../platform/access-control.md#oauth2-proxy-cookie-secret).
- **`versions.cloud` 1.2.1 or later.** The chart passes the new
  `--allowedEnvFromSecrets`, `--allowedEnvFromConfigMaps` and
  `--allowCustomEnvFromMap` flags, which operator 1.2.0 rejects at startup. The
  chart pins 1.2.2; check only if your values override `versions.cloud`.
- **`versions.landingPage` 1.3.0 or later.** The landing page Deployment now
  runs as non-root on port 8080. An older image runs as root on port 80 and its
  pods do not start. The chart pins 1.3.1; check only if your values override
  `versions.landingPage` or `landingPage.image`.

### Behaviour that changes unless you set something

- **Artemis links wait for a click.** A link with `gitUri` and `artemisToken`
  starts the IDE by itself only when both hosts are in
  `landingPage.trustedArtemisHosts`, which is empty by default. List your
  Artemis host there, and your git server's host if it differs.
- **Sentry on the landing page stops.** It no longer has a built-in endpoint.
  With `landingPage.sentry.enable: true`, also set `landingPage.sentry.dsn`, or
  it stays off.
- **The footer shows the landing page version.** It now reads the tag of the
  running landing page image, for example `v1.3.1`.
  `landingPage.footerLinks.attribution.version` still overrides it, so remove
  that value to show the real version.
- **Session cookies need HTTPS.** `oauth2Proxy.cookieSecure` defaults to
  `true`. An installation served over plain HTTP must set it to `false`, or
  login never completes.
- **Repository links get a new workspace.** Landing page 1.3.0 puts the user
  and the full app key into the workspace name, so two users can no longer end
  up with the same name. The first launch of each repository link after the
  upgrade creates a new workspace. The old ones stay until the
  [garbage collector](../operations/garbage-collection.md) removes them, and
  work in them that was never pushed is no longer reachable from the landing
  page. Playground workspaces keep their names. Upgrade between exercises, and
  tell students to push first.

### Check these against your cluster

- **NetworkPolicies are on.** They need a CNI that enforces them.
  `networkPolicies.gatewayNamespace` must name the namespace of your gateway
  (default `envoy-gateway-system`), or no request reaches a session. If your pod
  or service CIDR is outside the private ranges, or sessions must reach a host
  inside them, adjust `networkPolicies.privateEgressCidrs`. See
  [Session Hardening](../security/session-hardening.md#networkpolicies).
- **Launch requests can no longer mount Secrets or ConfigMaps.** If something
  of yours sends `env.fromSecrets` or `env.fromConfigMaps`, list those names in
  `operator.allowedEnvFromSecrets` and `operator.allowedEnvFromConfigMaps`.
  Sessions that are running keep what they already received; restart them to
  revoke it.
- **The operator's rights are namespaced.** If your setup needs it to act in
  other namespaces, set `operator.clusterWideRbac: true`.
- **The monitor port is 8081.** `appDefinitions.defaults.monitor.port` and
  `networkPolicies.monitorPort` both default to it. If you set a different
  monitor port on an app in `appDefinitions.apps`, the chart opens it too;
  keep `networkPolicies.monitorPort` matching the default. An AppDefinition
  created outside the chart with another monitor port needs its own
  NetworkPolicy allowing the operator in on that port.
- **Two secrets moved.** `SERVICE_AUTH_TOKEN` and `KEYCLOAK_CLIENTSECRET` are in
  the `service-config-secret` Secret now, not in the `service-config` ConfigMap.
  Update any tooling of your own that read them from there.

### 2.6.0 to 2.6.2

- **2.6.0** adds `preloading.nodeSelector`, so the preloading DaemonSet can be
  limited to labelled nodes. Empty, the default, renders as before. Sessions
  are not pinned by it: one that lands on another node pulls its image cold.
- **2.6.0** stops serving the AppDefinition versions `v1beta8` to `v1beta10`,
  which the conversion webhook cannot map. Every read at those versions failed
  anyway, and the API server retried them about six times a second, flooding its
  log. Use `theia.cloud/v1beta11`. This change is in `eduide-cluster`, so
  upgrade the cluster chart too. 2.5.1 was published without it.
- **2.6.1** pins landing page 1.3.1 and **2.6.2** pins EduIDE-Cloud 1.2.2. Both
  carry dependency security fixes only.

### Still on EduIDE 1.4.0

Every chart up to 2.6.2 pins the IDE images to EduIDE 1.4.0. The IDE-side
changes (Theia on loopback, no scanoss, the data bridge and Scorpio fixes, the
session monitor) arrive with EduIDE 1.5.0. That release no longer publishes the
`rust`, `ocaml` and `haskell` images. Charts up to 2.6.2 still offer
`rust-latest` and `ocaml-latest`, so if you pin 1.5.0 through `versions.ide` on
such a chart, remove them (`rust-latest: null`,
`ocaml-latest: null` under `appDefinitions.apps`) together with any app of your
own that uses `eduide/haskell`. The chart 2.7.0 catalog no longer lists them, see
[App Definitions](../platform/app-definitions.md).

Until the IDE images carry the session monitor, every activity poll fails, and
from EduIDE-Cloud 1.2.1 the operator keeps such a session running rather than
treating it as idle. Inactivity shutdown therefore does not happen yet; sessions
end at the app definition's `timeout`.

## Two things that do not behave as you would guess

**`minInstances` and `maxInstances` stop taking effect after the first install.**
The chart deliberately reads the live values back so that Helm does not reset
scaling that the admin API has changed. The consequence is that changing them in
your values file on an upgrade does nothing. Change them through the admin API
instead — see [App Definitions](../platform/app-definitions.md).

**`hosts.allWildcardInstances` does not update cleanly on upgrade.** If you
change it, reinstall rather than upgrade. This is called out in the chart's own
values file.

## Coordinating with your identity provider

An EduIDE upgrade does not change your Keycloak configuration. But if an upgrade
adds a hostname — a new installation, or a renamed one — the client's redirect
URIs need updating in the same change window, or login breaks for that host
only. See [Access Control](../platform/access-control.md).
