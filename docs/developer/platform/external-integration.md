---
title: External Session Launch
description: How Artemis and other systems start an EduIDE session, with the link contract, the repository URL and the host allowlist.
---

# External Session Launch

This page describes how an external system, primarily [Artemis](https://github.com/ls1intum/Artemis), starts an EduIDE session for a user.

:::warning Artemis support is not merged yet
The fragment link below depends on Artemis pull request [ls1intum/Artemis#14702](https://github.com/ls1intum/Artemis/pull/14702). It is not merged upstream. Until it ships, Artemis does not send the repository URL with credentials, and a launch from Artemis does not clone automatically.
:::

## Overview

There are two ways in:

- **A link to the landing page.** The external system builds a URL. The browser logs the student in and the landing page launches the session. This is the integration for Artemis.
- **A direct API call.** A system that holds a user's OIDC token calls `POST /sessions` of the [REST API](./api-specification).

Both end in the same `IDESession`. The browser reaches the IDE at `https://<instance host>/<instance>/`.

## The link contract

```
https://<landing host>/?appDef=<template>&artemisUrl=<Artemis URL>#artemisToken=<token>&gitUri=<repository URL>
```

| Parameter | Where | Meaning |
| --- | --- | --- |
| `appDef` (also `appdef`) | query | Name of the template to launch. Templates with `listed: false`, such as the Artemis editions, are reachable this way. |
| `artemisUrl` | query | Base URL of the Artemis instance |
| `artemisToken` | fragment | Artemis token of the student |
| `gitUri` | fragment | Repository URL, with the student's VCS token as user info: `https://<user>:<vcs-token>@<artemis host>/git/...` |
| `gitRef` | query | Optional branch or ref, sent as `GIT_REF` only if the template allows that key (the templates of the `eduide` chart do not) |
| `title` | query | Optional title shown in "Your environments" |
| `persistence` | query | Optional `none` or `volume`, if the template allows it |

The token and the repository URL go in the **URL fragment**, which browsers do not send to servers. The service and the proxies in front of it never see the fragment.

The landing page handles the fragment in this order:

1. It reads `artemisToken` and `gitUri` and stores them in `sessionStorage`.
2. It removes them from the address bar with `history.replaceState`, so the credentials leave the history too.
3. It starts the OIDC login.
4. After the login it launches the session and sends the values in the request body.
5. It deletes the stored values when the launch is done.

If `appDef` names a known template, the landing page launches at once, without a button click. An unknown name shows an error and starts nothing. The launch is idempotent, so a reload returns to the same session.

:::note Deprecated: query parameters
Older links carry `?artemisToken=...` or `?gitUri=https://user:token@...` in the query. The landing page still reads them, moves them out of the URL before the login and logs a deprecation warning. Do not build new links this way. The query can end up in browser history and server logs. `appDef`, `artemisUrl`, `gitRef`, `title` and `persistence` stay in the query. A `?gitUri=` without credentials is still fine.
:::

## Allowlist

The service accepts only launch keys that the template lists in `injectableKeys` ([ADR 0012](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0012-user-data-secrets-allowlist.md)). Each key has a source and a format:

- `source: Request` takes the value from the request and checks the format: `HTTPSURL`, `Token`, `Enum` or `Pattern`, with `maxLength` (default 2048, at most 8192).
- `source: UserName` or `UserEmail` takes the value from the verified token, not from the request.

The rules for the usual keys:

- `ARTEMIS_URL` and `GIT_URI` need `https` and a host in the deployment's `allowedHosts`. A host outside the list is refused, and the landing page names the host.
- `GIT_URI` accepts user info only if the key rule sets `allowCredentials`, which needs the format `HTTPSURL`. Deployments set it only for templates that Artemis opens. The host allowlist and the `https` rule still apply.
- `GIT_USER` and `GIT_MAIL` come from the token.
- `ARTEMIS_TOKEN` has length and character limits.
- `TEMPLATE` accepts only the build systems the template lists (`buildSystems` in the `eduide` chart).

An unknown key answers `400` with the code `unknown-key`. There is no way to make the control plane read other Secrets or ConfigMaps. The payload is at most 8 KiB.

The value goes only into the launch data Secret of the session. The overview shows the repository URL without user info. Error messages and logs name the key and the failed rule, never the value.

## Direct API call

A system that has an OIDC token of the realm launches with the REST API:

```bash
curl -X POST "https://<service host>/api/v1/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "java-17",
    "persistence": "volume",
    "data": {
      "GIT_URI": "https://<user>:<vcs-token>@artemis.example.org/git/...",
      "ARTEMIS_URL": "https://artemis.example.org",
      "ARTEMIS_TOKEN": "<token>"
    },
    "display": { "title": "Exercise 1" }
  }'
```

The response is a `Session`. Follow `GET /sessions/{name}/events` until the phase is `Ready` and open `url`. The owner is the user of the token. See [API Specification](./api-specification) for the rules and error codes.

## Persistence and repeated launches

A launch with the same template and workspace returns the same session. For a saved workspace, the workspace name derives from user, template and repository, so opening the same repository again returns to the same files. Scorpio never clears a workspace that already has content. If its repository differs from `GIT_URI`, it skips the clone and warns the student.

## Project templates

Without a repository, a launch can ask for a starter project with the key `TEMPLATE`, for example `maven`, `gradle`, `python`, `cargo` or `go`. The ids come from the images, see [EduIDE](/developer/projects/eduide#project-templates). If `GIT_URI` is set, it wins.

## How the values reach the IDE

The operator sends the data once to the agent in the pod, and the `eduide-session` extension reads it from the agent. See [Session Prewarming](./session-prewarming#launch-data-reaches-the-ide). The IDE image must contain that extension, or the session opens without launch data.
