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
| 50 minutes without input | The IDE asks **Are you still here?** and the browser tab title blinks **Session ends soon** |
| 60 minutes without input | The session stops |

Input means typing, clicking, moving the mouse and scrolling in the IDE tab, and editing or saving files.
Background output from Artemis, Git or language servers does not count.
Scrolling inside a panel that shows a web page, for example the Artemis problem statement, does not count either.

If you close the tab, the session ends 60 minutes after your last input.

Click or type in the IDE when you see the question, and the timer starts again.

## Your files

:::warning Temporary workspaces lose their files
If the status bar shows **Temporary workspace**, your files are gone when the session ends, also after 60 minutes without input.
Push your work to Artemis or download it before a long break.
:::

If the status bar shows **Saved workspace**, your files stay and come back when you resume.
Terminals, running programs and debug sessions are gone in both cases.

Even in a saved workspace, only pushed work reaches Artemis.
See the [Submission Checklist](../learning/submission-checklist.md).

## The session ended page

After the end, the IDE shows **Your session has timed out** or goes **Offline**.
Reload the tab, or open the old session URL, to reach the **Your session has ended** page.
It tells you why the session ended, when it knows:

- it closed after a period without activity
- it reached the maximum time a session may run
- a general text otherwise, for example after a manual stop

![Session ended page without a saved workspace](/img/student/getting-started/session-ended-01-page.png)

The screenshot shows the general text with the **Start a new session** button.

For a saved workspace, click **Resume my session**.
It reopens the same workspace with the same files.
**Start something else** goes back to the launcher.

For a temporary workspace, the page says that your files could not be kept and offers only a new start.

Resume works only in the same browser tab, for 24 hours after you started.
In another tab or browser you get the general text and the launcher.
