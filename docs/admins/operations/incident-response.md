---
title: Incident Response
description: Runbooks for common EduIDE incident classes, triage sequence, and post-incident procedures.
---

# Incident Response

This page contains runbooks for the most common incident classes in EduIDE, a triage sequence for unknown incidents, and the post-incident procedure.

:::note Placeholders on this page

Each EduIDE installation lives in its own namespace, named `eduide-<name>` by convention (`eduide-staging`, `eduide-cs101`, and so on). Commands use `-n <namespace>` - substitute the affected installation's namespace. The cluster-level chart installs into `eduide-system`, which is spelled out literally where it applies.

Hostnames appear as `<service-host>`, `<landing-host>` and `<instance-host>` - the DNS names you configured for the REST service, the landing page and session instances.

The Deployments are named `operator-deployment`, `service-deployment` and `landing-page-deployment`. Their pods carry the shorter labels `app=operator`, `app=service` and `app=landing-page`, so log selectors and rollout commands use different names. Both forms appear below; they are not typos.

The CRDs are in the `theia.cloud` API group even though the charts are named `eduide*` - a historical name that was never migrated. Searching the CRD list for `eduide` finds nothing and does not mean the CRDs are missing.

:::

## Triage sequence for unknown incidents

When an incident is reported and the root cause is not immediately clear, work through this sequence before jumping to a specific runbook:

1. **Confirm impact scope** - Is it one user, one session type, one installation, or every installation on the cluster? A cluster-wide symptom points at `eduide-system` (Gateway, certificates, CRDs) rather than any one namespace.
2. **Check pod health** - `kubectl get pods -n <namespace> | grep -v Running`
3. **Check operator logs** - `kubectl logs -n <namespace> -l app=operator --tail=100`
4. **Check service logs** - `kubectl logs -n <namespace> -l app=service --tail=100`
5. **Check routing** - `kubectl get gateway -n eduide-system` and `kubectl get httproute -n <namespace>`
6. **Check recent deployments** - Did a `helm upgrade` run in the last 30 minutes? `helm history eduide -n <namespace>`
7. **Check Keycloak** - Are authentication failures spiking?
8. **Apply the relevant runbook below.**

---

## Runbook: Sessions failing to launch

**Symptoms:** Users report they cannot start an IDE session. Launch requests return an error or time out.

**Step 1: Check for pending session pods**

```bash
kubectl get pods -n <namespace> | grep -E 'Pending|ContainerCreating'
```

Pending pods indicate a scheduling or resource problem. Investigate:

```bash
kubectl describe pod <pending-pod-name> -n <namespace>
```

Common causes in the `Events` section:
- `Insufficient memory` or `Insufficient cpu` - cluster is at capacity
- `no nodes available` - all nodes are unschedulable
- `PodToleratesNodeTaints` - taints misconfiguration

**Step 2: Check resource quota**

```bash
kubectl describe resourcequota -n <namespace>
```

If `persistentvolumeclaims` or `requests.memory` are at the hard limit, no new sessions can start.

**Step 3: Check the operator**

```bash
kubectl logs -n <namespace> -l app=operator --tail=200
```

Look for reconciliation errors or repeated error messages on the same resource.

**Step 4: Check the per-user session limit**

If only some users are affected and they all already have a session running, they may be hitting the per-user cap. `operator.sessionsPerUser` defaults to **`1`**, so on a default install a user with one live session cannot start a second one. This is configuration working as intended, not an outage.

```bash
kubectl get sessions.theia.cloud -n <namespace> \
  -o custom-columns='NAME:.metadata.name,USER:.spec.user,CREATED:.metadata.creationTimestamp'
```

**Step 5: Check image availability**

If pods are in `ErrImagePull` or `ImagePullBackOff`:

```bash
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 Events
```

This indicates the session image is unavailable. Verify the image tag in the App Definition still exists in the container registry.

**Mitigation options:**
- Free capacity by scaling down `maxInstances` on underused App Definitions.
- Remove stale workspaces to free PVC quota (see [Session Management](/admins/operations/session-management)).
- Increase cluster capacity if node resources are exhausted.

---

## Runbook: 403 on session launch after a deploy

