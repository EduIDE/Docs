---
title: Privacy
description: What EduIDE handles about you and where to read the privacy statement of your installation.
---

# Privacy

Your university or course runs its own EduIDE installation and is responsible for the data it handles.
The footer of the landing page links the **Privacy** statement and the **Imprint** of your installation.
Read the statement there. It is the binding text.

## What the platform does with your data

- You sign in through the login of your institution. EduIDE uses a user id from that login to show you only your own sessions and workspaces.
- Your files live in your session. Only you can open it, and the platform checks this on every request.
- Access tokens and repository links from Artemis go to your session only. They are deleted with the session and do not appear in logs or in the progress notification.
- Logs and traces of the platform use a pseudonymous user id, not your name or e-mail address.
- A temporary session deletes its files when the session ends. A saved workspace is deleted a number of days after your last use.

## What you should do

- If you connect a GitHub or GitLab account, EduIDE keeps its token encrypted in the control plane, never in your session. See [Connect Your GitHub or GitLab Account](./connect-git-account.md).
- Do not put personal data, Artemis links or exercise code into a public GitHub issue. Artemis links can contain access tokens.
- Push your work to Artemis. The platform does not back up your files.
