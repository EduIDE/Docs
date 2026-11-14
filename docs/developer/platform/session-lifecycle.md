---
title: Session Lifecycle and Ending
description: How the operator decides that a session is over, how it records why, and how the landing page and metrics use that.
---

# Session Lifecycle and Ending

This page describes how a session ends and what the platform records about it. It covers the activity rules in the monitor extension and the IDE, the operator's timeout logic, the end reason on the workspace, the `/session-ended` page of the landing page, and the operator's metrics endpoint. For how a session starts, see [Architecture](./architecture) and [External Session Launch](./external-integration).

Release status: the operator flags `--sessionNodeSelector` ships since EduIDE-Cloud 1.3.0, the end reason and the closed-tab rule since 1.4.0, and `--metricsPort` with EduIDE-Cloud 2.0.0. The IDE images need `theia-cloud-monitor` v1.4.0 (EduIDE [#224](https://github.com/EduIDE/EduIDE/pull/224)) to time out an open idle tab.

## Who ends a session

The operator ends a session in two cases:

- **Inactivity.** The operator polls each session's monitor extension for the time of the last user activity. After `notifyAfter` minutes without activity it asks the monitor to show the "Are you still here?" dialog. After `timeoutAfter` minutes it deletes the session. The chart defaults are 50 and 60 (`appDefinitions.defaults.monitor.activityTracker`).
- **Lifetime.** A session that reaches its lifetime limit is stopped regardless of activity.

Admins and API clients can also stop a session. Those stops leave no end reason.

## What counts as activity

The monitor extension (`EduIDE-Cloud/node/monitor`) runs in the Theia plugin host and answers the operator's polls. Since [EduIDE-Cloud#165](https://github.com/EduIDE/EduIDE-Cloud/pull/165) only events a user causes reset the timer.

- **Counts:** edits and saves of `file` and `untitled` documents, editor selection, scrolling and focus, window state, debug and task runs, file operations.
- **Does not count:** anything an extension fires on its own, such as output channel appends (the Artemis extension logs every 5 seconds), diagnostics, configuration writes and documents opened in the background. Before 1.4.0 these kept idle sessions alive until the lifetime limit.

The rule for edits lives in `node/monitor/src/modules/user-activity.ts`. It has no `vscode` import, so `user-activity.test.ts` runs under `node:test` (`npm test` in `node/monitor`), and the `monitor-vsix.yml` workflow runs it. The monitor extension is a release asset of EduIDE-Cloud; the IDE images pin it in `images/base-ide/package.json.patch`.

Much user input produces no editor event, for example moving the mouse or scrolling a view. The IDE therefore reports browser input itself. The `SessionActivityContribution` in `theia-extensions/customization` (EduIDE [#218](https://github.com/EduIDE/EduIDE/pull/218)) listens for `keydown`, `pointerdown`, `pointermove` and `wheel` in the tab and calls the monitor command `theia.cloud.monitor.activity.report`, at most once a minute. It also registers `eduide.session.timeoutWarning`. The monitor runs that command when the operator asks for the warning, and the IDE blinks the tab title.

Other extensions can report activity explicitly with `theia.cloud.monitor.activity.report`.

## Closed tabs

The monitor lives in the plugin host, which ends when the last tab of the session closes. A failed activity poll is therefore no proof of inactivity by itself, and the operator treats it carefully (`MonitorActivityTracker`):

- A session whose monitor answered at least once since the operator started is remembered. When that monitor stops answering and its last reported activity is older than `timeoutAfter`, the operator ends the session and logs "Monitor stopped answering (IDE tab closed?)".
- A session whose monitor never answered keeps running, because its last activity is only the start time and says nothing about the user.
- The memory is per operator process. After an operator restart, a session whose tab was already closed runs until its lifetime limit once.

Other log lines worth knowing: "Notifying session as timeout of N minutes was reached!" and "Deleting session as timeout of N minutes was reached!" for inactivity, and "was stopped after N minutes" for the lifetime limit. If `notifyAfter` and `timeoutAfter` lie closer together than `monitor.activityTracker.interval`, the warning can be skipped.

## End reason on the workspace

Before it stops a session for inactivity or lifetime, the operator annotates the session's workspace ([EduIDE-Cloud#160](https://github.com/EduIDE/EduIDE-Cloud/pull/160)):

| Annotation | Value |
| --- | --- |
| `theia-cloud.io/last-session-end-reason` | `inactivity` or `lifetime` |
| `theia-cloud.io/last-session-end-time` | ISO-8601 instant |

`WorkspaceResourceClient.recordSessionEnd` writes them, `MonitorActivityTracker` calls it for inactivity and `BasicTheiaCloudOperator.stopTimedOutSessions` for the lifetime. There is no CRD change, and the operator ClusterRole already allows `patch` on workspaces.

`GET /service/workspace/{appId}/{user}` returns both values as `lastSessionEndReason` and `lastSessionEndTime` on each `UserWorkspace`. Both fields are optional, so existing API clients keep working. Any other way of stopping a session leaves the previous values untouched, so a client compares `lastSessionEndTime` with the start of the session it asks about.

## The `/session-ended` page

A request for an instance path of a session that no longer exists reaches a catch-all rule of the instances HTTPRoute, which answers `302` to `https://<landing host>/session-ended` and keeps the query string. A live session's longer path wins over the catch-all. The rule is part of the `eduide` chart (`gateway.routes.sessionEndedRedirect`, default on, only `302` is accepted because eager sessions reuse instance paths and a cached `301` would break them).

The landing page serves the page (`EduIDE-Landing-Page`):

- `src/lastLaunch.ts` stores the launch inputs of the current tab in `sessionStorage` under `eduide.lastLaunch.v1`, for 24 hours. The inputs include `gitUri` and `artemisToken`, which is why the store is `sessionStorage` and dies with the tab.
- `src/components/SessionEnded.tsx` renders the page. For a saved workspace it offers "Resume my session", which passes the stored inputs straight to `handleStartSession` and reopens the same workspace. After a temporary session it only offers a new start.
- `src/sessionEndReason.ts` reads `lastSessionEndReason` from the workspace list. It shows the reason only if `lastSessionEndTime` is not older than the tab's launch, because an older stamp belongs to an earlier session on the same workspace.

Limits to keep in mind: the IDE does not navigate to `/session-ended` by itself, the page appears on reload. Resume works only in the same tab. The reason is available only for logged-in users with a saved workspace.

## Operator flags

Both flags are options of the operator and are rendered by the `eduide` chart.

| Flag | Chart value | Purpose |
| --- | --- | --- |
| `--sessionNodeSelector key=value,...` | `global.nodeSelector` | Pins every session pod, lazy and prewarmed, to nodes with these labels via `nodeSelector`. Empty leaves the pod spec unchanged. A malformed list fails at startup. Since EduIDE-Cloud 1.3.0 ([#164](https://github.com/EduIDE/EduIDE-Cloud/pull/164)). |
| `--metricsPort <port>` | `operator.metricsPort` | Serves Prometheus metrics at `/metrics` on every operator replica. `0` (default) serves none. EduIDE-Cloud 2.0.0 ([#167](https://github.com/EduIDE/EduIDE-Cloud/pull/167)). |

An older operator rejects an unknown flag and does not start, so set `global.nodeSelector` only with EduIDE-Cloud 1.3.0 or newer and `operator.metricsPort` only with 2.0.0 or newer. The chart also applies `global.nodeSelector` to the operator, service, landing page and preloading pods; prewarmed pods that exist before the change keep their node until they are replaced.

### Metrics

With `--metricsPort` set the operator exposes one counter, written in the Prometheus text format by `SessionEndMetrics`:

```
theiacloud_sessions_ended_total{reason="inactivity|lifetime", app_definition="<name>"}
```

The counter lives in the operator process and resets on restart, so use `increase()` or `rate()`. The `eduide-cluster` chart adds a PodMonitor for the `metrics` port and a "Sessions ended per hour, by reason" panel to the sessions dashboard (EduIDE-Helm [#76](https://github.com/EduIDE/EduIDE-Helm/pull/76)). Without `operator.metricsPort` the PodMonitor finds no target.
