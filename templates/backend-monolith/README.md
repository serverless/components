# Template - Backend (Monolith)

&nbsp;

This is a template for deploying a serverless API with a monolithic architecture via the [Backend Component](https://www.github.com/serverless-components/backend).  It consists of 1 AWS Lambda Function connected to a single AWS API Gateway endpoint that proxies all requests to the AWS Lambda Function, where you can route those requests in code.

This is a great architecture if you want to build a powerful serverless backend, without having to deal with the (sometimes) complex AWS API Gateway configuration and wrangling multiple AWS Lambda functions.

Additionally, the Backend Component will set up a custom domain for your API if you have one in your AWS Route 53 account.

[Learn more about the Backend Component in its repository.](https://www.github.com/serverless-components/backend)

&nbsp;

1. [Install](#1-install)
2. [Deploy](#2-deploy)
3. [Notes](#3-notes)

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

Please note that while the Backend Component sets up almost everything for you with a single command, if you want to set up a custom domain, you MUST purchase it in your AWS account manually via Route 53.  We have not yet automated domain registration.  After registering it, you may have to wait a few minutes for registration to complete before you can use it.

### 2. Deploy

Deploy via the `serverless` command:

```console
$ serverless
```

Use the `--debug` flag if you'd like to learn what's happening behind the scenes:

```console
$ serverless --debug
```

### 3. Notes

Remember, once you deploy with a custom domain for the first time, it may take up to an hour for DNS servers to propagate that change.  Meaning, your API won't immediately available after first deployment.

## New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
