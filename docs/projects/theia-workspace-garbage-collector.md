---
title: theia-workspace-garbage-collector
sidebar_label: theia-workspace-garbage-collector
---

# theia-workspace-garbage-collector

## Overview

The **Theia Workspace Garbage Collector** is a specialized Kubernetes operator designed to manage the lifecycle of user workspaces in a Theia Cloud deployment. It ensures that storage resources are reclaimed by automatically cleaning up unused or abandoned workspaces.

## Key Features

- **Automated Cleanup**: Periodically scans the cluster for workspaces that have exceeded their Time-To-Live (TTL).
- **Resource Management**: Prevents storage exhaustion by removing old workspace data from persistent volumes.
- **Configurable TTL**: Allows administrators to define how long an unused workspace should be preserved (default: 2 weeks).
- **Periodic Checks**: Runs at configurable intervals to maintain cluster hygiene.

## Tech Stack

- **Go**: High-performance implementation using the Kubernetes `client-go` library.
- **Kubernetes API**: Directly interacts with cluster resources to identify and delete orphaned workspaces.
- **Helm**: Provides easy installation and configuration via standard Kubernetes charts.

## Repository Link

[ls1intum/theia-workspace-garbage-collector](https://github.com/ls1intum/theia-workspace-garbage-collector)
