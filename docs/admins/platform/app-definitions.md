---
title: App Definitions
description: Managing launchable IDE session types, their images, resource profiles, and scaling parameters.
---

# App Definitions

An App Definition is the platform's representation of a launchable IDE session type. It defines which container image to run, what compute resources to allocate, and how many instances the operator should pre-warm or allow to run concurrently.

From an admin perspective, App Definitions are the primary control point for managing what IDE environments are available and how the platform scales to handle demand.

## What an App Definition contains

Each App Definition specifies:

| Field | Purpose |
|---|---|
| `name` | Identifier used in API calls and the landing page configuration |
| `image` | Container image for the IDE session |
| `requestsMemory` / `requestsCpu` | Minimum resources guaranteed to each session pod |
| `limitsMemory` | Hard memory ceiling per session pod |
| `minInstances` | Number of pre-warmed (idle, ready) sessions the operator maintains |
| `maxInstances` | Maximum number of concurrent sessions allowed for this type |
| `options` | Additional per-definition configuration, such as data bridge settings |

The chart's catalog holds the IDE images EduIDE officially releases. From chart
3.0.0 every language comes in two editions, both with Scorpio and the data
bridge:

| Edition | App name | Image | Offered on the landing page | Started from |
|---|---|---|---|---|
| Artemis | `<lang>` | `eduide/<lang>-artemis` | no (`visible: false`) | Artemis, by name (`?appDef=`) |
| Standalone | `<lang>-standalone` | `eduide/<lang>-standalone` | yes | the landing page, or an external start |

`<lang>` is one of `java-17`, `java-25`, `python`, `javascript`, `c`, `rust` and
`go`, so the catalog holds 14 apps. The Artemis edition carries the Artemis
extension, the standalone edition does not; otherwise they are the same IDE.
Artemis stores the app name per exercise, which is why the Artemis names stay
without a suffix.

A standalone app lists the starter projects its image carries in
`landingPage.buildSystems`, one entry per template:

| Standalone app | `buildSystems` ids |
|---|---|
| `java-17-standalone`, `java-25-standalone` | `maven`, `gradle` |
| `python-standalone` | `python` |
| `javascript-standalone` | `node`, `web` |
| `c-standalone` | `make`, `bazel` |
| `rust-standalone` | `cargo` |
| `go-standalone` | `go` |

With one entry the landing page starts that template directly, with several it
shows the build system step, and with none it starts an empty workspace. The id
is the template folder in the image. To offer fewer templates in one
installation, override `buildSystems` in `apps` (see below).

A hidden definition can still be launched by name, but only the visible ones
appear in the drop-down.

Defaults are `requestsMemory: 500M`, `requestsCpu: 200m`, `limitsMemory: 2400M`,
`limitsCpu: "2"`, `minInstances: 0`, `maxInstances: 1000`, with Java (and, for
memory, Rust) overriding the CPU and memory upward. The catalog keeps three warm
sessions (`minInstances: 3`) on the Artemis app `java-17` only.

:::note Renamed in chart 2.7.0
Before chart 2.7.0 every name ended in `-latest` (`java-17-latest`,
`c-templates-latest`, ...). The rename replaces every AppDefinition, which ends
running sessions. Anything that refers to an app by name has to move to the new
name: Artemis exercises (`theiaImage`), saved workspaces,
`landingPage.appDefinition` and `apps` overrides in your values files.
:::

