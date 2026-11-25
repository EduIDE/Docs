---
title: Git Accounts
description: Register the OAuth applications, configure the providers, verify the rollout and operate Git accounts for GitHub and GitLab.
---

# Git Accounts

With Git accounts, a student connects a GitHub or GitLab account once and then clones and pushes private repositories in every session.
The token stays in the control plane and never enters the IDE pod.
Git in a session reaches the provider through a proxy that adds the token.
You configure the providers, register one OAuth application per provider and keep the client secrets in Kubernetes Secrets.

:::info Available from the EduIDE release that ships Git accounts
Git accounts are part of [EduIDE-control-plane pull request 33](https://github.com/EduIDE/EduIDE-control-plane/pull/33), which is not merged or released.
Everything on this page applies from the release that contains it. Use a chart version from that release or later.
Older releases have none of these values, and the manual access token way of the students keeps working there.
:::

## How it fits together

- A **provider** is a Git host with its own OAuth application: GitHub (`github.com` or a GitHub Enterprise Server) or a GitLab instance. You can configure any number of GitLab instances.
- No provider means the feature is off. The chart then renders nothing for it and behaviour does not change.
- Students connect on the landing page. The Git host redirects the browser back to the landing page, which hands the result to the service with the student's own login.
- The service stores one encrypted Secret per student and provider.
- The `git-proxy` is a separate Deployment. Session pods reach it through the agent. It asks the service what is allowed and forwards Git traffic to the provider over HTTPS.
- The account is used only for the repository the session was started with and for repositories the student approved for that session. Everything else is read anonymously.

## Prerequisites

- An EduIDE chart version with Git accounts, and IDE images from the same EduIDE release. The images must carry `eduide-session` 0.2.0 or later and Scorpio 3.5.0 or later. The release that ships Git accounts includes both. Without them, Git in a session does not reach the proxy.
- Two Keycloak clients, one for the gateway and one for the landing page. This is a security requirement, see [Two Keycloak clients](#two-keycloak-clients).
- The landing page is served on `hosts.service`. The redirect of the OAuth flow ends on `https://<hosts.service>/git/callback`, which is a route of the landing page. Only `/api/` on that host may route to the service.
- A CNI that enforces NetworkPolicies. The proxy and the internal port of the service rely on them, see [Session Hardening](../security/session-hardening.md).
- Outbound HTTPS from the cluster to each provider host: from the service (OAuth, account lookup, preflight) and from the `git-proxy` (Git traffic). The default egress of the `git-proxy` allows DNS, the internal port of the service and HTTPS to the internet without private and link-local ranges.
- For a provider on a private address (a GitLab inside your network), add an egress rule with `networkPolicy.gitProxyEgressExtra`, see [Values](#values).
- Permission to register OAuth applications at each provider as an owner of an organisation or group.

Throughout this page, `<eduide-host>` is the value of `hosts.service` and `<ns>` is the namespace `eduide-<deployment>`.

## Two Keycloak clients

Git accounts need an identity provider with **two clients**:

| Client | Value in the chart | Type | Redirect URIs |
|---|---|---|---|
| Gateway | `oidc.gatewayClientID` | Confidential, standard flow only | Exact URIs on the instance host and the webview host, with no wildcard: `https://<instance host>/oauth2/callback` and `https://<webview host>/oauth2/callback` |
| Landing page and API | `oidc.clientIDs` | Public, standard flow only, PKCE method `S256` required | On the service host only (`https://<service host>/*`). None on the instance or webview host |

Rules for both clients: direct access grants, implicit flow and service accounts are off, and the web origins are only the client's own hosts.
Never list the gateway client in `oidc.clientIDs`.

Why, in plain words: the API trusts a token from a client in `oidc.clientIDs` as the student.
With Git accounts, that includes the approval of repositories: whoever holds such a token can allow a repository for a session.
Script that runs in the IDE, for example a build script or any program a student runs, runs on the instance host or the webview host.
If the gateway and the landing page share one public client, that script can start its own login with Keycloak, because the shared client has a redirect URI on its own address and no secret.
It reads the code from the redirect, exchanges it for a token and calls the API as the student.
It could then approve other private repositories for itself.
With two clients, this fails twice. The gateway client is confidential, so a code exchange needs its secret, and only the gateway holds it. The landing page client has no redirect URI on the IDE hosts, so the script cannot read its code. The API also rejects the ID token of the gateway client, because the API accepts tokens of `oidc.clientIDs` only.

A shared client is the simple setup that some pages of this guide describe.
Do not use it when you enable Git accounts.
The Keycloak guide on this site describes a shared client as possible until its update lands. Git accounts need the two-client setup.
To split an existing installation, create the confidential gateway client in the realm, store its secret in the Secret that `oidc.clientSecretName` names, set `oidc.gatewayClientID` to its id and roll out.
Then remove the redirect URIs on the instance host and the webview host, and the web origins of those hosts, from the existing public client. Otherwise script in a session can still get a token that the API accepts. The landing page client and `oidc.clientIDs` stay as they are.
Keycloak setup is in the [Keycloak guide](../install/keycloak.md).

## Step 1: GitHub

Register one OAuth App for the installation, owned by an organisation, not by a personal account.
An app owned by a person stops working when that person leaves.

1. As an owner of the organisation, open the organisation on GitHub: **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Fill in the fields:

   | Field | Value |
   |---|---|
   | Application name | The name students see on the consent screen, for example `EduIDE (<your institution>)` |
   | Homepage URL | `https://<eduide-host>` |
   | Application description | Optional. Say what EduIDE does with the account. |
   | Authorization callback URL | `https://<eduide-host>/git/callback`, exactly |
   | Enable Device Flow | Off |

3. Register the application.
4. Copy the **Client ID**. It goes into the values.
5. Click **Generate a new client secret** and copy it once. Put it into a Secret as described in [Step 3](#step-3-put-the-credentials-into-the-cluster). Do not paste it anywhere else.

Why one app per installation: a GitHub OAuth App has one callback URL, and the callback URL contains the host of the installation.
A second installation needs its own app.

GitHub shows students the permission `repo`, full control of private repositories.
GitHub OAuth Apps have no narrower scope for private repositories.
EduIDE limits the effect in other ways, see [Security summary](#security-summary).

:::note Organisations that restrict OAuth apps
If the organisation that owns a repository restricts third-party OAuth applications, an owner of that organisation must approve the app before students can reach its private repositories.
Students see "not found, or your GitHub account has no access" until then.
:::

For a GitHub Enterprise Server, register the OAuth App on that server and configure a provider with `type: github` and that host.
EduIDE then has no no-reply commit address for it and uses the name and e-mail of the identity provider for commits.

## Step 2: GitLab

Register one application per GitLab instance. Each instance needs its own application and its own provider entry.
This holds for gitlab.com and for every self-managed instance.

1. Open the application form at the level that suits you:
   - a group: **Group > Settings > Applications** (recommended, owned by a group)
   - the whole instance: **Admin area > Applications** (self-managed, needs an administrator)
2. Fill in the fields:

   | Field | Value |
   |---|---|
   | Name | The name students see, for example `EduIDE (<your institution>)` |
   | Redirect URI | `https://<eduide-host>/git/callback`, exactly |
   | Confidential | Yes |
   | Scopes | `read_repository`, `write_repository`, `read_user`. No others. |

3. Save. Copy the **Application ID** (the client ID) and the **Secret** once.
4. Put the secret into a Secret as described in [Step 3](#step-3-put-the-credentials-into-the-cluster).

EduIDE asks for exactly these scopes: read and write of repositories over Git (not the API) and the basic profile that gives the login, id and name.
GitLab access tokens expire after two hours and EduIDE refreshes them. Every refresh replaces the refresh token.

A self-managed instance with a certificate from a private CA needs the CA bundle, see [Step 3](#a-private-ca).

## Step 3: Put the credentials into the cluster

Create the Secrets in the namespace of the deployment before you roll out the values.
Never put a client secret or the encryption key into a values file, into `--set` or into shell history.
Installations deployed through [EduIDE Deployment](/developer/projects/eduide-deployment) keep secrets out of values files in the same way: the deploy creates them from protected secrets of its pipeline, not from the repository.

### Client secrets

Create one Secret per provider, so that each secret has its own life cycle.
The command asks for the secret without showing it, and nothing lands in your history:

```bash
read -rs -p "Client secret: " SECRET; echo
printf %s "$SECRET" | kubectl -n <ns> create secret generic eduide-git-oauth-github \
  --from-file=client-secret=/dev/stdin
unset SECRET
```

Repeat it with another Secret name for every provider, for example `eduide-git-oauth-gitlab-example`.
Instead of the prompt, you can read from a file that only you can read: `--from-file=client-secret=<path-to-file>`. Delete the file afterwards.
The Secret name and key are what you write into `clientSecretRef` in the values.

### Encryption key

The chart generates the key of the token store once and keeps it on upgrade.
A renderer without cluster access (`helm template`, Argo CD, Flux) cannot look it up and would draw a new key on every render. Then every sync drops all connected accounts.
So with GitOps, create the key yourself and name it in the values:

```bash
openssl rand -hex 32 | tr -d '\n' | kubectl -n <ns> create secret generic eduide-git-accounts-key \
  --from-file=key=/dev/stdin
```

The Secret holds the key under `key`, at least 32 bytes.
Without your own Secret the chart creates `<release>-git-accounts-key`.

### A private CA

For a self-managed instance with a private CA, put the PEM bundle into a ConfigMap and reference it in the provider entry:

```bash
kubectl -n <ns> create configmap eduide-git-ca-gitlab-example --from-file=ca.crt=<path-to-ca.pem>
```

The bundle is added to the system roots. The service uses it for OAuth, the account lookup and the preflight, and the `git-proxy` for its connection to the host.

## Values

### Example

Two providers: GitHub and a self-managed GitLab.
In the `eduide` chart, the control plane is the subchart `eduide-control-plane`:

```yaml
eduide-control-plane:
  config:
    gitAccounts:
      approval:
        mode: write
        maxPerSession: 20
      providers:
      - name: github
        type: github
        host: github.com
        displayName: GitHub
        clientID: <github-client-id>
        clientSecretRef: {name: eduide-git-oauth-github, key: client-secret}
        inactivityExpiry: 2160h
      - name: gitlab-example
        type: gitlab
        host: gitlab.example.org
        displayName: Example GitLab
        clientID: <gitlab-application-id>
        clientSecretRef: {name: eduide-git-oauth-gitlab-example, key: client-secret}
        caConfigMapRef: {name: eduide-git-ca-gitlab-example, key: ca.crt}
  gitAccounts:
    encryptionKey:
      secretName: eduide-git-accounts-key
```

With the `eduide-control-plane` chart on its own, the same values sit at the top level:

```yaml
config:
  gitAccounts:
    approval:
      mode: write
      maxPerSession: 20
    providers:
    - name: github
      type: github
      host: github.com
      displayName: GitHub
      clientID: <github-client-id>
      clientSecretRef: {name: eduide-git-oauth-github, key: client-secret}
gitAccounts:
  encryptionKey:
    secretName: eduide-git-accounts-key
```

The client ID is not a secret. It belongs in the values file.
Do not set `config.gitAccounts.proxyURL` or `internalURL`. The chart renders them.
`config.allowedHosts` needs no entry for a provider host for repository links. A provider host counts as allowed for `GIT_URI` only.

Install or upgrade as usual, see [Installing EduIDE](../install/installing.md).

### Options

| Value | Default | Meaning |
|---|---|---|
| `config.gitAccounts.providers` | `[]` | The Git hosts users can connect. Empty means the feature is off. |
| `providers[].name` | required | Lowercase DNS label, at most 40 characters, unique. It is part of the API path and a label on the token Secrets. |
| `providers[].type` | required | `github` (an OAuth App, also GitHub Enterprise Server) or `gitlab`. |
| `providers[].host` | required | Bare host name such as `github.com`. No scheme, port or path. Unique. Users cannot enter hosts. |
| `providers[].displayName` | the `name` | The name in buttons and Git messages. |
| `providers[].clientID` | required | Client ID of the OAuth application. |
| `providers[].clientSecretRef` | required | `{name, key}` of the Secret that holds the client secret. |
| `providers[].caConfigMapRef` | none | `{name, key}` of a ConfigMap with the PEM CA bundle of a host with a private CA. |
| `providers[].inactivityExpiry` | `2160h` (90 days) | An account that no session used for this long is revoked and deleted. Must be positive. |
| `config.gitAccounts.approval.mode` | `write` | `off`: no approvals, the account serves the session repository only. `read`: a student may approve further repositories for reading. `write`: for reading, or reading and pushing. Write `"off"` in quotes, because an unquoted `off` is a boolean in YAML 1.1. |
| `config.gitAccounts.approval.maxPerSession` | `20` | Approved repositories per session. Positive. |
| `gitAccounts.encryptionKey.secretName` | generated | Own Secret with key `key`, at least 32 bytes. Set it for GitOps. |
| `gitProxy.replicas`, `.logLevel`, `.resources`, `.nodeSelector`, `.tolerations`, `.affinity` | 2, `info`, 16Mi request and 64Mi limit memory | The proxy streams, so memory stays small however large a clone is. A change of `logLevel` restarts it. |
| `networkPolicy.gitProxyEgressExtra` | `[]` | A list of Kubernetes `NetworkPolicyEgressRule` for the `git-proxy`, for a provider on a private address. Session pods get no such path. |
| `networkPolicy.enabled` | `true` | Needs a CNI that enforces NetworkPolicies. The Git policies are part of it. |
| `networkPolicy.monitoringNamespace` | `monitoring` | The namespace that may scrape the metrics port of the `git-proxy`. |
| `networkPolicy.sessionEgressDeny`, `.sessionEgressExtraDeny` | private ranges, none | Session egress deny lists. The rule that lets session pods reach the `git-proxy` is separate, so it holds when these lists deny the pod range. |

The values schema rejects a malformed provider before the install. The service also checks the config at start and refuses to run with providers but no key.

### What the chart renders with providers

- The Deployment `git-proxy` with 2 replicas, a PodDisruptionBudget (`maxUnavailable: 1`, so a node drain also works with one replica) and a ClusterIP Service. No HTTPRoute exists for it.
- The internal port 8083 on the Service of the control plane service, which no route uses.
- NetworkPolicies: session pods may reach the `git-proxy` on port 8080 (`session-to-git-proxy`). The `git-proxy` accepts only session pods and the metrics scrape, and may reach DNS, the internal port of the service and HTTPS to the internet without private ranges (`git-proxy`). The internal port of the service accepts only the `git-proxy` (`service-internal`).
- The key Secret `<release>-git-accounts-key`, unless you name your own.
- Mounts of the client secrets and the key into the service pod only.
- More rights for the service: `list`, `update` and `patch` on Secrets in the namespace. The token Secrets have hashed names, so the rule cannot be narrower.
- Agent settings for new session pods, so that Git in a session reaches the proxy.

With no providers, none of this exists.

:::note Idle sessions are replaced
The Git settings of the agent are part of the pod hash.
After you add, change or remove a provider, the pool replaces its idle (prewarmed) pods with new ones, so new sessions get the new settings.
An installation without providers keeps its hash, so an upgrade replaces no idle pod.
A session that was already claimed keeps its old settings. Git in it answers 404 for the proxy path, and the student starts a new one.
:::

## Step 4: Verify the rollout

Check the pods and policies:

```bash
kubectl -n <ns> get pods -l app.kubernetes.io/component=git-proxy
kubectl -n <ns> get networkpolicy
```

Expected: two `git-proxy` pods `Ready`, and the policies `session-to-git-proxy`, `git-proxy` and `service-internal` next to the existing ones.

Check that the providers are announced. The status is public:

```bash
curl -s https://<eduide-host>/api/v1/status | jq .gitProviders
```

Expected: one entry per provider with `name`, `type`, `host` and `displayName`, and no other field.
No `gitProviders` field means no provider is configured.

Then test with a student account that owns a private repository:

1. Open the landing page, sign in and connect each provider. The host shows the consent screen with the name you registered. After the confirmation you return to the landing page.
2. Open a start link to the private repository:
   `https://<eduide-host>/?appDef=<template>&gitUri=https://<git-host>/<owner>/<repository>.git`
   The session starts and clones it.
3. In the terminal of the session, check that Git is rewired: `git config --global --get-regexp insteadof` shows a rule from `https://<git-host>/` to the local agent on port 8082.
4. Commit, push, and check that the push arrives at the host.
5. Run `git ls-remote https://<git-host>/<owner>/<other-private-repository>.git`. Expected: a refusal that says the account is used only for the repository of the session, or a message with an approval link when approvals are on. A refusal here is correct.
6. If your Artemis VCS host is also a provider, start an Artemis exercise and push from it. This works: the clone URL of an Artemis launch carries the VCS token, so Git does not rewrite it and goes to the host directly, as before. A student who clones without that token goes through the proxy and needs a connected account for a private repository. The sources do not verify what Scorpio does with the credentials in a real IDE, so test it once.
7. Look at the metric `eduide_gitproxy_requests_total` and the `git-proxy` log, see [Operating](#operating).

### When something fails

| Symptom | Check |
|---|---|
| The provider shows an error page about the redirect URI | The callback URL of the application is not exactly `https://<eduide-host>/git/callback` |
| After the consent, the landing page shows an error | The service log. A failed exchange or account lookup (`git-provider-error`) points to a wrong client ID or secret, a missing CA, or blocked outbound HTTPS from the service |
| `git-invalid-state` or `git-state-expired` | The flow is older than 10 minutes, or another user finished it. The student starts again |
| `git-denied` | The student did not allow the access at the provider |
| `GET /api/v1/status` has no `gitProviders` | No provider in the values, or the rollout did not finish |
| 404 on the Git path in a session | The session was claimed before the feature was on. Start a new session. If new sessions also fail, check `AGENT_GIT_PROXY_URL` in the agent container |
| 502 `git proxy unavailable` in a session | The `git-proxy` is down, or the policy `session-to-git-proxy` is missing or not enforced |
| `EduIDE cannot check your access right now` | The internal port 8083 of the service is not reachable from the `git-proxy`. Check the policy `service-internal` and the service log |
| `<name> is not reachable right now` | The provider is down, or egress of the `git-proxy` is blocked. Check its policy and `gitProxyEgressExtra` |
| Session pods can reach what they should not | The CNI does not enforce policies. Do not release the deployment |

The full list of symptoms and fixes is in the [git-proxy runbook](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/operations/git-proxy.md) of the control plane repository.
It also has the steps to check the push rule when a session can reach what it should not.

## Operating

### Turn the feature or one provider off

- **One provider:** remove its entry and upgrade. Its button disappears.
- **The whole feature:** set `providers: []`. The chart then renders no `git-proxy` and no policies for it.
- **Approvals only:** set `approval.mode` to `"off"`. The account then serves the session repository only. Stored approvals stop counting at once.
- Idle (prewarmed) pods are replaced after each of these changes, see [Idle sessions are replaced](#what-the-chart-renders-with-providers).

Stored accounts of a removed provider are not deleted by the service. It sweeps only the providers that are configured.
The tokens stay valid at the host. Remove the accounts yourself, and revoke them at the host.
To delete all stored accounts of one provider, or of all:

```bash
kubectl -n <ns> delete secret -l eduide.github.io/component=git-account,eduide.github.io/git-provider=<provider-name>
kubectl -n <ns> delete secret -l eduide.github.io/component=git-account
```

A deleted Secret does not revoke the token at the host. See [Revoke all accounts](#revoke-all-accounts).

### Rotate a client secret

1. Generate a new secret at the provider (GitHub allows two at once, so there is no gap).
2. Update the Secret in the cluster: delete it and create it again with the command from [Step 3](#client-secrets).
3. Restart the service so that it reads the new file: `kubectl -n <ns> rollout restart deploy/<release>-eduide-control-plane-service`.
4. Remove the old secret at the provider.

Connected students stay connected. The client secret serves new connections, refreshes and revocations.

### Change the encryption key

A new key makes every stored account unreadable.
The service treats such accounts as not connected and deletes the Secrets on the next use, without a revoke at the host.
Students connect again. Connect flows in progress fail.
The old tokens stay valid at the host. Revoke them as described below if the reason for the change is a leak.
Change the key only for a reason: a leak, or the end of the feature.

### Revoke all accounts

After a leak of the token store or the key:

1. Delete the OAuth application at the provider, or use its function to revoke all tokens of users. This ends every token for that application.
2. Delete the stored accounts with the command above.
3. If the encryption key leaked, replace it now, before students connect again. Otherwise new accounts use the key that the attacker knows. Delete the key Secret and create it again as in [Encryption key](#encryption-key), then restart the service. The service reads the key once at start.
4. Register a new application, update the client ID and the Secret, and roll out.
5. Tell students to connect again.

### Read the logs

The `git-proxy` writes one JSON line per push and per request that did not succeed:

```bash
kubectl -n <ns> logs deploy/<release>-eduide-control-plane-git-proxy --since=15m
kubectl -n <ns> logs deploy/<release>-eduide-control-plane-git-proxy --since=24h | jq 'select(.kind == "push")'
```

Fields: `user` (salted id), `session`, `provider`, `repository`, `kind` (`read` or `push`), `result`, `reason` and `status`.
`reason` is `ok`, `anonymous-other`, `push-rule`, `connect`, `not-ready`, `unknown-host` or `unauthorized`.
A push line with reason `ok` is a push that went through.
Lines with `push-rule` or `connect` are denials.
Successful reads are only counted. Tokens and bodies are never logged.

The service logs these events: `git repository approved`, `git repository approval removed` (with salted user id, session, provider, repository, access), `git account expired`, `git account revoked at the host, deleted it`, and a warning `git account revoke failed` when a revoke at the host failed.
An error that says the rotated refresh token could not be stored means a student must connect again.

### Metrics

The `git-proxy` serves `/metrics`, `/healthz` and `/readyz` on port 9090.

| Metric | Meaning |
|---|---|
| `eduide_gitproxy_requests_total{provider,kind,result}` | `result` is `ok`, `denied` (the service said no), `upstream-denied` (the provider answered 401, 403, 404 or a redirect), `upstream-error` (provider unreachable or 5xx) or `unavailable` (the service did not answer) |
| `eduide_gitproxy_bytes_total{provider,direction}` | `in` is client to provider (pushes), `out` is provider to client |
| `eduide_gitproxy_upstream_seconds{provider,kind}` | Duration of a forwarded request |

A rise of `unavailable` means the internal port of the service is not reachable.
A rise of `upstream-error` for one provider means that host is down or not reachable.

### Scaling

The `git-proxy` is stateless. A pod finishes running transfers for up to 60 seconds on shutdown.
A longer clone or push during a rollout can break, and the student retries.

### Limits students can meet

- No Git LFS. The proxy answers "Git LFS is not supported through EduIDE."
- No platform API of GitHub or GitLab, for sessions and for the service.
- A repository path has 2 to 10 segments, and no segment starts with a dot. A renamed or moved repository needs its new URL, because the proxy never follows a redirect.
- The proxy cancels a transfer that moves no byte for 5 minutes. A slow transfer that keeps moving finishes.
- Rate limits: 100 requests per second per client IP (burst 400) and 16 requests at the same time per session. Git commands do not reach them. A network that rewrites pod addresses makes all pods of a node share one IP bucket.
- The commit identity is set when the session starts.
- A new connection works within 3 seconds, a disconnect or a removed approval within 5 seconds.

## Data protection

| Data | Where | Kept |
|---|---|---|
| Token, refresh token, expiry, login, numeric id, display name, no-reply e-mail, connect time | One Secret per student and provider in the deployment namespace, named `git-account-<hash>`, as one encrypted blob. Labels hold the provider and a hash of the owner. An annotation holds the last use. | Until the student disconnects, or the account is unused for `inactivityExpiry` |
| Encryption key | The key Secret | While the feature runs |
| Approvals: repository, access, time (no credential) | Secret `<session>-git-repos`, owned by the session | Until the session ends |
| Push and denial lines: salted user id, session, provider, repository, kind, result | Logs of the `git-proxy` | What your log stack keeps. Set it |
| Approval lines | Logs of the service | Same |
| Request counts, bytes, durations | Prometheus, no user label | Your Prometheus retention |

Tokens never appear in launch data, custom resource specs, logs, traces, metrics or status.
The preflight before a launch sends one request to the provider host and never logs the URL or the credential.
The login, id, name and no-reply e-mail of an account are personal data. Mention the feature in the privacy statement of your installation and agree it with your data protection office.
Disconnect revokes the token at the host and deletes the Secret. The sweep runs hourly on every service replica.

## Security summary

In plain words:

| Threat | What prevents it |
|---|---|
| Code in a session steals the Git token | The token never enters the pod. The IDE container holds no token and no credential for the proxy either. |
| Code in a session reads other private repositories of the student | The account is used only for the session repository and approved ones. Everything else is read anonymously. |
| Code in a session pushes to other repositories | Pushes are allowed only to the session repository and to approved repositories with write access. |
| Code in a session approves repositories for itself | Approval needs the login of the student on the landing page. The pod has no login token, and the internal endpoint only decides. |
| A student clicks an approval they did not request | The page names the session and repository and needs a click. Approvals are per session, limited in number and logged. The mode can limit them to reading or turn them off. |
| Stolen token store (an etcd backup, `kubectl get secret`) | The values are encrypted with a key in a separate Secret. The inactivity expiry keeps the set small. |
| A forged connect flow (login CSRF) | The state names the student who started it, and the callback requires the same student. There is no cookie. The flow uses PKCE. |
| The proxy as an open relay | Only provider hosts, only three Git paths, HTTPS only, no redirects, no private ranges in its egress. |
| A session reaches the internal port of the service | A separate listener, a policy for the `git-proxy` only, and the instance token. |

Residual risks:

- **The session repository is exposed to code in the session.** Code in the session can read and push it while the session runs. That is the purpose of the feature.
- **GitHub tokens do not expire.** A GitHub OAuth App token stays valid until the student revokes it or EduIDE does. A compromised `git-proxy` sees tokens in transit. The controls are the policies, no ingress, no Secret mounts, and the revoke on disconnect. GitLab tokens live two hours.
- **The GitHub scope is broad.** GitHub offers nothing narrower. EduIDE never gives the token to the pod and uses it for Git only.
- **The service can list and update every Secret of its namespace** while the feature is on.
- **A connect state is not single use.** The expiry of 10 minutes, the single-use code of the provider and the owner check bound a replay.
- **A change of the commit identity needs a new session.**
- **No Git LFS and no platform API.** LFS requests answer a clear error.
- **A delay of a few seconds.** A disconnect or removed approval works in a running session for up to 5 seconds, and a new connection takes up to 3 seconds.

## Exams

The feature is on in every session of an installation that configures providers, including Artemis sessions and exams.
A switch per template is tracked in [EduIDE-control-plane issue 32](https://github.com/EduIDE/EduIDE-control-plane/issues/32).
Until it exists, decide per installation.
