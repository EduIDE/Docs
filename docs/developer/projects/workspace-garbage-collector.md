---
title: Workspace Garbage Collector
sidebar_label: Workspace Garbage Collector
---

# Workspace Garbage Collector

## Overview

The **Workspace Garbage Collector** repository is a specialized Kubernetes operator designed to manage the lifecycle of user workspaces in a Theia Cloud deployment. It ensures that storage resources are reclaimed by automatically cleaning up unused or abandoned workspaces.

## Key Features

- **Automated Cleanup**: Periodically scans the cluster for workspaces that have exceeded their Time-To-Live (TTL).
- **Resource Management**: Prevents storage exhaustion by removing old workspace data from persistent volumes.
- **Configurable TTL**: Allows administrators to define how long an unused workspace should be preserved (default: 2 weeks).
- **Periodic Checks**: Runs at configurable intervals to maintain cluster hygiene.

## Releases

From 1.0.0 every release publishes the image `ghcr.io/eduide/garbage-collector:X.Y.Z` next to the chart, and the chart's `image.tag` defaults to its `appVersion`, so the chart pins its own image instead of a commit SHA. Tags are `vX.Y.Z` (releases up to 0.2.0 keep `theia-workspace-garbage-collector-X.Y.Z`). 1.0.0 also falls back to the documented defaults (30 minutes, 2 weeks) when `CHECK_INTERVAL` or `WORKSPACE_TTL` are unset. EduIDE-Helm chart 3.0.0 depends on 1.0.0.

## Tech Stack

- **Go**: High-performance implementation using the Kubernetes `client-go` library.
- **Kubernetes API**: Directly interacts with cluster resources to identify and delete orphaned workspaces.
- **Helm**: Provides easy installation and configuration via standard Kubernetes charts.

## Repository Link

[EduIDE/workspace-garbage-collector](https://github.com/EduIDE/workspace-garbage-collector)
