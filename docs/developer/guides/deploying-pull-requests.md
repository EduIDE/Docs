---
title: Deploying Pull Requests
description: How to deploy preview images and preview charts from pull requests to a test environment.
---

# Deploying Pull Requests

EduIDE uses preview artifacts across repositories. The pattern is the same everywhere:

- a pull request build publishes preview artifacts on each commit
- those artifacts carry a PR-specific tag or version
- the `Deploy environment` workflow in EduIDE Deployment combines them in one test environment

EduIDE Deployment is the only place where preview artifacts from several repositories meet. The charts live in EduIDE Helm and are consumed from `ghcr.io/eduide/charts`.

## The Tagging Pattern

Pull request artifacts are never published as `latest`.

- **Images** (EduIDE Cloud, EduIDE, the landing page) get the tag `pr-<number>`. The shared build workflow in `EduIDE/.github` computes it for every pull request.
- **Charts** (EduIDE Helm) get a preview version on every push, published by the `release-pr-preview` job of `release.yml` for both charts, `eduide-cluster` and `eduide`. The version is the chart's version with a PR suffix and the short commit hash: `3.0.0-pr.79.<sha7>` for chart 3.0.0 and pull request 79. If the chart version already is a prerelease, the suffix is appended with a dot instead (`<version>.pr.<number>.<sha7>`). A preview sorts below the release it previews, so `helm upgrade` never picks it up by accident.

Several pull requests coexist because each has its own tag or version.

## The Deploy Workflow

Open the EduIDE Deployment repository, go to Actions, and run **Deploy environment** (`deploy-dispatch.yml`). Its inputs:

| Input | Meaning |
| --- | --- |
| `environment` | The target, a choice of full hostnames such as `test1.eduide.student.k8s.aet.cit.tum.de`. Use a test environment (`test1`, `test2`, `e2e`) for previews. |
| `chart_version` | Chart version for the `eduide` chart. Blank uses the environment's own pin. |
| `control_plane_tag` | Tag for operator and service. Blank uses the chart default. |
| `ide_tag` | Tag for the IDE images. |
| `landing_page_tag` | Tag for the landing page. |
| `clean_install` | Purge the namespace first. Never allowed for production. |
| `dry_run` | Render and diff only, apply nothing. |

The workflow turns the three tag inputs into one override per source repository and passes them to the shared deploy as `--set versions.cloud=...`, `--set versions.ide=...` and `--set versions.landingPage=...`. Leave an input blank to keep the chart's own version for that repository. Never use one tag for everything: a pull request builds only the images of its own repository, and a tag that does not exist puts the other pods into `ImagePullBackOff`.

Only one deploy runs per environment at a time, and a running deploy is never cancelled.

Use `dry_run` first when you combine several previews. It renders the chart and shows the diff against the live release.

## Which Input for Which Pull Request

| Repository | Preview artifact | Deploy input |
| --- | --- | --- |
| EduIDE Cloud | operator, service images `pr-<number>` | `control_plane_tag` = `pr-<number>` |
| EduIDE | IDE images `pr-<number>` | `ide_tag` = `pr-<number>` |
| EduIDE Landing Page | landing page image `pr-<number>` | `landing_page_tag` = `pr-<number>` |
| EduIDE Helm | chart `eduide` version `<version>-pr.<number>.<sha7>` | `chart_version` = that version |
| EduIDE Deployment | workflow and values from the branch | run the workflow from that branch |

The IDE images follow the pull request build of the EduIDE repository, which builds all editions (`<lang>-standalone` and `<lang>-artemis`) under the same tag. One `ide_tag` therefore selects them all. A pull request that changes the image set only works together with a chart that knows the new apps, so combine it with the matching chart preview.

## Example: the 3.0 Image Editions

The editions touch four repositories at once, so a test deployment sets all of them:

- `chart_version`: `3.0.0-pr.79.<sha7>` (EduIDE Helm pull request 79)
- `ide_tag`: `pr-223` (the integration build of the EduIDE pull requests)
- `landing_page_tag`: `pr-66` (EduIDE Landing Page pull request 66)
- the workflow runs from the EduIDE Deployment branch `feat/image-editions`

The chart for the cluster (`eduide-cluster`) is installed separately by the `Bootstrap cluster` workflow, which takes its own `chart_version`. Run it only if your change touches the cluster chart, for example CRDs, the conversion webhook or dashboards.

## Combining Pull Requests

Set several inputs in one run to test pull requests of different repositories together, for example an EduIDE Cloud pull request with an EduIDE Deployment pull request, or a chart preview with matching IDE images. The combination point is always the `Deploy environment` run.

## Recommended Workflow

1. Open the pull request in the repository that builds the artifact.
2. Wait until the build has published the preview images or charts.
3. Open EduIDE Deployment and run `Deploy environment` with `dry_run` on.
4. Check the diff, then run it again with `dry_run` off.
5. Validate the result in the chosen test environment.

## Quick Reference

- Workflow: `Deploy environment` in EduIDE Deployment
- Image previews: `pr-<number>` through `control_plane_tag`, `ide_tag`, `landing_page_tag`
- Chart previews: `<version>-pr.<number>.<sha7>` through `chart_version`
- Production never accepts `clean_install`
