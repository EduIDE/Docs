---
title: Garbage Collection
description: Workspace TTL configuration, cleanup scheduling, and manual reclamation procedures.
---

# Garbage Collection

The workspace garbage collector is a dedicated Kubernetes operator (`theia-workspace-garbage-collector`) that periodically deletes workspaces that have exceeded their configured time-to-live. Without it, workspaces accumulate indefinitely, consuming PVC quota and storage capacity.

## How it works

The garbage collector runs as a loop inside the cluster. On each tick:

1. It lists all workspace custom resources in the configured namespace.
2. For each workspace, it compares the workspace's `creationTimestamp` against the current time.
3. If the workspace age exceeds `WORKSPACE_TTL`, the workspace resource is deleted.
4. Deletion of the workspace resource triggers the operator to clean up associated Kubernetes resources, including the PVC (depending on the storage class reclaim policy).

The garbage collector operates on creation time, not last-activity time. A workspace created 14 days ago will be deleted regardless of whether a session was active recently. This is a known limitation of the current implementation.

At startup, the garbage collector prints its configuration:

```
Starting garbage collector...
- Namespace: theia-prod
- Check interval: 30m0s
- Workspace TTL: 336h0m0s
```

## Configuration

The garbage collector is configured via environment variables. These are set in the Helm chart values file.

| Variable | Default | Description |
|---|---|---|
| `K8S_NAMESPACE` | `theia-prod` | The Kubernetes namespace to watch |
| `WORKSPACE_TTL` | `336h` (14 days) | Maximum age of a workspace before deletion. Accepts Go duration strings |
| `CHECK_INTERVAL` | `30m` | How often the GC loop runs. Accepts Go duration strings |

Go duration string format: `336h` (hours), `72h30m` (hours and minutes), `1440m` (minutes). Do not use days — Go's duration parser does not support `d`.

### Example values

For a short course where workspaces should be cleaned up after 7 days:

```yaml
env:
  - name: WORKSPACE_TTL
    value: "168h"
  - name: CHECK_INTERVAL
    value: "1h"
  - name: K8S_NAMESPACE
    value: "theia-prod"
```

For a long-running research environment where workspaces should persist for 90 days:

```yaml
env:
  - name: WORKSPACE_TTL
    value: "2160h"
  - name: CHECK_INTERVAL
    value: "6h"
```

## Deploying and updating

The garbage collector is deployed via its own Helm chart:

```bash
helm upgrade --install theia-workspace-garbage-collector \
  ./helm -f ./helm/values.yaml
```

To change the TTL or interval, update the values file and run the upgrade. The deployment restarts and picks up the new values immediately.

To verify the running configuration:

```bash
kubectl logs -n theia-prod -l app=theia-workspace-garbage-collector | head -10
```

The startup log lines show the effective configuration.

## Manual cleanup

If you need to reclaim space immediately — for example, when the namespace is approaching quota limits before the next scheduled GC run — you can delete workspaces manually.

```bash
# List all workspaces with their age
kubectl get workspaces -n theia-prod \
  --sort-by=.metadata.creationTimestamp \
  -o custom-columns='NAME:.metadata.name,CREATED:.metadata.creationTimestamp,USER:.spec.user'

# Delete a specific workspace
kubectl delete workspace <workspace-name> -n theia-prod

# Delete all workspaces older than a specific date (use with caution)
kubectl get workspaces -n theia-prod -o json \
  | jq -r '.items[] | select(.metadata.creationTimestamp < "2025-01-01T00:00:00Z") | .metadata.name' \
  | xargs -I {} kubectl delete workspace {} -n theia-prod
```

Always confirm the workspace does not have an active session before deleting it. Deleting a workspace with a live session attached will leave the session broken.

## PVC cleanup after workspace deletion

Deleting a workspace resource removes the Kubernetes custom resource and triggers the operator to delete associated pod resources. The PVC lifecycle depends on the storage class reclaim policy:

- **Delete** policy: The PVC and the underlying volume are deleted automatically.
- **Retain** policy: The PVC is released but the underlying PersistentVolume remains. You must delete the PV manually to reclaim the storage.

Check the current policy:

```bash
kubectl get storageclass csi-rbd-sc \
  -o jsonpath='{.reclaimPolicy}'
```

If orphaned PVCs accumulate:

```bash
# Find Released PVCs (no longer bound to any claim)
kubectl get pvc -n theia-prod --field-selector=status.phase=Released

# Delete them
kubectl delete pvc <pvc-name> -n theia-prod
```

## Temporary TTL reduction

During storage pressure situations, lower the TTL temporarily to accelerate cleanup without manual intervention:

1. Update the values file: lower `WORKSPACE_TTL` to e.g. `72h`.
2. Run `helm upgrade` to apply.
3. Wait for the next GC run (or trigger one by restarting the pod).
4. Once storage pressure is resolved, restore the original TTL value.

```bash
# Restart the GC pod to trigger an immediate run with new config
kubectl rollout restart deployment/theia-workspace-garbage-collector -n theia-prod
```

## What is not covered

The garbage collector currently only deletes workspaces based on age since creation. It does not:

- Consider last session activity time
- Handle partial deletion failures gracefully (it stops on the first error)
- Send notifications before deleting a workspace

If a deletion fails mid-run, the error is logged and the run halts. The next scheduled run will retry.
