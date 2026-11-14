---
title: What Changed in 3.0
description: What instructors notice in release 3.0, and what to tell students.
---

# What Changed in 3.0

This page lists what changes for your course in release 3.0.
Read it before the semester starts.

## Sessions now end after 60 minutes without input

Before 3.0, the inactivity timer never fired, so sessions effectively ran for
24 hours. Now:

- After 50 minutes without input the IDE asks students "Are you still here?"
  and the browser tab title blinks.
- After 60 minutes without input the session stops.
- A closed browser tab ends the session 60 minutes after the last input.

Typing, clicking, mouse moves, scrolling and saving files count as input.
Background output from Artemis, Git or language servers does not.
Expect more "my session closed" questions in the first weeks, especially from
students who listen to a lecture with the IDE open but untouched.
Your installation can use different values. Ask the platform team.

## Temporary workspaces lose their files

"Files are not lost by a timeout" is no longer true for temporary workspaces.
When a temporary session ends, also at the 60 minute timeout, the unpushed
files are gone. Saved workspaces keep their files.

The launcher page shows a **Temporary** or **Saved** badge on every tile, and
the IDE status bar shows **Temporary workspace** or **Saved workspace**.
Tell students to push before any long break.

## What students see when a session ends

Reloading the tab of an ended session opens the **Your session has ended**
page. It names the reason, when it is known: inactivity, or the maximum run
time. For a saved workspace it offers **Resume my session**, which reopens the
same workspace. Students can also start the exercise from Artemis again.

![Session ended page](/img/student/getting-started/session-ended-01-page.png)

The IDE does not switch to this page by itself. It shows "Your session has
timed out" first, and the page appears on reload.

## New languages and starter templates

- Rust and Go join Java 17, Java 25, Python, JavaScript and C.
- The launcher shows one tile per language.
- Students who start a language themselves pick a starter template: Maven or
  Gradle, Make or Bazel, Python, Node or Web (TypeScript), Cargo, Go.
- Each language has an Artemis edition, which starts only from Artemis, and a
  standalone edition, which starts from the launcher. Ask the platform team for
  the names in your installation.

See [Customizable Features](../course-evaluation/customizable-features.md) for
the details.

## Experience levels for every language

Beginner, Advanced and Expert now exist for all languages, and a switch takes
effect immediately. `.vscode/eduide.json` still sets the starting level. The
**Customize** panel gained elements for the spell checker, Clippy, linter
findings, the Maven view and the workspace mode.

## Smaller changes

- HTML files open in a preview through **Open Preview to the Side**. The old
  Live Preview extension is gone.
- A spell checker (English and German) and Error Lens are in every image.
- Ruff formats Python on save at the Beginner and Advanced levels, Artemis submissions included.
- In sessions that students start themselves, Git credentials are cached in
  memory for 3 hours.
- Dialogs say "EduIDE" instead of "Theia IDE".

## Where to report problems

Instructors use the same channels as students: the GitHub issues of
`EduIDE/EduIDE` (**Report a bug** and **Request a feature** in the launcher
footer, **Help**, **Report Issue** in the IDE) and GitHub Discussions for
questions. Issues are public, so leave out personal data and Artemis links.
