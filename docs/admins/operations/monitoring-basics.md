---
title: Monitoring Basics
description: Key signals, Prometheus metrics, alert thresholds, and health check procedures for EduIDE.
---

# Monitoring Basics

EduIDE's monitoring stack is built on Prometheus and Grafana, managed through the `theia-monitoring` chart and the Rancher monitoring system (`cattle-monitoring-system`). This page describes the key signals to watch, what normal and degraded states look like, and how to verify platform health proactively.

## Monitoring infrastructure

The `theia-monitoring` chart deploys Prometheus `ServiceMonitor` resources that configure scrape targets for each environment namespace. Grafana dashboards are discovered from the `cattle-dashboards` namespace.

Namespaces in scope:
- `theia-prod`
- `theia-staging`
- `test1`, `test2`, `test3`

If a new environment namespace is added, update the `targetNamespaces` and `sessionNamespaces` lists in the monitoring chart values before deploying.

### Shared build cache metrics

The `theia-shared-cache` (Gradle and Bazel build cache) exposes Prometheus metrics at `/metrics` via a Redis Exporter sidecar. Enable the ServiceMonitor for it in the chart values:

```yaml
metrics:
  serviceMonitor:
    enabled: true
```

## Key signals

### Session launch latency

The most user-visible signal. A session launch that takes longer than ~10 seconds indicates either:
- All pre-warmed instances are consumed (increase `minInstances`)
- The cluster is under node pressure (check CPU/memory on nodes)
- The operator is backlogged in reconciliation

Monitor: time from `POST /service` to a reachable session URL.

**Alert threshold:** p95 > 15 seconds sustained for 5 minutes.

### Session availability

The fraction of launch requests that succeed. A drop indicates cluster instability, image pull failures, or storage attachment problems.

Monitor: ratio of successful session starts to total start attempts.

**Alert threshold:** success rate < 95% over a 10-minute window.

### Pod memory utilisation

Individual session pods have a memory limit (e.g., `3000M` for `java-17-latest`). Pods consistently near their limit will OOMKill, which surfaces as unexpected session terminations.

Monitor: `container_memory_working_set_bytes` for session pods vs. `limits.memory`.

**Alert threshold:** > 85% of memory limit for > 5 minutes.

### Authentication error rate

Failed authentication attempts spike during misconfiguration (e.g., after a Keycloak change) or during an attack. Normal rate should be near zero for legitimate users.

Monitor: HTTP 401 and 403 response rates on the OAuth2 proxy and service.

**Alert threshold:** > 5% of requests returning 401/403 over a 5-minute window.

### Workspace storage usage

PVC count and total storage consumption against the namespace quota. Approaching the quota hard limit will prevent new workspace creation.

Monitor: `kube_resourcequota` for `persistentvolumeclaims` and `requests.storage`.

**Alert threshold:** > 80% of quota consumed.

### Build cache hit rate

A low cache hit rate for the shared cache degrades CI build times but does not affect user sessions directly. Gradle and Bazel are tracked with separate counters.

Monitor (Gradle): `gradle_cache_cache_hits` / (`gradle_cache_cache_hits` + `gradle_cache_cache_misses`).

Monitor (Bazel): `bazel_cache_cache_hits` / (`bazel_cache_cache_hits` + `bazel_cache_cache_misses`).

Also watch `bazel_cache_hash_mismatches` — a non-zero rate indicates Bazel CAS uploads failing content-hash verification and should be investigated.

**Informational threshold:** < 50% over a 24-hour window warrants investigation.

## Health check procedures

### Service health

```bash
# Public ping (requires service auth token, not admin token)
curl https://service.theia.artemis.cit.tum.de/service/{appId}

# Admin ping (requires admin API token)
curl -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  https://service.theia.artemis.cit.tum.de/service/admin/{appId}
```

Both return `true` when the service is healthy.

### Operator health

```bash
kubectl get pods -n theia-prod -l app=operator
kubectl logs -n theia-prod -l app=operator --tail=50
```

The operator runs 3 replicas in production. If fewer than 3 are `Running`, investigate immediately.

### Session pod health

```bash
# Count running session pods
kubectl get pods -n theia-prod --field-selector=status.phase=Running | grep -c session

# Find stuck or crash-looping pods
kubectl get pods -n theia-prod | grep -E 'CrashLoopBackOff|Error|Pending'
```

### Build cache health

```bash
# Readiness check
curl https://cache.theia.artemis.cit.tum.de/health

# Liveness check
curl https://cache.theia.artemis.cit.tum.de/ping
```

Returns `200 OK` when healthy.

## Grafana dashboards

Dashboards are deployed to the `cattle-dashboards` namespace. To access them:

1. Open the Rancher UI and navigate to the monitoring section.
2. Look for dashboards prefixed with `theia-`.
3. The main session dashboard shows launch latency, active sessions, and pod resource usage per namespace.

If dashboards are missing after a new environment is added, verify that the monitoring chart has been redeployed with the updated namespace list.

## Routine health check cadence

| Check | Frequency | Method |
|---|---|---|
| Session launch smoke test | Daily | Launch a session manually and verify it starts |
| Pod status overview | Daily | `kubectl get pods -n theia-prod` |
| Resource quota utilisation | Weekly | `kubectl describe resourcequota -n theia-prod` |
| PVC growth rate | Weekly | Compare PVC count to previous week |
| Alert rule review | Monthly | Confirm alert thresholds are still appropriate for current cohort size |
| Dashboard coverage | On namespace addition | Verify new namespaces appear in Grafana |
