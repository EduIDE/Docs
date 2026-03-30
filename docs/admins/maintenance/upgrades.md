---
title: Upgrades
description: Procedures for upgrading EduIDE Cloud charts, the operator, and supporting components.
---

# Upgrades

EduIDE releases new versions approximately every three months. This page covers how to upgrade the platform components, what to check before and after an upgrade, and how to roll back if needed.

## Release cadence and versioning

EduIDE uses a three-month release cycle. Between releases, chart versions carry a `-next.X` suffix (e.g., `1.2.0-next.2`). At release time:
- The `-next` suffix is dropped.
- All image tags are pinned to specific SHAs.
- After release, the version is bumped and `-next.0` is added for the next cycle.

In production, always deploy pinned release versions, never floating tags like `latest`.

## How upgrades are deployed

Upgrades go through the same GitHub Actions pipelines as all other deployments. To upgrade an environment:

1. Update the chart versions and image tags in the environment's values files in the deployment repository.
2. Commit and push (staging) or trigger the workflow manually (production).
3. The pipeline runs all chart upgrades in the correct order and waits for each rollout to complete.

**Always upgrade staging before production.** The staging pipeline runs automatically on push to main, making it the natural first target.

The underlying commands the pipeline executes are documented in the steps below — they are useful for understanding what happens and for emergency manual intervention when the pipeline is unavailable.

## Pre-upgrade checklist

Before merging an upgrade to production:

- [ ] The upgrade has been deployed to staging and verified stable.
- [ ] Release notes have been checked for breaking changes, especially CRD schema changes.
- [ ] No large cohort exercise is in progress (an upgrade restarts pods, briefly queuing launches).
- [ ] Current chart versions are noted: `helm list -n theia-prod`
- [ ] Values files are committed and reviewed.

## Upgrade order

The pipeline respects this order. CRDs and cluster-scoped resources must come before environment-scoped resources.

1. `theia-cloud-crds`
2. `theia-cloud-base`
3. `theia-cloud-combined` (service + operator + landing page)
4. `theia-appdefinitions`
5. `theia-certificates`
6. `theia-monitoring`
7. `theia-workspace-garbage-collector`

## CRD upgrades

CRDs must be upgraded before the operator because the operator validates resources against the CRD schema at startup.

After any CRD upgrade, verify that existing custom resources are still valid before proceeding:

```bash
kubectl get workspaces -n theia-prod
kubectl get sessions -n theia-prod
```

If resources show validation errors, do not proceed until they are resolved.

## App Definition image upgrades

When new IDE images are released, update the image tags in the environment's `appdefinitions.yaml` values file and deploy via the pipeline.

After the upgrade, the operator replaces pre-warmed sessions with the new image. **Existing running sessions are not affected** — they continue on the old image until they are stopped and restarted by the user.

## Checking rollout status

After the pipeline completes, verify the rollout:

```bash
kubectl rollout status deployment/operator -n theia-prod
kubectl rollout status deployment/service -n theia-prod
kubectl get pods -n theia-prod
```

## Post-upgrade validation

- [ ] All pods in `theia-prod` are `Running`: `kubectl get pods -n theia-prod`
- [ ] Service admin ping responds: `GET /service/admin/{appId}` with `X-Admin-Api-Token`
- [ ] A test session can be launched and connects to the IDE
- [ ] Grafana dashboards show data for the namespace
- [ ] App Definition scaling values are intact: `GET /service/admin/appdefinition`

## Rolling back

If an upgrade introduces a regression, roll back via Helm:

```bash
# Check release history
helm history theia-cloud -n theia-prod

# Roll back to a previous revision
helm rollback theia-cloud <revision-number> -n theia-prod
```

For CRD rollbacks, Helm does not manage this automatically. If a CRD schema change is incompatible with running resources, you may need to manually apply the previous CRD version from the deployment repository:

```bash
kubectl apply -f charts/theia-cloud-crds/templates/
```

This is rare and only necessary when the CRD schema changed in a breaking way.

## Upgrading Keycloak

Keycloak is managed separately from the EduIDE charts. If a Keycloak upgrade is required:

1. Coordinate with the identity provider admin team.
2. Test authentication in the staging environment after the upgrade.
3. Verify that all three token claim mappers (username, audience, groups) still work correctly.
4. Confirm OAuth2 proxy compatibility with the new Keycloak version.

## Image tag pinning

Production values files pin all images to specific SHA-based tags (e.g., `latest-e431a13`). When updating images:

1. Identify the new image SHA from the release or container registry.
2. Update the tag in the relevant values file in the deployment repository.
3. Deploy via the pipeline.

Never use `latest` or branch-based tags in production — they change without a deployment, causing invisible configuration drift.
