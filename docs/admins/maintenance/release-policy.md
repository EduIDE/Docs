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

The release train in EduIDE-Helm does it, and defaults to `dry_run: true`.

1. **Validate** the version is semver and the tag is unused.
2. **Build every component at that tag** — but tag nothing yet. Building fifteen
   large images is the flakiest step in the pipeline; tagging afterwards means a
   flake costs a re-run rather than stranding immutable tags on repositories
   whose images were never published.
3. **Verify every expected image exists**, for both architectures. The IDE image
   list is read from EduIDE's build matrix at run time, not kept by hand — a
   hand-kept copy went stale within days and would have let a release verify ten
   of twelve images and pass.
4. **Only now tag and release** the component repositories.
5. **Publish both charts** at the same version.
6. **Open a bump pull request** against each production installation. Production
   is never deployed automatically.

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
