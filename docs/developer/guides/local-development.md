---
title: Local Development
description: How to build, test and run the control plane and the IDE images locally.
---

# Local Development

Most work happens in one repository at a time. For the control plane, a local kind cluster gives you the real Kubernetes behavior, so you can test the request path on your laptop. The authoritative setup guide is [`docs/development/setup.md`](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/development/setup.md) in the control plane repository.

## Control plane

### Tools

Go (the version named in the setup guide), Node.js LTS, Docker, kind, kubectl, helm and golangci-lint. Python 3 and the `drawio` CLI are optional and only regenerate the diagrams.

### First build

```bash
git clone https://github.com/EduIDE/EduIDE-control-plane.git
cd EduIDE-control-plane
make generate   # code from the contracts in api/
make build
make test       # unit, envtest and TypeScript tests
make lint
```

### Make targets

| Target | Does |
| --- | --- |
| `make generate` | CRD YAML, deepcopy, RBAC, REST stubs, agent types and the TypeScript client |
| `make verify-generate` | Fails if generated files are stale (CI runs it) |
| `make test` | Unit and envtest tests of all Go modules, plus the TypeScript tests |
| `make lint` | golangci-lint |
| `make build`, `make images TAG=x` | Binaries, images |
| `make helm-lint` | Lint all charts |
| `make e2e`, `make e2e-down` | Create and remove the kind cluster and run the end-to-end suite |

Never edit generated files (`*.gen.go`, `zz_generated*.go`, `config/`, `clients/typescript/src/schema.gen.ts`). Change the source in `api/` and run `make generate`.

### End-to-end tests on kind

```bash
make e2e        # kind cluster with Envoy Gateway, Calico, Keycloak; full matrix and browser tests
make e2e-down   # remove the cluster
```

The suite covers the four variants (temporary session or saved workspace, with or without a pool), the gateway checks (owner, foreign user, free instance, no cookie), the NetworkPolicy negative test, timeouts and a search of logs and spans for leaked launch data. No CI workflow runs it, so run it before a release. `EG_VERSION=v1.10.0 make e2e` runs it against another Envoy Gateway version. See the [testing guide](https://github.com/EduIDE/EduIDE-control-plane/blob/main/docs/development/testing.md).

:::danger Isolate your KUBECONFIG
The default kube context on your machine can be a real cluster. Before any command that touches a local cluster, point `KUBECONFIG` at the kind cluster and check it:

```bash
export KUBECONFIG=$(pwd)/.e2e/kubeconfig     # fish: set -x KUBECONFIG (pwd)/.e2e/kubeconfig
kubectl config current-context               # must be kind-eduide-e2e
kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'   # must be https://127.0.0.1:<port>
```

If the context or the server differ, stop. Set the variable in every script and shell, not only for one command. Never run kubectl, helm or kind against a cluster you did not create for the test.
:::

On OrbStack, containers bind to `127.0.0.1` only, so use that address instead of `localhost`.

## IDE images and extensions

Build and run an image from the [EduIDE](/developer/projects/eduide) repository:

```bash
docker compose -f docker-compose.images.yml up --build java-17-standalone
```

Each service publishes its own port on `127.0.0.1` (`3103` for `java-17-standalone`). Check a built image with `scripts/smoke-test-image.sh <image> <standalone|artemis>`.

For extension work, a local Theia application gives the fastest feedback. The `eduide-session` extension has plain `node:test` tests against a fake agent: `npm ci && npm test` in `extensions/eduide-session` of the control plane repository.

## Docs

`npm ci`, `npm run build` and `bash scripts/check-docs.sh` in the Docs repository.

## When a shared test installation is better

Use a test installation instead of a local cluster when the change depends on the real gateway, a real identity provider, real storage classes or real load. Deploy preview artifacts as described in [Deploying Pull Requests](/developer/guides/deploying-pull-requests).
