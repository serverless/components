# Template - AWS Lambda

&nbsp;

This is a template for deploying an AWS Lambda Function via Serverless Components.

The [AWS Lambda Component](https://www.github.com/serverless-components/aws-lambda) is incredibly powerful and fast.  For example, it uses AWS S3 Transfer Acceleration for fast uploads and automatically takes NPM dependencies and packages them as an AWS Lambda layer, then it only updates the layer when it detects changes to your NPM dependencies, resulting in fast upload speeds because your custom code is being uploaded primarily.  

[Learn more about this Component in its repository.](https://www.github.com/serverless-components/aws-lambda)

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
