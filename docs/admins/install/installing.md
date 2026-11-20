---
title: Installing EduIDE
description: Installing the CRDs once per cluster and the platform once per deployment, with the OIDC clients and the first checks.
---

# Installing EduIDE

Install order: the CRDs once per cluster, then the installation chart once per deployment.
A deployment is one namespace. Read [Prerequisites](prerequisites.md) and [Hostnames and Certificates](certificates.md) first.

:::info Chart reference
This page is the only place that names the charts. All other pages use these variables. The installation chart and the cluster chart share one version.

```bash
export EDUIDE_CHART=oci://ghcr.io/eduide/charts/eduide
export EDUIDE_VERSION=3.0.0
export EDUIDE_CLUSTER_CHART=oci://ghcr.io/eduide/charts/eduide-cluster
export EDUIDE_CRDS_CHART=oci://ghcr.io/eduide/eduide-control-plane/charts/eduide-control-plane-crds
export EDUIDE_CRDS_VERSION=0.2.0
```

Pass a prerelease such as `3.0.0-rc.9` explicitly in `EDUIDE_VERSION`, because `helm` skips prereleases otherwise.
:::

## 1. Cluster chart (once per cluster)

The cluster chart goes first. It carries the control plane CRDs, a cluster identity ConfigMap and, optionally, the Envoy Gateway `GatewayClass` and `EnvoyProxy` (with `mergeGateways: true`, so all deployments share one data plane).
Helm does not upgrade CRDs from a chart's `crds/` directory, so the chart ships them as templates. Changes are additive.

```bash
helm upgrade --install eduide-cluster $EDUIDE_CLUSTER_CHART \
  --version $EDUIDE_VERSION --namespace eduide-system --create-namespace
```

