---
title: Languages and Starter Templates
description: Which languages EduIDE offers, what a starter template contains, and how formatting and spell checking work.
---

# Languages and Starter Templates

## Languages

The launcher offers these languages:

- Java 17
- Java 25
- Python
- JavaScript
- C
- Rust
- Go

Your installation may show only some of them.

## Starter templates

When you start a language yourself, you can pick a starter template.
It puts a small example project into your workspace, with tasks that run and test it.

| Language | Templates |
|---|---|
| Java 17, Java 25 | Maven, Gradle |
| C | Make, Bazel |
| Python | Python |
| JavaScript | Node (TypeScript), Web (TypeScript) |
| Rust | Cargo |
| Go | Go |

Exercises you start from Artemis bring their own files, so you skip this choice.
See [Start from Artemis](./start-from-artemis.md).

## What every language includes

- a **spell checker** for English and German that marks typos in comments and text
- **Error Lens**, which shows errors and warnings next to the line they belong to
- **EditorConfig** support, so the formatting rules of a project apply automatically

In the Python workspace, **Ruff** formats your code every time you save a file, in the Beginner and Advanced levels.
The Python image also ships `numpy`, `pandas`, `matplotlib`, `uv` and `ruff`.

## Preview HTML files

To see an HTML page while you edit it:

1. Open the `.html` file.
2. Click **Open Preview to the Side** in the editor toolbar.
   Alternatively, right-click the file in the Explorer and choose **Open With**, then **Preview**.

The preview opens next to your code inside the IDE.
The old **Live Preview** extension is no longer part of EduIDE.

## Next step

Continue with the [Workspace Tour](./workspace-tour.md).