**Symptoms:** Login at Keycloak succeeds, then the session URL returns **403 Forbidden**. Only some users or some sessions are affected. Nothing appears in the operator or service logs, and `status.operatorMessage` on the Session is empty.

**Cause:** the session was assigned a **warm-pool instance**, and a deploy restarted the operator, which recreated those instances and their oauth2-proxy ConfigMaps. Each instance's `authenticated-emails-list` was rebuilt empty. The Session object still points at the instance, but oauth2-proxy denies every authenticated user when that list is empty.

**Confirm it:**

```bash
kubectl -n <namespace> get cm -o name | grep -- '-email' | \
  xargs -n1 kubectl -n <namespace> get -o \
  jsonpath='{.metadata.name}={.data.authenticated-emails-list}{"\n"}'
```

An affected instance shows an empty list. A session with its own dedicated pod shows the user's address and works, which is the contrast that identifies this.

**Fix:** delete the orphaned Session so a fresh one is issued.

```bash
kubectl -n <namespace> delete sessions.theia.cloud <session-name>
```

The user then launches again normally. Their workspace volume is untouched.

:::note Affects every installation
`eagerStart: true` is the default, so any deploy landing while a user holds a session on a warm instance can cause this. Tracked in EduIDE-Cloud issue 135.
:::

## Runbook: Authentication outage

**Symptoms:** All users are redirected to Keycloak but cannot log in, or receive "Access Denied" after successful login.

**Step 1: Identify the failure point**

- If the Keycloak login page itself fails to load: the problem is upstream of EduIDE. Contact the Keycloak instance admin.
- If login succeeds but users are rejected by EduIDE: the problem is in oauth2-proxy or the token claim configuration.

**Step 2: Check oauth2-proxy logs**

oauth2-proxy runs as a **sidecar container inside each session pod**. There is no oauth2-proxy Deployment, no oauth2-proxy Service, and no pod labelled `app=oauth2-proxy` - a selector like `kubectl logs -l app=oauth2-proxy` matches nothing and returns silently, which reads like "no errors" and is not.

You must pick a session pod and name the container:

```bash
# Find a session pod: everything that is not a platform component
kubectl get pods -n <namespace> \
  -l 'app notin (operator,service,landing-page,image-preloading)'

# Read that pod's oauth2-proxy sidecar
kubectl logs <session-pod> -n <namespace> -c oauth2-proxy --tail=100
```

Because each session has its own proxy, a configuration fault shows up identically in every session pod. Checking two or three is enough to tell a global misconfiguration from one broken pod.

Look for:
- `invalid cookie` - cookie secret mismatch, likely after an upgrade with a changed secret
- `failed to verify token` - audience claim missing or wrong
- `upstream response 403` - the service is rejecting the proxied request

**Step 3: Check the oauth2-proxy configuration**

The sidecar's configuration comes from ConfigMaps that the `eduide` chart renders into the installation namespace and the operator mounts by name:

```bash
kubectl get configmap oauth2-proxy-config -n <namespace> -o yaml
```

A change here only reaches sessions started **after** the change. Existing sessions keep the configuration they were launched with.

**Step 4: Verify the Keycloak client scope**

If token claims are missing (username, groups, audience), the client scope mappers may have been removed or the scope unassigned from the client. Check in the Keycloak admin console:

1. Open the client → **Client scopes**.
2. Confirm the EduIDE client scope is listed as a Default scope.
3. Open the scope → **Mappers** and verify all three mappers exist.

**Step 5: Check the cookie secret**

If the cookie secret was rotated, all existing sessions are invalidated. Users need to clear cookies and log in again. This is expected behaviour, not a bug.

**Mitigation:** Communicate to affected users that they need to clear browser cookies for the domain and log in again.

---

## Runbook: Gateway or HTTPRoute failure

**Symptoms:** Users get a connection error, a 404, or a 503 from the load balancer rather than an EduIDE page. Pods are healthy and logs show no inbound requests at all - the traffic never reaches them.

Routing is Gateway API, served by Envoy Gateway. A **shared Gateway** lives in `eduide-system` and carries one set of listeners per installation; each installation namespace contributes **HTTPRoutes** that attach to specific listeners by name. There is no Ingress resource anywhere in the system, so checking for one is a dead end.

