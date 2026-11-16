---
title: EduIDE Data Bridge
sidebar_label: EduIDE Data Bridge
---

# EduIDE Data Bridge

## Overview

The **EduIDE Data Bridge** repository is a VS Code extension designed to facilitate secure data and credential injection into cloud-based IDE sessions. It acts as a communication bridge between the Theia Cloud host and the IDE workspace, allowing runtime configuration without manual user intervention.

## Key Features

- **Data Injection**: Exposes a lean HTTP server within the IDE to receive data (e.g., credentials, environment variables) from the host.
- **VS Code Commands**: Provides commands like `dataBridge.getEnv` for other extensions to retrieve the injected data.
- **Storage**: Stores injected data in memory and VS Code secret storage.
- **Centralized Logging**: Includes a robust logging service for easier debugging of the bridge's operation.

## Behaviour Worth Knowing

- **Port and trust.** The HTTP server listens on `0.0.0.0:16281` (`DATA_BRIDGE_PORT`). Since 2.0.0 `POST /data` needs the per-instance token as `Authorization: Bearer <token>`, compared in constant time. The token comes from `DATA_BRIDGE_TOKEN`, which the operator sets from a Secret; without a configured or matching token the bridge rejects every write. `GET /health` stays public. With a CNI that enforces the chart's NetworkPolicies, only the operator reaches that port from outside the pod; anything inside the pod can still reach it on localhost. See [Prewarming Architecture](/developer/platform/session-prewarming#data-bridge).
- **Several browser windows.** Each browser connection starts its own plugin host and its own bridge, and only the first one gets the port. From v0.0.16, `dataBridge.getEnv` re-reads the shared secret storage on every call, so a second window receives the injected environment too.
- **Known keys only.** The bridge accepts `THEIA`, `TEMPLATE`, `GIT_URI`, `GIT_USER`, `GIT_MAIL`, `GIT_REF`, `GIT_SOURCE`, `ARTEMIS_URL`, `ARTEMIS_TOKEN`, `GRADLE_PREWARM`, `GRADLE_PREWARM_AUTO_CONFIRM` and `THEIACLOUD_SESSION_SECRET`. Other keys are ignored and the response names them. A deployment that injects more lists them in `DATA_BRIDGE_EXTRA_KEYS`.
- **Replace, not merge.** An injection replaces the stored environment and becomes visible all at once, so repeating it changes nothing and a reader never sees a partial set (1.0.0).
- **Errors.** A schema error returns `400`, a body over 64 KiB `413`, and a failure a generic `500` without the internal message.
- **Where it runs.** In eager (warm pool) sessions, and from EduIDE-Cloud 3.0.1 in lazy sessions too, with a per-session token Secret. See [Prewarming Architecture](/developer/platform/session-prewarming#data-bridge-token).
- **Releases.** The releases are 1.0.0 (atomic injection) and 2.0.0. 2.0.0 is the first release with the token check, so it only works with EduIDE-Cloud 3.x and chart 3.x: deploy those first, then the IDE images that contain it. EduIDE 2.0.0 pins it. Locally, set `DATA_BRIDGE_TOKEN` and send the bearer token, or every `POST /data` returns `401`. The tests need a real VS Code (`vscode-test`); pnpm 10 only.

## Tech Stack

- **TypeScript**: Implementation language.
- **Hono**: A fast, lightweight web framework for the internal HTTP server.
- **VS Code Extension API**: Integration with the IDE's command and configuration systems.

## Repository Link

[EduIDE/EduIDE-data-bridge](https://github.com/EduIDE/EduIDE-data-bridge)
