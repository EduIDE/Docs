---
title: Provisioning
description: The path from an empty cluster to the first launched session.
---

# Provisioning

A short map of the steps. Each step links to the page that explains it.

| Step | Page |
|---|---|
| 1. Check the cluster: Envoy Gateway 1.8 or newer, cert-manager, an enforcing CNI | [Prerequisites](../install/prerequisites.md) |
| 2. Reserve three hostnames and DNS records | [Hostnames and Certificates](../install/certificates.md) |
| 3. Create the Keycloak clients and the admin role | [Access Control](access-control.md) |
| 4. Install the CRDs, then the installation chart | [Installing EduIDE](../install/installing.md) |
| 5. Choose templates and pools | [Templates and Pools](templates-and-pools.md) |
| 6. Choose storage and retention for saved workspaces | [Storage and Workspaces](storage-and-workspaces.md) |
| 7. Switch on monitoring and tracing | [Monitoring](../operations/monitoring-basics.md) |
| 8. Run the checks and launch a session | [Installing EduIDE](../install/installing.md#verify) |

## First launch

Open `https://<service host>/`, sign in and pick a start tile.
The landing page shows "Your sessions" for existing sessions and workspaces, and "Start new" with one tile per listed template.
With a pool the IDE opens within about two seconds. Without one, a cold start takes a few seconds to half a minute, mostly image pulls on a fresh node.
Inside the IDE, File, "Back to Landing Page" returns to the landing page.

## Before an exam or a course start

- Raise `minIdle` of the pools some time before the start, so the idle instances exist and their images are on the nodes.
- Check capacity: sessions that find no room fail with `capacity-exhausted` after 45 seconds.
- Check the public status page and the admin panel ([Admin Access](../security/admin-access.md)).
- Do not upgrade during the event ([Upgrades](../maintenance/upgrades.md)).
