---
title: Cluster Prerequisites
description: Everything that must exist on the cluster before EduIDE is installed, with the commands to put it there.
---

# Cluster Prerequisites

EduIDE does not install its own platform layer. Work through this page first;
`helm install` will otherwise fail, or — worse — succeed and not work.

Everything here is installed **once per cluster**, not once per installation.

## What you need before you start

| | |
|---|---|
| **Kubernetes** | 1.26 or later. Gateway API `v1` and the CRD conversion webhooks both need it |
| **Cluster-admin** | You will install CRDs, ClusterRoles and ClusterIssuers |
| **A LoadBalancer** | Something must give the Gateway an external address — a cloud provider's controller, MetalLB, or equivalent |
| **DNS you can change** | Four records per installation, **one of them a wildcard**. See [Certificates and DNS](certificates.md) — check early that your DNS team permits wildcards |
| **An OIDC provider** | Keycloak is what EduIDE is tested against |

## 1. Gateway API CRDs

EduIDE routes every session through Gateway API. The CRDs are not part of
Kubernetes and must be installed separately.

```bash
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.1/standard-install.yaml
```

Pin the version deliberately rather than tracking latest — a Gateway API major
version bump is a breaking change.

```bash
kubectl get crd gateways.gateway.networking.k8s.io   # should exist
```

## 2. A Gateway controller

The CRDs above are just types; something has to implement them. EduIDE is
developed and tested against **Envoy Gateway**.

```bash
helm install eg oci://docker.io/envoyproxy/gateway-helm \
  --version v1.2.1 -n envoy-gateway-system --create-namespace
kubectl -n envoy-gateway-system rollout status deploy/envoy-gateway
```

Any conformant controller should work, but nothing else has been tried. If you
use another, expect to adjust `gateway.className` in the cluster chart.

```bash
kubectl get gatewayclass    # you should see one, and it should be Accepted
```

## 3. cert-manager — with Gateway API support turned on

```bash
helm repo add jetstack https://charts.jetstack.io && helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --version v1.16.2 \
  --set crds.enabled=true \
  --set config.apiVersion="controller.config.cert-manager.io/v1alpha1" \
  --set config.kind="ControllerConfiguration" \
  --set config.enableGatewayAPI=true
```

:::warning `enableGatewayAPI` is not optional
Without it, cert-manager ignores Gateway resources entirely and your HTTP-01
challenges never complete. If you installed cert-manager earlier without this
flag, upgrade with it and restart the controller:

```bash
kubectl -n cert-manager rollout restart deploy/cert-manager
```
:::

cert-manager also provides the CA injection that EduIDE's CRD conversion webhook
depends on, so it is required even if you bring your own certificates.

```bash
kubectl -n cert-manager get pods    # controller, webhook and cainjector all Running
```

## 4. A storage class

Every session that is not ephemeral gets a PersistentVolumeClaim.

```bash
kubectl get storageclass
```

Requirements:

- **ReadWriteOnce** is sufficient; sessions do not share volumes.
- **Dynamic provisioning** is required — volumes are created on demand as
  students start sessions.
- Volume expansion is not required but is useful.

Note the name; you will set it as `operator.storageClassName`. Do not rely on
the cluster's default class being the one you want.

:::caution More than one default class
If two storage classes are both marked default, a PVC that omits the class gets
an arbitrary one, and you will get inconsistent behaviour that is hard to
attribute. Check with:

```bash
kubectl get storageclass -o custom-columns=NAME:.metadata.name,DEFAULT:.metadata.annotations.'storageclass\.kubernetes\.io/is-default-class'
```
:::

## 5. Node disk for preloaded images

EduIDE preloads every IDE image onto **every node**, so a session starts in
seconds rather than waiting on a multi-gigabyte pull.

Budget accordingly: each IDE image is roughly 0.5–1 GB, and the default set is
eight. Allow **at least 20 GB** of image storage per node, and more if you add
languages. Trim the app list in the tenant values if that is too much — see
[Applications](../platform/app-definitions.md).

## 6. Prometheus Operator — only if you want metrics

EduIDE ships PodMonitors and Grafana dashboards, and they are **off by default**
because they are not portable: they need the Prometheus Operator CRDs, and the
namespaces they target differ per monitoring stack.

```bash
kubectl get crd podmonitors.monitoring.coreos.com
```

If that is absent, leave `monitoring.enabled: false`. Everything else works
without it.

## 7. An OIDC provider

EduIDE authenticates through OIDC, tested against Keycloak. You need:

- A realm your students can authenticate to.
- A **public** client — EduIDE's landing page is a browser application and holds
  no secret.
- Redirect URIs for **all four** of the installation's hostnames. Three is a
  common mistake and breaks webviews specifically.

See [Access Control](../platform/access-control.md) for the full client setup.

You can defer this: an installation can be brought up with
`keycloak.allowUnauthenticated: true` to prove the platform works before wiring
identity. **That installation has no authentication and must not be exposed.**

## Checklist

Before installing EduIDE:

- [ ] Kubernetes 1.26+, cluster-admin
- [ ] Gateway API CRDs installed, pinned
- [ ] A Gateway controller running, GatewayClass `Accepted`
- [ ] cert-manager running, **with `enableGatewayAPI=true`**
- [ ] A storage class chosen, with dynamic provisioning
- [ ] ~20 GB of image space per node
- [ ] DNS you can change, **wildcards permitted**
- [ ] A certificate plan — read [Certificates and DNS](certificates.md) before
      going further, because the wildcard requirement surprises people
- [ ] An OIDC realm and public client, or a deliberate decision to defer

Then continue to [Installing EduIDE](installing.md).
