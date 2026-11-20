---
title: First Start
description: Start your first environment from the start page.
---

# First Start

Use this page when you start an environment yourself, for example to explore or practise.
If your course gives you an Artemis exercise, use [Start from Artemis](./start-from-artemis.md).

## 1) Pick a tile

Under **Start new**, each tile is one environment.
A tile shows the language, how long a start usually takes (for example **Ready instantly**) and a label:

- **Temporary workspace**: files are deleted when the environment stops
- **Saved workspace**: files stay after the environment stops, so you can continue later

Hover over the label to read the explanation.
Read [Saved and Temporary Workspaces](./workspaces.md) before you start real work in a temporary workspace.
The info button on a tile shows what the environment includes.

## 2) Choose a project template

A dialog asks you to choose a project template, for example **Maven** or **Gradle** for Java, **Make** or **Bazel** for C.
Python, Rust and Go have one template each.
You can also start with an **Empty project**.

![Dialog to choose a project template](/img/student/getting-started/first-start-02-build-system-picker.png)

See [Languages and Starter Templates](./languages-and-templates.md) for the list.

## 3) Wait for the IDE to open

A progress page shows the steps while your IDE starts.
Keep the tab open until the IDE appears.

![Progress page while the environment starts](/img/student/getting-started/first-start-03-launch-screen.png)

When the IDE opens, the status bar at the bottom shows **Temporary workspace** or **Saved workspace**.

EduIDE only fills an **empty** workspace.
If your workspace already has files, EduIDE never deletes them.
Instead you see the warning "The exercise was not cloned because this workspace already contains files", and nothing is cloned.
Empty the workspace or start a new environment to get the exercise.

## 4) Quick success check

Open a terminal (**Terminal -> New Terminal**) and print the version of your language, for example:

```bash
java -version
```

At the Beginner level the terminal is hidden. Switch to Advanced or use the **Run** button instead.
If you see a version, your workspace is ready.

## Next step

Continue with the [Workspace Tour](./workspace-tour.md).