The failure mode that makes this worth its own runbook: a route that does not attach produces **no error anywhere in EduIDE's own logs**. Nothing is broken from the operator's or the service's point of view; the request simply never arrives.

**Step 1: Check the Gateway itself**

```bash
kubectl get gateway -n eduide-system
```

The default name is `theia-shared-gateway`. The `PROGRAMMED` column is the one that matters - `True` means Envoy Gateway has translated the Gateway into a live listener configuration.

```bash
kubectl describe gateway theia-shared-gateway -n eduide-system
```

Under `Status`, the Gateway carries top-level `Accepted` and `Programmed` conditions. `Accepted=False` means the spec was rejected (a bad `gatewayClassName`, most often). `Accepted=True, Programmed=False` means the spec is valid but the controller could not realise it - typically no address is available, or the controller is not running:

```bash
kubectl get pods -n envoy-gateway-system
```

Envoy Gateway is **not installed by the EduIDE charts**. It is assumed to be present. If that namespace is empty, that is your incident.

**Step 2: Check individual listener conditions**

Each listener reports its own conditions, and one broken listener does not stop the others. This is why a single installation can be unreachable while every other installation on the cluster is fine.

```bash
kubectl get gateway theia-shared-gateway -n eduide-system \
  -o jsonpath='{range .status.listeners[*]}{.name}{"\t"}{range .conditions[*]}{.type}={.status}({.reason}) {end}{"\n"}{end}'
```

What to look for per listener:

- `Accepted=False` - the listener spec is invalid. A duplicate hostname across listeners or an unsupported protocol will do this.
- `Programmed=False` - accepted but not serving.
- `ResolvedRefs=False` with reason `InvalidCertificateRef` - the listener names a TLS Secret that does not exist, is not of type `kubernetes.io/tls`, or is in a namespace the Gateway may not read. Check the Secret exists:

  ```bash
  kubectl get secret <tls-secret-name> -n eduide-system
  ```

- `Conflicted=True` - two listeners claim the same port and hostname combination.

Also check `attachedRoutes` per listener in the same status block. A listener with `attachedRoutes: 0` that should have routes is the direct link to step 3.

**Step 3: Check the HTTPRoutes**

The `eduide` chart creates three HTTPRoutes in the installation namespace:

| Route | Serves | Backend |
|---|---|---|
| `landing-route` | the landing page host | `landing-page-service` |
| `service-route` | the REST service host, path prefix `/service` | `service-service` |
| the instances route (default name `theia-cloud-demo-ws-route`) | session instance hosts | patched by the operator, one rule per live session |

```bash
kubectl get httproute -n <namespace>
```

Then read the attachment status, which is the part `kubectl get` does not show:

```bash
kubectl get httproute <route-name> -n <namespace> \
  -o jsonpath='{range .status.parents[*]}{.parentRef.name}/{.parentRef.sectionName}{"\t"}{range .conditions[*]}{.type}={.status}({.reason}) {end}{"\n"}{end}'
```

The conditions to read:

- **`Accepted=False`, reason `NoMatchingListenerHostname`** - the most common routing fault in this system. The route declares a hostname that does not intersect the hostname of the listener it names. Gateway API requires the two to overlap; if they do not, the route is silently dropped. This happens when an installation's hostnames are changed in the tenant values without re-running the cluster bootstrap that generates the matching listeners, so the listener still carries the old hostname.
- `Accepted=False`, reason `NoMatchingParent` - the `sectionName` names a listener that does not exist on that Gateway. Same root cause: listener names are generated per installation, and the tenant values must reference them exactly.
- `Accepted=False`, reason `NotAllowedByListeners` - the listener's `allowedRoutes` does not permit routes from this namespace.
- `ResolvedRefs=False`, reason `BackendNotFound` - the backend Service does not exist. Check `kubectl get svc -n <namespace>` for `service-service` and `landing-page-service`.

Compare the two hostnames directly when you suspect a mismatch:

```bash
kubectl get httproute <route-name> -n <namespace> -o jsonpath='{.spec.hostnames}{"\n"}'
kubectl get gateway theia-shared-gateway -n eduide-system \
  -o jsonpath='{range .spec.listeners[*]}{.name}{"\t"}{.hostname}{"\n"}{end}'
```

**Step 4: If only session URLs are broken**

The instances route ships with an empty rule list; the **operator** patches one rule into it per live session. If the landing page and the service work but session URLs 404, check that the operator is running and reconciling (see the operator runbook below), then inspect the route's rules:

```bash
kubectl get httproute theia-cloud-demo-ws-route -n <namespace> -o yaml
```

An empty `rules` list with sessions running means the operator is not patching. An operator restart is the usual fix.

**Mitigation:** Re-run the cluster-level `helm upgrade` for `eduide-cluster` with listener definitions that match the installation's current hostnames, then re-check the route conditions. Fixing the tenant side alone does not help if the listener is what is stale.

---

## Runbook: Certificate does not cover a hostname

**Symptoms:** Browsers show a certificate warning on one hostname. More confusingly, the landing page loads but stays empty or reports that it cannot reach the service, with no error in any EduIDE log.

This one deserves care because **the cluster reports itself healthy throughout**. Gateway API never compares a certificate's Subject Alternative Names against the listener's hostname. If a listener for `<service-host>` references a certificate valid only for `<landing-host>`, the listener still reports `Programmed=True` and `ResolvedRefs=True`: from Envoy's point of view the Secret exists, parses, and was loaded. The mismatch is a client-side judgement, so the only place it appears is in the browser.

The second-order effect is the one that generates support tickets. The landing page and the REST service are on **different hostnames**, so the landing page's calls to the service are cross-origin. The browser refuses to complete a TLS handshake it does not trust, and because the request is a background `fetch` rather than a top-level navigation, the user is never offered the "proceed anyway" interstitial. They see a landing page that simply does not work, with no warning explaining why. Meanwhile the service is running perfectly and logs nothing, because no request ever reached it.

So: if the landing page is blank or cannot list workspaces, and the service pod looks healthy and idle, check the service host's certificate before anything else.

**Step 1: Check what the certificate actually covers**

Ask the live endpoint, which is what the browser sees:

```bash
echo | openssl s_client -connect <service-host>:443 -servername <service-host> 2>/dev/null \
  | openssl x509 -noout -checkhost <service-host>
```

This prints either `Host <service-host> does match certificate` or `Host <service-host> does NOT match certificate`. The `-servername` flag matters: without it, SNI is not sent and you may be handed a different listener's certificate than the browser gets.

Run it for every hostname the installation uses - landing, service, and at least one instance host:

```bash
for h in <landing-host> <service-host> <instance-host>; do
  printf '%s: ' "$h"
  echo | openssl s_client -connect "$h":443 -servername "$h" 2>/dev/null \
    | openssl x509 -noout -checkhost "$h"
done
```

**Step 2: List the SANs to see what is missing**

```bash
echo | openssl s_client -connect <service-host>:443 -servername <service-host> 2>/dev/null \
  | openssl x509 -noout -text \
  | grep -A1 'Subject Alternative Name'
```

Also check the validity window while you have the certificate in hand - an expired certificate produces the same silent cross-origin failure:

```bash
echo | openssl s_client -connect <service-host>:443 -servername <service-host> 2>/dev/null \
  | openssl x509 -noout -dates -subject -issuer
```

**Step 3: Check the certificate in the cluster**

Verify the Secret the listener references, without going over the network:

```bash
kubectl get secret <tls-secret-name> -n eduide-system \
  -o jsonpath='{.data.tls\.crt}' | base64 -d \
  | openssl x509 -noout -checkhost <service-host> -dates
```

If this passes but step 1 fails, the listener is referencing a **different** Secret than you think. Confirm which one:

```bash
kubectl get gateway theia-shared-gateway -n eduide-system \
  -o jsonpath='{range .spec.listeners[*]}{.name}{"\t"}{.hostname}{"\t"}{range .tls.certificateRefs[*]}{.name}{" "}{end}{"\n"}{end}'
```

That command prints listener name, hostname and certificate Secret side by side, which makes a mismatched pairing obvious.

