---
title: Architecture
description: High-level view of how EduIDE orchestrates browser IDE sessions on Kubernetes.
---

# Architecture

EduIDE runs **browser-based IDE sessions** for many users at once. Each session is an isolated workload in Kubernetes—not a shared long-lived server. The platform’s job is to **start the right IDE for the right user**, expose it at a URL, attach durable storage where needed, and **tear sessions down** when they are no longer wanted.

At the center is **EduIDE Cloud** (Theia Cloud–based): a small **control plane** inside the cluster that turns API calls into running pods, routes, and volumes.

## End-to-end picture

1. A **client** (product UI or integration) calls the **EduIDE Cloud service** to launch or stop sessions.
2. The service writes **Kubernetes custom resources** that describe desired platform state in domain terms (session types, workspaces, live sessions).
3. The **operator** watches those resources and reconciles them into ordinary cluster objects: Deployments/Pods, Services, routing, persistence, and related configuration.
4. The user’s **browser** reaches the IDE through the cluster’s routing layer; access is tied to the session and user identity.

The service does **not** hand-craft Deployments for callers. It records **intent**; the operator owns **how** that intent becomes concrete resources and stays aligned over time.

## Main domain objects

Three ideas cover most of the model:

| Concept | Role |
| --- | --- |
| **App definition** | A **template** for a launchable IDE: image, resources, limits, timeouts, and how routing should treat that session type. |
| **Workspace** | The **durable** side of a user’s work: identity and storage relationship so files survive session restarts. |
| **Session** | The **live** IDE instance bound to a user; compute here is meant to be **replaceable** while the workspace keeps continuity. |

That split—durable workspace vs disposable session—is what lets the platform restart or swap runtime without treating the learner’s whole context as ephemeral.

## Kubernetes as the runtime

The cluster provides **scheduling, isolation, networking, volume attachment, and restarts**. EduIDE relies on that to run **many short-lived, user-specific workloads** safely and to scale with bursts (typical in teaching). Operational concerns—cleanup, observability, capacity—follow from that model rather than from a single monolithic app.

## Routing and access

Each session needs a **reachable URL** that only the right user should use. The operator updates **dynamic routing** (alongside Gateway / ingress setup used in deployments) as sessions appear and disappear. **Authentication** is part of this story: it is wired into **who may open which session**, not only into the launch API.

## Variants you may see in deployments

Installations can tune **how** sessions appear: for example **on-demand** creation when a user launches, or **prewarmed** pools that keep generic IDE instances ready and **personalize** them at runtime to cut perceived startup time. The same architectural split—**API → custom resources → operator → cluster**—applies; only reconciliation strategies and timing differ.

## Summary

**EduIDE** is a **session orchestration** stack on Kubernetes: the **service** exposes a stable API and writes **desired state** as custom resources; the **operator** implements that state with workloads, routing, and storage; **workspaces** keep continuity while **sessions** provide the live IDE. Understanding that pipeline is enough to place the rest of the documentation (API, operator behavior, operations) without memorizing every subcomponent upfront.
