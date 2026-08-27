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

The chart ships eight, and they are not all visible:

| Name | Image | Offered on the landing page |
|---|---|---|
| `java-17-templates-latest` | `eduide/java-17-templates` | yes, with a Maven/Gradle choice |
| `java-17-latest` | `eduide/java-17` | no — hidden behind the templates variant |
| `c-templates-latest` | `eduide/c-templates` | yes, with a Make/Bazel choice |
| `c-latest` | `eduide/c` | no |
| `javascript-latest` | `eduide/javascript` | yes |
| `ocaml-latest` | `eduide/ocaml` | yes |
| `python-latest` | `eduide/python` | yes |
| `rust-latest` | `eduide/rust` | yes |

The `-templates` variants ship a starter project and a build-system picker; the
plain ones give an empty workspace. Both are deployable — a hidden definition can
still be launched by name — but only the visible ones appear in the drop-down.

Defaults are `requestsMemory: 500M`, `requestsCpu: 200m`, `limitsMemory: 2400M`,
`limitsCpu: "2"`, `minInstances: 0`, `maxInstances: 1000`, with Java overriding
the CPU and memory upward.

## Changing which applications are offered

App definitions live in your installation's values for the `eduide` chart, under
`appDefinitions.apps`. It is a **map keyed by definition name**, with a
`defaults` block that every entry inherits.

```yaml
appDefinitions:
  apps:
    haskell-latest:
      image: eduide/haskell        # tag comes from versions.ide
      requestsMemory: 800M         # only what differs from defaults
      landingPage:
        label: Haskell             # omit this key to deploy it but hide it
```

Then upgrade the installation as usual:

```bash
helm upgrade eduide oci://ghcr.io/eduide/charts/eduide \
  --version <version> -n <namespace> -f values.yaml -f secrets.yaml
```

### One entry, three effects

That single map drives the AppDefinition custom resource, the landing page's
app list, **and** the set of images preloaded onto every node. You do not
maintain a preload list — an earlier design did, and production ended up
offering an application whose image was never preloaded, so every student who
picked it waited for a cold multi-gigabyte pull.

### Two things that are easy to get wrong

**Removing `buildSystems` removes the picker.** A `-templates` application whose
`landingPage` block has no `buildSystems` list offers no build-system choice,
which is the entire reason those images exist.

**Adding an application costs disk on every node.** Each image is preloaded
cluster-wide. Trimming the list to what your courses actually use is a
legitimate and effective way to reclaim node storage.

Removing an entry stops new sessions using it. Sessions already running are not
disturbed.


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
  https://service.<landing-host>/service/admin/appdefinition/java-17-latest
```

Response shape:
```json
{
  "appDefinitionName": "java-17-latest",
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
  https://service.<landing-host>/service/admin/appdefinition/java-17-latest
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
| `dataBridgePort` | Port the data bridge listens on inside the session container (default: `"16281"`) |

Example:
```yaml
options:
  dataBridgeEnabled: "true"
  dataBridgePort: "16281"
```

## Landing page visibility

The landing page only shows session types listed under `additionalApps` in the main values file. An App Definition can exist in the cluster without appearing in the UI — useful for staging new environments before making them user-visible.

```yaml
landingPage:
  additionalApps:
    java-17-latest: { label: Java 17 }
    python-latest:  { label: Python }
```

Remove an entry from `additionalApps` to hide it from users without deleting the underlying App Definition.
