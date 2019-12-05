[![Serverless Vue Tencent Cloud](https://main.qcloudimg.com/raw/e9b96e28ab8040d2848eb0773b98dd57.png)](http://serverless.com)

&nbsp;

# Template - Fullstack Application deployed with Tencent Cloud Services

This is a template for deploying a serverless fullstack application via multiple Serverless Components. This aims to be the simplest possible way to build a serverless fullstack application, including a Vue.js application on the front-end bundled with Parcel and back-end API.

This fullstack application's software stack is completely serverless has the lowest total overhead, and cost. **If you are looking for an efficient solution that enables you to build more and manage less (cheaply), there is no better option.**

This template includes:

- **A serverless REST API** - powered by a single Servelress Cloud Function and a single API Gateway endpoint, which sends all requests to the function, enabling you to do routing and logic all in your code.

- **A serverless website with a Vue.js application** - powered by Cloud Object Storage. The backend API endpoint is already passed into the front-end, and the Vue.js application is already configured to use it.

&nbsp;

- [请点击这里查看中文版部署文档](./README.md)

&nbsp;

1. [Install](#1-install)
2. [Create](#2-create)
3. [Deploy](#3-deploy)
4. [Development](#4-development)
5. [Notes](#5-notes)

&nbsp;

### 1. Install

Install the [Serverless Framework](https://www.github.com/serverless/serverless):

```console
$ npm i -g serverless
```

Next, use the `create --template-url` command to install a `tencent-fullstack-vue-application`.

```console
$ serverless create --template-url https://github.com/serverless/components/tree/master/templates/tencent-fullstack-vue-application
```

### 2. Create

Just create `.env` file:

```console
$ touch .env # your Tencent API Keys
```

Add the access keys of a [Tencent CAM Role](https://console.cloud.tencent.com/cam/capi) with `AdministratorAccess` in the `.env` file, using this format:

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

- If you don't have a Tencent Cloud account, you could [sign up](https://intl.cloud.tencent.com/register) first.

Or, you can set these as environment variables manually before deploying.

Install the NPM dependencies in the front-end `dashboard` and backend `api` directories:

```console
$ npm i
```

Move/Create your file in the folder, and the directory should look something like this:

```
|- api
|- dashboard
|- serverless.yml      # Inside the repo
|- .env      # your Tencent SecretId/Key/AppId
```

### 3. Deploy

Deploy via the `serverless` command:

```console
$ serverless
```

Use the `--debug` flag if you'd like to learn what's happening behind the scenes:

```console
$ serverless --debug
```

### 4. Development

After your first deployment, you will be able to run the front-end locally and have it communicate to the live back-end, in the cloud.

```console
$ cd dashboard && npm run start
```

## New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
