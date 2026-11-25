---
title: Send Feedback
description: Report a bug or request a feature from the IDE or the start page, anonymously or with your GitHub account.
---

# Send Feedback

You found a bug in EduIDE or you miss a feature?
Tell us from where you work: from the IDE or from the start page.
For problems with your exercise, grading or deadlines, ask your course contact instead.

## From the IDE

Your installation decides whether the IDE offers **Send Feedback**.
If you do not see it, use **Help -> Report Issue** (see [With your GitHub account](#with-your-github-account)).

1. Open **Help -> Send Feedback**.
   You also find it in the command palette (**Send Feedback**) and as the speech bubble icon in the status bar.

   ![Help menu with the entries Send Feedback, About, Welcome and Report Issue](/img/student/learning/feedback-01-help-menu.png)

2. Choose **Bug** or **Feature**, write a short title and describe what happened.
   For a bug, say what you did, what you expected and what you saw instead.

   ![Send Feedback dialog with type, title, description, the box Sent along, the consent checkbox and the buttons Send anonymously and Use my GitHub account](/img/student/learning/feedback-02-dialog.png)

3. Check what **Sent along** lists.
   The IDE sends only these technical details with your text.

4. Decide how to send it:
   - **Send anonymously** sends the feedback without your name.
     Tick the checkbox first: the maintainers review your feedback, and it may become public on GitHub afterwards.
   - **Use my GitHub account** opens the issue form on GitHub in your browser, with your text already filled in.
     You send it there under your GitHub name.

5. After an anonymous send, the IDE thanks you in a notification.

   ![The IDE with the notification Thank you for your feedback](/img/student/learning/feedback-03-sent.png)

If sending fails, the dialog keeps your text.
Try again later, or use **Use my GitHub account**.

## From the start page

The footer of the start page has **Report a bug** and **Request a feature**.
Both open the issue form on GitHub with your installation and the EduIDE version already filled in.

![Footer of the start page with the links GitHub, Report a bug, Request a feature, Status, Imprint and Privacy](/img/student/learning/feedback-04-start-page-footer.png)

## With your GitHub account

**Help -> Report Issue**, **Use my GitHub account** and the footer links all open a form in the tracker `https://github.com/EduIDE/EduIDE/issues`.
You need a GitHub account for it.
The form asks for a description, and the bug form also for the steps to reproduce.

## What is sent and what is not

| Sent | Never sent |
|---|---|
| Your title and description | Your name, user id or e-mail address |
| The EduIDE version | Your session id or the address of your session |
| Your browser family, for example Firefox or Chrome | Your code or your workspace |
| The installation and the template you started (added by the server for anonymous feedback) | |

Do not write personal data, Artemis links or exercise code into the text.
Artemis links can contain access tokens.
For anonymous feedback, the system removes tokens, e-mail addresses and matriculation numbers, but it cannot find everything.
You can send about 5 anonymous messages per hour.

:::warning Issues are public
Everything in the tracker is public, also anonymous feedback once the maintainers moved it there.
For a security problem, do not send feedback. Use the [security advisory form](https://github.com/EduIDE/.github/security/advisories/new).
:::

## Related pages

- [Get Help](./get-help.md): who handles which problem, and where to ask questions.
- [Troubleshooting](./troubleshooting.md): fixes for common problems.
