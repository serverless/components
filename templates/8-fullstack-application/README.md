# Template - Fullstack Application

&nbsp;

This is a template for deploying a serverless fullstack application via multiple Serverless Components.  This aims to be the simplest possible way to build a serverless fullstack application, that includes everything you need, including a React application on the front-end bundled with Parcel, custom domains for the front-end, back-end API, as well as an SSL certificate.

This fullstack application's software stack is completely serverless has the lowest total overhead, and cost.  **If you are looking for an efficient solution that enables you to build more and manage less (cheaply), there is no better option.**

This template includes:

* **A serverless monolithic backend** - powered by a single AWS Lambda function and a single AWS API Gateway endpoint, which sends all requests to the function, enabling you to do routing and logic all in your code.

* **A serverless website with a React application*** - powered by AWS S3, AWS Cloudfront, AWS Route 53 and an AWS ACM SSL Certificate.  The backend API endpoint is already passed into the front-end, and the React application is already configured to use it.

* **An on-demand AWS DynamoDB auto-scaling table** - powered by AWS DynamoDB (shocker!).

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

Add the access keys of an AWS IAM Role with `AdministratorAccess` in a `.env` file, using this format:

```bash
AWS_ACCESS_KEY_ID=1234
AWS_SECRET_ACCESS_KEY=1234
```

Or, you can set these as environment variables manually before deploying.

Install the NPM dependencies in the front-end `dashboard` directory:

```console
$ npm i
```

Please note that while these Serverless Components set up almost everything for you with a single command, if you want to set up a custom domain, you MUST purchase it in your AWS account manually via Route 53.  We have not yet automated domain registration.  After registering it, you may have to wait a few minutes for registration to complete before you can use it.

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

### 4. Notes

Remember, once you deploy with a custom domain for the first time, it may take up to an hour for DNS servers to propagate that change.  Meaning, your API and front-end won't be immediately available after first deployment.

## New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
