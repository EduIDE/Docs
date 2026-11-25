---
title: Contributing
description: Branches, commits, tags, changelogs and checks that apply in every EduIDE repository.
---

# Contributing

These basics hold in every repository of the EduIDE organization. A repository's `AGENTS.md` and `README.md` add what is specific to it. For the control plane, read the "Contributing" section of its [README](https://github.com/EduIDE/EduIDE-control-plane#contributing) too.

## Branches and pull requests

- Work on a branch and open a pull request against `main`. Nothing is pushed to `main` directly.
- Keep a pull request to one change. CI must pass before it is merged.
- Describe what you tested. A pull request in the control plane repository also builds images tagged `pr-<number>` that you can deploy to a test installation, see [Deploying Pull Requests](/developer/guides/deploying-pull-requests).
- Do not put secrets, tokens or exploit details into a commit, an issue or a pull request. The repositories are public. Describe a security fix by what it protects, and tell admins what they must do.

## Commits

Write the commit message for a reader who does not know the change: what changed and why, in the present tense. Squash fixups before merging.

## Rules of the control plane repository

- **Contracts first.** API and CRD changes are additive within a version and start in `api/`. Run `make generate` and never edit generated files.
- **Tests come with the change.** Table-driven unit tests, envtest for controllers, `make e2e` for anything on the request path.
- **Isolate `KUBECONFIG`** for every local cluster command, see [Local Development](/developer/guides/local-development).
- **Decisions get an ADR.** Anything beyond an additive change needs a record in [`docs/adr`](https://github.com/EduIDE/EduIDE-control-plane/tree/main/docs/adr).
- **No institution-specific defaults.** Hosts, realms and node labels live in deployment values.
- **Words.** Template, pool, instance, session, workspace, claim, release, launch data.

## Changelog

Every released repository keeps a `CHANGELOG.md`. Add user-facing changes under `## [Unreleased]`, grouped as features, fixes, security, dependencies and breaking changes, with the pull request link. The release moves that section under the new version, and the release workflow copies it into the GitHub Release. See [Releases and Dependencies](/developer/guides/releases-and-dependencies).

## Tags and versions

Tags are `vX.Y.Z` (`vX.Y.Z-rc.N` for a release candidate). A `tag-format` workflow rejects other spellings in the repositories that have it. Versions follow semver: a breaking change is a major release.

## Checks in CI

- The build and test workflow of the repository. The control plane runs lint, tests, generated-code and contract checks, image builds and Trivy. The job `ci-ok` fails when any job fails.
- `dependency-review` on pull requests, in the repositories that have it.
- Renovate proposes dependency updates through the shared preset of the organization.

## Docs

Change the docs in the same piece of work as the code, in the repository's own README or docs folder, or in the [Docs](https://github.com/EduIDE/Docs) repository for the global pages.
