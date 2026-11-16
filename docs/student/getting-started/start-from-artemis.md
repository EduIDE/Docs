---
title: Start from Artemis
description: Open your exercise in EduIDE directly from Artemis.
---

# Start from Artemis

Use this path when you begin from an Artemis exercise page.

## 1) Start the exercise

Open your exercise in Artemis and click **Start exercise**.

![Start exercise in Artemis](/img/student/getting-started/artemis-01-start-exercise.png)

## 2) Open the online IDE

In the repository section, click **Open online IDE**.

![Open online IDE from Artemis](/img/student/getting-started/artemis-02-open-online-ide.png)

## 3) First-login retry (current workaround)

If you are asked to log in, complete login, return to the Artemis exercise page, and click **Open online IDE** again.

This can happen on the first login.

## 4) If you see a Launch button

Usually the IDE starts on its own. Some installations first show a page that
names where your exercise comes from, for example "This link opens a repository
from artemis.example.edu", with a button below, labelled **Launch** and the name of the app.

Check that the name is a server your course uses, usually your university's
Artemis, then click **Launch**. If you do not recognise the name, do not click,
and ask your tutor.

Some installations without a university login ask you to confirm a user name
first. Check that it is yours before you continue.

## 5) Wait for the clone

EduIDE clones your repository into the empty workspace. In newer versions a **Preparing your workspace** notification shows the steps.
If your workspace already has files, EduIDE keeps them and shows the warning "The exercise was not cloned because this workspace already contains files". Empty the workspace or start a new one to get the exercise.
In Java exercises with Gradle, Artemis sessions prepare Gradle in the background by themselves.
Sessions you start yourself from the launcher ask before they run the Gradle wrapper of the repository. Click **Pre-build now** to speed up the first build, or ignore the message to skip it. A starter template is prepared without asking.

## 6) Use one browser tab

Keep the IDE open in one tab. If you open the same session in a second tab, it
shows the same files and does not download your exercise again.

## 7) Come back after a break

If your session ends with a **Saved workspace**, start the exercise from Artemis again, or use **Resume my session** on the session ended page.
Both reopen the same workspace.
With a **Temporary workspace**, starting from Artemis again gives you a new session with only the work you pushed before.
See [When Your Session Ends](./session-timeout.md).

## 8) Continue in EduIDE

When the IDE opens, continue with the [Workspace Tour](./workspace-tour.md).
