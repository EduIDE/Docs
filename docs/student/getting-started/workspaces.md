---
title: Saved and Temporary Workspaces
description: Which files survive when your session ends, and for how long.
---

# Saved and Temporary Workspaces

Every environment has one of two workspace modes.
The tile on the start page shows it, and the status bar in the IDE shows **Temporary workspace** or **Saved workspace**.

| | Temporary workspace | Saved workspace |
|---|---|---|
| Your files when the session stops | Deleted | Kept |
| Continue later | No, you start fresh | Yes, **Start** on the entry under **Your environments** |
| Kept for | Only while the session runs | Until it is deleted (see below) |

## How long a saved workspace is kept

A saved workspace is deleted a number of days after you last used it.
The default is 14 days, and your installation or the environment can set another value.
Starting the workspace again resets the time.
A workspace is never deleted while a session of it is running.

The entry under **Your environments** shows the date, for example "Deleted on ... unless you start it".
It turns red from 3 days before, because the files are lost then.
You can also delete a saved workspace yourself.

:::warning A saved workspace is not a backup
Only work you push (for example to Artemis) is safe.
Use a saved workspace for convenience, not as the only copy of anything that matters.
:::

## What is lost in both cases

Terminals, running programs and debug sessions end when a session stops, also in a saved workspace.
