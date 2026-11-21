---
title: Architecture
description: How the EduIDE control plane starts browser IDE sessions on Kubernetes, who may open them, and where each part runs.
---

# Architecture

EduIDE runs a **browser IDE session** for each user as an isolated pod in Kubernetes. The **control plane** starts the right IDE for the right user, exposes it under a URL, attaches storage where needed and ends the session when it is no longer wanted.

The control plane lives in [EduIDE-control-plane](https://github.com/EduIDE/EduIDE-control-plane). One deployment (one namespace, for example a course or an exam) runs its own operator, service and authz. Deployments share nothing.

## Components

![UML component diagram of the EduIDE control plane: subsystems, their components and the services they provide and require](/img/architecture/components.svg)

| Component | Role |
| --- | --- |
| **operator** | Reconciles the custom resources `IDETemplate`, `IDEPool`, `IDESession` and `IDEWorkspace`. Owns pods, services, routes, token Secrets and volumes. Claims prewarmed instances, enforces timeouts and capacity. One active replica. |
| **service** | REST API `/api/v1` for the landing page and integrations. Verifies the OIDC token, validates launch data against the template allowlist and creates the session. Streams progress as Server-Sent Events. Creates no pods. |
| **authz** | Envoy ext_authz service. Lets only the owner of a `Ready` session reach its IDE. Fails closed. |
| **agent** | Sidecar in every session pod and the only door into it. Checks the instance token, holds the launch data in memory and reports activity. |
| **pool scaler** | Sets how many idle IDEs each warm pool keeps ready. |
| **landing page** | Start tiles, "Your environments" overview, public status page and the read-only admin panel. |
| **`eduide-session`** | IDE extension. Reads the launch data from the agent on the loopback interface and sends activity heartbeats. It replaces the old data injection and session monitor extensions. |

External systems are Envoy Gateway (version 1.8 or newer), an OIDC provider such as Keycloak and the Kubernetes API. Artemis opens the landing page with a link, see [External Session Launch](./external-integration).

## Domain objects

![UML object model of the EduIDE control plane: templates, pools, workspaces and sessions with their relations](/img/architecture/object-model.svg)

The API group is `eduide.github.io`, version `v1alpha1`.

| Object | Role |
| --- | --- |
| `IDETemplate` | A kind of IDE: image, resources, timeouts, persistence, allowed launch keys. `listed: true` shows it as a start tile, `listed: false` hides it (reachable by name from Artemis links and the API). |
| `IDEPool` | Optional warm pool of idle instances of one template. See [Session Prewarming](./session-prewarming). |
| `IDEWorkspace` | A saved workspace: the files of one user on a volume. It is deleted a set time after last use (`retention`, 14 days by default, per deployment, template or workspace). |
| `IDESession` | One running IDE of one user. Phases are `Pending`, `Starting`, `Ready` and `Failed`. |

Persistence is `none` (temporary workspace, starts from scratch) or `volume` (saved workspace). The service writes intent as custom resources and the operator turns it into pods, routes and volumes.

The full field list is in the [data model](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/architecture/data-model.md).

## Deployment

![UML deployment diagram of the EduIDE control plane: browser, identity provider, Artemis, the Envoy Gateway and the pods of one deployment namespace](/img/architecture/deployment.svg)

A deployment serves three host names:

| Host | Serves |
| --- | --- |
| service (landing page) host | The landing page on `/` and the API on `/api/` |
| instance host | One route per session, `https://<instance host>/<instance>/` with a random instance id |
| webview host | Webviews and the mini browser, one fixed name, by default `webview.<instance host>` |

Each host needs one certificate for its own name. A session never needs a certificate of its own.

## Access to a session

The Envoy Gateway enforces the login and the owner check before a request reaches a pod:

1. A `SecurityPolicy` runs the OIDC login against the identity provider.
2. `authz` allows a request only if the first path segment is a `Ready` session of the logged-in user. Everything else gets 403.
3. The route adds the instance token header. The agent forwards a request to the IDE only with a valid token.
4. NetworkPolicies deny all other traffic into the session pod. The IDE listens on `127.0.0.1` only, so the agent is the only way in.

When a session ends, it leaves `Ready` first. `authz` then denies at once, and the operator discards the pod after that.

Details are in [session access](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/architecture/session-access.md).

## Launch data

A launch can carry the repository URL and the Artemis token. The service accepts only keys on the template allowlist and checks each value. It stores the data in one Secret that belongs to the session. The operator sends it once to the agent, which keeps it in memory. It never appears in custom resource specs, logs, traces, metrics or status. See [External Session Launch](./external-integration#allowlist).

## Observability

The control plane exports Prometheus metrics and OpenTelemetry traces. A launch is one trace from the click to the usable IDE. The chart ships alerts and a Grafana dashboard. See the [metrics contract](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/contracts/metrics.md) and the [tracing guide](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/operations/tracing.md).

## Where to read next

- [Session Prewarming](./session-prewarming): warm and cold start, claim protocol, pool scaler
- [Session Lifecycle and Ending](./session-lifecycle): timeouts, activity, expiry of workspaces
- [API Specification](./api-specification): the REST API
- [Architecture decisions (ADRs)](https://github.com/EduIDE/EduIDE-control-plane/tree/main/docs/adr)
