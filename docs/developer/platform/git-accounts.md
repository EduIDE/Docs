---
title: Git Accounts
description: Where the design, the API and the developer guide of Git accounts and the git-proxy live.
---

# Git Accounts

Git accounts let a student connect GitHub or GitLab once and use private repositories in every session.
The token stays in the control plane. A separate `git-proxy` adds it to Git traffic.
This page points to the sources. It does not copy them.

:::info Not released yet
The feature is part of [EduIDE-control-plane pull request 33](https://github.com/EduIDE/EduIDE-control-plane/pull/33).
The links below point to `main`. They work once the pull request is merged. Until then, read them in the branch of the pull request.
:::

## Where to read

| What | Where |
|---|---|
| Design, credential rule, approvals, threat model, limits | [ADR 0023](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0023-git-accounts-and-git-proxy.md) |
| Developer guide for the code | [`docs/development/git-accounts.md`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/development/git-accounts.md) in the control plane repository (being written) |
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
