---
title: Developer Overview
description: Project catalog, platform internals, API references and developer guides for EduIDE.
---

# Developer Overview

This section is for engineers building on top of EduIDE.

EduIDE 3.0.0 runs on the Go control plane in [EduIDE-control-plane](https://github.com/EduIDE/EduIDE-control-plane).
It starts browser IDEs on Kubernetes, keeps the files of students and lets only the owner into a session.

:::info Institution independent
EduIDE is an independent product. Hosts, realms and node labels live in the values of each installation, not in the code. Where a page names a university, it is an example.
:::

Terms such as template, session and workspace are defined in the [glossary](/glossary).

## What lives here

- Project overviews for the repositories in the EduIDE ecosystem
- [Architecture](/developer/platform/architecture) and the technical boundaries of the control plane
- The [REST API](/developer/platform/api-specification) and the [Artemis link contract](/developer/platform/external-integration)
- Developer workflows for [local setup](/developer/guides/local-development), [contributing](/developer/guides/contributing), previews and [releases](/developer/guides/releases-and-dependencies)

## Start here

If you want the repository map first, open the [Projects Overview](/developer/projects/projects-overview).
If you want to understand how a session starts, read [Architecture](/developer/platform/architecture) and then [Session Prewarming](/developer/platform/session-prewarming).
