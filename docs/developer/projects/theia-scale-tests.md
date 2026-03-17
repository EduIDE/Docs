---
title: Theia Scale Tests
sidebar_label: Theia Scale Tests
---

# Theia Scale Tests

## Overview

The **Theia Scale Tests** repository provides an end-to-end (E2E) integration and scalability testing suite for [Theia Cloud IDE](https://theia-cloud.io). It is designed to simulate real-world usage of Online IDEs in large classroom settings, particularly within the EduIDE and Artemis ecosystem, ensuring that the infrastructure can handle high concurrent loads.

## Key Features

- **Functional Testing**: Validates the core features of the deployed Theia instance.
- **Scalability/Load Testing**: Simulates hundreds of concurrent IDE instances to benchmark cluster performance.
- **Artemis Integration**: Specifically tests the integration between Artemis and the Theia IDE deployment.
- **Model Context Protocol (MCP)**: Includes tests for AI-assisted features via MCP.
- **Multi-Language Support**: Tests various programming languages including Java, Python, Rust, C, OCaml, and JavaScript.

## Tech Stack

- **Playwright**: Core framework for browser automation and E2E testing.
- **Artillery**: Used for high-scale load testing.
- **TypeScript**: The primary language for test scripts and fixtures.
- **GitHub Actions**: Automated CI/CD for running tests on schedule or on push.

## Repository Link

[EduIDE/theia-scale-tests](https://github.com/EduIDE/theia-scale-tests)
