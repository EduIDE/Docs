---
title: Setting Up Keycloak
description: An import file for the quick way, and step by step with screenshots - the realm, the eduide client, its redirect URIs, the admin role, a group, a user, lean token mappers and the token check.
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

## Quick setup with an import file

If you do not want to click through steps 2 to 4 and 6, import the client instead.
[eduide-keycloak-import.json](./eduide-keycloak-import.json) holds the client `eduide` with its redirect URIs and mappers, the role `eduide-admin` and the group `eduide-admins` with that role.

1. Create the realm ([step 1](#1-create-the-realm)).
2. Download the file and replace `eduide.example.org` and `instance.eduide.example.org` with your hosts.
3. Open **Realm settings**, **Action**, **Partial import** and choose the file. Keep all three resources and **Fail import**.

![Partial import dialog with the import file loaded: 1 group, 1 client and 1 client role selected, Fail import if a resource exists](/img/admins/keycloak/partial-import.png)

4. Click **Import**. Keycloak lists the three added records.

![Partial import result: client role eduide-admin, client eduide and group eduide-admins added](/img/admins/keycloak/partial-import-result.png)

Then continue with [users](#5-add-users), [the token check](#7-check-the-token) and [the values](#8-fill-in-the-values).

:::warning Shared client
Several installations can share one client in one realm.
Do not import over an existing client with **Overwrite**: it replaces the client, and the other installations lose their redirect URIs.
Add your hosts to the existing client by hand instead.
:::

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
With the [mappers on the client](#6-mappers-on-the-client) it then needs a mapper of the type User Realm Role instead of User Client Role.

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

## 6. Mappers on the client

EduIDE reads only a few claims.
Put them into the dedicated scope of the client and drop the realm-wide default scopes, so the tokens stay small:

| Token | Claims EduIDE reads |
|---|---|
| Access token (landing page, `/api/v1`) | `azp`, `preferred_username`, `name`, `email`, `resource_access.eduide.roles` |
| ID token (landing page, gateway cookie `eduide-id`) | `aud`, `preferred_username`, `email` |

Open the client `eduide`, tab **Client scopes**, and the scope `eduide-dedicated`.
Click **Configure a new mapper** (later **Add mapper**, **By configuration**) and create four mappers:

| Mapper type | Name | Settings | ID token | Access token | Userinfo |
|---|---|---|---|---|---|
| User Property | `username` | Property `username`, token claim name `preferred_username` | On | On | Off |
| User Property | `email` | Property `email`, token claim name `email` | On | On | Off |
| User's full name | `full name` | - | Off | On | Off |
| User Client Role | `client roles` | Client ID `eduide`, multivalued, token claim name `resource_access.${client_id}.roles` | Off | On | Off |

![Mapper username of the type User Property: property username, token claim name preferred_username, ID token and access token on, userinfo off](/img/admins/keycloak/mapper-username.png)

![Mapper client roles of the type User Client Role: client ID eduide, multivalued, token claim name for the client roles under resource_access, only the access token on](/img/admins/keycloak/mapper-client-roles.png)

**Add predefined mapper** (later **Add mapper**, **From predefined mappers**) is a shortcut.
Select `username`, `email`, `full name` and `client roles` and click **Add**.
Then open `client roles` and set **Client ID** to `eduide`. Without it the roles of every client, for example `account`, land in the token.
The predefined mappers also fill the userinfo and put `name` into the ID token. That costs a few bytes and does no harm.

The dedicated scope then holds the four mappers.

![Mappers tab of eduide-dedicated with full name, email, username and client roles](/img/admins/keycloak/dedicated-mappers.png)

Back in the tab **Client scopes** of the client, change the assigned scopes:

| Scope | Assigned type | Why |
|---|---|---|
| `basic` | Default | Adds `sub`. Keycloak needs it. |
| `profile`, `email` | Optional | The gateway asks for `openid profile email`. Without the two scopes Keycloak refuses its sign-in with `invalid_scope`. As optional scopes they reach only the gateway's tokens. |
| `acr`, `roles`, `web-origins` | Remove | The mappers above replace `roles`. Keycloak answers CORS from the web origins of the client, not from `web-origins`. |

Leave the other optional scopes alone. Nobody asks for them.

![Client scopes of eduide: eduide-dedicated, basic as Default, email and profile as Optional, no acr, roles or web-origins](/img/admins/keycloak/client-scopes-lean.png)

On a local Keycloak 26 this shrinks the access token of the landing page from about 1400 to 1000 bytes for a user with one role.
Users with many roles gain more, because only the roles of `eduide` remain.

If you skip this step, the default scopes add the same claims and EduIDE works as well.
The admin role then sits in `resource_access.eduide.roles` through the scope `roles`.

## 7. Check the token

Keycloak shows the tokens of a user without a sign-in.
Open the client `eduide`, tab **Client scopes**, sub tab **Evaluate**, choose the user and open **Generated access token**.

![Generated access token of demo.admin with only sub, azp eduide, resource_access.eduide.roles with eduide-admin, name, preferred_username and email](/img/admins/keycloak/evaluate-access-token.png)

Check:

- `azp` is `eduide`. The service accepts only tokens whose `azp` is in `oidc.clientIDs`.
- `resource_access.eduide.roles` contains `eduide-admin` for admins.
- `preferred_username`, `name` and `email` are present.

**Generated ID token** must show `aud` `eduide`, `preferred_username` and `email`. authz checks the ID token of the gateway against `oidc.gatewayClientID` and reads the owner from it.

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

1. Create a client, for example `eduide-gateway`, with **Client authentication** on and only **Standard flow**. For small tokens give it the mappers `username` and `email` and the same scope setup as `eduide`.
2. Give it the valid redirect URI `https://instance.eduide.example.org/oauth2/callback` and no web origin.
3. Copy the secret from its tab **Credentials** into a file and create `eduide-oidc` from it, as above.
4. Remove the redirect URI of the instance host from the client `eduide`.
5. Set `oidc.gatewayClientID: eduide-gateway`. `oidc.clientIDs` and the landing page keep `eduide`.

The admin role stays on the client `eduide`, because the admin API checks the access token of the landing page.
