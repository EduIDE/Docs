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

- **Port and trust.** The HTTP server listens on `0.0.0.0:16281` (`DATA_BRIDGE_PORT`) and does not authenticate `POST /data`. The chart's NetworkPolicies let only the operator reach that port. See [Prewarming Architecture](/developer/platform/session-prewarming#data-bridge).
- **Several browser windows.** Each browser connection starts its own plugin host and its own bridge, and only the first one gets the port. From v0.0.16, `dataBridge.getEnv` re-reads the shared secret storage when a key is missing, so a second window receives the injected environment too.
- **Releases.** v0.0.16 carries the second window fix, v0.0.17 dependency security updates (`@hono/node-server` 2.x, minimatch 11). EduIDE pins v0.0.17 on `main`.

## Tech Stack

- **TypeScript**: Implementation language.
- **Hono**: A fast, lightweight web framework for the internal HTTP server.
- **VS Code Extension API**: Integration with the IDE's command and configuration systems.

## Repository Link

[EduIDE/EduIDE-data-bridge](https://github.com/EduIDE/EduIDE-data-bridge)
