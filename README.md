![serverless components logo](https://s3.amazonaws.com/assets.github.serverless/serverless-components-readme3.png)

This project is a prototype of a new concept Serverless has been exploring called "components". Our aim is to introduce highly configurable and composable pieces that allow for multi-cloud & third party resource use cases.

Components are capable of provisioning infrastructure while including both application logic AND lifecycle management. They have a focus on serverless/cloud resources and they also greatly enable reuse, sharing and simplicity.

## Table of contents

* [Getting started](#getting-started)
* [Concepts](#concepts)
  * [Components](#components)
  * [Inputs & Outputs](#inputs-outputs)
  * [State](#state)
  * [Variables](#variables)
  * [Graph](#graph)
  * [Custom commands](#custom-commands)
  * [Registry](#registry)
* [Creating components](#creating-components)
  * [Basic setup](#basic-setup)
  * [`serverless.yml`](#serverless.yml)
  * [`index.js`](#index.js)
  * [Testing](#testing)
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
1. `npm install --global serverless-components`
1. Setup the environment variables
   * `export AWS_ACCESS_KEY_ID=my_access_key_id`
   * `export AWS_SECRET_ACCESS_KEY=my_secret_access_key`

## Running Locally

Run commands with

```
components [Command]
```

## Concepts

### Components

A component is the smallest unit of abstraction for your infrastructure. It could be a single small piece like an IAM role, or a larger piece that includes other small pieces, like [`github-webhook-receiver`](#github-webhook-receiver), which includes `lambda` (which itself includes `iam`), `apigateway` (which also includes `iam`), `dynamodb`, and `github-webhook`. So components could be composed with each other in a component dependency graph to build larger components.

You define a component using two files: `serverless.yml` for config, and `index.js` for the provisioning logic.

The `index.js` file exports multiple functions that take two arguments: `inputs` and `context`. Each exported function name reflects the CLI command which will invoke it (the `deploy` function will be executed when one runs `proto deploy`).

However, this `index.js` file is optional, since your component could just be a composition of other smaller components without provisioning logic on its own. [`github-webhook-receiver`](#github-webhook-receiver) is a good example of this.

This component has only a `serverless.yml` and no provisioning logic in the `index.js` file.

**serverless.yml**

```yml
type: github-webhook-receiver


inputs:
  url: ${myEndpoint.outputs.url} # Variable from another component output

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
            lambdaArn: ${myFunction.outputs.arn}
  myGithubWebhook:
    type: github
    inputs:
      token: ${GITHUB_TOKEN} # Variable from env var
      owner: serverless
      repo: components-eslam
      url: ${myEndpoint.outputs.url}
      event: pull_request
```

**index.js**

```js
const deploy = (inputs, context) => {
  // provisioning logic goes here
}

module.exports = {
  deploy // this is the command name which is exposed via the CLI
}
```

### Registry

The ["Serverless Registry"](./registry) is a core part in this implementation since it makes it possible to discover, publish and share existing components.

The registry is not only constrained to serve components. Since components are functions it's possible to wrap existing business logic into functions and publish them to the registry as well.

Looking into the future it could be possible to serve functions which are written in different languages through the registry.


### Inputs & Outputs

#### Inputs

Inputs are the configuration that are supplied to your component logic by the user. You supply those inputs in `serverless.yml`:

```yml
type: some-component

inputs:
  firstInput: 
    displayName: "The first input"
    type: string
    required: true
    default: 'foo value'
    
  secondInput: number  # short hand 
```

Or, if the component is being used as a child of another parent component, like the `lambda` component, the parent could supply those inputs, and they would overwrite the default inputs that are defined at the child level.

So, if the lambda `serverless.yml` looks like this:

```yml
type: lambda

inputs:
  memory: 
    displayName: "The amount of memory to provide to the lambda function"
    type: number
    required: true
    default: 128
  timeout:
    displayName: "The timeout of the function in seconds"
    type: number
    required: true
    default: 10
```

a `serverless.yml` which uses lambda could look like this:

```yml
type: my-component

components:
  myFunction:
    type: lambda
    inputs:
      memory: 512
      timeout: 300
```

Then your deployed `lambda` function would have a memory size of 512, and timeout of 300.


#### Outputs

Your provisioning logic, or the `deploy` method of your `index.js` file, can optionally return an outputs object. This output can be referenced in `serverless.yml` as inputs to another component.

For example, the lambda component's deploy method returns outputs that look like this...
**index.js**

```js
const deploy = (inputs, context) => {
  // lambda provisioning logic
  
  // return outputs
  return {   
    arn: res.FunctionArn
  }
}

module.exports = {
  deploy
}
```

These outputs can then be referenced by other components such as in this example we reference the function arn and pass it in to the apigateway component to setup a handler for the route.
```yml
type: my-component

components:
  myFunction:
    type: lambda
    inputs:
      handler: code.handler
  myEndpoint:
    type: apigateway
    inputs:
      routes:
        /github/webhook:
          post:
            lambdaArn: ${myFunction.outputs.arn}
```

### State

State can be accessed at via the `context` object and represents a historical snapshot of what happened last time you ran a command such as `deploy`, `remove`, etc.

The provisioning logic can use this state object and compare it with the current inputs, to make decisions whether to deploy, update, or remove.

The operation that needs to be done depends on the inputs and how the provider works. Change in some inputs for some provider could trigger a create / remove, while other inputs might trigger an update. It's up to the component to decide.

Here's an example on how the lambda component decides what needs to be done based on the inputs and state:

```js
const deploy = (inputs, context) => {
let outputs;
  if (inputs.name && !context.state.name) {
    console.log(`Creating Lambda: ${inputs.name}`);
    outputs = await create(inputs);
  } else if (context.state.name && !inputs.name) {
    console.log(`Removing Lambda: ${context.state.name}`);
    outputs = await remove(context.state.name);
  } else if (inputs.name !== context.state.name) {
    console.log(`Removing Lambda: ${context.state.name}`);
    await remove(context.state.name);
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
* **Output:** for example: `${myEndpoint.outputs.url}`, where `myEndpoint` is the component alias as defined in `serverless.yml`, and `url` is a property in the outputs object that is returned from the `myEndpoint` provisioning function.

### Graph

When you start composing components together, and each of those components use other nested components, and all those components depend on each other with variable references, you end up with a graph of components.

Internally, the framework constructs this dependency graph by analyzing the entire component structure and their variable references. With this dependency graph the framework is able to provision the required components in parallel whenever they don't depend on each other, while waiting on other components that depend on components that haven't been provisioned yet.

The component author doesn't have to worry about this graph at all. One just uses variables to reference the outputs which should be used and it'll just work.

### Custom Commands

Other than the built in `deploy` and `remove` commands, you can add custom commands to add extra management for your component lifecycle. You do so by adding the corresponding function to the `index.js` file. Just like the other functions in `index.js`, it accepts `inputs`, `state`, `context` and `options`.

```js
const deploy = (inputs, context) => {
  // some provisioning logic
}

const test = (inputs, context) => {
  console.log('Testing the components functionality...')
}

module.exports = {
  deploy,
  test // make the function accessible from the CLI
}
```

### Registry (not yet implemented)

The ["Serverless Registry"](./registry) will be a core part in the implementation since it makes it possible to discover, publish and share existing components. For now, `serverless-components` ships with a number of built in components that are usable by type name.

The registry is not only constrained to serve components. Since components are functions it's possible to wrap existing business logic into functions and publish them to the registry as well.

Looking into the future it could be possible to serve functions which are written in different languages through the registry.


## Creating components

A quick guide to help you build your kick-start component development.

**Note:** Make sure to re-visit the [core concepts](#concepts) above before you jump right into the component implementation.

### Basic setup

In this guide we'll build a simple `greeter` component which will greet us with a custom message when we run the `deploy`, `greet` or `remove` commands.

The first step we need to take is to create a dedicated directory for our component. This directory will include all the necessary files for our component like its `serverless.yml` file, the `index.js` file (which includes the components logic) and files such as `package.json` to define its dependencies.

Go ahead and create a `greeter` directory in the "Serverless Registry" directory located at [`registry`](./registry).

### `serverless.yml`

Let's start by describing our components interface. We define the interface with the help of a `serverless.yml` file. Create this file in the components directory and paste in the following content:

```yml
type: greeter

inputs:
  firstName: John
  lastName: ${LAST_NAME}
```

Let's take a closer look at the code we've just pasted. At first we define the `type` (think of it as an identifier or name) of the component. In our case the component is called `greeter`.

Next up we need to define the `inputs` our component receives. `inputs` are values which are accessible from within the components logic. In our case we expect a `firstName` and a `lastName`. The `firstName` is hardcoded to `John`, whereas the `lastName` is retrieved from an environment variables (the `${}` syntax shows us that we're using [variables](#variables) here).

That's it for the component definition. Let's move on to the implementation of its logic.

### `index.js`

The components logic is implemented with the help of an `index.js` file which is located in the root of the components directory. Go ahead and create an empty `index.js` file in the components root directory.

Next up we'll implement the logic for the `deploy`, `greet` and `remove` commands. We do this by adding the respective functions in the file and exporting them so that the Frameworks CLI can pick them up (_Remember:_ only the exported functions are accessible via CLI commands).

Just paste the following code in the `index.js` file:

```js
// "private" functions
function greetWithFullName(inputs, context) {
  context.log(`Hello ${inputs.firstName} ${inputs.lastName}!`)
}

// "public" functions
function deploy(inputs, context) {
  greetWithFullName(inputs, context)

  if (context.state.deployedAt) {
    context.log(`Last deployment: ${context.state.deployedAt}...`)
  }

  const deployedAt = new Date().toISOString()

  const updatedState = {
    ...context.state,
    ...inputs,
    deployedAt
  }
  context.saveState(updatedState)

  return updatedState
}

function greet(inputs, context) {
  context.log(`Hola ${inputs.firstName} ${inputs.lastName}!`)
}

function remove(inputs, context) {
  greetWithFullName(inputs, context)
  context.log('Removing...')
}

module.exports = {
  deploy,
  greet,
  remove
}
```

Let's take a closer look at the implementation.

Right at the top we've define a "helper" function (this function is not exported at the bottom and can therefore only used internally) we use to reduce code duplication. this `greetWithFullName` function gets the `inputs` and the `context` and logs a message which greets the user with his full name. Note that we're using the `log` function which is available at the `context` object instead of the native `console.log` function. The `context` object has other, very helpful functions and data attached to it.

Next up we've defined the `deploy` function. This function is executed every time the user runs a `deploy` command since we've exported it at the bottom of the file. At first we re-use our `greetWithFullName` function to greet our user. Next up we check the state to see if we've already deployed previously. If that's the case we log out the timestamp of the last deployment. After that we get the current time and store it in an object which includes the `state`, the `inputs` and the new `deployedAt` timestamp. This object reflects our current state which we store. After that we return the object as outputs.

The `greet` function is a custom `command` function we use to extend the CLIs capabilities. Since we've exported it at the bottom of the file it'll be execute every time someone runs the `greet` command. The functionality is pretty straightforward. We just log out a different greeting using the `context.log` method and the `inputs`.

The last function we've defined in our components implementation is the `remove` function. Remove is also accessible from the CLI because we export it at the bottom of the file. The functions code is also pretty easy to understand. At first we greet our user with the `greetWithFullName` helper function. Next up we log a message that the removal was triggered. That's it.

### Testing

Let's test our component!

If we take another look at the `serverless.yml` file we can see that our `lastName` config value depends on a variable called `LAST_NAME` which is fetched from the local environment. This means that we need to export this variable so that the Framework can pick it up and pass it down into our `inputs`:

```sh
export LAST_NAME=Doe
```

Once this is done we can `cd` into our `greeter` directory by running:

```sh
cd registry/greeter
```

Run the following commands to test the components logic:

```
../../bin/serverless deploy

../../bin/serverless deploy

../../bin/serverless greet

../../bin/serverless remove
```

Congratulations! You've successfully created your first Serverless component!

Want to learn more? Make sure to take a look at all the different component implementations in the ["Serverless Registry"](./registry)!

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
        lambdaArn: arn:aws:lambda:us-east-1:XXXXX:function:some-lambda-function
        cors: true
      get:
        lambdaArn: arn:aws:lambda:us-east-1:XXXXX:function:some-lambda-function
    /hello/world:
      delete:
        lambdaArn: arn:aws:lambda:us-east-1:XXXXX:function:some-lambda-function
```

#### `dynamodb`

Creates / Removes an AWS DynamoDB table.

##### Inputs

See [docs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dynamodb-table.html)

```yml
type: dynamodb

inputs:
  region: string
  DeletionPolicy: string
  Properties:
    AttributeDefinitions:
      - AttributeDefinition
    GlobalSecondaryIndexes:
      - GlobalSecondaryIndexes
    KeySchema:
      - KeySchema
    LocalSecondaryIndexes:
      - LocalSecondaryIndexes
    ProvisionedThroughput:
      ProvisionedThroughput
    SSESpecification:
      SSESpecification
    StreamSpecification:
      StreamSpecification
    TableName: String
    Tags:
      - Resource Tag
    TimeToLiveSpecification:
      TimeToLiveSpecification
```
##### Commands

* `proto deploy`
* `proto remove`

##### Example

[See Default inputs](./registry/dynamodb)

#### `eventgateway`

Creates / Removes an Event Gateway function registration and corresponding subscription.

##### Inputs

| Name                 | Description                                                                    | Type    |
| -------------------- | ------------------------------------------------------------------------------ | ------- |
| `event`              | `http` or a freeform event like `user.created`                                 | String  |
| `path`               | The event path                                                                 | String  |
| `method`             | **Optional** The HTTP method (if the `http` event is used)                     | String  |
| `cors`               | **Optional** If CORS support should be setup                                   | Boolean |
| `space`              | The Event Gateway space which should be used                                   | String  |
| `eventGatewayApiKey` | The Event Gateway API Key which is used to manage configuration on your behalf | String  |
| `lambdaArn`          | The functions runtime                                                          | String  |

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
  cors: true # optional
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

Creates / Removes a RESTful API. Uses the specified gateway component behind the scenes.

##### Inputs

| Name                 | Description                                                                | Type   |
| -------------------- | -------------------------------------------------------------------------- | ------ |
| `gateway`            | The component name of the gateway which should be used (e.g. `apigateway`) | String |
| `eventGatewayApiKey` | **Optional** The Event Gateway API Key                                     | String |
| `space`              | **Optional** The space used by the Event Gateway                           | String |
| `name`               | The APIs name                                                              | String |
| `routes`             | The routes this RESTful API should expose                                  | Object |

##### Commands

* `proto deploy`
* `proto remove`

##### Example

```yml
type: rest-api

inputs:
  gateway: eventgateway
  eventGatewayApiKey: s0m33v3ntg4t3w4y4p1k3y # optional
  space: some-space # optional
  name: some-rest-api
  routes:
    users:
      post:
        lambdaArn: arn:aws:lambda:us-east-1:XXXXX:function:some-lambda-function
        cors: true
      get:
        lambdaArn: arn:aws:lambda:us-east-1:XXXXX:function:some-lambda-function
        cors: true
      put:
        lambdaArn: arn:aws:lambda:us-east-1:XXXXX:function:some-lambda-function
      delete:
        lambdaArn: arn:aws:lambda:us-east-1:XXXXX:function:some-lambda-function
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
