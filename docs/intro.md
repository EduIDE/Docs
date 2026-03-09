---
sidebar_position: 1
slug: /
---

# Welcome to EduIDE

**EduIDE** is a scalable, cloud-native educational IDE platform built on [Eclipse Theia](https://theia-ide.org/) and integrated with the [Artemis](https://github.com/ls1intum/Artemis) learning management system. It provides students with powerful, browser-based development environments for programming exercises without requiring local installations.

## What is EduIDE?

EduIDE delivers a complete IDE experience directly in the browser, enabling students to:

- Write, compile, and test code without installing tools locally
- Access consistent development environments across devices
- Benefit from intelligent code completion and language server features
- Work with real-world development tools in a managed, scalable infrastructure

## Architecture Overview

The EduIDE ecosystem consists of several interconnected components:

- **[Theia Deployment](./projects/theia-deployment.md)**: Infrastructure-as-code for deploying and managing Kubernetes clusters
- **[EduIDE](./projects/eduidec.md)**: Custom IDE container images with language support and tooling
- **[Theia LSP Extension](./projects/theia-lsp-extension.md)**: Language server integration for intelligent code features
- **[Theia Shared Cache](./projects/theia-shared-cache.md)**: Distributed caching layer for improved performance
- **[Theia Scale Tests](./projects/theia-scale-tests.md)**: Load testing framework for performance validation

## Key Features

### 🚀 Cloud-Native Architecture

Built on Kubernetes with [Theia Cloud](https://github.com/eclipse-theia/theia-cloud), enabling horizontal scaling and efficient resource management.

### 🎓 Educational Focus

Designed specifically for university programming courses with features like automated grading integration, exercise templates, and student workspace isolation.

### 🔧 Extensible Platform

Supports multiple programming languages (Java, Python, C, Rust, and more) with customizable IDE blueprints and configurations.

### 📊 Observability

Comprehensive monitoring with Prometheus and Grafana dashboards for tracking system health and user activity.

## Getting Started

To explore the EduIDE projects, browse the **Projects** section in the sidebar. Each project page includes:

- An overview of the component's purpose
- Key features and capabilities
- Technical implementation details
- Links to source repositories

For deployment and infrastructure details, start with the [Theia Deployment](./projects/theia-deployment.md) documentation.

## Student Contributions

EduIDE is developed and maintained by a team of dedicated students. Check out the **Contributions** section to learn about individual thesis work and contributions to the ecosystem. Each student documents their research, implementations, and the impact of their work on the platform.
