---
title: Open a Git repository in EduIDE
description: Share a link that opens a GitHub, GitLab or Gitea repository in EduIDE.
---

# Open a Git repository in EduIDE

:::note Alpha
Repository links are an alpha feature in 3.0 and are off by default.
Ask the platform team whether your installation turned them on and which Git hosts it allows.
:::

A link can open any public Git repository in EduIDE. Scorpio clones the repository into an empty workspace, and the student works in the IDE. Use it for starter code, demos and examples that do not live in Artemis.

## The link

```
https://<eduide>/?appDef=<app>&gitUri=https://<host>/<path>.git&gitRef=<branch|tag|commit>
```

| Parameter | Required | Meaning |
|---|---|---|
| `appDef` | no | The app that starts, for example the Java image. Without it, the student picks the language, and the picker names the repository. |
| `gitUri` | yes | The HTTPS clone URL of the repository, ending in `.git`. |
| `gitRef` | no | A branch, tag or commit to check out after the clone. Without it, the default branch opens. |

Encode special characters in every value when you build the link by hand, `gitUri` and `gitRef` alike. An unencoded `#` in a branch name such as `release#2` cuts the value off.

## Examples

GitHub:

```
https://eduide.example.edu/?appDef=java-17&gitUri=https://github.com/my-org/my-exercise.git&gitRef=main
```

GitLab, with a subgroup:

```
https://eduide.example.edu/?appDef=java-17&gitUri=https://gitlab.com/my-group/my-subgroup/my-exercise.git
```

Gitea, on your own server:

```
https://eduide.example.edu/?gitUri=https://git.example.edu/my-org/my-exercise.git&gitRef=v1.0
```

## What the student sees

- The page shows the repository and waits for one click. A link never starts a session by itself.
- A `gitRef` that does not exist in the repository gives a warning in the IDE, and the default branch opens.
- A `gitRef` that could be read as a git option or range (it starts with `-`, or contains `..`, spaces or similar characters) is dropped by the page without a message, and the default branch opens.
- For a repository that is not from Artemis, the IDE asks before it prewarms the Gradle build, because that runs the repository's own build code.
- A workspace belongs to one user, app, repository and ref. A persistent workspace keeps its files, and each ref gets its own. A temporary session belongs to one user, app, repository and ref in the same way.

## Limits

- Only HTTPS links work, and only for hosts the administrator allows. No host is allowed by default. Ask the platform team to add GitHub, GitLab.com or your own Gitea, Forgejo or GitLab server, see [Landing page values](/admins/install/installing).
- The link must not contain credentials. A private repository does not open automatically, see [Private repositories](#private-repositories).
- Artemis exercises keep using the links Artemis creates.

## Push changes

Students can push from the terminal (`git push`) or from the Source Control view. EduIDE asks for a username and a password. GitHub, GitLab and most Gitea and Forgejo servers do not accept the account password for a Git push over HTTPS, so the student enters an **access token** as the password:

| Host | Where to create the token | Permission |
|---|---|---|
| GitHub | Settings > Developer settings > Personal access tokens > Fine-grained tokens. Limit it to the one repository. | Contents: Read and write |
| GitLab | User settings > Access tokens | `write_repository` |
| Gitea, Forgejo | Settings > Applications > Generate new token | repository: Read and Write |

In the standalone images, EduIDE keeps the username and token in memory for three hours, so the student enters them once per session. The Artemis images ask on every push. Neither writes them to disk. A student who may not push to the repository pushes to a fork: they fork it on the Git host, then run `git remote add fork <fork URL>` and `git push fork`.

A link whose `gitRef` names a tag or a commit opens without a branch (detached `HEAD`), and a push fails there. The student first creates a branch with `git switch -c <branch name>` and then pushes it with `git push -u origin <branch name>`, or `fork` instead of `origin`.

## Private repositories

A private repository does not open automatically, because the link never carries credentials. The IDE then shows "it is private or does not exist" together with the clone command. The student opens a terminal in the empty workspace and runs:

```
git clone https://<host>/<path>.git .
```

Git asks for a username and a password: the student enters their username and an access token with read permission, as in [Push changes](#push-changes). If the link has a `gitRef`, they then run `git checkout <gitRef>`. A token with write permission also covers the later push.

## Browser extension

The "Open in EduIDE" browser extension adds an **Open in EduIDE** button on GitHub repository pages and builds the link for you. A toolbar button for GitLab and Gitea pages is tracked in [EduIDE-Browser-Extension#2](https://github.com/EduIDE/EduIDE-Browser-Extension/pull/2).
