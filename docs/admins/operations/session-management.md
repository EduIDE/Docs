---
title: Session Management
description: Admin-level oversight of active sessions, workspaces, and handling stuck or runaway resources.
---

# Session Management

As an admin, you can inspect and manage all sessions and workspaces across the platform. This is distinct from what individual users can do - users can only see their own workspaces and sessions. Admin operations cover the entire namespace and are intended for operational oversight, not routine use.

:::note Placeholders on this page

Each EduIDE installation lives in its own namespace, named `eduide-<name>` by convention (`eduide-staging`, `eduide-cs101`, and so on). Commands below use `-n <namespace>` - substitute your installation's namespace. `<service-host>` stands for the DNS name you configured for the REST service.

The custom resources are in the `theia.cloud` API group even though the charts are named `eduide*`. This is a historical name that was never migrated, so `kubectl get crd | grep eduide` returns nothing. The full resource names are `workspaces.theia.cloud`, `sessions.theia.cloud` and `appdefinitions.theia.cloud`; the short forms `workspaces`, `sessions` and `appdefinitions` work too, and `ws`, `appdef` and `ad` are registered short names.

:::

## Understanding the session and workspace model

A **workspace** is the durable context for a user. It owns the PVC and persists across session restarts.

A **session** is the live IDE runtime. It is bound to a user and a workspace, exposes the IDE over a URL, and is destroyed when it ends.

A user can have multiple workspaces, but the platform enforces a per-user session limit (`operator.sessionsPerUser`, chart default: **`1`**). If a user hits this limit, they cannot start new sessions until existing ones are stopped.

The default of one session per user catches people out: a user who leaves a session running in another browser tab and then tries to start a second one is refused, and the symptom looks like a launch failure. Raise the limit in the installation values if your teaching model needs concurrent sessions:

```yaml
operator:
  sessionsPerUser: "3"
```

The value is a string in the chart values.

## Listing sessions and workspaces via kubectl

The operator manages workspaces and sessions as custom resources. You can inspect them directly:

```bash
# List all workspaces in an installation namespace
kubectl get workspaces.theia.cloud -n <namespace>

# List all sessions
kubectl get sessions.theia.cloud -n <namespace>

# List sessions for a specific user
kubectl get sessions.theia.cloud -n <namespace> \
  -o jsonpath='{range .items[?(@.spec.user=="<username>")]}{.metadata.name}{"\n"}{end}'

# Get full details on a session
kubectl describe session <session-name> -n <namespace>
```

To see who owns what at a glance:

```bash
kubectl get sessions.theia.cloud -n <namespace> \
  -o custom-columns='NAME:.metadata.name,USER:.spec.user,APP:.spec.appDefinition,CREATED:.metadata.creationTimestamp'
```

## Listing sessions via the service API

The service API exposes session and workspace listing for individual users:

```bash
# List workspaces for a user (requires OAuth token)
GET /service/workspace/{appId}/{user}

# List sessions for a user (requires OAuth token)
GET /service/session/{appId}/{user}
```

These endpoints require a valid user-context OAuth token, not the admin API token. They return only that user's resources.

For cross-user inspection at scale, `kubectl` is the practical approach.

## Force-stopping a session

If a session is stuck, has become unresponsive, or needs to be terminated to free resources:

```bash
# Stop a session via the service API (requires OAuth token for that user's context)
curl -X DELETE \
  -H "Content-Type: application/json" \
  -d '{"appId": "<appId>", "user": "<username>", "sessionName": "<session-name>"}' \
  https://<service-host>/service/session

# Or delete the session resource directly via kubectl (immediate, bypasses service)
kubectl delete session <session-name> -n <namespace>
```

Direct `kubectl delete` bypasses the service layer and removes the resource immediately. Use this when the session pod is not responding to normal termination or when the service itself is unavailable.

## Force-deleting a workspace

Deleting a workspace removes the custom resource and - depending on the storage class reclaim policy - may also remove the associated PVC.

