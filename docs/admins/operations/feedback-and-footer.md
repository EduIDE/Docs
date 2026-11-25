---
title: Feedback and Footer Links
description: Footer links of the start page, and the optional feedback dialog in the IDE.
---

# Feedback and Footer Links

Students report problems through links and, if you turn it on, through a dialog in the IDE.
All reports end up in the public tracker `EduIDE/EduIDE`. See [Get Help](/student/learning/get-help) for the student side.

## Footer links

The footer of the start page has defaults:

| Link | Default |
|---|---|
| Report a bug | The bug report form of `EduIDE/EduIDE`, with the installation (the hostname) and the version filled in |
| Request a feature | The feature request form of `EduIDE/EduIDE`, filled in the same way |

A `footerLinks` entry in the landing page config overrides a default.
Use it if your installation has its own tracker or contact page.

## Feedback dialog in the IDE

The dialog is off by default. Without it, **Help -> Report Issue** opens the prefilled bug form on GitHub.
Turn it on with `config.feedback` in the `eduide-control-plane` chart:

```yaml
eduide-control-plane:
  config:
    feedback:
      enabled: true
      receiverURL: https://feedback.example.org
      keySecret: {name: eduide-feedback-key, key: key}
```

| Value | Meaning |
|---|---|
| `enabled` | Default `false`. |
| `receiverURL` | The central receiver that creates the issues. |
| `keySecret` | Secret with the key of your installation. Only the service pod reads it. |

The chart does not render if `enabled` is `true` and `receiverURL` or `keySecret.name` is missing.

### What it changes

- The service answers on `/api/v1/feedback`. With the toggle off, this route answers 404.
- The operator gives the agent in new session pods the feedback address. Running sessions do not change.
- The agent accepts feedback on its loopback interface and passes it to the service.
- The IDE shows **Help -> Send Feedback**, the command and the status bar item.

### The central receiver

The receiver runs only at TUM.
Installations do not run their own. Ask the EduIDE maintainers for the `receiverURL` and the key of your installation.
The receiver creates the issues in a private triage repository. Maintainers move useful ones to `EduIDE/EduIDE`.

### Privacy

- No identity leaves your installation. The service uses the session owner only to rate limit, and sends neither name nor user id.
- The context is the installation hostname, version, app definition and browser. Never the URL, the session id or code.
- The service removes tokens, e-mail addresses and matriculation numbers from the text.
- Each user can send 5 messages per hour. More get `429`.
- The service logs no text and no user, only the pseudonymous id that appears in traces.

Tell your users about the dialog in your privacy notice.
