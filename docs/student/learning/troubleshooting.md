---
title: Troubleshooting
description: Common problems when you start or use EduIDE, and what to do.
---

# Troubleshooting

| Problem | What to do |
|---|---|
| The start takes longer than the tile said | This happens when many people start at once. Keep the tab open and do not reload. |
| You reloaded while it started | Wait. Starting again opens the same session instead of a second one. |
| "The cluster is full right now" | Try again in a few minutes. Tell your tutor if it persists. |
| "You already have N sessions running" | Delete one under **Your sessions**, or continue in one of them. |
| "You have reached the maximum number of saved workspaces" | Delete a saved workspace you no longer need. |
| "Repositories from ... cannot be opened here" | Your installation does not trust that host. Ask your tutor for the approved link. |
| "Your login expired" | Reload the page and sign in again. |
| The IDE looks frozen or the terminal is gone | Reload the browser tab. The session runs on the server and the tab is only a view of it. |
| The session stopped | See [When Your Session Ends](../getting-started/session-timeout.md). |
| The exercise did not clone | The project folder already has files, or your Artemis does not pass the repository yet. See [Start from Artemis](../getting-started/start-from-artemis.md). |
| Git does not accept your password, or says "Authentication failed" | Use an access token instead of your password. See [Private Git Repositories](./private-repositories.md#if-something-goes-wrong). |
| A private repository from a link does not clone | Links open public repositories only. Start with **Empty project** and use **Clone Repository** in the Source Control view. See [Private Git Repositories](./private-repositories.md). |
| A push is rejected | This is a Git problem, for example the wrong branch or a conflict. Treat it as you would on your own computer. |
| A menu or the terminal is missing | Raise the experience level in the status bar. See the [IDE Tour](../getting-started/workspace-tour.md). |
| Nobody in the course can start an IDE | Check the status page linked in the footer of the landing page, then tell your tutor. |

If the problem remains, see [Get Help](./get-help.md).
