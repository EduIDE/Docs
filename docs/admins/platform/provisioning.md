---
title: Provisioning
description: Bootstrap guide for deploying a new EduIDE environment from cluster prerequisites to first launch.
---

# Provisioning

This page covers the steps required to bootstrap a new EduIDE environment. It is intended for operators setting up production, staging, or test deployments.

:::note This page describes deployment automation, not installation
If you are installing EduIDE at your own institution, you do not need any of
this - start at [Cluster Prerequisites](../install/prerequisites.md). The
pipeline below is how TUM drives its own installations; the charts are installed
the same way either way.
:::

## How deployments work

All EduIDE environments are deployed through GitHub Actions pipelines defined in
the deployment repository. You do not run Helm commands manually in normal
operation - you trigger or configure the pipeline. For a first install on a new
cluster, or emergency manual intervention, see
[Installing EduIDE](../install/installing.md).

| Workflow | Trigger | Approval |
|---|---|---|
| `deploy.yml` | Reusable; called by the others | Inherited from the environment |
| `deploy-e2e.yml` | Push to `main` and `repository_dispatch` `component-main-updated`; runs the functional tests | **None** - an approval gate would block it forever |
| `deploy-staging.yml` | Manual dispatch, and `repository_dispatch` `staging-deploy-request` | Yes |
| `deploy-dispatch.yml` (`Deploy environment`) | Manual dispatch, any environment. Inputs: `environment`, `chart_version`, `control_plane_tag`, `ide_tag`, `landing_page_tag`, `clean_install`, `dry_run` | Yes for `production` and `staging` |
| `deploy-comment.yml` | `repository_dispatch` sent by a component repository after a `/deploy <env>` comment from someone with write access; refuses production | Inherited from the environment |
| `validate.yml` | Pull requests and `main` | None, validates manifests and values |
| `bootstrap-cluster.yml` | Manual dispatch, once per cluster | Yes |
| `rollback.yml` | Manual dispatch | Yes |

`e2e-test` is the environment that follows `main` and is tested automatically;
`staging` is the manual one, where a human puts something to look at before it
goes near production. Approval is a property of the GitHub Environment, not of
the workflow - which is why `e2e-test` deliberately has no required reviewers.

The pre-restructure workflows `deploy-production.yml`, `deploy-pr.yml` and
`deploy-theia.yml` no longer exist.

## Where the rest of this page went

Everything that used to follow - a seven-chart install order, `deployments/<domain>/`
values paths, `deploy-production.yml`, and a secrets table - described the
platform before the 2.0.0 restructure. Every chart it named has been deleted and
every command it gave would fail.

It has been replaced by pages that are kept in step with the charts:

| For | See |
|---|---|
| What must exist on the cluster first, with commands | [Cluster Prerequisites](../install/prerequisites.md) |
| DNS, the wildcard requirement, and getting certificates | [Certificates and DNS](../install/certificates.md) |
| Installing both charts | [Installing EduIDE](../install/installing.md) |
| Adding a second or third installation | [Adding an Installation](../install/adding-an-installation.md) |
| Identity provider setup | [Access Control](access-control.md) |
| Moving to a new version | [Release and Version Policy](../maintenance/release-policy.md) |
| Undoing a bad deploy | [Rollback](../maintenance/rollback.md) |
