---
title: Course Setup
description: What to arrange before your first session, and who arranges it.
---

# Course Setup

Most of the setup is not done by you.
The platform team provisions the environment. Your work is to decide what students need in it and to make sure the Artemis side lines up.

## What the platform team needs from you

Ask before the semester starts, not in the first week.

| They need to know | Because |
|---|---|
| Which languages your exercises use | Each language is a template. Only published languages can be offered |
| How many students, and when they start at once | It sets the size of the warm pool for that day |
| Saved or temporary workspace, and the retention | They set it per template |
| Whether the template is listed (tile) or unlisted (Artemis link only) | It decides whether students see it on the start page |
| Your Artemis server and repository host | They go on the list of trusted hosts |

Lead time for a new language image is weeks, not days.

## What is available

EduIDE publishes images for seven languages: Java 17, Java 25, Python, JavaScript, C, Rust and Go.
Other languages are not offered.
Students who start a tile choose a starter template: Maven or Gradle for Java, Make or Bazel for C, Python for Python, Node or Web (TypeScript) for JavaScript, Cargo for Rust, Go for Go.
Exercises you start from Artemis bring their own files.

Each language comes in two editions.
The **Artemis edition** opens from an Artemis exercise through **Open online IDE**.
The **standalone edition** opens from a tile on the start page.
Ask the platform team which templates your installation offers.

## What you set up yourself

**In Artemis.** Create the programming exercise as usual and choose the EduIDE template your platform team named. Check that your Artemis includes pull request #14702 (not yet merged upstream), or the exercise does not clone itself.

**Test the whole path as a student.** Open your exercise from Artemis, let the IDE start, change a file, push, and confirm the result in Artemis. Do this before you tell 200 people to do it.

**Decide who students ask** when they are stuck.

## Before the first lab

Follow the [First Lab Checklist](./first-lab-checklist.md).
Read [Limitations](../limitations/honest-limitations.md) and set expectations from it.

## What this page does not cover

Grading, release dates, exercise import and teaching-staff invitations are Artemis features.
EduIDE is the environment the exercise opens in. It does not manage the course.
