---
title: Limitations
description: Limitations instructors should understand before committing to EduIDE.
---

# Limitations

EduIDE has real advantages and real constraints.

## Limitations instructors should expect

- It is not a replacement for every local development workflow.
- Some native or specialized tooling does not fit.
- A browser IDE depends on the network and on the platform. Outages affect the whole course.
- The environment is managed, so unrestricted machine access is not the default.
- Sessions stop after 60 minutes without input (the default), and temporary workspaces lose their files then.
- Saved workspaces are deleted after a number of days without use (14 by default). They are not a backup.
- Sessions with a saved workspace always start cold, so they start more slowly than a warm start.
- The experience level resets to the starting level in every new session. `.vscode/eduide.json` sets the starting level, and students pick another level again.
- The automatic clone from Artemis needs Artemis pull request #14702, which is not yet merged upstream.
- The platform is new in 3.0.0 and still in active development, so expect bugs.
- Capacity is finite. Large starts need planning.

## Teaching implications

- Students must push before a long break, because a temporary workspace keeps nothing.
- Some assignments may need adaptation.
- Some students prefer local tools and will not be satisfied.
- Operational incidents affect the course more than in a local-only setup.
- An evaluation must include support and fallback planning, not only a feature review.
