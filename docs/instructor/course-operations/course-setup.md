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
language image. Students who start a language from the launcher page choose a starter
template: Maven or Gradle for Java, Make or Bazel for C, Python, Node or Web
(TypeScript) for JavaScript, Cargo for Rust, Go for Go. Exercises you start
from Artemis bring their own files.

EduIDE publishes images for Java 17, Java 25, C, JavaScript, Python, Rust and Go.
It does not publish OCaml and Haskell images, so do not plan a course on them
even if an installation still offers an older one.

Each language comes in two editions. The Artemis edition starts only from an
Artemis exercise. The standalone edition starts from the launcher page, where
students pick a starter template. Ask the platform team which edition names
your installation uses.

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
platform cannot solve for them - a push rejected because they edited the wrong
branch, a session that timed out overnight. Decide in advance who they ask.

## Before the first lab

- Confirm with the platform team that your environment is up and that the
  languages you need are offered.
- Run through one exercise end to end yourself. If the IDE does not open by
  itself after you click **Open online IDE** in Artemis, but shows a
  **Launch** button, your Artemis server or the server hosting the exercise
  repositories is not on the installation's list of trusted hosts. Students can
  still click **Launch**; ask the platform team to check both hosts.
- Tell students that a session ends after 60 minutes without input, and that
  unpushed files in a temporary workspace are lost then (see
  [What changed in 3.0](./whats-new-in-3-0.md)).
- Tell students that the first start is slow and the second is not, so they do
  not all reload in the first minute and make it worse.
- Read [Limitations](../limitations/honest-limitations.md), and set expectations
  from it rather than discovering them live.

## What this page does not cover

Grading, release dates, exercise import and teaching-staff invitations are all
Artemis features and are documented there. EduIDE is the environment the
exercise opens in; it does not manage the course.
