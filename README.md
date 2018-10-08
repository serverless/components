![serverless components logo](https://s3.amazonaws.com/assets.github.serverless/serverless-components-readme-2.gif)

[We're Hiring!](https://serverless.com/company/jobs/) •
[Newsletter](http://eepurl.com/b8dv4P) • [Forum](http://forum.serverless.com) • [Meetups](https://github.com/serverless/meetups) • [Twitter](https://twitter.com/goserverless)

## Overview

### Easy

A Serverless Component can package _cloud/SaaS services_, _logic_ & _automation_ into a simple building block you can use to build applications more easily than ever.

### Composable

Serverless Components can be combined & nested. Reuse their functionality to build applications faster. Combine and nest them to make higher-order components, like features or entire applications.

### Open

Serverless Components are 100% open-source & vendor-agnostic. You choose the services that best solve your problem, instead of being limited and locked into one platform.

### Serverless

Serverless Components can deploy anything, but they're biased toward SaaS & cloud infrastructure with "serverless" qualities (auto-scaling, pay-per-use, zero-administration), so you can deliver apps with the lowest total cost & overhead.

![serverless components overview](https://s3.amazonaws.com/assets.github.serverless/serverless-components-overview-2.gif)

## Example

This example shows how an entire retail application can be assembled from components available. It provides the static frontend website, the REST API supporting the frontend and the database backing the REST API. Checkout the full example [here](./examples/retail-app).

```yaml
type: retail-app

components:
  webFrontend:
    type: static-website
    inputs:
      name: retail-frontend
      contentPath: ${self.path}/frontend # define where to find the static files
      # mustache templating is built in to the static-website component
      templateValues:
        apiUrl: ${productsApi.url}
      contentIndex: index.html

  productsApi:
    type: rest-api
    inputs:
      gateway: aws-apigateway
      routes:
        /products: # routes begin with a slash
          post: # HTTP method names are used to attach handlers
            function: ${createProduct}
            cors: true

          # sub-routes can be declared hierarchically
          /{id}: # path parameters use curly braces
            get:
              function: ${getProduct}
              cors: true # CORS can be allowed with this flag

        # multi-segment routes can be declared all at once
        /catalog/{...categories}: # catch-all path parameters use ellipses
          get:
            function: ${listProducts}
            cors: true

  createProduct:
    type: aws-lambda
    inputs:
      handler: products.create
      root: ${self.path}/code
      env:
        productTableName: products-${self.appId}
  getProduct:
    type: aws-lambda
    inputs:
      handler: products.get
      root: ${self.path}/code
      env:
        productTableName: products-${self.appId}
  listProducts:
    type: aws-lambda
    inputs:
      handler: products.list
      root: ${self.path}/code
      env:
        productTableName: products-${self.appId}

  productsDb:
    type: aws-dynamodb
    inputs:
      region: us-east-1
      tables:
        - name: products-${self.appId}
          hashKey: id
          indexes:
            - name: ProductIdIndex
              type: global
              hashKey: id
          schema:
            id: number
            name: string
            description: string
            price: number
          options:
            timestamps: true
```

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![Build Status](https://travis-ci.org/serverless/components.svg?branch=master)](https://travis-ci.org/serverless/components)
[![npm version](https://badge.fury.io/js/serverless-components.svg)](https://badge.fury.io/js/serverless-components)
[![dependencies](https://img.shields.io/david/serverless/serverless-components.svg)](https://www.npmjs.com/package/serverless-components)
[![license](https://img.shields.io/npm/l/serverless-components.svg)](https://www.npmjs.com/package/serverless-components)

[Website](http://www.serverless.com) • [Slack](https://join.slack.com/t/serverless-contrib/shared_invite/enQtNDI4MjM3MTIwMTgzLTE3Y2RkOTY1YTY1MTE0ZjA0YTBhYjA2NzNiMGUwODNlYWFjNjE3YTE1OGFjZjFiNmE1NTgzM2NjYzc5ZTNhM2Q) • [Newsletter](http://eepurl.com/b8dv4P) • [Forum](http://forum.serverless.com) • [Meetups](http://serverlessmeetups.com) • [Twitter](https://twitter.com/goserverless) • [We're Hiring](https://serverless.com/company/jobs/)

Also please do join the _Components_ channel on our public [Serverless-Contrib Slack](https://serverless-contrib.slack.com/messages/C9U3RA55M) to continue the conversation.

## Table of Contents

* [Getting Started](#getting-started)
* [Trying it out](#trying-it-out)
* [Current Limitations](#current-limitations)
* [Concepts](#concepts)
  * [Components](#components)
  * [Composition](#composition)
  * [Input types & Inputs](#input-types--inputs)
  * [Output types & Outputs](#output-types--outputs)
  * [State](#state)
  * [Variables](#variables)
  * [Setting Environment Variables](#env-variables)
  * [Graph](#graph)
  * [Custom commands](#custom-commands)
  * [Registry](#registry)
* [Creating Components](#creating-components)
  * [Basic setup](#basic-setup)
  * [`serverless.yml`](#serverless.yml)
  * [`index.js`](#index.js)
  * [Testing](#testing)
* [Docs](#docs)
  * [CLI Usage](#cli-usage)
    * [deploy](#deploy)
    * [info](#info)
    * [remove](#remove)
  * [Programmatic usage](#programmatic-usage)
    * [deploy](#deploy)
    * [package](#package)
    * [remove](#remove)
  * [Component Docs](#component-docs)
    * [aws-apigateway](./registry/aws-apigateway)
    * [aws-cloudfront](./registry/aws-cloudfront)
    * [aws-dynamodb](./registry/aws-dynamodb)
    * [aws-iam-policy](./registry/aws-iam-policy)
    * [aws-iam-role](./registry/aws-iam-role)
    * [aws-lambda](./registry/aws-lambda)
    * [aws-route53](./registry/aws-route53)
    * [aws-s3-bucket](./registry/aws-s3-bucket)
    * [aws-sns-platform-application](./registry/aws-sns-platform-application)
    * [aws-sns-platform-endpoint](./registry/aws-sns-platform-endpoint)
    * [aws-sns-subscription](./registry/aws-sns-subscription)
    * [aws-sns-topic](./registry/aws-sns-topic)
    * [docker-image](./registry/docker-image)
    * [eventgateway](./registry/eventgateway)
    * [github-webhook](./registry/github-webhook)
    * [github-webhook-aws](./registry/github-webhook-aws)
    * [mustache](./registry/mustache)
    * [netlify-site](./registry/netlify-site)
    * [rest-api](./registry/rest-api)
    * [s3-dirloader](./registry/s3-dirloader)
    * [s3-downloader](./registry/s3-downloader)
    * [s3-policy](./registry/s3-policy)
    * [s3-sync](./registry/s3-sync)
    * [s3-uploader](./registry/s3-uploader)
    * [s3-website-config](./registry/s3-website-config)
    * [static-website](./registry/static-website)
* [Examples](#examples)
  * [Basic Lambda Example](./examples/basic)
  * [Blog Example](./examples/blog)
  * [Github Webhook Example](./examples/basic)
  * [Landing Page Example](./examples/landing-page)
  * [Netlify Site Example](./examples/netlify-site-example)
  * [Rest API Example](./examples/restapi)
  * [Retail App](./examples/retail-app)

## Getting Started

**Note:** Make sure you have Node.js 8+ and npm installed on your machine.

1.  `npm install --global serverless-components`
1.  Setup the environment variables
    * `export AWS_ACCESS_KEY_ID=my_access_key_id`
    * `export AWS_SECRET_ACCESS_KEY=my_secret_access_key`

Run commands with:

```
components [Command]
```

Checkout the [CLI docs](#cli-usage) for a list of all the available commands and instructions on how they work.

## Trying it out

The best way to give components a try is to deploy one of the examples. We recommend checking out our [retail-app example](./examples/retail-app) and to follow along with the instructions there.

## Current Limitations

The following is a list with some limitations one should be aware of when using this project.
**NOTE:** We're currently working on fixes for such issues and will announce them in our release notes / changelogs.

### `us-east-1` only

Right now the only supported region is `us-east-1`

### No rollback support

Rolling back your application into the previous, stable state is currently not supported.

However the framework ensures that your state file always reflects the correct state of your infrastructure setup (even if something goes wrong during deployment / removal).

## Concepts

### Components

A component is the smallest unit of abstraction for your infrastructure. It can be a single small piece like an IAM role, or a larger piece that includes other small pieces, like [`github-webhook-receiver`](#github-webhook-receiver), which includes `aws-lambda` (which itself includes `aws-iam-role`), `aws-apigateway` (which also includes `aws-iam-role`), `aws-dynamodb`, and `github-webhook`. So components can be composed with each other in a component dependency graph to build larger components.

You define a component using two files: `serverless.yml` for config, and `index.js` for the provisioning logic.

The `index.js` file exports a `deploy` function and a `remove` function, both of which take two arguments: `inputs` and `context`. Each exported function name reflects the CLI command which will invoke it (the `deploy` function will be executed when one runs `components deploy`).

These two files look something like this:

**serverless.yml**

```yaml
type: my-component

inputTypes: # type descriptions for inputs that my-component expects to receive
  name:
    type: string
    required: true
  age:
    type: number
    required: false
    default: 47
```

**index.js**

```js
const deploy = (inputs, context) => {
  // provisioning logic goes here
}

const remove = (inputs, context) => {
  // de-provisioning logic goes here
}

module.exports = {
  deploy,
  remove
}
```

However, this `index.js` file is optional, since your component can just be a composition of other smaller components without provisioning logic on its own.

### Composition

Components can include other components in order to build up higher level use cases and expose a minimum amount of configuration.

When composing components we simply include them in a `components` property within our own component's or application's `serverless.yml` file. In this example, `my-component` composes an `aws-lambda` and an `aws-iam-role` component.

```yaml
type: my-component

components:
  myFunction:
    type: aws-lambda
    inputs:
      memory: 512
      timeout: 10
      handler: handler.handler
      role:
        arn: ${myRole.arn}
  myRole:
    type: aws-iam-role
    inputs:
      service: lambda.amazonaws.com
```

### Input types & Inputs

#### Input types

Input types are the description of the inputs your component receives. You supply those `inputTypes` in the component's `serverless.yml` file:

```yaml
type: child-component

inputTypes:
  name:
    type: string
    required: true
    default: John
```

Or, if the component is being used as a child of another parent component, the parent will supply `inputs` and they can override the defaults that are defined at the child level:

```yaml
type: parent-component

components:
  myChild:
    type: child-component
    inputs:
      name: Jane  # This overrides the default of "John" from the inputType
```

#### Accessing Input Variables
You can use the child component's inputs as variables in the component's `serverless.yml` file.  For example if the child component had a another child component, you could pass the input as a parameter:

```yaml
type: child-component

inputTypes:
  name:
    type: string
    required: true
    default: John

components:
  function1:
      type: aws-lambda
      inputs:
        name: f1
        description: Example lambda component.
        memory: 512
        timeout: 10
        handler: handler.handler
        runtime: nodejs8.10
        root: '${self.path}'
        role:
          arn: ${myRole.arn}
        env:
          name: ${input.name}
```

#### Inputs

Inputs are the configuration that are supplied to your component's logic by the user. You define these inputs in the `serverless.yml` file where the component is being used:

```yaml
type: my-application

components:
  myFunction:
    type: aws-lambda
    inputs:
      memory: 512 # This input sets the amount of memory the lambda function will use
      timeout: 300 # This input sets the timeout for the aws-lambda function
```

Given this `serverless.yml` you would deploy a `aws-lambda` function with a memory size of 512 and timeout of 300.

### Output types & Outputs

#### Output types

Output types are the description of the outputs your component returns. You supply those `outputTypes` in the component's `serverless.yml` file:

```yaml
type: aws-lambda

outputTypes:
  name:
    type: string
  arn:
    type: string
```

#### Outputs

Your provisioning logic, or the `deploy` method of your `index.js` file, should return an `outputs` object that matches the outputTypes declared in your component's `serverless.yml` file. This output can be referenced in `serverless.yml` as inputs to other components.

For example, the above `aws-lambda` component's `deploy` method returns outputs that look like this:

**index.js**

```js
const deploy = (inputs, context) => {
  // lambda provisioning logic
  const res = doLambdaDeploy()

  // return outputs
  return {
    arn: res.FunctionArn,
    name: res.FunctionName
  }
}

module.exports = {
  deploy
}
```

These outputs can then be referenced by other components. In this example, we reference the function `arn` and pass it in to the `aws-apigateway` component to set up a handler for the route. Note that we use the component's alias `myFunction` to reference the `arn` output, i.e. `${myFunction.arn}`

```yaml
type: my-application

components:
  myFunction:
    type: aws-lambda
    inputs:
      handler: code.handler
  myEndpoint:
    type: aws-apigateway
    inputs:
      routes:
        /github/webhook:
          post:
            lambdaArn: ${myFunction.arn}
```

### State

State can be accessed via the `context` object and represents a historical snapshot of what happened the last time you ran a command such as `deploy`, `remove`, etc.

The provisioning logic can use this state object and compare it with the current inputs to make decisions around whether to run deploy, update or remove.

The operation that will be fired depends on the inputs and how the provider works. Change in some inputs for some provider could trigger a create / remove while other inputs might trigger an update. It's up to the component to decide.

Here's an example demonstrating how a lambda component decides what needs to be done based on the `inputs` and `state` objects:

```js
const deploy = async (inputs, context) => {
  let outputs
  if (inputs.name && !context.state.name) {
    console.log(`Creating Lambda: ${inputs.name}`)
    outputs = await create(inputs)
  } else if (context.state.name && !inputs.name) {
    console.log(`Removing Lambda: ${context.state.name}`)
    outputs = await remove(context.state.name)
  } else if (inputs.name !== context.state.name) {
    console.log(`Removing Lambda: ${context.state.name}`)
    await remove(context.state.name)
    console.log(`Creating Lambda: ${inputs.name}`)
    outputs = await create(inputs)
  } else {
    console.log(`Updating Lambda: ${inputs.name}`)
    outputs = await update(inputs)
  }
  return outputs
}

module.exports = {
  deploy
}
```

### Variables

The framework supports variables from the following sources:

* **Environment Variables:** for example, `${env.GITHUB_TOKEN}`
* **Output:** for example: `${myEndpoint.url}`, where `myEndpoint` is the component alias as defined in `serverless.yml`, and `url` is a property in the outputs object that is returned from the `myEndpoint` provisioning function.
* **Self:** for example, `${self.path}/frontend`, where `self.path` evaluates to the absolute path of the component's root folder.

### Setting Environment Variables

The framework supports two types of environment variables:

* **.env File:** Create a .env file in the root directory of your project. Add environment-specific variables on new lines in the form of NAME=VALUE. For example:

```
SOME_ENV=foo
```

* **CLI** Running the command like this:

```
SOME_ENV=foo components deploy
```

### Graph

Once you start composing components together with multiple levels of nesting, and all of these components depend on one another with variable references, you then end up with a graph of components.

Internally, the framework constructs this dependency graph by analyzing the entire component structure and their variable references. With this dependency graph the framework is able to provision the required components in parallel whenever they either don't depend on each other, or are waiting on other components that haven't been provisioned yet.

The component author / user doesn't have to worry about dependencies at all. They just use variables to reference the outputs as needed and it just works.

### Custom Commands

Other than the built in `deploy` and `remove` commands, you can also include custom commands to add extra management capability for your component lifecycle. This is achieved by adding a corresponding function to the `index.js` file, just like the other functions in `index.js`.

As usual, the `test` function receives `inputs` and `context` as parameters:

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

### Registry

The [Serverless Registry](./registry) is a core part of the components implementation as it makes it possible to discover, publish and share existing components. For now, `components` registry ships with a number of built-in components that are usable by their `type` name.

The registry is not only limited to serving components. Since components are functions, it's possible to wrap existing business logic into functions and publish them to the registry as well.

Looking into the future, it will be even possible to serve functions which are written in different languages through the registry.

## Creating Components

Here is a quick guide to help you kick-start your component development.

**Note:** Make sure to re-visit the [core concepts](#concepts) above, before you jump right into the component implementation.

### Basic setup

In this guide we'll build a simple `greeter` component which will greet us with a custom message when we run the `deploy`, `greet` or `remove` commands.

First, we need to create a dedicated directory for our component. This directory will include all the necessary files for our component, like its `serverless.yml` file, the `index.js` file (which includes the component's logic), and files such as `package.json` to define it's dependencies.

Go ahead and create a `greeter` directory in the "Serverless Registry" directory located at [`registry`](./registry).

### `serverless.yml`

Let's start by describing our components interface. We define the interface in the `serverless.yml` file. Create this file in the components directory and paste in the following content:

```yaml
type: greeter

inputTypes:
  firstName:
    type: string
    required: true
  lastName:
    type: string
    required: true
```

Let's take a closer look at the code we've just pasted. At first, we define the `type` (think of it as an identifier or name) of the component. In our case the component is called `greeter`.

Next up, we need to declare the `inputTypes` our component has. `inputTypes` define the shape of our inputs and are accessible from within the component's logic. In our case we expect a `firstName` and a `lastName`.

That's it for the component definition. Let's move on to its implementation logic.

### `index.js`

The component's logic is implemented with the help of an `index.js` file which is located in the root of the components directory. Go ahead and create an empty `index.js` file in the component's root directory.

Then we'll implement the logic for the `deploy`, `greet` and `remove` commands. We do this by adding the respective functions into the file and exporting them so that the framework CLI can pick them up (_Remember:_ only the exported functions are accessible via CLI commands).

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
  context.saveState()
}

module.exports = {
  deploy,
  greet,
  remove
}
```

Let's take a closer look at the implementation.

Right at the top we've defined a "helper" function we use to reduce code duplication (this function is not exported at the bottom and can therefore only be used internally). This `greetWithFullName` function gets `inputs` and `context`, and then logs a message which greets the user with his full name. Note that we're using the `log` function which is available at the `context` object instead of the native `console.log` function. The `context` object has other, very helpful functions and data attached to it.

Next up, we've defined the `deploy` function. This function is executed every time the user runs a `deploy` command since we've exported it at the bottom of the file. At first, we re-use our `greetWithFullName` function to greet our user. Then we check the state to see if we've already deployed it. If this is the case we log out the timestamp of the last deployment. After that we get the current time and store it in an object which includes the `state`, the `inputs` and the new `deployedAt` timestamp. We store this object that reflects our current state. After that we return the object as `outputs`.

The `greet` function is a custom `command` we use to extend the CLI's capabilities. Since we've exported it at the bottom of the file it'll be executed every time someone runs the `greet` command. The functionality is pretty straightforward. We just log out a different greeting using the `context.log` method and the `inputs`.

The last function we've defined in our component's implementation is the `remove` function. The `remove` command is also accessible from the CLI because we export it at the bottom of the file. The function's code is also pretty easy to understand. At first we greet our user using the `greetWithFullName` helper function. Then we log a message that the removal was triggered and store an empty state (meaning that there's no more state information available).

### Testing

Let's test our component!

First of all let's create a new example application which uses our `greeter` component. `cd` into the `examples` directory by running:

```sh
cd examples
```

Create a new directory named `test` which has one `serverless.yml` file with the following content:

```yml
type: my-application

components:
  myGreeter:
    type: greeter
    inputs:
      firstName: John
      lastName: ${env.LAST_NAME}
```

If we take a closer look at the `serverless.yml` file we can see that our `lastName` config value depends on an environment variable called `LAST_NAME` which is fetched from the local environment. This means that we need to export this variable so that the framework can pick it up and pass it down to our `inputs`:

```sh
export LAST_NAME=Doe
```

That's it. Let's take it for a spin. Run the following commands to test the components logic:

```
components deploy

components deploy

components greet

components remove
```

Congratulations! You've successfully created your first Serverless component!

Want to learn more? Make sure to take a look at all the different component implementations in the [Serverless Registry](./registry)!

## Docs

### CLI Usage

#### deploy

To deploy your app, run

```sh
components deploy
```

To update an app at anytime, simply run deploy again

#### info

To get info about a deployed service, run

```sh
components info
```

#### remove

To remove your app, run

```sh
components remove
```

### Programmatic Usage

Aside from using Serverless Components via the CLI you can also use the Framework programmatically.

Different commands are available via an exposed API.

You can use an existing Serverless Components project by providing the `projectPath` option or you can define the structure
of your `serverless.yml` file on the fly using the `serverlessFileObject` option:

```js
const path = require('path')
const { pkg, deploy, remove } = require('serverless-components')

const projectPath = path.join('my', 'project')

async function withProjectPath() {
  console.log('Packaging service...')
  await pkg({ projectPath, path: projectPath })
  console.log('Deploying service...')
  await deploy({ projectPath })
  console.log('Re-deploying service...')
  await deploy({ projectPath })
  console.log('Removing service...')
  await remove({ projectPath })
}

async function withServerlessFileObject() {
  const serverlessFileObject = {
    type: 'my-app',
    version: '0.1.0',
    components: {
      myRole: {
        type: 'tests-integration-iam-mock',
        inputs: {
          name: 'my-role-name',
          service: 'my.function.service'
        }
      }
    }
  }

  console.log('Deploying service...')
  await deploy({ serverlessFileObject })
  console.log('Re-deploying service...')
  await deploy({ serverlessFileObject })
  console.log('Removing service...')
  await remove({ serverlessFileObject })
}

Promise.resolve()
  .then(withProjectPath)
  .then(withServerlessFileObject)
```

#### deploy

The `deploy` API makes it possible to deploy a service.

`await deploy(options)`

Options:

* `projectPath` - `string` - Path to the root of the project (defaults to `cwd`)
* `serverlessFileObject` - `object` - The `serverless.yml` file representation as an object

#### package

The `pkg` API makes it possible to package a project which creates a deployment artifact.

`await pkg(options)`

Options:

* `projectPath` - `string` - Path to the root of the project (defaults to `cwd`)
* `serverlessFileObject` - `object` - The `serverless.yml` file representation as an object
* `path` - `string` - Path to the project where the `serverless.yml` file can be found
* `format` - `string` - The desired file format (`zip` or `tar`)

#### remove

The `remove` API makes it possible to remove a deployed service.

`await remove(options)`

Options:

* `projectPath` - `string` - Path to the root of the project (defaults to `cwd`)
* `serverlessFileObject` - `object` - The `serverless.yml` file representation as an object

### Component Docs

* [aws-apigateway](./registry/aws-apigateway)
* [aws-cloudfront](./registry/aws-cloudfront)
* [aws-dynamodb](./registry/aws-dynamodb)
* [aws-iam-policy](./registry/aws-iam-policy)
* [aws-iam-role](./registry/aws-iam-role)
* [aws-lambda](./registry/aws-lambda)
* [aws-route53](./registry/aws-route53)
* [aws-s3-bucket](./registry/aws-s3-bucket)
* [eventgateway](./registry/eventgateway)
* [github-webhook](./registry/github-webhook)
* [github-webhook-aws](./registry/github-webhook-aws)
* [github-webhook-receiver](./registry/github-webhook-receiver)
* [mustache](./registry/mustache)
* [netlify-site](./registry/netlify-site)
* [rest-api](./registry/rest-api)
* [s3-dirloader](./registry/s3-dirloader)
* [s3-downloader](./registry/s3-downloader)
* [s3-policy](./registry/s3-policy)
* [s3-sync](./registry/s3-sync)
* [s3-uploader](./registry/s3-uploader)
* [s3-website-config](./registry/s3-website-config)
* [static-website](./registry/static-website)

## Examples

* [Basic Lambda Example](./examples/basic)
* [Blog Example](./examples/blog)
* [Github Webhook Example](./examples/github-webhook-example)
* [Landing Page Example](./examples/landing-page)
* [Netlify Site Example](./examples/netlify-site-example)
* [Rest API Example](./examples/restapi)
* [Retail App](./examples/retail-app)
