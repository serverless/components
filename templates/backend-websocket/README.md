# Template - Backend (Websockets)

&nbsp;

This is a template for deploying a serverless real-time websockets API with a monolithic architecture via the [Backend Socket Component](https://www.github.com/serverless-components/backend-socket).  It consists of 1 AWS Lambda Function connected to a single AWS API Gateway Websockets endpoint that proxies all requests to the AWS Lambda Function, where you can route those requests in code.

This is a great architecture if you want to build a real-time serverless backend, without having to deal with the (sometimes) complex AWS API Gateway configuration and wrangling multiple AWS Lambda functions.

[Learn more about the Backend Socket Component in its repository.](https://www.github.com/serverless-components/backend-socket)

&nbsp;

1. [Install](#1-install)
2. [Deploy](#2-deploy)

&nbsp;


### 1. Install

Install the [Serverless Framework](https://www.github.com/serverless/serverless):

```console
$ npm i -g serverless
```

Add the access keys of an AWS IAM Role with `AdministratorAccess` in a `.env` file, using this format:

```bash
AWS_ACCESS_KEY_ID=1234
AWS_SECRET_ACCESS_KEY=1234
```

Or, you can set these as environment variables manually before deploying.

### 2. Deploy

Deploy via the `serverless` command:

```console
$ serverless
```

Use the `--debug` flag if you'd like to learn what's happening behind the scenes:

```console
$ serverless --debug
```

## New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