**Step 4: If cert-manager manages the certificate**

The `eduide-cluster` chart can create cert-manager `Certificate` resources, off by default. When enabled, check the resource rather than the Secret:

```bash
kubectl get certificate -n eduide-system
kubectl describe certificate <certificate-name> -n eduide-system
```

`Ready=False` with a `CertificateRequest` stuck in the events usually means the ACME challenge is not completing. Note that an HTTP-01 challenge **cannot** issue a wildcard certificate, so a listener that needs a wildcard hostname requires a DNS-01 solver or a certificate you supply yourself.

**Mitigation:** Re-issue the certificate with every hostname the installation serves in its SAN list, then let the listener reload. Envoy Gateway picks up a changed Secret without a Gateway restart, but confirm with step 1 rather than assuming. Adding a hostname to an installation always means widening the certificate as well as adding a listener - the two are separate changes and forgetting the second produces exactly this incident.

---

## Runbook: Certificate stuck, no challenges outstanding

**Symptoms:** a `Certificate` sits `Ready=False`, its listener never programs, and there are no `Challenge` resources left to look at.

**Check the order:**

```bash
kubectl -n eduide-system get certificate <name> \
  -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.message}{"\n"}{end}'
```

Two different situations look the same from outside.

**Finalize failed.** The challenges validated and the CA then failed the final step:

```
Failed to finalize Order: 404 urn:ietf:params:acme:error:malformed:
Certificate not found
```

This is transient. cert-manager will retry, but only after an exponential backoff starting at an hour. Clear the backoff to retry now:

```bash
kubectl -n eduide-system patch certificate <name> --type=merge --subresource=status \
  -p '{"status":{"lastFailureTime":null,"failedIssuanceAttempts":null}}'
```

It normally issues within a minute. Nothing is wrong with the configuration.

**Challenges pending and staying pending.** That is a real fault: the hostname has no listener on the Gateway, or DNS for it does not reach the Gateway's address. A name on a certificate with no listener answers 404 to its HTTP-01 challenge and blocks the whole certificate, including every other name on it.

## Runbook: Storage exhaustion

**Symptoms:** New workspace creation fails with storage errors. Existing sessions are unaffected.

**Step 1: Check PVC quota**

```bash
kubectl describe resourcequota -n <namespace> | grep persistentvolumeclaims
```

If at the hard limit, no new PVCs can be created.

**Step 2: Check storage capacity**

```bash
kubectl describe resourcequota -n <namespace> | grep requests.storage
```

**Step 3: Identify stale workspaces**

```bash
# List workspaces sorted by age
kubectl get workspaces.theia.cloud -n <namespace> \
  --sort-by=.metadata.creationTimestamp

# Count total workspaces
kubectl get workspaces.theia.cloud -n <namespace> --no-headers | wc -l
```

**Step 4: Delete old workspaces**

If the garbage collector has not yet run, manually delete workspaces older than the TTL:

```bash
kubectl delete workspace <workspace-name> -n <namespace>
```

The PVC is released according to the storage class reclaim policy. See [Storage and Quotas](/admins/platform/storage-and-quotas) for PVC cleanup.

**Step 5: Look for orphaned PersistentVolumes**

With a `Retain` reclaim policy, deleting a workspace leaves the underlying PV behind in the `Released` phase, still counting against your storage backend.

`Released` is a **PersistentVolume** phase, not a PersistentVolumeClaim phase. PVCs are only ever `Pending`, `Bound` or `Lost`, so a field selector for `Released` PVCs matches nothing and will mislead you into concluding there is nothing to clean up. PVs are also cluster-scoped, so no `-n` applies:

```bash
# Released PVs: correct
kubectl get pv --field-selector=status.phase=Released

# Narrow to the ones that belonged to this installation
kubectl get pv -o json \
  | jq -r '.items[] | select(.status.phase=="Released")
      | select(.spec.claimRef.namespace=="<namespace>")
      | .metadata.name'
```

Delete them once you are certain the data is not needed:

```bash
kubectl delete pv <pv-name>
```