```bash
# Via the service API
curl -X DELETE \
  -H "Content-Type: application/json" \
  -d '{"appId": "<appId>", "user": "<username>", "workspaceName": "<workspace-name>"}' \
  https://<service-host>/service/workspace

# Via kubectl
kubectl delete workspace <workspace-name> -n <namespace>
```

Before deleting a workspace, confirm the user does not have an active session attached to it. Deleting an active workspace while a session is running may leave the session in a broken state.

With a `Retain` reclaim policy the underlying PersistentVolume survives the deletion and moves to the `Released` phase. `Released` is a **PersistentVolume** phase; PVCs only ever reach `Pending`, `Bound` or `Lost`, so looking for released PVCs finds nothing whether or not there is anything to clean up. PVs are cluster-scoped, so no namespace flag applies:

```bash
kubectl get pv --field-selector=status.phase=Released
```

See [Storage and Quotas](/admins/platform/storage-and-quotas) for the full cleanup procedure.

## Identifying stuck or runaway sessions

Sessions that remain running far beyond normal usage patterns (hours or days) may indicate:
- A user left their session open without activity
- The inactivity shutdown mechanism is not working
- A session pod has become unresponsive

```bash
# Find sessions older than expected (sort by creation time)
kubectl get sessions.theia.cloud -n <namespace> \
  --sort-by=.metadata.creationTimestamp

# Find pods with very high memory consumption
kubectl top pods -n <namespace> --sort-by=memory | head -20

# Find pods that are running but not in Ready state
kubectl get pods -n <namespace> | grep 'Running' | grep '0/'
```

Session pods are labelled `app: <sessionName>-<sessionUID>`, so there is no single label that selects all of them. To list session pods and nothing else, exclude the platform components instead:

```bash
kubectl get pods -n <namespace> \
  -l 'app notin (operator,service,landing-page,image-preloading)'
```

Each session pod runs at least two containers: the IDE itself, named after the App Definition, and the `oauth2-proxy` sidecar. When reading logs from a session pod you must name the container:

```bash
kubectl logs <session-pod> -n <namespace> -c oauth2-proxy --tail=50
```

## Session activity reporting

The service has an activity endpoint that session containers call to signal that a user is active:

```
PATCH /service/session
```

Request body:
```json
{
  "appId": "<appId>",
  "sessionName": "<session-name>"
}
```

This endpoint is called by the IDE client to prevent inactivity shutdown. If you need to verify whether a session has been reporting activity, check the session resource's status in the operator logs.

The operator side of this is controlled by `monitor.*` in the installation values, which is on by default:

```yaml
monitor:
  enable: true
  activityTracker:
    enable: true
    # minutes between re-pinging the pods
    interval: 1
```

If idle sessions are never being shut down, confirm these are still enabled before investigating further. Note that `monitor` here is unrelated to `monitoring`, which is the Prometheus scrape configuration described in [Monitoring Basics](/admins/operations/monitoring-basics). The names are one letter apart and the settings do entirely different things.

## Managing sessions before a large exercise

Before a scheduled exercise where many users will launch sessions simultaneously:

1. **Increase `minInstances`** for the relevant App Definition to pre-warm sessions (see [App Definitions](/admins/platform/app-definitions)). The chart default is `0`, meaning nothing is pre-warmed at all.
2. **Check current session count** to confirm enough capacity exists.
3. **Verify quota headroom** with `kubectl describe resourcequota -n <namespace>`.
4. **Check the per-user session limit** is high enough for what you are asking students to do, given the default of `1`.

After the exercise peak passes, reduce `minInstances` back to the baseline to free cluster resources.

## Getting session performance data

For an active session, the service exposes a performance endpoint:

```bash
curl \
  https://<service-host>/service/session/performance/<appId>/<session-name>
```

This returns metrics from inside the running session container (if the session type supports it). Use this to investigate reports of a specific session being slow.
