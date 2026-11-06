---
title: EduIDE
sidebar_label: EduIDE
---

# EduIDE

## Overview

The **EduIDE** repository manages the Docker builds for custom Eclipse Theia IDE instances. These images are pre-configured with the specific tools, plugins, and settings required for student exercises on the Artemis platform. Once built, these images are deployed to Kubernetes clusters via [Theia Deployment](/developer/projects/eduide-deployment).

## Key Features

- **Customized IDEs**: Tailored environments for Java 17, Java 25, C, JavaScript and Python.
- **Optimized Build Process**: Uses multi-stage Docker builds to ensure small and efficient production images.
- **Security-First**: Configured to run as a non-root `theia` user for better container security in cloud environments.
- **Plugin Integration**: Includes pre-installed VS Code extensions and Theia plugins (such as the [EduIDE LSP Extension](/developer/projects/eduide-lsp-extension) and [EduIDE Data Bridge](/developer/projects/eduide-data-bridge)) necessary for the educational ecosystem.

## Published Images

The build publishes `base` and nine IDE images: `java-17`, `java-17-templates`, `java-25`, `java-25-templates`, `thm-java-25`, `c`, `c-templates`, `javascript` and `python`, all under `ghcr.io/eduide/eduide/`. The `rust`, `haskell` and `ocaml` images are no longer published ([#210](https://github.com/EduIDE/EduIDE/pull/210)); their directories stay, so they still build locally with `docker-compose.images.yml`. The last release that published them is EduIDE 1.4.0.

The Java 25 images download Maven from Maven Central and still check the pinned SHA-512 ([#205](https://github.com/EduIDE/EduIDE/pull/205)).

## Bundled Extensions

`images/base-ide/package.json.patch` pins the extensions every image ships. On `main` these are:

| Extension | Version | Source |
|---|---|---|
| EduIDE Data Bridge | v0.0.17 | GitHub release |
| Scorpio (`aet-tum.artemis-scorpio`) | 2.1.1 | Open VSX |
| Theia Cloud session monitor | v1.2.1 | EduIDE-Cloud GitHub release |
| Artemis extension (`aet-tum.iris-thaumantias`) | 1.2.6 | Open VSX |

EduIDE 1.4.0 still bundles data bridge v0.0.14, Scorpio 2.0.0 and Artemis extension 1.2.0, and no session monitor.

## Security

- **Loopback only.** The Theia server has no authentication of its own, so every image binds it to `127.0.0.1:3000`. Only containers in the same pod reach it, which in a normal session means the oauth2-proxy sidecar ([#195](https://github.com/EduIDE/EduIDE/pull/195)). Any other container added to the pod bypasses the login. `docker-compose.images.yml` binds to `0.0.0.0` for local testing only; never carry that into Kubernetes.
- **No SCANOSS.** `@theia/scanoss`, which sent hashes of code snippets to scanoss.com, is removed ([#206](https://github.com/EduIDE/EduIDE/pull/206)).
- **Insecure host warning.** Theia's warning about a potentially insecure webview host pattern is on again.

These are on `main` and ship with the first release after 1.4.0.

## Experience Levels

The `customization` extension offers three levels, **Beginner**, **Advanced** and **Expert**, that decide how much of the IDE a student sees. Expert is the unmodified IDE. A student switches level from the status bar, the **Experience Levels** menu or the command palette, without a reload. An exercise can set the starting level in `.vscode/eduide.json`; see [Customizable Features](/instructor/course-evaluation/customizable-features#experience-levels) and the repository's [`docs/experience-levels-configuration.md`](https://github.com/EduIDE/EduIDE/blob/main/docs/experience-levels-configuration.md).

## Image Version in the IDE

**Help > About** shows the container image and the build revision the session runs, for example `eduide/eduide/java-17:1.4.0`. Images built by hand show `unknown`.

## Tech Stack

- **Docker**: Containerization and image management.
- **Node.js**: The underlying runtime for the Theia application.
- **Eclipse Theia**: The core IDE framework used as the base for these images.

## Repository Link

[EduIDE/EduIDE](https://github.com/EduIDE/EduIDE)
