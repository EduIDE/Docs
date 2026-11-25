---
title: Privacy and Data
description: What data EduIDE 3.0.0 handles, and what you should tell students.
---

# Privacy and Data

Your university or institute runs the installation and is the responsible party.
The installation must publish an imprint and a privacy statement, which the footer of the start page links.
Check them before the semester.

## What the platform handles

- **Login.** Students sign in through the login of your institution. The platform uses a user id from it to show each student only their own environments.
- **Workspaces.** Files live in the student's environment. Only the owner can open it. A temporary workspace is deleted when the session ends. A saved workspace is deleted after the retention time.
- **Artemis tokens and repository links.** They reach the session only, are deleted with it and do not appear in logs.
- **Git accounts.** From the EduIDE release that ships them, and only if your installation enables them, students may connect a GitHub or GitLab account. The token stays in the control plane, encrypted, and never enters the session. See [Open a Repository from a Link](./open-in-eduide-links.mdx#git-accounts).
- **Logs and traces.** They hold a pseudonymous user id and the session id, not names or e-mail addresses. The installation decides how long it keeps traces; ask the platform team.

## What you should do

- Tell students not to put personal data or Artemis links into public GitHub issues.
- Do not use a saved workspace as the only copy of anything that matters.
- Ask the platform team what the installation stores beyond this page, and refer to the privacy statement of the installation for the legal text.
