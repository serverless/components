# Goals

- [x] **Component Lifecycle Management**
- [x] **Component Composability & Reusability**
- [x] **Custom Lifecycle Extension**

# Table of Contents
1. [Quick Start](#quick-start)
    1. [Setup](#1-setup)
    2. [Deploy](#2-deploy)
    3. [Update](#3-update)
    4. [Remove](#4-remove)
2. [Concepts](#concepts)
    1. [Component](#component)
    2. [Inputs](#inputs)
    3. [Outputs](#outputs)
    4. [State](#state)
    5. [Variables](#variables)

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
```

## 3. Deploy

```
components deploy
```
This will provision all components

## 4. Update

Change some of the inputs in serverless.yml, then deploy again. For example:

- change the github webhook event
- change the lambda or table name name
- change the lambda memory or timeout
- change the apigate method or path

**Note: Validation & error handling are still not that great. So please be gentle :p**

```
components deploy
```

## 5. Remove

Remove all your components.

```
components remove
```

# Concepts

## Component
A component is the smallest unit of abstraction for your infrastructure. It could be a single small piece like an IAM role, or a larger piece that includes other small pieces, like github-webhook-receiver, which includes lambda (which itself includes iam), apigateway (which also includes iam), dynamodb, and github-webhook. So components could be composed with each other in a component dependency tree to build larger components.

You define a component using two files: `serverless.yml` for config, and `index.js` for the provisioning logic. The index.js file exports a **single function** that takes two arguments: inputs & state. However, this `index.js` file is optional, since your component could just be a composition of other smaller components without provisioning logic on its own.

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

For child components, the provisioning order is top to bottom in serverless.yml, so any child component can depend on any component output on top of it in serverless.yml, but not below.

That's why the github child component in the example above is at the bottom of the list, becasue it depends on APIG, which itself depends on Lambda.

## Inputs
Inputs are the configuration that are supplied to your component logic by the user. You supply those inputs in serverless.yml:

```yml
name: github-webhook-receiver

inputs:
  firstInput: hello
  secondInput: world
```

Or, if the component is being used as a child of another parent component, like the lambda component, the parent could supply those inputs, and they would overwrite the default inputs that are defined at the child level.

So, if Lambda serverless.yml looks like this:

```yml
name: lambda@0.0.1

inputs:
  memory: 128
  timeout: 10
```

and github-webhook-receiver serverless.yml looks like this:

```yml
name: github-webhook-receiver@0.0.1

components:
  lambda:
    type: lambda@0.0.1
    inputs:
      memory: 512
      timeout: 300
```
Then your lambda function would have a memory of 512, and timeout of 300.

## Outputs
Your provisioning logic, or your index.js file, can optionally return an outputs object. This output can be referenced in serverless.yml as inputs to another component.


## State
State is simply the inputs and outputs of the last provision. It represents a historical snapshot of what happened last time you ran `deploy` or `remove`

The provisioning logic can use this state object and compare it with the current inputs, to make decisions whether to deploy, update, or remove.

The operation that needs to be done depends on the inputs and how the provider works. Change in some inputs for some provider could trigger a create/remove, while other inputs might trigger an update. It's up to the component to decide.

## Variables
The framework supports variables from two sources:

- Environment Variables, for example: ${GITHUB_TOKEN}
- Output, for example: ${apigateway.url}, where apigateway is the component alias as defined in serverless.yml, and url is a property in the outputs object that is returned from the provisioning function.
