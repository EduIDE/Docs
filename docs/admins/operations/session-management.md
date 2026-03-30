---
title: Session Management
description: Admin-level oversight of active sessions, workspaces, and handling stuck or runaway resources.
---

# Session Management

As an admin, you can inspect and manage all sessions and workspaces across the platform. This is distinct from what individual users can do — users can only see their own workspaces and sessions. Admin operations cover the entire namespace and are intended for operational oversight, not routine use.

## Understanding the session and workspace model

A **workspace** is the durable context for a user. It owns the PVC and persists across session restarts.

A **session** is the live IDE runtime. It is bound to a user and a workspace, exposes the IDE over a URL, and is destroyed when it ends.

A user can have multiple workspaces, but the platform enforces a per-user session limit (`sessionsPerUser`, default: 10). If a user hits this limit, they cannot start new sessions until existing ones are stopped.

## Listing sessions and workspaces via kubectl

The operator manages workspaces and sessions as custom resources. You can inspect them directly:

```bash
# List all workspaces in the production namespace
kubectl get workspaces -n theia-prod

# List all sessions
kubectl get sessions -n theia-prod

# List sessions for a specific user
kubectl get sessions -n theia-prod \
  -o jsonpath='{range .items[?(@.spec.user=="<username>")]}{.metadata.name}{"\n"}{end}'

# Get full details on a session
kubectl describe session <session-name> -n theia-prod
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
  https://service.theia.artemis.cit.tum.de/service/session

# Or delete the session resource directly via kubectl (immediate, bypasses service)
kubectl delete session <session-name> -n theia-prod
```

Direct `kubectl delete` bypasses the service layer and removes the resource immediately. Use this when the session pod is not responding to normal termination or when the service itself is unavailable.

## Force-deleting a workspace

Deleting a workspace removes the custom resource and — depending on the storage class reclaim policy — may also remove the associated PVC.

```bash
# Via the service API
curl -X DELETE \
  -H "Content-Type: application/json" \
  -d '{"appId": "<appId>", "user": "<username>", "workspaceName": "<workspace-name>"}' \
  https://service.theia.artemis.cit.tum.de/service/workspace

# Via kubectl
kubectl delete workspace <workspace-name> -n theia-prod
```

Before deleting a workspace, confirm the user does not have an active session attached to it. Deleting an active workspace while a session is running may leave the session in a broken state.

## Identifying stuck or runaway sessions

Sessions that remain running far beyond normal usage patterns (hours or days) may indicate:
- A user left their session open without activity
- The inactivity shutdown mechanism is not working
- A session pod has become unresponsive

```bash
# Find sessions older than expected (sort by creation time)
kubectl get sessions -n theia-prod \
  --sort-by=.metadata.creationTimestamp

# Find pods with very high memory consumption
kubectl top pods -n theia-prod --sort-by=memory | head -20

# Find pods that are running but not in Ready state
kubectl get pods -n theia-prod | grep 'Running' | grep '0/'
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

## Managing sessions before a large exercise

Before a scheduled exercise where many users will launch sessions simultaneously:

1. **Increase `minInstances`** for the relevant App Definition to pre-warm sessions (see [App Definitions](/admins/platform/app-definitions)).
2. **Check current session count** to confirm enough capacity exists.
3. **Verify quota headroom** with `kubectl describe resourcequota -n theia-prod`.

After the exercise peak passes, reduce `minInstances` back to the baseline to free cluster resources.

## Getting session performance data

For an active session, the service exposes a performance endpoint:

```bash
curl \
  https://service.theia.artemis.cit.tum.de/service/session/performance/{appId}/{sessionName}
```

This returns metrics from inside the running session container (if the session type supports it). Use this to investigate reports of a specific session being slow.
