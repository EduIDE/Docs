---
title: Rollback
description: Undoing an upgrade that succeeded but behaves badly, with helm rollback.
---

# Rollback

The charts are OCI artifacts, and Helm keeps the history of each release. This page is for the case that the upgrade succeeded, the pods are healthy, and the release is wrong.
Use `helm upgrade --atomic --wait` and a failed upgrade rolls itself back.

## Rolling back

```bash
helm history eduide -n eduide-<deployment>
helm rollback eduide <revision> -n eduide-<deployment> --wait --timeout 15m
```

Without a revision, Helm goes back one revision. Helm restores the previous chart version and values. You do not need the old chart on disk.
If you pin versions with `$EDUIDE_VERSION` ([Chart reference](../install/installing.md)), you can also run `helm upgrade` with the older version and the old values file. Both end in the same state.

## What a rollback does not touch

- Sessions and saved workspaces survive. They are objects and volumes that the release does not own the lifecycle of. A student in a session usually does not notice.
- The CRDs stay. The cluster chart is separate and its changes are additive, so an older control plane ignores unknown fields.
- A template that the older revision does not have is removed by the rollback, and so is its pool. Sessions that already run on it keep running until they end. New launches of it fail with `template-not-found`.

## When rollback is the wrong tool

| Situation | Do this instead |
|---|---|
| The IDE image is wrong but the chart is fine | Pin the correct `images.tag` or template `tag` and upgrade |
| A certificate does not cover a hostname | Fix the certificate. The release is not the problem |
| A CRD changed incompatibly | Follow the runbook of that release. A rollback of the deployment chart will not help |
| You are rolling back from 3.x to 2.x | Not a rollback. See the way back in [Upgrades](upgrades.md#migrating-from-2x) |

## Afterwards

A rollback says the deployed version was wrong. Write it down in an issue on the release, or the same version gets deployed again next week.
