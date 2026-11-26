---
title: API Specification
description: The spec-first REST API v1 of the EduIDE control plane service.
---

# API Specification

The service of the control plane serves a REST API under `/api/v1` on the service host. The landing page uses it, and so can your integration.

The OpenAPI 3.1 file is the source of truth: [`api/openapi/v1.yaml`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/api/openapi/v1.yaml). Server stubs and the TypeScript client are generated from it, so this repository keeps no hand-written copy. Open the file in any OpenAPI viewer for field-level detail. The reasons for the design are in [ADR 0010](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0010-rest-api-spec-first.md).

## Rules

- **Authentication.** Every endpoint except `GET /status` needs an OIDC bearer token of the deployment's realm. The owner of a session or workspace is the verified user of the token, never a field of the request.
- **Errors.** Errors are RFC 9457 Problem Details with a stable `code` such as `capacity-exhausted`, `session-limit-reached`, `unknown-key` or `rate-limited`. Switch on the code, not on the text.
- **No polling.** Progress and changes arrive as Server-Sent Events.
- **Versioning.** Within `v1` only additive changes are allowed: new endpoints, optional fields, new enum values and new error codes. Clients must tolerate unknown values. A breaking change needs a `v2` in parallel and an ADR.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/status` | Public health summary, no token, cached for 15 seconds |
| `GET` | `/templates` | Templates of the deployment, each with `listed`, allowed persistence and allowed launch keys |
| `GET` | `/templates/events` | Event stream of the template list |
| `GET` | `/sessions` | Sessions of the calling user |
| `POST` | `/sessions` | Launch a session |
| `GET` `DELETE` | `/sessions/{name}` | Read or stop a session |
| `GET` | `/sessions/{name}/events` | Event stream of the start progress |
| `GET` | `/workspaces` | Saved workspaces of the calling user |
| `POST` | `/workspaces` | Create a saved workspace (get-or-create) |
| `DELETE` | `/workspaces/{name}` | Delete a workspace and its files, stopping a running session first |
| `GET` | `/me/overview` | Workspaces and sessions merged for the "Your sessions" view |
| `GET` | `/me/overview/events` | Event stream of the overview |
| `GET` | `/admin/...` | Read-only admin API, see below |

There is no performance endpoint and no endpoint that changes configuration. Admins change templates and pools through the installation chart.

## Launching a session

`POST /sessions` takes a `LaunchRequest`:

| Field | Meaning |
| --- | --- |
| `template` | Name of the template, required |
| `persistence` | `none` (temporary session) or `volume` (saved workspace), within what the template allows |
| `workspace` | Start on an existing workspace of the user, implies `volume` |
| `data` | Launch data, only keys on the template allowlist, at most 8 KiB in total |
| `display` | Non-secret `title` and `source` shown in the overview |

The launch is idempotent. A repeated request returns the existing session with `200`, a new one returns `201`. The key is template plus workspace, or for a temporary session template plus a hash of the launch data. A user may have `sessionsPerUser` sessions at once (default 3). Beyond that the answer is `session-limit-reached` with the list of running sessions. Launches are rate limited per user.

Send a `traceparent` header to join the launch to your trace.

After `201`, open `GET /sessions/{name}/events`. The `phase` moves from `Pending` through `Starting` to `Ready`, and `url` is set with `Ready`. `startStrategy` tells whether a warm instance served the launch (`warm-ready`, `warm-starting`) or the pod started cold. See [Session Prewarming](./session-prewarming). A launch that fails ends in `Failed` with an `errorCode`.

Which keys a template accepts is in `Template.injectableKeys`. An unknown key answers `400` with `unknown-key`. See [External Session Launch](./external-integration#allowlist).

## Sessions, workspaces and the overview

`Session` carries `lastActivity`, `stopsAt` and `stopReason` (`idle` or `max`). `Workspace` carries `lastUsed`, `expiresAt` and `deletesAt`. The overview lists workspaces without a running session as not running next to the running sessions, so a client needs only this one call. See [Session Lifecycle](./session-lifecycle).

A user may have `workspaces.perUser` saved workspaces (default 20). Beyond that the API answers `workspace-limit-reached`.

## Admin API and public status

The read-only admin API under `/api/v1/admin/` powers the admin panel of the landing page. It answers 404 until the deployment configures an OIDC role for it, and 403 for users without the role. It shows owners only as a hash and launch data only as key names. The admin side is described in the [admin guide](/admins/intro). `GET /status` feeds the public status page and holds no user, session or host data.

## Generated code

`make generate` produces the Go server in `internal/httpapi/api.gen.go` and the TypeScript client in `clients/typescript`. Never edit generated files. CI runs `oasdiff` to catch breaking changes.
