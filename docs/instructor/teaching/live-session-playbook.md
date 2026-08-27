---
title: Live Session Playbook
description: Running a lab on EduIDE, and what to do when something goes wrong in front of everyone.
---

# Live Session Playbook

What to do in the room, in the order you will need it.

## Before

- Open the exercise yourself, from Artemis, on the room's network. Not at home
  the night before — the network between this room and the cluster is part of
  the system.
- Have the exercise URL ready to paste. Do not make 200 people navigate.
- Know who to contact if the platform is down, and have that open already.

## Starting everyone at once

Say this, in this order:

1. Open the exercise in Artemis and click **Open online IDE**.
2. It will take a minute or two the first time. That is normal.
3. **Do not reload.** Reloading abandons the session that is starting and puts
   you at the back of the queue.

That third point is the one that saves the session. A room full of people
reloading turns a slow start into a much slower one.

If a student is asked to log in and then lands nowhere, they should complete the
login, go back to the Artemis exercise page, and click **Open online IDE**
again. This is a known first-login quirk, not a failure.

## During

**"My terminal is gone" / "the IDE looks frozen."** Reload the browser tab. The
session is server-side; the tab is just a view of it. This is the one time
reloading is the right answer.

**"I can't push."** Almost always a git problem, not a platform problem — wrong
branch, nothing committed, or a conflict. Treat it as you would in any other
environment.

**"My session closed."** It timed out from inactivity. Reopening the exercise
gives the workspace back. Files are not lost by a timeout.

**"I lost my work."** Distinguish immediately: pushed work is in Artemis and is
safe. Unpushed work lives in the workspace volume and is almost certainly still
there when they reopen. Work that was never saved in the editor is gone, exactly
as it would be locally.

## When it is not one student

If several people report the same failure at once, stop diagnosing individuals.

1. Try it yourself. If it fails for you too, it is the platform.
2. Tell the room what you know in one sentence, and give them something to do
   that does not need the IDE.
3. Contact the platform team with: which environment, what time it started, and
   what the error says. "It's broken" costs a round trip.

**Have a fallback.** For an assessed session, decide in advance what happens if
the platform is unavailable, and say it out loud at the start so nobody
panics. A browser-based IDE has a hard dependency on the network and the
cluster; that is the trade for not having 200 local setups to debug.

## After

- Tell students to commit and push before they leave. That is what Artemis
  grades and what survives everything.
- If something went wrong, report it even if it resolved itself. A transient
  failure nobody reports is one nobody fixes.
