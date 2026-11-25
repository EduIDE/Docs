---
title: Connect Your GitHub or GitLab Account
description: Connect a Git account once to open private repositories and push from EduIDE without typing a token, and what EduIDE does with it.
---

# Connect Your GitHub or GitLab Account

:::info Available from the EduIDE release that ships Git accounts
Git accounts are not released yet, and only installations that enable them offer them.
You have them when the start page shows a **Git accounts** section.
Without that section, use the access token way in [Private Git Repositories](./private-repositories.md).
:::

You connect a GitHub or GitLab account once.
After that, you can open your private repositories in EduIDE and push your work, however the environment started: from a link, from an **Open in EduIDE** badge, from the browser extension or with `git clone` in the terminal.
You never type a token.

This page is for the standalone edition.
In the Artemis edition, Artemis handles your repository and login, see [Artemis or Standalone?](../getting-started/artemis-or-standalone.md).

## What it is for

- Open a private repository from a link.
- Push to the repository your environment was started with.
- Use plain `git` commands in the terminal and the Source Control view.

Public repositories need no account. They open without it.
A Git host that your installation does not list in the **Git accounts** section works the manual way, see [Private Git Repositories](./private-repositories.md).

## Connect

1. Open the start page of EduIDE and sign in.
2. Find the **Git accounts** section (German: **Git-Konten**). It has one row per Git host, for example GitHub or the GitLab of your university.
3. Click **Connect** (German: **Verbinden**) in the row of your host.
4. The host asks you to sign in and to allow EduIDE. Read the list of permissions and confirm.
5. The host sends you back to EduIDE. The page says "Account `<name>` connected" and takes you back. The row now reads "Connected as `<name>`".

Connect once per host.
A connection to GitHub does not cover a GitLab server, and a connection to one GitLab server does not cover another.
You can also connect while an environment runs. The new connection works within 3 seconds.

## Disconnect

1. Click **Disconnect** (German: **Trennen**) in the row of the host.
2. Confirm in the dialog.

EduIDE deletes its copy of the token and revokes it at the Git host.
Running environments lose access within 5 seconds.

You can also end the access at the Git host: open the list of authorized applications in your account settings there and remove EduIDE.
EduIDE notices on the next Git command and deletes its copy.

## What EduIDE can and cannot do with your account

### What you allow

GitHub shows one broad permission: full control of your private repositories (the `repo` scope).
GitHub offers no narrower permission for private repositories to this kind of application.
GitLab shows three narrower permissions: read repositories, write repositories and read your basic profile.

### What EduIDE does with it

EduIDE limits the broad permission in practice:

