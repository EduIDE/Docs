---
title: theia-shared-cache
sidebar_label: theia-shared-cache
---

# theia-shared-cache

## Overview

The **theia-shared-cache** repository provides a high-performance, Kubernetes-native HTTP build cache server specifically designed for Gradle builds. It implements the Gradle HTTP Build Cache API, allowing development teams and CI/CD pipelines to share build artifacts, which significantly reduces build times and resource consumption across the EduIDE ecosystem.

## Key Features

- **Gradle Compatibility**: Fully implements the Gradle HTTP Build Cache protocol for seamless integration.
- **Persistent Storage**: Utilizes MinIO (S3-compatible object storage) for reliable and scalable storage of cache artifacts.
- **Access Control**: Features HTTP Basic Authentication to ensure secure access to the cache.
- **Kubernetes-Native**: Designed with containerization in mind, including production-ready Helm charts for easy deployment.
- **Observability**: Built-in support for Prometheus metrics and structured JSON logging for effective monitoring.
- **Resource Efficient**: Lightweight implementation with a minimal CPU and memory footprint.

## Technical Details

- **Language**: Go (Golang)
- **Web Framework**: [Gin](https://github.com/gin-gonic/gin)
- **Storage Backend**: [MinIO](https://min.io/)
- **Deployment**: Docker, Kubernetes, Helm
- **Key Dependencies**:
  - `github.com/gin-gonic/gin`: HTTP web framework.
  - `github.com/minio/minio-go/v7`: Client for MinIO interaction.
  - `github.com/prometheus/client_golang`: Prometheus metrics instrumentation.

## Integration

In the EduIDE ecosystem, **theia-shared-cache** is an essential tool for developer productivity and CI/CD efficiency. It is used to accelerate the build processes of various components, such as the Theia IDE blueprints and other microservices, by caching intermediate build results. This is particularly beneficial in monorepo structures or large multi-module projects common in the Artemis environment.

## Repository

[https://github.com/EduIDE/EduIDE-shared-cache](https://github.com/EduIDE/EduIDE-shared-cache)
