---
title: Monitoring
description: Metrics, alerts, the dashboard, the admin panel and launch traces for EduIDE.
---

# Monitoring

Every component exposes Prometheus metrics, writes JSON logs and, for launches, sends OpenTelemetry traces.
No metric, log line or span carries a user name, e-mail address or token. Users appear as a pseudonymous id.

## Switch it on

```yaml
eduide-control-plane:
  monitoring:
    podMonitor: {enabled: true}
    rules: {enabled: true}
    dashboard: {enabled: true}
  config:
    telemetry: {otlpEndpoint: jaeger-collector.eduide-<deployment>:4317}
    admin: {prometheusURL: http://prometheus-operated.monitoring:9090}
```

| Value | Effect |
|---|---|
| `monitoring.podMonitor.enabled` | A PodMonitor for all components. Needs the Prometheus Operator |
| `monitoring.rules.enabled` | PrometheusRule with the alerts. `rules.extraLabels` adds labels to every alert, for example for Alertmanager routing |
| `monitoring.rules.certificates` | Certificate alerts (under 21 days left, not ready for an hour). Turn off if a cluster-wide rule exists |
| `monitoring.dashboard.enabled` | Grafana dashboard ConfigMap. `dashboard.namespace` places it where the Grafana sidecar looks |
| `networkPolicy.monitoringNamespace` | The namespace of the Prometheus that scrapes the metrics ports |

Metrics ports: operator `:9464`, service and authz `:9090`, all on `/metrics`.

## Metrics that matter

The full list is the [metrics contract](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/contracts/metrics.md). New metrics and labels are added freely; renaming one needs a deprecation over one release.

| Metric | Use it to see |
|---|---|
| `eduide_session_startup_seconds{template,strategy,result,persistence}` | Start time until `Ready` or `Failed`. Budget: warm under 2 s, cold under 30 s at p95 |
| `eduide_session_phase_seconds{phase,strategy}` | Which phase of the start is slow: `claim`, `pod_ready`, `agent_ready`, pod phases, browser phases |
| `eduide_session_failures_total{template,code}` | Failed sessions by error code |
| `eduide_claim_total{template,result}` | Claims: `claimed`, `conflict`, `empty` |
| `eduide_pool_instances{pool,state}`, `eduide_pool_target_idle{pool}` | Idle and claimed instances, the scaler's target |
| `eduide_capacity_pressure{node_pool}`, `eduide_capacity_evictions_total` | A pod cannot be placed, idle pods deleted to make room |
| `eduide_sessions{template,phase}`, `eduide_workspaces{phase}` | Counts by phase |
| `eduide_launch_total{template,result}` | Launches: `created`, `existing`, `rejected` |
| `eduide_api_requests_total`, `eduide_api_request_seconds` | API load and latency |
| `eduide_authz_decisions_total{result,reason}`, `eduide_authz_check_seconds` | Access decisions and their latency |
| `eduide_agent_requests_total{op,result}` | Operator to agent calls |
| `pool_scaler_last_decision_timestamp_seconds` | Heartbeat of the pool scaler |

## What to alert on

| Signal | Why | Runbook |
|---|---|---|
| Empty claims rise, a pool at 0 idle | Users get cold starts | [Pool is empty](incident-response.md#pool-is-empty) |
| Start p95 above budget, failures rise | Users wait | [Slow launch](incident-response.md#slow-launch) |
| High `deny` or `login` rate in authz, high check latency | Users locked out, every request slower | [Authz errors](incident-response.md#authz-errors) |
| `eduide_capacity_pressure` is 1 | Pods cannot be placed | [Pool is empty](incident-response.md#pool-is-empty) |
| Routes `Accepted` late, 404 or 503 after Ready | Gateway is behind | [Gateway backlog](incident-response.md#gateway-backlog) |
| Certificate expiring | Outage in a few weeks | [Certificates](../install/certificates.md) |

The chart ships alerts for empty pools and for certificates. Check `monitoring.rules` in the installation chart for the current list before you add your own.

## Admin panel and public status

The landing page has an admin panel for users with the admin role ([Admin Access](../security/admin-access.md)). It shows status warnings, pools, sessions, workspaces, recent problems per error code, templates and the effective configuration, read-only.
With `admin.prometheusURL` it also shows start counts, latency, capacity and time series; without it these parts are absent.
Status warnings include `pool-empty`, `capacity-pressure` and `scaler-silent`. The last one needs Prometheus and the PodMonitor.

The public status page (`GET /api/v1/status`, no login) shows `ok`, `slow` or `down` for sign-in, starting and workspaces, plus a start estimate per template.
It contains no user, session or host details. Link it from your course pages.

## Traces

One launch is one trace, from the click on the landing page to a usable IDE. Jaeger is not public: use a port-forward.

```bash
kubectl -n <namespace> port-forward svc/jaeger-collector 16686:16686
```

Search service `eduide-service`, operation `launch`, with a tag such as `eduide.session=<name>`, `eduide.template=<name>` or `error=true`.
`eduide.user_id` is a pseudonym, an HMAC of the owner with the salt of the deployment. Names and e-mail addresses are never in a span.
Warm start budget: `start` under 2 s. Cold start: under 30 s at p95.
Set `admin.links.traceUrlTemplate` to make the admin panel link to traces.
The span tree, normal durations and the span to cause table are in the [tracing guide](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/operations/tracing.md). Record normal values from your own deployment before you alert on the browser phases.

## Logs

Every component logs one JSON object per line on stdout, with `service`, `level`, `msg` and, when a trace is sampled, `trace_id`.
Set the level with `operator.logLevel`, `service.logLevel`, `authz.logLevel`, `poolScaler.logLevel` and `config.agent.logLevel` (`debug`, `info`, `warn`). A change restarts the component.
Details and lifecycle lines: [logging](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/operations/logging.md).
