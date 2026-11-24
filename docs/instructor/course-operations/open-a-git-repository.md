---
title: Open a Git Repository
description: Share a link or a badge that opens a GitHub, GitLab or Gitea repository in EduIDE 3.0, public or private.
---

# Open a Git Repository

A link can open a Git repository in EduIDE, public or private.
The IDE clones the repository into the workspace, and the student works on it in the browser.
Use it for starter code, demos and examples that do not live in Artemis.
Artemis exercises keep using the links Artemis creates.

## The link

```
https://<eduide>/?appDef=<template>&gitUri=https://<host>/<path>.git
```

| Parameter | Required | Meaning |
|---|---|---|
| `appDef` | yes | The template that starts, for example `java-17-standalone`. Without it, the start page opens and the repository is ignored. |
| `gitUri` | yes | The HTTPS clone URL of the repository. |
| `persistence` | no | `volume` for a saved workspace, `none` for a temporary one. Only takes effect if the template allows that mode. |
| `title` | no | The name the student sees in **Your environments**. |

Use a standalone template, such as `java-17-standalone` or `python-standalone`.
The templates without the suffix are the Artemis editions.
Encode special characters in every value when you build the link by hand.

Example:

```
https://eduide.example.edu/?appDef=java-17-standalone&gitUri=https://github.com/my-org/my-exercise.git&persistence=volume
```

## What the student sees

- After the login, the session starts right away, without a click. For a private repository, EduIDE first asks to connect an account, if the student has not done so.
- **Your environments** lists the session with the repository as its source.
- A saved workspace belongs to one student, template and repository. Opening the link again resumes it.
- A temporary session belongs to one student, template and repository as well. A link to another repository starts another session.
- Before the IDE runs the repository's Gradle build to warm it up, it asks the student, because that runs the repository's own build code.

## Limits

- **Only allowed hosts.** The repository host must be a Git account provider of the installation or be in its `allowedHosts`. Ask the platform team to add your host, see [Git Accounts](/admins/platform/git-accounts) and [Templates and Pools](/admins/platform/templates-and-pools). A link to another host shows an error that names the host and starts nothing.
- **No credentials in the link.** Never put a token in the link. Private repositories use a connected account, see below.
- **Only the default branch.** A `gitRef` in the link is not passed on, because the templates of the `eduide` chart do not accept `GIT_REF`. Put the code your students need on the default branch, or use a separate repository.

## Private repositories

A private repository opens when the student has connected a GitHub or GitLab account to EduIDE.
Your installation must offer the feature. Ask the platform team, or read [Git Accounts](/admins/platform/git-accounts).

What your students do once:

1. Open your link and sign in.
2. EduIDE asks them to connect their account for that Git host. They confirm on the page of the host.
3. The session starts and clones the repository.

From then on, every link to a repository on that host works for them.
Students without access to the repository get a message that names the repository and says the repository was not found or the account has no access.
Give the students access on the Git host first, for example through your organisation, group or classroom.

The students' guide is [Connect Your GitHub or GitLab Account](/student/getting-started/connect-git-account). Point them to it.

## Push changes

Students push from the terminal (`git push`) or from the Source Control view.
With a connected account, Git asks for nothing. EduIDE adds the credential.

- A student can push to the repository the session was started with, if the account may write to it.
- A student who may not push, or who works on a fork, starts a session from the fork. Or the student approves the fork for the session on the start page, when the installation allows approvals for pushing. Git prints a link when it needs this.
- A student who is not connected gets a message with a link to connect.

On a provider host, EduIDE ignores a token that a student types. The account is the only way there.

### Hosts without Git accounts

On a host that the installation does not offer (for example a Gitea or Forgejo server), or when the installation has no Git accounts at all, Git asks for a username and a password.
These hosts do not accept the account password for a push over HTTPS, so the student enters an **access token** as the password:

| Host | Where to create the token | Permission |
|---|---|---|
| GitHub | Settings > Developer settings > Personal access tokens > Fine-grained tokens. Limit it to the one repository. | Contents: Read and write |
| GitLab | User settings > Access tokens | `write_repository` |
| Gitea, Forgejo | Settings > Applications > Generate new token | repository: Read and Write |

On GitHub, an outside collaborator of an organization repository cannot use a fine-grained token for it.
Such a student creates a classic token (Personal access tokens > Tokens (classic)) with the `repo` scope instead.
For a private repository on such a host, the student opens a terminal and clones the repository into a subfolder with `git clone 'https://<host>/<path>.git'`, then enters the username and a token with read permission.
A token with write permission also covers the later push.

## Start links and README badges

Put a badge into the README of your exercise.
A click opens the repository in EduIDE, with the connect step for private repositories.

```markdown
[![Open in EduIDE](https://img.shields.io/badge/Open%20in-EduIDE-blue)](https://<eduide-host>/?appDef=<template>&gitUri=https://<git-host>/<owner>/<repository>.git&persistence=volume)
```

Replace the placeholders:

| Placeholder | Value |
|---|---|
| `<eduide-host>` | The host of your EduIDE installation |
| `<template>` | A standalone template, for example `java-17-standalone` |
| `<git-host>`, `<owner>`, `<repository>` | The repository on your Git host |

The same link works as a plain link in your course material.
The badge image is a static badge from shields.io. You can use any image.

## What does not work

- **No Git LFS.** A repository with LFS files does not work in a session.
- **No platform API.** The account serves Git commands only. A session cannot call the API of GitHub or GitLab with it.
- **A renamed or moved repository** needs its new address in the link. EduIDE does not follow redirects.
- **Other repositories than the session repository** use no account. Public ones work. A private one needs an approval or its own session.
- **The commit name and e-mail** are fixed when the session starts. A student who connects later or changes the name at the host starts a new session.
- **Pushing to a fork** needs a session started from the fork, or an approval.
- **A disconnect** takes up to 5 seconds to reach a running session.

## Artemis and exams

Git accounts are on in every session of an installation that enables them, including Artemis sessions and exam sessions.
A switch per template is tracked in [EduIDE-control-plane issue 32](https://github.com/EduIDE/EduIDE-control-plane/issues/32).
Ask your platform team whether exam sessions should have the feature.
Until the switch exists, the feature is on or off for the whole installation.

## Browser extension

The "Open in EduIDE" browser extension adds an **Open in EduIDE** button on repository pages and builds the link for you.
The button appears on every Git host that your EduIDE installation announces as a Git account provider, not only on GitHub.
For a private repository, EduIDE asks the student to connect first.
This needs the extension change tracked in [EduIDE-Browser-Extension#2](https://github.com/EduIDE/EduIDE-Browser-Extension/pull/2) and [#3](https://github.com/EduIDE/EduIDE-Browser-Extension/pull/3), which are not released yet.
