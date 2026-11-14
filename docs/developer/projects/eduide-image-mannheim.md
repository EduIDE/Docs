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
- **Add packages, extensions and settings.** Packages go in with `USER root` and `apt-get`, extensions are unpacked into `/home/theia/plugins/<extension id>`, and course settings and keybindings (`user/settings.json`, `user/keymaps.json`) are merged into the edition's user settings, where the course wins.
- **Build and test.** The workflow is the shared EduIDE one and publishes multi-arch images to `ghcr.io`. Every build runs `scripts/smoke-test.sh`: the IDE answers on port 3000, the EduIDE plugins are present, `java` and `mvn` run.

## Versioning

The image tag is the EduIDE version it builds on (`2.0.0`). A change that only concerns this repository on the same EduIDE version gets a suffix (`2.0.0-1`). Tags come from GitHub releases; pushes to `main` publish `latest`, pull requests publish `pr-<N>`. Renovate opens a pull request for each new numbered EduIDE release. Do not use `latest` in a cluster.

## Using the Image in an Installation

Reference the image with its full path and a tag in the installation's Helm values. The EduIDE chart prefixes `ghcr.io/eduide` to every image without a tag, so a path alone would be rewritten:

```yaml
image: ghcr.io/eduide/eduide-image-mannheim/java-25:2.0.0
```

Keep the app name of an installation that has persistent workspaces and change only the image; see [Upgrades](/admins/maintenance/upgrades).

## Repository Link

[EduIDE/EduIDE-image-mannheim](https://github.com/EduIDE/EduIDE-image-mannheim)
