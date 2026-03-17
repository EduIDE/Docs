---
title: EduIDE Deployment
sidebar_label: EduIDE Deployment
---

# EduIDE Deployment

## Overview

The **EduIDE Deployment** repository is the central hub for the infrastructure-as-code (IaC) of the EduIDE ecosystem. It manages the automated deployment of [EduIDE Cloud](https://github.com/EduIDE/EduIDE-Cloud) to various Kubernetes clusters using GitHub Actions and Helm. This ensures that students and developers have access to a reliable, browser-based IDE environment across production, staging, and testing tiers.

## Key Features

- **Automated CI/CD**: Seamless deployment pipelines using GitHub Actions for various branches and environments.
- **Environment Management**: Specialized configurations for `production`, `staging`, and multiple `test` environments.
- **Custom Helm Charts**:
  - `theia-cloud-combined`: A master chart that bundles all necessary components.
  - `theia-appdefinitions`: Configures the custom IDE environments (images and resources).
  - `theia-certificates`: Manages SSL/TLS certificates, including TUM-specific processes.
  - `theia-monitoring`: Sets up Prometheus and Grafana dashboards for observability.
- **GitOps Workflow**: Deployments are managed through Git with approval gates and automated rollouts to staging.
- **Authentication Integration**: Detailed configuration for Keycloak to manage user access and session security.

## Technical Details

- **Infrastructure**: Kubernetes (K8s)
- **Deployment Tooling**: Helm 3.x, GitHub Actions
- **Configuration**: YAML (Helm values)
- **Monitoring**: Prometheus, Grafana
- **Authentication**: Keycloak
- **Networking**: Envoy gateway, SSL/TLS certificates

## Integration

**EduIDE Deployment** provides the foundation upon which all other EduIDE projects run. It coordinates the deployment of the Theia Cloud base components, the custom IDE blueprints (using images built in [EduIDE](/developer/projects/eduide)), and the necessary supporting services like the [EduIDE Shared Cache](/developer/projects/eduide-shared-cache), monitoring, and authentication. It is directly used to manage the environments that the **Theia Scale Tests** project targets.

## Repository

[EduIDE/EduIDE-deployment](https://github.com/EduIDE/EduIDE-deployment)
