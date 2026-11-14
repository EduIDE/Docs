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
    interval: 1            # the chart default; the TUM installations use 3
```

Every `interval` minutes the operator asks each session's monitor extension for
the last activity, on port 8081 (`appDefinitions.defaults.monitor.port`). The
request carries the session secret; the monitor answers `401` without it.

### When a session ends for inactivity

The limits are explicit chart values per app definition, in minutes:

```yaml
appDefinitions:
  defaults:
    monitor:
      activityTracker:
        notifyAfter: 50    # "Are you still here?" dialog in the IDE
        timeoutAfter: 60   # the operator deletes the session
```

Chart 2.8.1 sets 60 and 50 (before, 60 and 55 came from template fallbacks).
Raise both per installation if the limits are too short, for example for courses
where students listen to a lecture with the IDE open but untouched. Keep the gap
between them larger than `monitor.activityTracker.interval`, or the warning can
be skipped. 50 and 60 with an `interval` of 3 is fine.

Only input from the user counts as activity: typing, clicking, mouse moves and
scrolling in the IDE tab, and editing or saving files. Output from Artemis, Git
or language servers does not count. This needs the IDE images from EduIDE 2.0.0
and the monitor extension `theia-cloud-monitor` v1.4.0 in them. With version
1.2.2 an open but idle tab is never timed out.

The operator also ends a session whose **tab was closed**. When a poll fails and
the monitor answered before (since the operator started), and the last activity
is older than `timeoutAfter`, the session is deleted. A monitor that never
answered still keeps the session running, as with a failed poll from EduIDE-Cloud
1.2.1 on, so a briefly unreachable monitor does not cost an active session. The
operator log shows the difference:

```bash
kubectl -n <namespace> logs deploy/operator-deployment | grep -E "Could not read activity|Monitor stopped answering|timeout of|was stopped after"
```

The lines to know:

| Log line contains | Meaning |
|---|---|
| `Could not read activity` | A poll failed or returned no timestamp |
| `Monitor stopped answering (IDE tab closed?)` | A monitor that answered before no longer does |
| `Notifying session as timeout of N minutes was reached!` | The warning dialog is requested |
| `Deleting session as timeout of N minutes was reached!` | The session ends for inactivity |
| `was stopped after N minutes` | The session ended at its lifetime limit (`timeout`) |

After an operator restart, which every `helm upgrade` causes, a session whose tab
is already closed runs until its lifetime limit once, because its monitor has not
answered since the restart.

### Why a session ended

Before the operator stops a session for inactivity or for reaching its lifetime,
it annotates the workspace:

```bash
kubectl -n <namespace> get workspace <name> \
  -o jsonpath='{.metadata.annotations}'
```

| Annotation | Value |
|---|---|
| `theia-cloud.io/last-session-end-reason` | `inactivity` or `lifetime` |
| `theia-cloud.io/last-session-end-time` | when the operator stopped it |

`GET /service/workspace/{appId}/{user}` returns both as `lastSessionEndReason`
and `lastSessionEndTime`. A session a user or an admin stopped carries no
reason. No CRD changes are involved, and the operator's ClusterRole already
allows `patch` on workspaces. The landing page uses the reason on its
`/session-ended` page.

### What visitors see after a session ended

Chart 2.9.0 adds a catch-all rule to the instances route. A request for a
session that no longer exists, for example a reload of the old tab, gets a `302`
to `https://<landing host>/session-ended`, with the query string passed on. A
live session's longer path still wins. The page says why the session ended and
offers **Resume my session** for a session with a saved workspace.

```yaml
gateway:
  routes:
    sessionEndedRedirect:
      enabled: true          # default; needs landingPage.enabled
      path: /session-ended   # default
      statusCode: 302        # the only accepted value
```

Only `302` is accepted, because eager sessions reuse instance paths and a cached
`301` would break them. Pair chart 2.9.0 or later with a landing page image that
serves `/session-ended`: an older image shows its start page on the redirect.
Turn the redirect off with `gateway.routes.sessionEndedRedirect.enabled: false`.

Inside the open IDE the tab does not switch pages by itself. It shows "Your
session has timed out" or goes "Offline", and the page appears on reload.
Resume works in the same browser tab for 24 hours.

:::warning Temporary sessions lose their files
A temporary session, one without a PersistentVolumeClaim, loses its files as
soon as it ends. With the inactivity timeout working that is after 60 minutes
without input, not after the 24 hour lifetime. Before the timeout worked, sessions
effectively ran for the whole lifetime. Tell students to push or download their
work before a long break.
:::

If idle sessions are never being shut down, confirm these are still enabled and
that the IDE images carry the monitor before investigating further. Note that `monitor` here is unrelated to `monitoring`, which is the Prometheus scrape configuration described in [Monitoring Basics](/admins/operations/monitoring-basics). The names are one letter apart and the settings do entirely different things.

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
