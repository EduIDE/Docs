---
title: Access Control
description: Identity provider setup with generic OIDC, Keycloak as the worked example, and the admin role.
---

# Access Control

EduIDE authenticates with any OIDC provider that issues signed tokens and publishes a discovery document. Keycloak is the example here.
Users are not stored in EduIDE. The identity comes from the token, and every session and workspace has exactly one owner.

## Who may do what

| Who | May |
|---|---|
| Any signed-in user | Start sessions from listed templates and from Artemis links, resume and delete their own sessions and workspaces |
| The owner of a session | Open its URL. Everyone else gets 403 |
| A user with the admin role | Read the admin panel and the admin API. Read-only |
| Cluster admins | Everything in Kubernetes. EduIDE adds no second admin layer |

## Two OIDC clients per deployment

| Client | Type | Purpose |
|---|---|---|
| Landing page (for example `eduide`) | public, standard flow | Sign-in of the landing page, tokens for `/api/v1`. In `oidc.clientIDs` |
| Gateway (for example `eduide-gateway`) | confidential | Sign-in at the gateway for session URLs. `oidc.gatewayClientID`, with a secret in the namespace |

Redirect URIs and the secret are in [Installing EduIDE](../install/installing.md#keycloak).
The claim in `oidc.userClaim` (default `preferred_username`) is the owner name. If it differs from what a user sees in the identity provider, sessions show 403 for their owner, see the [authz runbook](../operations/incident-response.md#authz-errors).

## Admin role

The admin API is off until you configure a role. Without it every admin route answers 404. With it, users without the role get 403.

1. Create the role in Keycloak. Realm role: Realm roles, Create role, name `eduide-admin`. Client role: Clients, the landing page client, Roles, Create role, name `eduide-admin`.
2. Assign it to users, or to a group and add users to the group.
3. Make it appear in the access token. A realm role is in `realm_access.roles` by default. A client role is in `resource_access.<client>.roles` once the client scope `roles` is assigned to the landing page client with the "client roles" mapper enabled for access tokens. Decode a token to check.
4. Set it in the values:

```yaml
eduide-control-plane:
  config:
    oidc:
      admin: {rolePath: resource_access.eduide.roles, role: eduide-admin}
```

`rolePath` is exactly `realm_access.roles` or `resource_access.<client>.roles`. Anything else (for example `groups`) stops the service at start.
More in [Admin Access](../security/admin-access.md).

## Access review

Every quarter:

1. List the users with the admin role in Keycloak and remove those who left.
2. Check that only the two clients exist and their redirect URIs are exact.
3. Check who has `kubectl` rights in the namespace. They can read launch data Secrets and instance tokens.
4. Check the `allowedHosts` list ([Templates and Pools](templates-and-pools.md)).
