---
title: Deploying Pull Requests
description: How to deploy preview images and preview charts from pull requests to a test installation.
---

# Deploying Pull Requests

Pull requests in the EduIDE repositories publish preview artifacts on each commit. You test them by deploying them to a test installation. Previews are never published as `latest`.

## Preview artifacts

| Repository | Preview artifact | Tag or version |
| --- | --- | --- |
| EduIDE-control-plane | Images `operator`, `service`, `authz`, `agent`, `pool-scaler` and `landing-page` | `pr-<number>` |
| EduIDE | IDE images, every edition of every language | `pr-<number>` |
| EduIDE-Helm | The installation chart | `<version>-pr.<number>.<sha7>` |

- **Control plane images.** The `images.yml` workflow builds them on every pull request. After a push to `main`, the images carry `main` and `sha-<7>`. Release tags give `X.Y.Z`.
- **IDE images.** One pull request build publishes all editions under the same tag.
- **Charts.** The `preview` job publishes a preview version on every push, only for pull requests from a branch of the EduIDE-Helm repository itself, so a fork gets no preview. For a release version the preview sorts below the release (`3.0.0-pr.79.<sha7>` is below `3.0.0`). For a prerelease base it sorts above that prerelease, so pin the chart version explicitly in that case.

A `pr-<number>` tag moves with each commit. A node that already has the image can run a stale one when the pull policy is `IfNotPresent`. For a test deployment, pin the image by digest (`pr-<number>@sha256:...`) or use an immutable tag such as `sha-<7>`.

## Deploy to a test installation

The EduIDE Deployment repository is the one place where preview artifacts from several repositories meet. Open Actions and run **Deploy environment** (`deploy-dispatch.yml`).

| Input | Meaning |
| --- | --- |
| `environment` | The target, named after its host name. Use a test installation for previews. |
| `chart_version` | Chart version of the installation chart. Blank uses the installation's own pin. |
| `control_plane_tag` | Tag for the control plane images. Blank uses the chart default. |
| `ide_tag` | Tag for the IDE images. |
| `landing_page_tag` | Tag for the landing page. |
| `clean_install` | Purge the namespace first. Never allowed for production. |
| `dry_run` | Render and diff only, apply nothing. |

The input names follow the settings of the workflow. Check the workflow file in EduIDE Deployment for the exact names if they differ.

Leave an input blank to keep the chart's own version for that part. Never use one tag for everything: a pull request builds only the images of its own repository, and a tag that does not exist puts the other pods into `ImagePullBackOff`.

Only one deploy runs per environment at a time, and a running deploy is never cancelled.

## Which input for which pull request

| Pull request in | Set |
| --- | --- |
| EduIDE-control-plane | `control_plane_tag` and `landing_page_tag` to `pr-<number>` (or a digest) |
| EduIDE | `ide_tag` to `pr-<number>` |
| EduIDE-Helm | `chart_version` to the preview version |
| EduIDE Deployment | Run the workflow from that branch |

A pull request that adds a template or a new image only works together with a chart that lists it, so combine it with the matching chart preview.

Set several inputs in one run to test pull requests of different repositories together. The combination point is always the `Deploy environment` run.

## Recommended workflow

1. Open the pull request in the repository that builds the artifact.
2. Wait until the build has published the preview images or charts.
3. Run `Deploy environment` with `dry_run` on.
4. Open the diff in the run summary. The workflow ignores a failing `helm diff`, so a green dry run does not prove the diff worked. If the diff shows an error or is empty without reason, stop and fix the inputs. Otherwise run it again with `dry_run` off.
5. Validate the result in the test installation, for example one warm and one cold start and a launch from an Artemis link.

## Without the workflow

You can also install a preview yourself on a test cluster that you own. Point the chart values at the `pr-<number>` image tags and install the preview chart version with `helm upgrade --install <release> "$EDUIDE_CHART" --version <preview version> ...`. The variable `EDUIDE_CHART` is defined in the chart reference of [Installing](/admins/install/installing). Use the isolated `KUBECONFIG` rule from [Local Development](/developer/guides/local-development) and deploy only to test installations.

## Quick reference

- Workflow: `Deploy environment` in EduIDE Deployment
- Image previews: `pr-<number>`, pinned by digest for a test deployment
- Chart previews: `<version>-pr.<number>.<sha7>` through `chart_version`
- Production never accepts `clean_install`
