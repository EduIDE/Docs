---
title: EduIDE Control Plane
sidebar_label: EduIDE Control Plane
---

# EduIDE Control Plane

## Overview

[EduIDE-control-plane](https://github.com/EduIDE/EduIDE-control-plane) is the platform of EduIDE 3.0.0. A student clicks an exercise in Artemis or picks a language on the landing page. A few seconds later an EduIDE opens in the browser with the exercise cloned. The repository is a monorepo under the [EPL-2.0 license](https://github.com/EduIDE/EduIDE-control-plane/blob/main/LICENSE).

## What it contains

| Path | Content |
| --- | --- |
| `cmd/`, `internal/` | The four Go binaries `operator`, `service`, `authz` and `agent` |
| `api/` | The contracts: CRD types, the REST API ([`openapi/v1.yaml`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/api/openapi/v1.yaml)) and the agent protocol |
| `pool-scaler/` | The pool scaler, its own Go module |
| `landing-page/` | The landing page, status page and admin panel |
| `extensions/eduide-session/` | The IDE extension that receives launch data and reports activity |
| `clients/typescript/` | The generated TypeScript client of the REST API |
| `charts/` | Helm charts for the CRDs, the control plane and the landing page |
| `test/e2e/` | End-to-end tests on kind |
| `docs/` | Architecture, ADRs, contracts, operations, development |

See [Architecture](/developer/platform/architecture) for how the parts work together.

## Rules of the repository

- **Contracts first.** API and CRD changes start in `api/` and are additive within a version. Run `make generate` afterwards. Never edit generated files.
- **Tests come with the change.** Table-driven unit tests, envtest for controllers and `make e2e` for anything on the request path.
- **No user data where it does not belong.** Tokens and launch data never go into custom resource specs, logs, traces, metrics or status.
- **No institution-specific defaults.** Hosts, realms and node labels live in deployment values.
- **Decisions get an ADR** in [`docs/adr`](https://github.com/EduIDE/EduIDE-control-plane/tree/main/docs/adr).

The setup and commands are in [Local Development](/developer/guides/local-development).

## Releases

One tag `vX.Y.Z` versions the images, the charts, the OpenAPI spec and the TypeScript client. See [Releases and Dependencies](/developer/guides/releases-and-dependencies).

## Repository

[EduIDE/EduIDE-control-plane](https://github.com/EduIDE/EduIDE-control-plane)
