---
title: Release and Version Policy
description: What a version number means here, and how a release is cut.
---

# Release and Version Policy

## One version, one meaning

| Thing | Form | Example |
|---|---|---|
| git tag | `vX.Y.Z` | `v3.0.0` |
| chart `version` | `X.Y.Z` | `3.0.0` |
| image tag | `X.Y.Z` | `2.0.0` |
| chart `appVersion` | the EduIDE IDE image version | `2.0.0` |

The chart version is the **platform** version and is what an installation pins.
`appVersion` is the tag of the IDE images, so a chart states exactly which IDEs
it runs.

The operator, REST service and landing page carry their own versions in
`versions.cloud` and `versions.landingPage`, because they release on a different
cadence. A one-line landing-page fix should not rebuild fifteen multi-gigabyte
IDE images.

Three spellings of a git tag existed historically (`1.1.0`, `v1.1.0` and
`v.1.1.1`), which is why nothing could reliably answer "which release produced
this image". The chart repositories workspace-garbage-collector and
EduIDE-shared-cache used their own prefixed tags (`theia-workspace-garbage-collector-X.Y.Z`,
`eduide-shared-cache-X.Y.Z`) until 0.2.0 and 0.5.3. Every repository now tags
`vX.Y.Z` (`vX.Y.Z-rc.N` for a release candidate), and a shared CI check rejects
anything else. Old tags are not retagged.

:::warning A caller can defeat the `v` stripping
The shared build workflow derives the image tag with `${RELEASE_TAG#v}`, but an
`image-tag` **override is used verbatim**. A repository that passes
`github.event.release.tag_name` as that override therefore publishes `v1.2.0`,
which no chart can consume, while a tag spelled `1.2.0` produces the right image
and merely fails the tag-format check.

That combination hides the fault: the spelling that passes CI is the one that
breaks the images. If a release publishes `v`-prefixed images, this is why.
A manual `release.yml` therefore passes the version without the `v` (`X.Y.Z`) as `image-tag`.
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
| 2 | EduIDE-Helm | A release pull request moving `appVersion`, `versions.cloud` or `versions.landingPage`, and both chart versions, then a dispatch of `release.yml` |
| 3 | EduIDE-deployment | A pull request moving `chartVersion`; merging it deploys only `e2e`, every other environment is deployed with `Deploy environment` |

Every step is a manual release: the repository's release skill
(`.claude/skills/release/SKILL.md`) opens the release pull request and then
dispatches `release.yml`. A release starts as a draft and is only published, and
tagged, once every artifact is built and verified, so a failed build leaves no
tag. See [Releases and Dependencies](/developer/guides/releases-and-dependencies)
for the whole flow and the release order.

For EduIDE-Helm, `release.yml` is a manual `workflow_dispatch` with the input `version` (`X.Y.Z` or `X.Y.Z-rc.N`). Merging the chart pull request releases nothing, and there is no release train. It:

1. **Verifies the pinned images exist**, for both architectures. The IDE image
   list is read from EduIDE's build matrix at run time, not kept by hand. It is
   not compared with the chart's app definitions, so an app whose image left the
   matrix (such as `rust-latest` on chart 2.6.2, which EduIDE 1.5.0 no longer publishes) passes
   this check and fails at pull time. Check the app definitions yourself when a
   release removes an image.
2. **Checks the `buildSystems` ids** of the catalog against the `template.json` files in the published images, and the conversion-webhook image.
3. **Publishes both chart versions**, and refuses a version that is already published.
4. **Adds what the chart version pins** to the release notes.
5. **Publishes the GitHub release**, which creates the tag `vX.Y.Z`.

CI also checks that both charts carry the same version.

## Channels

An installation is `release`, `main` or `pinned`.

- `release` pins whatever its values file says. Nothing that happens on `main`
  can move a production image.
- `main` keeps the chart's pins and restarts the operator, the service and the landing page after the upgrade, so a floating tag is pulled again. The deploys that follow component branches (`e2e` and `staging`) pass immutable `latest-<sha>` tags instead. A floating tag alone would leave the pod template unchanged, so Helm would see no difference and report success without pulling.
- `pinned` is accepted by the environment schema, but the manifest has no field for an image tag. Do not use it until the deployment repository documents what it pins.

## Upgrading an installation

Change `chartVersion` in that environment's `env.yaml` and open a pull request.
CI renders the change; the diff shows what will happen before anyone approves
it. Merging does not deploy, except for `e2e` (`deploy-e2e.yml`). Every other
environment is deployed with the `Deploy environment` workflow, where production
and staging require a reviewer on the GitHub Environment, so the approval is
recorded on the run.
