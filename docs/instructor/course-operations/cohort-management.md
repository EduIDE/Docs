---
title: Cohort Management
description: How the platform behaves with a whole cohort on it at once, and what that means for scheduling.
---

# Cohort Management

There is no cohort object in EduIDE.
Students are not enrolled, grouped or managed here. That lives in Artemis.
This page is about capacity: what happens when many people start at the same moment.

## The number that matters: concurrent starts

Steady use is easy.
The hard case is 200 students clicking **Open online IDE** within five minutes, because each one needs a session started.

## What helps

**Pools.** The platform keeps a number of idle instances ready for a template.
A student who starts while one is free gets it at once.
When the pool is empty, the next students wait for a cold start, which takes longer.
Pools serve sessions without a saved workspace. A session with a saved workspace always starts cold.
Admins set the pool size, and a pool scaler can adjust it to demand.
If you know a lab starts at a fixed time, tell the admins in advance.

**Capacity handling.** When the cluster is full, the platform frees idle pool sessions first.
If there is still no room, the student sees "The cluster is full right now. Please try again in a few minutes."

## Practical scheduling

- **Stagger where you can.** Two labs of 100 at different hours cost far less than one of 200.
- **Ask students to start the IDE a few minutes before the exercise.**
- **Expect the first start of a new template to be slower.**
- **Do not have everyone reload when it feels slow.** A start that is running continues, and a reload only adds load.

## Limit of running sessions

Each student may run a small number of sessions at the same time.
The default is 3, and your installation may differ.
At the limit, the landing page lists the running sessions and asks the student to delete one or continue in one of them.
Ask the admins if a course needs more.

## Sessions end, and so can workspaces

By default, the IDE warns after 50 minutes without input and the session stops after 60 minutes. A session stops after 24 hours in any case.
Installations and templates can change these values, so confirm them with the admins.
Closing the browser tab does not keep a session alive.

What happens to the files depends on the start mode:

- **Saved workspace:** the files survive. Students click **Start** on the entry under **Your sessions**, or start the exercise from Artemis again. The workspace is deleted after a number of days without use (14 by default).
- **Temporary session:** the files are lost when the session ends, also at the idle timeout. Only pushed work survives.

Tell students to commit and push at the end of every session and before any long break.
A saved workspace is not a backup.

## Exams and assessed labs

Treat a high-stakes session as an operational event:

- Warn the admins well in advance, with the exact time and headcount.
- Have a fallback that does not need the platform. If the network between the lecture theatre and the cluster fails, no amount of capacity helps.
- Do not use a new template for the first time in an exam.

See [Limitations](../limitations/honest-limitations.md) for what the platform does not promise.
