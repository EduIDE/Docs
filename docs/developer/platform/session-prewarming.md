---
title: Prewarming Architecture
description: Technical basis and developer reference for EduIDE Cloud prewarming, runtime data injection, and the data bridge.
---

# Prewarming Architecture

Session prewarming is [EduIDE Cloud](https://github.com/EduIDE/EduIDE-Cloud)'s fast-start path for browser IDE sessions. Instead of creating every Kubernetes object only after a user clicks "start", the operator can keep generic Theia instances running for an `AppDefinition` and bind one of them to a real `Session` later.

This matters for teaching scenarios because many students often open the same exercise within a short time window. Prewarming moves image pull, pod scheduling, container startup, service creation, and parts of sidecar setup before the launch spike. The user request then mostly needs reservation, routing, personalization, and the final availability check.

## Technical Basis

The eager-start operator mode wires two handlers:

- `EagerStartAppDefinitionAddedHandler` reconciles the warm pool for each `AppDefinition`.
- `EagerWithLazyFallbackSessionHandler` first tries to reserve a warm instance and falls back to the lazy session path when the pool is exhausted.

The high-level flow for an eagerly served session is:

1. The operator reconciles the `AppDefinition` and keeps `minInstances` generic instances ready.
2. A user creates a `Session` for that `AppDefinition`.
3. The session handler reserves one free pool instance and annotates the session with `theia-cloud.io/session-start-strategy=eager` and `theia-cloud.io/instance-id`.
4. The pool attaches ownership, labels, deployment metadata, services, optional Keycloak config maps, persistent volume resources, and sidecars to the concrete session.
5. The operator schedules data bridge injection for the session-specific environment values.
6. The operator adds the session route to the shared `HTTPRoute`, updates the session URL asynchronously, and marks the session handled.

If no warm instance is free, the same operator falls back to the lazy handler. That fallback is deliberate: prewarming is an optimization layer, not a separate correctness mode.

## Kubernetes Resources

A prewarmed pool instance is not just a pod. For each warm slot, the operator manages the resources needed to make a later session assignment cheap and deterministic:

- external and internal `Service` objects
- Theia `Deployment`
- optional Keycloak proxy and email `ConfigMap` objects
- optional workspace `PersistentVolumeClaim`
- optional sidecar `Deployment` and `Service` resources
- shared `HTTPRoute` rules when a concrete session is assigned

Sidecar resources are created before Theia deployments so service DNS names exist when the IDE starts. When a prewarmed session is deleted, sidecar pods are restarted and the pool instance is reconciled instead of blindly deleting the whole sidecar setup.

## Configuration

Prewarming is controlled by the Kubernetes `AppDefinition` custom resource:

```yaml
apiVersion: theia.cloud/v1beta10
kind: AppDefinition
metadata:
  name: java-17-latest
spec:
  name: java-17-latest
  image: ghcr.io/eduide/eduide/java-17:latest
  ingressname: theia-cloud-demo-ws-route
  port: 3000
  minInstances: 3
  maxInstances: 1000
  options:
    dataBridgeEnabled: "true"
    dataBridgePort: "16281"
```

`minInstances` is the target warm-pool size. Setting it to `3` means the operator tries to keep three generic instances ready for that app definition.

`maxInstances` is the total capacity ceiling for the app definition. It applies to the combined eager and lazy demand. The CRD and admin API reject configurations where `minInstances > maxInstances`.

To disable actual prewarming for an app definition, set `minInstances: 0`. In EduIDE deployments, prefer keeping the eager operator path enabled and controlling prewarming through `minInstances`. Turning the eager path off entirely switches the operator back to the lazy handlers and also removes the eager-mode behavior around reservation, lazy fallback annotations, and data bridge based runtime personalization.

The operator is selected by the Helm value `operator.eagerStart`. The app-level pool size is then controlled per `AppDefinition` with `minInstances`.

## Scaling and Reconciliation

The `AppDefinition` is the source of truth. When `minInstances` changes, the Kubernetes API stores the new spec and the operator reconciles toward that target.

Increasing `minInstances` creates missing warm resources. Decreasing it deletes excess pool instances after they are no longer needed. Setting `minInstances: 0` scales the warm pool to zero while still keeping the eager session path available for future changes.

The operator also tracks the `AppDefinition` generation on generated resources. When the app definition changes, the reconciliation logic can recreate outdated services, deployments, config maps, PVC-backed resources, and sidecars. After an eager session ends, the released instance is checked again: if its instance id is now above `minInstances`, it is deleted; if its resources were created for an older app definition generation, they are recreated; otherwise the slot returns to the pool.

Operationally, treat `minInstances` as reserved capacity. Raise it before predictable spikes such as exercise releases, tutorials, exams, or live demos. Lower it after the burst window to release idle resources.

The admin service exposes the scaling surface at:

```http
GET   /service/admin/appdefinition
GET   /service/admin/appdefinition/{appDefinitionName}
PATCH /service/admin/appdefinition/{appDefinitionName}
```

The `PATCH` body accepts `minInstances` and `maxInstances`:

```json
{
  "minInstances": 50,
  "maxInstances": 400
}
```

At least one of the two fields must be present. Negative values are rejected.

## Data Bridge

Prewarmed instances must stay generic until a user claims them. That is why normal process environment variables are not enough: the container process has already started before EduIDE knows the user's Artemis token, repository URL, or Git identity.

The [EduIDE Data Bridge](https://github.com/EduIDE/EduIDE-data-bridge) solves that late-binding problem. It is a VS Code extension inside the Theia image. When enabled, it starts an internal HTTP server on `0.0.0.0:${DATA_BRIDGE_PORT}` with:

- `GET /health` for readiness checks
- `POST /data` for injection payloads shaped as `{ "environment": { "KEY": "value" } }`
- `dataBridge.getEnv` for other VS Code extensions to retrieve selected values

The data bridge extension only activates when `DATA_BRIDGE_ENABLED` is `1` or `true`. The Theia Cloud deployment template sets this automatically for generic eager deployments when the app definition contains:

```yaml
options:
  dataBridgeEnabled: "true"
  dataBridgePort: "16281"
```

The operator waits for `/health` for up to 60 attempts with a one-second interval, then injects the collected session environment once through `POST /data`. The bridge stores values in memory and persists them in VS Code secret storage under its internal data bridge key.

## Adjusting Injected Values

Values sent through the data bridge come from the `Session` spec, not from the `AppDefinition` itself. The operator's session environment collector merges:

- `spec.envVars`
- `spec.envVarsFromConfigMaps`
- `spec.envVarsFromSecrets`

To add or change runtime values, adjust the component that creates sessions so it writes the desired key-value pairs into one of these fields. For the EduIDE landing page, the session request currently builds values such as:

- `THEIA`
- `ARTEMIS_TOKEN`
- `ARTEMIS_URL`
- `GIT_URI`
- `GIT_USER`
- `GIT_MAIL`
- `TEMPLATE`

For secrets, prefer `envVarsFromSecrets` so sensitive values are still held in Kubernetes `Secret` objects before injection. The operator decodes secret data and sends the plain string values to the bridge. Do not add long-lived credentials to app definition options; options are app-level configuration and are not the per-session personalization channel.

The app definition options only control whether and where the data bridge runs. The session spec controls what the user-specific payload contains.

## Consuming Data Bridge Values

Any VS Code-compatible extension running inside Theia can read injected values with the bridge command:

```ts
const env = await vscode.commands.executeCommand<Record<string, string>>(
  'dataBridge.getEnv',
  ['ARTEMIS_TOKEN', 'ARTEMIS_URL', 'GIT_URI']
);
```

The command returns only keys that are present. Consumers should handle missing values and retry if they need data immediately during extension activation.

[Scorpio](https://github.com/EduIDE/scorpio) is the reference implementation. It uses an environment strategy pattern:

- `ProcessEnvStrategy` reads the legacy process environment.
- `DataBridgeStrategy` activates `tum-aet.data-bridge`, polls `dataBridge.getEnv`, and falls back to process env on timeout.
- `createTheiaEnvStrategy` chooses the data bridge strategy when `SCORPIO_THEIA_ENV_STRATEGY=data-bridge`.

The Theia Cloud deployment template sets `SCORPIO_THEIA_ENV_STRATEGY=data-bridge` for generic eager deployments. Scorpio then waits for the required values, authenticates with Artemis using `ARTEMIS_TOKEN`, configures Git with `GIT_USER` and `GIT_MAIL`, and clones `GIT_URI` into the existing workspace without restarting the container.

For a new extension, follow the same pattern: keep a legacy source if local development or lazy sessions still need process env, add a bridge-backed strategy for prewarmed sessions, poll with a bounded timeout, and avoid reading personalized values only once from `process.env` during module initialization.

## Known Shortcomings

Prewarming trades latency for reserved cluster resources. A large `minInstances` can consume CPU, memory, PVCs, services, route capacity, and sidecar resources even while no users are active.

Data injection is asynchronous. The session can be marked handled while bridge injection is still being attempted, so extensions that require injected values during activation must poll or otherwise wait for the bridge values.

The data bridge is reachable inside the cluster through the session service IP and bridge port. Keep it internal, avoid exposing the bridge through public routes, and do not log injected values.

The current bridge payload is environment-key oriented. It is suitable for small runtime configuration and credentials, not for large files or complex state synchronization.

Finally, prewarming does not remove all startup costs. Routing propagation, data bridge readiness, extension activation, repository cloning, and language-server startup can still dominate the perceived launch time after a warm instance has been claimed.

## Developer Checklist

When touching the prewarming path, verify:

- `operator.eagerStart` is enabled in the target environment if prewarming or data bridge personalization is expected.
- `minInstances` is set to the desired warm capacity, or `0` for no warm pool.
- `maxInstances` is high enough for total eager plus lazy demand.
- The app definition has `options.dataBridgeEnabled: "true"` and a non-conflicting `dataBridgePort`.
- The Theia image contains the data bridge extension and any consumer extension, such as Scorpio.
- Session creation supplies required values through `envVars`, `envVarsFromConfigMaps`, or `envVarsFromSecrets`.
- Consumer extensions read late-bound values through `dataBridge.getEnv` when `SCORPIO_THEIA_ENV_STRATEGY` or an equivalent strategy flag selects the bridge path.
