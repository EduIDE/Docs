---
title: Provisioning
description: Bootstrap guide for deploying a new EduIDE environment from cluster prerequisites to first launch.
---

# Provisioning

This page covers the steps required to bootstrap a new EduIDE environment. It is intended for operators setting up production, staging, or test deployments. The steps must be followed in order because later charts depend on resources installed by earlier ones.

:::note This page describes deployment automation, not installation
If you are installing EduIDE at your own institution, you do not need any of
this — start at [Cluster Prerequisites](../install/prerequisites.md). The
pipeline below is how TUM drives its own installations; the charts are installed
the same way either way.
:::

## How deployments work

All EduIDE environments are deployed through GitHub Actions pipelines defined in
the deployment repository. You do not run Helm commands manually in normal
operation — you trigger or configure the pipeline. For a first install on a new
cluster, or emergency manual intervention, see
[Installing EduIDE](../install/installing.md).

| Workflow | Trigger | Approval |
|---|---|---|
| `deploy.yml` | Reusable; called by the others | Inherited from the environment |
| `deploy-e2e.yml` | Automatic, follows `main` | **None** — an approval gate would block it forever |
| `deploy-staging.yml` | Manual dispatch | Yes |
| `deploy-dispatch.yml` | Manual dispatch, any environment | Yes for `production` and `staging` |
| `deploy-comment.yml` | `/deploy <env>` on a pull request | Yes for `production` and `staging` |
| `bootstrap-cluster.yml` | Manual dispatch, once per cluster | Yes |
| `rollback.yml` | Manual dispatch | Yes |

`e2e-test` is the environment that follows `main` and is tested automatically;
`staging` is the manual one, where a human puts something to look at before it
goes near production. Approval is a property of the GitHub Environment, not of
the workflow — which is why `e2e-test` deliberately has no required reviewers.

The pre-restructure workflows `deploy-production.yml`, `deploy-pr.yml` and
`deploy-theia.yml` no longer exist.

## Where the rest of this page went

Everything that used to follow — a seven-chart install order, `deployments/<domain>/`
values paths, `deploy-production.yml`, and a secrets table — described the
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
