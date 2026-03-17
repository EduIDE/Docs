---
title: Deploying Pull Requests
description: How to deploy PR artifacts from EduIDE Cloud, EduIDE Deployment, and Theia Cloud Helm.
---

# Deploying Pull Requests

EduIDE uses preview-style deployment workflows across multiple repositories. The details differ slightly by repository, but the pattern is the same:

- a pull request build publishes preview artifacts on each commit
- those artifacts are tagged with a PR-specific identifier
- EduIDE Deployment is then used to deploy those artifacts to a test environment

For most contributor workflows, EduIDE Deployment is the final place where preview artifacts are selected and combined into a running system.

## The Common Tagging Pattern

The important idea is that pull request artifacts are not published as `latest`.

Instead, they are published with PR-specific tags such as:

- `pr-123`
- `pr-123-<short-sha>` for image variants that also carry a commit suffix
- `<chart-version>.pr-123` for Helm chart previews

This allows multiple pull requests to coexist without overwriting each other.

## Deploying EduIDE Cloud Pull Requests

EduIDE Cloud publishes preview images for pull requests through its `Build and Push Theia Cloud Images` workflow.

For pull requests, the workflow computes:

- `base_tag=pr-<pull-request-number>`
- `sha_tag=pr-<pull-request-number>-<short-sha>`

Those tags are then pushed for the main cloud components:

- `ghcr.io/eduide/eduide-cloud/operator`
- `ghcr.io/eduide/eduide-cloud/service`
- `ghcr.io/eduide/eduide-cloud/landing-page`

### How to deploy that PR

Go to the EduIDE Deployment repository and run the `Deploy PR to Environment` workflow manually.

The relevant `workflow_dispatch` inputs are:

- `environment`
- `theia_cloud_tag`
- `ide_images_tag`
- `helm_chart_tag`

For an EduIDE Cloud PR, set:

- `environment` to the target test environment such as `test1`, `test2`, or `test3`
- `theia_cloud_tag` to `pr-<number>`
- `ide_images_tag` to `latest` unless you also need preview IDE images
- `helm_chart_tag` empty unless you also need preview Helm charts

Internally, EduIDE Deployment maps `theia_cloud_tag` to:

- `theia-cloud.operator.image`
- `theia-cloud.service.image`
- `theia-cloud.landingPage.image`
- the landing page preloading image

So one workflow input updates the whole EduIDE Cloud component set consistently.

## Deploying EduIDE Pull Requests

The same idea applies to pull requests in the EduIDE image repository.

Those pull requests publish preview IDE image tags, and EduIDE Deployment consumes them through the `ide_images_tag` input.

This affects:

- the default app definition image tag
- the preloading image list for the language-specific IDE images

### How to deploy that PR

Run the `Deploy PR to Environment` workflow in EduIDE Deployment and set:

- `environment` to the target test environment
- `theia_cloud_tag` to `latest` unless you also need a cloud preview
- `ide_images_tag` to `pr-<number>`
- `helm_chart_tag` empty unless you also need preview Helm charts

Use this when your pull request changes the actual IDE images, bundled tools, or application-definition-backed environment contents.

## Deploying Theia Cloud Helm Pull Requests

Pull requests in Theia Cloud Helm publish preview OCI chart versions through the `release-pr-preview` workflow.

The preview version format is:

- `<base-chart-version>.pr-<number>`

This is published for:

- `theia-cloud-base`
- `theia-cloud-crds`
- `theia-cloud`

EduIDE Deployment supports consuming those preview charts through the `helm_chart_tag` input.

### How to deploy that PR

Run the `Deploy PR to Environment` workflow in EduIDE Deployment and set:

- `environment` to the target test environment
- `helm_chart_tag` to `pr-<number>`
- `theia_cloud_tag` and `ide_images_tag` as needed, usually `latest`

When `helm_chart_tag` is set, EduIDE Deployment patches the combined chart dependency version and also adjusts the base and CRD chart versions so they resolve to the preview OCI artifacts.

Use this when your PR changes upstream chart behavior, CRDs, or chart packaging rather than the runtime images themselves.

## Deploying EduIDE Deployment Pull Requests

Pull requests in EduIDE Deployment itself are slightly different. In this case the thing being previewed is the deployment logic, chart composition, values handling, or workflow behavior in the deployment repository itself.

The principle is still the same:

- your PR branch contains the deployment change
- the deployment workflow is run from that PR context
- the selected environment receives the chart and values logic from the PR branch

### How to deploy that PR

Open the pull request in EduIDE Deployment or run the `Deploy PR to Environment` workflow from the PR branch context, then choose the target test environment.

Use the extra tag inputs only if your deployment PR also depends on preview artifacts from other repositories:

- `theia_cloud_tag` for EduIDE Cloud previews
- `ide_images_tag` for EduIDE image previews
- `helm_chart_tag` for Theia Cloud Helm previews

This is the normal way to validate deployment-logic changes before merging them.

## Combining Multiple Pull Requests

One of the strengths of the workflow is that you can combine preview artifacts from multiple repositories in one test deployment.

Examples:

- EduIDE Cloud PR + EduIDE Deployment PR
- EduIDE image PR + EduIDE Deployment PR
- Theia Cloud Helm PR + EduIDE Cloud PR + EduIDE Deployment PR

The combination point is always EduIDE Deployment, because that is where the final test environment is assembled.

## Recommended Workflow

Use this sequence:

1. Open the pull request in the repository that builds the artifact.
2. Wait for the preview images or charts to be published.
3. Open EduIDE Deployment.
4. Run `Deploy PR to Environment`.
5. Set the inputs that correspond to the repositories you want to preview.
6. Validate the result in the chosen test environment.

## Quick Mapping

| Repository | Preview artifact | Deployment input |
| --- | --- | --- |
| EduIDE Cloud | operator, service, landing-page images tagged `pr-<number>` | `theia_cloud_tag` |
| EduIDE | IDE images tagged `pr-<number>` | `ide_images_tag` |
| Theia Cloud Helm | OCI chart versions suffixed with `.pr-<number>` | `helm_chart_tag` |
| EduIDE Deployment | deployment logic from the PR branch itself | run deployment workflow from that PR context |

## Summary

Pull request deployment in EduIDE is centered around PR-tagged preview artifacts and a single assembly point in EduIDE Deployment. Most of the time, the only thing you really need to know is which repository produced the preview artifact and which input in `Deploy PR to Environment` selects it.
