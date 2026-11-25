---
title: Session Hardening
description: What keeps sessions apart from each other and from the cluster, which values control it, and what it does not cover.
---

# Session Hardening

A session is an IDE pod that runs code of a student. Treat it as untrusted. Four layers keep it contained.

## 1. Login and owner check at the gateway

Every request to a session URL passes the gateway. Envoy Gateway runs the OIDC login (SecurityPolicy). Then it asks the `authz` service whether the signed-in user owns this session.
`authz` checks the ID token itself and fails closed: if it is down or unsure, the request is denied. Nobody without a login reaches an IDE, and nobody reaches the session of someone else ([ADR 0005](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0005-session-auth-at-gateway.md)).
There is no login proxy in the session pod.

## 2. The agent is the only door

Every session pod has an agent sidecar. The IDE itself listens only on `127.0.0.1` and has no network port.

| Listener | Reachable from | Protection |
|---|---|---|
| Proxy, port 8080 | The Envoy pods only | Needs the instance token header, which the route sets. The agent removes it before the request reaches the IDE |
| Control, port 8081 | The operator only | Bearer instance token. Health probes without auth for the kubelet |
| Local, `127.0.0.1:8082` | The `eduide-session` extension in the same pod | Loopback only |

The instance token is 32 random bytes per pod. Admins and the operator can read it in the route and in the Secret ([ADR 0006](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0006-agent-sidecar.md)). Limit who has Kubernetes access to the namespace.
The agent strips the gateway login cookies and moves IDE cookies below the session path, so one IDE cannot overwrite the cookies of another.

## 3. Network isolation

NetworkPolicies are part of the chart ([ADR 0019](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0019-network-isolation.md)):

- Default deny for ingress in the namespace.
- Session pods accept traffic on the proxy port only from Envoy, and on the control port only from the operator. No rule allows traffic between session pods.
- Session egress: DNS to `kube-system` and the internet, without private and link-local ranges (`networkPolicy.sessionEgressDeny`). Add the pod and node ranges of your cluster to `sessionEgressExtraDeny` if they are public, also IPv6. `sessionEgress` replaces the default.
- No Role grants `pods/exec`, `pods/attach`, `pods/portforward` or `*` rules.

This works only if the CNI enforces NetworkPolicies. Run the smoke test from [Installing EduIDE](../install/installing.md#verify) after every installation and CNI change. If a cluster does not enforce policies, do not release the deployment.

## 4. Launch data is an allowlist

Users and Artemis pass data to a session, such as a repository URL or a token ([ADR 0012](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/adr/0012-user-data-secrets-allowlist.md)). The rules:

- Each template lists the keys it accepts and a format per key. Unknown keys are rejected. There is no way to reference a Secret or ConfigMap from a request.
- `GIT_URI` and `ARTEMIS_URL` must be `https` and their host must be in `config.allowedHosts`.
- User name and e-mail come from the verified token, not from the request.
- The service writes the data into a Secret owned by the session. The operator pushes it once to the agent, which keeps it in memory. It never appears in the object spec, logs, traces, metrics or status.
- A repository URL with credentials (the Artemis case) is accepted only for keys with `allowCredentials`, set through `templateDefaults.gitUriAllowCredentials` for templates that Artemis opens.

Encryption of Secrets at rest in etcd is a cluster setting. Turn it on.

## Other values that matter

| Value | Effect |
|---|---|
| `sessionsPerUser`, `workspaces.perUser`, `rateLimit.launchesPerMinute` | Bound what one user can consume |
| `templateDefaults.runAsUser` | IDE images run as an unprivileged user (101) |
| `templateDefaults.resources` | CPU and memory limits per session |
| Template `bandwidth` | Ingress and egress bandwidth annotations |
| `config.security.hstsIncludeSubdomains` | HSTS for the service host |

## What this does not cover

- A student can use the internet from a session, within the egress rules. Add a stricter `sessionEgress` for exams if needed.
- Anyone with `get` on Secrets in the namespace can read launch data and instance tokens.
- A node compromise is a cluster problem. Use dedicated node pools for sessions (`placement.nodeSelector`).
