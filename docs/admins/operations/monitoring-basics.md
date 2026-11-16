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

- `PodMonitor` resources (`monitoring.coreos.com/v1`) for the REST service (on its `management` port, plus a `-legacy` monitor for the `http` port during the 3.0 transition) and for the operator. They are not `ServiceMonitor`s.
- Four Grafana dashboard `ConfigMap`s, labelled `grafana_dashboard: "1"`.
- A `PrometheusRule` with 16 alerts, and with `monitoring.alerting.enabled` an `AlertmanagerConfig`, see [Alerts](#alerts).
- With `monitoring.certManager.enabled`, a `ServiceMonitor` for cert-manager's controller, so certificate expiry can be alerted on.

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
  # Namespaces to scrape. Bootstrap derives this from the environments
  # on the cluster whose monitoring.enabled is true.
  targetNamespaces: []
```

The chart's defaults for these two namespaces are `cattle-monitoring-system` and `cattle-dashboards`. Those are **Rancher's** namespaces - they are defaults inherited from where EduIDE was first deployed, not requirements. On a vanilla `kube-prometheus-stack` install both are typically the namespace you installed the stack into (often `monitoring`), because that stack's Grafana sidecar watches all namespaces for the `grafana_dashboard` label by default.

`targetNamespaces` is a flat list of namespace names. It is derived per cluster: you list every EduIDE installation namespace on that cluster, and the dashboards offer it as their namespace picker. If it is empty, the `PodMonitor`s are not rendered at all.

```yaml
monitoring:
  enabled: true
  namespace: monitoring
  dashboardNamespace: monitoring
  targetNamespaces:
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

This value renders nothing on its own - no template in the `eduide` chart reads it. It is a declaration that whoever assembles the cluster-level `targetNamespaces` list is expected to honour by leaving that namespace out. If you assemble those lists by hand, you have to read this flag yourself.

### Verifying the wiring

```bash
kubectl get podmonitor -n <prometheus-namespace>
# expect: theia-cloud-service, theia-cloud-service-legacy, theia-cloud-operator

kubectl get configmap -n <grafana-dashboard-namespace> -l grafana_dashboard=1
# expect: theia-cloud-dashboard-overview, theia-cloud-dashboard-session-startup,
#         eduide-dashboard-sessions, eduide-dashboard-session-detail
```

Then confirm Prometheus picked them up: open the Prometheus UI under **Status → Targets** and look for the job names, or port-forward and check the service discovery page. If the `PodMonitor`s exist but no targets appear, the cause is almost always the `podMonitorSelector` problem described above.

## What is actually scraped

The service and the operator are scraped, and it is worth knowing exactly what each one covers. Session pods are not scraped; their health comes from Kubernetes-level exporters (kube-state-metrics, cAdvisor, kubelet volume stats).

### `theia-cloud-service`

Selects pods labelled `app: service` in every namespace listed in `targetNamespaces`, scrapes the container port named `management` at path `/q/metrics` every 15s.

From EduIDE-Cloud 3.0 the service serves metrics and OpenAPI on the management port 9000, which the gateway does not route, and no longer on the public port. Chart 3.0.0 labels the service pod `eduide.io/metrics-port: management` and the cluster chart scrapes that port. During the transition it renders a second `PodMonitor`, `theia-cloud-service-legacy`, which keeps scraping the `http` port of service pods without that label. Remove the legacy monitor once every installation runs chart 3.x.

The REST service is a Quarkus application using SmallRye Metrics. What you get is the MicroProfile base and vendor metric set: JVM heap and non-heap usage, thread counts, GC statistics, CPU, and generic REST request counters. This is genuinely useful for spotting a service that is leaking memory or wedged on GC.

### `theia-cloud-operator`

Selects the operator pods in `targetNamespaces` and scrapes the container port named `metrics`. It finds a target only when `operator.metricsPort` is set, see [Operator metrics](#operator-metrics).

### What is not scraped

- **The operator exposes metrics only if you ask for them.** See [Operator metrics](#operator-metrics) below. Everything else you learn about the operator comes from its logs and its pod status.
- **The landing page exposes no metrics.**
- The operator exports **one EduIDE-specific metric**, `theiacloud_sessions_ended_total`, and there is nothing like `eduide_sessions_active`. The other signals below are therefore derived from Kubernetes-level exporters (kube-state-metrics, cAdvisor) rather than read off an EduIDE counter. Where a signal has no metric behind it at all, this page says so.

## Operator metrics

From chart 2.10.0 the operator can serve Prometheus metrics:

```yaml
operator:
  metricsPort: 9464    # default 0, which serves nothing
```

The operator then exposes `/metrics` on a container port named `metrics`. The
`eduide-cluster` chart adds a `PodMonitor` named `theia-cloud-operator` that
scrapes it every 30 seconds in every namespace listed in `targetNamespaces`.
Without `operator.metricsPort` that `PodMonitor` finds no target.

:::warning Needs EduIDE-Cloud 2.0.0
Set `operator.metricsPort` only with an operator that knows `--metricsPort`,
which is EduIDE-Cloud 2.0.0 (the first release containing EduIDE-Cloud#167). An
older operator rejects the flag and does not start. Check `versions.cloud` if your values override it.
:::

The first metric is:

```
theiacloud_sessions_ended_total{reason, app_definition}
```

It counts sessions the operator stopped, with `reason` either `inactivity` (the
idle timeout) or `lifetime` (the app definition's maximum session time).
Sessions a student or an admin stopped are not counted. The sessions dashboard
(the `eduide-dashboard-sessions` ConfigMap, shown in Rancher monitoring) has a
panel "Sessions ended per hour, by reason" built on it, filtered by namespace.
The panel stays empty until `operator.metricsPort` is set.

A rising `inactivity` rate right after an upgrade is expected, because idle
sessions now really end, see [Session Management](session-management.md).

## Key signals

These assume `kube-state-metrics` and cAdvisor metrics are available, which is the case on any `kube-prometheus-stack` install. Thresholds are starting points; tune them to your cohort size.

### Session launch latency

The most user-visible signal. The service exports a startup timer, `application_application_theiacloud_session_startup_seconds_seconds` (a summary with quantiles), which the `theia-cloud-dashboard-session-startup` dashboard and the `EduIDESessionStartupSlow` alert use (p95 above 90 seconds for 15 minutes). The timer starts at the launch request and stops when the session has a URL, so it does not include the time until the IDE answers. A synthetic check from request to a reachable session URL still measures what a student sees.

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
  -l app.kubernetes.io/component=session --no-headers | wc -l

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

## Alerts

With `monitoring.enabled`, the cluster chart ships a `PrometheusRule` with 16 alerts. Each carries a `runbook_url` that points to [Incident Response](incident-response.md#alert-runbooks). They cover components down or crash looping, the warm pool, session crashes, OOM kills, evictions, slow startup (`EduIDESessionStartupSlow`, p95 above 90 seconds), pending pods and volumes, image pulls, volume space and inodes, and certificates.

Routing is optional. With `monitoring.alerting.enabled: true` the chart also renders an `AlertmanagerConfig` that sends alerts at or above `monitoring.alerting.minSeverity` (default `warning`) to the `monitoring.alerting.channels` you list, with webhook URLs from a Secret (`monitoring.alerting.webhookSecret`). `monitoring.alerting.thresholds` tunes the limits (for example `startupSeconds: 90`, `volumePercent: 85`, `certExpiryDays: 21`). `monitoring.certManager.enabled: true` adds the certificate metrics that the two certificate alerts need.

## Grafana dashboards

The chart installs four dashboards as `ConfigMap`s labelled `grafana_dashboard: "1"` into `monitoring.dashboardNamespace`:

- `theia-cloud-dashboard-overview`
- `theia-cloud-dashboard-session-startup`
- `eduide-dashboard-sessions`
- `eduide-dashboard-session-detail`

That label is the convention the `kube-prometheus-stack` Grafana sidecar watches for, so on a standard install the dashboards appear automatically once the ConfigMaps land in a namespace the sidecar covers. On Rancher, the equivalent namespace is `cattle-dashboards` and the dashboards show up in the Rancher monitoring UI.

If the dashboards do not appear:

1. Confirm the ConfigMaps exist in the namespace you configured.
2. Confirm your Grafana sidecar watches that namespace and looks for that label.
3. Confirm the panels have data - a dashboard renders empty rather than disappearing when Prometheus has no matching series, which is what you will see if the `PodMonitor`s are not being selected.

If dashboards render but a newly added installation is missing from them, the cause is the cluster-level namespace lists: re-run the `eduide-cluster` upgrade with the new namespace in `targetNamespaces`.

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
| Namespace list coverage | On installation addition | Verify the new namespace is in `targetNamespaces` |