:::note Editions in chart 3.0.0
Chart 3.0.0 removes `java-17-templates`, `java-25-templates` and `c-templates`.
They are `java-17-standalone`, `java-25-standalone` and `c-standalone`. The
chart refuses to render while `enabled` still names an old one. `python` and
`javascript` are hidden Artemis apps now; their standalone counterparts are
`python-standalone` and `javascript-standalone`. See
[Upgrading from 2.x to 3.0.0](../maintenance/upgrades.md#upgrading-from-2x-to-300).
:::

## Changing which applications are offered

App definitions live in your installation's values for the `eduide` chart, under
`appDefinitions`. Three keys work together:

| Key | Owner | Purpose |
|---|---|---|
| `catalog` | the chart | The IDE images EduIDE officially releases. Do not edit it; override an entry through `apps` |
| `apps` | your installation | Your own apps, and overrides of catalog entries. A key matching a catalog entry is merged over it, so you only write the fields that differ |
| `enabled` | your installation | The names this installation offers. Empty (the default) offers every definition from `catalog` and `apps`, which from chart 3.0.0 is 14 images preloaded onto every node |

A `defaults` block supplies every field an app does not state itself.

```yaml
appDefinitions:
  # Offer only these. Leave empty to offer everything.
  enabled: [java-25-standalone, python-standalone, haskell]
  apps:
    python-standalone:
      limitsMemory: 4000M          # one field changed, the rest comes from the catalog
    haskell:                       # your own image, not in the catalog
      image: registry.example.edu/ide/haskell:2.1.0
      limitsMemory: 4000M
      landingPage:
        label: Haskell             # omit landingPage to deploy it but hide it
        image: theia-logo.png      # a logo the landing page ships, or a path starting with /
```

Keep these rules in mind:

- With a non-empty `enabled`, an `apps` entry renders only if `enabled` names it. Add your own app to `enabled` as well.
- A name in `enabled` with no definition in `catalog` or `apps` is skipped. `helm install` and `helm upgrade` print a warning naming it in the release notes, so check the output after every upgrade.
- `apps.<name>: null` removes an app, even when `enabled` lists it; the upgrade then warns about that name.
- An `image` without a tag takes the tag from `versions.ide` (or the chart's `appVersion`), so a release moves every IDE image at once. A full reference with a tag or digest is used as given; use one for an image from your own registry.
- An image only one installation uses (for example TH Mannheim's `thm-java-25-latest`) belongs in that installation's `apps`, not in the catalog.
- Leave `enabled` empty only on a test installation. An empty list offers and preloads all 14 images, so list the apps your courses use.

Then upgrade the installation as usual:

```bash
helm upgrade eduide oci://ghcr.io/eduide/charts/eduide \
  --version <version> -n <namespace> -f values.yaml -f secrets.yaml
```

### One entry, three effects

The merged app list drives the AppDefinition custom resource, the landing page's
app list, **and** the set of images preloaded onto every node. You do not
maintain a preload list. An earlier design did, and production ended up
offering an application whose image was never preloaded, so every student who
picked it waited for a cold multi-gigabyte pull.

### Two things that are easy to get wrong

**Removing `buildSystems` removes the picker.** A `-standalone` application whose
`landingPage` block has no `buildSystems` list starts an empty workspace and
offers no build-system choice. Every id must be a template folder the image
carries; the chart's release check compares the ids with the image's
`template.json` files.

**Adding an application costs disk on every node.** Each image is preloaded
cluster-wide. Trimming `enabled` to what your courses actually use is a
legitimate and effective way to reclaim node storage.

Removing an app deletes its AppDefinition, and with it the prewarmed pods,
session ingresses and sidecars it owns, so running sessions of that app end.
Remove apps outside lecture hours.


## Adjusting scaling at runtime

The `minInstances` and `maxInstances` values can be changed without redeploying the Helm chart. The admin API exposes a PATCH endpoint for this purpose:

```
PATCH /service/admin/appdefinition/{appDefinitionName}
```

This is the recommended approach for live capacity adjustments before a scheduled lecture or exercise session.

### View current scaling

```bash
# List all app definitions and their scaling config
curl -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  https://service.<landing-host>/service/admin/appdefinition

# Get a specific app definition
curl -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  https://service.<landing-host>/service/admin/appdefinition/java-17
```

Response shape:
```json
{
  "appDefinitionName": "java-17",
  "minInstances": 3,
  "maxInstances": 1000
}
```

### Update scaling

```bash
curl -X PATCH \
  -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minInstances": 10, "maxInstances": 500}' \
  https://service.<landing-host>/service/admin/appdefinition/java-17
```

Validation rules enforced by the service:
- At least one of `minInstances` or `maxInstances` must be provided.
- Both values must be `>= 0`.
- If both are provided, `minInstances` must be `<= maxInstances`.
- Sending `null` for `maxInstances` removes the upper bound entirely.

The operator reconciles the change immediately. Pre-warmed sessions will be created or terminated to match the new `minInstances` value.

## Pre-warming strategy

Pre-warming (`minInstances > 0`) ensures that sessions are available before users request them. This is important in educational settings where many users start sessions within the same short window.

Guidelines:

- Set `minInstances` to the expected concurrent launch count for the next exercise before it goes live.
- For a large cohort exercise (e.g., 300 students starting within 10 minutes), raise `minInstances` to at least 30–50 to absorb the burst without startup latency.
- Return `minInstances` to a lower baseline after the burst window to reclaim cluster resources.
- `maxInstances` sets a safety ceiling. Set it generously unless you need hard capacity limits.

Pre-warmed sessions are generic until a user claims one. Runtime data injection (via the data bridge) personalises the session at claim time. This is why pre-warmed sessions do not need to be user-specific in advance.

## App Definition options

The `options` map allows per-definition configuration. Currently used options:

| Key | Description |
|---|---|
| `dataBridgeEnabled` | Set to `"true"` to enable the Artemis data bridge for this session type |
| `dataBridgePort` | Port the data bridge listens on inside the session container (default: `"16281"`). Must equal `networkPolicies.dataBridgePort`, or the chart refuses to render |

Example:
```yaml
options:
  dataBridgeEnabled: "true"
  dataBridgePort: "16281"
```

## Temporary or saved sessions per app

`landingPage.ephemeralStorage` (default `true`) decides whether sessions started
from the landing page get a PersistentVolumeClaim, see
[Storage and Quotas](storage-and-quotas.md). From chart 3.0.0 an app can
override it with its own `landingPage.ephemeral`, a boolean. Unset, the app
follows `landingPage.ephemeralStorage`. A value that is not `true` or `false`
fails the render.

```yaml
appDefinitions:
  apps:
    java-25-standalone:
      landingPage:
        ephemeral: false       # sessions of this app keep their files
```

The landing page marks each tile "Temporary" or "Saved" accordingly, and the IDE
shows "Temporary workspace" or "Saved workspace" in its status bar. The privacy
page states the workspace as persistent as soon as **any** rendered app is
persistent, hidden Artemis apps included, because an Artemis start launches them
with their own persistence.

The landing page must be a release that reads the per-app flag (landing page
with EduIDE-Landing-Page#66); an older one ignores it and uses
`landingPage.ephemeralStorage` for every app.

## Installation-specific images

An image only your installation needs derives from an edition image instead of
being built from scratch. Start your Dockerfile `FROM` the `-standalone` image
of the language, so Scorpio, the data bridge and the templates stay in step with
EduIDE. The template repository
[EduIDE/EduIDE-image-mannheim](https://github.com/EduIDE/EduIDE-image-mannheim)
shows the layout.

Reference it in `apps` with the **full path and the tag**. The chart prefixes
`imageRegistry` to any image without a tag, so a bare name resolves to the wrong
registry:

```yaml
appDefinitions:
  enabled: [thm-java-25-latest]
  apps:
    thm-java-25-latest:
      image: ghcr.io/eduide/eduide-image-mannheim/java-25:<tag>
```

Keep the app name when persistent workspaces exist for it. The landing page
names a persistent workspace after the app, so a rename leaves every existing
workspace unreachable. TH Mannheim keeps `thm-java-25-latest` and changes only
the image.

## Landing page visibility

The landing page offers every rendered app that has a `landingPage` block. To
keep an app deployable but out of the drop-down, set `landingPage.visible: false`
on it (all seven Artemis apps do this in the catalog), or drop its
`landingPage` block entirely.

```yaml
appDefinitions:
  apps:
    go-standalone:
      landingPage:
        visible: false
```

A link without `?appDef=` launches `landingPage.appDefinition`, which defaults to
`java-17` from chart 3.0.0. The chart refuses to render when that is not an app
the installation renders, so update an override that still names a `*-templates`
app.

A hidden app can still be started by a link with `?appDef=`, `gitUri` and
`artemisToken`. Such a link carries the user's Artemis token, so treat it like a
password: do not paste it into tickets or chat.

`landingPage.additionalApps` replaces the derived list completely when set. It
exists as an escape hatch only: the page can then advertise an app the
installation never deployed.
