---
title: Access Control
description: Keycloak client configuration, admin group assignment, and access review procedures for EduIDE.
---

# Access Control

EduIDE uses Keycloak as its identity provider. The landing page signs users in with the public Keycloak client directly, and every IDE session sits behind its own `oauth2-proxy` sidecar (v7.12.0), which forces the Keycloak login. Admin access is controlled by Keycloak group membership. An installation without Keycloak (`keycloak.enable: false`) needs `keycloak.allowUnauthenticated: true`, and is only for throwaway environments, because there the `user` of a request is the identity.

This page covers the full Keycloak client setup, the admin group model, and ongoing access review practices.

## How authentication works

1. A user navigates to the EduIDE landing page, which redirects to Keycloak with the public client.
2. The user authenticates in Keycloak.
3. Keycloak issues a token containing the user's `email`, `groups` and, if you set `keycloak.audience`, `aud` claims.
4. The landing page calls the REST service with the access token. The service takes the user's identity from the `email` claim. A token without it counts as anonymous.
5. A session's `oauth2-proxy` sidecar runs its own login against the same client before it lets the user reach the IDE.
6. The service reads the `groups` claim to determine whether the user has admin privileges.

The chart value `keycloak.adminGroup` (default: `theia-cloud/admin`, passed as `KEYCLOAK_ADMIN_GROUP`) defines which Keycloak group grants admin access. The service compares it exactly with the entries of the `groups` claim.

## Keycloak client setup

Clients can be shared. The TUM installations use one client, `eduide`, for several hostnames, so add every installation's redirect URIs to it. A separate client per installation is possible too. All Keycloak settings (`keycloak.authUrl`, `realm`, `clientId`, `adminGroup`, `audience`) live in the installation's `values.yaml`. The deploy workflow reads only `KUBECONFIG`, `THEIA_KEYCLOAK_COOKIE_SECRET` and `THEIA_ADMIN_API_TOKEN` from GitHub secrets.

### Create the client

1. Log in to the Keycloak admin console.
2. Select the target realm (e.g., `tum`).
3. Navigate to **Clients → Create client**.
4. Set the basic configuration:
   ```
   Client ID:   eduide               (the value of keycloak.clientId)
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
Root URL:                         https://<landing-host>
Home URL:                         https://<landing-host>
Valid redirect URIs:
  https://<landing-host>/*
  https://instance.<landing-host>/*
Valid post logout redirect URIs:
  https://<landing-host>/
  https://<landing-host>/*
Web origins:
  https://<landing-host>
  https://instance.<landing-host>
```

Every entry carries the `https://` scheme. The redirect URIs and web origins
cover **two** hosts, the landing page and the instance host; the post-logout
entries cover the landing host only, and need both the bare `/` and the `/*`
form.

For an installation at `eduide.example.edu` that is:

| Setting | Values |
|---|---|
| Valid redirect URIs | `https://eduide.example.edu/*`<br/>`https://instance.eduide.example.edu/*` |
| Valid post logout redirect URIs | `https://eduide.example.edu/`<br/>`https://eduide.example.edu/*` |
| Web origins | `https://eduide.example.edu`<br/>`https://instance.eduide.example.edu` |

:::note The service and webview hosts are deliberately absent
An installation serves four hostnames, but only two of them appear here. The
REST service host and the `*.webview.instance.` wildcard do not take part in the
browser redirect flow, so adding them is unnecessary. Do not "fix" this list by
padding it out to four.

Four hostnames **is** the right number for DNS and for certificates - see
[Certificates and DNS](../install/certificates.md). Only the Keycloak client is
different.
:::

Repeat this for each installation. Check first whether the client already
exists. Installations on the same Keycloak server and realm with the same
`clientId` share **one** client. If it exists, skip the creation steps above and
append the installation's two hostnames to the lists of the existing client.
Create a new client only when none exists yet. At TUM, for example, the four test installations
share one client, and Bonn and Mannheim share another. Editing a shared client
edits it for everyone on it, and a removed or mistyped entry breaks their login
too. Copy the current lists first, add rather than replace, and log in to an
installation that already worked right after you save. Give an installation a
client of its own only as a deliberate decision: change `keycloak.clientId` in
its values and create that client.

Click **Save**.

## Client scope configuration

EduIDE requires three custom token claims. These are added as mappers on a dedicated client scope.

### Create the client scope

1. Go to **Clients → [your-client] → Client scopes**.
2. Click **Add client scope → Create client scope**:
   ```
   Name:                      eduide-dedicated
   Protocol:                  openid-connect
   Display on consent screen: OFF
   Include in token scope:    ON
   ```
3. Open the new scope and go to the **Mappers** tab.

### Email claim

