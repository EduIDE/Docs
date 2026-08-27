---
title: Admin API Tokens
description: How the admin API token protects scaling endpoints, how to issue and rotate it, and how to authenticate requests.
---

# Admin API Tokens

The EduIDE service exposes a set of scaling endpoints that allow changing App Definition instance counts at runtime. These endpoints are not protected by Keycloak group membership - they use a dedicated static token passed via a request header. This page explains how the token works, how it is provisioned, and how to rotate it.

:::note Placeholders on this page

Each EduIDE installation lives in its own namespace, named `eduide-<name>` by convention (`eduide-staging`, `eduide-cs101`, and so on). Commands use `-n <namespace>` - substitute your installation's namespace. `eduide` is the conventional Helm release name for an installation, and `<service-host>` stands for the DNS name you configured for the REST service.

:::

## Why a separate token

The admin API token exists because the scaling endpoints are designed to be called by automation (deployment pipelines, scripts, cron jobs) rather than by human users logged in through a browser. OAuth flows are not well-suited to machine-to-machine calls. A static bearer token is simpler to use in that context.

The trade-off is that token compromise grants direct access to the scaling endpoints. This is why token rotation and secure storage matter.

## What the token protects

The following endpoints require a valid `X-Admin-Api-Token` header:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/service/admin/appdefinition` | List all App Definitions with their current scaling |
| `GET` | `/service/admin/appdefinition/{name}` | Get scaling config for a specific App Definition |
| `PATCH` | `/service/admin/appdefinition/{name}` | Update `minInstances` or `maxInstances` |

The Keycloak-protected admin ping endpoint (`GET /service/admin/{appId}`) is a **different** mechanism. It requires a valid OAuth token carrying the admin group claim, and the admin API token has no effect on it. The two live under the same `/service/admin` path prefix but are guarded by different filters.

## Is the admin API even enabled?

By default it is not, and this is a deliberate choice rather than an oversight.

The relevant values in the `eduide` chart:

```yaml
service:
  adminApiTokenSecret:
    # Have the chart create the Secret from `adminApiToken` below.
    create: false
    # Set true if you created the Secret yourself, outside the chart.
    external: false
    name: service-admin-api-token
    key: ADMIN_API_TOKEN
  # Base64-encoded admin API token. Only read when adminApiTokenSecret.create is true.
  adminApiToken: ""
```

With both `create` and `external` left at `false`, the service is deployed **without** the `ADMIN_API_TOKEN` environment variable at all, and the scaling endpoints are effectively closed. That is a valid way to run an installation: if you never call the scaling API, not issuing a token is the safest configuration.

You must therefore choose one of the two provisioning paths below before the admin API works.

## Provisioning: path A, let the chart create the Secret

Use this when your installation values file is itself managed as a secret (a sealed values file, a CI secret store, a vault-rendered file).

**Step 1: Generate the token and its base64 encoding**

The value you put in `service.adminApiToken` goes into the Secret's `data:` field, which Kubernetes requires to be **base64-encoded**. The chart passes the value straight through without encoding it for you.

```bash
# The token itself - this is what callers send in the header
TOKEN=$(openssl rand -hex 32)
echo "$TOKEN"

# The value to put in service.adminApiToken
printf '%s' "$TOKEN" | base64 | tr -d '\n'
```

Two details that cause real failures:

- **`openssl rand -hex 32` produces hex, not base64.** Pasting its output directly into `service.adminApiToken` produces a Secret whose decoded content is binary garbage, and every request is then rejected as an invalid token with no clue as to why. The value must be base64 of the token, which is what the second command produces.
- **`tr -d '\n'` is not optional.** A 64-character token base64-encodes to 88 characters, and GNU `base64` wraps its output at 76 columns. The embedded newline is preserved through Helm's quoting and corrupts the token.

**Step 2: Set the values**

```yaml
service:
  adminApiTokenSecret:
    create: true
  adminApiToken: "<base64-of-your-token>"
```

**Step 3: Apply**

```bash
helm upgrade --install eduide oci://ghcr.io/eduide/charts/eduide \
  --version <chart-version> \
  -n <namespace> \
  -f <your-values>.yaml
```

If `create: true` and `adminApiToken` is empty, the render fails with an explicit message rather than producing a broken Secret.

## Provisioning: path B, bring your own Secret

This is the better path for a hand-installed cluster, because the token never has to appear in a values file at all. Create the Secret with `kubectl` and point the chart at it.

**Step 1: Create the Secret**

```bash
TOKEN=$(openssl rand -hex 32)

kubectl create secret generic service-admin-api-token \
  -n <namespace> \
  --from-literal=ADMIN_API_TOKEN="$TOKEN"

echo "Store this token in your secret manager: $TOKEN"
```

Note the contrast with path A: `kubectl create secret --from-literal` base64-encodes the value **for** you. Do not pre-encode here, or you will end up with a doubly-encoded token.

**Step 2: Tell the chart the Secret exists**

```yaml
service:
  adminApiTokenSecret:
    create: false
    external: true
    name: service-admin-api-token
    key: ADMIN_API_TOKEN
