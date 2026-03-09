---
title: theia-arc-runners
sidebar_label: theia-arc-runners
---

# theia-arc-runners

## Overview

The **Theia ARC Runners** repository provides infrastructure-as-code for deploying GitHub Actions self-hosted runners on Kubernetes using the Actions Runner Controller (ARC). It is a foundational component that powers the CI/CD pipelines for the entire EduIDE ecosystem.

## Key Features

- **Auto-Scaling Runners**: Dynamically scales runner sets (10-50+ runners) based on job demand.
- **Comprehensive Caching**: Implements Docker Registry mirrors, npm (Verdaccio) caches, and apt-cacher-ng to drastically speed up build times.
- **Multi-Architecture Support**: Supports both AMD64 and ARM64 (Apple Silicon) runner sets.
- **HTTPS Proxy Caching**: Uses a Squid proxy with SSL bumping to cache external assets like VS Code extensions.
- **Performance Optimization**: Includes memory-backed build caches for ultra-fast local processing.

## Tech Stack

- **Kubernetes**: Orchestration for the runner pods.
- **Actions Runner Controller (ARC)**: Manages the lifecycle of GitHub self-hosted runners.
- **Helm**: Deployment management for the runner sets and caching services.
- **Verdaccio / Squid / apt-cacher-ng**: Caching and proxy services.

## Repository Link

[ls1intum/theia-arc-runners](https://github.com/ls1intum/theia-arc-runners)
