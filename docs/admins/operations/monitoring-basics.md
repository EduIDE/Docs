---
title: Monitoring Basics
description: Key signals, Prometheus metrics, alert thresholds, and health check procedures for EduIDE.
---

# Monitoring Basics

EduIDE ships optional Prometheus integration as part of the `eduide-cluster` chart. It is off by default, and it assumes you already run a Prometheus and a Grafana somewhere in the cluster. This page describes what the chart actually creates, what it does and does not give you, the key signals to watch, and how to verify platform health by hand.

:::note Placeholders on this page

Every EduIDE installation lives in its own namespace, named `eduide-<name>` by convention (`eduide-staging`, `eduide-cs101`, and so on). Commands below use `-n <namespace>` - substitute your installation's namespace.

Hostnames appear as `<service-host>`, `<landing-host>` and `<cache-host>`. These are the DNS names you configured for the REST service, the landing page and the optional shared build cache.

:::

:::warning `monitoring` and `monitor` are two different settings

`monitoring.*` (this page) is Prometheus scrape configuration. `monitor.*` in the `eduide` chart is the operator's **session activity tracker** - it pings running session pods so idle sessions can be shut down, and has nothing to do with metrics. Turning off `monitor.enable` stops idle-session cleanup; turning off `monitoring.enabled` stops Prometheus discovery. They are easy to confuse and the failure modes look nothing alike.

:::

## Monitoring infrastructure

Monitoring is configured under `monitoring.*` in the **`eduide-cluster`** chart values, not in a per-installation values file, and not in a separate chart. An older standalone `theia-monitoring` chart existed; it has been removed.

The chart creates:

- Two `PodMonitor` resources (`monitoring.coreos.com/v1`) - **not** `ServiceMonitor`s.
- Two Grafana dashboard `ConfigMap`s, labelled `grafana_dashboard: "1"`.

### Prerequisites

`monitoring.enabled` defaults to **`false`**, deliberately. Before turning it on:

1. **Prometheus Operator CRDs must exist.** `PodMonitor` is not a core Kubernetes kind. Verify:

   ```bash
   kubectl get crd podmonitors.monitoring.coreos.com
   ```

   If this returns `NotFound`, you have Prometheus but not the Prometheus Operator, and the chart render will fail. A standard `kube-prometheus-stack` install provides these CRDs.

2. **Both target namespaces must already exist.** Helm does not create namespaces it was not told to create, so if `monitoring.namespace` or `monitoring.dashboardNamespace` is absent the install fails outright.

3. **Your Prometheus must actually select these PodMonitors.** Prometheus Operator only scrapes `PodMonitor`s that match its `podMonitorSelector` and `podMonitorNamespaceSelector`. On a default `kube-prometheus-stack` install the selector is scoped to the release's own label, so a `PodMonitor` dropped into an arbitrary namespace is ignored silently. Either place the `PodMonitor`s where your Prometheus looks, or relax the selector (`prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues: false` on `kube-prometheus-stack`).

### Values

```yaml
monitoring:
  enabled: false
  # Namespace the PodMonitors go in. Must be a namespace your Prometheus
  # discovers, and must already exist.
  namespace: <prometheus-namespace>
  # Namespace the Grafana dashboard ConfigMaps go in. Must already exist and
  # be watched by Grafana's dashboard sidecar.
  dashboardNamespace: <grafana-dashboard-namespace>
  # Namespaces to scrape the REST service in.
  targetNamespaces: []
  # Namespaces to scrape session pods in.
  sessionNamespaces: []
```

The chart's defaults for these two namespaces are `cattle-monitoring-system` and `cattle-dashboards`. Those are **Rancher's** namespaces - they are defaults inherited from where EduIDE was first deployed, not requirements. On a vanilla `kube-prometheus-stack` install both are typically the namespace you installed the stack into (often `monitoring`), because that stack's Grafana sidecar watches all namespaces for the `grafana_dashboard` label by default.

`targetNamespaces` and `sessionNamespaces` are flat lists of namespace names. They are derived per cluster: you list every EduIDE installation namespace on that cluster. If either list is empty, the corresponding `PodMonitor` is not rendered at all.

```yaml
monitoring:
  enabled: true
  namespace: monitoring
  dashboardNamespace: monitoring
  targetNamespaces:
    - eduide-staging
    - eduide-cs101
  sessionNamespaces:
    - eduide-staging
    - eduide-cs101
```

Because the lists are cluster-level, adding a new installation means re-running the `eduide-cluster` upgrade with the namespace added. There is no way for a tenant to add itself.

### Opting one installation out

The **`eduide`** (per-installation) chart has its own `monitoring.enabled`, defaulting to `true`:

```yaml
# in the tenant values file
monitoring:
  enabled: false
```

This value renders nothing on its own - no template in the `eduide` chart reads it. It is a declaration that whoever assembles the cluster-level `targetNamespaces` and `sessionNamespaces` lists is expected to honour by leaving that namespace out. If you assemble those lists by hand, you have to read this flag yourself.

### Verifying the wiring

