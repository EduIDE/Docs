---
title: Run and Debug Configurations
description: How an exercise ships the Run button tasks and the debug configurations students see in EduIDE.
---

# Run and Debug Configurations

The toolbar of EduIDE has a **Run** button and a **Debug** button.
Both read their entries from the exercise itself, so you set them up once in the exercise template.

| Button | File | Shown at |
|---|---|---|
| **Run** | `.vscode/tasks.json` | every level, the entries depend on the level |
| **Debug** | `.vscode/launch.json` | Expert only |

Both files go into the `.vscode` folder at the root of the repository students work in.
In Artemis, put them into the template repository of the exercise, next to `.vscode/eduide.json` if you use one.
Artemis copies them into every student repository, and EduIDE clones that repository into the project folder.
EduIDE reads the files when the IDE opens and again whenever they appear or change, so it does not matter that the clone finishes after the IDE has started.
A button without entries hides itself.

## The Run button: `tasks.json`

Each task is one entry in the Run button's menu.
The main button runs the task the student used last, at first the default build task.

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Run",
            "type": "shell",
            "command": "tsx src/index.ts",
            "group": { "kind": "build", "isDefault": true },
            "options": { "cwd": "${workspaceFolder}" },
            "presentation": { "reveal": "always", "panel": "shared" }
        },
        {
            "label": "Test",
            "type": "shell",
            "command": "tsx --test \"test/**/*.test.ts\"",
            "group": "test",
            "options": { "cwd": "${workspaceFolder}" },
            "eduide": { "minLevel": "beginner" }
        }
    ]
}
```

Which tasks a student sees depends on their [experience level](../course-evaluation/customizable-features.md#experience-levels):

1. A task with `"eduide": { "minLevel": "..." }` appears from that level on. Allowed values are `beginner`, `advanced` and `expert`.
2. A task without `minLevel` that is the default build task (`"group": { "kind": "build", "isDefault": true }`) appears at every level. Make the task that compiles and runs the program the default build task.
3. Every other task appears at Expert only.

Students who turn on **Offer every task, ignoring level marks** in the **Customize** panel see every task at any level.

## The Debug button: `launch.json`

Each configuration is one entry in the Debug button's menu.
The debugger is part of the Expert level only, so students at Beginner or Advanced do not see the Debug button, even if the exercise ships a `launch.json`.
Set the starting level to `expert` in `.vscode/eduide.json` if students should debug from the start.
Students at a lower level can turn on **Debug split button** in the **Customize** panel.

### Java

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "java",
            "name": "Debug App",
            "request": "launch",
            "mainClass": "com.example.App",
            "projectName": "my-project",
            "vmArgs": "-Xmx256m"
        }
    ]
}
```

`mainClass` is the fully qualified name of the class with the `main` method.
Keep `-Xmx` small: the program runs in the same container as the IDE and shares its memory.

### TypeScript with Node.js

The JavaScript image ships `tsx`, which runs TypeScript without a build step.

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug App",
            "program": "${workspaceFolder}/src/index.ts",
            "runtimeExecutable": "tsx",
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "skipFiles": ["<node_internals>/**"]
        }
    ]
}
```

`program` points to the entry file of the exercise.
`console: integratedTerminal` lets the program read input from the terminal.

### Other languages

The starter projects of every image contain a working `tasks.json` and `launch.json`.
Copy them as a starting point: start a session with the language from the landing page, pick the matching starter project and open the `.vscode` folder.
The debugger for a language is only available in the image of that language.

## Common mistakes

- **The Debug button is missing.** The student is not at Expert and has not turned it on in the **Customize** panel, or the file is not at `.vscode/launch.json` in the workspace root.
- **The Run button shows only one task.** The other tasks have no `minLevel` and the student is not at Expert. Add `"eduide": { "minLevel": "beginner" }` to the tasks beginners should see.
- **A task runs in the wrong folder.** Set `"options": { "cwd": "${workspaceFolder}" }`.
