---
title: What Changed in 3.0
description: What lecturers, students and operators notice in EduIDE 3.0.0.
---

# What Changed in 3.0

EduIDE 3.0.0 replaces the platform that starts and stops sessions.
The IDE still runs in the browser, but the start page, the session handling and the way Artemis opens an exercise are new.
Read this page before the semester starts.

## For your students

- **A new start page.** After login, **Your environments** lists everything a student started, and **Start new** shows one tile per environment. Each tile says how long a start takes and whether the workspace is saved or temporary.
- **Saved and temporary workspaces.** A temporary workspace deletes its files when the session ends. A saved workspace keeps them and is deleted after a number of days without use (14 by default).
- **Resume and delete from one place.** Students continue an environment with **Start**, and delete one they no longer need. There is no separate stop button: a session stops by itself after inactivity.
- **Back to the start page.** **File -> Back to Start Page** in the IDE returns to the start page and keeps the session running.
- **Session timeouts.** After 50 minutes without input the IDE warns, after 60 minutes the session stops, after 24 hours it stops in any case. The start page shows the stop time. Installations can change these values.
- **Seven languages, two editions.** Java 17, Java 25, Python, JavaScript, C, Rust and Go. Haskell and OCaml are gone. Each language has an Artemis edition and a standalone edition.
- **Browser only.** The desktop (Electron) application is gone.
- **Status and legal pages.** A public status page and the privacy statement and imprint of your installation are linked in the footer.

## For you as a lecturer

- **You choose what students see.** Templates can be listed (a tile on the start page) or unlisted (reachable only from an Artemis link). See [What Lecturers Can Choose](./lecturer-choices.md).
- **Warm pools for lab starts.** Operators keep idle sessions ready, so a lab start is fast. Tell them the time and headcount.
- **Artemis links changed.** Artemis now passes the access token and the repository URL in the URL fragment, not in the query. That needs Artemis pull request #14702, which is not yet merged upstream. Until your Artemis has it, an exercise opens the IDE but may not clone itself.
- **Experience levels** (Beginner, Advanced, Expert) work for every language and switch without a reload. `.vscode/eduide.json` still sets the starting level.
- **Privacy.** Logs and traces use a pseudonymous user id. See [Privacy and Data](./privacy-and-data.md).

## For operators

The platform is a new control plane with new custom resources (`IDETemplate`, `IDEPool`, `IDESession`, `IDEWorkspace`), Envoy Gateway as the only entry, login at the gateway, and OpenTelemetry and Prometheus for observability.
It replaces the earlier Java stack, the separate login proxies per session, the data bridge, the workspace garbage collector and error reporting through Sentry.
See the [administrator guide](/admins/intro) for installation, migration and upgrades.

## After 3.0.0: Git accounts

Git accounts are not released yet. Installations that enable them let students connect a GitHub or GitLab account once, open private repositories from a link and push from a session.
See [Open a Git Repository](./open-a-git-repository.md), the [student guide](/student/getting-started/connect-git-account) and the [administrator guide](/admins/platform/git-accounts).

## What stays the same

- Grading, feedback and course management stay in Artemis.
- Pushed work is safe. Unpushed work in a temporary workspace is not.
- The IDE is a real Theia-based IDE with a terminal, debugger and language servers.
