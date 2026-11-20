---
title: Release and Version Policy
description: What a version number means, which components carry their own versions, and how a release reaches an installation.
---

# Release and Version Policy

## One version, one meaning

| Thing | Form | Example |
|---|---|---|
| git tag | `vX.Y.Z`, `vX.Y.Z-rc.N` for a release candidate | `v3.0.0` |
| installation chart `version` | `X.Y.Z` | `3.0.0` |
| IDE image tag | `X.Y.Z` | `3.0.0` |

The chart version is the platform version and is what an installation pins. The chart pins the IDE image version, the control plane version and the landing page version.
Semantic versioning applies: a major version may change the values or need a migration, a minor version adds features, a patch version fixes.

## Components release on their own

| Component | Repository | Version |
|---|---|---|
| IDE images | EduIDE | Platform version, for example `3.0.0` |
| Control plane (operator, service, authz, agent, pool scaler, landing page) | EduIDE-control-plane | Own semver, for example `0.2.0` for EduIDE 3.0.0. One tag versions the images, both charts, the OpenAPI spec and the TypeScript client |
| Installation chart | EduIDE-Helm | Platform version |

A fix in the control plane does not rebuild the IDE images. The installation chart says exactly which versions belong together.
CRD and API versions are `v1alpha1` and `v1`. Changes are additive, and a removal needs a deprecation over one release.

## Cutting a release

Each repository releases on its own, in this order: IDE images and control plane, then the installation chart.
The installation chart release is a manual workflow that checks that the pinned images exist for both architectures, publishes the chart, and creates the release only after everything is built and verified. A failed build leaves no tag.
The release notes list what the chart version pins.

## Moving an installation

1. Read the changelog of the control plane and the release notes of the chart.
2. Change `$EDUIDE_VERSION` and your values file. Keep both in Git, and review the rendered diff.
3. Upgrade, see [Upgrades](upgrades.md). Roll back with [Rollback](rollback.md).

Pin versions in production. A floating tag, for example `latest`, can change under you when a node pulls the image again.
Pin IDE images by digest for exams.

## Security fixes

Security fixes ship as patch releases. Subscribe to the release notifications of the EduIDE repositories, and upgrade production within your own policy window.
