---
title: Session Hardening
description: What keeps sessions apart from each other and from the cluster, which values control it, and what it does not cover.
---

# Session Hardening

A session pod runs code that a student, or a link a student clicked, put there.
From chart 2.5.1 the platform treats it that way by default. This page lists
each control, the value that turns it, and what to check after a change.

:::note Placeholders on this page
`<namespace>` is your installation's namespace, `eduide` its Helm release name.
:::

## At a glance

| Control | Where | Default | Since |
|---|---|---|---|
| IDE reachable only through oauth2-proxy | IDE images | on | first EduIDE release after 1.4.0 |
| Session NetworkPolicies | `networkPolicies.*` | on | chart 2.5.1 |
| Env injection allowlist | `operator.allowedEnvFromSecrets`, `allowedEnvFromConfigMaps`, `allowCustomEnvFromMap` | Secrets and ConfigMaps denied | chart 2.5.1, EduIDE-Cloud 1.2.1 |
| Pod securityContext | operator | on | EduIDE-Cloud 1.2.1 |
| Workspace ownership check | REST service | on | EduIDE-Cloud 1.2.1 |
| Namespace-scoped operator RBAC | `operator.clusterWideRbac` | namespaced | chart 2.5.1 |
| Secrets out of ConfigMaps | `service-config-secret` | always | chart 2.5.1 |
| Unique cookie secret, HTTPS-only cookie | `keycloak.cookieSecret`, `oauth2Proxy.cookieSecure` | required, `true` | chart 2.5.1 |
| Landing page hardening | `landingPage.*` | on | chart 2.5.1, landing page 1.3.0 |

## The IDE only listens on loopback

The Theia server inside a session has no authentication of its own. Anyone who
reaches its port gets the files, a terminal and task execution. The IDE images
therefore bind it to `127.0.0.1:3000`. Only the oauth2-proxy sidecar in the same
pod reaches it; the gateway reaches the proxy on port 5000, which forces the
Keycloak login.

Installations without oauth2-proxy (`keycloak.allowUnauthenticated: true`) keep
working: from EduIDE-Cloud 1.2.1 the operator's template for that case binds
Theia to the pod IP instead.

This change ships in the IDE images, not in the chart. Chart 2.6.2 still pins
EduIDE 1.4.0, whose images listen on all interfaces, so until the next EduIDE
release the NetworkPolicies below are the only barrier.

## NetworkPolicies

`networkPolicies.enabled` (default `true`) renders six policies that select
session pods by their `app.kubernetes.io/component=session` label. They do
nothing unless your CNI enforces NetworkPolicies, so check that first.

| Policy | Effect |
|---|---|
| `session-default-deny` | No ingress, no egress, unless another policy allows it |
| `session-allow-dns` | DNS to `networkPolicies.dnsNamespace` (default `kube-system`) |
| `session-allow-gateway-ingress` | Ingress on `networkPolicies.sessionPorts` (3000, 5000) from `networkPolicies.gatewayNamespace` (default `envoy-gateway-system`) |
| `session-allow-operator` | Ingress from the operator on the data bridge port (`networkPolicies.dataBridgePort`, 16281) and the monitor port (`networkPolicies.monitorPort`, 8081) |
| `session-allow-external-egress` | Egress to the internet, except the metadata endpoint (`networkPolicies.metadataCidr`, `169.254.169.254/32`) and `networkPolicies.privateEgressCidrs` |
| `session-allow-sidecars` | Egress to language server sidecars in the namespace |

The last two exist only while `networkPolicies.allowExternalEgress` is `true`
(the default). Setting it to `false` leaves sessions with DNS only: no git clone
from outside, no package downloads, and no language server sidecars either.

### Private ranges

`privateEgressCidrs` defaults to `10.0.0.0/8`, `172.16.0.0/12`,
`192.168.0.0/16` and `100.64.0.0/10`. Excluding them is what stops a session from
reaching the operator, the REST service, the landing page and every other pod
and service in the cluster.

Two cases need a change:

- **Your pod or service CIDR is outside these ranges.** Add it, or sessions can
  reach cluster services again.
