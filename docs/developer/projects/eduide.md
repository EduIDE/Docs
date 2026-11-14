---
title: EduIDE
sidebar_label: EduIDE
---

# EduIDE

## Overview

The **EduIDE** repository manages the Docker builds for custom Eclipse Theia IDE instances. These images are pre-configured with the specific tools, plugins, and settings required for student exercises on the Artemis platform. Once built, these images are deployed to Kubernetes clusters via [Theia Deployment](/developer/projects/eduide-deployment).

## Key Features

- **Customized IDEs**: Tailored environments for Java 17, Java 25, Python, JavaScript, C, Rust and Go, each in a standalone and an Artemis edition (from 2.0.0).
- **Optimized Build Process**: Uses multi-stage Docker builds to ensure small and efficient production images.
- **Security-First**: Configured to run as a non-root `theia` user for better container security in cloud environments.
- **Plugin Integration**: Includes pre-installed VS Code extensions and Theia plugins (such as the [EduIDE LSP Extension](/developer/projects/eduide-lsp-extension) and [EduIDE Data Bridge](/developer/projects/eduide-data-bridge)) necessary for the educational ecosystem.

## Image Layering and Editions

:::note Release 2.0.0
Editions, templates, Rust and Go are planned for EduIDE 2.0.0 and live in the open pull requests [#220](https://github.com/EduIDE/EduIDE/pull/220), [#221](https://github.com/EduIDE/EduIDE/pull/221) and [#222](https://github.com/EduIDE/EduIDE/pull/222). Until they are released, 1.5.0 is the latest release; see [Published Images (1.5.0)](#published-images-150).
:::

From 2.0.0 the images stack in three layers, and every language ships in two **editions**:

```
base                    Theia, Scorpio, data bridge, session monitor
 |- base-standalone     adds a git credential cache (cache --timeout=10800)
 |   '- <lang>-standalone
 '- base-artemis        adds the Artemis extension
     '- <lang>-artemis
```

- `base-standalone` and `base-artemis` are thin Dockerfiles `FROM base`. They are separate files only because the shared build workflow has no `target` input. The Artemis extension is the only difference between the editions. Scorpio and the data bridge are in both.
- Each language has one edition-agnostic `images/<lang>/ToolDockerfile`. It takes the edition image as `BASE_IMAGE` and is built twice, on Ubuntu 26.04. The 14 images are `java-17`, `java-25`, `python`, `javascript`, `c`, `rust` and `go`, each with the suffix `-standalone` and `-artemis`, published as `ghcr.io/eduide/eduide/<lang>-<edition>`.
- Standalone sessions have no Artemis token to hand out, so students type their git credentials once and the cache forgets them after three hours.
- `scripts/check-required-plugins.sh` runs in every `ToolDockerfile` after the `package.json` merge and again on the finished `plugins/` folder. It fails the build if a language patch removed `theia-cloud-monitor`, `scorpio` or `data-bridge`.
- Toolchains that do not come from apt are pinned with an `ARG <NAME>_VERSION` and a `# renovate:` comment, so Renovate bumps them with a one-line pull request. The Go tarball is verified against `GO_SHA256_AMD64` and `GO_SHA256_ARM64`; update the checksums with the version.

An installation-specific image derives `FROM` an edition image; see [EduIDE Image Mannheim](/developer/projects/eduide-image-mannheim).

The `java-17`, `java-25`, `python`, `javascript`, `c`, `*-templates` and `thm-java-25` images get no new tags after 1.5.0. Haskell and OCaml are no longer published.

## Project Templates

A template is a starter project that Scorpio copies into an empty workspace. Templates live in `images/<lang>/templates/<id>/`, and the folder name is the id. Each has a `template.json`:

```json
{ "label": "Maven", "description": "Java project built with Maven, JUnit 5", "order": 1 }
```

`label`, `description` and `order` describe the template. The optional `"needsNetwork": true` marks a template whose tasks download on first use (Maven, Gradle, Bazel). A folder without `template.json` is ignored.

| Image | Template ids |
| --- | --- |
| `java-17`, `java-25` | `maven`, `gradle` |
| `c` | `make`, `bazel` |
| `python` | `python` |
| `javascript` | `node`, `web` |
| `rust` | `cargo` |
| `go` | `go` |

How a template reaches a session:

1. The `ToolDockerfile` copies `images/<lang>/templates` to `/home/theia/templates`. The old per-image `entrypoint.sh` is gone; only `images/c/entrypoint.sh` remains, and it writes `~/.bazelrc` from runtime env.
2. The launch carries `TEMPLATE=<id>`, which the landing page sets for a standalone start. On a prewarmed pod it arrives through the data bridge, so Scorpio treats `TEMPLATE` like `GIT_URI` when deciding that the bridge is complete.
3. Scorpio copies `/home/theia/templates/<id>` into the workspace, but only if the workspace is empty and no `GIT_URI` is set. If both the workspace and the template have `.vscode/settings.json`, it merges them (JSONC, the template's keys win). The `template.json` itself is not copied.

Every template has a `.vscode/tasks.json` with Run (the default build task, called Start in the web template), Build where the language has one, and Test (`"group": "test"`) where the template has tests (the C templates have none), so the experience levels can show tasks by level. A task without a group, such as Lint or Clippy, sets `"eduide": { "minLevel": "advanced" }`.

To add a template, add the folder with its `template.json`, offer it in the app's `buildSystems` in the EduIDE-Helm catalog (`{ id, label }`), and extend the template table in the docs. CI publishes each image's template list as the build artifact `templates-<image>.json`, and the Helm release check reads the `template.json` files from the published images with `crane` to compare them with the catalog.

## CI Checks

- `build.yml` builds `base`, both edition bases, then the 14 language images. The EduIDE-Helm release train reads the image names from the matrix `jobs.images.strategy.matrix.include[]["image-name"]`, so keep that job name and the flat entries.
- The `smoke` job pulls each built image and runs `scripts/smoke-test-image.sh <image> <edition>`. It checks that the IDE answers on port 3000, that the required extensions are present (the Artemis extension only in the artemis edition), that the credential cache is set only in standalone, that the toolchain runs, and that the Test task of every template passes with `--network none` (templates marked `needsNetwork` run with network). The real Artemis flow is not covered.
- The `Extension tests` workflow runs the unit tests of `theia-extensions/*` on pull requests.

## HTML Preview

Live Preview does not work in the cloud, because it serves on `127.0.0.1` inside the container. The images use Theia's built-in mini-browser, which serves files through the IDE server. Each `ToolDockerfile` sets

```
THEIA_MINI_BROWSER_HOST_PATTERN="{{uuid}}.webview.{{hostname}}"
```

The default pattern `{{uuid}}.mini-browser.{{hostname}}` has no gateway route. The webview host family is already routed and certified (`hosts.allWildcardInstances: ["*.webview."]` in the chart). `ENV` is not inherited from the base image, so every `ToolDockerfile` repeats it. The product extension silences Theia's "host pattern changed" warning for this one pattern. Students open a preview with "Open Preview to the Side" or right-click, Open With, Preview. Locally, open the IDE through `http://localhost:3000`, not `127.0.0.1`, so the browser resolves `<uuid>.webview.localhost`.

## Workspace Mode

The `customization` extension shows "Saved workspace" or "Temporary workspace" in the status bar. The browser asks the server over JSON-RPC (`/services/eduide/workspace-mode`). The server (`workspace-mode-service.ts`, `mount-check.ts`) compares the device of the workspace folder with the device of `/`. A persistent session mounts its volume on the workspace, an ephemeral one stays on the container's root file system. Comparing with `/` keeps subfolders of a mounted volume working. If a `stat` fails, the answer is unknown rather than "temporary".

## Session Activity

The customization extension reports browser input to the session monitor, and it blinks the tab title before an inactivity timeout (EduIDE [#218](https://github.com/EduIDE/EduIDE/pull/218)). See [Session Lifecycle and Ending](/developer/platform/session-lifecycle).

## Published Images (1.5.0)

The 1.5.0 build publishes `base` and nine IDE images: `java-17`, `java-17-templates`, `java-25`, `java-25-templates`, `thm-java-25`, `c`, `c-templates`, `javascript` and `python`, all under `ghcr.io/eduide/eduide/`. The `rust`, `haskell` and `ocaml` images are no longer published ([#210](https://github.com/EduIDE/EduIDE/pull/210)). EduIDE 1.5.0 is the first release without them; 1.4.0 is the last with them. Rust returns in 2.0.0, Go is new.

The Java 25 images download Maven from Maven Central and still check the pinned SHA-512 ([#205](https://github.com/EduIDE/EduIDE/pull/205)).

## Bundled Extensions

`images/base-ide/package.json.patch` pins the extensions every image ships. EduIDE 1.5.0 bundles:

| Extension | Version | Source |
|---|---|---|
| EduIDE Data Bridge | v0.0.17 | GitHub release |
| Scorpio (`aet-tum.artemis-scorpio`) | 2.1.1 | Open VSX |
| Theia Cloud session monitor | v1.2.2 | EduIDE-Cloud GitHub release |
| Artemis extension (`aet-tum.iris-thaumantias`) | 1.2.6 | Open VSX |

In EduIDE 2.0.0 the Artemis extension moves into `base-artemis`, the session monitor is pinned to v1.4.0 ([#224](https://github.com/EduIDE/EduIDE/pull/224), needed for the idle timeout of open tabs), Scorpio 2.2.0 adds `TEMPLATE` support, and data bridge 0.0.18 sets all injected variables before the first save, so Scorpio never starts with only part of them.

EduIDE 1.4.0 still bundles data bridge v0.0.14, Scorpio 2.0.0 and Artemis extension 1.2.0, and no session monitor.

## Security

- **Loopback only.** The Theia server has no authentication of its own, so every image binds it to `127.0.0.1:3000`. Only containers in the same pod reach it, which in a normal session means the oauth2-proxy sidecar ([#195](https://github.com/EduIDE/EduIDE/pull/195)). Any other container added to the pod bypasses the login. The exception is `thm-java-25`: its Dockerfile still starts Theia with `--hostname=0.0.0.0` in 1.5.0, so with that image only the NetworkPolicies keep other pods off port 3000. `docker-compose.images.yml` binds to `0.0.0.0` for local testing only; never carry that into Kubernetes.
- **No SCANOSS.** `@theia/scanoss`, which sent hashes of code snippets to scanoss.com, is removed ([#206](https://github.com/EduIDE/EduIDE/pull/206)).
- **Insecure host warning.** Theia's warning about a potentially insecure webview host pattern is on again.

These ship from EduIDE 1.5.0.

## Experience Levels

The `customization` extension offers three levels, **Beginner**, **Advanced** and **Expert**, that decide how much of the IDE a student sees. Expert is the unmodified IDE. A student switches level from the status bar, the **Experience Levels** menu or the command palette, without a reload. From 2.0.0 the levels apply to every language. An exercise can set the starting level in `.vscode/eduide.json`; see [Customizable Features](/instructor/course-evaluation/customizable-features#experience-levels) and the repository's [`docs/experience-levels-configuration.md`](https://github.com/EduIDE/EduIDE/blob/main/docs/experience-levels-configuration.md).

## Image Version in the IDE

**Help > About** shows the container image and the build revision the session runs, for example `eduide/eduide/java-17:1.5.0`. Images built by hand show `unknown`.

## Tech Stack

- **Docker**: Containerization and image management.
- **Node.js**: The underlying runtime for the Theia application.
- **Eclipse Theia**: The core IDE framework used as the base for these images.

## Repository Link

[EduIDE/EduIDE](https://github.com/EduIDE/EduIDE)
