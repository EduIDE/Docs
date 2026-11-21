---
title: EduIDE Deployment
sidebar_label: EduIDE Deployment
---

# EduIDE Deployment

## Overview

The **EduIDE Deployment** repository is the central hub for the infrastructure-as-code (IaC) of the EduIDE ecosystem. It manages the automated deployment of the EduIDE platform (the [control plane](/developer/projects/eduide-control-plane), the landing page and the IDE images) to various Kubernetes clusters using GitHub Actions and Helm. This ensures that students and developers have access to a reliable, browser-based IDE environment across production, staging, and testing tiers.

## Key Features

- **Automated CI/CD**: Seamless deployment pipelines using GitHub Actions for various branches and environments.
- **Environment Management**: One directory per installation under
  `environments/`, split into `env.yaml` (how it is deployed) and `values.yaml`
  (how the chart is configured).
- **No chart source.** The charts live in
  [EduIDE-Helm](https://github.com/EduIDE/EduIDE-Helm) and are pulled from the
  OCI registry. The installation chart installs one deployment per namespace.
  See [Releases and Dependencies](/developer/guides/releases-and-dependencies).
- **GitOps Workflow**: Deployments are managed through Git with approval gates. Only `e2e` follows `main` automatically; staging and every other environment are deployed by hand with the `Deploy environment` workflow.
- **Authentication Integration**: Per environment, the OIDC realm and clients that the gateway uses for the login.

## Technical Details

- **Infrastructure**: Kubernetes (K8s)
- **Deployment Tooling**: Helm 3.x, GitHub Actions
- **Configuration**: YAML (Helm values)
- **Monitoring**: Prometheus, Grafana
- **Authentication**: Keycloak
- **Networking**: Gateway API with Envoy Gateway, one certificate per host name

## Integration

**EduIDE Deployment** provides the foundation upon which all other EduIDE projects run. It coordinates the deployment of the control plane, the IDE templates (using images built in [EduIDE](/developer/projects/eduide)), and the necessary supporting services like the [EduIDE Shared Cache](/developer/projects/eduide-shared-cache), monitoring, and authentication. It is directly used to manage the environments that the [Theia Scale Tests](/developer/projects/theia-scale-tests) project targets.

## Repository

[EduIDE/EduIDE-deployment](https://github.com/EduIDE/EduIDE-deployment)