- **The token stays out of your environment.** It lives in the control plane of EduIDE. Code in your environment, such as a build script or a program you run, cannot read it.
- **Git only.** EduIDE uses the account for Git commands (clone, fetch, push) and for one lookup of your user name. It does not use the platform API of GitHub or GitLab, and neither can your environment.
- **One repository per environment.** The account is used for the repository your environment was started with, and for repositories you approve for that environment, see [Approve another repository](#approve-another-repository). Other repositories are read anonymously, so public ones still work.
- **You stay in control.** You disconnect in EduIDE or revoke the access at the Git host at any time.

### What EduIDE cannot do

- No Git LFS. A repository that needs LFS files does not work.
- No issues, pull requests or other platform features. Use the website of your Git host.
- No access to repositories that your account cannot see.

## Where your token is kept

EduIDE stores the token encrypted in the cluster of your installation, in the control plane.
It never enters your environment, and logs do not contain it.
Your installation is responsible for the data it handles. Read its privacy statement, linked in the footer of the start page.

EduIDE keeps the connection while you use it.
It revokes and deletes the connection after a period without use. Your installation sets the period. The default is 90 days.
After that, connect again.

## What is logged

- One log line per push and per refused Git request, with a pseudonymous user id, the environment, the Git host, the repository, the kind of request and the result.
- Successful reads are only counted, without a user.
- When you approve or remove a repository, one log line records it.
- Tokens, file contents and your name never appear in logs.

## Open a private repository by link

A tutor shares a link, or a README has an **Open in EduIDE** badge.
Open it and sign in.
Before the environment starts, EduIDE checks the repository:

- **This repository needs your `<Host>` account**: you are not connected, or the repository does not exist, or the link is wrong. Click **Connect**. After the connection, the start continues on the same link. You do not open the link again.
- **No access to this repository**: the repository does not exist, or your connected account has no access to it. GitHub and GitLab answer the same way for both. Check the link and ask the owner for access. **Connect another account** replaces your connection: sign out at the Git host first, because the host remembers its login and would offer the same account again. **Back** returns to the start page.

If the check itself fails, for example because the Git host is slow, EduIDE starts the environment anyway.
Lecturers find the link format in [Open a Repository from a Link](/instructor/course-operations/open-in-eduide-links#git-accounts).

If a link has no template, or one that does not exist, EduIDE shows **Open `<repository>`** and a list of environments.
Choose one to start it with the repository.

## Push

Use the terminal (`git push`) or the Source Control view.
You do not enter a username or a password.
You can push to the repository your environment was started with, if your account may write to it.
To push to a fork or to another repository, start an environment from that repository, or approve it for this environment, see below.

## Approve another repository

You may need a second private repository, a fork to push to, or a push target in an environment that started without a repository.
When Git refuses, it prints a message with a link:

```text
fatal: remote error: This session may not use github.com/<owner>/<repository> yet. Approve it here: https://<eduide-host>/?session=...
```

1. Open the link and sign in to EduIDE if asked.
2. The page **Allow Git access for an environment?** shows the environment, the repository and the access: **Read (clone and fetch)** or **Read and push**. Check that they are the ones you meant.
3. Click **Allow** (German: **Erlauben**). **Decline** (German: **Ablehnen**) approves nothing.
4. Run your Git command again. It works within 5 seconds.

:::warning Only approve a request you just made yourself
Approve only when you ran the Git command a moment ago.
A link that someone sent you, or a link in a file or a README, is a request you did not make.
An approval lets this environment use your account for the repository named on the page.
:::

An approval is for one environment and one repository, and it ends with the environment.
The same page lists the approved repositories of the environment, each with **Remove** (German: **Entfernen**). A removal takes effect within 5 seconds.
Your installation decides whether approvals exist, and whether they cover reading only or also pushing.
It also limits how many repositories one environment may approve.

## Commit name and e-mail

When your environment starts with a repository on a connected host, EduIDE sets the Git name to the name of your account and the e-mail to the no-reply address of your account.
Your private e-mail address does not appear in your commits.
EduIDE sets this when the environment starts.
If you connect after the start, or change your name at the host, start a new environment to see the change.
On some self-managed hosts EduIDE has no no-reply address. Then it keeps the name and e-mail from your university login.

## Limits

- The connection works only for the exact address of the repository. After a rename, use the new address. EduIDE does not follow redirects.
- A repository address has 2 to 10 parts, and no part starts with a dot.
- A transfer that moves no data for 5 minutes is cancelled. A slow transfer that keeps moving is not.
- Git commands from one environment are rate limited. Normal clones, fetches and pushes never reach the limit.

## Troubleshooting

Git prints these messages as `fatal: remote error: <message>`.

| Message | Meaning and what to do |
|---|---|
| Connect your `<Host>` account to open this repository: `<link>` | You have no connection, or the host no longer accepts it. Open the link, connect, and run the command again. |
| This session may not use (or push to) `<host>/<repository>` yet. Approve it here: `<link>` | The environment may not use your account for this repository yet. See [Approve another repository](#approve-another-repository). |
| EduIDE uses your `<Host>` account only for the repository this session was started with (`<repository>`). Start a session from `<host>/<repository>` to open it. | Your installation does not offer approvals. Start an environment from that repository, or use a public one. |
| EduIDE only pushes to the repository this session was started with (`<repository>`). Start a session from `<host>/<repository>` to push there. | You can push only to the repository of the environment, or to an approved one. Start an environment from the repository you want to push to. |
| `<host>/<repository>`: not found, or your `<Host>` account has no access | The repository does not exist, you mistyped the address, or your account has no access. Check the address and your rights at the host. For an organisation repository, the organisation may restrict applications, so ask its owners. |
| `<host>/<repository>` moved, and EduIDE does not follow redirects. Use the new repository URL. | The repository was renamed or moved. Use its new address. |
| `<Host>` is not reachable right now. Try again in a moment. | The Git host is down or not reachable from EduIDE. Wait and retry. |
| EduIDE cannot check your access right now. Try again in a moment. | A short outage of EduIDE. Retry. Tell your tutor if it persists. |
| EduIDE could not verify this session. | The environment ended. Start a new one. |
| This EduIDE session is not ready for Git access. | The environment is still starting or is stopping. Wait, or start a new one. |
| `<host>` is not a Git host EduIDE connects to. | EduIDE offers no account for this host. Use the manual way in [Private Git Repositories](./private-repositories.md), or ask your tutor. |
| Git LFS is not supported through EduIDE. | Limit of EduIDE. Do not use LFS in environments. |
| EduIDE does not allow this Git request. | The request is not a clone, fetch or push. Use plain Git commands. |
| Too many Git requests of this session run at the same time. Try again in a moment. | Many Git commands ran in parallel. Wait and retry. |
| The transfer stalled and EduIDE cancelled it. Try again. | Nothing moved for 5 minutes. Retry. |
| Unable to access `http://127.0.0.1:8082/...`: Failed to connect | Git cannot reach EduIDE inside the environment. Reload the tab. If it stays, tell your tutor. |

If it still fails, see [Troubleshooting](./troubleshooting.md) and [Get Help](./get-help.md).
