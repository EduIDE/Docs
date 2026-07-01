---
title: EduIDE Shared Cache
sidebar_label: EduIDE Shared Cache
---

# EduIDE Shared Cache

## Overview

The **EduIDE Shared Cache** repository provides a high-performance, Kubernetes-native HTTP build cache server for both **Gradle** and **Bazel** builds. It implements the Gradle HTTP Build Cache API and the Bazel HTTP remote cache protocol (action cache + content-addressable store), allowing student sessions and CI/CD pipelines to share build artifacts through a single backend. This significantly reduces build times and resource consumption across the EduIDE ecosystem.

## Key Features

- **Gradle and Bazel Compatibility**: Implements both the Gradle HTTP Build Cache protocol and the Bazel HTTP remote cache (AC + CAS) through one service.
- **In-Memory Storage**: Uses Redis for fast cache lookups and storage of build artifacts.
- **Role-Based Authentication**: HTTP Basic Authentication with separate reader (read-only) and writer (read/write) roles for fine-grained access control.
- **Artifact Validation**: Optional static analysis of uploaded Gradle artifacts, inspecting Java bytecode for forbidden API usage (network, process execution, reflection, filesystem) before an entry is admitted to the cache.
- **CAS Integrity**: Optional content-hash verification for Bazel CAS uploads.
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
| `/gradle/:key` | GET | reader/writer | Retrieve a Gradle cache entry |
| `/gradle/:key` | HEAD | reader/writer | Check if a Gradle cache entry exists |
| `/gradle/:key` | PUT | writer only | Store a Gradle cache entry (subject to artifact validation) |
| `/bazel/ac/:hash` | GET | reader/writer | Retrieve a Bazel action-cache entry |
| `/bazel/ac/:hash` | PUT | writer only | Store a Bazel action-cache entry |
| `/bazel/cas/:hash` | GET | reader/writer | Retrieve a Bazel CAS blob |
| `/bazel/cas/:hash` | PUT | writer only | Store a Bazel CAS blob (optional hash verification) |

## Integration

In the EduIDE ecosystem, **EduIDE Shared Cache** serves as a shared build cache for students working in cloud IDE sessions. When a student triggers a Gradle or Bazel build, previously computed build outputs are served from the shared cache, significantly reducing build times. Since many students work on the same exercise templates, cache hit rates are high and redundant compilation work is avoided across sessions.

## Repository

[EduIDE/EduIDE-shared-cache](https://github.com/EduIDE/EduIDE-shared-cache)
