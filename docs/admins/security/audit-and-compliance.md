---
title: Audit and Compliance
description: What EduIDE logs, recommended retention policies, and the access review checklist.
---

# Audit and Compliance

This page describes what EduIDE logs across its components, how long to retain those logs, which operations are considered sensitive, and the recommended cadence for access reviews.

:::note Placeholders on this page

Each EduIDE installation lives in its own namespace, named `eduide-<name>` by convention (`eduide-staging`, `eduide-cs101`, and so on). Commands use `-n <namespace>` - substitute your installation's namespace. The cluster-level chart installs into `eduide-system`, spelled out literally where it applies. `eduide` is the conventional Helm release name for an installation.

:::

## What is logged

Everything below is written to container stdout. EduIDE ships no log shipper, no log storage and no log retention mechanism of its own. Whatever you can query after a pod restarts is entirely a function of the log aggregation you run alongside it (Loki, Elasticsearch, a cloud provider's logging service). Without one, `kubectl logs` gives you the current container's output and nothing more, and a rolled pod takes its history with it.

### EduIDE Cloud service

The service logs all inbound requests including:
- Request method, path, and response status
- The authenticated user identity (from the JWT `username` claim) where applicable
- Admin endpoint access, including whether the `X-Admin-Api-Token` was accepted or rejected, and whether a token was configured at all
- Workspace and session lifecycle events (create, delete, stop)

```bash
kubectl logs -n <namespace> -l app=service --tail=200
```

### EduIDE Cloud operator

The operator logs every reconciliation action:
- Custom resource state transitions (Workspace, Session, AppDefinition)
- Pod creation and deletion for session workloads
- Errors during reconciliation
- Scaling changes applied to App Definitions

```bash
kubectl logs -n <namespace> -l app=operator --tail=200
```

The operator is your primary audit trail for session and workspace lifecycle, because it is the component that actually creates and destroys them.

### oauth2-proxy

oauth2-proxy logs every authentication event it handles:
- Successful logins with the authenticated username
- Failed authentication attempts with the failure reason
- Token validation results
- Logout events

**There is no single login log stream.** oauth2-proxy runs as a **sidecar container inside each session pod**, not as a shared Deployment in front of the platform. Every session gets its own proxy instance, writing its own log, which lives and dies with that pod.

The consequences for auditing are significant, and worth being explicit about:

- There is no pod labelled `app=oauth2-proxy`. A selector like `kubectl logs -l app=oauth2-proxy` matches nothing and exits successfully, which reads like a clean authentication log and is not.
- Reading these logs means naming a pod and a container:

  ```bash
  # Find session pods: everything that is not a platform component
  kubectl get pods -n <namespace> \
    -l 'app notin (operator,service,landing-page,image-preloading)'

  kubectl logs <session-pod> -n <namespace> -c oauth2-proxy --tail=200
  ```

- **The logs are as ephemeral as the session.** When a session ends, its pod is deleted and its authentication log goes with it. There is no post-hoc way to ask "who logged into this platform last Tuesday" from EduIDE itself.
- Failed logins that never produced a session produce no oauth2-proxy log anywhere, because there was no session pod to run a proxy in.

If authentication events matter for your compliance obligations, you have two options, and you need at least one of them:

1. **Treat Keycloak as the authoritative authentication log.** Keycloak sees every login attempt for every session, records them centrally, and retains them independently of pod lifecycle. This is the right answer for almost everyone.
2. **Ship session pod logs off-cluster as they are produced**, so the oauth2-proxy sidecar output survives the pod. This gives you the proxy's view but requires log collection that captures short-lived pods reliably.

Do not plan an audit process around retrieving oauth2-proxy logs with `kubectl` after the fact. That data is gone.

### Keycloak

Keycloak maintains its own audit event log. Relevant event types:
- `LOGIN` - successful user authentication
- `LOGIN_ERROR` - failed login attempt
- `LOGOUT` - user logout
- `TOKEN_EXCHANGE` - token operations
- `CLIENT_LOGIN` - service-to-Keycloak authentication
- Admin events: user creation, group membership changes, client configuration changes

Keycloak audit events are accessed via the Keycloak admin console under **Realm Settings → Events**. Event logging and admin event logging are configured separately there, and both are off by default in a fresh Keycloak. Confirm both are enabled and that the expiration is set to at least your intended retention before relying on this.

### Workspace garbage collector

The garbage collector logs each workspace deletion it performs, including the workspace name and its creation timestamp. If a deletion fails, the error is logged with the workspace name.

```bash
kubectl logs -n <namespace> -l app=theia-workspace-garbage-collector --tail=200
```

This is the only record that a user's workspace was reclaimed. It has no Service and no metrics endpoint, so the log is the whole story.

### Helm

`helm history` is an audit record of configuration change, and one that survives longer than most container logs:

```bash
helm history eduide -n <namespace>
helm get values eduide -n <namespace> --revision <n>
```

Note that `helm get values` will show secret material if you provisioned the admin API token through the values file. Treat its output accordingly.

## Sensitive operations inventory

The following operations should be treated as high-sensitivity events and reviewed if unusual patterns appear:

| Operation | Where logged | Sensitivity |
|---|---|---|
| Admin API token request (success) | Service logs | High - means the token is in use |
| Admin API token request (failure) | Service logs | High - may indicate brute force or a stale token |
| App Definition scaling change | Service + operator logs | Medium - affects platform capacity |
| Workspace force-deletion by admin | Operator logs, plus the Kubernetes API audit log if enabled | Medium - user data deletion |
| Workspace deletion by TTL | Garbage collector logs | Medium - user data deletion, unattended |
| Keycloak group membership change | Keycloak admin events | High - grants or removes elevated access |
| oauth2-proxy cookie secret rotation | Helm history | Medium - invalidates all active sessions |
| New Keycloak client creation | Keycloak admin events | High - creates a new authentication entry point |
| Gateway listener or certificate change | Helm history for `eduide-cluster` | High - changes what hostnames the cluster serves |
| Chart upgrade of an installation | `helm history` | Medium - the record of what configuration was live when |

A note on `kubectl` actions: deleting a workspace or session by hand leaves a trace in the operator's logs (it observes the deletion), but the record of **who** did it lives only in the Kubernetes API server audit log. That is a cluster-level feature you enable on the API server; it is not part of EduIDE. If attribution of admin actions matters to you, enable it.

## Log retention recommendations

| Log source | Recommended retention | Rationale |
|---|---|---|
| Service and operator logs | 30 days | Sufficient for most incident investigations |
| Session pod logs, including oauth2-proxy | 30 days, if collected at all | Only survives with off-cluster log shipping |
| Keycloak event log | 90 days | Covers quarterly access reviews |
| Kubernetes API audit log | 90 days | Attribution of admin actions |
| Garbage collector logs | 30 days | Low volume, but the only record of automated data deletion |
| Helm release history | Indefinite | Small, and it is your configuration change record |

Kubernetes default log retention depends on your cluster configuration - typically the kubelet's per-container rotation, which is measured in megabytes rather than days. If you use a centralised log aggregation system, set the retention policies there.

## Access review checklist

Run through this checklist on the indicated cadence. Substitute your own group and secret-store names where the checklist refers to them generically.

### Monthly

- [ ] Review membership of the EduIDE admin group in Keycloak (the group named in your installation's Keycloak configuration). Remove any users who no longer require admin access.
- [ ] Check service logs for unexplained spikes in admin API token requests, successful or failed.
- [ ] Verify that every EduIDE namespace on the cluster corresponds to an installation you still intend to run:
      ```bash
      kubectl get namespace -o name | grep eduide-
      helm list --all-namespaces --filter '^eduide$'
      ```
      Decommission anything orphaned, using the procedure below.

### Quarterly

- [ ] Review all Keycloak user accounts. Disable accounts for users who have left the organisation or completed their course.
- [ ] Review Keycloak client configurations. Remove stale redirect URIs for decommissioned installations - these are the most commonly forgotten artefact of a decommissioning.
- [ ] Review who can read the secret store holding your admin API tokens and installation values files. Revoke access for anyone no longer operating the platform.
- [ ] Review `helm history` for each installation for upgrades you cannot account for.
- [ ] Check Gateway listeners in `eduide-system` against the installations that actually exist:
      ```bash
      kubectl get gateway -n eduide-system \
        -o jsonpath='{range .spec.listeners[*]}{.name}{"\t"}{.hostname}{"\n"}{end}'
      ```
      A listener for a hostname no longer served is a loose end, not a fault.

### Every 6 months

- [ ] Rotate the admin API token for every installation. See [Admin API Tokens](/admins/security/admin-api-tokens).
- [ ] Rotate the oauth2-proxy cookie secret for every installation. This invalidates all active sessions, so schedule it.
- [ ] Review your alert thresholds against current cohort sizes. Note that the charts ship Grafana dashboards but **no alerting rules** - any alerts you have are ones you wrote, and they live wherever you defined them, not in the EduIDE charts. See [Monitoring Basics](/admins/operations/monitoring-basics).
- [ ] Verify certificate coverage for every hostname each installation serves. A certificate that has stopped covering a hostname produces no cluster-side error; see [Incident Response](/admins/operations/incident-response).

### On personnel changes

When a person with platform access leaves or changes role:

- [ ] Remove them from the EduIDE admin group in Keycloak immediately.
- [ ] Revoke their access to the secret store and to installation values files.
- [ ] Revoke their `kubectl` credentials for the cluster.
- [ ] Rotate the admin API token for every installation they had access to.
- [ ] Rotate the oauth2-proxy cookie secret if they had access to it.
- [ ] Disable their Keycloak account.

Do not defer these steps. Credentials are not invalidated automatically when a person's role changes.

## Checking for failed admin token attempts

```bash
kubectl logs -n <namespace> -l app=service --since=24h \
  | grep -i "admin API token"
```

The service logs a distinct message for each failure mode: a missing header, an invalid token, and no token configured at all. Reading which one you are getting matters. A steady stream of *invalid token* rejections without a matching change to your automation suggests either a stale script or an attempt to guess the token - rotate immediately if the source cannot be explained. A stream of *not configured* messages means the admin API was never provisioned on that installation, which is a configuration gap rather than a security event.

## Decommissioning an installation

Removing an installation is not just `helm uninstall`. Several artefacts live outside the installation's namespace and outside its Helm release, and every one of them is a loose end if left behind - a Gateway listener for a hostname that no longer resolves, a certificate SAN for a service that no longer exists, a Keycloak client that still accepts redirects to a domain you no longer control.

Work through these in order. The ordering matters in two places, noted below.

**Step 0: Deal with the data first**

Uninstalling destroys student work. Confirm what exists and that anyone who needs it has been told:

```bash
kubectl get workspaces.theia.cloud -n <namespace> \
  -o custom-columns='NAME:.metadata.name,USER:.spec.user,CREATED:.metadata.creationTimestamp'
kubectl get pvc -n <namespace>
```

Export anything that must be kept before going further. There is no undo after step 2.

**Step 1: Delete the custom resources while the operator is still running**

This ordering matters. Sessions and workspaces are reconciled by the operator, and the operator is part of the release you are about to uninstall. Removing the resources first lets the operator tear down pods, PVCs and route entries cleanly. Uninstalling first leaves the operator gone and any resources with finalizers stuck, which then need manual finalizer removal.

```bash
kubectl -n <namespace> delete sessions.theia.cloud --all
kubectl -n <namespace> delete workspaces.theia.cloud --all
kubectl -n <namespace> delete appdefinitions.theia.cloud --all
```

Wait for the session pods to disappear before continuing:

```bash
kubectl get pods -n <namespace> -w
```

**Step 2: Uninstall the installation release**

```bash
helm uninstall eduide -n <namespace>
```

This removes the operator, the service, the landing page, the garbage collector subchart, the HTTPRoutes and the ConfigMaps. It does **not** remove the CRDs - those belong to the cluster-level chart and are annotated to survive - and it does not remove anything in `eduide-system`.

**Step 3: Re-run the cluster bootstrap so the Gateway and certificates shrink**

This is the step most easily forgotten, because nothing breaks if you skip it. The shared Gateway in `eduide-system` still carries this installation's listeners, and the certificates still carry its hostnames in their SANs.

Remove the installation from your cluster-level configuration:

- Drop its listeners from `gateway.listeners`. There are typically four per installation (landing, service, instances, webview), plus any ACME challenge listeners.
- Drop its hostnames from the relevant entry in `managedCertificates.certificates`, so the certificate is re-issued with a smaller SAN list.
- Drop its namespace from `monitoring.targetNamespaces` and `monitoring.sessionNamespaces`.

Then upgrade the cluster chart:

```bash
helm upgrade eduide-cluster oci://ghcr.io/eduide/charts/eduide-cluster \
  --version <chart-version> \
  -n eduide-system \
  -f <your-cluster-values>.yaml
```

Verify the listeners are gone and that the remaining ones are still healthy - a botched listener list breaks every other installation on the cluster, so do not skip the check:

```bash
kubectl get gateway theia-shared-gateway -n eduide-system \
  -o jsonpath='{range .status.listeners[*]}{.name}{"\t"}{range .conditions[*]}{.type}={.status} {end}{"\n"}{end}'
```

If a certificate was re-issued with fewer names, confirm the surviving hostnames are still covered before you consider this step done. See the certificate runbook in [Incident Response](/admins/operations/incident-response).

**Step 4: Remove the Keycloak configuration**

In the Keycloak admin console, for the client this installation used:

- Remove its redirect URIs and web origins. A redirect URI pointing at a domain you no longer control is a genuine security problem, not just untidiness: whoever acquires that hostname next can receive authorization codes issued for your realm.
- If the client existed solely for this installation, delete the client.
- Remove any groups or roles created solely for this installation's users.

**Step 5: Delete the namespace**

```bash
kubectl delete namespace <namespace>
```

If this hangs, a resource with a finalizer is still present - usually a custom resource that survived step 1 because the operator was already gone. Find it:

```bash
kubectl api-resources --verbs=list --namespaced -o name \
  | xargs -n1 kubectl get --show-kind --ignore-not-found -n <namespace>
```

**Step 6: Reclaim the storage**

With a `Retain` reclaim policy, the PersistentVolumes survive the namespace and still occupy capacity on your storage backend. They show up in the `Released` phase - a **PersistentVolume** phase, not a PVC phase, and cluster-scoped, so no namespace flag applies:

```bash
kubectl get pv -o json \
  | jq -r '.items[] | select(.status.phase=="Released")
      | select(.spec.claimRef.namespace=="<namespace>")
      | "\(.metadata.name)\t\(.spec.capacity.storage)"'
```

Delete them once you are certain the data is not needed:

```bash
kubectl delete pv <pv-name>
```

Whether this frees the underlying storage depends on your CSI driver. Confirm with whoever operates your storage rather than assuming the capacity has returned.

**Step 7: Record it**

Note the decommissioning date, who authorised it, what data was exported and what was destroyed. This is the record you will want at the next quarterly review when someone asks why a namespace disappeared.
