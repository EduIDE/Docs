---
title: Cohort Management
description: How the platform behaves with a whole cohort on it at once, and what that means for scheduling.
---

# Cohort Management

There is no cohort object in EduIDE. Students are not enrolled, grouped or
managed here - that all lives in Artemis. What this page is really about is
capacity: what happens when a lot of people use the platform at the same
moment, and how to schedule around it.

## The one number that matters: concurrent starts

Steady-state load is easy. The hard case is 200 students clicking **Open online
IDE** within the same five minutes, because each one needs a container
scheduled, a volume attached and an IDE booted.

The platform mitigates this in two ways, both of which have limits:

**Pre-pulled images.** Every node keeps the IDE images on local disk, so
starting a session does not download several gigabytes first. This is why a
newly added language is slow for the first students to use it - the image has to
reach every node before it helps.

**Warm sessions.** A configurable number of sessions can be kept running and
idle, so the first students to arrive get one immediately. Once the warm pool is
exhausted, everyone after that waits for a cold start.

The size of that pool is set per environment by the platform team. If you know a
lab will start at a fixed time, tell them in advance - it can be raised for the
day.

## Practical scheduling

- **Stagger where you can.** Two labs of 100 at different hours cost far less
  than one of 200.
- **Ask students to start the IDE a few minutes before the exercise**, not at
  the moment you begin talking.
- **Expect the first session of the day to be slower.** Idle sessions are
  reclaimed overnight.
- **Do not have everyone reload when it feels slow.** A reload abandons the
  session that was starting and asks for another.

## Session limits

Each student may hold a small number of concurrent sessions - the exact number
is configured per environment. This exists to stop one person accumulating
sessions across devices and browser tabs and exhausting capacity for everyone.

If a student cannot start a session and is told they have too many, the fix is
to close the ones they have forgotten about, not to raise the limit.

## Sessions end, and so can workspaces

An idle session is shut down. After 50 minutes without input the IDE asks
students whether they are still there, and after 60 minutes without input the
session stops. Closing the browser tab does not keep a session alive: it ends
60 minutes after the last input.

What happens to the files depends on the workspace mode, which the launcher
page shows as a **Temporary** or **Saved** badge and the IDE status bar shows
as **Temporary workspace** or **Saved workspace**:

- **Saved workspace:** the files survive. Students click **Resume my session**
  on the session ended page, or start the exercise from Artemis again. Both
  reopen the same workspace.
- **Temporary workspace:** the files are lost when the session ends, also at
  the 60 minute timeout. Only pushed work survives.

This matters for how you talk to students:

- "Your session was closed" means the running IDE stopped. Terminals, running
  programs and debug sessions are gone.
- Work that was **committed and pushed** is safe regardless.
- A saved workspace is not a backup, and it is not somewhere to keep the only
  copy of anything that matters.

Tell students to commit and push at the end of every session, and before any
long break. That is also what Artemis grades, so the habit is the same one the
course wants anyway.

## Exams and assessed labs

Treat a high-stakes session as an operational event, not a normal day:

- Warn the platform team well in advance, with the exact time and headcount.
- Have a fallback that does not need the platform. If the network between the
  lecture theatre and the cluster fails, no amount of capacity helps.
- Do not schedule the first-ever use of a new language image for an exam.

See [Limitations](../limitations/honest-limitations.md) for what the platform
does not promise.
