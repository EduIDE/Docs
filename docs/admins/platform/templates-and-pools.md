---
title: Templates and Pools
description: Which IDEs a deployment offers, how templates are defined in the chart values, and how warm pools keep start times short.
---

# Templates and Pools

A template (`IDETemplate`) is a kind of IDE: image, resources, port, environment, timeouts, persistence and the allowlist for launch data.
A pool (`IDEPool`) keeps idle, prewarmed instances of one template, so a launch claims one instead of starting a pod.
Both are rendered from the chart values. Edit the values and run `helm upgrade`; do not edit the objects by hand.

This section replaces the application definitions of EduIDE 2.x.

## Editions

EduIDE releases two editions per language:

| Edition | Template name | Listed | For |
|---|---|---|---|
| `artemis` | `java-17`, `python`, ... | No | Artemis courses. Includes the Artemis plugins. Started from Artemis links |
| `standalone` | `java-17-standalone`, ... | Yes | Everyone else. Users pick a start tile on the landing page |

Languages: Java 17, Java 25, Python, JavaScript, C, Rust, Go.
The installation chart carries a catalog of all of them, so a `templates` entry only names a template and overrides what differs.

## Choosing templates

```yaml
templates:
  java-17-standalone:
    pool: {minIdle: 1, maxInstances: 5}
  python-standalone: {}
  java-17:                # artemis edition, unlisted
    pool: {minIdle: 1, maxInstances: 5}
```

| Key | Meaning |
|---|---|
| `displayName`, `image`, `tag` | Display name, image, image tag (digest pin allowed: `tag: 3.0.0@sha256:...`) |
| `listed` | `true`: a start tile on the landing page. `false`: only by name through Artemis links and the API |
| `resources`, `port`, `placement`, `buildSystems` | Pod resources, IDE port, node placement, build systems the template accepts |
| `pool` | `minIdle` and `maxInstances`. No pool means every launch is a cold start |

An unlisted template still shows its name and logo in "Your environments".
`templateDefaults` applies to every template first: resources, user id, timeouts (idle 60 minutes, warning 50 minutes, maximum 24 hours) and persistence (`none` and `volume` allowed, default `none`).

## Warm pools

| Field | Owner | Meaning |
|---|---|---|
| `minIdle` | you, in the values | Floor of idle instances |
| `maxInstances` | you | Ceiling for the pool |
| `targetIdle` | the pool scaler | Current target, between the floor and the ceiling |

A warm launch claims an idle instance in milliseconds. A cold launch creates a pod.
Sessions with a saved workspace always start cold, because Kubernetes cannot attach a volume to a running pod.
Enable image prepull (`placement.prepull.enabled`), so cold starts do not wait for pulls.

### Pool scaler

The pool scaler raises and lowers `targetIdle` from demand it reads from Prometheus. Enable it with `poolScaler.enabled`.

| `poolScaler.mode` | Effect |
|---|---|
| `shadow` (default) | Computes and logs decisions, changes nothing |
| `active` | Writes `targetIdle` |

Set `poolScaler.config.poolLimits.<pool>.{floor,ceiling}` to bound it.
To stop it for one pool, set the annotation `eduide.github.io/scaler-override` on the `IDEPool`. For an emergency scale without the scaler:

```bash
kubectl -n eduide-<deployment> scale idepool <pool> --replicas=<n>
```

The scale subresource maps to `targetIdle`. The operator caps it at `maxInstances`.

## Launch data and allowed hosts

Users and Artemis pass launch data such as a repository URL or an Artemis token. Each template lists the keys it accepts (`injectableKeys`), with a format check per key.
Unknown keys answer HTTP 400. Repository and Artemis URLs must be `https` and their host must appear in `config.allowedHosts`.
Add every Git and Artemis host your users need, and nothing else.
`gitUriAllowCredentials: true` lets the repository URL carry user info, which Artemis uses to pass the student's token.
Set it only for templates that Artemis opens. See [Session Hardening](../security/session-hardening.md).

:::note Artemis
The Artemis fragment link needs Artemis pull request [ls1intum/Artemis#14702](https://github.com/ls1intum/Artemis/pull/14702), which is not yet merged upstream.
:::

## Checking

```bash
kubectl -n eduide-<deployment> get idetemplate,idepool
kubectl -n eduide-<deployment> get idepool <pool> -o jsonpath='{.status}{"\n"}'
```

`idleReady` equal to `minIdle` means the pool is warm. The control plane reads image metadata from the OCI annotation of the image; the condition `ImageMetadata` on the template tells why it is empty.
