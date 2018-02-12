# Goals

- [x] **Component Lifecycle Management**
- [x] **Component Composability & Reusability**
- [x] **Custom Lifecycle Extension**

# Table of Contents
1. [Quick Start](#quick-start)
    1. [Setup](#1-setup)
    2. [Deploy](#2-deploy)
    3. [Update](#3-update)
    4. [Test](#4-test)
    5. [Remove](#5-remove)
2. [Concepts](#concepts)
    1. [Component](#component)
    2. [Inputs](#inputs)
    3. [Outputs](#outputs)
    4. [State](#state)
    5. [Variables](#variables)
    6. [Graph](#graph)
    7. [Custom Commands](#custom-commands)
2. [Next Steps](#next-steps)

# Quick Start
**Requires: Node 8+**

## 1. Setup

```
# 1. Clone the repo
git clone https://github.com/serverless/components-eslam
cd components-eslam

# 2. Install the CLI
npm i -g

# 3. Setup the environment
export GITHUB_TOKEN="abc"
export AWS_ACCESS_KEY_ID="fgh"
export AWS_SECRET_ACCESS_KEY="xyz"

# 4. Navigate to the github-webhook-receiver example to start playing!
cd examples/github-webhook-receiver
```

## 2. Deploy

```
proto deploy
```
This will provision all components in parallel whenever possible using a dependency graph.

## 3. Update

Change some of the inputs in `serverless.yml`, then deploy again. For example:

- change the github webhook event
- change the lambda or table name name
- change the lambda memory or timeout
- change the apigateway method or path

This will trigger an update only on the components affected by the updates you made. Please keep in mind that validation & error handling are still not that great, So please be gentle ;)

```
proto deploy
```

## 4. Test

I've already added a custom command named `components test` by creating a `test.js` file in the current working directory. it looks like this.

```js

const axios = require('axios')

module.exports = async (inputs, state) => {
  console.log(`Testing Endpoint: ${state.url}`)

  try {
    const res = await axios({
      method: 'post',
      url: state.url,
      data: {}
    })
    console.log('')
    console.log('Result:')
    console.log(res.data)
  } catch (e) {
    throw new Error(e)
  }
}


```

Then run `proto test`. You can add another one under a different name.

## 5. Remove

Destroy everything!!

```
proto remove
```

# Concepts

## Component
A component is the smallest unit of abstraction for your infrastructure. It could be a single small piece like an IAM role, or a larger piece that includes other small pieces, like github-webhook-receiver, which includes lambda (which itself includes iam), apigateway (which also includes iam), dynamodb, and github-webhook. So components could be composed with each other in a component dependency graph to build larger components.

You define a component using two files: `serverless.yml` for config, and `index.js` for the provisioning logic. The `index.js` file exports a **single function** that takes two arguments: inputs & state. However, this `index.js` file is optional, since your component could just be a composition of other smaller components without provisioning logic on its own. `github-webhook-receiver` is a good example of this.

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
      method: POST
      path: /github/webhook
      lambda: ${myFunction:arn}
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
module.exports = async (inputs, state) => {
  /*
   * your provisioning logic goes here
   */

  return {} // outputs
}

```
## Inputs
Inputs are the configuration that are supplied to your component logic by the user. You supply those inputs in `serverless.yml`:

```yml
type: github-webhook-receiver

inputs:
  firstInput: hello
  secondInput: world
```

Or, if the component is being used as a child of another parent component, like the lambda component, the parent could supply those inputs, and they would overwrite the default inputs that are defined at the child level.

So, if the lambda `serverless.yml` looks like this:

```yml
type: lambda

inputs:
  memory: 128
  timeout: 10
```

and github-webhook-receiver `serverless.yml` looks like this:

```yml
type: github-webhook-receiver

components:
  myFunction:
    type: lambda
    inputs:
      memory: 512
      timeout: 300
```
Then your deployed lambda function would have a memory of 512, and timeout of 300.

## Outputs
Your provisioning logic, or your `index.js` file, can optionally return an outputs object. This output can be referenced in `serverless.yml` as inputs to another component.


## State
State is simply the inputs and outputs of the last operation. It represents a historical snapshot of what happened last time you ran `deploy` or `remove`.

The provisioning logic can use this state object and compare it with the current inputs, to make decisions whether to deploy, update, or remove.

The operation that needs to be done depends on the inputs and how the provider works. Change in some inputs for some provider could trigger a create/remove, while other inputs might trigger an update. It's up to the component to decide.

Here's an example on how the lambda component decides what needs to be done based on the inputs and state:

```js

module.exports = async (inputs, state) => {
  let outputs
  if (inputs.name && !state.name) {
    console.log(`Creating Lambda: ${inputs.name}`)
    outputs = await create(inputs)
  } else if (state.name && !inputs.name) {
    console.log(`Removing Lambda: ${state.name}`)
    outputs = await remove(state.name)
  } else if (inputs.name !== state.name) {
    console.log(`Removing Lambda: ${state.name}`)
    await remove(state.name)
    console.log(`Creating Lambda: ${inputs.name}`)
    outputs = await create(inputs)
  } else {
    console.log(`Updating Lambda: ${inputs.name}`)
    outputs = await update(inputs)
  }
  return outputs
}
```

## Variables
The framework supports variables from two sources:

- **Environment Variables:** for example, ${GITHUB_TOKEN}
- **Output:** for example: `${myEndpoint.url}`, where `myEndpoint` is the component alias as defined in `serverless.yml`, and `url` is a property in the outputs object that is returned from the `myEndpoint` provisioning function.

## Graph
When you start composing components together, and each of those components use other nested components, and all those components depend on each other with variable references, you end up with a graph of components.

Internally, the framework constructs this dependency graph by analysing the entire component structure and their variable references. With this dependency graph the framework is able to provision the required components in parallel whenever they don't depend on each other, while holding on other components that depend on components that haven't been provisioned yet.

The component author doesn't have to worry about this graph at all. He just uses variables to reference the outputs he wants and it'll just work.

## Custom Commands
Other than the built in `deploy` and `remove` commands, you can add custom commands to add extra management for your component lifecycle. You do so by adding a JS file in the current working directory named after the command you're creating. Just like the `index.js` file, it accepts inputs, and state as arguments

It looks something like this:


```js
module.exports = async (inputs, state) => {
  /*
   * Custom lifecyle logic here
   */
  console.log(`Testing endpoint: ${state.url}`)

  return {}
}

```

# Next Steps
With this MVP, all 3 goals are now acheived, however it still has some limitations, which I will address in the upcoming days:

- Errors & Validation. Components are now fragile. I need to add some validation to make sure everything deploys smoothly.
- Embrace Failure. Even after validation, I can't expect what could happen at the provider level. So I'd like to assume that failures would happen and come up with a responding strategy to make the implementation more robust.
- Abstract operation routing. Each component decides what needs to be done based on inputs/state. After writing many components, I started to see some paterns that maybe I could abstract and handle at the framework level, enabling the user to only provide the provisioning logic for the three main operations (deploy, update and remove), and letting the framework magically decide what needs to be done.
