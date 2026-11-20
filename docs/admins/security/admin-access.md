---
title: Admin Access
description: The read-only admin API and admin panel, protected by a Keycloak role, and the public status page.
---

# Admin Access

EduIDE 3.0 has no admin token. Admin access is a role in the identity provider, and everything it opens is read-only.
Changes go through Helm values or `kubectl`, so they have an owner and an audit trail in your cluster.

## What the role opens

| Endpoint | Content |
|---|---|
| `GET /api/v1/admin/status` | Overall status and warnings (`pool-empty`, `capacity-pressure`, `scaler-silent`) |
| `GET /api/v1/admin/pools`, `/sessions`, `/workspaces`, `/templates` | Lists, ordered by name, paged with `cursor` and `limit` |
| `GET /api/v1/admin/problems` | Failed sessions of the last hour, grouped by error code |
| `GET /api/v1/admin/config` | The effective configuration, without secrets |

The landing page shows these in the admin panel. Only `GET` exists under `/admin`.
Owners appear only as a salted hash (the same value as the user id in logs and traces). The user name in a title is replaced by `***`. Launch data appears only as key names.
Each admin user may send 60 requests per minute (`admin.rateLimitPerMinute`).

## Turn it on

1. Create the role and assign it, see [Access Control](../platform/access-control.md#admin-role).
2. Set `oidc.admin.rolePath` and `oidc.admin.role` in the values.
3. Optional: `admin.prometheusURL` for figures and time series (plain `http` or `https`, no credentials) and `admin.links` for Grafana and Jaeger.

Without `oidc.admin` every admin route answers 404. With it, users without the role get 403.
The admin API also needs the user salt (`telemetry.userSaltFile`, which the chart sets).

## Rotation and review

- Grant the role to a Keycloak group, not to individuals, and review the group every quarter.
- The salt rotates by replacing the Secret named in `userSalt.secretName`. Owner hashes then change, and every authz session cookie becomes invalid, so users sign in again.
- A leaked admin access token is limited to read-only data and expires with the Keycloak token lifetime. Shorten the lifetime for the landing page client if you need to.

## Public status

`GET /api/v1/status` needs no login and is rate limited per client address. It shows `ok`, `slow` or `down` for sign-in, starting and workspaces, and per template a start estimate and whether it is warm.
It contains no user, session, host or node data. The control plane tests the fields against an allowlist ([ADR 0021](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0021-admin-api-and-public-status.md)).

## Cluster access

The role does not give cluster access. Cluster admins can read Secrets and instance tokens, so keep the group small. Use `kubectl auth can-i` with the service account to check the RBAC of the components, not with `--as operator`.
