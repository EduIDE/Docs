---
title: Session Management
description: Looking at, stopping and cleaning up sessions and workspaces with kubectl and the admin panel.
---

# Session Management

Sessions and workspaces are Kubernetes objects. Users manage their own on the landing page: resume, stop and delete. Admins look at everything with `kubectl` and the admin panel.

## Admin panel

The panel is on the landing page for users with the admin role ([Admin Access](../security/admin-access.md)). It is read-only.
It lists sessions, workspaces, pools and templates, groups recent problems by error code and shows status warnings.
Owners appear only as a pseudonymous hash, never as a name.
To act on something, use `kubectl`.

## Looking at sessions

```bash
kubectl -n <ns> get idesession
kubectl -n <ns> describe idesession <name>
kubectl -n <ns> get idesession <name> -o yaml
```

| Field | Meaning |
|---|---|
| `status.phase` | `Pending`, `Starting`, `Ready`, `Failed` |
| `status.startStrategy` | `warm-ready`, `warm-starting`, `cold` |
| `status.errorCode`, `status.message` | Why a session failed |
| `status.lastActivity` | Last sign of use. Drives the idle timeout |
| `status.timestamps` | `claimed`, `podReady`, `agentReady`, `ready` |

Events on a session: `Claimed`, `Created`, `Ready`, `Ended`, `Reclaimed` and, as a warning, `Failed` with the code.
Kubernetes keeps events for about an hour.

## Timeouts

A template sets three timeouts, default idle 60 minutes, warning 50 minutes, maximum 24 hours. Users get a warning in the IDE before the idle end. When one fires, the operator ends the session and deletes the pod.
A temporary workspace is lost at that moment. A saved workspace stays.

## Stopping a session

Deleting the `IDESession` stops it. The pod, Service, route and launch data Secret go with it.

```bash
kubectl -n <ns> delete idesession <name>
```

Do this for a stuck session or on a user's request. Deleting a session never deletes a saved workspace.
Deleting an `IDEWorkspace` stops its sessions and removes its volume. Check with the owner first.

## Seeing the pods

```bash
kubectl -n <ns> get pods -l eduide.github.io/component=session
kubectl -n <ns> get pods -l eduide.github.io/state=idle
```

Idle pods belong to a pool and carry no user data. Claimed pods belong to a session. Never delete session pods by hand to free capacity.
Lower the pool or delete the session instead.

## Workspaces

See [Storage and Workspaces](../platform/storage-and-workspaces.md) for retention and the `retain` annotation.

```bash
kubectl -n <ns> get ideworkspace
kubectl -n <ns> describe ideworkspace <name>
```

`status.lastUsed`, `status.expiresAt` and `status.phase` show when a workspace expires.

## Limits users hit

| Message code | Meaning |
|---|---|
| `session-limit-reached` | The user runs `sessionsPerUser` sessions already |
| `workspace-limit-reached` | The user owns `workspaces.perUser` workspaces |
| `rate-limited` | Too many launches per minute |
| `capacity-exhausted` | No room for the pod. See [Incident Response](incident-response.md) |

These are not faults. Raise the value in the chart if the limit does not fit the course.
