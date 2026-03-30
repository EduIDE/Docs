---
title: Storage and Quotas
description: Persistent volume configuration, storage class selection, and resource quota planning for EduIDE.
---

# Storage and Quotas

EduIDE separates compute from storage. Session pods are disposable; workspace storage is durable. This page explains how workspace storage is provisioned, what controls are available at the namespace and pod level, and how to plan capacity for a user cohort.

## How workspace storage works

When a workspace is created, the EduIDE Cloud operator creates a PersistentVolumeClaim (PVC) for it. That PVC is bound to the workspace, not the session pod. When a session ends, the pod is destroyed but the PVC remains. The next session for the same user reattaches to the same PVC.

This model allows:
- students to return to their work across sessions
- session pods to be replaced without data loss
- storage to be reclaimed independently of active compute

## Storage class

The current production storage class is `csi-rbd-sc` (Ceph RBD via the CSI driver). This is configured in the operator Helm values:

```yaml
theia-cloud:
  operator:
    storageClassName: csi-rbd-sc
    requestedStorage: 250Mi
```

`requestedStorage` is the PVC size allocated per workspace. The default is `250Mi`. This is sufficient for typical student work (code files, build artifacts for small projects). Adjust it before deployment based on the expected workload:

| Use case | Recommended size |
|---|---|
| Light coding exercises | 250Mi |
| Medium projects with build output | 500Mi – 1Gi |
| Projects with large dependencies or binaries | 2Gi+ |

To change the default, update `requestedStorage` in the values file and redeploy the operator. Changes apply to newly created workspaces only. Existing PVCs are not resized automatically.

## Ephemeral storage mode

If `ephemeralStorage: true` is set on the landing page configuration, workspaces launched from that entry point do not get a persistent PVC. Sessions are fully ephemeral — all data is lost when the session ends.

```yaml
landingPage:
  ephemeralStorage: true
```

This is useful for demo or evaluation environments where persistence is not needed and storage overhead should be minimised.

## Namespace resource quotas

Kubernetes resource quotas limit the total compute and storage consumed within a namespace. For EduIDE, these are set at the namespace level to bound the blast radius of a runaway workload or misconfigured App Definition.

Recommended quota structure for a production namespace:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: theia-prod-quota
  namespace: theia-prod
spec:
  hard:
    requests.cpu: "200"       # total CPU requests across all pods
    requests.memory: 400Gi    # total memory requests
    limits.memory: 600Gi      # total memory limits
    persistentvolumeclaims: "500"   # max PVCs (one per workspace)
    requests.storage: 200Gi   # total PVC storage
```

Tune these values based on your cluster capacity and expected peak concurrent sessions. For a 300-student cohort with 2000M memory requests per session, the minimum `requests.memory` is approximately 600Gi at full concurrency.

## Per-session resource configuration

Individual session resource requests and limits are set per App Definition:

```yaml
apps:
  - name: java-17-latest
    requestsMemory: 2000M
    requestsCpu: 500m
    limitsMemory: 3000M
```

| Field | Meaning |
|---|---|
| `requestsMemory` | Guaranteed memory. The scheduler only places the pod where this is available |
| `requestsCpu` | Guaranteed CPU. Expressed in millicores |
| `limitsMemory` | Hard cap. The pod is OOMKilled if it exceeds this value |

There is no `limitsCpu` field in the current schema — CPU is best-effort beyond the request. To enforce CPU limits, this would need to be added at the operator level.

## Storage capacity planning

Use this formula to estimate total storage required for a course cohort:

```
Total storage = (number of students) × (requestedStorage per workspace)
```

For a 500-student cohort at 250Mi per workspace:
```
500 × 250Mi = ~125Gi
```

Leave headroom for:
- Concurrent session overhead (emptyDir volumes, logs)
- Multiple workspaces per user (if allowed)
- Workspace retention period (workspaces accumulate until garbage collected)

See [Garbage Collection](/admins/operations/garbage-collection) for TTL configuration that controls how long workspaces persist after last use.

## Checking current storage usage

```bash
# List all PVCs in the production namespace
kubectl get pvc -n theia-prod

# Check total PVC count and storage consumption
kubectl get pvc -n theia-prod \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.resources.requests.storage}{"\n"}{end}'

# Check resource quota utilisation
kubectl describe resourcequota -n theia-prod
```

## Cleaning up stale PVCs

PVCs left by deleted workspaces become unbound. These consume quota without serving active users. The garbage collector deletes workspace CRs, but PVC cleanup depends on the reclaim policy of the storage class.

If PVCs are not automatically released:

```bash
# List unbound PVCs
kubectl get pvc -n theia-prod --field-selector=status.phase=Released

# Delete a specific unbound PVC
kubectl delete pvc <pvc-name> -n theia-prod
```

Confirm the storage class reclaim policy with:

```bash
kubectl get storageclass csi-rbd-sc -o jsonpath='{.reclaimPolicy}'
```

If the policy is `Retain`, you will need to manually delete the underlying PersistentVolume as well after the PVC is removed.