- **Sessions must reach a host inside one of these ranges**, such as an Artemis
  or git server on a private address. Remove that range. Sessions can then reach
  everything else in it too, so prefer giving that host a public address.

The policies also block in-cluster services that sessions call on purpose, such
as a shared build cache, because those run on cluster addresses. There is no
per-service allow for them yet.

Node addresses are not covered. In the integration test on a TUM cluster, a session still reached the Kubernetes API through
its ClusterIP and the node kubelet port. Restrict those at the node or cloud
firewall.

### Prewarmed pods

The policies select pods by label. Before EduIDE-Cloud 1.2.1, claiming a
prewarmed instance labelled only its Services, so prewarmed pods ran with no
isolation at all. From 1.2.1 the pod template carries the labels, and the
operator replaces unclaimed pool deployments whose pods lack them, keeping their
volumes. Claimed sessions keep their old pod until they end.

Check after an upgrade:

```bash
kubectl -n <namespace> get networkpolicy
kubectl -n <namespace> get pods -l app.kubernetes.io/component=session
```

The second command must list every session pod, including the warm pool.

### The data bridge port must match

The chart fails to render when an app definition's `options.dataBridgePort`
differs from `networkPolicies.dataBridgePort`, because the default-deny would
then drop the environment injection into prewarmed sessions. Those sessions
would start without credentials: no clone and no Artemis sign-in.

The same holds for the monitor: `networkPolicies.monitorPort` and
`appDefinitions.defaults.monitor.port` both default to 8081, the monitor
extension's own port. The chart adds every app's monitor port to
`session-allow-operator` itself.

## Environment injection allowlist

A launch request can ask for environment variables in three ways. Before
EduIDE-Cloud 1.2.1, a request could mount any Secret or ConfigMap of the
namespace into its session, including the platform's own.

| Request field | Allowed when | Value |
|---|---|---|
| `env.fromSecrets` | the Secret name is listed | `operator.allowedEnvFromSecrets` (default `[]`, deny all) |
| `env.fromConfigMaps` | the ConfigMap name is listed | `operator.allowedEnvFromConfigMaps` (default `[]`, deny all) |
| `env.fromMap` | always, unless switched off | `operator.allowCustomEnvFromMap` (default `true`) |

The Artemis flow passes its values through `fromMap`, so the defaults work for
it. List a Secret or ConfigMap only if a launch path of yours really needs it.

Reserved names are always dropped from `fromMap`, whatever the flag says: the
prefixes `THEIACLOUD_`, `KEYCLOAK_`, `BUILD_CACHE_`, `DEPENDENCY_CACHE_`,
`DATA_BRIDGE_` and `SIDECAR_`, and the names `LD_PRELOAD`, `LD_LIBRARY_PATH`,
`NODE_OPTIONS`, `BAZEL_BUILD_CACHE_URL` and `SCORPIO_THEIA_ENV_STRATEGY`. A
caller therefore cannot redirect the build cache, the data bridge or a sidecar.

The operator logs every refusal:

```bash
kubectl -n <namespace> logs deploy/operator-deployment | grep "Dropped env injection"
```

Sessions started before the upgrade keep what they received until they end.
Restart them to revoke it.

## Pod securityContext

From EduIDE-Cloud 1.2.1 the IDE and oauth2-proxy containers run with
`allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]` and the
`RuntimeDefault` seccomp profile; oauth2-proxy also with `runAsNonRoot: true`.

This is not the full Restricted Pod Security Standard. The IDE container runs as
a fixed non-zero UID without `runAsNonRoot`, and an app definition with
bandwidth limits still adds a `NET_ADMIN` init container. A namespace label
enforcing `restricted` will reject those pods.

## Workspace ownership

From EduIDE-Cloud 1.2.1 the REST service refuses a launch or a workspace
creation with `403` when the requested workspace name belongs to another user.
Before, any logged-in user could start a session on someone else's workspace by
sending its name. The refusal never changes the other user's workspace.

In anonymous mode (no Keycloak) the check compares the `user` the caller sends,
so it stops accidental name collisions but not a caller who claims to be the
owner. The service also rejects anonymous user names outside letters, digits and
`._@+-`.

## Operator RBAC

