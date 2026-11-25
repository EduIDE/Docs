---
title: Course Requirements
description: What should be true before a course seriously considers EduIDE.
---

# Course Requirements

Before adopting EduIDE for a course, a few conditions should be true.

## Good prerequisites

- the course has a defined toolchain
- exercise setups can be standardized
- browser-based development is acceptable for the course format
- staff are willing to work with a managed shared environment
- the course team can run a realistic pilot before broad rollout

## Artemis

If the course already uses Artemis, or is evaluating Artemis seriously, that is a good fit for EduIDE.

EduIDE integrates with Artemis through its Artemis and Scorpio extensions, which makes the workflow more coherent than combining Artemis with a disconnected IDE.
Artemis must pass the repository and token to EduIDE. That needs Artemis pull request #14702, which is not yet merged upstream.

This does not automatically mean the course should adopt EduIDE, but it does mean the platform fit is usually stronger in Artemis-centered teaching environments than in unrelated LMS setups.

## Questions instructors should answer

- Which languages and tools are required?
- Which exercises need persistence between sessions? Temporary sessions lose their files at the end of a session, so ask the admins which templates offer saved workspaces.
- How important is local IDE freedom?
- Do students need access to capabilities that a managed environment may restrict?
- Is the course willing to adapt some workflows to gain consistency?