The service identifies a user by the `email` claim, so the client must put it into the access token (Keycloak's default `email` scope does). The service rejects an email with unusual characters with a 403.

### Username mapper (optional)

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

The service identifies the acting user by the `email` claim, not by `username`. The `username` mapper is optional.

### Audience mapper

```
Name:                       audience
Mapper type:                Audience
Included client audience:   eduide        (the value of keycloak.audience, usually your client ID)
Add to ID token:            ON
Add to access token:        ON
```

The service checks the audience only when `keycloak.audience` is set in the `eduide` chart (EduIDE-Cloud 3.0). It then requires that value in the `aud` claim of every access token and rejects tokens without it. Add this mapper to the client before you set `keycloak.audience`, or logins fail. Empty, the default, skips the check.

### Groups mapper

```
Name:             groups
Mapper type:      Group Membership
Token claim name: groups
Full group path:  ON
Add to ID token:       ON
Add to access token:   ON
Add to userinfo:       ON
```

The `groups` claim is what the `AdminOnlyFilter` reads to check for admin group membership. The service compares `keycloak.adminGroup` exactly with the entries of this claim. With **Full group path** OFF the claim holds the bare name (`admin`), so then set `keycloak.adminGroup: admin`. With it ON the claim holds the full path, and the default `theia-cloud/admin` matches a group `admin` inside the group `theia-cloud`. Check what a token really carries before you rely on it.

### Assign the scope to the client

1. Go back to **Clients → [your-client] → Client scopes**.
2. Click **Add client scope**.
3. Select `eduide-dedicated`.
4. Set scope type to **Default**.
5. Click **Add**.

Verify that `eduide-dedicated` appears under **Assigned client scopes** as a default scope.

## Identity provider certificate

From EduIDE-Cloud 3.0 the service always verifies the TLS certificate of Keycloak. Before, it skipped the check. A Keycloak whose certificate comes from a private CA needs the CA in a trust store, passed to the chart as `service.oidcTrustStore`. Without it the service cannot validate tokens and every login fails.

## Operator and secrets

The `eduide` chart gives the operator a namespaced Role, `operator-bridge-token-secrets`, with `get`, `create`, `update` and `delete` on `secrets` in the installation namespace (no `list`, no `watch`). The operator keeps the data bridge tokens of the sessions there, see [Data bridge token](app-definitions.md#data-bridge-token). An installation with its own RBAC instead of the chart's must grant the same verbs.

The `eduide-cluster` chart gives the operator `create`, `get` and `delete` on `networkpolicies`, for the per-session NetworkPolicy of sidecars. Upgrade the cluster chart first, see [Upgrades](../maintenance/upgrades.md#order-of-the-upgrade).

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

The deploy workflow reads the cookie secret (and the admin API token) from GitHub secrets. The Keycloak URL, realm and client ID are chart values in the installation's `values.yaml`, not secrets.

| Secret | Required value |
|---|---|
| `THEIA_KEYCLOAK_COOKIE_SECRET` | Base64-encoded 32-byte key for cookie encryption |

## OAuth2 proxy cookie secret

oauth2-proxy encrypts its session cookie with `keycloak.cookieSecret`. From
chart 2.5.1 the chart has no default for it and refuses to render without one,
because a shared default would let anyone who knows it forge cookies for every
installation that kept it. Use a different value per installation.

Generate one:
```bash
openssl rand -base64 32 | tr -- '+/' '-_'
```

The cookie is sent over HTTPS only (`oauth2Proxy.cookieSecure: true`, the
default). Set it to `false` only for an installation served over plain HTTP,
where the browser would otherwise drop the cookie and login never completes.

## Troubleshooting

### Redirect loop after login

The browser redirects continuously between the application and Keycloak.

Causes and fixes:
- **Incorrect redirect URI** - verify that the landing page and instance hosts are both in the client's valid redirect URIs, each with the `/*` suffix, and that the web origins list both hosts without a suffix
- **Cookie secret mismatch** - confirm `THEIA_KEYCLOAK_COOKIE_SECRET` in GitHub secrets matches what was deployed
- **HTTP/HTTPS mismatch** - the redirect URIs and the environment URL must use the scheme the installation is served on, which is HTTPS for every normal installation. An installation served over plain HTTP uses `http://` throughout and also needs `oauth2Proxy.cookieSecure: false`

### "Invalid redirect uri" when logging out

Keycloak rejects any redirect URI that contains a fragment. Landing page
versions before EduIDE-Landing-Page#64 passed the `#state=...&code=...` fragment
Keycloak adds after a login on as the post-logout redirect, so every logout
ended on "Invalid redirect uri", whatever wildcards the client had. Update the
landing page image; the client configuration needs no change. The query string
(`gitUri`, `artemisToken`) is kept.

### "Invalid client" error in Keycloak

Keycloak rejects the login attempt with "Invalid client".

Causes and fixes:
- `keycloak.clientId` does not match the client ID in Keycloak
- The client is disabled - verify it is enabled in the Keycloak admin console
- Wrong realm is configured

### "Access denied" after successful login

The user authenticates in Keycloak but receives an access denied response from EduIDE.

Causes and fixes:
- The `email`, `audience` or `groups` mapper is missing or misconfigured in the client scope
- The client scope is not assigned as a **Default** scope on the client
- The `aud` claim does not match `keycloak.audience`

Use Keycloak's **Evaluate** tab (under the client's Client Scopes section) to inspect what claims are actually issued for a given user before debugging further.

## Access review cadence

| Review type | Frequency | Action |
|---|---|---|
| Admin group membership | Monthly | Remove any users who no longer need elevated access |
| Client redirect URIs | On each environment change | Remove stale redirect URIs for decommissioned environments |
| Keycloak user accounts | Quarterly | Disable accounts for users who have left the organization |
| OAuth2 proxy cookie secret rotation | Every 6 months | Regenerate, update GitHub secret, redeploy |
