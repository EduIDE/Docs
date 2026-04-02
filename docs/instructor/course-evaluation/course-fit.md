---
title: Evaluating Course Fit
description: Which types of courses are a good fit for EduIDE.
---

# Evaluating Course Fit

EduIDE is most useful for courses where the browser-based environment is part of the teaching value, not just a deployment detail.

## Strong fit

EduIDE is usually a strong fit when:

- students struggle with local setup and environment drift
- many learners need a consistent toolchain
- exercises depend on non-trivial tooling that is hard to install locally
- course staff want a predictable environment during labs, tutorials, or exams
- fast onboarding matters more than local IDE freedom
- the course already uses or seriously evaluates Artemis as its learning management system

## Artemis integration

EduIDE integrates particularly well with the Artemis learning management system through the Scorpio extension.

That matters because it reduces the distance between the course platform and the coding environment. If Artemis is already part of the course setup, or is itself under evaluation, EduIDE becomes a much more natural fit than a generic IDE because the surrounding teaching workflow is already aligned with the intended ecosystem.

In practice, this makes EduIDE especially attractive for courses that want:

- a tighter connection between exercises and the IDE
- less friction between platform workflow and coding workflow
- an environment designed for the Artemis-centered teaching model

## Mixed fit

EduIDE may still work, but should be evaluated carefully, when:

- students are expected to use custom local tools extensively
- advanced hardware access is part of the course
- offline work is common
- the course relies on highly specialized desktop integrations

## Weak fit

EduIDE is usually a weak fit when:

- local-first workflows are a core learning objective
- students need unrestricted machine-level access
- the course depends heavily on native GUI tooling
- the teaching concept assumes continuous offline availability

## Main question for instructors

The key question is not "can EduIDE run our code?" but "does a managed browser IDE improve the course experience enough to justify the platform constraints?"
