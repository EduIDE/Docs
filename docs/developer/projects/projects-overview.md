---
title: Projects Overview
description: Overview of the repositories that make up the EduIDE ecosystem.
---

# Projects Overview

These repositories together define the EduIDE platform, its deployment model, the IDE images and the operational tooling.

## Platform

- [EduIDE-control-plane](/developer/projects/eduide-control-plane): The Go control plane with operator, service, authz, agent, pool scaler, landing page and the `eduide-session` extension.
- [EduIDE](/developer/projects/eduide): The IDE and the images for every language, in an Artemis and a standalone edition.
- [EduIDE-Helm](https://github.com/EduIDE/EduIDE-Helm): The installation chart `eduide` (one per deployment) and the cluster chart `eduide-cluster` (once per cluster).
- [scorpio](https://github.com/EduIDE/scorpio): The extension that prepares a workspace (clone, starter projects, Gradle warmup).
- [eduide-keycloak-theme](https://github.com/EduIDE/eduide-keycloak-theme): The Keycloak login theme.
- [.github](https://github.com/EduIDE/.github): Reusable workflows and the Renovate preset for the organization.

## Operations and tooling

- [EduIDE Deployment](/developer/projects/eduide-deployment): Environments and deployment workflows.
- [EduIDE Image Mannheim](/developer/projects/eduide-image-mannheim): Example of an installation-specific image derived from an edition image.
- [EduIDE Shared Cache](/developer/projects/eduide-shared-cache): Shared Gradle and Bazel build cache.
- [EduIDE LSP Extension](/developer/projects/eduide-lsp-extension): Remote language-server connector for Theia and VS Code.
- [Theia Scale Tests](/developer/projects/theia-scale-tests): End-to-end and load tests for classroom-scale usage.
- [Theia ARC Runners](/developer/projects/theia-arc-runners): Self-hosted GitHub Actions runners on Kubernetes.

## Replaced in 3.0.0

EduIDE 3.0.0 replaces the Java stack with the Go control plane. These repositories get no new releases. They are archived after the rollout of 3.0.0:

| Repository | Replaced by |
| --- | --- |
| EduIDE-Cloud (operator, REST service, conversion webhook, session monitor) | The operator, service, authz and agent of the control plane |
| EduIDE-Landing-Page | The landing page of the control plane |
| EduIDE-data-bridge | The `eduide-session` extension |
| workspace-garbage-collector | The workspace expiry of the operator, see [Session Lifecycle](/developer/platform/session-lifecycle#expiry-of-saved-workspaces) |
| EduIDE-pool-scaler | The `pool-scaler` of the control plane repository |

The login proxy sidecar per session is gone as well. The gateway now does the login and the owner check, see [Architecture](/developer/platform/architecture#access-to-a-session). Error reporting moves to OpenTelemetry traces and Prometheus metrics.
