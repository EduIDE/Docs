---
title: Customizable Features
description: What parts of EduIDE can be adapted to the needs of a specific course.
---

# Customizable Features

EduIDE is not limited to one fixed IDE setup. A major strength of the platform is that the course environment can be adapted quite deeply before students ever log in.

## The Most Important Customization Point: The IDE Image

The entire image that runs the IDE can be customized for the course.

This is the most important fact instructors should understand when evaluating EduIDE, because it means the platform is not only configurable at the UI level. The actual environment students receive can be prepared ahead of time to match the course closely.

That includes:

- local tooling
- language runtimes
- compilers and interpreters
- build tools
- package managers
- CLI utilities
- editor configuration
- workspace defaults
- run configurations
- debug profiles
- preinstalled extensions

In other words, the full IDE environment can be adapted to the course at hand before teaching starts.

## What This Means in Practice

Course teams can prepare environments so that students start with a setup that already reflects the intended workflow.

This can include:

- the exact toolchain version required by the course
- preconfigured run and debug setups for exercises
- course-specific editor settings
- installed language support and helper extensions
- starter scripts and utility commands
- environment conventions that match the assignment structure

The value of this is not only convenience. It also reduces setup drift between students and decreases the amount of time spent debugging local environment differences.

## Customization Areas

### Tooling and Runtime Environment

The language and tool stack can be adapted to the course, including additional local tools that should be available inside the IDE environment.

### Editor and Workspace Configuration

The editing experience can be prepared in advance through settings, extensions, and workspace structure so students land in an environment that already fits the course.

### Run and Debug Experience

Run and debug profiles can be prepared for the course ahead of time. This is especially useful when exercises have a standard execution flow that students should not have to configure from scratch.

### Experience Levels

EduIDE can show students more or less of the IDE. There are three levels:

| Level | What students see |
|---|---|
| **Beginner** | Explorer, Search and Problems, plus the Artemis view in Artemis sessions. One labelled **Run** button, a short menu bar, no debugger |
| **Advanced** | Adds source control, tests, the build tool, the output panel and the terminal. Still no debugger |
| **Expert** | The full IDE, including the debugger and the full task list |

Levels exist for every language: Java, C, Python, JavaScript, Rust and Go.
Students can switch level at any time from the status bar or the **Experience Levels** menu, and the change applies immediately, without reloading.

The tasks offered by the **Run** button in the toolbar follow the level:

- **Beginner** offers Run, and Test where the template has tests (the C templates have none).
- **Advanced** adds Build, and for some languages Lint, Vet, Clippy and Valgrind.
- **Expert** offers the full task list.

An exercise can choose the level students start at. Put a file named `.vscode/eduide.json` into the exercise template:

```json
{ "level": "beginner" }
```

Beyond the three levels, the **Customize** panel (**Experience Levels**, then **Customize Individual Elements**) switches single elements on or off, for example the spell checker, Clippy lints for Rust, the linter findings, the Maven view or the workspace mode in the status bar.

![Customize panel](/img/instructor/customize-panel.png)

The file sets the starting level only. Once a student picks a level themselves, their choice wins over the file. The choice is stored in the session, so a new session without a persistent home directory starts from the file again. The file cannot lock students to a level.

Without the file, students start at **Expert** from EduIDE 1.5.0. EduIDE 1.4.0 itself starts them at **Beginner**. Older versions have no experience levels at all. Ask the platform team which version your installation runs.

### Starter Templates

For students who start a language themselves, the image ships starter templates, for example Maven or Gradle for Java, Make or Bazel for C, and Cargo for Rust.
A template is a small example project with its tasks for running and testing it.
Students pick one on the launcher page.
Exercises you start from Artemis bring their own files, so no template applies.
See [Languages and Starter Templates](/student/getting-started/languages-and-templates) for the list.

### Formatting and Spell Checking

Every image includes a spell checker (English and German), Error Lens and EditorConfig support.
In Python, Ruff formats files on save at the Beginner and Advanced levels, also for Artemis submissions. Expert, the default without `.vscode/eduide.json`, leaves format on save off.

### Course-Specific Defaults

The environment can be shaped so that the default behavior already matches course expectations rather than requiring every student to adapt the IDE manually.

## What This Does Not Automatically Mean

Deep customization does not mean every imaginable workflow becomes equally easy or equally advisable.

It does mean, however, that EduIDE can be tailored much more strongly than a generic hosted IDE offering. If a course needs a controlled, prepared development environment, this is one of the platform’s strongest arguments.

## Why This Matters For Evaluation

When evaluating EduIDE, instructors should not only look at the default demo environment. They should ask what the course-specific environment could look like once it is prepared properly.

That is often the more relevant question, because the real value of EduIDE comes from delivering a prepared environment that matches the teaching concept rather than from showing a generic IDE in the browser.
