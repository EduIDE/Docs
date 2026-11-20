---
title: Cluster Prerequisites
description: What must exist on the cluster before EduIDE is installed.
---

# Cluster Prerequisites

Check `kubectl config current-context` before you run anything. Never install into a cluster you did not choose on purpose.

| Item | Requirement |
|---|---|
| Kubernetes | A version with CEL validation in CRDs and Gateway API support. |
| Envoy Gateway | Version 1.8 or newer. EduIDE uses the Gateway API only; there is no Ingress path. |
| cert-manager | With Gateway API support enabled, so the Gateway annotations issue certificates. |
| CNI | Enforces NetworkPolicies. See below. |
| OIDC provider | One realm per deployment. [Keycloak](installing.md#keycloak) is the worked example. |
| Storage | A StorageClass for saved workspaces. Optional if you only offer temporary workspaces. |
| Prometheus | Optional. Needed for the pool scaler, the admin panel figures and the alerts. |
| Jaeger or another OTLP collector | Optional. Needed for launch traces. |
| DNS and certificates | Three hostnames, see [Hostnames and Certificates](certificates.md). |

## Envoy Gateway

The chart can render the `Gateway` for you (`gateway.create`). With your own Gateway, give it listeners for the service host, the instance host and the webview host.
Allow routes only from the deployment namespace (`allowedRoutes.namespaces`).
A route from another namespace on the instance host would receive the login cookies of your users.

## NetworkPolicies are not optional

Session isolation depends on a CNI that enforces NetworkPolicies ([Session Hardening](../security/session-hardening.md)).
Test it before you release a deployment, as described in [Installing EduIDE](installing.md#verify).
If nodes, the API server or the pod network have public addresses (also IPv6), add those ranges to `networkPolicy.sessionEgressExtraDeny`.
Otherwise a session could reach them.

## Cluster versus deployment

| Scope | What | Installed |
|---|---|---|
| Cluster | The CRDs | Once per cluster, with the cluster chart |
| Deployment | Control plane, landing page, Gateway, templates | Once per deployment, in its own namespace |

Several deployments in one cluster share the CRDs. Use the newest cluster chart version in the cluster.
