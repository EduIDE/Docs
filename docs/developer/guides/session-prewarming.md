---
title: Session Prewarming
description: How prewarmed sessions work and how to control them in EduIDE Cloud.
---

# Session Prewarming

Session prewarming is the mechanism used to reduce startup latency for browser-based IDE sessions. Instead of creating every session completely on demand, EduIDE Cloud can keep a pool of already running generic instances ready for assignment.

When a user requests a session, the platform can reserve one of these prewarmed instances and complete the remaining session-specific setup dynamically.

## Why Prewarming Exists

The main problem prewarming addresses is startup latency.

In a purely lazy model, every session request has to wait for:

- Kubernetes resources to be created
- containers to start
- routing to become reachable
- session-specific setup to complete

That is often acceptable for small-scale internal systems, but it becomes painful in educational environments where many students start sessions at almost the same time.

Prewarming reduces the waiting time by moving part of the startup work earlier.

## High-Level Model

The platform keeps a pool of generic ready-to-assign instances for an `AppDefinition`.

When a user launches a session:

1. the operator tries to reserve a free prewarmed instance
2. the reserved instance is attached to the requesting session
3. routing and session metadata are updated dynamically
4. user-specific runtime data is injected
5. the session becomes reachable through its assigned URL

If no prewarmed capacity is available, the platform falls back to lazy startup instead of failing the request outright.

## The Two Important Capacity Controls

The most important configuration values are:

- `minInstances`
- `maxInstances`

They do not mean the same thing.

### `minInstances`

`minInstances` controls the prewarmed pool size.

That means:

- how many eager-start instances should be kept ready in advance
- how much capacity can usually be served with low latency

This is the main control surface for prewarming behavior.

### `maxInstances`

`maxInstances` controls the total number of sessions that may exist for an app definition.

That means:

- the upper bound for combined eager and lazy sessions
- the total session capacity limit for that app definition

### Relationship Between Them

The important runtime meaning is:

- sessions within the `minInstances` pool can usually start eagerly
- demand beyond `minInstances` can still be served lazily
- demand beyond `maxInstances` cannot be served at all

So:

- `minInstances` controls warm capacity
- `maxInstances` controls overall capacity

## How the Pool Works

Prewarming is not just "keep some pods running". The pool is managed as a reusable set of prewarmed resources tied to an app definition.

At a high level, the pool logic is responsible for:

- creating missing prewarmed instances
- reconciling the number of warm instances to the configured target
- reserving a free instance when a session is created
- completing session-specific setup after reservation
- releasing the instance after session termination
- resetting the instance so it can return to the pool

This is what turns prewarming from a simple infrastructure trick into a real session-start strategy.

## Why Runtime Injection Is Needed

Prewarmed sessions are generic by design. They exist before the actual user request is known.

That creates a problem: the platform still needs to attach user-specific runtime data after a warm instance has already been started.

This is why runtime injection is part of the architecture:

- prewarmed instances cannot contain all user-specific values up front
- credentials and configuration often need to be attached only after reservation
- the data bridge is used to inject those values into the running IDE container

Without runtime injection, prewarming would be much less useful because the warm instances could not be safely personalized for real users.

## Routing and Prewarming

Prewarming alone does not solve end-to-end startup latency. Even after an instance is reserved, the user still has to wait until routing points to that instance correctly.

This is why the routing layer matters so much:

- session-specific route rules still need to be attached dynamically
- the shared route has to be updated safely under concurrent load
- the session URL only becomes useful once the route is active

In practice, prewarming and fast routing propagation belong together.

## Fallback Behavior

The system does not rely exclusively on prewarming.

If there is no free warm instance available:

- the request can fall back to lazy startup
- the session still has a chance to start successfully
- prewarming improves latency without reducing correctness

This is important operationally because prewarming is an optimization layer, not a separate incompatible mode.

## Where Prewarming Is Configured

At the configuration level, prewarming is tied to `AppDefinition` resources.

The values are exposed through:

- the app definition spec itself
- the admin scaling API for app definitions

The relevant admin API endpoint is:

- `PATCH /service/admin/appdefinition/{appDefinitionName}`

The update request exposes:

- `minInstances`
- `maxInstances`

This is the main control point for changing prewarming behavior at runtime.

## Important Helm Behavior

In the EduIDE deployment setup, live `minInstances` and `maxInstances` values are intentionally preserved across upgrades for existing `AppDefinition` resources.

That means:

- Helm values define the initial state when an app definition is created
- later runtime scaling changes are preserved
- deployment upgrades should not accidentally wipe live prewarming adjustments

This matters because prewarming is meant to be controlled operationally, not reset on every deployment.

## When To Increase `minInstances`

Increase `minInstances` when:

- a course or exam is about to start
- many users are expected to launch the same app definition in a short time window
- startup latency is more important than minimizing idle capacity

Higher `minInstances` means more warm capacity, but also more idle resources held in reserve.

## When To Keep `minInstances` Low

Keep `minInstances` low when:

- the app definition is used infrequently
- cluster resources are tight
- startup latency is less critical than cost or capacity efficiency

There is always a tradeoff between fast startup and reserved resources.

## Operational Rule of Thumb

Think about prewarming as capacity reservation, not as a universal performance switch.

Use it for:

- popular app definitions
- predictable spikes
- teaching scenarios with synchronized launches

Do not treat it as a substitute for:

- enough total capacity
- reasonable `maxInstances`
- healthy routing behavior
- correct runtime personalization

## Summary

Session prewarming keeps a pool of generic ready-to-assign instances for an app definition so users can start faster than with a purely lazy model. The key controls are `minInstances` for warm pool size and `maxInstances` for total capacity. The feature only works well because it is combined with runtime data injection, dynamic routing, and lazy fallback when warm capacity is exhausted.
