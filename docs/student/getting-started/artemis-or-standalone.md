---
title: Artemis or Standalone?
description: The two kinds of EduIDE environment, how to tell them apart, and what each one does with Git.
---

# Artemis or Standalone?

Every EduIDE environment is one of two editions.
How you start it decides which one you get.

| | Artemis edition | Standalone edition |
|---|---|---|
| How you start it | **Open online IDE** on an Artemis exercise | A tile on the start page, or a link from your tutor |
| What it is for | Artemis exercises | Practice, projects, your own Git repositories |
| Where your code comes from | Artemis clones the exercise for you | A starter template, a link, or a repository you clone yourself |
| Git login | Artemis handles it. You never create a token | When your Git host asks for a login, for example to clone a private repository or to push, you enter an access token. Without a repository, you need none |
| How you hand in | Push to Artemis, see the [Submission Checklist](../learning/submission-checklist.md) | Push to your own Git repository |
| Artemis view and Iris | Yes | No |

Both editions have the same languages, tools and starter templates.

## How to tell which one you are in

- The Artemis edition shows the **Artemis** view in the bar on the left.
- The standalone edition has no Artemis view.

## Which one do I need?

- Working on an Artemis exercise: use the Artemis edition. Start it from Artemis, see [Start from Artemis](./start-from-artemis.md).
- Working with your own or your team's repository on GitHub or GitLab: use the standalone edition, see [Private Git Repositories](../learning/private-repositories.md). If your start page has a **Git accounts** section, see [Connect Your GitHub or GitLab Account](../learning/connect-git-account.md).
- Practising without a repository: use the standalone edition, see [First Start](./first-start.md).

## Saved or temporary: a second, separate choice

Independent of the edition, each environment has a **saved** or a **temporary** workspace.
The status bar shows which one.

- **Temporary workspace**: all files are deleted when the session ends.
- **Saved workspace**: your files stay, and you continue later.

In both cases, anything that only lives in the running session is gone when it ends: open terminals, running programs and Git logins.
See [Saved and Temporary Workspaces](./workspaces.md).
