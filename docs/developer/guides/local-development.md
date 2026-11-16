---
title: Local Development
description: How local development is used in the EduIDE ecosystem.
---

# Local Development

Local development in EduIDE is different from a typical monolith workflow. The normal goal is not to boot the entire platform on a laptop and do all validation locally. Most changes are made in the repository that owns the feature, then deployed to a shared test environment through EduIDE Deployment.

## Default Development Model

The usual workflow is:

1. Make the change in the relevant repository.
2. Validate that repository locally as far as it makes sense.
3. Build preview artifacts if the repository publishes them for pull requests.
4. Deploy the change to one of the test environments through EduIDE Deployment.
5. Validate behavior against a real running cluster.

This is the preferred approach because the platform depends on Kubernetes behavior, routing, authentication, storage, and multiple interacting services. Those parts are usually easier to validate in the test clusters than in a fully local setup.

## Why Full Local Development Is Not the Default

Running the whole EduIDE system locally is usually not how feature work is done.

The main reasons are:

- the complete platform depends on Kubernetes-native behavior
- routing and authentication flows are part of the actual runtime behavior
- service and operator changes usually only make sense against a realistic cluster
- test environments already exist and are closer to the production shape than an ad hoc local stack

In practice, this means "local development" usually means local work on one component, not full local reproduction of the whole platform.

## When Local Testing Still Makes Sense

Local testing is still useful for focused tasks where only one part of the stack matters.

Typical examples include:

- testing a Theia or VS Code extension inside a local Theia application
- iterating on the user interface of the landing page or a dashboard
- validating isolated service logic or request handling
- running repository-local unit tests, linters, and build steps
- checking generated output such as charts, docs, or API clients

This kind of local work is especially effective when the change does not depend on real cluster reconciliation or real session routing behavior.

## Extensions and Theia-Specific Work

For extension work, local feedback loops are often good enough and much faster than deploying every small iteration.

Examples:

- testing UI behavior in Theia
- validating command registration and configuration handling
- checking extension-side integration logic
- iterating on runtime injection consumers inside the IDE

This is one of the main exceptions to the "deploy to test clusters" rule.

## Service and Operator Work

Changes involving the EduIDE Cloud service and operator usually need the real system shape.

That is because these tasks often involve:

- custom resources
- reconciliation logic
- session lifecycle handling
- routing updates
- authentication interactions
- persistent storage behavior
- concurrency under burst load

For those cases, the easiest and most reliable validation path is usually the shared test cluster, not a fully local stack.

## Recommended Rule of Thumb

Use local development when:

- the change is isolated to one repository or one runtime component
- the behavior can be meaningfully validated without the full cluster
- fast iteration matters more than end-to-end realism

Use the test environments when:

- the change affects service and operator interaction
- the change depends on routing or authentication
- the change affects session lifecycle behavior
- the change needs a realistic end-to-end deployment

## Commands per repository

These are the commands that work today. Each repository's `AGENTS.md` is the reference when they change.

| Repository | What to run |
|---|---|
| EduIDE | Build and run an image: `docker compose -f docker-compose.images.yml up --build java-17-standalone`. Each service publishes its own port on `127.0.0.1` (`3103` for `java-17-standalone`). Check a built image: `scripts/smoke-test-image.sh <image> <standalone\|artemis>`, which also runs every template's Test task without network access. |
| EduIDE-Cloud, Java | There is no aggregator POM. Install the modules by hand in order (`java/common/maven-conf`, `org.eclipse.theia.cloud.common`, `org.eclipse.theia.cloud.operator`, then `defaultoperator`), each with `mvn clean install -Drevision=<version>-SNAPSHOT`. Run the service tests with `cd java/service/org.eclipse.theia.cloud.service && mvn verify`. Use JDK 21. The tests start containers; on OrbStack set `DOCKER_API_VERSION=1.44`, and if port 8081 is taken pass `-Dquarkus.http.test-port=18081`. |
| EduIDE-Cloud, monitor | `cd node/monitor && npm test` (runs under `node:test`, no VS Code needed). |
| EduIDE-data-bridge | pnpm 10 only. `vscode-test` needs a real VS Code; locally, run the compiled tests with mocha and a stub for the `vscode` module. |
| EduIDE-Helm | `helm lint` and `helm template` on both charts. A pull request preview chart is published for every push, see [Deploying Pull Requests](/developer/guides/deploying-pull-requests). |

Docs: `npm ci`, `npm run build` and `bash scripts/check-docs.sh`.

## Summary

EduIDE development is repository-local first and environment-based second. You usually do not run the complete platform locally. Instead, you validate locally where that is efficient and deploy to the test clusters when the change depends on the real cloud runtime.
