---
title: Incident Response
description: Triage sequence and runbooks for slow launches, empty pools, authz errors, gateway backlog and lost workspace volumes.
---

# Incident Response

Replace `<ns>` with the namespace of the deployment. The runbooks here summarize the ones in the control plane repository, [docs/operations](https://github.com/EduIDE/EduIDE-control-plane/tree/main/docs/operations), which are the source of truth.

## Triage

1. Check the public status page and the admin panel. Which part is `slow` or `down`: sign-in, starting, workspaces?
2. `kubectl -n <ns> get pods`. Are operator, service and authz `Ready`?
3. Look at the metrics: start time, failures, claims, capacity pressure ([Monitoring](monitoring-basics.md)).
4. Take one affected session and read it: `kubectl -n <ns> describe idesession <name>`. Events, `status.errorCode` and `status.message` usually name the cause.
5. Open the trace of that launch in Jaeger by `eduide.session=<name>`.

Never copy launch data from Secrets into tickets or chats. Logs and traces contain none; if you find one, treat it as a bug.

## Slow launch

Symptom: users wait longer than the budget (warm under 2 s, cold under 30 s at p95), or sessions end in `Failed`.

Find the slow phase with `eduide_session_phase_seconds`, or read the timestamps of one session:

```bash
kubectl -n <ns> get idesession <name> -o yaml | grep -A12 -E 'startStrategy|timestamps|errorCode|message'
```

Compare `claimed`, `podReady`, `agentReady` and `ready` with the creation time. The largest gap is the slow phase.

| Slow phase | Causes | Checks and fixes |
|---|---|---|
| Created to `claimed` | Operator not running or not leader, API server slow | `kubectl -n <ns> get lease eduide-operator`, operator logs, restart the operator |
| `claimed` | No idle instance, conflicts | See [Pool is empty](#pool-is-empty) |
| `podReady` | Image pull, unschedulable pod, volume binding, slow IDE start | `kubectl -n <ns> describe pod ide-<instance>`, enable prepull, check the StorageClass |
| `agentReady` | Agent not ready, claim call fails | `kubectl -n <ns> logs ide-<instance> -c agent`, NetworkPolicy from operator to port 8081 |
| `ready` to usable IDE | Gateway not programmed, login redirect, IDE start | Check the HTTPRoute, see [Gateway backlog](#gateway-backlog) and [Authz errors](#authz-errors) |

Failed sessions carry a stable `errorCode`:

| `errorCode` | Meaning | Fix |
|---|---|---|
| `capacity-exhausted` | No room for the pod after `capacity.exhaustedAfter` | Add capacity or quota |
| `template-not-found` | The template does not exist | Check the template name in the values |
| `workspace-not-found` | The workspace does not exist | It may have expired |
| `workspace-lost` | The volume of a saved workspace is gone | [Workspace volume lost](#workspace-volume-lost) |
| `start-failed` | Pod or agent failed | Read `status.message`, pod logs and events. Image errors such as a wrong name or a missing manifest fail after 60 seconds |

Users at the per-user limit get `session-limit-reached` from the API. That is not a fault.

## Pool is empty

Symptom: launches are cold instead of warm, sessions show `startStrategy: cold` or `warm-starting`, users wait at the start of an exam.

Look at `eduide_pool_instances` (`idle_ready` at 0 while `claimed` is high), `eduide_claim_total{result="empty"}` rising and `eduide_capacity_pressure`.

```bash
kubectl -n <ns> get idepool
kubectl -n <ns> get idepool <pool> -o jsonpath='{.spec}{"\n"}{.status}{"\n"}'
kubectl -n <ns> get pods -l eduide.github.io/state=idle,eduide.github.io/pool=<pool>
kubectl -n <ns> get events --sort-by=.lastTimestamp | tail -30
```

| Cause | Sign | Fix |
|---|---|---|
| Target too low for the burst | `idleReady` 0, `targetIdle` equals `minIdle` | Raise `minIdle` before an exam. Check that the pool scaler runs |
| Pool scaler down or overridden | Annotation `scaler-override` on the `IDEPool`, no scaler pod | Restart the scaler or remove the annotation |
| Capacity pressure | `eduide_capacity_pressure` is 1, pods unschedulable | Add nodes or quota. The operator keeps pools of that node pool at 0 idle and fails sessions with `capacity-exhausted` after 45 seconds |
| Idle instances not ready | `idleStarting` high | Image pull slow or failing: check the registry and enable prepull. Agent not ready: check the agent log |
| `maxInstances` reached | `replicas` equals `maxInstances` | Raise `maxInstances` |
| Session has a saved workspace | `startStrategy: cold` | Expected, saved workspaces always start cold |

Emergency scale without the scaler: `kubectl -n <ns> scale idepool <pool> --replicas=<n>`.

## Authz errors

Symptom: users get 403 or a redirect loop on `https://<instance host>/<instance id>/`, or nobody reaches a new IDE.

```bash
kubectl -n <ns> get pods -l app.kubernetes.io/component=authz
kubectl -n <ns> logs deploy/<authz> --since=15m
kubectl -n <ns> get idesession <name> -o jsonpath='{.status.phase}{" "}{.status.instance}{" "}{.spec.owner}{"\n"}'
kubectl -n <ns> get securitypolicy,httproute
```

Log lines carry the decision reason and the trace id, never tokens or cookie values.

| Symptom | Cause | Fix |
|---|---|---|
| 403 for the owner right after launch | Session not yet `Ready` in the authz cache | Wait a second. If it stays, check RBAC and `/readyz` of authz |
| 403 for the owner, session `Ready` | `spec.owner` differs from the token claim `oidc.userClaim` | Compare the claim in the token with `spec.owner`. Fix `userClaim` or the Keycloak mapper |
| 403 for everyone | authz internal error (it fails closed) or the session is being deleted | Read the authz logs, restart authz, check `oidc.issuerURL` and `oidc.gatewayClientID` |
| 403 for a foreign user | Expected | None |
| Redirect loop | Token invalid: wrong audience, issuer mismatch, clock skew | Check the gateway client id and the node time |
| Redirect loop after login | Cookie not sent: wrong cookie domain or too large | Check the SecurityPolicy cookie domain covers the instance host |
| `/oauth2/callback` returns 404 | The `/oauth2/` route is missing | Check the route and the redirect URI of the gateway client |
| Nobody reaches a new IDE | Both authz replicas down | Check pods and the PodDisruptionBudget, restart. Open WebSockets stay up |
| JWKS errors in logs | authz cannot reach the identity provider | Check egress policy and DNS |

Never turn authz off or make it fail open to get users in. After any change, request a session URL without cookies and confirm you get a login redirect.

## Gateway backlog

Symptom: new sessions are `Ready` but the URL returns 404 or 503 for a while. Typical during a burst, because every cold session and every pool instance adds an HTTPRoute. Claims change no gateway state.

```bash
kubectl -n <ns> get httproute | wc -l
kubectl -n <ns> get httproute ide-<instance> -o jsonpath='{.status.parents}{"\n"}'
kubectl -n <gateway-ns> get pods
kubectl -n <gateway-ns> logs deploy/envoy-gateway --since=15m | tail -50
```

The route status shows `Accepted` and `ResolvedRefs` when the gateway took it.

| Cause | Sign | Fix |
|---|---|---|
| Too many routes at once | Many `idle_starting`, route `Accepted` lags | Raise `minIdle` stepwise and well before the exam |
| Total route count too high | Hundreds of routes, several deployments on one gateway | Lower `maxInstances` and idle targets |
| Gateway pods short on memory or CPU | Restarts, OOM | Raise the Envoy Gateway resources (cluster admin) |
| Route not accepted | `status.parents` shows a reason | Check `gateway.name`, `gateway.namespace`, `gateway.sectionName` and the listener hostnames |
| 503 while the pod is ready | The Service has no endpoint yet | `kubectl -n <ns> get endpoints ide-<instance>`, wait for readiness |

Never edit routes by hand. The operator reconciles them back.

## Workspace volume lost

Symptom: an `IDEWorkspace` shows `Ready=False` with reason `VolumeLost`. Starting a session on it answers 409 with `workspace-lost`.

Cause: the volume claim of a workspace that held data no longer exists, for example after a manual delete. The operator does not create a new empty claim, because the user would silently lose the old files.

1. Restore the PVC under the name in `status.claimName` (from a snapshot or a PersistentVolume that still exists). The operator sets `Ready=True` again.
2. Or give up the data: `kubectl -n <ns> delete ideworkspace <name>`. The next launch creates a fresh workspace.

## Logs

One JSON line per event on stdout. Raise one component to debug for a short time:

```bash
kubectl -n <ns> set env deploy/<release>-eduide-control-plane-authz LOG_LEVEL=debug
kubectl -n <ns> set env deploy/<release>-eduide-control-plane-authz LOG_LEVEL=info
```

The next `helm upgrade` resets the value. Logs never contain tokens, cookies, launch data values, owner names or e-mail addresses.

## After the incident

Write down what happened, the time window and what fixed it, in an issue of your deployment repository. Check whether an alert or a threshold should change.
