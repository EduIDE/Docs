---
title: Git Accounts
description: Where the design, the API and the developer guide of Git accounts and the git-proxy live.
---

# Git Accounts

Git accounts let a student connect GitHub or GitLab once and use private repositories in every session.
The token stays in the control plane. A separate `git-proxy` adds it to Git traffic.
This page points to the sources. It does not copy them.

:::info Available from the EduIDE release that ships Git accounts
The feature is part of [EduIDE-control-plane pull request 33](https://github.com/EduIDE/EduIDE-control-plane/pull/33), which is not released yet.
The links below point to `main`. They work once the pull request is merged. Until then, read them in the branch of the pull request.
:::

## Where to read

| What | Where |
|---|---|
| Design, credential rule, approvals, threat model, limits | [ADR 0023](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0023-git-accounts-and-git-proxy.md) |
| Developer guide for the code | [`docs/development/git-accounts.md`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/development/git-accounts.md) in the control plane repository: the pieces, where each rule lives, running it locally with the e2e cluster, adding a provider type |
| REST API | Tag `git` in [`api/openapi/v1.yaml`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/api/openapi/v1.yaml) and the section in [`docs/api/README.md`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/api/README.md) |
| Operator runbook | [`docs/operations/git-proxy.md`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/operations/git-proxy.md) |
| Operator guide | [Git Accounts](/admins/platform/git-accounts) |
| Internal contract between the `git-proxy` and the service | [`internal/gitapi`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/internal/gitapi/gitapi.go). It is not part of the public API. |

## The parts in one paragraph

The landing page connects accounts through `/api/v1/git/...` and the redirect route `/git/callback`.
The service stores one encrypted Secret per user and provider and decides every Git request.
The agent in the session pod forwards `/git/<host>/...` from `127.0.0.1:8082` to the `git-proxy`, which adds the token and streams to the provider.
The `git-proxy` has no state and never decides alone.
Providers are the feature toggle: no provider in `config.gitAccounts.providers` means no feature.

## What a client has to know

- **Connect flow.** The Git host redirects the browser to `https://<hosts.service>/git/callback`, a route of the landing page. The page reads `code` and `state`, posts them to `POST /api/v1/git/callback` with its own bearer token, and goes to `returnTo`. No cookie is involved.
- **Preflight.** A client that starts a launch with a `gitUri` calls `POST /git/preflight` first. A failing call must never block the launch.
- **Template for a link without `appDef`.** `GET /templates` is enough: offer the templates with `listed: true` whose `injectableKeys` contain `GIT_URI`.
- **Approval link.** `https://<hosts.service>/?session=<name>&approveRepo=<url-encoded repository URL>&access=<read|write>`. The page calls `PUT /sessions/{name}/git/repositories` only after a click, and treats every parameter as untrusted.
- **Tokens the API accepts.** The API accepts bearer tokens whose `azp` is in `oidc.clientIDs`. The gateway client must stay out of that list and must be confidential, so that script in the IDE origin cannot get a token for the API. The reasoning is in ADR 0023, section "What keeps a bearer token away from the pod and the IDE origin", and the operator side is in [Git Accounts for administrators](/admins/platform/git-accounts#two-keycloak-clients).
- **IDE image.** The image must carry `eduide-session` 0.2.0 or later, which writes the Git `insteadOf` entries from `GET /v1/git/hosts`, and Scorpio 3.5.0 or later.

## The status contract for clients

`GET /api/v1/status` is public. With providers configured, it carries `gitProviders`:

```json
{"gitProviders": [{"name": "github", "type": "github", "host": "github.com", "displayName": "GitHub"}]}
```

The field is absent when no provider is configured.
The landing page draws its connect buttons from it before the login.
The browser extension reads it to show its button on every host the installation announces, and the agent serves the same hosts to the IDE at `GET /v1/git/hosts` on its local listener.
Clients must tolerate unknown fields. This is the only public Git field.

## Related

- [API Specification](./api-specification.md)
- [Session Lifecycle](./session-lifecycle.md)
- [EduIDE Control Plane](../projects/eduide-control-plane.md)
