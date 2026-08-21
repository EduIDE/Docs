---
title: API Specification
description: Service API overview based on the EduIDE Cloud OpenAPI specification.
---

# API Specification

This page summarizes the current EduIDE Cloud service API from the OpenAPI specification in `theia-cloud/documentation/openapi.json`.

The API is centered on lifecycle management for app definitions, workspaces, and sessions. The service is not a generic backend for all platform functionality. Its primary job is to expose the control-plane operations that create and manage the resources the operator later reconciles inside Kubernetes.

## API Scope

At a high level, the API covers five areas:

- service health and connectivity
- app definition discovery and scaling
- workspace creation, listing, and deletion
- session launch, listing, stopping, and activity reporting
- selected session-level runtime configuration and performance access

## Base Paths

The currently exposed paths in the spec are:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/service/{appId}` | Ping the service |
| `POST` | `/service` | Launch a session and create a workspace if needed |
| `GET` | `/service/appdefinition/{appId}` | List available app definitions |
| `PATCH` | `/service/admin/appdefinition/{appDefinitionName}` | Update app definition scaling properties |
| `GET` | `/service/admin/{appId}` | Admin ping |
| `GET` | `/service/workspace/{appId}/{user}` | List workspaces of a user |
| `POST` | `/service/workspace` | Create a workspace |
| `DELETE` | `/service/workspace` | Delete a workspace |
| `GET` | `/service/session/{appId}/{user}` | List sessions of a user |
| `POST` | `/service/session` | Start a new session for an existing workspace |
| `DELETE` | `/service/session` | Stop a session |
| `PATCH` | `/service/session` | Report session activity |
| `GET` | `/service/session/performance/{appId}/{sessionName}` | Get performance metrics for a session |
| `POST` | `/service/session/{session}/config` | Set a runtime config value in a session |

## Authentication Model

The spec declares an OAuth-based security scheme and applies it to the main service endpoints. In practice, the important architectural point is that callers are expected to identify both the platform instance and the user context when interacting with workspace and session resources.

Most request models therefore include:

- `appId`: identifies the EduIDE Cloud instance the request targets
- `user`: identifies the user on whose behalf the operation runs, where relevant

## Core Workflows

### Launch flow

The most important entry point is `POST /service`.

This endpoint accepts a `LaunchRequest` and is the high-level "just give me a working IDE session" operation. According to the OpenAPI model, the request can describe:

- the target `appId`
- the requesting `user`
- the `appDefinition` to launch
- an optional `workspaceName`
- an optional human-readable `label`
- whether the session should be `ephemeral`
- a launch `timeout`
- additional `env` values, described by the `EnvironmentVars` model: `fromMap` holds direct key/value pairs, `fromConfigMaps` lists the names of existing ConfigMaps, and `fromSecrets` lists the names of existing Secrets. See [External Session Launch](./external-integration) for the end-to-end integration flow.

The response is a plain string containing the launched session URL.

This endpoint is useful when the caller does not want to orchestrate workspace creation and session creation as separate steps.

### Workspace management

Workspace APIs are the explicit lifecycle endpoints for persistent user context:

- `GET /service/workspace/{appId}/{user}`
- `POST /service/workspace`
- `DELETE /service/workspace`

`WorkspaceCreationRequest` currently contains:

- `appId`
- `user`
- optional `appDefinition`
- optional `label`

Architecturally, these endpoints operate on the durable side of the platform model. They describe what a user can return to later, even when no live session is currently running.

### Session management

Session APIs operate on the live runtime layer:

- `GET /service/session/{appId}/{user}`
- `POST /service/session`
- `DELETE /service/session`
- `PATCH /service/session`
- `GET /service/session/performance/{appId}/{sessionName}`

Important request types include:

- `SessionStartRequest`
  - `appId`
  - `user`
  - `appDefinition`
  - optional `workspaceName`
  - optional `timeout`
  - optional `env`
- `SessionStopRequest`
  - `appId`
  - `user`
  - `sessionName`
- `SessionActivityRequest`
  - `appId`
  - `sessionName`

This separation between workspace APIs and session APIs reflects the platform architecture described in the previous page: workspaces are durable context, sessions are live runtimes.

### App definition management

Two endpoints expose app definition functionality:

- `GET /service/appdefinition/{appId}`
- `PATCH /service/admin/appdefinition/{appDefinitionName}`

The admin update operation uses `AppDefinitionUpdateRequest`, which currently exposes:

- `appId`
- optional `minInstances`
- optional `maxInstances`

This is particularly important because it exposes one of the platform’s operational control points: adjusting prewarmed or allowed capacity for a launchable session type without changing the entire deployment setup.

### Session configuration endpoint

The OpenAPI spec also contains:

- `POST /service/session/{session}/config`

This endpoint sets a config value inside a running session if the required config-store extension is present in the Theia application. The spec documents it as a session-level runtime configuration endpoint rather than a general-purpose storage API.

This is one of the clearest examples of the service exposing a control-plane operation that affects a live runtime rather than only creating or deleting top-level resources.

## Response Shapes

The current API uses a fairly pragmatic mix of response types:

- plain `String` responses for launch and session-start URLs
- `Boolean` responses for several ping, stop, delete, and activity operations
- JSON resource lists for workspace and session listings
- structured JSON responses for app definitions and performance metrics

That means the API is optimized more for direct platform control operations than for an especially uniform REST style.

## What This Means for Integrators

If you are integrating against the service, the main distinction to keep in mind is:

- use `/service` when you want a high-level launch operation
- use `/service/workspace` when you are managing durable user context
- use `/service/session` when you are managing live runtime instances
- use `/service/appdefinition` when you need launchable session types or scaling-related control

In other words, the API is modeled around platform lifecycle stages rather than around frontend pages.

## Source of Truth

The current docs page is derived from the generated service spec and related generated API markdown in the Theia Cloud codebase:

- `theia-cloud/documentation/openapi.json`
- `theia-cloud/documentation/api/README.md`

If you need endpoint-level detail beyond this overview, those generated artifacts are the most direct reference.
