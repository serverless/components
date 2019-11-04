# Template - Fullstack Application deployed with Tencent Cloud Services

This is a template for deploying a serverless fullstack application via multiple Serverless Components. This aims to be the simplest possible way to build a serverless fullstack application, including a Vue.js application on the front-end bundled with Parcel and back-end API.

This fullstack application's software stack is completely serverless has the lowest total overhead, and cost.  **If you are looking for an efficient solution that enables you to build more and manage less (cheaply), there is no better option.**

This template includes:

* **A serverless REST API** - powered by a single Servelress Cloud Function and a single API Gateway endpoint, which sends all requests to the function, enabling you to do routing and logic all in your code.

* **A serverless website with a Vue.js application*** - powered by Cloud Object Storage.  The backend API endpoint is already passed into the front-end, and the Vue.js application is already configured to use it.

&nbsp;

1. [Install](#1-install)
2. [Deploy](#2-deploy)
3. [Development](#3-development)
4. [Notes](#4-notes)

&nbsp;


### 1. Install

Install the [Serverless Framework](https://www.github.com/serverless/serverless):

```console
$ npm i -g serverless
```

Add the access keys of an Cloud Access Management role in a `.env` file, using this format:

```bash
TENCENT_SECRET_ID=1234
TENCENT_SECRET_KEY=1234
TENCENT_APP_ID=1234
```

Or, you can set these as environment variables manually before deploying.

Install the NPM dependencies in the front-end `dashboard` and backend `api` directories:

```console
$ npm i
```

### 2. Deploy

Deploy via the `serverless` command:

```console
$ serverless
```

Use the `--debug` flag if you'd like to learn what's happening behind the scenes:

```console
$ serverless --debug
```

### 3. Development


After your first deployment, you will be able to run the front-end locally and have it communicate to the live back-end, in the cloud.

```console
$ cd dashboard && npm run start
```

## New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
