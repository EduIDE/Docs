---
title: Private Git Repositories
description: Clone, commit and push a private GitHub or GitLab repository in the standalone edition with an access token.
---

# Private Git Repositories

This page is for the **standalone edition**, the sessions you start from a tile on the landing page.
In the Artemis edition, Artemis handles your repository and login, and you do not need any of this.
See [Artemis or Standalone?](../getting-started/artemis-or-standalone.md) if you are not sure which one you use.

:::info Does your start page offer Connect?
From the EduIDE release that ships Git accounts, some installations let you connect your GitHub or GitLab account once.
Then you do not need a token: open your private repository from a link and push without typing anything.
Look for the **Git accounts** section on the start page.
If it lists your Git host, read [Connect Your GitHub or GitLab Account](./connect-git-account.md) instead of this page.
Stay here when the section is missing, or when your host is not in it. The token way below always works.
:::

## What you need

- A repository on GitHub, gitlab.com, the LRZ GitLab (`gitlab.lrz.de`) or another Git host.
- An **access token** for that host.
- A standalone session with an empty project folder. Pick **Empty project** when you start it.

## Why a token and not your password

GitHub and GitLab do not accept your account password when Git connects to them.
Git asks for a username and a password, and you enter an access token as the password.
A token is a long random password that only allows what you choose, only until the date you choose, and that you can delete at any time.

## Step 1: Create an access token

Create the token on the website of your Git host.
Copy it right after you create it: the host shows it only once.
Keep it in your password manager until you paste it into EduIDE.

### GitHub

1. Click your profile picture, then **Settings**.
2. Open **Developer settings**, then **Personal access tokens**, then **Fine-grained tokens**.
3. Click **Generate new token**.
4. Give it a name, for example "EduIDE course", and an expiration date, for example the end of the semester.
5. Under **Resource owner**, keep your own account for your own repository, or pick the organization that owns the repository.
   Then, under **Repository access**, choose **Only select repositories** and pick your repository.
6. Under **Permissions**, set **Contents** to **Read and write**.
7. Click **Generate token** and copy it.

In EduIDE, your username is your GitHub username.

If the repository belongs to an organization and your token cannot reach it, the organization may have to approve fine-grained tokens first.
Ask the owner of the repository, or create a classic token instead: **Personal access tokens**, then **Tokens (classic)**, with the scope `repo`.
A classic token reaches all your repositories, so give it a short expiration date.

### GitLab (gitlab.com, LRZ GitLab and other GitLab servers)

The screenshots show the LRZ GitLab (`gitlab.lrz.de`).
gitlab.com and other GitLab servers look the same.

1. Click your avatar at the top right, then **Preferences** or **Edit profile**.

   ![GitLab menu under the avatar with Edit profile and Preferences](/img/student/learning/gitlab-01-profile-menu.png)

2. In the left menu, open **Access**, then **Personal access tokens**.

   ![Access menu with the entry Personal access tokens](/img/student/learning/gitlab-02-access-menu.png)

3. Click **Generate token** and choose the **legacy token**.

   ![List of personal access tokens with the Generate token button](/img/student/learning/gitlab-03-token-list.png)

4. Give it a name, for example "EduIDE course", and an expiration date, for example the end of the semester.
   Your GitLab may limit how far in the future the date can be.
5. Select the scopes `read_repository` and `write_repository`, and nothing else.

   ![Expiration date and the selected scopes read_repository and write_repository](/img/student/learning/gitlab-04-scopes.png)

6. Create the token, then click the copy button next to it.
   GitLab shows the token only on this page.

   ![The new token with its copy button](/img/student/learning/gitlab-05-token-created.png)

In EduIDE, your username is your GitLab username.

Your team may also give you a **project access token** that works for one project only.
Then any non-empty username works, for example your GitLab username.

## Step 2: Clone the repository

1. Start a standalone session with **Empty project**.
2. Open the **Source Control** view on the left.
3. Click **Clone Repository**.
4. Paste the `https` address of your repository, for example `https://github.com/owner/repository.git`, and press Enter.
   Copy it from the **Code** or **Clone** button of the repository page. Use the address that starts with `https://`.
5. If the repository is private, EduIDE asks for **Username for the repository** and then **Access token**. Enter your username and paste your token.

EduIDE clones the repository into your project folder, and you see "Cloned ... into the workspace."
The button only works in an empty workspace.
If the project folder already has files, EduIDE says so and clones nothing.

