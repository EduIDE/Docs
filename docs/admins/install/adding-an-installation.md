---
title: Adding an Installation
description: Standing up a further EduIDE deployment for a course, department or university in the same cluster or another.
---

# Adding an Installation

An installation is one deployment: one namespace with its own hostnames, OIDC realm, templates and branding.
The CRDs are shared, so adding an installation to a cluster that already runs EduIDE needs no cluster-wide step.
Use the variables from the [Chart reference](installing.md).

## Checklist

1. **Hostnames.** Three names and DNS records, see [Hostnames and Certificates](certificates.md).
2. **Keycloak.** One realm per deployment, with the client from [Installing EduIDE](installing.md#keycloak), and the admin role if you want the admin panel ([Admin Access](../security/admin-access.md)).
3. **Namespace and secret.** `kubectl create namespace eduide-<deployment>` and the gateway client secret.
4. **Values file.** Copy a values file of an existing deployment and change the deployment name, hosts, realm, `allowedHosts`, templates and branding. Keep the values file in Git, without secrets.
5. **Install.**

```bash
helm upgrade --install eduide $EDUIDE_CHART --version $EDUIDE_VERSION \
  --namespace eduide-<deployment> --create-namespace -f values.yaml
```

6. **Verify** with the checks at the end of [Installing EduIDE](installing.md#verify), including the NetworkPolicy smoke test.

## Things that differ per installation

| Setting | Why |
|---|---|
| `config.deployment` | Label in metrics and traces. Unique per cluster. |
| `config.hosts.*` | Three own hostnames. |
| `config.oidc.*` | Own realm and clients. Users of one deployment cannot sign in to another by accident. |
| `config.allowedHosts` | The Git and Artemis hosts of this course. |
| Landing page `legal`, `config.title` | Imprint, privacy policy and title are the institution's own texts. |
| `templates` and pools | Which editions and how many warm instances. |
| `networkPolicy.sessionEgressExtraDeny` | Pod and node ranges of the cluster, if public. |

Quotas, the node pool and the monitoring namespace are cluster facts. Reuse them from a working installation on the same cluster.
If you keep installations in a deployment repository, one directory per installation with its values file is enough.
Do not deploy a productive installation during an exam period of another one on the same cluster without checking capacity.
