---
title: What Lecturers Can Choose
description: The choices a lecturer has in EduIDE 3.0.0, and which ones the platform team makes.
---

# What Lecturers Can Choose

Some choices are yours. Others the platform team makes in the installation. Ask early.

## Templates: listed or unlisted

A template is one environment: a language image with its settings.

- **Listed** templates appear as a tile on the start page. Use them for practice and open courses.
- **Unlisted** templates have no tile. Students reach them only from an Artemis link. The Artemis editions are usually unlisted.

## Saved or temporary workspace

Each template allows a workspace mode.
A saved workspace is kept after the session ends, a temporary one is not.
Choose saved workspaces for multi-day work and temporary ones for short labs and exams where nothing should remain.

## Retention

A saved workspace is deleted a number of days after its last use.
The default is 14 days, and a template can set its own value.
Pick a value that covers the gaps in your course, for example a term break.
The platform shows the deletion date to students and warns them 3 days before.

## Warm pools for lab starts

A warm pool keeps idle sessions ready, so the first students start almost at once.
Pools apply to sessions without a saved workspace.
Sessions with a saved workspace always start cold, which takes longer.
Tell the platform team the time and the number of students before a lab, so they can raise the pool for that day.

## Artemis links

Artemis opens the start page with the template name and passes the access token and the repository URL in the URL fragment (after `#`), so they stay out of server logs and the browser history.
The query holds only non-secret values such as the template, the title and the Artemis URL.
This needs Artemis pull request #14702, which is not yet merged upstream.
The repository host must be on the installation's list of trusted hosts, or the launch fails with an error that names the host.
Older links that carry the token or a repository URL with credentials in the query still work during the migration, but they are deprecated.

## Starting level

Put `.vscode/eduide.json` into the exercise template to set the starting experience level.
See [Customizable Features](../course-evaluation/customizable-features.md).

## What you cannot choose

- The set of languages is fixed by the published images. A university can build its own image from an edition image. Ask the platform team.
- Timeouts and the number of running environments per student are platform settings.

Platform teams find the settings in the [administrator guide](/admins/platform/templates-and-pools).
