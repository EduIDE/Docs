---
title: First Start
description: Start your first session from the landing page.
---

# First Start

Use this page when you start a session yourself, for example to explore or practise.
If your course gives you an Artemis exercise, use [Start from Artemis](./start-from-artemis.md).

## 1) Pick a tile

Under **Start new**, each tile is one template.
A tile shows the language, how long a start usually takes (for example **Ready instantly**) and a label:

- **Temporary session**: files are deleted when the session stops
- **Saved workspace**: files stay after the session stops, so you can continue later

Hover over the label to read the explanation.
Read [Saved Workspaces and Temporary Sessions](./workspaces.md) before you start real work in a temporary session.
The info button on a tile shows what the template includes.

## 2) Choose a starter project

A dialog asks you to choose a starter project, for example **Maven** or **Gradle** for Java, **Make** or **Bazel** for C.
Python, Rust and Go have one template each.
You can also start with an **Empty project**.

![Dialog to choose a starter project](/img/student/getting-started/first-start-02-build-system-picker.png)

See [Languages and Starter Projects](./languages-and-templates.md) for the list.

## 3) Wait for the IDE to open

A progress page shows the steps while your IDE starts.
Keep the tab open until the IDE appears.

![Progress page while the session starts](/img/student/getting-started/first-start-03-launch-screen.png)

When the IDE opens, the status bar at the bottom shows **Temporary session** or **Saved workspace**.

EduIDE only fills an **empty** workspace.
If your project folder already has files, EduIDE never deletes them.
If the files come from a different repository than the exercise, you see the warning "The exercise was not cloned because this workspace already contains files", and nothing is cloned.
Push or back up your work first, then start a new session to get the exercise. Empty the project folder only when nothing in it is needed.
If the project folder already holds the exercise repository, EduIDE keeps it and skips the clone without a warning.

## 4) Quick success check

Open a terminal (**Terminal -> New Terminal**) and print the version of your language, for example:

```bash
java -version
```

At the Beginner level the terminal is hidden. Switch to Advanced or use the **Run** button instead.
If you see a version, your session is ready.

## Next step

Continue with the [IDE Tour](./workspace-tour.md).
