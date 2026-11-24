---
title: Connect Your GitHub or GitLab Account
description: Connect a Git account once to open private repositories and push from EduIDE, and what EduIDE can and cannot do with it.
---

# Connect Your GitHub or GitLab Account

:::info Not in every installation
The feature is on only when your installation lists a Git host for it.
If you see no connect option on the start page, your installation does not offer it.
Then you work as before, see [Start from Artemis](./start-from-artemis.md).
:::

You connect a GitHub or GitLab account once.
After that, you can open your private repositories in EduIDE and push your work, however the session started: from a link, from a badge in a README, from the browser extension or with `git clone` in the terminal.

## What it is for

- Open a private repository from a link.
- Push to the repository your session was started with.
- Keep working with plain `git` commands in the terminal and the Source Control view. You never type a token.

Public repositories need no account. They open without it.

## Connect

1. Open the start page of EduIDE and sign in.
2. Choose the Git host you use, for example GitHub or the GitLab of your university.
3. The host asks you to sign in and to allow EduIDE. Read the list of permissions and confirm.
4. The host sends you back to EduIDE. The start page now shows the account as connected.

Connect once per host.
A connection to GitHub does not cover a GitLab server, and a connection to one GitLab server does not cover another.
You can also connect while a session runs. A new connection works within a few seconds.

If you open a link to a private repository before you connect, EduIDE asks you to connect first and then starts the session.

## Disconnect

Disconnect on the start page.
EduIDE revokes the access at the Git host and deletes its copy.
Running sessions lose access within 5 seconds.

## What EduIDE can and cannot do with your account

### What you allow

GitHub shows one broad permission: full control of your private repositories (the `repo` scope).
GitHub offers no narrower permission for private repositories to this kind of application.
GitLab shows three narrower permissions: read repositories, write repositories and read your basic profile (`read_repository`, `write_repository`, `read_user`).

### What EduIDE does with it

EduIDE limits the broad permission in practice:

