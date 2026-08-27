---
title: Rollback
description: Undoing a deploy that succeeded but behaves badly.
---

# Rollback

Deploys run with `--wait --atomic`, so a deploy that **fails** already rolls
itself back. This page is for the other case: the deploy succeeded, the pods are
healthy, and the release is wrong.

## Rolling back

```
Actions -> Rollback -> environment: <name>
```

or directly:

```bash
helm rollback eduide -n <namespace> --wait
```

Helm restores the previous revision. `helm history eduide -n <namespace>` shows
what you are going back to.

## What a rollback does not touch

**Sessions, workspaces and their volumes survive.** They are custom resources and
PersistentVolumeClaims that the release does not own the lifecycle of, so a
rollback does not disturb anyone's work. A student in a session will usually not
notice.

**CRDs are not rolled back.** They belong to `eduide-cluster`, not to the tenant
release. A rollback of the tenant chart cannot undo a CRD change.

That second point is the important one. If a release changed a CRD's stored
version, rolling back the tenant chart leaves the new CRD in place with an older
operator that may not understand it. **A CRD-breaking change needs a major
version bump and a written runbook, not a rollback.**

## When rollback is the wrong tool

| Situation | Do this instead |
|---|---|
| The images are wrong but the chart is fine | Redeploy with the correct `versions.*` |
| A certificate does not cover a hostname | Fix the certificate; the release is not the problem |
| A CRD changed incompatibly | Follow the release's runbook. Rolling back the tenant chart will not help |
| The cluster chart is wrong | Roll back `eduide-cluster` in `eduide-system`, and understand that this affects **every** installation on the cluster |

## Afterwards

A rollback is a statement that the deployed version was wrong. Say so somewhere
durable — an issue on the release — or the same version gets deployed again next
week.
