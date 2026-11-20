---
title: Storage and Workspaces
description: Temporary and saved workspaces, the storage class, quotas, and when saved workspaces are deleted.
---

# Storage and Workspaces

Every session has a workspace. A template allows one or both persistence modes:

| Mode (`persistence`) | Name for users | Storage | Start |
|---|---|---|---|
| `none` | Temporary workspace | The container filesystem. Gone when the session ends | Warm or cold |
| `volume` | Saved workspace | A PersistentVolumeClaim, owned by an `IDEWorkspace` | Always cold |

The default mode is `none`. A user who opens a saved workspace again gets the same files.

## Storage class and size

```yaml
eduide-control-plane:
  config:
    workspaces:
      storageClassName: standard
```

Further keys under `workspaces`: `size`, `retention`, `grace` and `perUser` (default 20 workspaces per user). A template can set its own `persistence.size`, `persistence.mountPath` (default `/home/project`) and `retention`.

## Retention

Saved workspaces are deleted a while after their last use. The operator does this itself. No separate cleanup job runs.

- `status.lastUsed` is set when a session starts and when it ends. A workspace with a running session never expires.
- `retention` is 14 days by default. A template or a workspace can override it. Values are Go durations such as `336h`; `14d` is rejected.
- After the retention the workspace turns `Expired`. After the grace period (24 hours) the claim and the object are deleted.
- The landing page warns three days before expiry. Starting the workspace again extends it.
- The annotation `eduide.github.io/retain=true` on an `IDEWorkspace` cancels expiry.

```bash
kubectl -n eduide-<deployment> get ideworkspace
kubectl -n eduide-<deployment> annotate ideworkspace <name> eduide.github.io/retain=true
```

Tell users the retention in your course material. After the deletion the data is gone.

## Quotas and limits

| Limit | Value | Effect |
|---|---|---|
| `sessionsPerUser` | 3 | More launches answer `session-limit-reached` with the list of running sessions |
| `workspaces.perUser` | 20 | More answer `workspace-limit-reached` (409) |
| `rateLimit.launchesPerMinute` | 10 | Launch rate per user |

Plan cluster quotas for the worst case: `maxInstances` of all pools plus running sessions, times the template limits.
If the storage quota of the namespace is exhausted, new workspaces stay `Pending`. The admin panel shows requested bytes per workspace and a namespace quota if one exists.

## Lost volumes

If a claim of a saved workspace disappears, for example by a manual delete, the workspace shows `Ready=False` with reason `VolumeLost`. See [Incident Response](../operations/incident-response.md#workspace-volume-lost).
