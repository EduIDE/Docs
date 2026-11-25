# AGENTS.md

## What this is

The Docusaurus documentation site of EduIDE (https://eduide.github.io/Docs), with the glossary in `src/pages/glossary.md`.
Run `npm test` for the unit tests and `bash scripts/check-docs.sh` for the sidebar checks, and `npm run build` to catch broken links.

## Terminology

Use the terms of the [EduIDE glossary](https://eduide.github.io/Docs/glossary) in code, UI texts, docs, values and comments, in exactly the meaning it gives.
Do not introduce synonyms (environment, instance, workspace, launch, lecturer, start page) for a term the glossary defines, and never write "frontend" or "backend".
When a new term is needed or a term changes, update the glossary in `EduIDE/Docs` first.
In this repository the glossary page itself is `src/pages/glossary.md`, and the four audience sections (student, instructor, admins, developer) must use its terms.
