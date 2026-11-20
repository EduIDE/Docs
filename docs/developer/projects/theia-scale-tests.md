---
title: Theia Scale Tests
sidebar_label: Theia Scale Tests
---

# Theia Scale Tests

## Overview

The **Theia Scale Tests** repository provides an end-to-end (E2E) integration and scalability testing suite for browser IDE deployments. It is designed to simulate real-world usage of Online IDEs in large classroom settings, particularly within the EduIDE and Artemis ecosystem, ensuring that the infrastructure can handle high concurrent loads.

## Key Features

- **Functional Testing**: Validates the core features of the deployed Theia instance.
- **Scalability/Load Testing**: Simulates hundreds of concurrent IDE instances to benchmark cluster performance.
- **Artemis Integration**: Specifically tests the integration between Artemis and the Theia IDE deployment.

:::note Written for the previous stack
The tests were written against the Java stack and its landing page. Check the repository before you point them at a 3.0.0 installation. The control plane has its own end-to-end suite on kind, see [Local Development](/developer/guides/local-development).
:::
- **Model Context Protocol (MCP)**: Includes tests for AI-assisted features via MCP.
- **Multi-Language Support**: Tests various programming languages including Java, Python, C, and JavaScript.

## Tech Stack

- **Playwright**: Core framework for browser automation and E2E testing.
- **Artillery**: Used for high-scale load testing.
- **TypeScript**: The primary language for test scripts and fixtures.
- **GitHub Actions**: Automated CI/CD for running tests on schedule or on push.

## Repository Link

[EduIDE/theia-scale-tests](https://github.com/EduIDE/theia-scale-tests)
