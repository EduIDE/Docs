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

## After

- All four Deployments Ready, no pod in `ImagePullBackOff`.
- The landing page returns 200 **and its TLS validates without `-k`**.
- Start a real session and open something in a webview panel. Everything above
  can be healthy while sessions do not start.
- If the AppDefinition set changed, check the landing page offers what you
  expect.

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