- **The token stays out of your IDE.** It lives in the control plane of EduIDE. Code in your session, such as a build script or a program you run, cannot read it.
- **Git only.** EduIDE uses the account for Git commands (clone, fetch, push) and for one lookup of your user name. It does not use the platform API of GitHub or GitLab, and neither can your session.
- **One repository per session.** The account is used for the repository your session was started with. Other repositories are read anonymously, so public ones still work. You can approve more repositories for one session, see [Approve another repository](#approve-another-repository).
- **Pushes go to that repository only.**
- **You stay in control.** You disconnect in EduIDE or revoke the access at the Git host at any time.

### What EduIDE cannot do

- No Git LFS. A repository that needs LFS files does not work.
- No issues, pull requests or other platform features. Use the website of your Git host.
- No access to repositories that your account cannot see.

## Where your token is kept

The token is stored in the Kubernetes cluster of your installation, encrypted, in the control plane.
It never enters your session. Logs do not contain it.
Your installation is responsible for the data it handles. Read its privacy statement, linked in the footer of the start page.

## What is logged

- One log line per push and per refused Git request. It holds a pseudonymous user id, the session, the Git host, the repository, the kind of request and the result.
- Successful reads are only counted, without a user.
- When you approve or remove a repository, one log line records it.
- Tokens, file contents and your name never appear in logs.

## How long the connection is kept

EduIDE keeps the connection while you use it.
It revokes and deletes the connection after a period without use. Your installation sets the period. The default is 90 days.
After that, connect again.

## Revoke it at the Git host

You can end the access without EduIDE. Open the list of authorized applications in your account settings at the Git host and remove EduIDE there.
EduIDE notices on the next Git command and deletes its copy.
Then connect again if you want to continue.

## Open a private repository by link

A lecturer shares a link, or a README has an **Open in EduIDE** badge.
Open it and sign in.
If you are not connected, EduIDE asks you to connect first.
Your account must have access to the repository. Otherwise the clone fails with a message that names the repository.
Lecturers find the link format in [Open a Git Repository](/instructor/course-operations/open-a-git-repository).

## Push

Use the terminal (`git push`) or the Source Control view.
You do not enter a username or a password.
You can push to the repository your session was started with, if your account may write to it.

To push to a fork or to another repository, start a new session from that repository, or approve it for the session, see below.

## Approve another repository

You may need a second private repository, a fork to push to, or a push target in a session that started without a repository.
When Git refuses, it prints a message with a link:

```
fatal: remote error: This session may not use github.com/<owner>/<repository> yet. Approve it here: https://<eduide-host>/?session=...
```

1. Open the link. Sign in to EduIDE if asked.
2. Check the session and the repository on the page. They must be the ones you meant.
3. Confirm.
4. Run your Git command again. It works within 5 seconds.

:::warning Only approve a request you just made
Approve only when you ran the Git command yourself a moment ago.
A link that someone sent you, or a link in a file or a README, is a request you did not make.
:::

An approval is for one session and one repository, and ends with the session.
Your installation decides whether approvals exist at all, and whether they cover reading only or also pushing.
It limits how many repositories one session may approve.

## Commit name and e-mail

When your session repository is on a connected host, EduIDE sets the Git name to the name of your account and the e-mail to the no-reply address of your account.
Your private e-mail address does not appear in your commits.
EduIDE sets this when the session starts.
If you connect after the start, or change your name at the host, start a new session to see the change.
On some self-managed hosts EduIDE has no no-reply address. Then it keeps the name and e-mail from your university login.

## Troubleshooting

Git prints these messages as `fatal: remote error: <message>`.

| Message | Meaning and what to do |
|---|---|
| Connect your `<Host>` account to open this repository: `<link>` | You have no connection, or the host no longer accepts it. Open the link, connect, and run the command again. |
| This session may not use (or push to) `<host>/<repository>` yet. Approve it here: `<link>` | The session may not use your account for this repository yet. See [Approve another repository](#approve-another-repository). |
| EduIDE uses your `<Host>` account only for the repository this session was started with (`<repository>`). Start a session from `<host>/<repository>` to open it. | Your installation does not offer approvals. Start a session from that repository, or use a public one. |
| EduIDE only pushes to the repository this session was started with (`<repository>`, or none). Start a session from `<host>/<repository>` to push there. | You can push only to the session repository. Start a session from the repository you want to push to. |
| `<host>/<repository>`: not found, or your `<Host>` account has no access | The repository does not exist, you mistyped the address, or your account has no access. Check the address and your rights at the host. For an organisation repository, the organisation may restrict applications, so ask its owners. |
| `<host>/<repository>` moved, and EduIDE does not follow redirects. Use the new repository URL. | The repository was renamed or moved. Use its new address. |
| `<Host>` is not reachable right now. Try again in a moment. | The Git host is down or not reachable from EduIDE. Wait and retry. |
| EduIDE cannot check your access right now. Try again in a moment. | A short outage of EduIDE. Retry. Tell your tutor if it persists. |
| EduIDE could not verify this session. | The session ended. Start a new one. |
| This EduIDE session is not ready for Git access. | The session is still starting or is stopping. Wait, or start a new one. |
| `<host>` is not a Git host EduIDE connects to. | EduIDE does not connect accounts for this host. Ask your tutor. |
| Git LFS is not supported through EduIDE. | Limit of EduIDE. Do not use LFS in sessions. |
| EduIDE does not allow this Git request. | The request is not a clone, fetch or push. Use plain Git commands. |
| Unable to access `http://127.0.0.1:8082/...`: Failed to connect | Git cannot reach EduIDE inside the session. Reload the tab. If it stays, tell your tutor. |

The connection works only for the exact address of the repository.
If a repository was renamed, use the new address.
If it still fails, see [Get Help](../learning/get-help.md).
