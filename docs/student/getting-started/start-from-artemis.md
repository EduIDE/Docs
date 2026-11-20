---
title: Start from Artemis
description: Open your exercise in EduIDE directly from Artemis.
---

# Start from Artemis

Use this path when you begin from an Artemis exercise page.

:::note Artemis support
Passing your repository and access token to EduIDE needs a change in Artemis that is not yet merged upstream (Artemis pull request #14702). Your Artemis server must include it before the exercise clones itself. Until then, you can start EduIDE from Artemis, but you may have to clone the repository yourself. Ask your instructor which applies.
:::

## 1) Start the exercise

Open your exercise in Artemis and click **Start exercise**.

![Start exercise in Artemis](/img/student/getting-started/artemis-01-start-exercise.png)

## 2) Open the online IDE

In the repository section, click **Open online IDE**.

![Open online IDE from Artemis](/img/student/getting-started/artemis-02-open-online-ide.png)

If you are not signed in to EduIDE yet, the login page appears first. Sign in, and the exercise starts.

## 3) If you see an error about the repository host

EduIDE only opens repositories from hosts that your installation trusts, usually your university's Artemis.
If you see "Repositories from ... cannot be opened here", do not try to work around it.
Ask your tutor.

## 4) Wait for the clone

EduIDE clones your repository into the empty workspace.
A **Preparing your workspace** notification shows the steps.
The notification never shows passwords or tokens.
If your workspace already has files, EduIDE keeps them and shows the warning "The exercise was not cloned because this workspace already contains files". Empty the workspace or start a new one to get the exercise.

In Java exercises with Gradle, Artemis sessions prepare Gradle in the background by themselves.

## 5) Use one browser tab

Keep the IDE open in one tab.
If you open the same session in a second tab, it shows the same files and does not download your exercise again.

## 6) Come back after a break

Exercises from Artemis can use a saved workspace or a temporary one, depending on your installation.
The status bar shows which.
With a saved workspace, open the start page and click **Start** on your exercise under **Your environments**, or start the exercise from Artemis again.
With a temporary workspace, starting again gives you a new session with only the work you pushed before.
See [When Your Session Ends](./session-timeout.md).

## Next step

When the IDE opens, continue with the [Workspace Tour](./workspace-tour.md).
