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
https://<landing-page>/?appDef=<id>&gitUri=<repo>&gitRef=<ref>&gitUser=<u>&gitMail=<m>&artemisUrl=<url>&artemisToken=<tok>
```

A link is either a trusted Artemis link or an external link, see [Link types](#link-types). A link without Artemis parameters is the format for [opening any Git repository](/instructor/course-operations/open-a-git-repository).

The landing page (`EduIDE-Landing-Page/src/App.tsx`) parses only the following parameters:

| Parameter | Description |
| --- | --- |
| `appDef` (also accepts `appdef`) | app definition id to launch |
| `gitUri` | git repo URL to clone |
| `gitRef` | optional branch, tag or commit to check out after the clone |
| `gitUser` | git username, trusted Artemis links only |
| `gitMail` | git email, trusted Artemis links only |
| `artemisUrl` | Artemis service URL, trusted Artemis links only |
| `artemisToken` | Artemis auth token, trusted Artemis links only |
| `user` | user id, used only in anonymous mode when Keycloak is disabled |

The landing-page README also lists a `gitToken` parameter, but the current landing page does not parse it. Do not rely on `gitToken`.

### Link types

A link with a `gitUri` is one of two types. The landing page decides by the host, not by the parameters, because anyone can write any link.

**Trusted Artemis link.** The hosts of both `gitUri` and `artemisUrl` are in the installation's `landingPage.trustedArtemisHosts`. The link may carry `artemisToken`, `gitUser`, `gitMail`, and a credential in `gitUri` for a private repository. It starts automatically, see below. The list is empty by default.

**External link.** Every other link with a `gitUri`. The landing page checks it before anything starts:

- The URL is a valid HTTPS URL.
- The host is in `landingPage.allowedGitHosts` (default `github.com` and `gitlab.com`) or in `trustedArtemisHosts`.
- The URL carries no credentials.

A link that fails a check shows the reason and starts nothing. Only the repository (`GIT_URI`) and the ref (`GIT_REF`) pass on; `artemisUrl`, `artemisToken`, `gitUser` and `gitMail` are dropped. A valid external link always waits for one click, because the page cannot tell who wrote it. Without credentials, only public repositories work for external links today.

The landing page sets `GIT_SOURCE` itself (`artemis` or `external`). A link cannot set it.

### Auto-start conditions

A trusted Artemis link launches automatically, with no button click, only when all of these hold. Otherwise the user must click **Launch**. External links never start automatically.

1. `appDef`, `gitUri`, and `artemisToken` are all present. `appDef` plus `gitUri` alone does not auto-start.
2. `appDef` is a registered, whitelisted app definition in the landing page config. An unregistered value shows an error and aborts, and the default app does not start in its place.
3. The hosts of both `gitUri` and `artemisUrl` are in `landingPage.trustedArtemisHosts`. Without this, a link that embeds credentials in `gitUri` is refused, and any other link is handled as an external link.
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
    "appDefinition": "java-17",
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

- Workspace reuse: pass a stable `workspaceName` to attach to an existing persistent workspace, which preserves files. Use one name per user and repository: if the workspace's `origin` does not match `GIT_URI`, Scorpio clears it before cloning, which deletes unpushed files. Omit it, with `ephemeral: false`, and each call creates a new persistent volume and a fresh clone, with a name like `ws-<appDef>-<user>-<uuid>`. The landing page derives a deterministic name (`ws-<app>-<repo>-<user>-<hash>`); from landing page 1.3.0 the hash covers the full user, the full app key and `gitUri`, and from the release with EduIDE-Landing-Page#50 a set `gitRef` is part of it too, so each ref gets its own workspace, because the readable segments are cut at 12 characters. Integrators who want persistence should compute a stable name too. Because the name changed with 1.3.0, a repository link opens a new workspace after that upgrade; see [Upgrades](/admins/maintenance/upgrades#behaviour-that-changes-unless-you-set-something).
- Ephemeral sessions: the session name includes a hash of the normalized `GIT_URI` and, when set, `GIT_REF` (EduIDE-Cloud#147), so a user holds one ephemeral session per app definition, repository and ref.
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

See [Prewarming Architecture](./session-prewarming) for the data-bridge details and [Platform Architecture](./architecture) for the surrounding design. For sensitive values, reference a Secret with `env.fromSecrets` in the launch request (it becomes `envVarsFromSecrets` on the `Session`), with the Secret on the operator allowlist. The allowlist applies to every caller, so list only Secrets every caller may read.

On the eager path, consumers such as Scorpio wait about 10 seconds after they start for the bridge values. If injection arrives later, they fall back to the process environment, and the session opens without a clone; see [Prewarming Architecture](./session-prewarming#known-shortcomings).

## Git authentication for cloning

There is no separate git-token parameter or `GIT_TOKEN` env var. Scorpio clones `GIT_URI` into an empty workspace exactly as provided and does not add any credential. After a fresh clone it checks out `GIT_REF`; a ref that does not exist gives a warning and leaves the default branch. The landing page drops a `gitRef` that could be read as an option or range (leading `-`, `..`, whitespace, `@{` and similar) without a message, so no `GIT_REF` reaches Scorpio and the default branch opens.

- Trusted Artemis links embed the VCS token in the `gitUri` value, for example `https://<user>:<token>@host/org/repo.git`. Percent-encode the user and token inside the repository URL, then encode the whole URL again as the `gitUri` query value, or a `+` in a token turns into a space. The embedded credential stays in the clone's `.git/config`, because pushing from the IDE needs it.
- External links must not carry credentials. The landing page refuses them, so only public repositories work.

For external repositories Scorpio always asks before the Gradle prewarm, which runs the repository's own build code. This holds in the Artemis edition too.

Scorpio no longer talks to Artemis itself and does not use `ARTEMIS_TOKEN`. It writes `ARTEMIS_URL` into the `artemis.apiBaseUrl` setting; signing in to Artemis and submitting are the job of the Artemis extension bundled in the IDE images.

Because the `gitUri` of an Artemis link carries credentials, treat it as sensitive. It appears in the landing-page URL and in the launch request. From landing page 1.3.0, the landing page's nginx logs the path without the query string. Proxies and load balancers in front of it log the full URL unless you configure them not to.

## Authentication

- `appId` in the body must equal the server's service auth token. Otherwise the service returns HTTP 470 (invalid app id).
- Keycloak enabled: send `Authorization: Bearer <jwt>`. If `user` is omitted it defaults to the JWT `email`. If supplied it must match the token email, otherwise the service returns HTTP 403.
- Anonymous mode, with Keycloak disabled: `user` is mandatory. A blank user returns HTTP 400. From EduIDE-Cloud 1.2.1 it must also start and end with a letter or digit and contain only letters, digits and `._@+-`. Because nothing verifies it, the ownership check above only prevents accidental collisions in this mode.