```bash
kubectl get podmonitor -n <prometheus-namespace>
# expect: theia-cloud-service, theia-cloud-sessions

kubectl get configmap -n <grafana-dashboard-namespace> -l grafana_dashboard=1
# expect: theia-cloud-dashboard-overview, theia-cloud-dashboard-session-startup
```

Then confirm Prometheus picked them up: open the Prometheus UI under **Status → Targets** and look for the two job names, or port-forward and check the service discovery page. If the `PodMonitor`s exist but no targets appear, the cause is almost always the `podMonitorSelector` problem described above.

## What is actually scraped

Two scrape configurations, and it is worth knowing exactly what each one covers.

### `theia-cloud-service`

Selects pods labelled `app: service` in every namespace listed in `targetNamespaces`, scrapes the container port named `http` at path `/q/metrics` every 15s.

The REST service is a Quarkus application using SmallRye Metrics. What you get is the MicroProfile base and vendor metric set: JVM heap and non-heap usage, thread counts, GC statistics, CPU, and generic REST request counters. This is genuinely useful for spotting a service that is leaking memory or wedged on GC.

### `theia-cloud-sessions`

Selects pods in `sessionNamespaces` whose `app` label is **not** one of `conversion-webhook`, `landing-page`, `operator`, `service` - in other words, everything left over, which in an installation namespace is the session pods. It scrapes the container port named `application` at the default path `/metrics` every 15s.

Session pods are labelled `app: <sessionName>-<sessionUID>`, so there is no stable label value to select on positively. That is why the selector is a negative match.

Whether anything answers on `/metrics` depends entirely on the IDE image you run. A stock Theia or Code image does not serve Prometheus metrics on its application port, in which case these targets appear in Prometheus as `DOWN`. That is expected, not a fault to chase.

### What is not scraped

- **The operator exposes no Prometheus metrics.** There is no metrics dependency in the operator build and no `PodMonitor` for it. Everything you learn about the operator comes from its logs and its pod status.
- **The landing page exposes no metrics.**
- There are **no EduIDE-specific metric names** - nothing like `eduide_sessions_active`. The signals below are therefore derived from Kubernetes-level exporters (kube-state-metrics, cAdvisor) rather than read off an EduIDE counter. Where a signal has no metric behind it at all, this page says so.

## Key signals

These assume `kube-state-metrics` and cAdvisor metrics are available, which is the case on any `kube-prometheus-stack` install. Thresholds are starting points; tune them to your cohort size.

### Session launch latency

The most user-visible signal, and the one with no metric behind it.

Nothing in EduIDE times a session launch and exports it. The `theia-cloud-dashboard-session-startup` dashboard shipped by the chart approximates it from pod lifecycle timestamps. To measure it directly, run a synthetic check: launch a session through the API on a schedule and time it from request to a reachable session URL.

A launch that takes longer than roughly 10 seconds usually means one of:

- All pre-warmed instances are consumed (increase `minInstances` on the App Definition).
- The cluster is under node pressure (check CPU and memory on nodes).
- The operator is backlogged in reconciliation.

**Suggested alert:** p95 of your synthetic launch check > 15 seconds sustained for 5 minutes.

### Session availability

The fraction of launch attempts that succeed. A drop indicates cluster instability, image pull failures, or storage attachment problems.

Also has no first-class metric. The nearest proxies from kube-state-metrics are session pods stuck outside `Running`:

```
kube_pod_status_phase{namespace="<namespace>", phase="Pending"}
kube_pod_container_status_waiting_reason{namespace="<namespace>", reason=~"ErrImagePull|ImagePullBackOff|CrashLoopBackOff"}
```

**Suggested alert:** any session pod `Pending` for more than 5 minutes.

### Pod memory utilisation

Session pods have a memory limit - `2400M` by default for App Definitions, raised per app where needed. Pods that sit near their limit will be OOMKilled, which users experience as a session dying without warning.

```
container_memory_working_set_bytes{namespace="<namespace>"}
  / on(pod, container) kube_pod_container_resource_limits{resource="memory"}
```

Also watch `kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}` - a rising count is unambiguous.

**Suggested alert:** > 85% of the memory limit for > 5 minutes.

### Authentication error rate

Failed authentication spikes during misconfiguration (after a Keycloak change, for instance) or during an attack. The normal rate for legitimate users is near zero.

oauth2-proxy runs as a **sidecar inside each session pod**, not as a central Deployment, so there is no single proxy to scrape and no aggregate authentication metric. What you can observe:

- Rejected admin API token requests, in the REST service logs (see [Audit and Compliance](/admins/security/audit-and-compliance)).
- Keycloak's own `LOGIN_ERROR` event rate, from Keycloak's metrics or event log.
- Per-pod oauth2-proxy logs, one pod at a time:

  ```bash
  kubectl logs <session-pod> -n <namespace> -c oauth2-proxy --tail=100
  ```

If authentication failures matter to you as an alertable signal, collect them at Keycloak. EduIDE does not aggregate them.

### Workspace storage usage

PVC count and total storage against the namespace quota. Hitting the quota hard limit prevents new workspace creation, while existing sessions carry on working - which makes it a confusing failure to diagnose from user reports alone.

