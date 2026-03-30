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

In production, the current App Definitions are:

| Name | Image | Memory request | Min instances | Max instances |
|---|---|---|---|---|
| `java-17-latest` | `ghcr.io/eduide/eduide/java-17` | 2000M | 3 | 1000 |
| `python-latest` | `ghcr.io/eduide/eduide/python` | 2000M | configurable | configurable |
| `c-latest` | `ghcr.io/eduide/eduide/c` | 2000M | configurable | configurable |
| `javascript-latest` | `ghcr.io/eduide/eduide/javascript` | 2000M | configurable | configurable |
| `ocaml-latest` | `ghcr.io/eduide/eduide/ocaml` | 2000M | configurable | configurable |
| `rust-latest` | `ghcr.io/eduide/eduide/rust` | 2000M | configurable | configurable |

## Managing App Definitions via Helm

App Definitions are defined in the `theia-appdefinitions` Helm chart. The values file (`appdefinitions.yaml`) for each environment controls the deployed set.

To add a new App Definition:

1. Add an entry under `apps` in the environment's appdefinitions values file:

   ```yaml
   apps:
     - name: haskell-latest
       image: ghcr.io/eduide/eduide/haskell:latest
       requestsMemory: 2000M
       requestsCpu: 500m
       limitsMemory: 3000M
       minInstances: 0
       maxInstances: 200
   ```

2. Ensure the image is available and the tag is pinned for production deployments.

3. Deploy the updated chart:

   ```bash
   helm upgrade theia-appdefinitions \
     oci://ghcr.io/eduide/charts/theia-appdefinitions \
     -n theia-prod \
     -f deployments/theia.artemis.cit.tum.de/appdefinitions.yaml
   ```

4. Add the new name to `additionalApps` in the main values file so it appears in the landing page.

To remove an App Definition, remove its entry from the values file and run the same upgrade. Sessions already running on that definition are not affected immediately; the operator will no longer reconcile new ones.

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
  https://service.theia.artemis.cit.tum.de/service/admin/appdefinition

# Get a specific app definition
curl -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  https://service.theia.artemis.cit.tum.de/service/admin/appdefinition/java-17-latest
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
  https://service.theia.artemis.cit.tum.de/service/admin/appdefinition/java-17-latest
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
