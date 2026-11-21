---
title: When Your Session Ends
description: What happens when you stop typing, how to get your work back, and how to avoid losing files.
---

# When Your Session Ends

An EduIDE session does not run forever.
It ends when you are away for too long, or when it reaches the maximum run time of your installation.

## The inactivity timer

| After | What happens |
|---|---|
| 50 minutes without input | The IDE shows a warning with the action **I am still here** |
| 60 minutes without input | The session stops |
| 24 hours | The session stops, whatever you do |

These are the default limits.
Your installation or environment can use other values, so ask your tutor if you are not sure.
The start page shows the exact stop time under **Your environments**.

Input means typing, editing text, moving the cursor, switching editors and focusing the IDE window.
Terminal output and background work do not count, so a long build does not keep a session alive.
A closed tab counts as no input, and the session stops 60 minutes after your last one.

Click **I am still here**, or just keep working, and the timer starts again.

## Your files

If the status bar shows **Saved workspace**, your files stay and come back when you start again.
A saved workspace is deleted after a time without use (14 days by default).
See [Saved and Temporary Workspaces](./workspaces.md).

:::warning Temporary workspaces lose their files
If the status bar shows **Temporary workspace**, your files are gone when the session ends, also after 60 minutes without input.
Push your work to Artemis or download it before a long break.
:::

Terminals, running programs and debug sessions are gone in both cases.
Even in a saved workspace, only pushed work reaches Artemis.
See the [Submission Checklist](../learning/submission-checklist.md).

## After the end

The IDE tab shows that the connection is lost.
Go to the start page of your installation.

- With a saved workspace, click **Start** on the entry under **Your environments**. It reopens your files.
- With a temporary workspace, the entry is gone. Start a new environment, or open the exercise from Artemis again.

See [Your Environments](./your-environments.md).
