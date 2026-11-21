---
title: Open a Git Repository
description: Share a link that opens a public GitHub, GitLab or Gitea repository in EduIDE 3.0.
---

# Open a Git Repository

A link can open a public Git repository in EduIDE.
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

- After the login, the session starts right away, without a click.
- **Your environments** lists the session with the repository as its source.
- A saved workspace belongs to one student, template and repository. Opening the link again resumes it.
- A temporary session belongs to one student, template and repository as well. A link to another repository starts another session.
- Before the IDE runs the repository's Gradle build to warm it up, it asks the student, because that runs the repository's own build code.

## Limits

- **Only allowed hosts.** The repository host must be in the installation's `allowedHosts`. Ask the platform team to add GitHub, GitLab.com or your own Gitea, Forgejo or GitLab server, see [Templates and Pools](/admins/platform/templates-and-pools). A link to another host shows an error that names the host and starts nothing.
- **Only public repositories.** The link must not contain credentials, see [Private repositories](#private-repositories).
- **Only the default branch.** A `gitRef` in the link is not passed on, because the templates of the `eduide` chart do not accept `GIT_REF`. Put the code your students need on the default branch, or use a separate repository.

## Push changes

Students can push from the terminal (`git push`) or from the Source Control view.
Git asks for a username and a password.
GitHub, GitLab and most Gitea and Forgejo servers do not accept the account password for a push over HTTPS, so the student enters an **access token** as the password:

| Host | Where to create the token | Permission |
|---|---|---|
| GitHub | Settings > Developer settings > Personal access tokens > Fine-grained tokens. Limit it to the one repository. | Contents: Read and write |
| GitLab | User settings > Access tokens | `write_repository` |
| Gitea, Forgejo | Settings > Applications > Generate new token | repository: Read and Write |

A student who may not push to the repository pushes to a fork.
They fork it on the Git host, then run `git remote add fork <fork URL>` and `git push fork`.

## Private repositories

A private repository does not open from a link, because the link never carries credentials.
The clone fails, and the IDE shows that the host did not accept the access.
The message suggests starting the exercise again from Artemis, which does not help here.
Instead, the student opens a terminal and clones the repository into a subfolder:

```
git clone 'https://<host>/<path>.git'
```

Git asks for a username and a password.
The student enters their username and an access token with read permission, as in [Push changes](#push-changes).
A token with write permission also covers the later push.

## Browser extension

The "Open in EduIDE" browser extension adds an **Open in EduIDE** button on GitHub repository pages and builds the link for you.
A toolbar button for GitLab and Gitea pages is tracked in [EduIDE-Browser-Extension#2](https://github.com/EduIDE/EduIDE-Browser-Extension/pull/2).
