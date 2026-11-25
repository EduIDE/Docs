---
title: Get Help
description: Where to report problems and ask questions about EduIDE.
---

# Get Help

Ask your tutor first when a problem is about your exercise or your course.
Use the channels below when the problem is about EduIDE itself.
Try [Troubleshooting](./troubleshooting.md) first.

## Report a problem

Students use one tracker: `https://github.com/EduIDE/EduIDE/issues`.
Choose **Bug report** or **Feature request**.
Each form asks for a description, and the bug form also asks for the steps to reproduce.
The maintainers move platform issues to the right repository themselves.

| Problem | Where to go |
|---|---|
| The start page, signing in, starting or stopping environments, saved workspaces, the IDE, terminal, languages, extensions, templates | The tracker above |
| Your exercise, grading, deadlines, access to your installation | The contact of your course |

Use these links to open a form with the **installation** and the **version** already filled in:

- **Help -> Report Issue** in the IDE.
- **Report a bug** and **Request a feature** in the footer of the start page.

You need a GitHub account to open an issue.

:::warning Issues are public
Do not put personal data, Artemis links or exercise code into an issue.
Artemis links can contain access tokens.
For a security problem, do not open an issue. Use the [security advisory form](https://github.com/EduIDE/.github/security/advisories/new).
:::

## Send feedback from the IDE

Some installations let you send a bug report or a feature request from inside the IDE.
This works only if your installation turned it on. If **Send Feedback** is missing, use **Help -> Report Issue** instead.

Open the dialog in one of these ways:

- **Help -> Send Feedback**
- The command palette: **Send Feedback**
- The **Send Feedback** item in the status bar

Choose bug or feature, write a title and a description, and decide how to send it:

- **Send anonymously.** You must agree first: your feedback may become public on GitHub, without your name, after the maintainers reviewed it.
- **Use my GitHub account.** The IDE opens the issue form in your browser. You send it there under your own name.

Anonymous feedback sends this technical context:

- The hostname of your installation
- The EduIDE version
- The app definition (the template you started)
- Your browser

It never sends your name, your user id, your session id or your code.
Do not write personal data into the text yourself. The system removes tokens, e-mail addresses and matriculation numbers, but it cannot find everything.
You can send up to 5 messages per hour.
If sending fails, the dialog keeps your text.

## Ask a question

Ask questions in the GitHub Discussions of the `EduIDE/EduIDE` repository, or ask your course contact.
