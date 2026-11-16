---
title: Contributing
description: Branches, commits, tags, changelogs and checks that apply in every EduIDE repository.
---

# Contributing

These basics hold in every repository of the EduIDE organization. A repository's `AGENTS.md` and `README.md` add what is specific to it.

## Branches and pull requests

- Work on a branch and open a pull request against `main`. Nothing is pushed to `main` directly.
- Keep a pull request to one change. CI must pass before it is merged.
- Do not put secrets, tokens or exploit details into a commit, an issue or a pull request. The repositories are public. Describe a security fix by what it protects, and tell admins what they must do.

## Commits

Write the commit message for a reader who does not know the change: what changed and why, in the present tense. Squash fixups before merging.

## Changelog

Every released repository keeps a `CHANGELOG.md`. Add user-facing changes under `## [Unreleased]`, grouped as features, fixes, security, dependencies and breaking changes, with the pull request link. The release moves that section under the new version, and the release workflow copies it into the GitHub Release. See [Releases and Dependencies](/developer/guides/releases-and-dependencies).

## Tags and versions

Tags are `vX.Y.Z` (`vX.Y.Z-rc.N` for a release candidate). A `tag-format` workflow rejects other spellings in the repositories that have it. Versions follow semver: a breaking change is a major release.

## Checks in CI

- The build and test workflow of the repository. EduIDE-Cloud runs its Java tests on every pull request that touches `java/`.
- `dependency-review` on pull requests, in the repositories that have it.
- A reusable gitleaks workflow exists in the org `.github` repository (`secret-scan.yml`); no repository calls it yet.
- Actions are mostly pinned by tag today. Renovate pins digests going forward through the shared preset.

## Docs

Change the docs in the same piece of work as the code, in the repository's own README or in the [Docs](https://github.com/EduIDE/Docs) repository for the global pages.
