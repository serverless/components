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
2. [How It Works](#how-it-works)
    1. Concepts
        1. Component
        2. Inputs
        3. Outputs
        4. State
        5. Variables
    2. Order of Operation
    3. Commands
3. Next Steps

# Quick Start
**Requires: Node 8+**

## 1. Setup

```
git clone https://github.com/serverless/components-eslam
cd components-eslam

npm run setup

export GITHUB_TOKEN="abc"
export AWS_ACCESS_KEY_ID="fgh"
export AWS_SECRET_ACCESS_KEY="xyz"
```

This step is just for the demo and would be automated in production. This will do the following:

1. install the dependencies of all components in the registry
2. globally install the Serverless Components CLI and expose the `components deploy` and `components remove` commands
3. link the Serverless Components SDK to all components
4. cd into the github-webhook-receiver component
5. setup required credentials for your infrastructure

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
Only the components affected by the changes should be updated.


## 5. Remove

Remove all your components.

```
components remove
```

# How It Works

## Concepts

### Component
A component is the smallest unit of abstraction for your infrastructure. It could be a single small piece like an IAM role, or a larger piece that includes other small pieces, like github-webhook-receiver, which includes lambda (which itself includes iam), apigateway (which also includes iam), dynamodb, and github-webhook. So components could be composed with each other in a component dependency tree to build larger components.

You can define a component in one of two ways:

**serverless.yml**
You component could just be a single **serverless.yml** that composes other components together, but without having logic within itself. Inside this yml file you define the following:

- name of the component
- version of the component
- required & default inputs for this component
- component dependencies: any other nested components

The github-webhook-receiver is a good example for this. It looks something like this:

```yml

```

**serverless.yml && index.js**
If your component is independent and manages a single piece of infrastructure, like IAM, it would also include an index.js that exports a single function that manages this piece of infrastructure. This functionl takes inputs and state parameters. More on that below.

An example index.js looks like this

```js

```

Your component could also depend on other components AND have logic on it's own. The lambda component is a good example of this. It uses the IAM component and has logic for its own in an index.js file.


**Inputs**

**Outputs**

**State**

**Variables**

## Order of Operations

## Commands

# Next Steps
