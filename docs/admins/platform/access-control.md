---
title: Access Control
description: Keycloak client configuration, admin group assignment, and access review procedures for EduIDE.
---

# Access Control

EduIDE uses Keycloak as its identity provider, fronted by an OAuth2 proxy (`oauth2-proxy` v7.12.0). Authentication is not optional — every request to the landing page or IDE session goes through this layer. Admin access is controlled by Keycloak group membership.

This page covers the full Keycloak client setup, the admin group model, and ongoing access review practices.

## How authentication works

1. A user navigates to the EduIDE landing page.
2. The OAuth2 proxy intercepts the request and redirects to Keycloak.
3. The user authenticates in Keycloak.
4. Keycloak issues a token containing the user's `username`, `groups`, and `audience` claims.
5. The OAuth2 proxy validates the token and forwards the request with the user context attached.
6. The EduIDE service reads the `groups` claim to determine whether the user has admin privileges.

The service property `theia.cloud.auth.admin.group` (default: `theia-cloud/admin`) defines which Keycloak group grants admin access.

## Keycloak client setup

Each environment (production, staging, test) requires its own Keycloak client. The steps below apply to each.

### Create the client

1. Log in to the Keycloak admin console.
2. Select the target realm (e.g., `tum`).
3. Navigate to **Clients → Create client**.
4. Set the basic configuration:
   ```
   Client ID:   theia-cloud          (or theia-cloud-staging, theia-cloud-test1, etc.)
   Name:        EduIDE
   ```
5. Click **Next**.

### Configure capability settings

```
Client authentication:  OFF  (public client)
Authorization:          OFF
Standard flow:          ON
Direct access grants:   OFF
Implicit flow:          OFF
```

Click **Next**.

### Configure login settings

Set URLs based on the target environment domain. For production:

```
Root URL:                     https://<landing-host>
Home URL:                     https://<landing-host>
Valid redirect URIs:
  https://<landing-host>/*
  https://service.<landing-host>/*
  https://instance.<landing-host>/*
  https://*.webview.instance.<landing-host>/*
Valid post-logout redirect URIs:  +
Web origins:                  +
```

:::warning All four, not two
An installation serves four hostnames and every one of them takes part in the
login flow. Listing only the landing and instance hosts is a common mistake with
a confusing result: login appears to work, and then **webviews inside the IDE
fail to authenticate** — a failure users hit days later and report as "previews
are broken".

Substitute your own landing host; for an installation at `eduide.example.edu`
the four are `eduide.example.edu`, `service.eduide.example.edu`,
`instance.eduide.example.edu` and `*.webview.instance.eduide.example.edu`.
:::

Repeat this for each installation — one client per installation, because each
has its own hostnames.

Click **Save**.

## Client scope configuration

EduIDE requires three custom token claims. These are added as mappers on a dedicated client scope.

### Create the client scope

1. Go to **Clients → [your-client] → Client scopes**.
2. Click **Add client scope → Create client scope**:
   ```
   Name:                      theia-cloud-dedicated
   Protocol:                  openid-connect
   Display on consent screen: OFF
   Include in token scope:    ON
   ```
3. Open the new scope and go to the **Mappers** tab.

### Username mapper

```
Name:             username
Mapper type:      User Property
Property:         username
Token claim name: username
Claim JSON type:  String
Add to ID token:       ON
Add to access token:   ON
Add to userinfo:       ON
```

This claim is how the EduIDE service identifies the acting user for workspace and session operations.

### Audience mapper

```
Name:                       audience
Mapper type:                Audience
Included client audience:   theia-cloud   (your client ID)
Add to ID token:            ON
Add to access token:        ON
```

Without the audience claim, the service will reject tokens because the expected audience will not be present.

### Groups mapper

```
Name:             groups
Mapper type:      Group Membership
Token claim name: groups
Full group path:  OFF
Add to ID token:       ON
Add to access token:   ON
Add to userinfo:       ON
```

The `groups` claim is what the `AdminOnlyFilter` reads to check for admin group membership.

### Assign the scope to the client

1. Go back to **Clients → [your-client] → Client scopes**.
2. Click **Add client scope**.
3. Select `theia-cloud-dedicated`.
4. Set scope type to **Default**.
5. Click **Add**.

Verify that `theia-cloud-dedicated` appears under **Assigned client scopes** as a default scope.

## Admin group assignment

Admin access is granted by adding a user to the `theia-cloud/admin` group in Keycloak.

### Add a user to the admin group

1. In the Keycloak admin console, go to **Groups**.
2. Expand or locate `theia-cloud/admin`. If it does not exist, create it:
   - Create a top-level group called `theia-cloud`.
   - Inside it, create a subgroup called `admin`.
3. Go to **Users → [username] → Groups**.
4. Click **Join Group** and select `theia-cloud/admin`.

### Remove admin access

1. Go to **Users → [username] → Groups**.
2. Click **Leave** next to `theia-cloud/admin`.

The service reads group membership from the JWT at request time. Access changes take effect on the user's next login or token refresh.

## GitHub environment secrets

The OAuth2 proxy and service require several secrets to be present before deployment. These are stored as GitHub environment secrets and injected during the deployment workflow.

| Secret | Required value |
|---|---|
| `THEIA_KEYCLOAK_AUTH_URL` | Keycloak base URL, e.g. `https://keycloak.ase.in.tum.de/` |
| `THEIA_KEYCLOAK_REALM` | Realm name, e.g. `tum` |
| `THEIA_KEYCLOAK_CLIENT_ID` | Client ID configured above |
| `THEIA_KEYCLOAK_COOKIE_SECRET` | Base64-encoded 32-byte key for cookie encryption |

Generate the cookie secret:
```bash
openssl rand -base64 32
```

## Troubleshooting

### Redirect loop after login

The browser redirects continuously between the application and Keycloak.

Causes and fixes:
- **Incorrect redirect URI** — verify that both the landing page and instance domains are in the client's valid redirect URIs, including the `/*` wildcard suffix
- **Cookie secret mismatch** — confirm `THEIA_KEYCLOAK_COOKIE_SECRET` in GitHub secrets matches what was deployed
- **HTTP/HTTPS mismatch** — all redirect URIs and the environment URL must use HTTPS

### "Invalid client" error in Keycloak

Keycloak rejects the login attempt with "Invalid client".

Causes and fixes:
- `THEIA_KEYCLOAK_CLIENT_ID` does not match the client ID in Keycloak
- The client is disabled — verify it is enabled in the Keycloak admin console
- Wrong realm is configured

### "Access denied" after successful login

The user authenticates in Keycloak but receives an access denied response from EduIDE.

Causes and fixes:
- The `username`, `audience`, or `groups` mapper is missing or misconfigured in the client scope
- The client scope is not assigned as a **Default** scope on the client
- The audience claim does not match the client ID

Use Keycloak's **Evaluate** tab (under the client's Client Scopes section) to inspect what claims are actually issued for a given user before debugging further.

## Access review cadence

| Review type | Frequency | Action |
|---|---|---|
| Admin group membership | Monthly | Remove any users who no longer need elevated access |
| Client redirect URIs | On each environment change | Remove stale redirect URIs for decommissioned environments |
| Keycloak user accounts | Quarterly | Disable accounts for users who have left the organization |
| OAuth2 proxy cookie secret rotation | Every 6 months | Regenerate, update GitHub secret, redeploy |
