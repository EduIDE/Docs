---
title: Saved Workspaces and Temporary Sessions
description: Which files survive when your session ends, and for how long.
---

# Saved Workspaces and Temporary Sessions

Every session starts in one of two modes.
The tile on the landing page shows it, and the status bar in the IDE shows **Temporary session** or **Saved workspace**.

| | Temporary session | Saved workspace |
|---|---|---|
| Your files when the session stops | Deleted | Kept |
| Continue later | No, you start fresh | Yes, **Start** on the entry under **Your sessions** |
| Kept for | Only while the session runs | Until it is deleted (see below) |

A saved workspace started without a repository belongs to one starter project.
Picking **Node.js**, **Web** or **Empty project** gives each its own workspace, and picking the same again resumes it.
With the next release, its entry under **Your sessions** carries the name of the starter project, for example "Web" or "Node.js".

## How long a saved workspace is kept

A saved workspace is deleted a number of days after you last used it.
The default is 14 days, and your installation or the template can set another value.
Starting the workspace again resets the time.
A workspace is never deleted while a session of it is running.

The entry under **Your sessions** shows the date, for example "Deleted on ... unless you start it".
It turns red from 3 days before, because the files are lost then.
You can also delete a saved workspace yourself.

:::warning A saved workspace is not a backup
Only work you push (for example to Artemis) is safe.
Use a saved workspace for convenience, not as the only copy of anything that matters.
:::

## What is lost in both cases

Terminals, running programs and debug sessions end when a session stops, also in a saved workspace.
So does a Git login: Git asks for your access token again in the next session.
See [Private Git Repositories](../learning/private-repositories.md).
