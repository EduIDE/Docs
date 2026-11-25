---
title: Your Sessions
description: Resume, delete and understand the sessions listed on the landing page.
---

# Your Sessions

The landing page lists everything you started under **Your sessions**.
It is always at the top, also when it is empty.

## What an entry shows

- the name, for example your exercise or the language (with the next release, the name of the starter project such as "Web" or "Node.js" for a workspace started without a repository)
- **saved workspace** or **temporary session**
- when you started it or last used it
- when it stops or is deleted, for example "Stops at 14:30 if inactive", "Stops at ... (time limit)" or "Deleted on ... unless you start it"

The line turns red when files are lost at that point: a temporary session about 10 minutes before it stops, and a saved workspace 3 days before it is deleted.

## Resume

Click **Start**.
If the session is still running, the IDE opens again.
If it stopped and has a saved workspace, EduIDE starts a new session on the same files.

## Stop

You do not stop a session from the landing page.
It stops by itself after a period without input, or at the maximum session duration.
To end it now, delete the entry.

## Delete

Click the delete icon and confirm.
Deleting removes all files of the entry for good and stops the open IDE if it runs.
A temporary session ends, and a saved workspace is deleted.

## Limit of running sessions

Your installation limits how many sessions you can run at once (3 by default).
At the limit, the landing page lists your running sessions.
Delete one, or continue in one of them.

## Leave the IDE without ending the session

In the IDE, choose **File -> Back to Landing Page**.
It brings you to the landing page and keeps the session running.
Use it to open another session or check your list.
