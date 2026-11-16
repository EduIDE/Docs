---
title: First Start
description: Launch your first workspace in under two minutes.
---

# First Start

Use this page for your first start.

## 1) Open the launcher

After login, go to the IDE launcher page. It shows one tile per programming language.

![IDE launcher page](/img/student/getting-started/first-login-03-launcher-after-login.png#h520)

Each tile has a badge:

- **Temporary**: files are lost when the session ends
- **Saved**: files stay in your workspace and come back when you start again

Which badge a tile shows depends on your installation.
Read [When Your Session Ends](./session-timeout.md) before you start real work in a **Temporary** workspace.

## 2) Pick a language and a starter template

Click the tile for your language, for example **Python** or **Rust**.
Only languages with more than one starter template ask you to choose one: **Maven** or **Gradle** for Java, **Make** or **Bazel** for C, **Node** or **Web** for JavaScript.
Python, Rust and Go start directly.

![Choose your build system](/img/student/getting-started/first-start-02-build-system-picker.png)

See [Languages and Starter Templates](./languages-and-templates.md) for the full list.

## 3) Wait for the IDE to open

The launch screen repeats the badge while your IDE starts.

![Launch screen with the Temporary badge](/img/student/getting-started/first-start-03-launch-screen.png)

The IDE then opens in a new session URL.
In newer versions a **Preparing your workspace** notification shows what happens next: waiting for your exercise details, cloning your repository or applying a starter template.
Cloning can take a while, so wait until the notification closes.
The notification never shows passwords or tokens.

EduIDE only fills an **empty** workspace.
If your workspace already has files, EduIDE never deletes them.
Instead you see the warning "The exercise was not cloned because this workspace already contains files", and nothing is cloned.
Empty the workspace or start a new one to get the exercise.
The status bar at the bottom shows **Temporary workspace** or **Saved workspace**.

![Workspace opened with the status bar](/img/student/getting-started/workspace-tour-01-welcome-screen.png)

## 4) Quick success check

Open a terminal (**Terminal -> New Terminal**) and print the version of your language, for example. At the Beginner level the terminal is hidden: switch to Advanced or use the **Run** button instead.

```bash
java -version
```

If you see a version output, your workspace is ready.

## Next step

Continue with the [Workspace Tour](./workspace-tour.md).

If your course launches from Artemis, use [Start from Artemis](./start-from-artemis.md).
