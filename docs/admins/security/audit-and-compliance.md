---
title: Audit and Compliance
description: What EduIDE logs and traces, how users are pseudonymized, how long data is kept, and a review checklist.
---

# Audit and Compliance

EduIDE collects as little personal data as it can. This page lists what exists, where, and for how long. Your data protection office decides the rest.

## Pseudonymous ids

Logs, traces and the admin API show a user as a pseudonym: an HMAC-SHA256 of the owner name with the salt of the deployment, 16 hex characters in logs.
No name, e-mail address, token or cookie appears in logs, traces, metrics or status objects.
Without the salt nobody can map a pseudonym back to a name. Keep the salt (`userSalt.secretName`) as secret as a password. With the salt and a list of names, you can compute the pseudonym of a user to follow a trace for support.

## What is stored where

| Data | Where | Kept |
|---|---|---|
| Owner name on sessions and workspaces | Object spec in Kubernetes | While the object exists. Sessions go when they end, workspaces after their retention |
| Workspace files | PVC (saved workspaces) | Retention after last use, default 14 days, plus 24 hours grace |
| Files of temporary workspaces | Pod filesystem | Until the session ends |
| Launch data (repository URL, token) | Secret owned by the session | Deleted with the session. Memory only in the agent |
| Logs | stdout of the components | Whatever your log stack keeps. Set it |
| Metrics | Prometheus | Your Prometheus retention. No user labels |
| Traces | Jaeger or your OTLP target | Your target retention |
| Events | Kubernetes | About one hour |
| Identity provider | Keycloak | Your realm policy |

## Trace contents

Spans carry the session name, template, persistence, start strategy, pool, node pool, instance id, error code and the pseudonymous `eduide.user_id`.
They do not carry names, e-mail addresses, tokens, repository URLs or launch data values. The control plane runs a test that searches logs and spans for a planted token.
Jaeger is not public. Give access only to operators.

## Recommended retention

| Data | Suggestion |
|---|---|
| Logs | 30 to 90 days |
| Traces | 7 to 14 days |
| Metrics | 13 months for trends |
| Workspaces | The default 14 days, shorter or longer per template, announced to users |

## Review checklist

Every quarter:

1. Who has the admin role? Who has Kubernetes access to the namespace?
2. Who can read Jaeger, Grafana and the logs?
3. Is `config.allowedHosts` still exact?
4. Do the NetworkPolicies still hold? Repeat the smoke test.
5. Are the imprint and privacy links of the landing page current?
6. Is the retention in line with what you tell users?

## Questions from users

- Delete my data: delete the user's workspaces (`kubectl delete ideworkspace`) and sessions. The identity provider holds the account.
- What do you know about me: the owner name on objects, and pseudonymous ids in logs and traces for the retention of those systems.