```
kube_resourcequota{namespace="<namespace>", resource="persistentvolumeclaims"}
kube_resourcequota{namespace="<namespace>", resource="requests.storage"}
```

Compare the `used` and `hard` values of each.

**Suggested alert:** > 80% of quota consumed.

### Build cache hit rate

The shared build cache is the optional `eduide-shared-cache` subchart of `eduide`, disabled by default (`eduide-shared-cache.enabled: false`). If you do not run it, skip this section.

The subchart ships its own `ServiceMonitor` resources, gated on its own flag, which is on by default within the subchart:

```yaml
eduide-shared-cache:
  enabled: true
  monitoring:
    enabled: true
```

Note these are `ServiceMonitor`s, unlike the `PodMonitor`s above, so the same "does my Prometheus select them" question applies with `serviceMonitorSelector`.

A low hit rate degrades build times but does not affect user sessions. The exact metric names the cache exports are not documented in the charts, and this page does not claim to know them. Check the `/metrics` output of a running cache pod to see what is actually there before writing alert rules against it.

## Health check procedures

### Service health

```bash
# Public ping (requires the service auth token, not the admin token)
curl https://<service-host>/service/<appId>

# Admin ping (requires an OAuth token with the admin group claim)
curl -H "Authorization: Bearer $OAUTH_TOKEN" \
  https://<service-host>/service/admin/<appId>
```

Both return `true` when the service is healthy.

### Operator health

```bash
kubectl get pods -n <namespace> -l app=operator
kubectl logs -n <namespace> -l app=operator --tail=50
```

The operator runs **1 replica** by default (`operator.replicas: 1`). One `Running` pod is a healthy operator. Raise the replica count only if you have deliberately configured it; do not treat a single operator pod as a degraded state.

The Deployment is named `operator-deployment`, not `operator`:

```bash
kubectl rollout status deployment/operator-deployment -n <namespace>
```

### Session pod health

```bash
# Count running pods that are not platform components
kubectl get pods -n <namespace> --field-selector=status.phase=Running \
  -l 'app notin (operator,service,landing-page,image-preloading)' --no-headers | wc -l

# Find stuck or crash-looping pods
kubectl get pods -n <namespace> | grep -E 'CrashLoopBackOff|Error|Pending'
```

### Custom resource health

The CRDs are still in the `theia.cloud` API group for historical reasons, even though the charts are named `eduide*`. Grepping for `eduide` in the CRD list finds nothing and does not mean the CRDs are missing.

```bash
kubectl get crd | grep theia.cloud
kubectl get workspaces.theia.cloud -n <namespace>
kubectl get sessions.theia.cloud -n <namespace>
kubectl get appdefinitions.theia.cloud -n <namespace>
```

### Gateway health

Routing is Gateway API (Envoy Gateway) with a shared Gateway in `eduide-system` and HTTPRoutes in each installation namespace. There is no Ingress resource to check.

```bash
kubectl get gateway -n eduide-system
kubectl get httproute -n <namespace>
```

See [Incident Response](/admins/operations/incident-response) for what to do when either reports a problem.

### Build cache health

Only if you run the optional shared cache:

```bash
curl https://<cache-host>/health
curl https://<cache-host>/ping
```

Returns `200 OK` when healthy.

## Grafana dashboards

The chart installs two dashboards as `ConfigMap`s labelled `grafana_dashboard: "1"` into `monitoring.dashboardNamespace`:

- `theia-cloud-dashboard-overview`
- `theia-cloud-dashboard-session-startup`

That label is the convention the `kube-prometheus-stack` Grafana sidecar watches for, so on a standard install the dashboards appear automatically once the ConfigMaps land in a namespace the sidecar covers. On Rancher, the equivalent namespace is `cattle-dashboards` and the dashboards show up in the Rancher monitoring UI.

If the dashboards do not appear:

1. Confirm the ConfigMaps exist in the namespace you configured.
2. Confirm your Grafana sidecar watches that namespace and looks for that label.
3. Confirm the panels have data - a dashboard renders empty rather than disappearing when Prometheus has no matching series, which is what you will see if the `PodMonitor`s are not being selected.

If dashboards render but a newly added installation is missing from them, the cause is the cluster-level namespace lists: re-run the `eduide-cluster` upgrade with the new namespace in `targetNamespaces` and `sessionNamespaces`.

## Routine health check cadence

| Check | Frequency | Method |
|---|---|---|
| Session launch smoke test | Daily | Launch a session manually and verify it starts |
| Pod status overview | Daily | `kubectl get pods -n <namespace>` |
| Gateway and route status | Daily | `kubectl get gateway -n eduide-system` and `kubectl get httproute -n <namespace>` |
| Resource quota utilisation | Weekly | `kubectl describe resourcequota -n <namespace>` |
| PVC growth rate | Weekly | Compare PVC count to previous week |
| Certificate expiry and coverage | Monthly | See [Incident Response](/admins/operations/incident-response) |
| Alert rule review | Monthly | Confirm thresholds still suit the current cohort size |
| Namespace list coverage | On installation addition | Verify the new namespace is in `targetNamespaces` and `sessionNamespaces` |
