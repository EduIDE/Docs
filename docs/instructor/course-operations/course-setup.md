---
title: Course Setup
description: What to arrange before your first session, and who arranges it.
---

# Course Setup

Most of the setup for an EduIDE course is not done by you. The platform team
provisions the environment; your work is deciding what students need in it and
making sure the Artemis side lines up.

## What the platform team needs from you

Ask for these before the semester starts, not in the first week.

| They need to know | Because |
|---|---|
| Which languages your exercises use | Each one is a separate IDE image that has to be offered and pre-pulled onto the cluster nodes |
| Roughly how many students, and when they will all arrive at once | Determines how many sessions are kept warm. A lab where 200 students start within ten minutes behaves very differently from steady use |
| Whether you need a starter template | Template images ship skeleton projects and a build-system choice. Without one, students start in an empty workspace |
| Which Artemis course this belongs to | The integration is per-course |

Lead time for a new language image is realistically weeks, not days. If your
exercises need something not already offered, raise it early.

## What is already available

The platform offers a fixed set of environments, each corresponding to a
language image. Some are plain — an empty workspace with the toolchain
installed — and some ship starter templates with a build-system choice, such as
Maven or Gradle for Java, Make or Bazel for C.

Ask the platform team which are enabled for your installation. The list differs
between installations, and building an image does not automatically make it
available.

## What you set up yourself

**In Artemis.** Create the programming exercise as usual. The EduIDE
integration is a property of the exercise's repository, so nothing separate has
to be configured per student.

**Test the whole path yourself, as a student would.** Open your own exercise
from Artemis, let the IDE start, make a change, commit and push, and confirm the
result appears in Artemis. Do this before you tell 200 people to do it. The
first start on a cold environment is much slower than later ones, and it is
better that you discover that than a lecture theatre does.

**Decide what "getting stuck" looks like.** Students will hit problems the
platform cannot solve for them — a push rejected because they edited the wrong
branch, a session that timed out overnight. Decide in advance who they ask.

## Before the first lab

- Confirm with the platform team that your environment is up and that the
  languages you need are offered.
- Run through one exercise end to end yourself.
- Tell students that the first start is slow and the second is not, so they do
  not all reload in the first minute and make it worse.
- Read [Limitations](../limitations/honest-limitations.md), and set expectations
  from it rather than discovering them live.

## What this page does not cover

Grading, release dates, exercise import and teaching-staff invitations are all
Artemis features and are documented there. EduIDE is the environment the
exercise opens in; it does not manage the course.
