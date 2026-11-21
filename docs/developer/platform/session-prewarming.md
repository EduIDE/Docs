---
title: Session Prewarming
description: How warm pools, the claim protocol and the pool scaler make a session start in a fraction of a second.
---

# Session Prewarming

Prewarming keeps idle IDE pods ready, so a launch only has to claim one. Image pull, scheduling and container start happen before the launch spike. This matters in teaching, where many students open the same exercise within a few minutes.

## Start strategies

The operator picks one of three strategies per session and records it in `status.startStrategy`.

| Strategy | When |
| --- | --- |
| `warm-ready` | An idle, ready instance of the template's pool exists and the session has no workspace |
| `warm-starting` | No ready instance, but an idle one is still starting, so the session waits for it |
| `cold` | No pool, no idle instance, or the session has a saved workspace |

A saved workspace (`volume`) always starts cold, because Kubernetes cannot attach a volume to a running pod. A pool serves temporary workspaces (`none`) only. Under capacity pressure a claim does not wait for idle pods.

Measured on a test deployment, a warm start reaches `Ready` in about 100 ms and a cold start in 3 to 5 seconds with prepulled images. The IDE then still loads in the browser. The warm target is below 2 seconds at the 95th percentile until the IDE is reachable, and the cold target is below 30 seconds.

## Pools

An `IDEPool` belongs to one template. Helm owns the template and the pool scaler owns the idle target, so no field has two owners.

| Field | Owner | Meaning |
| --- | --- | --- |
| `minIdle` | Helm | Floor of idle instances |
| `targetIdle` | pool scaler | Current wish for idle instances |
| `maxInstances` | Helm | Upper limit for idle and claimed instances together |

The operator keeps `max(minIdle, targetIdle)` idle instances, limited by `maxInstances` minus the claimed ones. It keeps none while the pool is under capacity pressure.

Pool instances are bare pods, not Deployments. Each carries a hash of the template spec, the agent image and the placement. The pool replaces idle pods whose hash changed and never touches claimed pods. Each instance already has its Service, its route and its token Secret, so a claim changes labels only and the gateway does not change.

## Claim protocol

The claim is lock-free. The Kubernetes API server is the arbiter ([ADR 0009](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0009-claim-protocol.md)).

1. The service creates the `IDESession` and the launch data Secret.
2. The session controller picks the oldest ready idle pod of the pool from its cache.
3. It patches the pod labels (`state=claimed`, session and owner hash) with the pod's `resourceVersion` as precondition.
4. A conflict means another worker won. The controller takes the next candidate. There are no locks and no double assignment.
5. After a successful patch the operator sends one `POST /v1/claim` to the agent with the launch data. The agent keeps it in memory.
6. When the agent answers, the operator sets the phase `Ready` and `status.url`. `authz` sees it and lets the owner in.
7. The pool controller refills the idle pods.

The claim is idempotent. A repeated reconcile finds the label and continues from there. The agent accepts the same session twice and answers 409 for another one. Results count in `eduide_claim_total` as `claimed`, `conflict` and `empty`.

If no idle pod exists, the session starts cold or waits for an idle pod that is still starting.

## The pool scaler

The pool scaler decides how many idle instances each pool keeps. It writes `spec.targetIdle` through the `/scale` subresource of the pool, and the operator does the rest. Without the scaler `targetIdle` stays where it is and `minIdle` is the floor.

The scaler runs several strategies each round. One is active and the others run in shadow, so you can compare them before you switch:

| Strategy | Recommends |
| --- | --- |
| `static` | A fixed value per pool |
| `reactive` | Recent claim rate times the p95 pod ready time, with a safety factor |
| `predictive` | A weekly profile of claims plus an uplift around known events |
| `decision-model` | A probability per demand level from an external decision model |

Guardrails apply to every strategy: floor and ceiling, step limits, cooldown and a fallback chain. When the scaler cannot see the pools, it changes nothing. For every change it writes an event on the pool (`ScaledUp`, `ScaledDown`, `Held`), and the admin panel shows these events. See the [pool scaler README](https://github.com/EduIDE/EduIDE-control-plane/blob/main/pool-scaler/README.md) for the configuration.

## Capacity pressure

When a session pod cannot be scheduled for lack of room or quota, the operator deletes the oldest idle pod of any pool in the same node pool and holds those pools at zero idle instances while the pressure lasts. After 45 seconds (`capacity.exhaustedAfter`) without room, the session fails with `capacity-exhausted`. See [ADR 0008](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0008-idepool-scale-bare-pods.md) and the [pool-empty runbook](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/operations/pool-empty.md).

## Launch data reaches the IDE

The data path is the same for warm and cold pods. The operator pushes the launch data to the agent with the claim. The `eduide-session` extension in the IDE long-polls the agent on `127.0.0.1:8082` and keeps the data in memory. Other extensions read it through two commands that keep the names of the old data injection extension:

- `dataBridge.getEnv(keys)` returns the requested keys that are set, or an empty object before the claim.
- `dataBridge.getEnvState()` returns `injected` and the environment. `injected` is true once the session is claimed.

Scorpio uses them to clone the repository and the Artemis extension uses them to sign in. The extension also reports start milestones to the agent, so the operator can add them to the launch trace. See the [extension README](https://github.com/EduIDE/EduIDE-control-plane/blob/main/extensions/eduide-session/README.md).
