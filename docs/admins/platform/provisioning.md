---
title: Provisioning
description: Bootstrap guide for deploying a new EduIDE environment from cluster prerequisites to first launch.
---

# Provisioning

This page covers the steps required to bootstrap a new EduIDE environment. It is intended for operators setting up production, staging, or test deployments. The steps must be followed in order because later charts depend on resources installed by earlier ones.

## How deployments work

All EduIDE environments are deployed through GitHub Actions pipelines defined in the deployment repository. The pipelines run `helm upgrade --install` for each chart with the environment-specific values files. You do not run Helm commands manually in normal operation — you trigger or configure the pipeline.

The three deployment workflows are:

| Workflow | Trigger | Approval required |
|---|---|---|
| `deploy-production.yml` | Manual dispatch | Yes |
| `deploy-staging.yml` | Push to main | No |
| `deploy-pr.yml` | PR push | Yes |

For emergency manual intervention (e.g., when a pipeline is unavailable), the underlying Helm commands are documented in the steps below.

## Prerequisites

Before a first deployment to a new cluster, confirm the following are in place:

- A Kubernetes cluster is available and reachable via `kubectl`
- Helm 3 is installed on the runner (handled automatically in CI)
- You have cluster-admin permissions
- **`cert-manager`** is installed on the cluster — manages TLS certificates via the `cert-manager.io` CRDs
- **`trust-manager`** is installed on the cluster — distributes the internal CA trust bundle to target namespaces via the `trust.cert-manager.io` CRDs (required by `theia-internal-tls`)
- A Keycloak instance is running and you have admin access to the relevant realm
- DNS entries for the environment domain are configured and propagating
- GitHub environment secrets are set (see [GitHub environment secrets](#github-environment-secrets))

### Installing cert-manager and trust-manager

These are cluster-level prerequisites installed once. If they are already present, skip this.

```bash
# cert-manager (check https://cert-manager.io for the latest version)
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true

# trust-manager (part of the cert-manager project)
helm upgrade --install trust-manager jetstack/trust-manager \
  --namespace cert-manager
```

Verify both are running:
```bash
kubectl get pods -n cert-manager
```

## Helm chart overview

EduIDE is deployed through a set of layered Helm charts. Cluster-scoped charts are installed once and shared across all environments. Environment-scoped charts are deployed independently per environment.

| Chart | Scope | Purpose |
|---|---|---|
| `theia-cloud-crds` | Cluster | Custom resource definitions for workspaces, sessions, app definitions |
| `theia-cloud-base` | Cluster | Cluster-wide shared resources |
| `theia-shared-gateway` | Cluster | Shared Envoy Gateway API entry point |
| `theia-internal-tls` | Cluster | Internal CA and trust bundle (requires trust-manager) |
| `theia-cloud-combined` | Environment | Main application: service, operator, landing page, OAuth2 proxy |
| `theia-appdefinitions` | Environment | IDE session type definitions |
| `theia-certificates` | Environment | TLS certificate management for the environment domain |
| `theia-monitoring` | Environment | Prometheus ServiceMonitors and Grafana dashboards |

## Step 1: Install cluster-scoped charts

These are installed once per cluster. The pipeline handles this via the `deploy_shared_gateway` input flag and the internal TLS step. If setting up a brand new cluster manually:

```bash
# CRDs first — operator and service depend on these
helm upgrade --install theia-cloud-crds ./charts/theia-cloud-crds

# Cluster base resources
helm upgrade --install theia-cloud-base ./charts/theia-cloud-base

# Shared Envoy Gateway (namespace: gateway-system)
helm upgrade --install theia-shared-gateway ./charts/theia-shared-gateway \
  -n gateway-system --create-namespace \
  -f <shared-gateway-values-file>

# Internal TLS CA and trust bundle (namespace: cert-manager)
helm upgrade --install theia-internal-tls ./charts/theia-internal-tls \
  -n cert-manager
```

## Step 2: Prepare Keycloak

Before running the first environment deployment, the Keycloak client must be configured. See [Access Control](/admins/platform/access-control) for the full procedure.

At minimum, you need:

- A Keycloak client with the correct redirect URIs for the target environment domain
- A dedicated client scope with username, audience, and groups mappers
- Users who need admin access added to the `theia-cloud/admin` Keycloak group
- The client ID and cookie secret ready for the GitHub environment secrets

## GitHub environment secrets

The deployment pipeline reads credentials from GitHub environment secrets. Set the following in the GitHub environment before triggering a deployment:

| Secret | Description |
|---|---|
| `KUBECONFIG` | Kubernetes cluster configuration for the target cluster |
| `THEIA_ADMIN_API_TOKEN` | Token protecting the admin scaling endpoints. Must be a strong random string |
| `THEIA_KEYCLOAK_REALM` | Keycloak realm name, e.g. `tum` |
| `THEIA_KEYCLOAK_CLIENT_ID` | Client ID configured in Keycloak |
| `THEIA_KEYCLOAK_CLIENT_SECRET` | Keycloak client secret |
| `THEIA_KEYCLOAK_COOKIE_SECRET` | Base64-encoded 32-byte key for OAuth2 proxy cookie encryption |
| `THEIA_WILDCARD_CERTIFICATE_CERT` | Wildcard TLS certificate (base64 encoded) |
| `THEIA_WILDCARD_CERTIFICATE_KEY` | Wildcard TLS certificate key (base64 encoded) |

Generate the cookie secret:
```bash
openssl rand -base64 32
```

GitHub environment variables (not secrets) also required:

| Variable | Example |
|---|---|
| `NAMESPACE` | `theia-prod` |
| `HELM_VALUES_PATH` | `deployments/theia.artemis.cit.tum.de` |

## Step 3: Configure the environment values

Each environment has its own `values.yaml` in the deployment repository under `deployments/<domain>/`. The key sections to review before a first deployment:

**Hosts:**
```yaml
hosts:
  configuration:
    baseHost: artemis.cit.tum.de
    service: service.theia
    landing: theia
    instance: instance.theia
```

**Operator:**
```yaml
theia-cloud:
  operator:
    replicas: 3
    sessionsPerUser: 10
    storageClassName: csi-rbd-sc
    requestedStorage: 250Mi
    eagerStart: false
```

`sessionsPerUser` sets the hard upper limit on concurrent active sessions per user. Set `eagerStart: true` only if you intend to use session pre-warming.

**Landing page:**
```yaml
  landingPage:
    appDefinition: java-17-latest
    ephemeralStorage: true
    additionalApps:
      java-17-latest: { label: Java 17 }
      python-latest: { label: Python }
```

`additionalApps` controls which IDE session types appear in the UI. Only include app definitions that are also deployed in `theia-appdefinitions`.

## Step 4: Trigger the deployment pipeline

Once secrets, variables, and values files are in place, trigger the deployment:

- **Production:** Go to Actions → `deploy-production.yml` → Run workflow. Requires manual approval.
- **Staging:** Push to the main branch. The pipeline runs automatically.
- **Test/PR:** Open or push to a PR. Requires approval to run.

The pipeline runs all chart installs in sequence, injects secrets, and waits for the rollout to complete before returning success.

## Step 5: Validate the installation

After the pipeline completes successfully:

- [ ] All pods in the environment namespace are `Running` or `Completed`: `kubectl get pods -n theia-prod`
- [ ] Landing page is reachable at the environment domain
- [ ] Keycloak login redirect works correctly
- [ ] A test session can be launched and connects to the IDE
- [ ] Admin ping responds: `GET /service/admin/{appId}` with `X-Admin-Api-Token`
- [ ] Grafana dashboards show the environment namespace in scope

## Required secrets summary

| Secret (k8s) | Content | Created by |
|---|---|---|
| `service-admin-api-token` | `ADMIN_API_TOKEN` | Deployment pipeline |
| Keycloak client secret | OAuth2 proxy client credential | Deployment pipeline |
| OAuth2 proxy cookie secret | Cookie encryption key | Deployment pipeline |
| Wildcard TLS secret | Certificate and key | Deployment pipeline |
| Redis password (shared cache) | Redis auth credential | Helm chart (auto-generated) |