:::tip A link opens public repositories only
A link from your tutor can clone a public repository for you.
For a private repository, the clone fails with a message that the host "did not accept the access".
Start a standalone session with **Empty project** instead and use **Clone Repository** as described above.
:::

## Step 3: Commit and push

1. Open the **Source Control** view. It lists the files you changed.
2. Type a short message that describes your change, then click **Commit**.
3. Push: click **...** at the top of the Source Control view and choose **Push**.

If you cloned with **Clone Repository** in the same session, the push does not ask for anything.
Otherwise EduIDE asks for your username and then for a password: paste your token as the password.

EduIDE sets a name and an e-mail address for your commits.
To have your Git host link your commits to your account, set the e-mail address of that account once per repository in the terminal:

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```

Without `--global`, Git saves this in the repository, so it stays in a saved workspace.

## What happens with your token

- EduIDE keeps your token **in memory, in this one session only**.
- It forgets the token after **3 hours**, or when the session ends, whichever comes first. Then Git asks again on the next push.
- **Clone Repository** does not write the token to your files or to the repository.
- Every new session starts without a token: a second session, a restart after a break, and a saved workspace you start again.

What happens with your **files** depends on the start mode:

| | Temporary session | Saved workspace |
|---|---|---|
| Your files when the session ends | Deleted. Push before you stop | Kept |
| Your token when the session ends | Gone | Gone. Enter it again on the next push |
| Next time | Clone again | Click **Start** under **Your sessions** |

Only what you push is safe.
See [Saved Workspaces and Temporary Sessions](../getting-started/workspaces.md) and [When Your Session Ends](../getting-started/session-timeout.md).

## Keep your token safe

A token is as good as a password for your repository.
Anyone who has it can read and change your code.

- Paste the token only into the EduIDE prompts for username and token or password.
- Never put the token into the repository address, for example `https://name:token@github.com/...`. The address is saved in the repository settings and in the terminal history, and in a saved workspace it stays there.
- Never commit the token, and never put it into a file, a chat, a forum post, a screenshot or an issue.
- Give the token only the rights it needs: read and write of the content, nothing else.
  On GitHub, limit it to one repository.
  A GitLab personal access token covers all projects you can reach; a project access token from your team covers one project only.
- Set an expiration date, for example the end of the semester.
- Delete the token on the website of your Git host when you no longer need it, or right away if you think someone else saw it. Then create a new one.

## Clone in the terminal

You can also use Git in the terminal, for example `git clone`, `git pull` and `git push`.
The terminal is hidden at the Beginner level: raise the level in the status bar.

To clone into the project folder itself instead of a subfolder, so that the settings and tasks of the repository apply, run in an empty project folder:

```bash
git clone https://github.com/owner/repository.git .
```

Git asks for a username and a password, in the terminal or in a box at the top of the window.
Enter your username, then paste your token as the password.
The token is not shown while you paste it.

Use the `https` address.
EduIDE does not set up SSH keys for you, and keys you create would stay in the session.

## If something goes wrong

| Message or problem | What it means | What to do |
|---|---|---|
| "Could not clone ...: the access was not accepted." | Wrong username or token, or the token does not cover this repository | Check the username. Check that the token is not expired and includes the repository and write access. Create a new token if needed |
| "Authentication failed", or an error with 401 or 403 when you push | Git sent a token that is wrong, expired or lacks write access, or you may only read the repository | Create a token with write access (GitHub: **Contents: Read and write**, GitLab: `write_repository`). Ask the owner for write access, or push to your own fork |
| "Could not clone ...: ... did not accept the access." after a link | Links open public repositories only | Start a standalone session with **Empty project** and use **Clone Repository** with your username and token |
| "Repositories from ... cannot be opened here." | Links work only for hosts your installation trusts | Ask your tutor. Inside the IDE, **Clone Repository** works with other hosts too |
| "The workspace is not empty, so nothing was cloned." | **Clone Repository** clones only into an empty project folder | Start a new session with **Empty project**, or move the files listed in the message away |
| Git asks for the token again | The 3 hours are over, or this is a new session | Paste the token again |
| "Enter an https or http URL" | You pasted an SSH address such as `git@github.com:...` | Use the address that starts with `https://` |

More problems: [Troubleshooting](./troubleshooting.md).
