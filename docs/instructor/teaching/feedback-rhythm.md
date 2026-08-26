---
title: Feedback Rhythm
description: Where feedback actually comes from, and what EduIDE changes about it.
---

# Feedback Rhythm

EduIDE does not grade anything and does not give feedback. Artemis does. What
EduIDE changes is how quickly a student can act on the feedback they get, and
that is worth designing for.

## The loop

```
edit in EduIDE  ->  commit and push  ->  Artemis builds and tests  ->  result
       ^                                                                |
       +----------------------------------------------------------------+
```

The push is the only handoff. Everything before it is local to the workspace and
invisible to Artemis; everything after it is Artemis's business.

This has one practical consequence that dominates all others: **students who do
not push get no feedback.** Not delayed feedback — none. The most common cause
of "the system didn't tell me anything" is work that never left the workspace.

## What to say in week one

- Commit and push at the end of every session, even if the work is unfinished.
- Pushing is how you ask for feedback. It is not a submission ceremony.
- The IDE keeps your files between sessions, but only pushed work reaches
  Artemis.

Say it again in week two.

## What EduIDE makes easier

**No environment excuse.** Everyone has the same toolchain, so "it works on my
machine" stops being a category of feedback you have to give. The failure a
student sees locally is the failure the grader sees.

**A shorter path from feedback to fix.** The IDE is already open on the exercise;
acting on a test failure does not require rebuilding a local setup first. In a
lab, that can turn a week-long loop into a ten-minute one.

**You can look at exactly what they have.** Because the environment is uniform,
"send me a screenshot" is usually enough to diagnose. There is no hidden local
state.

## What it does not change

- **Test quality.** Feedback is only as good as the exercise's tests. EduIDE
  makes it faster to receive, not better.
- **Turnaround.** Build queues and test duration are Artemis's, unchanged.
- **Manual review.** If your course gives written feedback, that workload is
  the same.

## A rhythm that works

| When | What |
|---|---|
| During a lab | Push early and often; treat the first push as a smoke test, not a submission |
| End of every session | Push, unconditionally |
| Between sessions | Students act on automated results themselves |
| Weekly | You look at aggregate results, not individuals — the common failure across a cohort is usually an exercise problem, not thirty independent student problems |

That last row is the one people skip. When most of a cohort fails the same test,
the exercise is telling you something.
