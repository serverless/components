# Template - Schedule Task

&nbsp;

This is a template for deploying a serverless scheduled task (i.e. a CRON job) on an AWS Lambda Function via Serverless Components.

It uses the [Schedule Component](https://www.github.com/serverless-components/schedule) which simplifies the creation of the AWS Lambda function as well as the syntax to configure the AWS Cloudwatch Scheduled Event which triggers the function.

[Learn more about this Component in its repository.](https://www.github.com/serverless-components/schedule)

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
