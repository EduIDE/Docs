---
title: Session Lifecycle and Ending
description: How a session ends, how activity is detected, and when saved workspaces expire.
---

# Session Lifecycle and Ending

This page describes how a session ends and what the platform does with the files afterwards. For how a session starts, see [Session Prewarming](./session-prewarming) and [Architecture](./architecture).

## Phases

A session moves through `Pending`, `Starting` and `Ready`, or ends in `Failed` with an `errorCode`. The operator records timestamps for each step in `status.timestamps`: `claimed`, `podReady`, `agentReady` and `ready`. The step durations are exported as `eduide_session_phase_seconds`, and the whole start as `eduide_session_startup_seconds`.

## Who ends a session

A session ends in four ways:

- **Inactivity.** After the template's `idle` time without activity (default 60 minutes), the operator deletes the session. At the `warning` time (default 50 minutes) it sends a warning that the IDE shows with the action "I am still here".
- **Maximum lifetime.** A session that reaches `max` (default 24 hours) ends regardless of activity.
- **The user** stops the session from the landing page or with `DELETE /sessions/{name}`.
- **A failure.** A Ready session whose pod failed (for example by eviction) becomes `Failed`.

The templates set `timeouts.idle`, `timeouts.warning` and `timeouts.max`. The operator and the service resolve missing values the same way, in one place (`ResolvedTimeouts`). The API shows the result as `stopsAt` and `stopReason` on each session.

## Detecting activity

The agent in the pod collects activity and the operator pulls it, so the IDE needs no inbound port and the operator writes few updates ([ADR 0016](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0016-activity-detection.md)).

- The `eduide-session` extension sends a heartbeat when the user really works: edits, selection changes, active editor changes and window focus. It sends at most one heartbeat per minute. Terminal output does not count, so a long build does not keep an abandoned session alive.
- The operator polls the agent status with bounded concurrency. It writes `status.lastActivity` only when it moves by more than 5 minutes.
- Proxied requests do not count, because an open tab polls without a user.
- A claimed session with no open WebSocket connection and no activity counts as inactive. A closed tab therefore ends the session after the idle time.
- An unreachable agent alone does not end a session. The operator marks a condition and waits for data.

A heartbeat also clears a pending idle warning, so a reloaded IDE shows no stale warning.

## What happens at the end

The operator removes access first. The session leaves `Ready`, `authz` denies at once, and the operator then discards the pod. Open WebSockets end with it. A temporary workspace is gone with the pod. A saved workspace stays on its volume.

The launch data Secret belongs to the session and goes with it.

## Expiry of saved workspaces

The operator deletes saved workspaces after a period without use, replacing the old garbage collector ([ADR 0007](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0007-persistence-modes.md)).

- `status.lastUsed` is set at the start and the end of every session. A workspace with a running session never expires.
- `retention` defaults to 14 days per deployment and is set per template or per workspace.
- Expiry has two stages. First the phase becomes `Expired`. After the grace period (24 hours by default) the volume and the custom resource are deleted.
- The annotation `eduide.github.io/retain: "true"` on an `IDEWorkspace` cancels expiry.
- The overview shows `expiresAt` and `deletesAt`, and starting the workspace again extends it.

A user can also delete a workspace at any time. A running session on it stops first.

## Metrics

Start and end behavior shows in the metrics `eduide_session_startup_seconds`, `eduide_session_failures_total`, `eduide_sessions` and `eduide_workspaces`. The full list is the [metrics contract](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/contracts/metrics.md). For slow starts see the [slow-launch runbook](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/operations/slow-launch.md).
