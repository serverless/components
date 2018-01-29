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
    6. [Custom Commands](#custom-commands)
2. [Next Steps](#next-steps)

# Quick Start
**Requires: Node 8+**

## 1. Setup

```
# 1. Clone
git clone https://github.com/serverless/components-eslam
cd components-eslam

# 2. Install all dependencies
npm run setup

# 3. Install The CLI
npm i -g framework # might need sudo

# 4. Setup the environment
export GITHUB_TOKEN="abc"
export AWS_ACCESS_KEY_ID="fgh"
export AWS_SECRET_ACCESS_KEY="xyz"

# 5. navigate to github-webhook-receiver to start playing!
cd github-webhook-receiver@0.0.1
```

## 2. Deploy

```
components deploy
```
This will provision all components, and their sub-components, and their sub components...etc.

## 3. Update

Change some of the inputs in `serverless.yml`, then deploy again. For example:

- change the github webhook event
- change the lambda or table name name
- change the lambda memory or timeout
- change the apigateway method or path

This will trigger an update only on the components affected by the updates you made. Please keep in mind that validation & error handling are still not that great. So please be gentle

```
components deploy
```

## 4. Test

Add a custom command named `components test` by creating a `test.js` file in the current working directory. Looking like this:

```js

module.exports = async (inputs, state) => {
  /*
   * Custom lifecyle logic here
   */
  console.log(`Testing endpoint: ${state.url}`)

  return {}
}

```

Then run `components test`

## 5. Remove

Destroy everything!!

```
components remove
```

# Concepts

## Component
A component is the smallest unit of abstraction for your infrastructure. It could be a single small piece like an IAM role, or a larger piece that includes other small pieces, like github-webhook-receiver, which includes lambda (which itself includes iam), apigateway (which also includes iam), dynamodb, and github-webhook. So components could be composed with each other in a component dependency tree to build larger components.

You define a component using two files: `serverless.yml` for config, and `index.js` for the provisioning logic. The `index.js` file exports a **single function** that takes two arguments: inputs & state. However, this `index.js` file is optional, since your component could just be a composition of other smaller components without provisioning logic on its own.

These two files look something like this:

**serverless.yml**



```yml
name: github-webhook-receiver@0.0.1

inputs: 
  lambdaArn: ${lambda:arn}
  lambdaRoleArn: ${lambda:roleArn}
  apiId: ${apigateway:id
  apiRoleArn: ${apigateway:roleArn}
  url: ${apigateway:url}
  tableName: ${dynamodb:name}
  webhookId: ${github:id}

components:
  dynamodb: # component alias, to be referenced with Variables
    type: dynamodb@0.0.1
    inputs:
      name: github-webhook-receiver
  lambda:
    type: lambda@0.0.1
    inputs:
      name: github-webhook-receiver-2
      memory: 128
      timeout: 10
      handler: code.handler
  apigateway:
    type: apigateway@0.0.1
    inputs:
      name: github-webhook-receiver
      method: POST
      path: /github/webhook
      lambda: ${lambda:arn} # Variable from another component output
  github:
    type: github@0.0.1
    inputs:
      token: ${GITHUB_TOKEN} # Variable from env var
      owner: serverless
      repo: components-eslam
      url: ${apigateway:url}
      event: pull_request
```

**index.js**


```js
module.exports = async (inputs, state) => {
  /*
   * your provisioning logic goes here
   */
  
  const outputs = {}
  return outputs
}

```

### Order of Operation

The parent component is always the last to be provisioned, so that any referenced output from the child components would be resolved first.

For child components, the provisioning order is top to bottom in `serverless.yml`, so any child component can depend on any component output on top of it in `serverless.yml`, but not below.

That's why the github child component in the example above is at the bottom of the list, becasue it depends on APIG, which itself depends on lambda.

## Inputs
Inputs are the configuration that are supplied to your component logic by the user. You supply those inputs in `serverless.yml`:

```yml
name: github-webhook-receiver@0.0.1

inputs:
  firstInput: hello
  secondInput: world
```

Or, if the component is being used as a child of another parent component, like the lambda component, the parent could supply those inputs, and they would overwrite the default inputs that are defined at the child level.

So, if the lambda `serverless.yml` looks like this:

```yml
name: lambda@0.0.1

inputs:
  memory: 128
  timeout: 10
```

and github-webhook-receiver `serverless.yml` looks like this:

```yml
name: github-webhook-receiver@0.0.1

components:
  lambda:
    type: lambda@0.0.1
    inputs:
      memory: 512
      timeout: 300
```
Then your deployed lambda function would have a memory of 512, and timeout of 300.

## Outputs
Your provisioning logic, or your `index.js` file, can optionally return an outputs object. This output can be referenced in `serverless.yml` as inputs to another component.


## State
State is simply the inputs and outputs of the last provision. It represents a historical snapshot of what happened last time you ran `deploy` or `remove`.

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
- **Output:** for example: ${apigateway.url}, where apigateway is the component alias as defined in `serverless.yml`, and url is a property in the outputs object that is returned from the apigateway provisioning function.

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
- Because I'm mocking the registry locally, and because state is saved inside each component, you can only use each component once. To solve that, I'd like to publish all components to npm, and manage state elsewhere.
