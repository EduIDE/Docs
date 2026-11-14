---
title: Workspace Tour
description: Quick orientation of the EduIDE layout.
---

# Workspace Tour

This is the minimal layout you need to start working.

![IDE layout overview](/img/student/getting-started/workspace-tour-01-welcome-screen.png)

## Main areas

- **Explorer (left):** your files and folders
- **Editor (center):** where you write code
- **Terminal (bottom):** compile and run commands
- **Problems (bottom):** diagnostics and warnings

## Workspace mode

The status bar at the bottom right shows where your files live:

- **Temporary workspace** (warning colour): files are lost when the session ends
- **Saved workspace**: files stay and come back when you resume

Read [When Your Session Ends](./session-timeout.md) to know when a session ends.

## If something is missing

EduIDE has three experience levels: **Beginner**, **Advanced** and **Expert**.
They exist for every language.
Beginner hides the terminal and some menus to keep the screen simple. Your
exercise may pick a level for you.

If you need something you cannot see, click the level in the status bar at the
bottom or open the **Experience Levels** menu, and pick a higher level.

![Experience level picker](/img/student/getting-started/workspace-tour-04-level-picker.png)

The change applies immediately, without a reload, and you can switch back at any time.

## Useful first action

Open **Terminal -> New Terminal**.

![Open new terminal from top menu](/img/student/getting-started/workspace-tour-02-open-terminal-menu.png)

Open the terminal and run:

```bash
pwd
```

You should see your workspace path (usually `/home/project`).

![Terminal current directory output](/img/student/getting-started/workspace-tour-03-terminal-pwd.png)

## Next step

Continue with the [Assignment Workflow](../learning/assignment-workflow.md).
