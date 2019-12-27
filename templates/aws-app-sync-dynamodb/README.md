# Template - GraphQL API (AWS AppSync DynamoDB)

&nbsp;

This is a template for deploying a serverless GraphQL API via the [AWS AppSync](https://www.github.com/serverless-components/aws-app-sync) Component with a [AWS DynamoDB](https://www.github.com/serverless-components/aws-dynamodb) Component.

This is a great architecture if you want to build a GraphQL API, without having to deal with the complexity that comes with GraphQL, as AppSync lets you declare resolvers using the Apache Velocity Template Language

[Learn more about the AWS AppSync Component in its repository.](https://www.github.com/serverless-components/aws-app-sync)
[Learn more about the AWS DynamoDB Component in its repository.](https://www.github.com/serverless-components/aws-dynamodb)

&nbsp;

1. [Install](#1-install)
2. [Deploy](#2-deploy)
3. [Use your API](#3-use-your-api)

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

### 3. Use your API

On the client, the API key is specified by the header x-api-key.

For example, you can send a GraphQL query via curl as follows:

```console
$ curl -XPOST -H "Content-Type:application/graphql" -H "x-api-key:YOUR_API_KEY" -d '{ "query": "query { getTodos { description } }" }' http://YOURAPPSYNCENDPOINT/graphql
```

## New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
