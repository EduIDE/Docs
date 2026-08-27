---
title: Garbage Collection
description: Workspace TTL configuration, cleanup scheduling, and manual reclamation procedures.
---

# Garbage Collection

The workspace garbage collector periodically deletes workspaces that have exceeded their configured time-to-live. Without it, workspaces accumulate indefinitely, consuming PVC quota and storage capacity.

:::note Placeholders on this page

Each EduIDE installation lives in its own namespace, named `eduide-<name>` by convention (`eduide-staging`, `eduide-cs101`, and so on). Commands below use `-n <namespace>` - substitute your installation's namespace. `eduide` is the conventional Helm release name for an installation.

:::

## Where it lives

The garbage collector is a **conditional subchart of the `eduide` chart**, not a separately installed component. It is declared as a chart dependency named `theia-workspace-garbage-collector`, gated on `theia-workspace-garbage-collector.enabled`, which the `eduide` chart defaults to `true`.

This has two consequences that drive everything else on this page:

1. **You do not install it.** It comes and goes with the installation's `helm upgrade`. There is no separate release to manage.
2. **Its values must be nested** under a top-level `theia-workspace-garbage-collector:` key in the installation values file. That is how Helm passes values to a subchart, and the key must match the dependency name exactly. A bare top-level `env:` block is not an error - Helm accepts it, the subchart never sees it, and the garbage collector runs with its defaults. This fails silently, so check the running configuration after any change (see [Verifying the running configuration](#verifying-the-running-configuration)).

The Kubernetes objects it creates in the installation namespace:

| Object | Name |
|---|---|
| Deployment | `garbage-collector` |
| Pod label | `app: theia-workspace-garbage-collector` |
| Container | `garbage-collector` |
| ServiceAccount | `garbage-collector-sa` |

The Deployment name and the pod label are different strings. Log selectors use the label; `rollout` commands use the Deployment name.

### About the pinned image

The image is pinned to a **commit SHA** rather than a version tag:

```yaml
theia-workspace-garbage-collector:
  image:
    tag: "599557839e5c5893eb0c20785dac671ae70f7e8a"
```

The garbage collector's own repository has never cut a release, so its registry holds only `latest`, `main` and per-commit SHAs. Its own chart defaults to `latest`, which would mean two installs of the same EduIDE version could get different garbage collector builds, and `helm upgrade` would see no diff when the image changed underneath it. The pin exists to make an install reproducible.

If you fork or rebuild the garbage collector, override the tag in your installation values rather than editing the chart. Expect this pin to be replaced by a semver tag once that repository publishes releases.

## How it works

The garbage collector runs as a loop inside the cluster. On each tick:

1. It lists all workspace custom resources in the configured namespace.
2. For each workspace, it compares the workspace's `creationTimestamp` against the current time.
3. If the workspace age exceeds `WORKSPACE_TTL`, the workspace resource is deleted.
4. Deletion of the workspace resource triggers the operator to clean up associated Kubernetes resources, including the PVC (depending on the storage class reclaim policy).

The garbage collector operates on **creation time, not last-use time**. A workspace created 14 days ago will be deleted regardless of whether a session was active in it five minutes ago. This is a known limitation of the current implementation and the single most important thing to understand before choosing a TTL: the TTL is a hard lifespan for the workspace, not an idle timeout.

At startup, the garbage collector prints its configuration:

```
Starting garbage collector...
- Namespace: <namespace>
- Check interval: 30m0s
- Workspace TTL: 336h0m0s
```

## Configuration

The garbage collector is configured through environment variables, which the subchart builds from a **map** under `env`:

| Variable | Source | Default | Description |
|---|---|---|---|
| `K8S_NAMESPACE` | the Helm release namespace | - | The namespace to watch. **Not configurable** - the subchart always sets it to the release namespace, which is the installation's own namespace |
| `WORKSPACE_TTL` | `theia-workspace-garbage-collector.env.WORKSPACE_TTL` | `1209600s` (14 days) | Maximum age of a workspace before deletion |
| `CHECK_INTERVAL` | `theia-workspace-garbage-collector.env.CHECK_INTERVAL` | `1800s` (30 minutes) | How often the GC loop runs |

Two things differ from what you might expect:

- `K8S_NAMESPACE` has no values key. Because the garbage collector ships with each installation and watches only that installation, there is nothing to point it at. If you want a different namespace watched, that is a different installation with its own garbage collector.
- `env` is a **map of variable name to value**, not a list of `{name, value}` objects. Writing it as a list produces a rendering error or a broken Deployment, depending on where Helm gives up.

Durations are Go duration strings. The chart ships plain-seconds values (`1209600s`, `1800s`); hour and minute suffixes (`168h`, `72h30m`, `1440m`) are the same format. Do not use days - Go's duration parser has no `d` unit. If you change notation, confirm the result in the startup log rather than assuming it parsed.

### Example values

For a short course where workspaces should be cleaned up after 7 days:

```yaml
theia-workspace-garbage-collector:
  enabled: true
  env:
    WORKSPACE_TTL: "604800s"   # 7 days
    CHECK_INTERVAL: "3600s"    # 1 hour
```

For a long-running research environment where workspaces should persist for 90 days:

```yaml
theia-workspace-garbage-collector:
  enabled: true
  env:
    WORKSPACE_TTL: "7776000s"  # 90 days
    CHECK_INTERVAL: "21600s"   # 6 hours
```

To turn the garbage collector off entirely - appropriate where workspace lifetime is managed by some other process, or where losing a student's work to a TTL is unacceptable:

```yaml
theia-workspace-garbage-collector:
  enabled: false
```

With it disabled, nothing reclaims workspace storage automatically. Plan a manual cleanup cadence and watch your PVC quota.

## Deploying and updating

Because it is a subchart, you change the garbage collector by upgrading the installation:

```bash
helm upgrade --install eduide oci://ghcr.io/eduide/charts/eduide \
  --version <chart-version> \
  -n <namespace> \
  -f <your-values>.yaml
```

There is no standalone chart to install. A command of the form `helm upgrade --install theia-workspace-garbage-collector ./helm` does not work: there is no such chart to install on its own, and even if there were, a separate release would not receive the installation's namespace or share its lifecycle.

The Deployment restarts and picks up the new environment variables as part of the upgrade.

### Verifying the running configuration

Given that misplaced values fail silently, verify rather than assume. Check the environment the container actually received:

```bash
kubectl get deployment garbage-collector -n <namespace> \
  -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}'
```

And confirm against the startup log:

```bash
kubectl logs -n <namespace> -l app=theia-workspace-garbage-collector --tail=10
```

If the log shows the defaults after you set something else, your values are nested wrongly. Check that the top-level key is exactly `theia-workspace-garbage-collector` and that `env` is a map.

You can also ask Helm what it resolved, without touching the cluster:

```bash
helm get values eduide -n <namespace> --all \
  | grep -A5 'theia-workspace-garbage-collector'
```

## Manual cleanup

If you need to reclaim space immediately - when the namespace is approaching quota limits before the next scheduled GC run, for instance - you can delete workspaces manually.

```bash
# List all workspaces with their age
kubectl get workspaces.theia.cloud -n <namespace> \
  --sort-by=.metadata.creationTimestamp \
  -o custom-columns='NAME:.metadata.name,CREATED:.metadata.creationTimestamp,USER:.spec.user'

# Delete a specific workspace
kubectl delete workspace <workspace-name> -n <namespace>

# Delete all workspaces created before a specific date (use with caution)
kubectl get workspaces.theia.cloud -n <namespace> -o json \
  | jq -r '.items[] | select(.metadata.creationTimestamp < "<YYYY-MM-DD>T00:00:00Z") | .metadata.name' \
  | xargs -I {} kubectl delete workspace {} -n <namespace>
```

Run the `jq` pipeline without the final `xargs` first, and read the list before deleting anything.

Always confirm the workspace does not have an active session before deleting it. Deleting a workspace with a live session attached will leave the session broken.

The custom resources are in the `theia.cloud` API group even though the charts are named `eduide*` - a historical name that was never migrated. `kubectl get workspaces` resolves to the same resource as `kubectl get workspaces.theia.cloud`; the long form is used here so the group is unambiguous.

## PVC cleanup after workspace deletion

Deleting a workspace resource removes the Kubernetes custom resource and triggers the operator to delete associated pod resources. The PVC lifecycle depends on the storage class reclaim policy:

- **Delete** policy: The PVC and the underlying volume are deleted automatically.
- **Retain** policy: The PVC is removed but the underlying PersistentVolume remains, holding the data and the capacity. You must delete the PV manually to reclaim the storage.

Check the current policy:

```bash
kubectl get storageclass <storage-class-name> \
  -o jsonpath='{.reclaimPolicy}{"\n"}'

# Or check every storage class at once
kubectl get storageclass \
  -o custom-columns='NAME:.metadata.name,RECLAIM:.reclaimPolicy,DEFAULT:.metadata.annotations.storageclass\.kubernetes\.io/is-default-class'
```

With a `Retain` policy, orphaned volumes show up as PersistentVolumes in the `Released` phase:

```bash
kubectl get pv --field-selector=status.phase=Released
```

**`Released` is a PersistentVolume phase, not a PersistentVolumeClaim phase.** A PVC is only ever `Pending`, `Bound` or `Lost`, so `kubectl get pvc --field-selector=status.phase=Released` matches nothing whether or not there is storage to reclaim - it reports an empty list and reads as "nothing to clean up". PVs are also cluster-scoped, so there is no `-n` flag.

To find the released volumes that belonged to one installation:

```bash
kubectl get pv -o json \
  | jq -r '.items[] | select(.status.phase=="Released")
      | select(.spec.claimRef.namespace=="<namespace>")
      | "\(.metadata.name)\t\(.spec.capacity.storage)\t\(.spec.claimRef.name)"'
```

Once you are certain the data is not needed:

```bash
kubectl delete pv <pv-name>
```

Deleting a `Released` PV with a `Retain` policy removes the Kubernetes object. Whether it removes the data depends on your storage backend - some drivers leave the underlying volume behind for a separate cleanup. Confirm with whoever operates your storage before assuming the capacity has come back.

## Temporary TTL reduction

During storage pressure, lower the TTL temporarily to accelerate cleanup without deleting workspaces by hand:

1. Lower `theia-workspace-garbage-collector.env.WORKSPACE_TTL` in the installation values file - to `259200s` (3 days), for example.
2. Run `helm upgrade` on the installation to apply.
3. Confirm the new value landed with the verification commands above.
4. Wait for the next GC run, or restart the pod to trigger one immediately.
5. Once storage pressure is resolved, restore the original TTL.

```bash
# Restart the GC pod to trigger an immediate run with the new config
kubectl rollout restart deployment/garbage-collector -n <namespace>
kubectl rollout status deployment/garbage-collector -n <namespace>
```

The Deployment is named `garbage-collector`. `kubectl rollout restart deployment/theia-workspace-garbage-collector` fails with `not found` - that string is the pod label and the chart dependency name, not the Deployment name.

Be deliberate about step 5. A TTL lowered during an incident and never restored quietly deletes work that users expected to keep.

## What is not covered

The garbage collector currently only deletes workspaces based on age since creation. It does not:

- Consider last session activity time
- Handle partial deletion failures gracefully (it stops on the first error)
- Send notifications before deleting a workspace
- Clean up `Released` PersistentVolumes left behind by a `Retain` storage class
- Expose any metrics or a health endpoint - it has no Service, so its only observable output is its log

If a deletion fails mid-run, the error is logged and the run halts. The next scheduled run will retry.
