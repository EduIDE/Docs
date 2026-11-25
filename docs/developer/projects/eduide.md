---
title: EduIDE
sidebar_label: EduIDE
---

# EduIDE

## Overview

The **EduIDE** repository builds the IDE and the images that students use. The IDE is an [Eclipse Theia](https://theia-ide.org/) browser application. There is no desktop (Electron) build. The control plane starts these images as session pods, see [EduIDE Control Plane](/developer/projects/eduide-control-plane).

## Images and editions

The images stack in three layers:

```
base                    Theia, Scorpio, eduide-session
 |- base-standalone     adds a git credential cache (cache --timeout=10800)
 |   '- <lang>-standalone
 '- base-artemis        adds the Artemis extension
     '- <lang>-artemis
```

Every language ships in two **editions**, published as `ghcr.io/eduide/eduide/<lang>-<edition>`:

- **`artemis`** carries the Artemis extension (with Iris) for exercises launched from Artemis.
- **`standalone`** has no Artemis extension. Students type their git credentials once, and the cache forgets them after three hours.

Both editions carry Scorpio and `eduide-session`, the same toolchain and the same starter templates.

| Language | Images |
| --- | --- |
| Java 17 | `java-17-artemis`, `java-17-standalone` |
| Java 25 | `java-25-artemis`, `java-25-standalone` |
| Python | `python-artemis`, `python-standalone` |
| JavaScript | `javascript-artemis`, `javascript-standalone` |
| C | `c-artemis`, `c-standalone` |
| Rust | `rust-artemis`, `rust-standalone` |
| Go | `go-artemis`, `go-standalone` |

The matrix of the `images` job in `.github/workflows/build.yml` is the source of truth for what is published. Haskell, OCaml and Swift are no longer published, and there are no per-university images. A university with its own needs derives an image `FROM` an edition image, see [EduIDE Image Mannheim](/developer/projects/eduide-image-mannheim).

Each language has one edition-agnostic `images/<lang>/ToolDockerfile` that takes the edition image as `BASE_IMAGE` and is built twice. The images run on Ubuntu 26.04 and build Theia once in `base`, so adding a language never rebuilds the IDE.

In the installation chart, a template names an image. The artemis editions are usually unlisted templates that only Artemis links start. The standalone editions are listed and show as start tiles. See [Architecture](/developer/platform/architecture#domain-objects).

## The `eduide-session` extension

The base image ships the `eduide-session` extension, built from the [EduIDE-control-plane](https://github.com/EduIDE/EduIDE-control-plane) repository at the commit in the build argument `EDUIDE_SESSION_COMMIT` of `images/base-ide/BaseDockerfile`. It replaces the old data injection and session monitor extensions. The IDE contacts the agent in the pod on the loopback interface, receives the launch data and sends activity heartbeats. See [Session Prewarming](/developer/platform/session-prewarming#launch-data-reaches-the-ide).

`scripts/check-required-plugins.sh` runs in every `ToolDockerfile` and fails the build if a language patch removes `scorpio` or `eduide-session`.

## Project templates

A template is a starter project that Scorpio copies into an empty workspace. Templates live in `images/<lang>/templates/<id>/`, and the folder name is the id. Each has a `template.json` with `label`, `description` and `order`. The optional `"needsNetwork": true` marks a template whose tasks download on first use. A folder without `template.json` is ignored.

| Image | Template ids |
| --- | --- |
| `java-17-*`, `java-25-*` | `maven`, `gradle` |
| `c-*` | `make`, `bazel` |
| `python-*` | `python` |
| `javascript-*` | `node`, `web` |
| `rust-*` | `cargo` |
| `go-*` | `go` |

`*` is the edition. A launch asks for a template with the key `TEMPLATE`. Scorpio copies `/home/theia/templates/<id>` into the workspace only if the workspace is empty and no `GIT_URI` is set.

Every language image writes `/opt/eduide/template.json` with its templates and installed tools. CI copies it into the OCI annotation `io.eduide.template`, which the operator reads to fill the template information of the landing page.

## HTML preview

Live Preview does not work in the cloud. The images use Theia's mini browser. Each `ToolDockerfile` sets `THEIA_WEBVIEW_EXTERNAL_ENDPOINT` and `THEIA_MINI_BROWSER_HOST_PATTERN` to `webview.{{hostname}}`, so webviews and previews share the fixed webview host that the gateway routes. Environment variables do not travel from the base image, so every `ToolDockerfile` repeats them. Locally, open the IDE through `localhost` (for example `http://localhost:3103`), not `127.0.0.1`, so the browser resolves `webview.localhost`.

## Features in the IDE

- **Workspace mode.** The status bar shows "Saved workspace" or "Temporary workspace". The IDE compares the device of the workspace folder with the device of `/`.
- **Back to start page.** File > "Back to Start Page" returns to the landing page of the installation. The session keeps running.
- **Experience levels.** Beginner, Advanced and Expert decide how much of the IDE a student sees. An exercise sets the starting level in `.vscode/eduide.json`. See [Customizable Features](/instructor/course-evaluation/customizable-features#experience-levels).
- **Report Issue and feedback.** **Help > Report Issue** opens the bug form of `EduIDE/EduIDE` with `installation` (the hostname) and `version` filled in. On installations that turned feedback on (`eduide.feedbackEnabled` is true), **Help > Send Feedback**, the command palette and a status bar item open a dialog that sends through the `eduide.feedback.send` command of the `eduide-session` extension. See [Feedback and Footer Links](/admins/operations/feedback-and-footer).
- **Image version.** **Help > About** shows the container image and the build revision.

## Issue forms

`EduIDE/EduIDE` has the issue forms `bug_report.yml` and `feature_request.yml`. Links prefill a form with query parameters named after the field ids:

| Field id | Content |
|---|---|
| `description` | What happened, or what you want |
| `steps` | Steps to reproduce (bug form only) |
| `installation` | Hostname of the installation |
| `version` | EduIDE version |
| `app-definition` | The template that was started |
| `browser` | Browser |

Example: `https://github.com/EduIDE/EduIDE/issues/new?template=bug_report.yml&installation=eduide.example.org&version=3.0.0`.
Never put the session URL into a link. It can hold credentials.

## Security

The Theia server has no authentication of its own, so every image binds it to `127.0.0.1:3000`. Only containers in the same pod reach it, which in a session is the agent. The agent accepts only requests with a valid instance token. Never widen that bind. The compose file overrides the hostname for local testing only. Never carry that into Kubernetes.

## CI checks

- `build.yml` builds `base`, both edition bases and then the language images. The release tooling reads the image names from the matrix of the job `images`, so keep that job name and the flat entries.
- The `smoke` job runs `scripts/smoke-test-image.sh <image> <edition>` on every image. It checks that the IDE answers on port 3000, that the required extensions are present, that the toolchain runs and that the Test task of every template passes without network. Templates marked `needsNetwork` run with network.
- The `Extension tests` workflow runs the unit tests of `theia-extensions/*` on pull requests.

## Local build

```bash
docker compose -f docker-compose.images.yml up --build java-17-standalone
```

The IDE answers on `http://127.0.0.1:3103/`. Each service publishes its own port on `127.0.0.1`. Pull requests publish images with the tag `pr-<number>`, see [Deploying Pull Requests](/developer/guides/deploying-pull-requests).

To add a language, copy `images/java-17` and follow the [walkthrough](https://github.com/EduIDE/EduIDE/blob/main/docs/how-to-build-ide-variants.md).

## Repository

[EduIDE/EduIDE](https://github.com/EduIDE/EduIDE)