The operator needs broad rights on Sessions, Deployments, Pods, Services and
ConfigMaps. From chart 2.5.1 those apply only in the release namespace, through
a RoleBinding to the shared `operator-api-access` ClusterRole.

Two cluster-scoped reads cannot be namespaced: CustomResourceDefinitions, which
the operator lists at startup, and PersistentVolumes. The chart grants them
through a minimal per-namespace ClusterRole, `operator-api-access-cluster-<namespace>`,
with write access to PersistentVolumes only for the `MINIKUBE` provider.

Set `operator.clusterWideRbac: true` only for a setup where the operator really
acts across namespaces. It renders a ClusterRoleBinding instead.

## Secrets and cookies

- `SERVICE_AUTH_TOKEN` and `KEYCLOAK_CLIENTSECRET` live in the
  `service-config-secret` Secret, no longer in the `service-config` ConfigMap,
  and the operator reads the service token from there instead of a plain
  argument.
- `keycloak.cookieSecret` has no default. The chart fails to render without it,
  so every installation has its own. See
  [Access Control](../platform/access-control.md).
- `oauth2Proxy.cookieSecure` defaults to `true`, so the session cookie only
  travels over HTTPS. Set it to `false` only for an install served over plain
  HTTP.
- The REST service compares the admin API token in constant time and redacts the
  session secret in its responses and logs.

The oauth2-proxy cookie secret itself still sits in a ConfigMap
(`oauth2-proxy-config`). Anyone who can read ConfigMaps in the namespace can read
it.

## The landing page

From landing page 1.3.0, which chart 2.5.1 pins:

- **Nothing from third-party hosts.** No CDN scripts, no Google Fonts, no
  Gravatar. A Content-Security-Policy and the usual security headers enforce it.
  This is why the page looks different: a flat background instead of the
  animated birds, the system font, and no profile picture next to the email.
- **Sentry is off** unless both `landingPage.sentry.enable` and
  `landingPage.sentry.dsn` are set. There is no built-in endpoint. When it is on,
  tokens, credentials and URL fragments are stripped from what it reports.
- **No secrets in the access log.** nginx logs the path without the query, since
  `gitUri` and `artemisToken` are in it.
- **Runs without root**, on port 8080 with a read-only root filesystem, no
  capabilities and the `RuntimeDefault` seccomp profile. The Service stays on
  port 80.
- **Links start a session only from trusted hosts.** A link with `gitUri` and
  `artemisToken` starts the IDE without a click only when the hosts of both
  `gitUri` and `artemisUrl` are in `landingPage.trustedArtemisHosts`. Otherwise
  the page names the repository host and waits for **Launch**. Anyone can write
  such a link, so a token in it proves nothing.
- **Anonymous mode asks first.** Without Keycloak, a `?user=` in the link is
  shown for confirmation instead of being taken as the identity.

```yaml
landingPage:
  trustedArtemisHosts:
    - artemis.example.edu
```

The TUM installations trust `artemis.cit.tum.de` (production) and
`artemis-test1/2/3.artemis.cit.tum.de` (test1 to test3). Staging, e2e, Bonn and
Mannheim trust none yet, so their Artemis links need the click.

## Inside the IDE

From the first EduIDE release after 1.4.0:

- **No code leaves for scanoss.com.** The `@theia/scanoss` extension, which sent
  code snippet hashes there, is gone.
- **Gradle prewarm can ask first.** Scorpio runs the exercise's Gradle wrapper
  right after the clone to warm the build. With `GRADLE_PREWARM_AUTO_CONFIRM=false`
  in the session environment it asks the student before running it; a dismissed
  prompt counts as no. `GRADLE_PREWARM=off` turns prewarming off entirely. The
  default stays automatic, because templates come from your own Artemis.

## What this does not cover

- **The data bridge does not authenticate `POST /data`.** Only
  `session-allow-operator` keeps other pods from injecting values into a
  session. Keep NetworkPolicies on.
- **A token inside `gitUri` ends up in the clone's `.git/config`**, because
  pushing from the IDE needs it.
- The controls above are about sessions. The operator, service and landing page
  pods have no NetworkPolicies of their own.