:::warning Cluster with a 2.x installation
Do not install or upgrade the cluster chart on a cluster that still runs a 2.x (Theia Cloud) installation. Version 3 no longer ships the Theia CRDs, so Helm would delete them and with them every 2.x session and workspace.
The chart looks up the CRD `appdefinitions.theia.cloud` and refuses while it exists, unless you set `allowRemovingTheiaCloud=true`. Set that only when the 2.x installation is gone or should be destroyed.
To run 3.0 next to 2.x during a [migration](../maintenance/upgrades.md#migrating-from-2x), install only the CRDs and leave the 2.x release alone:

```bash
helm upgrade --install eduide-crds $EDUIDE_CRDS_CHART --version $EDUIDE_CRDS_VERSION
```

Or use a separate cluster.
:::

## 2. Namespace and gateway secret

```bash
kubectl create namespace eduide-<deployment>
```

Create the Keycloak clients first ([below](#keycloak)). Then store the secret of the gateway client in the namespace.
Create it from a file or a pipe. Never print it and never put it in a values file in Git.

```bash
kubectl -n eduide-<deployment> create secret generic eduide-oidc \
  --from-file=client-secret=<path-to-file>
```

## 3. Values

Hosts, gateway and OIDC settings appear in the control plane block and the landing page block. State them once with YAML anchors; the chart checks that both blocks agree.
This example is based on a real test deployment. Hosts and credentials are replaced.

```yaml
x-hosts: &hosts
  service: eduide.example.org
  instance: instance.eduide.example.org
  webview: webview.instance.eduide.example.org

x-gateway: &gateway
  name: eduide
  namespace: eduide-<deployment>
  sectionName: ""
  port: 443          # only the HTTPS listeners carry routes

gateway:
  create: true
  className: envoy

certManager:
  issuerRef: {name: letsencrypt, kind: ClusterIssuer}

images:
  registry: ghcr.io/eduide
  tag: 3.0.0

templates:
  java-17-standalone:
    pool: {minIdle: 1, maxInstances: 5}
  python-standalone: {}

eduide-control-plane:
  poolScaler: {enabled: true, mode: active}
  config:
    deployment: course-a
    hosts: *hosts
    gateway: *gateway
    oidc:
      issuerURL: https://keycloak.example.org/realms/eduide
      clientIDs: [eduide]
      gatewayClientID: eduide-gateway
      admin: {rolePath: resource_access.eduide.roles, role: eduide-admin}
    admin:
      prometheusURL: http://prometheus-operated.monitoring:9090
    allowedHosts: [github.com, gitlab.com, artemis.example.org]
    workspaces: {storageClassName: standard}
    telemetry: {otlpEndpoint: jaeger-collector.eduide-<deployment>:4317}
  monitoring:
    podMonitor: {enabled: true}
    rules: {enabled: true}
    dashboard: {enabled: true}
  oidc:
    clientSecretName: eduide-oidc

eduide-landing-page:
  host: eduide.example.org
  gateway: *gateway
  legal:
    imprint: {url: https://example.org/imprint}
    privacy: {url: https://example.org/privacy}
  config:
    title: EduIDE
    keycloak:
      url: https://keycloak.example.org/
      realm: eduide
      clientId: eduide
```

The installation chart lists every value with its default in its `values.yaml`. The most important ones:

| Value | Meaning |
|---|---|
| `eduide-control-plane.config.deployment` | Short name of the deployment, used in metrics and traces. |
| `...config.hosts.*`, `...config.gateway.*` | The three hostnames and the Gateway all routes attach to. |
| `...config.oidc.issuerURL`, `clientIDs`, `gatewayClientID` | The realm, the clients whose tokens the service accepts, and the confidential gateway client. |
| `...config.allowedHosts` | Git and Artemis hosts users may pass in. See [Templates and Pools](../platform/templates-and-pools.md). |
| `...config.sessionsPerUser` | Parallel sessions per user (default 3). |
| `...config.workspaces.*` | Storage class, size, retention, grace and the workspace limit per user. See [Storage and Workspaces](../platform/storage-and-workspaces.md). |
| `...config.placement.*` | Node selector, node pool label, tolerations, image prepull. |
| `...config.capacity.exhaustedAfter` | How long a session waits for room before it fails (default 45 s). |
| `...config.telemetry.otlpEndpoint` | OTLP endpoint for traces. |
| `...config.rateLimit.launchesPerMinute` | Launch rate per user (default 10). |
| `templates` | The templates this deployment offers. |

Image prepull on every IDE node (`placement.prepull.enabled`) matters: a cold start without it can wait for image pulls for a long time.

## 4. Install

```bash
helm upgrade --install eduide $EDUIDE_CHART --version $EDUIDE_VERSION \
  --namespace eduide-<deployment> -f values.yaml
```

The chart installs the operator, the service (2 replicas), authz (2 replicas), the landing page, PodDisruptionBudgets, RBAC, the Gateway, the SecurityPolicy, the NetworkPolicies, the `/oauth2/` route and the configuration.
Unknown keys in the control plane configuration make the binaries fail on start, so a typo shows up at once.

### Keycloak

Create two clients in the realm of the deployment.

| Client | Type | Settings |
|---|---|---|
| Landing page, for example `eduide` | public, standard flow | Valid redirect URI `https://<service host>/*`, web origin `https://<service host>`. Its id goes into `oidc.clientIDs` and the landing page `keycloak.clientId`. |
| Gateway, for example `eduide-gateway` | confidential | Valid redirect URI `https://<instance host>/oauth2/callback`. Its id is `oidc.gatewayClientID` and the audience `authz` checks. |

The tokens must carry the claim named in `oidc.userClaim` (default `preferred_username`), plus `name` and `email`.
Some identity providers speak only TLS curves that Envoy does not offer for upstream TLS.
The chart has an optional TLS bridge for that case (`oidcBridge.enabled` and `oidc.providerBackendRefs`); check its `values.yaml`.

### HSTS

The service and the landing page send `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
If the instance and webview hosts are not subdomains of the service host, set `config.security.hstsIncludeSubdomains: false` for the service and `hstsIncludeSubdomains: false` in the landing page config.

### Salt for pseudonymous ids

The chart generates a salt once and keeps it on `helm upgrade`. Traces, logs and the admin API show users as an HMAC with this salt.
authz also derives the key of its session cookie from it. Treat it as an authentication secret.
A renderer without cluster access (`helm template`, Argo CD) cannot look the Secret up and renders a new salt every time.
Then create the Secret yourself (key `salt`) and set `userSalt.secretName`.

## Verify

```bash
kubectl -n eduide-<deployment> get pods
kubectl -n eduide-<deployment> get idetemplate,idepool
kubectl -n eduide-<deployment> get networkpolicy
```

- Operator, service and authz pods are `Ready`.
- Each pool shows `idleReady` equal to `minIdle` after a minute.
- Open `https://<service host>/`, sign in, start a session, and check `kubectl -n eduide-<deployment> get idesession`.
- An unauthenticated request to `https://<instance host>/anything/` redirects to the login and never returns IDE content.
- NetworkPolicy smoke test: start a foreign pod in the namespace and confirm it cannot reach an IDE pod on port 8080 or 8081. From a terminal in a session, confirm that the node address on port 10250, the API server and a pod of another namespace do not answer.
  If they answer, the CNI does not enforce policies. Do not release the deployment.

:::note Artemis links
Artemis passes the token and the repository URL in the URL fragment. This needs Artemis pull request [ls1intum/Artemis#14702](https://github.com/ls1intum/Artemis/pull/14702), which is not yet merged upstream.
For templates that Artemis opens, set `templateDefaults.gitUriAllowCredentials: true`, so the repository URL may carry the student's token.
:::
