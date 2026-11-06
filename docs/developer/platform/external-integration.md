---
title: External Session Launch
description: How external systems such as Artemis start an EduIDE IDE session.
---

# External Session Launch

This page describes how an external system starts an EduIDE IDE session for a user.

## Overview

An external system, primarily Artemis, starts an EduIDE IDE session in one of two ways:

- Path A: a deep-link URL to the EduIDE landing page. This is the current Artemis path and the recommended integration.
- Path B: a direct REST call to the EduIDE Cloud service (`POST /service`).

Both paths ultimately create a `Session` and either redirect the browser to the session URL or return it to the caller.

## Path A - Deep-link URL (recommended)

The external system builds a URL to the landing page and adds the launch parameters as query parameters:

```
https://<landing-page>/?appDef=<id>&gitUri=<repo>&gitUser=<u>&gitMail=<m>&artemisUrl=<url>&artemisToken=<tok>
```

The landing page (`EduIDE-Landing-Page/src/App.tsx`) parses only the following parameters:

| Parameter | Description |
| --- | --- |
| `appDef` (also accepts `appdef`) | app definition id to launch |
| `gitUri` | git repo URL to clone |
| `gitUser` | git username |
| `gitMail` | git email |
| `artemisUrl` | Artemis service URL |
| `artemisToken` | Artemis auth token |
| `user` | user id, used only in anonymous mode when Keycloak is disabled |

The landing-page README also lists a `gitToken` parameter, but the current landing page does not parse it. Do not rely on `gitToken`.

### Auto-start conditions

A session launches automatically, with no button click, only when all of these hold. Otherwise the user must click **Launch**.

1. `appDef`, `gitUri`, and `artemisToken` are all present. `appDef` plus `gitUri` alone does not auto-start.
2. `appDef` is a registered, whitelisted app definition in the landing page config. An unregistered value shows an error and aborts, and the default app does not start in its place.
3. The hosts of both `gitUri` and `artemisUrl` are in the installation's `landingPage.trustedArtemisHosts` (landing page 1.3.0, chart 2.5.1). Anyone can write such a link, so a token in it proves nothing. For any other host the page shows which host the repository comes from and waits for **Launch**. The list is empty by default.
4. If Keycloak is enabled, the user must already be authenticated. Otherwise SSO login happens first. Without Keycloak, a `user` parameter is shown for confirmation before it is used.

On success the browser is redirected to the returned session URL. The landing page refreshes the login token before each launch and retries only on `502`, `503`, `504` and timeouts, after a random wait of 3 to 10 seconds. The gateway ends a request after 60 seconds while the session keeps starting, so a later request picks up the running session.

## Path B - Direct REST call to `POST /service`

A caller can also launch a session directly by posting a `LaunchRequest` JSON body to `POST /service`:

```bash
curl -X POST https://<cloud-service>/service \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "<service-auth-token>",
    "user": "student@example.com",
    "appDefinition": "java-17-latest",
    "workspaceName": "ws-...",
    "ephemeral": false,
    "timeout": 3,
    "env": {
      "fromMap": {
        "THEIA": "true",
        "GIT_URI": "https://github.com/user/repo.git",
        "GIT_USER": "student",
        "GIT_MAIL": "student@example.com",
        "ARTEMIS_TOKEN": "<token>",
        "ARTEMIS_URL": "https://artemis.example.com",
        "TEMPLATE": "<optional-build-system-id>"
      }
    }
  }'
```

The response is a plain-string session URL.

`GET /service/{appId}` is available as an optional health or readiness probe. It returns a boolean and is not a prerequisite for launching. It establishes no session state.

### Field notes

- `appId` is the shared service auth token, not a user id.
- `user` is usually the email.
- `appDefinition` names the launchable type.

### Behaviors

