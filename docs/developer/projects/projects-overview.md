---
title: Projects Overview
description: Overview of the repositories that make up the EduIDE ecosystem.
---

# Projects Overview

The developer section includes the project catalog that previously lived in the top-level docs structure. These repositories together define the EduIDE platform, deployment model, extensions, and operational tooling.

## Project catalog

Platform:

- [EduIDE-Cloud](https://github.com/EduIDE/EduIDE-Cloud): Operator, REST service, conversion webhook and session monitor.
- [EduIDE-Helm](https://github.com/EduIDE/EduIDE-Helm): The `eduide` and `eduide-cluster` charts.
- [EduIDE-Landing-Page](https://github.com/EduIDE/EduIDE-Landing-Page): The page where users pick a language and start a session.
- [scorpio](https://github.com/EduIDE/scorpio): The extension that prepares a workspace (clone, templates, Gradle prewarm).
- [EduIDE-pool-scaler](https://github.com/EduIDE/EduIDE-pool-scaler): Warm pool scaler, not part of 3.0.
- [eduide-keycloak-theme](https://github.com/EduIDE/eduide-keycloak-theme): The Keycloak login theme.
- [.github](https://github.com/EduIDE/.github): Reusable workflows and the Renovate preset for the organization.

Details:

- [EduIDE Deployment](/developer/projects/eduide-deployment): Infrastructure-as-code and deployment workflows for EduIDE environments.
- [Theia Scale Tests](/developer/projects/theia-scale-tests): End-to-end and scalability validation for classroom-scale IDE usage.
- [EduIDE Shared Cache](/developer/projects/eduide-shared-cache): Shared Gradle and Bazel build cache service for faster builds.
- [EduIDE LSP Extension](/developer/projects/eduide-lsp-extension): Remote language-server connector for Theia and VS Code.
- [EduIDE Data Bridge](/developer/projects/eduide-data-bridge): Runtime data and credential injection bridge for cloud IDE sessions.
- [EduIDE](/developer/projects/eduide): Custom Eclipse Theia Docker images and packaged IDE environments.
- [EduIDE Image Mannheim](/developer/projects/eduide-image-mannheim): Reference example and template for an installation-specific image derived from an EduIDE edition image.
- [Theia ARC Runners](/developer/projects/theia-arc-runners): Self-hosted GitHub Actions runner infrastructure on Kubernetes.
- [Workspace Garbage Collector](/developer/projects/workspace-garbage-collector): Cleanup operator for expired workspaces and storage hygiene.
