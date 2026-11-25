---
title: Glossary
description: The binding terms of EduIDE 3.x, used the same way in code, UI and docs.
---

# Glossary

These are the binding terms for EduIDE 3.x.
Code, UI texts, docs, Helm values and comments in every EduIDE repository use them in exactly this meaning.
When a term changes, change it here first and then in the repositories.

The German column holds the wording of the German UI.

## Platform objects

| Term | German UI | Meaning | In code | Do not use |
|---|---|---|---|---|
| **Template** | Template | A kind of IDE: image, resources, persistence options, timeouts. Students pick a template to start a session. | `IDETemplate`, `template` | environment, app definition, AppDefinition, image (for the choice), variant |
| **Session** | Session | One running IDE of one user, started from a template. | `IDESession`, `session` | environment, instance, workspace, "your IDE" (as a noun for the object) |
| **Workspace** | Workspace | The saved files of a user for one template, kept on a volume across sessions. A session can run with a workspace or without one. | `IDEWorkspace`, `workspace` | session, environment, volume (in user texts) |
| **Saved workspace** | Gespeicherter Workspace | Start mode: the session uses a workspace, files stay after it stops. | `persistence: volume` | |
| **Temporary session** | Temporäre Session | Start mode: the session has no workspace, files are deleted when it stops. | `persistence: none` | temporary workspace |
| **Instance** | - | One session pod with its agent, idle in a pool or claimed by a session. Internal term, not shown to students. | `eduide.github.io/instance` | session (for an idle pod), environment |
| **Idle instance** | - | An instance in a pool that no session has claimed yet. | `state=idle` | idle session, prewarmed session, ready environment |
| **Pool** | - | Idle instances of one template, kept ready so a session starts fast. Optional per template. | `IDEPool` | warm pool, app (pool scaler) |
| **Claim** | - | Assigning an idle instance to a session. | `internal/claim` | |
| **Release** | - | Ending a session and freeing its instance. Internal term of the claim protocol; user texts say stop. | | |
| **Launch data** | - | The Secret with user data for one session (tokens, Git URL). Never in a spec, log or metric. | `dataSecretRef`, `injectableKeys` | launch environment, launch parameters, data bridge |
| **Language image** | - | IDE image for one language and toolchain, built in the repository `EduIDE` (for example `java-17`). | `images/<lang>` | variant, IDE variant |
| **Edition** | - | Flavour of a language image: `artemis` (with the Artemis extension) or `standalone`. A template points to one edition of one language image. | `<lang>-<edition>` image tag | variant |
| **Starter project** | Startprojekt | Example project inside an image that a session can open (for example Web or Node.js). | `variants`, `TEMPLATE` (image env) | project template, template |
| **Installation** | Installation | One EduIDE setup with its own host, Keycloak realm and templates. | `environments/<host>` (deployment repo), `config.deployment` (Helm) | tenant, environment (in prose) |

## Starting and stopping

| Term | Meaning | In code |
|---|---|---|
| **Start** | What a student does: start a session from a template. User texts say start, never launch. | `POST /api/v1/sessions` (launch) |
| **Open** | Go to a running session. "Open in EduIDE" is the name of the Artemis link and button. | |
| **Stop** | A session ends: by the user, by the idle timeout or by the maximum session duration. | release |
| **Delete** | Remove a workspace and its files for good. | |
| **Idle timeout** | Time without activity after which a session stops. | `timeouts.idle` |
| **Warning** | Time without activity after which the IDE warns that the session will stop. | `timeouts.warning` |
| **Maximum session duration** | Time after which a session stops even when active. | `timeouts.max` |
| **Start strategy** | How a session got its instance: `warm-ready` (claimed a ready idle instance), `warm-starting` (claimed an idle instance that was still starting), `cold` (new pod). | `status.startStrategy` |

The metric label `start_mode` (`eager`, `lazy`, `lazy_fallback`) and the API field `strategy` (`warm`, `cold`) are contracts and keep their values.
`eager` covers `warm-ready` and `warm-starting`, `lazy` and `lazy_fallback` are `cold`.

## Hosts

An installation has three host names.

| Term | Meaning | In code |
|---|---|---|
| **Service host** | Serves the landing page and the REST API. | `hosts.service` |
| **Instance host** | Serves every session under its own path, `https://<instance host>/<instance id>/`. | `hosts.instance` |
| **Webview host** | Serves IDE webviews and the mini browser, by default `webview.<instance host>`. | `hosts.webview` |

## Components

Write component names in lower case in prose.

| Term | Meaning |
|---|---|
| **control plane** | The Go system that runs EduIDE 3.x: operator, service, authz, agent, pool scaler, landing page. Repository `EduIDE-control-plane`. |
| **operator** | Reconciles templates, pools, sessions and workspaces. Always the component, never a person. |
| **service** | REST API, OIDC login, launch and session events. |
| **authz** | Decides at the gateway who may enter a session. |
| **agent** | Sidecar in every instance, the only way into it. Checks the instance token and holds the launch data. |
| **pool scaler** | Sets how many idle instances a pool keeps, for example ahead of an exercise release in Artemis. |
| **landing page** | The web page where students start and open sessions. Not start page, dashboard or portal. |
| **IDE** | The Theia-based editor in a session, built in the repository `EduIDE`. |
| **`eduide-session`** | IDE extension that talks to the agent. Replaces the data bridge of 2.x. |

## People

| Term | Meaning | Do not use |
|---|---|---|
| **Student** | Uses EduIDE in a course. | learner, user (where a role is meant) |
| **Instructor** | Runs a course with EduIDE and picks its templates. | lecturer, teacher, course staff |
| **Tutor** | Supports an instructor in a course and is the first contact for students. Also an Artemis role. | teaching assistant |
| **Admin** | Installs and operates an installation. | operator, platform team, administrator (in headings) |
| **Developer** | Works on the EduIDE code. | |

## Names and spelling

- **EduIDE**, never Eduide, eduIDE or edu ide.
- **Theia**, **Artemis**, **Keycloak**, **Kubernetes**, **Helm** with these capitals.
- Never write "frontend" or "backend". Name the component (landing page, service, IDE, agent) or the thing (storage provider, gateway target). Code identifiers from Theia or the Gateway API (`FrontendApplicationContribution`, `backendRefs`) stay.
- Use a hyphen, never an em or en dash.

## Legacy names

These names come from EduIDE 2.x (Theia Cloud) and appear only where they describe history, migration or a kept contract.

| Legacy name | Today | Where it stays |
|---|---|---|
| Theia Cloud, EduIDE-Cloud | control plane | migration docs, the `stack: java` installation |
| App definition, `AppDefinition` | Template | migration docs, the `stack: java` installation |
| `appDef` | Template name | URL parameter of the Artemis link (`?appDef=<template>`), kept for Artemis |
| Eager start | Pool | migration docs |
| Data bridge | `eduide-session` | migration docs |
| workspace-garbage-collector | operator (workspace retention) | migration docs |