- Workspace reuse: pass a stable `workspaceName` to attach to an existing persistent workspace, which preserves files. Omit it, with `ephemeral: false`, and each call creates a new persistent volume and a fresh clone, with a name like `ws-<appDef>-<user>-<uuid>`. The landing page derives a deterministic name (`ws-<app>-<repo>-<user>-<hash>`); from landing page 1.3.0 the hash covers the full user, the full app key and `gitUri`, because the readable segments are cut at 12 characters. Integrators who want persistence should compute a stable name too.
- Ephemeral plus sidecars: `ephemeral: true` is rejected with HTTP 400 when the app definition has workspace-mounting sidecars. Use a workspace-backed launch there.
- Blocking: `POST /service` blocks until the operator reports the session URL, up to `timeout`, which defaults to 3 minutes, then returns the URL string. Set the client HTTP timeout above 3 minutes.
- `env.fromMap` versus `fromConfigMaps` and `fromSecrets`: `fromConfigMaps` and `fromSecrets` reference names of pre-existing in-cluster Kubernetes ConfigMaps and Secrets. External callers outside the cluster pass values directly via `fromMap`.
- Allowlist: from EduIDE-Cloud 1.2.1 the operator honours `fromSecrets` and `fromConfigMaps` only for names the administrator lists (`operator.allowedEnvFromSecrets`, `operator.allowedEnvFromConfigMaps`, both empty by default) and always drops reserved names from `fromMap`, such as anything starting with `THEIACLOUD_`, `KEYCLOAK_` or `DATA_BRIDGE_`. Dropped values are logged, not reported back to the caller. The full list is in [Session Hardening](/admins/security/session-hardening#environment-injection-allowlist).
- Ownership: from EduIDE-Cloud 1.2.1 a `workspaceName` that belongs to another user returns HTTP 403. Derive names from the user so they cannot collide.

## How the values reach the IDE

The launch values travel from the request to the running IDE container over one of two operator paths.

- Source: the values land on the `Session` custom resource (`spec.envVars`, `envVarsFromConfigMaps`, and `envVarsFromSecrets`).
- Lazy path: the operator writes the vars directly into the IDE container's environment in the pod spec.
- Eager, prewarmed path: the deployment already exists, so the operator pushes the values asynchronously over HTTP (`POST /data`) to the in-container data-bridge extension.

Either way, the extensions in the session image read the values: Scorpio configures git and clones `GIT_URI`, and the Artemis extension signs in to Artemis. On both paths the operator applies the allowlist first.

See [Prewarming Architecture](./session-prewarming) for the data-bridge details and [Platform Architecture](./architecture) for the surrounding design. For sensitive values use `envVarsFromSecrets`, with the Secret on the operator allowlist.

## Git authentication for cloning

There is no separate git-token parameter or `GIT_TOKEN` env var. Scorpio clones `GIT_URI` exactly as provided and does not add any credential. For a private repository the credential must therefore be embedded in the `gitUri` / `GIT_URI` value itself, for example `https://<user>:<token>@host/org/repo.git`. A plain `gitUri` without embedded credentials only clones a public repository. The embedded credential stays in the clone's `.git/config`, because pushing from the IDE needs it.

Scorpio no longer talks to Artemis itself and does not use `ARTEMIS_TOKEN`. It writes `ARTEMIS_URL` into the `artemis.apiBaseUrl` setting; signing in to Artemis and submitting are the job of the Artemis extension bundled in the IDE images.

Because `gitUri` can carry credentials, treat it as sensitive. It appears in the landing-page URL and in the launch request. From landing page 1.3.0, nginx logs the path without the query string, so it stays out of the access log.

## Authentication

- `appId` in the body must equal the server's service auth token. Otherwise the service returns HTTP 470 (invalid app id).
- Keycloak enabled: send `Authorization: Bearer <jwt>`. If `user` is omitted it defaults to the JWT `email`. If supplied it must match the token email, otherwise the service returns HTTP 403.
- Anonymous mode, with Keycloak disabled: `user` is mandatory. A blank user returns HTTP 400. From EduIDE-Cloud 1.2.1 it must also start and end with a letter or digit and contain only letters, digits and `._@+-`. Because nothing verifies it, the ownership check above only prevents accidental collisions in this mode.
