---
title: Upgrades
description: Migrating from EduIDE 2.x to 3.0 by parallel run, and upgrading within 3.x.
---

# Upgrades

Commands use the variables from the [Chart reference](../install/installing.md). Do not upgrade during an exam period.

## Upgrading within 3.x

Order: cluster chart first, then the installation chart of each deployment. On a cluster that runs 3.x next to 2.x, upgrade the `eduide-crds` release with `$EDUIDE_CRDS_CHART` instead of the cluster chart.

```bash
helm upgrade eduide-cluster $EDUIDE_CLUSTER_CHART --version $EDUIDE_VERSION \
  --namespace eduide-system
helm upgrade eduide $EDUIDE_CHART --version $EDUIDE_VERSION \
  --namespace eduide-<deployment> -f values.yaml
```

1. Read the [CHANGELOG](https://github.com/EduIDE/EduIDE-control-plane/blob/main/CHANGELOG.md) of the control plane and the release notes of the installation chart. They state compatibility and new values.
2. Render first: `helm template ... | kubectl diff -f -` or `helm diff upgrade` shows what changes.
3. Upgrade the cluster chart. Changes are additive, and several deployments share the CRDs. Older operators ignore unknown fields.
4. Upgrade one deployment, run the checks from [Installing EduIDE](../install/installing.md#verify), then the next.
5. Running sessions survive an upgrade. The operator and service restart with a rolling update. The service and authz keep serving while Envoy drops them from its endpoints.

Changing IDE images (`images.tag` or a template `tag`) affects new sessions only. Running sessions keep their image.
Image tags that you pin by digest need a new digest per release.

## Migrating from 2.x

EduIDE 3.0 replaces the Java control plane of 2.x (operator, REST service, landing page, per-session login proxy, data bridge, workspace garbage collector, error reporting service) with the Go control plane.
The migration method is a parallel run per deployment: both stacks run side by side, and users move when you say so.
The full procedure is [docs/operations/migration.md](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/operations/migration.md) in the control plane repository. This is the summary.

### Rules

- The old and the new stack use different CRD groups (`theia.cloud` and `eduide.github.io`) and can share a cluster.
- Move test deployments first, then staging, then pilots, then production. Exit criteria steer the order, not the calendar.
- No production deployment moves during an exam period.
- Running sessions are not migrated. They end on the old stack.
- The old stack stays available as a way back until the end of the month after the switch, and gets only security fixes.
- When all deployments run on the new stack, switch off the old stack and its garbage collector.

### Steps per deployment

1. **Prepare.** Install only the CRDs next to the 2.x release (`$EDUIDE_CRDS_CHART`, see the warning in [Installing EduIDE](../install/installing.md#1-cluster-chart-once-per-cluster)). The cluster chart refuses on a cluster that still has Theia Cloud CRDs. Create the Keycloak clients, including the gateway client (it can be the landing page client) with redirect `https://<instance host>/oauth2/callback`. Reserve the three hostnames ([Hostnames and Certificates](../install/certificates.md)). The new hosts differ from the old ones.
2. **Install the new stack** in its own namespace, with its own values. Do not touch the old stack.
3. **Check the IDE images.** They must be 3.0 images: browser only, with the `eduide-session` extension. Older images do not receive launch data. The editions are `<language>-artemis` and `<language>-standalone`. Haskell, OCaml and Swift images no longer exist, and neither do Electron builds.
4. **Smoke test** with test users: a warm and a cold launch, the IDE as owner and as a foreign user (expect 403), and the NetworkPolicy test.
5. **Import saved workspaces** (below).
6. **Switch** the landing page of the institution to the new stack. Watch the [runbooks](../operations/incident-response.md) and the metrics for a day.
7. **Keep the way back.** Workspaces created on the new stack stay in their volumes.
8. **Retire** the old stack of the deployment after the grace period. Only when no 2.x deployment is left on the cluster may the 2.x `eduide-cluster` release go: upgrading it to 3.x needs `allowRemovingTheiaCloud=true` and deletes the Theia CRDs with every 2.x session and workspace.
   The EduIDE CRDs stay in the `eduide-crds` release. Keep upgrading that release and never `helm uninstall` it: that deletes the CRDs and every EduIDE session and workspace. Helm does not take over objects of another release, so moving the CRDs into the cluster chart needs them re-annotated to the new release first.

### Template names change

Application definitions are now templates. The names follow the editions: `java-17` is the Artemis edition, `java-17-standalone` the standalone one.
Artemis links must start the `artemis` edition. Check them after the switch. Old sessions on 2.x names end on the old stack.

### Importing saved workspaces

An `IDEWorkspace` with `persistence.mode: volume` can adopt an existing PVC through `existingClaimName`.
The import sets `status.lastUsed` to the import time, so the adopted data does not expire at once (default retention 14 days).
The operator becomes controller owner of the claim, so the retention deletes the claim together with the workspace. Remove the owner reference from the PVC if the data must outlive the workspace.
The operator looks the claim up in the namespace of the workspace. A PVC of a 2.x namespace must first be recreated in the new namespace on the same volume (set the PV's reclaim policy to `Retain`, then bind a new PVC to it).

For each old workspace:

1. List the PVCs of the old namespace: `kubectl -n <old namespace> get pvc`.
2. Create an `IDEWorkspace` that names the PVC. The workspace name is `w-` plus 16 hex characters (see the [data model](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/architecture/data-model.md)).
3. Check that `status.phase` is `Ready` and `status.claimName` equals the PVC name.

```yaml
apiVersion: eduide.github.io/v1alpha1
kind: IDEWorkspace
metadata:
  name: w-<16 hex>
  labels:
    app.kubernetes.io/managed-by: eduide
spec:
  owner: <user name from the token claim>
  templateRef: <template>
  persistence:
    mode: volume
    existingClaimName: <old PVC name>
```

An import job for all PVCs of a namespace is planned. Until then, import by hand or with a script you have reviewed.
Make sure no old session mounts the PVC before a new session uses it.

### What users notice

- A session URL is `https://<instance host>/<instance id>/`, with a random id.
- Webviews run on one fixed host, `webview.<instance host>`.
- The landing page shows "Your environments" and "Start new" tiles, and File, "Back to Start Page" leads back from the IDE.
- Artemis passes the token in the URL fragment. This needs Artemis pull request [ls1intum/Artemis#14702](https://github.com/ls1intum/Artemis/pull/14702), which is not yet merged upstream. The old `?artemisToken` query is still read during the migration and logged as deprecated.
- Saved workspaces expire after last use, not after their creation date.
