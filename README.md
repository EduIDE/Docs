# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Project dashboard

The [EduIDE dashboard](https://eduide.github.io/dashboard/) shows the open pull requests, open issues and release state of every public EduIDE repository on one page.
It refreshes every 15 minutes ([source](https://github.com/EduIDE/dashboard)).

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Test

```bash
npm test
bash scripts/check-docs.sh
```

`npm test` checks the link builder behind the "Open a Repository from a Link" page (Node 22.18 or newer, which runs TypeScript directly).
`scripts/check-docs.sh` checks that every page is in a sidebar and every relative link resolves.

## Deployment

Using SSH:

```bash
USE_SSH=true npm run deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
