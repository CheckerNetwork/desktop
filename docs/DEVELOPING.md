# Developer Guide

## Architecture Overview

### Code organization

```mermaid
graph
  fil-stat-repo(github.com/CheckerNetwork/app) --> fil-stat-main(Checker main process)
  fil-stat-repo --> fil-stat-webui(Checker WebUI)

  saturn-l2-repo(https://github.com/filecoin-project/saturn-l2)
  --> saturn-l2-go(Saturn L2 Node binary)

  saturn-webui-repo(github.com/filecoin-project/saturn-webui)
  --> saturn-webui(Saturn WebUI)
  saturn-webui --> saturn-l2-go

  fil-stat-main --> fil-stat-distro(Desktop Application)
  fil-stat-webui --> fil-stat-distro
  saturn-l2-go --> fil-stat-distro
```

Repositories:

- https://github.com/CheckerNetwork/app
- https://github.com/filecoin-saturn/L2-node
- https://github.com/filecoin-project/saturn-webui

### End-to-end release workflow

1. `filecoin-project/saturn-webui` publishes a new release with WebUI assets
2. `filecoin-saturn/L2-node` is updated to use the new `saturn-webui` version
3. `filecoin-saturn/L2-node` publishes a new release
4. `CheckerNetwork/app` is updated to use the new `L2-node` version
5. `CheckerNetwork/app` publishes a new release

## Development workflow

### Initial setup

1. Install the latest LTS version of Node.js
2. Clone this repository
3. Run `npm install` to install all dependencies, including electron components
   and Saturn L2 Node.

### Making changes

- Run `npm start` to open the Electron app and load the WebUI via the Vite DEV
  server. Changes made inside `renderer` files will be immediately applied in
  the running app.

- Run `npm run lint` to check for coding style issues and type errors. Run
  `npm run lint:fix` to fix formatting issues.

- Run `npm test` to run all automated tests (unit/integration/end-to-end).

### Building the app package

Run `npm run package` to create the app package for your local platform. Check
the `dist` directory for app artefacts, for example a DMG installer for macOS.

## CommonJS vs ES Modules

Electron does not support ESM for the backend code. We use CommonJS (`require`)
in those files.

The front-end is written in TypeScript; there is no such limitation. Therefore
inside `renderer`, we use ESM to get better developer experience and tooling
support.

## Updating to a new major version of Electron/Chromium

After updating to a newer Chromium version, update the compilation target for
`renderer` files in [vite.config.js](./../vite.config.js).

## Troubleshooting end-to-end tests

Set `DEBUG=pw:browser` to obtain console logs from the electron app under test.

```shell
$ npm run build
$ DEBUG=pw:browser npm run test:e2e
```
