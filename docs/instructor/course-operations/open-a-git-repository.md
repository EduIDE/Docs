---
title: Open a Git repository in EduIDE
description: Share a link that opens a GitHub, GitLab or Gitea repository in EduIDE.
---

# Open a Git repository in EduIDE

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

Encode special characters in the `gitUri` value when you build the link by hand.

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
- A wrong or missing `gitRef` gives a warning in the IDE, and the default branch opens.
- For a repository that is not from Artemis, the IDE asks before it prewarms the Gradle build, because that runs the repository's own build code.
- A workspace belongs to one user, app, repository and ref. A persistent workspace keeps its files, and each ref gets its own. A temporary session belongs to one user, app, repository and ref in the same way.

## Limits

- Only HTTPS links work, and only for hosts the administrator allows. GitHub and GitLab.com are allowed by default. Ask the platform team to add your own Gitea, Forgejo or GitLab server, see [Landing page values](/admins/install/installing).
- The link must not contain credentials. Private repositories do not work through such a link today.
- Artemis exercises keep using the links Artemis creates.

## Browser extension

The "Open in EduIDE" browser extension adds an **Open in EduIDE** button on GitHub repository pages and builds the link for you. A toolbar button for GitLab and Gitea pages is tracked in [EduIDE-Browser-Extension#2](https://github.com/EduIDE/EduIDE-Browser-Extension/pull/2).
