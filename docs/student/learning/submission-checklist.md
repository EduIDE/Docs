---
title: Submission Checklist
description: Submit your exercise from the Artemis view in the IDE and check the result.
---

# Submission Checklist

Use this checklist to submit your work from the IDE.
You submit from the **Artemis** view, which the Artemis extension adds to the activity bar.

## 1) Save your files

Save all open files.
If a file is still unsaved, the exercise shows **Unsaved files. Save before submitting.**

## 2) Open the Artemis view

In the activity bar, open **Artemis**.
The view starts on the dashboard.

## 3) Open your exercise

Under **Current Workspace Exercise**, click the exercise that is open in your workspace.
Make sure the title matches the exercise you work on.

Below the exercise, a status line shows whether there is anything to submit:

- **Uncommitted changes ready to submit**: you have changes that are not submitted yet.
- **Committed, not yet submitted**: you committed changes yourself, but they are not on Artemis yet.
- **Up to date**: Artemis already has your latest work, so **Submit** stays disabled.

## 4) Submit your exercise

Click **Submit**.
To add your own commit message, click the envelope icon next to **Submit** first and type it into **Enter commit message...**.

The IDE commits your changes, syncs with Artemis, and pushes.
A notification shows the progress and ends with **Successfully submitted "your exercise"**.

If Artemis also changed files you edited, the submission stops with a merge conflict message.
Resolve the conflict with Git and submit again.

## 5) Review the result

The exercise first shows **Building your submission...** while Artemis builds and tests your code.
Then the result appears in the same view:

- the number of passed tests, for example **8/10 tests**, and your points
- **See test results** opens the list of **Failed** and **Passed** tests
- **Build failed** means your code did not compile; **Go to source** jumps to the error and **Open log** shows the build log

## 6) Before a long break

Pushing and submitting are what keep your work.
In a **Temporary workspace** your files are lost 60 minutes after your last input, so submit before you leave.
See [When Your Session Ends](../getting-started/session-timeout.md).

## Done when

- all files are saved
- the notification confirmed the submission
- the latest result was checked
