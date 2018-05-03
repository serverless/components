# Development

## Requirements

* Node.js 8.0+
* Npm 5.0+

_NOTE:_ we recommend using [nvm](https://github.com/creationix/nvm)

```sh
brew install nvm
nvm install 8.11
nvm use 8.11
```

## Setup

```sh
git clone https://github.com/serverless/components.git
cd components
npm install
```

## `USE_ESNEXT` environment variable

You can export the `USE_ESNEXT` environment variable if you're using a Node.js version >=8 and want to work on the project without `build`ing / `watch`ing it.

## Build

To build the project

```sh
npm run build
```

## Watch

To automatically re-build the project when files change

```sh
npm run watch
```

## Cleanse

To wipe out all installed modules as well as package-lock.json files, use the `cleanse` script.

To cleanse the project

```sh
npm run cleanse
```

## Tests

Run tests for the project

```sh
npm test
```

## Lint

Run lint for the project

```sh
npm run lint
```