```

`external: true` is what makes the chart mount the environment variable from a Secret it does not own. Leaving it at `false` while the Secret exists means the service is still deployed without the variable, and the admin API stays closed - a confusing state, because the Secret is right there in the namespace.

**Step 3: Apply**

```bash
helm upgrade --install eduide oci://ghcr.io/eduide/charts/eduide \
  --version <chart-version> \
  -n <namespace> \
  -f <your-values>.yaml
```

If you change the Secret's contents later, the service does not notice on its own. See [Rotating the token](#rotating-the-token).

## How the service reads it

- **Container env var:** `ADMIN_API_TOKEN`, mounted via `secretKeyRef` from the Secret named in `service.adminApiTokenSecret.name`, key `service.adminApiTokenSecret.key`
- **Service property:** `theia.cloud.admin.api.token`

The value is read at startup. It is not re-read while the service is running.

## Authenticating requests

All requests to token-protected endpoints must include the header:

```
X-Admin-Api-Token: <token>
```

Example:

```bash
export ADMIN_API_TOKEN="<your-token-value>"

curl -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  https://<service-host>/service/admin/appdefinition
```

The header carries the **raw** token, not its base64 encoding. The base64 step exists only because Kubernetes Secrets store data that way.

Never pass the token as a query parameter or in a URL. It will appear in server access logs.

## Response codes

Knowing which code you got narrows the problem considerably:

| Response | Meaning |
|---|---|
| `401 Unauthorized` - "Admin API token required in X-Admin-Api-Token header." | No header was sent. The token itself may be fine. |
| `403 Forbidden` - "Valid admin API token required." | A header was sent but does not match the configured token. |
| `403 Forbidden` - "Admin API token authentication is not configured." | **No token is configured on the service at all.** Every request gets this, with or without a header. Go back to the provisioning section. |

That third case is the one to watch for: it is a `403`, which reads like a rejected credential, but the cause is on the server side and no token you send will ever work. The service also logs a warning each time it happens, so the service log distinguishes the two `403`s clearly:

```bash
kubectl logs -n <namespace> -l app=service --tail=100 | grep -i "admin API token"
```

## Verifying the configuration

Confirm the Secret exists and holds a plausible value:

```bash
kubectl get secret service-admin-api-token -n <namespace> \
  -o jsonpath='{.data.ADMIN_API_TOKEN}' | base64 --decode | wc -c
```

A count of 64 matches a token from `openssl rand -hex 32`. A count of zero, or a wildly different number, means the encoding went wrong somewhere.

Confirm the service actually received it:

```bash
kubectl get deployment service-deployment -n <namespace> \
  -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}{"\n"}{end}' \
  | grep ADMIN_API_TOKEN
```

No output means the env var was not mounted, which means neither `create` nor `external` is `true`. This is worth checking explicitly after every upgrade, because the failure is a `403` rather than a crash - the service starts and serves everything else normally.

Finally, an end-to-end check:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  https://<service-host>/service/admin/appdefinition
```

`200` confirms the whole chain.

## Rotating the token

Rotation requires a service restart, because the token is read at startup from the mounted Secret.

**If the chart owns the Secret (path A):**

1. Generate a new token and its base64 encoding, as in path A step 1.
2. Update `service.adminApiToken` in your values file.
3. Run `helm upgrade` on the installation.
4. Restart the service if the upgrade did not roll the pods:
   ```bash
   kubectl rollout restart deployment/service-deployment -n <namespace>
   kubectl rollout status deployment/service-deployment -n <namespace>
   ```
5. Update any automation that uses the old token.

**If you own the Secret (path B):**

1. Generate a new token.
2. Replace the Secret:
   ```bash
   kubectl create secret generic service-admin-api-token \
     -n <namespace> \
     --from-literal=ADMIN_API_TOKEN="$NEW_TOKEN" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
3. Restart the service - this step is mandatory here, since nothing in the Helm release changed and no rollout is triggered on its own:
   ```bash
   kubectl rollout restart deployment/service-deployment -n <namespace>
   kubectl rollout status deployment/service-deployment -n <namespace>
   ```
4. Update any automation that uses the old token.

The Deployment is named `service-deployment`. `kubectl rollout restart deployment/service` fails with `not found` - `service` is the pod label, not the Deployment name.

There is no grace period. Once the new pod is serving, the old token is immediately invalid, and there is a brief window during the rollout where both old and new pods are running and either token may be accepted depending on which pod answers.

## Token scope

Each installation has its own independent admin API token, because each installation has its own Secret in its own namespace. A production installation's token should not be reused for staging or test installations. This limits the impact of a leak to one installation.

If you run several installations from one automation account, store the tokens separately rather than sharing one across namespaces. Sharing removes the only isolation this design gives you.

## Rotation schedule

Rotate the admin API token:

- Every 6 months as routine hygiene
- Immediately if you suspect the token has been exposed (logs, error reports, a screen share)
- After any off-boarding of a person or system that had access to it