**Mitigation:** Lower the garbage collection TTL temporarily to accelerate cleanup. See [Garbage Collection](/admins/operations/garbage-collection).

---

## Runbook: Node pressure / cluster capacity

**Symptoms:** Many pods are in `Pending` state. Session launches are slow or failing. Dashboards show high node CPU or memory utilisation.

**Step 1: Identify the bottleneck**

```bash
kubectl top nodes
kubectl describe nodes | grep -A 5 "Allocated resources"
```

**Step 2: Reduce pre-warmed instances temporarily**

```bash
curl -X PATCH \
  -H "X-Admin-Api-Token: $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minInstances": 0}' \
  https://<service-host>/service/admin/appdefinition/<app-definition-name>
```

Repeat for each affected App Definition. This frees scheduling space for active user sessions.

This endpoint needs the admin API token, which is not configured by default. See [Admin API Tokens](/admins/security/admin-api-tokens). If you have not set one up, edit the App Definition resource directly instead:

```bash
kubectl patch appdefinitions.theia.cloud <app-definition-name> -n <namespace> \
  --type=merge -p '{"spec":{"minInstances":0}}'
```

**Step 3: Communicate status**

If user-visible impact is ongoing, post a status update to the relevant channel. Include:
- What is affected (slow starts, new sessions failing, etc.)
- What is being done
- Expected resolution time if known

**Step 4: Scale cluster if needed**

If the pressure is sustained and expected (a large cohort exercise, for instance), coordinate with whoever manages the cluster's node pool to add capacity.

---

## Runbook: Operator not reconciling

**Symptoms:** App Definitions are updated but no new pre-warmed sessions appear. Sessions that should be cleaned up remain running. Session URLs stop being added to the instances HTTPRoute.

**Step 1: Check operator pod status**

```bash
kubectl get pods -n <namespace> -l app=operator
```

The chart default is **`operator.replicas: 1`**. One `Running` operator pod is a healthy operator, not a degraded one - do not escalate on a single replica unless you deliberately configured more. Check what you actually asked for:

```bash
kubectl get deployment operator-deployment -n <namespace> \
  -o jsonpath='{.spec.replicas} desired / {.status.readyReplicas} ready{"\n"}'
```

If a pod is missing or restarting, check for crash loops:

```bash
kubectl describe pod <operator-pod> -n <namespace>
kubectl logs <operator-pod> -n <namespace>
kubectl logs <operator-pod> -n <namespace> --previous
```

**Step 2: Check for CRD version mismatches**

After a CRD upgrade, the operator may fail to process resources if it is running an older version:

```bash
kubectl get crd | grep theia.cloud
```

Expect `workspaces.theia.cloud`, `sessions.theia.cloud` and `appdefinitions.theia.cloud`. To see the stored version of each:

```bash
kubectl get crd appdefinitions.theia.cloud \
  -o jsonpath='{.status.storedVersions}{"\n"}'
```

Confirm the CRD versions match what the currently running operator expects. The CRDs are installed by the **cluster-level** `eduide-cluster` chart and carry a `helm.sh/resource-policy: keep` annotation, so they survive a tenant uninstall and are upgraded independently of any one installation.

**Step 3: Restart the operator**

If logs show the operator is running but not reconciling (stuck in a watch loop, for instance):

```bash
kubectl rollout restart deployment/operator-deployment -n <namespace>
kubectl rollout status deployment/operator-deployment -n <namespace>
```

The Deployment is `operator-deployment`. `kubectl rollout restart deployment/operator` fails with `deployments.apps "operator" not found` - the short name is the pod **label**, not the Deployment name.

---

## Post-incident procedure

After every incident affecting a production installation:

1. **Confirm resolution** - Verify the platform is fully operational with a smoke-test session launch.
2. **Write up the timeline** - Document what happened, when it was detected, what was done, and when it was resolved.
3. **Identify root cause** - Was it a chart upgrade, a capacity event, a configuration drift, a certificate change, or an external dependency?
4. **Record follow-up actions** - Create tasks for any changes needed to prevent recurrence or improve detection speed.
5. **Update runbooks** - If this incident class was not covered, add it here.

Keep incident records even for minor events. Patterns across small incidents often predict larger ones.
