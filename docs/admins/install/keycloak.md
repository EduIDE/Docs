---
title: Setting Up Keycloak
description: Step by step with screenshots - the realm, the eduide client, its redirect URIs, the admin role, a group, a user and the token check.
---

# Setting Up Keycloak

EduIDE needs one realm, one client and, for the admin panel, one role.
This page sets them up in the Keycloak admin console, step by step.
The screenshots come from Keycloak 26 with the example hosts of [Installing EduIDE](installing.md): `eduide.example.org` for the landing page and `instance.eduide.example.org` for the sessions.
Replace them with your hosts.

What the deployment takes from Keycloak:

| Keycloak | Value in the installation chart |
|---|---|
| Realm `eduide` | `oidc.issuerURL: https://<keycloak host>/realms/eduide` and the landing page `keycloak.realm` |
| Client `eduide` | `oidc.clientIDs: [eduide]`, `oidc.gatewayClientID: eduide` and the landing page `keycloak.clientId` |
| Client role `eduide-admin` | `oidc.admin: {rolePath: resource_access.eduide.roles, role: eduide-admin}` |

## 1. Create the realm

Use one realm per deployment, or a realm you already have.
Open **Manage realms**, click **Create realm** and enter the name.

![Keycloak Create realm dialog with the realm name eduide](/img/admins/keycloak/create-realm.png)

All further steps happen in this realm.
Check that the realm name next to **Current realm** in the upper left reads `eduide`.

## 2. Create the client

One client serves both the landing page and the gateway in front of the sessions.
Open **Clients** and click **Create client**.

**General settings:** client type OpenID Connect, client ID `eduide`.
The name is only a label.

![Create client, General settings: client type OpenID Connect, client ID eduide, name EduIDE](/img/admins/keycloak/client-general-settings.png)

**Capability config:** leave **Client authentication** off and keep only **Standard flow**.

![Create client, Capability config: Client authentication off, only Standard flow checked](/img/admins/keycloak/client-capability-config.png)

The landing page signs in in the browser and has no secret, so the shared client must be public.
A confidential client rejects the sign-in of the landing page.
The gateway still sends a client secret, because Envoy Gateway requires one.
Keycloak does not check it for a public client, but the Secret `eduide-oidc` must exist with a non-empty `client-secret`.
If you want Keycloak to check the gateway's secret, use a [separate gateway client](#separate-gateway-client).

**Login settings:**

| Field | Value |
|---|---|
| Root URL | `https://eduide.example.org` |
| Valid redirect URIs | `https://eduide.example.org/*` for the landing page, `https://instance.eduide.example.org/oauth2/callback` for the gateway |
| Valid post logout redirect URIs | `https://eduide.example.org/*` |
| Web origins | `https://eduide.example.org` |

![Create client, Login settings: root URL, two valid redirect URIs, post logout redirect URI and web origin for eduide.example.org](/img/admins/keycloak/client-login-settings.png)

The webview host takes no part in the sign-in and needs no entry.
Click **Save**.

## 3. Create the admin role

The admin panel and the admin API are off until a role opens them, see [Admin Access](../security/admin-access.md).
Open the client `eduide`, tab **Roles**, click **Create role** and name it `eduide-admin`.

![Create role on the client eduide with the role name eduide-admin and a description](/img/admins/keycloak/client-role-eduide-admin.png)

A realm role works as well.
It ends up in `realm_access.roles`, and `oidc.admin.rolePath` must say so.

## 4. Give the role to a group

Grant the role to a group, not to single users, so the quarterly [access review](../platform/access-control.md#access-review) has one place to look.
Open **Groups**, click **Create group** and name it, for example `eduide-admins`.

![Create a group dialog with the name eduide-admins](/img/admins/keycloak/create-group.png)

Open the group, tab **Role mapping**, click **Assign role** and choose **Client roles**.
Search for `eduide-admin`, select it and click **Assign**.

![Assign Client roles to eduide-admins: the role eduide-admin of the client eduide is selected](/img/admins/keycloak/group-assign-client-role.png)

The group now carries the role.

![Role mapping tab of the group eduide-admins with the client role eduide-admin](/img/admins/keycloak/group-role-mapping.png)

## 5. Add users

Students and staff usually come from an identity provider or a user federation of the realm.
A local user, for example for a first test, works as well.
Open **Users**, click **Create new user**, fill in username, email, first and last name, and add the admins to the group with **Join Groups**.

![Create user form with the username demo.admin, an example email address, first and last name, and the group eduide-admins](/img/admins/keycloak/create-user.png)

Set a password in the tab **Credentials** of the new user.
The username becomes the owner of the user's sessions and workspaces (claim `preferred_username`, value `oidc.userClaim`).
Do not rename users while they have workspaces.

## 6. Mappers

EduIDE needs no mapper of its own.
The default client scopes of a new client already put everything into the tokens:

| Claim | From the default scope |
|---|---|
| `preferred_username`, `name` | `profile` |
| `email` | `email` |
| `resource_access.eduide.roles` | `roles`, mapper `client roles` |
| `realm_access.roles` | `roles`, mapper `realm roles` |

The mapper `client roles` must add the roles to the access token.
That is its default. Check it under **Client scopes**, `roles`, tab **Mappers**, `client roles`.

![Mapper client roles of the client scope roles: token claim name resource_access.${client_id}.roles, Add to access token on](/img/admins/keycloak/client-roles-mapper.png)

## 7. Check the token

Keycloak shows the tokens of a user without a sign-in.
Open the client `eduide`, tab **Client scopes**, sub tab **Evaluate**, choose the user and open **Generated access token**.

![Generated access token of demo.admin: azp eduide, resource_access.eduide.roles with eduide-admin, preferred_username, name and email](/img/admins/keycloak/evaluate-access-token.png)

Check:

- `azp` is `eduide`. The service accepts only tokens whose `azp` is in `oidc.clientIDs`.
- `resource_access.eduide.roles` contains `eduide-admin` for admins.
- `preferred_username`, `name` and `email` are present.

**Generated ID token** must show `aud` `eduide`. authz checks the ID token of the gateway against `oidc.gatewayClientID`.

## 8. Fill in the values

Store a value for the gateway secret in the namespace, from a file and never on the command line:

```bash
kubectl -n eduide-<deployment> create secret generic eduide-oidc \
  --from-file=client-secret=<path-to-file>
```

Then set the values from the table at the top and continue with [Installing EduIDE](installing.md#3-values).

## Separate gateway client

A second, confidential client for the gateway lets Keycloak check the gateway's secret.
It is optional.

1. Create a client, for example `eduide-gateway`, with **Client authentication** on and only **Standard flow**.
2. Give it the valid redirect URI `https://instance.eduide.example.org/oauth2/callback` and no web origin.
3. Copy the secret from its tab **Credentials** into a file and create `eduide-oidc` from it, as above.
4. Remove the instance redirect URI from the client `eduide`.
5. Set `oidc.gatewayClientID: eduide-gateway`. `oidc.clientIDs` and the landing page keep `eduide`.

The admin role stays on the client `eduide`, because the admin API checks the access token of the landing page.
