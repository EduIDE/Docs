---
title: Audit and Compliance
description: What EduIDE logs, recommended retention policies, and the access review checklist.
---

# Audit and Compliance

This page describes what EduIDE logs across its components, how long to retain those logs, which operations are considered sensitive, and the recommended cadence for access reviews.

## What is logged

### EduIDE Cloud service

The service logs all inbound requests including:
- Request method, path, and response status
- The authenticated user identity (from the JWT `username` claim) where applicable
- Admin endpoint access, including whether the `X-Admin-Api-Token` was accepted or rejected
- Workspace and session lifecycle events (create, delete, stop)

Logs are emitted to stdout and collected by the Kubernetes log aggregation pipeline (Rancher / Prometheus stack).

### EduIDE Cloud operator

The operator logs every reconciliation action:
- Custom resource state transitions (Workspace, Session, AppDefinition)
- Pod creation and deletion for session workloads
- Errors during reconciliation
- Scaling changes applied to App Definitions

### OAuth2 proxy

The OAuth2 proxy logs every authentication event:
- Successful logins with the authenticated username
- Failed authentication attempts with the failure reason
- Token validation results
- Logout events

### Keycloak

Keycloak maintains its own audit event log. Relevant event types:
- `LOGIN` — successful user authentication
- `LOGIN_ERROR` — failed login attempt
- `LOGOUT` — user logout
- `TOKEN_EXCHANGE` — token operations
- `CLIENT_LOGIN` — service-to-Keycloak authentication
- Admin events: user creation, group membership changes, client configuration changes

Keycloak audit events are accessed via the Keycloak admin console under **Realm Settings → Events**.

### Workspace garbage collector

The garbage collector logs each workspace deletion it performs, including the workspace name and its creation timestamp. If a deletion fails, the error is logged with the workspace name.

## Sensitive operations inventory

The following operations should be treated as high-sensitivity events and reviewed if unusual patterns appear:

| Operation | Where logged | Sensitivity |
|---|---|---|
| Admin API token request (success) | Service logs | High — means the token is in use |
| Admin API token request (failure) | Service logs | High — may indicate brute force or stale token |
| App Definition scaling change | Service + operator logs | Medium — affects platform capacity |
| Workspace force-deletion by admin | Service/kubectl audit | Medium — user data deletion |
| Keycloak group membership change | Keycloak admin events | High — grants or removes elevated access |
| OAuth2 proxy cookie secret rotation | Deployment logs | Medium — invalidates all active sessions |
| New Keycloak client creation | Keycloak admin events | High — creates new authentication entry point |

## Log retention recommendations

| Log source | Recommended retention | Rationale |
|---|---|---|
| Service and operator logs (k8s) | 30 days | Sufficient for most incident investigations |
| OAuth2 proxy logs | 30 days | Covers typical authentication incident lookback |
| Keycloak event log | 90 days | Covers quarterly access reviews |
| Deployment workflow logs (GitHub) | 90 days | Covers audit of configuration changes |
| Garbage collector logs | 30 days | Low sensitivity, high volume |

Kubernetes default log retention depends on your cluster configuration. If you are using a centralised log aggregation system (e.g., Loki, Elasticsearch), set the retention policies there.

## Access review checklist

Run through this checklist on the indicated cadence.

### Monthly

- [ ] Review the `theia-cloud/admin` group membership in Keycloak. Remove any users who no longer require admin access.
- [ ] Check service logs for any unexplained spikes in admin API token requests (successful or failed).
- [ ] Verify that all running environments correspond to active deployments. Decommission any orphaned environment namespaces.

### Quarterly

- [ ] Review all Keycloak user accounts. Disable accounts for users who have left the organisation or completed their course.
- [ ] Review Keycloak client configurations. Remove stale redirect URIs for decommissioned environments.
- [ ] Review who has access to GitHub environment secrets for each deployment environment. Revoke access for anyone no longer actively deploying.
- [ ] Check GitHub Actions deployment logs for any unexpected deployments or configuration changes.

### Every 6 months

- [ ] Rotate the admin API token for all environments. See [Admin API Tokens](/admins/security/admin-api-tokens).
- [ ] Rotate the OAuth2 proxy cookie secret for all environments.
- [ ] Review and update alert thresholds in the monitoring chart to reflect current cohort sizes.

### On personnel changes

When a person with platform access leaves or changes role:

- [ ] Remove them from the `theia-cloud/admin` Keycloak group immediately.
- [ ] Revoke their access to GitHub environment secrets.
- [ ] Rotate the admin API token if they had access to it.
- [ ] Rotate the OAuth2 proxy cookie secret if they had access to it.
- [ ] Disable their Keycloak account.

Do not defer these steps. Credentials are not invalidated automatically when a person's role changes.

## Checking for failed admin token attempts

```bash
# Search service logs for rejected admin token requests
kubectl logs -n theia-prod -l app=service --since=24h \
  | grep -i "admin.*token\|401\|403"
```

A steady stream of 401 responses on `/service/admin/` endpoints without a matching successful deployment suggests either a misconfigured automation script or an attempted brute force. Rotate the token immediately if the source cannot be explained.
