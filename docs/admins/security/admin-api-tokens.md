---
title: Admin API Tokens
description: How the admin API token protects scaling endpoints, how to issue and rotate it, and how to authenticate requests.
---

# Admin API Tokens

The EduIDE service exposes a set of scaling endpoints that allow changing App Definition instance counts at runtime. These endpoints are not protected by Keycloak group membership — they use a dedicated static token passed via a request header. This page explains how the token works, how it is provisioned, and how to rotate it.

## Why a separate token

The admin API token exists because the scaling endpoints are designed to be called by automation (deployment workflows, scripts, CI pipelines) rather than by human users logged in through a browser. OAuth flows are not well-suited to machine-to-machine calls. A static bearer token is simpler to use in that context.

The trade-off is that token compromise grants direct access to the scaling endpoints. This is why token rotation and secure storage matter.

## What the token protects

The following endpoints require a valid `X-Admin-Api-Token` header:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/service/admin/appdefinition` | List all App Definitions with their current scaling |
| `GET` | `/service/admin/appdefinition/{name}` | Get scaling config for a specific App Definition |
| `PATCH` | `/service/admin/appdefinition/{name}` | Update `minInstances` or `maxInstances` |

Requests without the header receive `401 Unauthorized`. Requests with a wrong token receive `403 Forbidden`.

The Keycloak-protected admin endpoints (`/service/admin/{appId}` ping endpoint, annotated with `@AdminOnly`) are separate from these and require a valid OAuth token with the admin group claim instead.

## Token provisioning

The token is injected into the service as a Kubernetes secret. The deployment workflow creates the secret from the GitHub environment secret `THEIA_ADMIN_API_TOKEN`.

The service reads it via:
- **Service property:** `theia.cloud.admin.api.token`
- **Container env var:** `ADMIN_API_TOKEN`
- **Secret reference in values:**
  ```yaml
  service:
    adminApiTokenSecret:
      name: service-admin-api-token
      key: ADMIN_API_TOKEN
  ```

## Generating a token

Use a cryptographically random value of at least 32 bytes:

```bash
openssl rand -hex 32
```

Store the output in the GitHub environment secret `THEIA_ADMIN_API_TOKEN` before running a deployment.

## Authenticating requests

All requests to token-protected endpoints must include the header:

```
X-Admin-Api-Token: <token>
```

Example:

```bash
export ADMIN_API_TOKEN="your-token-value"

curl -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  https://service.theia.artemis.cit.tum.de/service/admin/appdefinition
```

Never pass the token as a query parameter or in a URL. It will appear in server access logs.

## Rotating the token

Token rotation requires a redeployment because the service reads the token at startup from the mounted secret.

1. Generate a new token: `openssl rand -hex 32`
2. Update the GitHub environment secret `THEIA_ADMIN_API_TOKEN` with the new value.
3. Trigger a deployment for the target environment. The deployment workflow recreates the Kubernetes secret and redeploys the service.
4. Update any automation or scripts that use the old token.

There is no grace period — after the redeployment, the old token is immediately invalid.

## Token scope

Each environment (production, staging, test) has its own independent admin API token. The token for production should not be shared with staging or test environments. This limits the impact of a token leak to one environment.

## What happens if the token is not configured

If `ADMIN_API_TOKEN` is empty or the secret is absent, the service starts but the admin API token check behaviour changes:

- The `AppDefinitionAdminApiTokenFilter` returns an empty string for the configured token.
- Any request with any non-empty `X-Admin-Api-Token` header will be rejected as invalid.
- In effect, the scaling endpoints become inaccessible via this mechanism.

Verify the token is correctly configured after any deployment:

```bash
kubectl get secret service-admin-api-token -n theia-prod \
  -o jsonpath='{.data.ADMIN_API_TOKEN}' | base64 --decode | wc -c
```

A non-zero character count confirms the secret is present.

## Rotation schedule

Rotate the admin API token:

- Every 6 months as routine hygiene
- Immediately if you suspect the token has been exposed (logs, error reports, rotation of a developer who had access)
- After any off-boarding of a person or system that had access to it
