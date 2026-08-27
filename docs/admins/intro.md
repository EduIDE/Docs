---
title: Admin Overview
description: Entry point for anyone deploying and operating EduIDE, at TUM or anywhere else.
---

# Admin Overview

This section is for whoever runs EduIDE: installing it, keeping it up, and
handing out access. It assumes cluster-admin on a Kubernetes cluster and admin
rights in an identity provider.

EduIDE is not TUM-specific software. It is installed the same way anywhere, with
two Helm charts and no dependency on TUM's automation. Where a page uses a TUM
hostname or realm name it is an example, and is marked as one.

If you are building on or extending EduIDE rather than running it, see the
[Developer](/developer/intro) section.

## Installing it for the first time

In this order. The first two are the ones that surprise people.

1. **[Cluster Prerequisites](install/prerequisites.md)** — Gateway API,
   a Gateway controller, cert-manager with Gateway support, storage, node disk.
2. **[Certificates and DNS](install/certificates.md)** — four hostnames per
   installation, one of them a wildcard that ACME cannot issue over HTTP-01.
   **Read this early**; it often needs a request to another team.
3. **[Installing EduIDE](install/installing.md)** — the two charts.
4. **[Access Control](platform/access-control.md)** — the identity provider.
5. **[Adding an Installation](install/adding-an-installation.md)** — for the
   second and subsequent ones on the same cluster.

## How it is put together

Two charts, because the two halves have different cardinality.

| Chart | Installed | Owns |
|---|---|---|
| `eduide-cluster` | once per **cluster**, into `eduide-system` | CRDs, the conversion webhook, ClusterRoles, cert-manager issuers, the shared Gateway, PodMonitors and dashboards |
| `eduide` | once per **installation**, into its own namespace | the operator, the REST service, the landing page, routes, app definitions, image preloading |

An **installation** is one namespace on one cluster with its own hostnames,
branding and identity provider. There is no fixed set of environments: you might
run one, or a test and a production one, or one per department. Namespaces are
conventionally `eduide-<name>`.

Sessions are routed with **Gateway API** — a shared Gateway per cluster, and an
HTTPRoute per installation attaching to it by listener name.

:::note The `theia.cloud` API group
The custom resources are `appdefinitions.theia.cloud`, `sessions.theia.cloud`
and `workspaces.theia.cloud`. The `theia.cloud` group name is historical and has
not been renamed, because renaming an API group is a migration. Do not grep for
`eduide` and conclude the CRDs are missing.
:::

## Running it

| | |
|---|---|
| [Session Management](operations/session-management.md) | Sessions, limits, and what times them out |
| [Storage and Quotas](platform/storage-and-quotas.md) | Volumes, sizing, namespace quotas |
| [Garbage Collection](operations/garbage-collection.md) | How old workspaces are reclaimed |
| [App Definitions](platform/app-definitions.md) | Which languages and templates are offered |
| [Monitoring](operations/monitoring-basics.md) | Metrics, and what EduIDE actually exposes |
| [Incident Response](operations/incident-response.md) | Runbooks, including routing and certificate failures |

## Changing versions

| | |
|---|---|
| [Release and Version Policy](maintenance/release-policy.md) | What a version number means here |
| [Upgrades](maintenance/upgrades.md) | Moving an installation to a new version |
| [Rollback](maintenance/rollback.md) | Undoing a deploy that succeeded and behaves badly |

## Security

| | |
|---|---|
| [Access Control](platform/access-control.md) | The identity provider and the session proxy |
| [Admin API Tokens](security/admin-api-tokens.md) | The bearer token for the scaling API |
| [Audit and Compliance](security/audit-and-compliance.md) | What is logged, retention, decommissioning |

## Deployment automation

[Provisioning](platform/provisioning.md) describes the GitHub Actions pipeline
TUM uses. You do not need it — the charts install identically by hand — but it
is a working example if you want to automate the same way.
