---
title: Admin Overview
description: Entry point for platform operators and administrators of EduIDE.
---

# Admin Overview

This section is for platform operators and administrators responsible for deploying, configuring, and maintaining EduIDE.

Admin concerns are kept separate from instructor, student, and developer sections because they involve cluster-level access, service secrets, identity provider configuration, and infrastructure lifecycle decisions that are irrelevant to end users and should not be mixed with usage or development guidance.

:::info TUM-specific deployment details
This page sometimes uses TUM-specific environment names, domains, and operational examples to describe the current EduIDE rollout. EduIDE itself is an independent product and can be deployed and operated for any institution with its own infrastructure and policies.
:::

## Who this section is for

This section assumes you have:

- Kubernetes cluster access (`kubectl` and Helm)
- Admin permissions in the Keycloak realm
- Access to the deployment repository and GitHub environment secrets
- Familiarity with the three EduIDE deployment environments (production, staging, test)

If you are an engineer building on or extending EduIDE, see the [Developer](/developer/intro) section instead.

## What lives here

### Platform

Core setup and ongoing configuration of the platform.

- [Provisioning](/admins/platform/provisioning) — bootstrapping a new environment from cluster prerequisites through first launch
- [Access Control](/admins/platform/access-control) — Keycloak client setup, admin group assignment, and access reviews
- [App Definitions](/admins/platform/app-definitions) — managing launchable IDE session types and their scaling parameters
- [Storage and Quotas](/admins/platform/storage-and-quotas) — persistent volume sizing, storage classes, and per-namespace resource limits

### Operations

Keeping the platform running and responding when it does not.

- [Monitoring Basics](/admins/operations/monitoring-basics) — signals, dashboards, alert thresholds, and health check cadence
- [Incident Response](/admins/operations/incident-response) — runbooks for the most common incident classes
- [Session Management](/admins/operations/session-management) — admin-level oversight of active and stuck sessions
- [Garbage Collection](/admins/operations/garbage-collection) — workspace TTL configuration and cleanup operations

### Security

Admin API protection and compliance practices.

- [Admin API Tokens](/admins/security/admin-api-tokens) — token issuance, rotation, and request authentication
- [Audit and Compliance](/admins/security/audit-and-compliance) — what is logged, retention policy, and access review checklist

### Maintenance

Planned operational procedures.

- [Upgrades](/admins/maintenance/upgrades) — upgrading the EduIDE Cloud service, operator, and supporting charts

## Environments

EduIDE runs three deployment environments:

| Environment | Namespace | Domain | Deploy trigger |
|---|---|---|---|
| Production | `theia-prod` | `theia.artemis.cit.tum.de` | Manual with approval |
| Staging | `theia-staging` | `theia-staging.artemis.cit.tum.de` | Push to main |
| Test | `test1` | `test1.theia-test.artemis.cit.tum.de` | PR push with approval |

Most admin procedures apply to all three environments. Where behavior differs, it is called out explicitly.
