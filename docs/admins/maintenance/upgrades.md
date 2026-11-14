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
Then move to 2.7.3 as described in
[Upgrading from 2.6 to 2.7.0](#upgrading-from-26-to-270), which renames every app.

### The upgrade fails without these

- **`keycloak.cookieSecret`.** The chart no longer ships a default and fails to
  render without one. Set a unique value per installation, see
  [Access Control](../platform/access-control.md#oauth2-proxy-cookie-secret).
- **`versions.cloud` 1.2.1 or later.** The chart passes the new
  `--allowedEnvFromSecrets`, `--allowedEnvFromConfigMaps` and
  `--allowCustomEnvFromMap` flags, which operator 1.2.0 rejects at startup. The
  chart pins 1.2.2; check only if your values override `versions.cloud`,
  `operator.image` or `service.image`. A full image reference there wins over
  `versions.cloud`.
- **`versions.landingPage` 1.3.0 or later.** The landing page Deployment now
  runs as non-root on port 8080. An older image runs as root on port 80 and its
  pods do not start. The chart pins 1.3.1; check only if your values override
  `versions.landingPage` or `landingPage.image`.

### Behaviour that changes unless you set something

- **Artemis links wait for a click.** A link with `gitUri` and `artemisToken`
  starts the IDE by itself only when both hosts are in
  `landingPage.trustedArtemisHosts`, which is empty by default. List your
  Artemis host there, and your git server's host if it differs.
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
session monitor) arrive with EduIDE 1.5.0, which chart 2.7.0 pins. Until the IDE
images carry the session monitor, every activity poll fails, and from
EduIDE-Cloud 1.2.1 the operator keeps such a session running rather than
treating it as idle. Inactivity shutdown therefore does not happen yet; sessions
end at the app definition's `timeout`. It starts working with
[Upgrading from 2.x to 3.0.0](#upgrading-from-2x-to-300).

EduIDE 1.5.0 no longer publishes the `rust`, `ocaml` and `haskell` images, but
charts up to 2.6.2 still offer `rust-latest` and `ocaml-latest`. Do not set
`versions.ide: 1.5.0` on such a chart; move to 2.7.0 instead.

## Upgrading from 2.6 to 2.7.0

Chart 2.7.0 replaces the single `appDefinitions.apps` map with a catalog, your
own apps and an `enabled` list, and renames every app. See
[App Definitions](../platform/app-definitions.md) for the new keys. Go to 2.7.3
directly, and skip 2.7.1:

- **2.7.1** preloads the oauth2-proxy image when Keycloak is on, so the first
  session on a node no longer pulls it. Its preload container cannot start in
  that image, which has no shell, so the preloading DaemonSet crash-loops on
  every node.
- **2.7.2** fixes that.
- **2.7.3** updates the workspace garbage collector with security dependency
  fixes.

### Running sessions end

Every app loses its `-latest` suffix: `java-17-latest` becomes `java-17`,
`c-templates-latest` becomes `c-templates`, and so on. Helm deletes the old
AppDefinitions, and with them the prewarmed pods, session ingresses and sidecars
they own, so every running session ends. Upgrade outside lecture hours.

### Move every reference to the new names in the same window

- `landingPage.appDefinition` (the chart default is now `java-17-templates`)
- keys under `appDefinitions.apps` in your values files
- the app names your Artemis offers (`theia.images` in its configuration)
- `theiaImage` of existing Artemis exercises and saved workspaces, which need
  a data migration

### Persistent workspaces get new names

The landing page derives a persistent workspace's name from the app name, so
after the rename a link opens a new, empty workspace instead of the old one.
The old workspace is not migrated, and the workspace garbage collector can
delete it later. Installations with `landingPage.ephemeralStorage: false` should
tell students to push their work before the upgrade.

### Which apps you get

- **On chart defaults** you lose Rust and OCaml, keep the other six apps, and
  gain `java-25` and `java-25-templates`.
- **A list of `null` removals** still works (`apps.<name>: null`), but an
  `enabled` list naming what you offer is shorter and does not grow when the
  catalog does. Replace one with the other.
- **With a non-empty `enabled`**, an app of your own under `apps` renders only
  if `enabled` names it too.
- **A name in `enabled` with no definition** is skipped, and `helm upgrade`
  prints a warning naming it. Read the output after the upgrade.
- **An image of your own** goes under `apps` with its full reference including
  the tag, for example `registry.example.edu/ide/haskell:2.1.0`. An `image`
  without a tag still takes the tag from `versions.ide`.

The cluster chart moves to 2.7.0 without changes; upgrade it to keep both
versions equal.

## Upgrading from 2.7 to 2.8, 2.9 and 2.10

Chart 2.8.0 to 2.10.0 add behaviour that is off or harmless until you use it.
Go to 3.0.0 directly if you can, see
[Upgrading from 2.x to 3.0.0](#upgrading-from-2x-to-300). Where you stop on one
of these, this is what each adds:

- **2.8.0** adds `global.nodeSelector`, which pins every EduIDE workload to the
  nodes carrying those labels. See
  [Pinning EduIDE to a node pool](../install/prerequisites.md#pinning-eduide-to-a-node-pool).
  Empty, the default, renders as before. The chart pins EduIDE-Cloud 1.3.0, the
  first release with `--sessionNodeSelector`, and updates the workspace garbage
  collector to chart 0.2.0, which reads the value too. Set the same value on
  `eduide-cluster` to pin the conversion webhook, and delete prewarmed sessions
  once after setting it.
- **2.8.1** shows the "Are you still here?" dialog after 50 minutes without
  input instead of 55 and times out after 60. Both are explicit in
  `appDefinitions.defaults.monitor.activityTracker` (`notifyAfter: 50`,
  `timeoutAfter: 60`). Whether the timeout fires depends on the operator and the
  IDE images, see [Session Management](../operations/session-management.md#when-a-session-ends-for-inactivity).
- **2.9.0** redirects a request for an ended session to the landing page's
  `/session-ended` page instead of answering 5xx. Pair it with a landing page
  image that serves that page; an older image shows its start page, which is
  still better than the 5xx it replaces. Turn it off with
  `gateway.routes.sessionEndedRedirect.enabled: false`.
- **2.10.0** adds `operator.metricsPort` and, in `eduide-cluster`, a `PodMonitor`
  and a "Sessions ended per hour, by reason" dashboard panel, see
  [Operator metrics](../operations/monitoring-basics.md#operator-metrics). Set
  `operator.metricsPort` only with an EduIDE-Cloud release that has
  `--metricsPort`; an older operator does not start with it.

Both charts move together to 2.10.0 and 3.0.0, so upgrade the cluster chart
first as usual. Landing page logout also changed in this window: the landing
page drops the Keycloak callback fragment from its redirect URI, which fixes
"Invalid redirect uri" on logout. The Keycloak client needs no change, see
[Access Control](../platform/access-control.md#invalid-redirect-uri-when-logging-out).

## Upgrading from 2.x to 3.0.0

Chart 3.0.0 is a breaking release. It introduces two editions per language, a
new app catalog and renames three apps, and it needs three matching releases:

| Component | Version |
|---|---|
| Helm charts `eduide` and `eduide-cluster` | 3.0.0 |
| EduIDE IDE images (`appVersion`) | 2.0.0 |
| EduIDE-Cloud (operator and REST service) | 2.0.0 |
| EduIDE-Landing-Page | a release that reads the per-app `ephemeral` flag |

The old image names are frozen at their last tag, so 3.0.0 only works with
EduIDE 2.0.0. Go to 3.0.0 from 2.10.0; read the sections above if you are
older.

### What changes

- **Two editions per language.** The Artemis apps (`java-17`, `java-25`,
  `python`, `javascript`, `c`, and new `rust` and `go`) keep their names and now
  use the images `eduide/<lang>-artemis`. All of them are hidden from the
  landing page. New `<lang>-standalone` apps use `eduide/<lang>-standalone`, are
  offered on the landing page and list their starter projects in
  `landingPage.buildSystems`. See [App Definitions](../platform/app-definitions.md).
- **Three apps are renamed.** `java-17-templates`, `java-25-templates` and
  `c-templates` are now `java-17-standalone`, `java-25-standalone` and
  `c-standalone`. The render fails while `appDefinitions.enabled` still names an
  old one, with the new name in the message.
- **`python` and `javascript` are hidden Artemis apps.** An installation that
  offered them on the landing page switches to `python-standalone` and
  `javascript-standalone`.
- **Empty `enabled` offers and preloads 14 images** on every node, two editions
  of seven languages. List the apps you use.
- **`landingPage.appDefinition` defaults to `java-17`**, the app for links
  without `?appDef=`, which is the Artemis start. The render fails when it names
  an app the installation does not render, so update an override that still
  names a `*-templates` app.
- **Per-app `landingPage.ephemeral`** overrides `landingPage.ephemeralStorage`.
  Template apps were persistent before; the standalone apps follow the setting
  now. The privacy page states the workspace as persistent when any rendered
  app, hidden ones included, is persistent.
- **Temporary sessions lose their files after 60 minutes without input**, not
  after the 24 hour lifetime. The timeout now works, see below.
- **A closed tab ends its session too**, 60 minutes after the last input.
- **Ended sessions land on `/session-ended`**, with an explanation and a resume
  button for a saved workspace.
- **Installation-specific images need a full path and tag.** The chart prefixes
  `imageRegistry` to anything else. Derive such an image `FROM` an edition image,
  see [Installation-specific images](../platform/app-definitions.md#installation-specific-images).
- **The images `java-17`, `java-25`, `python`, `javascript`, `c`, the
  `*-templates` images and `thm-java-25` get no new tags.** Only the
  `<lang>-artemis` and `<lang>-standalone` images are built from 2.0.0 on.

### What a running installation loses

Removing or renaming an app deletes its AppDefinition, and with it the prewarmed
pods, session ingresses and sidecars it owns. **Running sessions of the renamed
apps end.** The new images also replace every running session. Persistent
workspaces created under the old template apps are not reachable afterwards:
the landing page names a workspace after its app, so a link opens a new, empty
one. The old workspaces stay until the
[garbage collector](../operations/garbage-collection.md) removes them, and work
in them that was never pushed is gone for the student.

### Steps, in order

1. **Pick a maintenance window** outside lecture hours and exercises. Tell
   students to push their work before it.
2. **Check the version pins.** `versions.cloud` must be EduIDE-Cloud 2.0.0 or
   later, `versions.landingPage` a landing page release that reads the per-app
   `ephemeral` flag (older ones ignore it and use `landingPage.ephemeralStorage`
   for every app), and the IDE images EduIDE 2.0.0. The chart's `appVersion` is
   2.0.0; check your values only if they override `versions.*`, `operator.image`,
   `service.image` or `landingPage.image`. Do not release or deploy 3.0.0 before
   these exist.
3. **Update your values files.**
   - In `appDefinitions.enabled`, rename the three `*-templates` names, and add
     `python-standalone`, `javascript-standalone` and any of the new `rust-standalone`
     and `go-standalone` you want. List every app explicitly.
   - Rename the keys under `appDefinitions.apps` that override a renamed app.
   - Update `landingPage.appDefinition` if it names a `*-templates` app.
   - Keep the app name where persistent workspaces exist for it, as TH Mannheim
     does with `thm-java-25-latest`. Only its `image` changes, to a full path and
     tag.
   - Decide per app whether sessions are temporary. To keep the standalone
     sessions persistent as the template ones were, set
     `landingPage.ephemeral: false` on the `-standalone` apps.
   - Review `timeoutAfter` and `notifyAfter` (see below).
4. **Look at the diff.** `helm diff upgrade` shows which AppDefinitions are
   deleted and created, and which images join the preload list.
5. **Upgrade the cluster chart**, then the installation, with a generous
   `--timeout` or without `--wait`, because every node preloads the new images
   (see [`--wait` and image preloading](#--wait-and-image-preloading)).
6. **Move `minInstances` to the new apps.** The chart reads the live
   `minInstances` back, so a new AppDefinition starts with the catalog value
   (`0`, and `3` for `java-17`) and your setting on the old app is gone. Patch the
   new ones through the admin API, see
   [Adjusting scaling at runtime](../platform/app-definitions.md#adjusting-scaling-at-runtime):

   ```bash
   curl -X PATCH \
     -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"minInstances": 10}' \
     https://service.<landing-host>/service/admin/appdefinition/java-25-standalone
   ```

7. **Check afterwards.**
   - `kubectl -n <namespace> get appdefinitions.theia.cloud` lists what you
     expect, and the landing page offers one tile per language with a
     "Temporary" or "Saved" badge.
   - Start a session from the landing page and one from Artemis. Open a webview
     panel in each.
   - Check the idle timeout. The operator log shows
     `Notifying session as timeout of N minutes was reached!` after an idle
     period, and a closed tab ends its session.
   - The Artemis configuration still names the Artemis apps (`java-17`, `c`,
     `python`, ...), which keep their names. A configuration that names a
     `*-templates` app needs the new name, and existing exercises that carry one
     in `theiaImage` need a data migration.

Rolling back from 3.0.0 to 2.x deletes the new AppDefinitions and recreates the
old ones, which ends running sessions a second time. Plan the window so that you
do not need it, see [Rollback](rollback.md).

### Idle sessions end now

Since chart 2.8.1 the limits are `notifyAfter: 50` and `timeoutAfter: 60`, but
an open idle tab only times out with IDE images that carry `theia-cloud-monitor`
v1.4.0 (the pin in EduIDE 2.0.0), and a closed tab only ends its session with an
operator from EduIDE-Cloud 1.4.0 or later. Before, sessions
effectively ran until the 24 hour lifetime. Expect more "my session closed"
questions in the first weeks, especially from students who listen to a lecture
with the IDE open but untouched. Raise `timeoutAfter` and `notifyAfter` per
installation if 60 and 50 are too short, and keep the gap between them larger
than `monitor.activityTracker.interval`.

Two details to know: a monitor older than v1.4.0 never times out an open idle
tab, and after the operator restart that every `helm upgrade` causes, sessions
whose tab was already closed run until their lifetime limit once.

If you set `operator.metricsPort`, the sessions dashboard shows the sessions
that ended for inactivity and for lifetime, see
[Operator metrics](../operations/monitoring-basics.md#operator-metrics).

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
