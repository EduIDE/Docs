---
title: EduIDE Shared Cache
sidebar_label: EduIDE Shared Cache
---

# EduIDE Shared Cache

## Overview

The **EduIDE Shared Cache** repository provides a high-performance, Kubernetes-native HTTP build cache server specifically designed for Gradle builds. It implements the Gradle HTTP Build Cache API, allowing development teams and CI/CD pipelines to share build artifacts, which significantly reduces build times and resource consumption across the EduIDE ecosystem.

## Key Features

- **Gradle Compatibility**: Fully implements the Gradle HTTP Build Cache protocol for seamless integration.
- **In-Memory Storage**: Uses Redis for fast cache lookups and storage of build artifacts.
- **Role-Based Authentication**: HTTP Basic Authentication with separate reader and writer roles for fine-grained access control.
- **Kubernetes-Native**: Designed with containerization in mind, including production-ready Helm charts for easy deployment.
- **Observability**: Built-in Prometheus metrics, pre-built Grafana dashboard, Redis exporter sidecar, and structured JSON logging.
- **Dependency Proxy**: Optional Reposilite integration for caching Maven/Gradle dependencies.
- **Health Checks**: Kubernetes-ready liveness (`/ping`) and readiness (`/health`) probes.
- **Resource Efficient**: Lightweight implementation with a minimal CPU and memory footprint (~256Mi RAM, ~100m CPU).

## Technical Details

- **Language**: Go (Golang)
- **Web Framework**: [Gin](https://github.com/gin-gonic/gin)
- **Storage Backend**: [Redis](https://redis.io/) 7
- **Deployment**: Docker, Kubernetes, Helm
- **Key Dependencies**:
  - `github.com/gin-gonic/gin`: HTTP web framework.
  - `github.com/redis/go-redis/v9`: Redis client for storage operations.
  - `github.com/prometheus/client_golang`: Prometheus metrics instrumentation.

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/ping` | GET | No | Health check (liveness probe) |
| `/health` | GET | No | Storage connectivity check (readiness probe) |
| `/metrics` | GET | No | Prometheus metrics |
| `/cache/:key` | GET | reader/writer | Retrieve cache entry |
| `/cache/:key` | HEAD | reader/writer | Check if cache entry exists |
| `/cache/:key` | PUT | writer only | Store cache entry |

## Integration

In the EduIDE ecosystem, **EduIDE Shared Cache** serves as a shared Gradle build cache for students working in cloud IDE sessions. When a student triggers a Gradle build, previously computed build outputs are served from the shared cache, significantly reducing build times. Since many students work on the same exercise templates, cache hit rates are high and redundant compilation work is avoided across sessions.

## Repository

[EduIDE/EduIDE-shared-cache](https://github.com/EduIDE/EduIDE-shared-cache)
