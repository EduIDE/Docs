---
title: EduIDE Image Mannheim
sidebar_label: EduIDE Image Mannheim
---

# EduIDE Image Mannheim

## Overview

The **EduIDE Image Mannheim** repository is TH Mannheim's own IDE image for the course "PR2" (Java 25). It is also the reference example and a GitHub template repository for deriving an installation-specific image from an [EduIDE](/developer/projects/eduide) edition image. The image is a thin layer: `FROM` an edition image plus the few things one installation needs.

It is published as `ghcr.io/eduide/eduide-image-mannheim/java-25`.

## What It Shows

- **Derive from an edition.** The `Dockerfile` starts `FROM ghcr.io/eduide/eduide/java-25-standalone:${EDUIDE_VERSION}`. Use `<language>-standalone` for installations without Artemis and `<language>-artemis` for Artemis installations. Scorpio, the data bridge and the session monitor stay in the image; do not remove them.
- **Add packages, extensions and settings.** Packages go in with `USER root` and `apt-get`, extensions are unpacked into `/home/theia/plugins/<extension id>`, and course settings (`user/settings.json`) are merged into the edition's user settings, where the course wins, and the course keybindings (`user/keymaps.json`) replace the edition's `keymaps.json`.
- **Build and test.** The workflow is the shared EduIDE one and publishes multi-arch images to `ghcr.io`. Every build runs `scripts/smoke-test.sh`: the IDE answers on port 3000, the EduIDE plugins are present, `java` and `mvn` run.

## Versioning

The repository has its own semver releases, cut with `release.yml` like every other EduIDE repository, and the image tag is that release version. The EduIDE version it builds on is the `EDUIDE_VERSION` build argument of the `Dockerfile`, which Renovate bumps; until EduIDE 2.0.0 is the base, it points at the pull request build `pr-221`. Pushes to `main` publish `latest` and `latest-<sha7>`, pull requests publish `pr-<N>`. Do not use `latest` in a cluster.

## Using the Image in an Installation

Reference the image with its full path and a tag in the installation's Helm values. The EduIDE chart prefixes `ghcr.io/eduide` to every image without a tag, so a path alone would be rewritten:

```yaml
image: ghcr.io/eduide/eduide-image-mannheim/java-25:<release version>
```

Keep the app name of an installation that has persistent workspaces and change only the image; see [Upgrades](/admins/maintenance/upgrades).

## Repository Link

[EduIDE/EduIDE-image-mannheim](https://github.com/EduIDE/EduIDE-image-mannheim)
