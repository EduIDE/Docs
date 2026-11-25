---
title: Admin Overview
description: What an admin runs for EduIDE 3.0, how the parts fit together, and the order in which to read this section.
---

# Admin Overview

This section is for whoever runs EduIDE: installing it, keeping it up, and handing out access.
It assumes cluster-admin on a Kubernetes cluster and admin rights in an OIDC identity provider.
EduIDE is not tied to one institution. Hosts, realms and node labels belong in your values, never in the charts.

Terms such as template, session and workspace are defined in the [glossary](/glossary).

## What you run

One EduIDE deployment is one namespace. It contains the Go control plane and a landing page:

| Part | What it does |
|---|---|
| `operator` | Reconciles templates, pools, workspaces and sessions. Starts and stops IDE pods, keeps pools, deletes expired workspaces. |
| `service` | REST API under `/api/v1` and the read-only admin API. Validates launches and writes the launch data Secret. |
| `authz` | Answers the gateway's ext_authz check: may this user open this session? |
| `agent` | Sidecar in every session pod. The only door into the pod. |
| `pool-scaler` | Optional. Sets the number of idle instances per pool from demand. |
| Landing page | Web page with "Your sessions" and the "Start new" tiles, the admin panel and the public status page. |

Around it you need Envoy Gateway, an OIDC provider (Keycloak is the example), cert-manager for certificates, and optionally Prometheus, Grafana and Jaeger.
Sessions, templates, pools and workspaces are Kubernetes objects (`IDESession`, `IDETemplate`, `IDEPool`, `IDEWorkspace` in the group `eduide.github.io/v1alpha1`).
There is no database.

![Deployment diagram: one EduIDE deployment with its gateway, control plane, landing page and session pods on a cluster](/img/architecture/deployment.svg)

![Component diagram: the subsystems of EduIDE, the landing page, the control plane, the session pod and the external services they use](/img/architecture/components.svg)

## Replacing the 2.x stack

EduIDE 3.0 replaces the Java control plane of 2.x with this one.
The old operator, REST service, landing page, per-session login proxy, data bridge, workspace garbage collector and error reporting service are gone.
Moving an existing installation is a migration with a parallel run, see [Upgrades](maintenance/upgrades.md).

## Reading path

1. [Prerequisites](install/prerequisites.md) and [Hostnames and Certificates](install/certificates.md): what the cluster needs.
2. [Installing EduIDE](install/installing.md): charts, values and Keycloak clients.
3. [Templates and Pools](platform/templates-and-pools.md) and [Storage and Workspaces](platform/storage-and-workspaces.md): what users can start and what is kept.
4. [Access Control](platform/access-control.md) and [Admin Access](security/admin-access.md): who may do what.
5. [Monitoring](operations/monitoring-basics.md) and [Incident Response](operations/incident-response.md): run it.
6. [Upgrades](maintenance/upgrades.md), [Rollback](maintenance/rollback.md) and the [Release Policy](maintenance/release-policy.md): keep it current.

Adding a second course or department: [Adding an Installation](install/adding-an-installation.md).

:::note Artemis links
Starting an IDE from Artemis passes the token and the repository URL in the URL fragment.
This needs Artemis pull request [ls1intum/Artemis#14702](https://github.com/ls1intum/Artemis/pull/14702), which is not yet merged upstream.
:::

The control plane repository, [EduIDE-control-plane](https://github.com/EduIDE/EduIDE-control-plane), holds the architecture notes, the decisions (ADRs) and the runbooks this section summarizes.
