---
title: Release and Version Policy
description: What a version number means here, and how a release is cut.
---

# Release and Version Policy

## One version, one meaning

| Thing | Form | Example |
|---|---|---|
| git tag | `vX.Y.Z` | `v2.0.0` |
| chart `version` | `X.Y.Z` | `2.0.0` |
| image tag | `X.Y.Z` | `1.2.0` |
| chart `appVersion` | the EduIDE IDE image version | `1.2.0` |

The chart version is the **platform** version and is what an installation pins.
`appVersion` is the tag of the IDE images, so a chart states exactly which IDEs
it runs.

The operator, REST service and landing page carry their own versions in
`versions.cloud` and `versions.landingPage`, because they release on a different
cadence. A one-line landing-page fix should not rebuild fifteen multi-gigabyte
IDE images.

Three spellings of a git tag existed historically — `1.1.0`, `v1.1.0` and
`v.1.1.1` — which is why nothing could reliably answer "which release produced
this image". A shared CI check now rejects anything that is not `vX.Y.Z`. Old
tags are not retagged.

:::warning A caller can defeat the `v` stripping
The shared build workflow derives the image tag with `${RELEASE_TAG#v}`, but an
`image-tag` **override is used verbatim**. A repository that passes
`github.event.release.tag_name` as that override therefore publishes `v1.2.0`,
which no chart can consume, while a tag spelled `1.2.0` produces the right image
and merely fails the tag-format check.

That combination hides the fault: the spelling that passes CI is the one that
breaks the images. If a release publishes `v`-prefixed images, this is why.
Callers should not pass `image-tag` on a release event at all.
:::

## Cutting a release

Each repository releases on its own. EduIDE, EduIDE-Cloud and the landing page
cut their own versions; a chart release then says which of them belong
together, and a deployment pull request says which installations get them.
Moving an installation to a new IDE version is therefore three merges, in this
order:

| Step | Repository | Result |
|---|---|---|
| 1 | EduIDE, EduIDE-Cloud or EduIDE-Landing-Page | A `vX.Y.Z` release; its build publishes the images |
| 2 | EduIDE-Helm | A pull request moving `appVersion`, `versions.cloud` or `versions.landingPage`, and both chart versions |
| 3 | EduIDE-deployment | A pull request moving `chartVersion`; merging it is the deploy |

A GitHub release does not prove its images exist: the image build runs after
the tag and can fail. Merging the chart pull request runs `release.yml`, which:

1. **Verifies every image the chart pins exists**, for both architectures. The
   IDE image list is read from EduIDE's build matrix at run time, not kept by
   hand, so a chart cannot pass while naming images nobody pushed.
2. **Publishes each chart version** that is not published yet.
3. **Tags the repository** `vX.Y.Z`.
4. **Creates a GitHub release** that names what the chart version pins.

CI also checks that both charts carry the same version.

The release train in EduIDE-Helm still exists for a **lockstep** release that
moves all repositories to one number. It is not the ordinary path, and on a
normal `main` its pre-check fails by design.

## Channels

An installation is `release` or `main`.

- `release` pins whatever its values file says. Nothing that happens on `main`
  can move a production image.
- `main` resolves an immutable `latest-<sha>` tag. Never a floating tag: with a
  floating tag the pod template does not change between upgrades, so Helm sees
  no difference, reports success without pulling, and `--atomic` has nothing to
  roll back.

## Upgrading an installation

Change `chartVersion` in that environment's `env.yaml` and open a pull request.
CI renders the change; the diff shows what will happen before anyone approves
it. Production environments require a reviewer on the GitHub Environment, so the
approval is recorded on the run.
