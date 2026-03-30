---
title: Incident Response
description: Runbooks for common EduIDE incident classes, triage sequence, and post-incident procedures.
---

# Incident Response

This page contains runbooks for the most common incident classes in EduIDE, a triage sequence for unknown incidents, and the post-incident procedure.

## Triage sequence for unknown incidents

When an incident is reported and the root cause is not immediately clear, work through this sequence before jumping to a specific runbook:

1. **Confirm impact scope** — Is it one user, one session type, one environment, or all environments?
2. **Check pod health** — `kubectl get pods -n theia-prod | grep -v Running`
3. **Check operator logs** — `kubectl logs -n theia-prod -l app=operator --tail=100`
4. **Check service logs** — `kubectl logs -n theia-prod -l app=service --tail=100`
5. **Check recent deployments** — Did a deployment run in the last 30 minutes?
6. **Check Keycloak** — Are authentication failures spiking?
7. **Apply the relevant runbook below.**

---

## Runbook: Sessions failing to launch

**Symptoms:** Users report they cannot start an IDE session. Launch requests return an error or time out.

**Step 1: Check for pending session pods**

```bash
kubectl get pods -n theia-prod | grep -E 'Pending|ContainerCreating'
```

Pending pods indicate a scheduling or resource problem. Investigate:

```bash
kubectl describe pod <pending-pod-name> -n theia-prod
```

Common causes in the `Events` section:
- `Insufficient memory` or `Insufficient cpu` — cluster is at capacity
- `no nodes available` — all nodes are unschedulable
- `PodToleratesNodeTaints` — taints misconfiguration

**Step 2: Check resource quota**

```bash
kubectl describe resourcequota -n theia-prod
```

If `persistentvolumeclaims` or `requests.memory` are at the hard limit, no new sessions can start.

**Step 3: Check the operator**

```bash
kubectl logs -n theia-prod -l app=operator --tail=200
```

Look for reconciliation errors or repeated error messages on the same resource.

**Step 4: Check image availability**

If pods are in `ErrImagePull` or `ImagePullBackOff`:

```bash
kubectl describe pod <pod-name> -n theia-prod | grep -A 5 Events
```

This indicates the session image is unavailable. Verify the image tag in the App Definition still exists in the container registry.

**Mitigation options:**
- Free capacity by scaling down `maxInstances` on underused App Definitions.
- Remove stale workspaces to free PVC quota (see [Session Management](/admins/operations/session-management)).
- Increase cluster capacity if node resources are exhausted.

---

## Runbook: Authentication outage

**Symptoms:** All users are redirected to Keycloak but cannot log in, or receive "Access Denied" after successful login.

**Step 1: Identify the failure point**

- If the Keycloak login page itself fails to load: the problem is upstream of EduIDE. Contact the Keycloak instance admin.
- If login succeeds but users are rejected by EduIDE: the problem is in the OAuth2 proxy or token claim configuration.

**Step 2: Check OAuth2 proxy logs**

```bash
kubectl logs -n theia-prod -l app=oauth2-proxy --tail=100
```

Look for:
- `invalid cookie` — cookie secret mismatch, likely after a redeployment with a changed secret
- `failed to verify token` — audience claim missing or wrong
- `upstream response 403` — service is rejecting the proxied request

**Step 3: Verify Keycloak client scope**

If token claims are missing (username, groups, audience), the client scope mappers may have been removed or the scope unassigned from the client. Check in the Keycloak admin console:

1. Open the client → **Client scopes**.
2. Confirm `theia-cloud-dedicated` is listed as a Default scope.
3. Open the scope → **Mappers** and verify all three mappers exist.

**Step 4: Check cookie secret**

If the cookie secret was rotated (new deployment with a different `THEIA_KEYCLOAK_COOKIE_SECRET`), all existing sessions are invalidated. Users need to clear cookies and log in again. This is expected behaviour, not a bug.

**Mitigation:** Communicate to affected users that they need to clear browser cookies for the domain and log in again.

---

## Runbook: Storage exhaustion

**Symptoms:** New workspace creation fails with storage errors. Existing sessions are unaffected.

**Step 1: Check PVC quota**

```bash
kubectl describe resourcequota -n theia-prod | grep persistentvolumeclaims
```

If at the hard limit, no new PVCs can be created.

**Step 2: Check storage capacity**

```bash
kubectl describe resourcequota -n theia-prod | grep requests.storage
```

**Step 3: Identify stale workspaces**

```bash
# List workspaces sorted by age
kubectl get workspaces -n theia-prod \
  --sort-by=.metadata.creationTimestamp

# Count total workspaces
kubectl get workspaces -n theia-prod --no-headers | wc -l
```

**Step 4: Delete old workspaces**

If the garbage collector has not yet run, manually delete workspaces older than the TTL:

```bash
kubectl delete workspace <workspace-name> -n theia-prod
```

The PVC is released according to the storage class reclaim policy. See [Storage and Quotas](/admins/platform/storage-and-quotas) for PVC cleanup.

**Mitigation:** Lower the garbage collection TTL temporarily to accelerate cleanup. See [Garbage Collection](/admins/operations/garbage-collection).

---

## Runbook: Node pressure / cluster capacity

**Symptoms:** Many pods are in `Pending` state. Session launches are slow or failing. Grafana shows high node CPU or memory utilisation.

**Step 1: Identify the bottleneck**

```bash
kubectl top nodes
kubectl describe nodes | grep -A 5 "Allocated resources"
```

**Step 2: Reduce pre-warmed instances temporarily**

```bash
# Drop minInstances to 0 for all App Definitions to stop warming new sessions
curl -X PATCH \
  -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minInstances": 0}' \
  https://service.theia.artemis.cit.tum.de/service/admin/appdefinition/java-17-latest
```

Repeat for each affected App Definition. This frees scheduling space for active user sessions.

**Step 3: Communicate status**

If user-visible impact is ongoing, post a status update to the relevant channel. Include:
- What is affected (slow starts, new sessions failing, etc.)
- What is being done
- Expected resolution time if known

**Step 4: Scale cluster if needed**

If the pressure is sustained and expected (e.g., large cohort exercise), coordinate with the infrastructure team to add nodes.

---

## Runbook: Operator not reconciling

**Symptoms:** App Definitions are updated via the API but no new pre-warmed sessions appear. Sessions that should be cleaned up remain running.

**Step 1: Check operator pod status**

```bash
kubectl get pods -n theia-prod -l app=operator
```

In production, 3 replicas should be `Running`. If fewer, check for crash loops:

```bash
kubectl describe pod <operator-pod> -n theia-prod
kubectl logs <operator-pod> -n theia-prod
```

**Step 2: Check for CRD version mismatches**

After a CRD upgrade, the operator may fail to process resources if it is running an older version:

```bash
kubectl get crd | grep theia
```

Confirm the CRD versions match what the currently running operator expects.

**Step 3: Restart the operator**

If logs show the operator is running but not reconciling (e.g., stuck in a watch loop):

```bash
kubectl rollout restart deployment/operator -n theia-prod
```

---

## Post-incident procedure

After every incident affecting production:

1. **Confirm resolution** — Verify the platform is fully operational with a smoke-test session launch.
2. **Write up the timeline** — Document what happened, when it was detected, what was done, and when it was resolved.
3. **Identify root cause** — Was it a deployment change, a capacity event, a configuration drift, or an external dependency?
4. **Record follow-up actions** — Create tasks for any changes needed to prevent recurrence or improve detection speed.
5. **Update runbooks** — If this incident class was not covered, add it here.

Keep incident records even for minor events. Patterns across small incidents often predict larger ones.
