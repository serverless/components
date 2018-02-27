![serverless components logo](https://s3.amazonaws.com/assets.github.serverless/serverless-components-readme3.png)

This project is a prototype of a new concept Serverless has been exploring called "components". Our aim is to introduce highly configurable and composable pieces that allow for multi-cloud & third party resource use cases.

Components are capable of provisioning infrastructure while including both application logic AND lifecycle management. They have a focus on serverless/cloud resources and they also greatly enable reuse, sharing and simplicity.

## Table of contents

* [Getting started](#getting-started)
* [Concepts](#concepts)
  * [Components](#components)
  * [Registry](#registry)
  * [Inputs & Outputs](#inputs-outputs)
  * [State](#state)
  * [Variables](#variables)
  * [Graph](#graph)
  * [Custom commands](#custom-commands)
* [Docs](#docs)
  * [apigateway](#apigateway)
  * [dynamodb](#dynamodb)
  * [eventgateway](#eventgateway)
  * [github](#github)
  * [github-webhook-receiver](#github-webhook-receiver)
  * [iam](#iam)
  * [lambda](#lambda)
  * [rest-api](#rest-api)
  * [s3](#s3)
  * [s3-downloader](#s3-downloader)
  * [s3-prototype](#s3-prototype)
  * [s3-uploader](#s3-uploader)

## Getting started

**Note:** Make sure you have Node.js 8+ and npm installed on your machine

1. Setup
1. `npm install --global @serverless/serverless-components`
1. Setup the environment variables
   * `export GITHUB_TOKEN=my_github_token`
   * `export EVENT_GATEWAY_API_KEY=my_event_gateway_api_key`
   * `export AWS_ACCESS_KEY_ID=my_access_key_id`
   * `export AWS_SECRET_ACCESS_KEY=my_secret_access_key`
1. Make sure to install sub dependancies in every `/registry/*` with `package.json`

## Running Locally

Run commands with

```
node ../../bin/serverless [Command]
```

## Concepts

### Components

A component is the smallest unit of abstraction for your infrastructure. It could be a single small piece like an IAM role, or a larger piece that includes other small pieces, like [`github-webhook-receiver`](#github-webhook-receiver), which includes `lambda` (which itself includes `iam`), `apigateway` (which also includes `iam`), `dynamodb`, and `github-webhook`. So components could be composed with each other in a component dependency graph to build larger components.

You define a component using two files: `serverless.yml` for config, and `index.js` for the provisioning logic.
The `index.js` file exports multiple functions that take four arguments: `inputs`, `state`, `context` and `options`. Each exported function name reflects the CLI command which will invoke it (the `deploy` function will be executed when one runs `proto deploy`).

However, this `index.js` file is optional, since your component could just be a composition of other smaller components without provisioning logic on its own. [`github-webhook-receiver`](#github-webhook-receiver) is a good example of this.

These two files look something like this:

**serverless.yml**

```yml
type: github-webhook-receiver

inputs:
  url: ${myEndpoint:url} # Variable from another component output

components:
  myTable: # component alias, to be referenced with Variables
    type: dynamodb
    inputs:
      name: github-webhook-receiver
  myFunction:
    type: lambda
    inputs:
      name: github-webhook-receiver
      memory: 128
      timeout: 10
      handler: code.handler
  myEndpoint:
    type: apigateway
    inputs:
      name: github-webhook-receiver
      roleArn: arn:aws:iam::XXXXX:role/some-api-gateway-role
      routes:
        /github/webhook:
          post:
            function: ${myFunction:name}
  myGithubWebhook:
    type: github
    inputs:
      token: ${GITHUB_TOKEN} # Variable from env var
      owner: serverless
      repo: components-eslam
      url: ${myEndpoint:url}
      event: pull_request
```

**index.js**

```js
const deploy = (inputs, state, context, options) => {
  // provisioning logic goes here
};

module.exports = {
  deploy // this is the command name which is exposed via the CLI
};
```

### Registry

The ["Serverless Registry"](./registry) is a core part in this implementation since it makes it possible to discover, publish and share existing components.

The registry is not only constrained to serve components. Since components are functions it's possible to wrap existing business logic into functions and publish them to the registry as well.

Looking into the future it could be possible to serve functions which are written in different languages through the registry.

### Inputs & Outputs

#### Inputs

Inputs are the configuration that are supplied to your component logic by the user. You supply those inputs in `serverless.yml`:

```yml
type: github-webhook-receiver

inputs:
  firstInput: hello
  secondInput: world
```

Or, if the component is being used as a child of another parent component, like the `lambda` component, the parent could supply those inputs, and they would overwrite the default inputs that are defined at the child level.

So, if the lambda `serverless.yml` looks like this:

```yml
type: lambda

inputs:
  memory: 128
  timeout: 10
```

and `github-webhook-receiver` `serverless.yml` looks like this:

```yml
type: github-webhook-receiver

components:
  myFunction:
    type: lambda
    inputs:
      memory: 512
      timeout: 300
```

Then your deployed `lambda` function would have a memory size of 512, and timeout of 300.

#### Outputs

Your provisioning logic, or your `index.js` file, can optionally return an outputs object. This output can be referenced in `serverless.yml` as inputs to another component.

### State

State is simply the inputs and outputs of the last operation. It represents a historical snapshot of what happened last time you ran a command such as `deploy`, `remove`, etc.

The provisioning logic can use this state object and compare it with the current inputs, to make decisions whether to deploy, update, or remove.

The operation that needs to be done depends on the inputs and how the provider works. Change in some inputs for some provider could trigger a create/remove, while other inputs might trigger an update. It's up to the component to decide.

Here's an example on how the lambda component decides what needs to be done based on the inputs and state:

```js
const deploy = (inputs, state, context, options) => {
let outputs;
  if (inputs.name && !state.name) {
    console.log(`Creating Lambda: ${inputs.name}`);
    outputs = await create(inputs);
  } else if (state.name && !inputs.name) {
    console.log(`Removing Lambda: ${state.name}`);
    outputs = await remove(state.name);
  } else if (inputs.name !== state.name) {
    console.log(`Removing Lambda: ${state.name}`);
    await remove(state.name);
    console.log(`Creating Lambda: ${inputs.name}`);
    outputs = await create(inputs);
  } else {
    console.log(`Updating Lambda: ${inputs.name}`);
    outputs = await update(inputs);
  }
  return outputs;
}

module.exports = {
  deploy
}
```

### Variables

The framework supports variables from two sources:

* **Environment Variables:** for example, `${GITHUB_TOKEN}`
* **Output:** for example: `${myEndpoint.url}`, where `myEndpoint` is the component alias as defined in `serverless.yml`, and `url` is a property in the outputs object that is returned from the `myEndpoint` provisioning function.

### Graph

When you start composing components together, and each of those components use other nested components, and all those components depend on each other with variable references, you end up with a graph of components.

Internally, the framework constructs this dependency graph by analyzing the entire component structure and their variable references. With this dependency graph the framework is able to provision the required components in parallel whenever they don't depend on each other, while waiting on other components that depend on components that haven't been provisioned yet.

The component author doesn't have to worry about this graph at all. One just uses variables to reference the outputs which should be used and it'll just work.

### Custom Commands

Other than the built in `deploy` and `remove` commands, you can add custom commands to add extra management for your component lifecycle. You do so by adding the corresponding function to the `index.js` file. Just like the other functions in `index.js`, it accepts `inputs`, `state`, `context` and `options`.

```js
const deploy = (inputes, state, context, options) => {
  // some provisioning logic
};

const test = (inputs, state, context, options) => {
  console.log("Testing the components functionality...");
};

module.exports = {
  deploy,
  test // make the function accisble from the CLI
};
```

## Docs

### CLI Usage

#### Deployment

To deploy your app, run

```
proto deploy
```

#### Updating

* Change some components inputs
* Then run

```
proto deploy
```

#### Removal

To remove your app, run

```
proto remove
```

### Component Usage

#### `apigateway`

Creates / Removes an API endpoint which is exposed via AWS API Gateway and connects directly to an AWS Lambda function.

##### Inputs

| Name      | Description                                                      | Type   |
| --------- | ---------------------------------------------------------------- | ------ |
| `name`    | The API name                                                     | String |
| `roleArn` | The AWS IAM Role `arn` which should be used for this API Gateway | String |
| `routes`  | The routes definitions for this API                              | Object |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: apigateway

inputs:
  name: apigateway
  roleArn: arn:aws:iam::XXXXX:role/some-api-gateway-role
  routes:
    /hello:
      post:
        function: hello
        cors: true
      get:
        function: hello
    /hello/world:
      delete:
        function: world
```

#### `dynamodb`

Creates / Removes an AWS DynamoDB table.

##### Inputs

| Name   | Description                 | Type   |
| ------ | --------------------------- | ------ |
| `name` | The AWS DynamoDB table name | String |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: dynamodb

inputs:
  name: dynamodb
```

#### `eventgateway`

Creates / Removes an Event Gateway function registration and corresponding subscription.

##### Inputs

| Name                 | Description                                                                    | Type   |
| -------------------- | ------------------------------------------------------------------------------ | ------ |
| `event`              | `http` or a freeform event like `user.created`                                 | String |
| `path`               | The event path                                                                 | String |
| `method`             | **Optional** The HTTP method (if the `http` event is used)                     | String |
| `space`              | The Event Gateway space which should be used                                   | String |
| `eventGatewayApiKey` | The Event Gateway API Key which is used to manage configuration on your behalf | String |
| `lambdaArn`          | The functions runtime                                                          | String |

##### Commands

* `proto deploy`
* `proto remove`
* `proto info`

##### Example

```yml
type: eventgateway

inputs:
  event: http # or any freeform event like "user.created"
  path: some-path
  method: POST # optional
  space: some-space
  eventGatewayApiKey: s0m33v3ntg4t3w4y4p1k3y
  lambdaArn: arn:aws:lambda:us-east-1:XXXXX:function:some-lambda-function
```

#### `github`

Creates / Removes a GitHub Webhook.

##### Inputs

| Name    | Description                                                         | Type   |
| ------- | ------------------------------------------------------------------- | ------ |
| `token` | The GitHub token which is used to create the Webhook on your behalf | String |
| `owner` | The repository owner                                                | String |
| `repo`  | The name of the GitHub repository                                   | String |
| `url`   | The Webhook URL                                                     | String |
| `event` | The Webhooks event                                                  | String |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: github

inputs:
  token: ${GITHUB_TOKEN}
  owner: jdoe
  repo: some-repository
  url: https://some-endpoint.com
  event: push
```

#### `github-webhook-receiver`

Creates / Tests / Removes a GitHub Webhook receiver.

##### Inputs

| Name  | Description     | Type   |
| ----- | --------------- | ------ |
| `url` | The Webhook URL | String |

##### Commands

* `proto deploy`
* `proto test`
* `proto remove`

##### Example

**Note:** This example re-uses other components.

```yml
type: github-webhook-receiver

inputs:
  url: ${myEndpoint:url}

components:
  myTable:
    type: dynamodb
    inputs:
      name: github-webhook-receiver
  myFunction:
    type: lambda
    inputs:
      name: github-webhook-receiver
      memory: 128
      timeout: 10
      handler: code.handler
  myEndpoint:
    type: eventgateway
    inputs:
      event: http
      method: POST
      path: github-webhook-receiver-path
      space: github-webhook-receiver
      eventGatewayApiKey: s0m33v3ntg4t3w4y4p1k3y
      lambdaArn: ${myFunction:arn}
  myGithubWebhook:
    type: github
    inputs:
      token: ${GITHUB_TOKEN}
      owner: jdoe
      repo: some-repository
      url: ${myEndpoint:url}
      event: pull_request
```

#### `iam`

Creates / Removes an AWS IAM role.

##### Inputs

| Name   | Description               | Type   |
| ------ | ------------------------- | ------ |
| `name` | The name for the IAM role | String |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: iam

inputs:
  name: role-name
```

#### `lambda`

Creates / Removes an AWS Lambda function.

##### Inputs

| Name          | Description                          | Type   |
| ------------- | ------------------------------------ | ------ |
| `name`        | The functions name                   | String |
| `memory`      | The functions memory size            | Number |
| `timeout`     | The functions timeout                | Number |
| `description` | The functions description            | String |
| `handler`     | The functions handler                | String |
| `role`        | The role `arn` the lambda should use | String |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: lambda

inputs:
  name: some-lambda-function
  memory: 128
  timeout: 10
  description: dome description
  handler: code.handler
  role: arn:aws:iam::XXXXX:role/some-lambda-role
```

#### `rest-api`

Creates / Removes a RESTful API.

##### Inputs

| Name      | Description                                                                | Type   |
| --------- | -------------------------------------------------------------------------- | ------ |
| `gateway` | The component name of the gateway which should be used (e.g. `apigateway`) | String |
| `routes`  | The routes this RESTful API should expose                                  | Object |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: rest-api

inputs:
  gateway: apigateway
  routes:
    users:
      post:
        cors: true
        fn: createUser
      get:
        fn: getUser
      put:
        fn: updateUser
      delete:
        fn: deleteUser
```

#### `s3`

Creates / Removes an AWS S3 bucket.

##### Inputs

| Name   | Description     | Type   |
| ------ | --------------- | ------ |
| `name` | The bucket name | String |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: s3

inputs:
  name: default-bucket-name
```

#### `s3-downloader`

Creates / Removes a component which makes it possible to listen to a "file uploaded" event and log the event data in a DynamoDB table.

##### Inputs

| Name   | Description                 | Type   |
| ------ | --------------------------- | ------ |
| `name` | The name for this component | String |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

**Note:** This example re-uses other components.

```yml
type: s3-downloader

inputs:
  name: some-name

components:
  downloaderLambda:
    type: lambda
    inputs:
      name: ${parent:name}
      handler: downloader.handler
      env:
        EVENT_GATEWAY_APIKEY: ${EVENT_GATEWAY_API_KEY}
        FILES_TABLE: some-dynamodb-table
  downloaderSubscription:
    type: eventgateway
    inputs:
      event: fileUploaded
      space: s3-downloader
      eventGatewayApiKey: s0m33v3ntg4t3w4y4p1k3y
      lambdaArn: ${downloaderLambda:arn}
```

#### `s3-prototype`

Creates / Removes a component which wraps the, [`s3`](#s3), [`dynamodb`](#dynamodb), [`s3-downloader`](#s3-downloader) and [`s3-uploader`](#s3-uploader) components and creates an endpoint where files can be uploaded via the Event Gateway to an AWS S3 bucket. Once uploaded, meta information about the file will be logged in a DynamoDB table.

##### Inputs

* None

##### Commands

* `proto deploy`
* `proto remove`

##### Example

**Note:** This example re-uses other components.

```yml
type: s3-prototype

components:
  filesBucket:
    type: s3
    inputs:
      name: some-s3-bucket
  filesTable:
    type: dynamodb
    inputs:
      name: some-dynamodb-table
  downloader:
    type: s3-downloader
    inputs:
      name: some-s3-downloader
  uploader:
    type: s3-uploader
    inputs:
      name: some-s3-uploader
```

#### `s3-uploader`

Creates / Removes a component which makes it possible to upload files via the Event Gateway and store them in an AWS S3 bucket.

##### Inputs

| Name   | Description                 | Type   |
| ------ | --------------------------- | ------ |
| `name` | The name for this component | String |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: s3-uploader

inputs:
  name: some-name

components:
  uploaderLambda:
    type: lambda
    inputs:
      name: ${parent:name}
      handler: uploader.handler
      env:
        EVENT_GATEWAY_APIKEY: ${EVENT_GATEWAY_API_KEY}
        BUCKET: some-s3-bucket
  uploaderSubscription:
    type: eventgateway
    inputs:
      event: http
      method: POST
      path: ${parent:name}
      space: s3-uploader
      eventGatewayApiKey: s0m33v3ntg4t3w4y4p1k3y
      lambdaArn: ${uploaderLambda:arn}
```
