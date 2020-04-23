[![Serverless Components](https://s3.amazonaws.com/public.assets.serverless.com/images/readme_serverless_components.gif)](http://serverless.com)

<br/>

<p align="center">
  <b>Serverless Components is now Generally Available.  <a href="https://github.com/serverless/components/tree/v1">Click Here for the old Beta Version</a></b>
</p>

<br/>

<p align="center">
  <span>English</span> |
  <a href="./README.cn.md">简体中文</a>
</p>

Serverless Components are simple abstractions that enable developers to deploy serverless applications and use-cases easily, via the [Serverless Framework](https://github.com/serverless/serverless).

<br/>

- [x] **Ease** - Deploy serverless infrastructure or entire serverless applications via Components.
- [x] **Instant Deployments** - Components deploy in 2-4 seconds.
- [x] **Build Your Own** - Components are easy to build.
- [x] **Registry** - Share your Components with you, your team, and the world, via the Serverless Registry.

<br/>

Here's how to use a Serverless Component:

```yaml
# serverless.yml

component: express # The name of the Component in the Registry
name: rest-api # The name of your instance of this Component

inputs: # The configuration the Component accepts according to its docs
  src: ./src #     In that case the express component accepts source code
```

# Documentation

- [Quick-Start](#quick-start)
- [Features](#features)
- [Overview](#overview)
- [Using Components](#using-components)
  - [Serverless.yml](#serverlessyml)
  - [Inputs](#inputs)
  - [Deploying](#deploying)
  - [State](#state)
  - [Versioning](#versioning)
  - [Outputs](#outputs)
  - [Credentials](#credentials)
  - [Stages](#stages)
  - [Variables](#variables)
- [Building Components](#building-components)
  - [Serverless.component.yml](#serverlesscomponentyml)
  - [Serverless.js](#serverlessjs)
  - [Working With Source Code](#Working-with-source-code)
  - [Adding The Serverless Agent](#Adding-the-serverless-agent)
  - [Development Tips](#development-tips)
- [Available Components](https://github.com/serverless-components/)
  - [express](https://github.com/serverless-components/express)
  - [website](https://github.com/serverless-components/website)
  - [aws-dynamodb](https://github.com/serverless-components/aws-dynamodb)
  - [aws-lambda](https://github.com/serverless-components/aws-lambda)
  - [aws-lambda-layer](https://github.com/serverless-components/aws-lambda-layer)
  - [aws-iam-role](https://github.com/serverless-components/aws-iam-role)
- [CLI Commands](#cli-commands)
- [Templates](./templates)
- [Artwork](https://github.com/serverless/artwork)
- [Join Us on Slack](https://serverless.com/slack)

<br/>

# Quick-Start

To get started with Serverless Components, install the latest version of the [Serverless Framework](https://www.github.com/serverless/serverless):

```console
$ npm i -g serverless
```

After installation, use the `create --template-url` command to install a [Serverless Components Template](./templates), which contains Components as well as boilerplate code, to get you started quickly. An easy starting point is the Express.js Component:

```shell
serverless create --template-url https://github.com/serverless/components/tree/master/templates/express
```

The `express` template above requires running `npm i` in its root directory, to install the Express framework. So `cd` into the generated `express` directory and run `npm i`.

Next, log in to enable deployment and saving state in the cloud:

```bash
$ serverless login
```

Lastly, enter your cloud provider credentials into a `.env` file within the folder that contains your `serverless.yml`.

```text
AWS_ACCESS_KEY_ID=12345
AWS_SECRET_ACCESS_KEY=5321
```

Deploy...

```bash
$ serverless deploy
```

After few seconds, you should get a URL as an output. If you visit that URL you'll see a successful "Request Received" message.

Fetch the your Component Instance's info...

```bash
$ serverless info
```

Run the `serverless dev` command to auto-deploy on save, and have logs and errors stream in real-time to your console (if supported by the Component)...

```bash
$ serverless dev
```

Deploy other Components that you may want to use with your Express Component. For example, you may want to give your Express application permissions to other resources on your AWS account via the `aws-iam-role` Component. You may also want an AWS DynamoDB table to use with your Express Component, via the `aws-dynamodb` Component. There are Templates for both of these in the [Serverless Components Template](./templates) folder. You can then use them with your `express` Component, like this:

```yaml
org: your-org # Your Org
app: your-app # Your App
component: express
name: express-api

inputs:
  src: ./src
  roleArn: ${output:${stage}:${app}:my-role.arn}
  env:
    dbTableName: ${outputs:${stage}:${app}:my-table.name}
```

<br/>

# Features

### Simplicity

Serverless Components are built around higher-order use-cases (e.g. a website, blog, payment system). Irrelevant low-level infrastructure details (that aren't necessary for the use-case) are abstracted away, and simpler configuration is offered instead.

For example, here's what it looks like to provision a **serverless website** hosted on AWS S3, delivered globally and quickly w/ AWS Cloudfront, via a custom domain on AWS Route 53, secured by a free AWS ACM SSL Certificate:

```yaml
# serverless.yml

org: acme # Your Org
app: ecommerce # Your App
component: website # A Component in the Registry
name: my-website # The name of your Component Instance

inputs: # The configuration the Component accepts
  src:
    src: ./src
    hook: npm run build
    dist: ./dist
  domain: mystore.com
```

Check out these [templates](./templates) for more use-cases.

### Instant Deployments

Serverless Components that deploy instantly, removing the need to emulate cloud services locally for fast feedback during the development process.

```bash

$ serverless deploy

4s > my-express-app › Successfully deployed

```

### Build Your Own

Serverless Components are easily written in Javascript (`serverless.js`), with simple syntax inspired by component-based frameworks, like React.

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyBlog extends Component {
  async deploy(inputs) {
    console.log('Deploying a serverless blog') // Leave a status update for users deploying your Component with --debug
    this.state.url = outputs.url // Save state
    return outputs
  }
}

module.exports = MyBlog
```

### Registry

Anyone can build a Serverless Component and share it in our Registry.

```bash

$ serverless registry publish

express@0.0.4 › Published

```

### Serverless

Serverless Components favor cloud infrastructure with serverless qualities. They are also entirely vendor agnostic, enabling you to easily use services from different vendors, together. Like, AWS Lambda, AWS S3, Azure Functions, Google Big Query, Twilio, Stripe, Algolia, Cloudflare Workers and more.

<br/>

# Overview

Serverless Components are libraries of code that know how to provision an outcome/use-case. They are focused primarily on use-cases built on cloud infrastructure with serverless qualities, enabling you to deliver functionality with radically low operational cost, without having to be very knowledgeable about the underlying infrastructure. Serverless Components are to serverless, back-end use-cases, what React Components are to front-end use-cases.

A Component can be designed to provision low-level infrastructure (e.g. an AWS S3 bucket). However, they can also provision higher-order outcomes (which is when they are at their best). Examples of higher-order outcomes are:

1. A group of infrastructure with a purpose, like a type of data processing pipeline.
2. A software feature, like user registration, comments, or a payment system.
3. An entire application, like a blog, video streaming service, or landing page.

Serverless Components are used **declaratively** (via the Serverless Framework's `serverless.yml` file). They are free to use, and anyone can make and share them by publishing their Component to the Serverless Registry.

<br/>

# Using Components

### serverless.yml

Serverless Components live exclusively in the cloud. They are discoverable and usable via the Serverless Registry. Please note, the Registry API exists today, but currently does not have a front-end with search functionality. Instead, run `serverless registry` for available components.

To use a Serverless Component, declare the name of one that exists in the Serverless Registry in your `serverless.yml`. The syntax looks like this:

```yaml
# serverless.yml

component: express # The name of the Component in the Registry
org: acme # Your Serverless Framework Org
app: fullstack # Your Serverless Framework App
name: rest-api # The name of your instance of this Component

inputs: # The configuration the Component accepts according to its docs
  src: ./src
```

There is nothing to install when using Serverless Components. Instead, when you run deploy, the configuration you specify in `serverless.yml` will be sent to the Serverless Components Deployment Engine, along with any files or folders you specifiy in `inputs` that may be part of the outcome you are seeking to deploy.

Please note that you can only have 1 Serverless Component in `serverless.yml`. We encourage this because it's important to separate the resources in your Serverless Applications, rather than put all of them in 1 infrastructure stack.

**Note:** You cannot yet use Serverless Components within an existing Serverless Framework project file (i.e. a project file that contains `functions`, `events`, `resources` and `plugins`).

### Inputs

Every Serverless Component accepts arguments via an `inputs` property. You can see which `inputs` a Component accepts in its documentation.

Some `inputs` have special types, starting with `src`. This input specifies a folder containing code or general files you wish to upload upon deployment, which the Component may need to provision a specific outcome. Before running the Component in the cloud, the Serverless Framework will first upload any files specified in `src`. Generally, you want to keep the package size of your serverless applications small (<5MB) in order to have the best performance in serverless compute services. Larger package sizes will also make deployments slower since the upload process is dependent on your internet connection bandwidth. Consider a tool to build and minify your code first. You can specify a build hook to run and a `dist` folder to upload, via the `src` property, like this:

```yaml
inputs:
  src:
    src: ./src # Source files
    hook: npm run build # Build hook to run on every "serverless deploy"
    dist: ./dist # Location of the distribution folder to upload
```

Improving the Component Input Types system is one of our current big priorities.

### Deploying

You can deploy Components easily via the Serverless Framework with the `$ serverless deploy` command.

```bash
$ serverless deploy
```

While Serverless Components deploy incredibly fast, please note that first deployments can often be 5x slower because creating cloud resources takes a lot longer than updating them.

### State

Serverless Components automatically save their state remotely. This means you can easily push your Components to Github, Gitlab, Bitbucket, etc., and collaborate on them with others as long as the `serverless.yml` contains an `org` which your collaboraters are added to:

```yaml
org: acme-team # Your collaboraters must be added at dashboard.serverless.com
app: ecommerce
component: my-component
name: rest-api
```

Further, your Component Instances can easily be deployed with CI/CD, as long as you make sure to include a `SERVERLESS_ACCESS_TOKEN` environment variable.

You can add collaboraters and create access tokens in the [Serverless Framework Dashboard](https://dashboard.serverless.com).

### Versioning

Serverless Components use semantic versioning.

```yaml
component: express@0.0.2
```

When you add a version, only that Component version is used. When you don't add a version, the Serverless Framework will use the latest version of that Component, if it exists. We recommend to **always** pin your Component to a version.

### Outputs

When a Component is finished running, it returns an `outputs` object.

Outputs contain the most important information you need to know from a deployed Component Instance, like the URL of the API or website, or all of the API endpoints.

Outputs can be referenced easily in the `inputs` of other Components. Just use this syntax:

```yaml
# Syntax
${output:[stage]:[app]:[instance].[output]}

# Examples
${output:prod:ecommerce:products-api.url}
${output:prod:ecommerce:role.arn}
${output:prod:ecommerce:products-database.name}
```

### Credentials

Upon deployment, the Serverless Framework looks for a `.env` file in the current working directory. Components can find these credentials within the `this.credentials` object. However, you must use the following Environment Variable keys:

#### AWS Credentials

```bash
AWS_ACCESS_KEY_ID=123456789
AWS_SECRET_ACCESS_KEY=123456789
```

Components could access these AWS credentials using `this.credentials.aws`. This object would look like this:

```js
{
  accessKeyId: '123456789',
  secretAccessKey: '123456789',
}
```

#### Google Credentials

```bash
# You can specify the path to the JSON credentials file that you downloaded from Google
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials/json/file

# Or you could just provide your project id, client email & private key
GOOGLE_PROJECT_ID=project-id-xxx
GOOGLE_CLIENT_EMAIL=project-id-xxx@appspot.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgk..."
```

Components could access these google credentials using `this.credentials.google`. This object would look like this:

```js
{
  applicationCredentials: 'path/to/credentials/json/file',
  projectId: 'project-id-xxx',
  clientEmail: 'project-id-xxx@appspot.gserviceaccount.com',
  privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgk...'
}
```

### Stages

Serverless Components have a Stages concept, which enables you to deploy entirely separate Component Instances and their cloud resources per stage.

The `dev` Stage is always used as the default stage. If you wish to change your stage, set it in `serverless.yml`, like this:

```yaml
org: my-org
app: my-app
component: express@0.0.2
name: my-component-instance
stage: prod # Enter the stage here
```

You can also specify a Stage within the `SERVERLESS_STAGE` Environment Variable, which overrides the `stage` set in `serverless.yml`:

```bash
SERVERLESS_STAGE=prod
```

And, you can specify a Stage upon deployment via a CLI flag, which overrides anything set in `serverless.yml` AND an Environment Variable, like this:

```bash
$ serverless deploy --stage prod
```

Again, the CLI flag overrides both a `stage` in `serverless.yml` and an Environment Variable. Whereas an Environment Variable can only override the `stage` in `serverless.yml`.

Lastly, you can set stage-specific environment variables using separate `.env` files. Each file must be named in the following format: `.env.STAGE`. For example, if you run in the prod stage, the environment variables in `.env.prod` would be loaded, otherwise the default `.env` file (without stage extension) would be loaded.

A practical usage of this is if you want to have a separate AWS account for each stage. In that case you would keep separate AWS credentials for each stage you are targeting. Then based on the stage you're deploying to, the correct credentials would be picked up.

<br/>

### Variables

You can use Variables within your Component Instances `serverless.yml` to reference Environment Variables, values from within `serverless.yml` and Outputs from other Serverless Component Instances that you've already deployed.

Here is a quick preview of possibilities:

```yaml
org: acme
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${org}-${stage}-${app}-${name} # Results in "acme-prod-ecommerce-rest-api"
  region: ${env:REGION} # Results in whatever your environment variable REGION= is set to.
  roleArn: ${output:prod:my-app:role.arn} # Fetches an output from another component instance that is already deployed
  roleArn: ${output:${stage}:${app}:role.arn} # You can combine variables too
```

#### Variables: Org

You can reference your `org` value in the `inputs` of your YAML in `serverless.yml` by using the `${org}` Variable, like this:

```yml
org: acme
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${org}-api # Results in "acme-api"
```

**Note:** If you didn't specify an `org`, the default `org` would be the first org you craeted when you first signed up. You can always overwrite the default `org` or the one specified in `serverless.yml` by passing the `--org` option on deploy:

```
$ serverless deploy --org my-other-org
```

#### Variables: Stage

You can reference your `stage` value in the `inputs` of your YAML in `serverless.yml` by using the `${stage}` Variable, like this:

```yml
org: acme
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${stage}-api # Results in "prod-api"
```

**Note:** If you didn't specify a `stage`, the default stage would be `dev`. You can always overwrite the default `stage` or the one specified in `serverless.yml` by passing the `--stage` option on deploy:

```
$ serverless deploy --stage prod
```

#### Variables: App

You can reference your `app` value in the `inputs` of your YAML in `serverless.yml` by using the `${app}` Variable, like this:

```yml
org: acme
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${app}-api # Results in "ecommerce-api"
```

**Note:** If you didn't specify an app, the default app name would be the instance name (the `name` property in `serverless.yml`). You can always overwrite the default `app` or the one specified in `serverless.yml` by passing the `--app` option on deploy:

```
$ serverless deploy --app my-other-app
```

#### Variables: Name

You can reference your `name` value in the `inputs` of your YAML in `serverless.yml` by using the `${name}` Variable, like this:

```yml
org: acme
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${name} # Results in "rest-api"
```

#### Variables: Environment Variables

You can reference Environment Variables (e.g. those that you defined in the `.env` file or that you've set in your environment manually) directly in `serverless.yml` by using the `${env}` Variable.

For example, if you want to reference the `REGION` environment variable, you could do that with `${env:REGION}`.

```yml
component: express
org: acme
app: ecommerce
name: rest-api
stage: prod

inputs:
  region: ${env:REGION}
```

#### Variables: Outputs

Perhaps one of the most useful Variables is the ability to reference Outputs from other Component Instances that you have already deployed. This allows you to share configuration/data easily across as many Component Instances as you'd like.

If you want to reference an Output of another Component Instance, use the `${output:[app]:[stage]:[instance name].[output]}` syntax, like this:

```yml
component: express
org: acme
app: ecommerce
name: rest-api
stage: prod

inputs:
  roleArn: ${output:[STAGE]:[APP]:[INSTANCE].arn} # Fetches an output from another component instance that is already deployed
```

You can access Outputs across any App, Instance, in an any Stage, within the same Org.

A useful feature of this is the ability to share resources easily, and even do so across environments. This is useful when developers want to deploy a Component Instance in their own personal Stage, but access shared resources within a common "development" Stage, like a database. This way, the developers on your team do not have to recreate the entire development stage to perform their feature work or bug fix, only the Component Instance that needs changes.

<br/>

# Building Components

If you want to build your own Serverless Component, there are 2 essential files you need to be aware of:

- `serverless.component.yml` - This contains the definition of your Serverless Component.
- `serverelss.js` - This contains your Serverless Component's code.

One of the most important things to note is that Serverless Components **only** run in the cloud and **do not** run locally. That means, to run and test your Component, you must publish it first (it takes only few seconds to publish). We're continuing to improve this workflow. Here's how to do it...

### serverless.component.yml

To declare a Serverless Component and make it available within the Serverless Registry, you must create a `serverless.component.yml` file with the following properties:

```yaml
# serverless.component.yml

name: express # Required. The name of the Component
version: 0.0.4 # Required. The version of the Component
author: eahefnawy # Required. The author of the Component
org: serverlessinc # Required. The Serverless Framework org which owns this Component
description: Deploys Serverless Express.js Apps # Optional. The description of the Component
keywords: aws, serverless, express # Optional. The keywords of the Component to make it easier to find at registry.serverless.com
repo: https://github.com/owner/project # Optional. The code repository of the Component
license: MIT # Optional. The license of the Component code
main: ./src # Optional. The directory which contains the Component code
```

### serverless.js

A `serverless.js` file contains the Serverless Component's code.

To make a bare minimum Serverless Component, create a `serverless.js` file, extend the Component class and add a `deploy` method like this:

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyComponent extends Component {
  async deploy(inputs = {}) {
    return {}
  } // The default functionality to run/provision/update your Component
}

module.exports = MyComponent
```

`deploy()` is always required. It is where the logic resides in order for your Component to _make_ something. Whenever you run the `$ serverless deploy` command, it's always calling the `deploy()` method.

You can also add other methods to this class. A `remove()` method is often the next logical choice, if you want your Serverless Component to remove the things it creates, via `$ serverless remove`.

You can add as many methods as you want. This is interesting because it enables you to ship more automation with your Component, than logic that merely _deploys_ and _removes_ something.

It's still early days for Serverless Components, but we are starting to work on Components that ship with their own `test()` function, or their own `logs()` and `metrics()` functions, or `seed()` for establishing initial values in a database Component. Overall, there is a lot of opportunity here to deliver Components that are loaded with useful automation.

All methods other than the `deploy()` method are optional. All methods take a single `inputs` object, not individual arguments, and return a single `outputs` object.

Here is what it looks like to add a `remove` method, as well as a custom method.

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyComponent extends Component {
  /*
   * The default functionality to run/provision/update your Component
   * You can run this function by running the "$ serverless deploy" command
   */
  async deploy(inputs = {}) {
    return {}
  }

  /*
   * If your Component removes infrastructure, this is recommended.
   * You can run this function by running "$ serverless remove"
   */

  async remove(inputs = {}) {
    return {}
  }

  /*
   * If you want to ship your Component w/ extra functionality, put it in a method.
   * You can run this function by running "$ serverless anything"
   */

  async anything(inputs = {}) {
    return {}
  }
}

module.exports = MyComponent
```

When inside a Component method, `this` comes with utilities which you can use. Here is a guide to what's available to you within the context of a Component.

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyComponent extends Component {
  async deploy(inputs = {}) {
    // this features useful information
    console.log(this)

    // Common provider credentials are identified in the environment or .env file and added to this.context.credentials
    // when you run "serverless deploy", then the credentials in .env will be used
    // when you run "serverless deploy --stage prod", then the credentials in .env.prod will be used...etc
    // if you don't have any .env files, then global aws credentials will be used
    const dynamodb = new AWS.DynamoDB({ credentials: this.credentials.aws })

    // You can easily create a random ID to name cloud infrastructure resources with using this utility.
    const s3BucketName = `my-bucket-${this.resourceId()}`
    // This prevents name collisions.

    // Components have built-in state storage.
    // Here is how to save state to your Component:
    this.state.name = 'myComponent'

    // If you want to show a debug statement in the CLI, use console.log.
    console.log('this is a debug statement')

    // Return your outputs
    return { url: websiteOutputs.url }
  }
}

module.exports = MyComponent
```

### Working With Source Code

When working with a Component that requires source code (e.g. you are creating a Component that will run on AWS Lambda), if you make the `src` one of your inputs, anything specified there will be automatically uploaded and made available within the Component environment.

Within your Component, the `inputs.src` will point to a zip file of the source files within your environment. If you wish to unzip the source files, use this helpful utility method:

```javascript
async deploy(inputs = {}) {

  // Unzip the source files...
  const sourceDirectory = await this.unzip(inputs.src)

}
```

Now, you are free to manipulate the source files. When finished, you may want to use this utility method to zip up the source files again because in some circumstances you will next want to upload the code to a compute service (e.g. AWS Lambda).

```javascript
async deploy(inputs = {}) {

  // Zip up the source files...
  const zipPath = await instance.zip(sourceDirectory)

}
```

### Adding The Serverless Agent

If your Component runs code, and you want to enable streaming logs, errors and transactions for you Component via Serverless Dev Mode (`serverless dev`), be sure to add the Serverless SDK into the deployed application/logic. We offer some helpful utility methods to make this possible:

```javascript
// unzip source zip file
console.log(`Unzipping ${inputs.src}...`)
const sourceDirectory = await instance.unzip(inputs.src)
console.log(`Files unzipped into ${sourceDirectory}...`)

// add sdk to the source directory, add original handler
console.log(`Installing Serverless Framework SDK...`)
instance.state.handler = await instance.addSDK(sourceDirectory, '_express/handler.handler')

// zip the source directory with the shim and the sdk
console.log(`Zipping files...`)
const zipPath = await instance.zip(sourceDirectory)
console.log(`Files zipped into ${zipPath}...`)
```

After this, you'll likely want to upload the code to a compute service (e.g. AWS Lambda).

### Development Workflow

Serverless Components only run in the cloud and cannot be run locally. This presents some tremendous advantages to Component consumers, and we've added some workflow tricks to make the authoring workflow easier. Here they are...

When you have added or updated the code of your Serverless Component and you want to test the change, you will need to publish it first. Since you don't want to publish your changes to a proper version of your Component just for testing (because people may be using it), we allow for you to publish a "dev" version of your Component.

Simply run the following command to publish your Serverless Component to the "dev" version:

```console
$ serverless registry publish --dev
```

You can test the "dev" version of your Component in `serverless.yml`, by including a `@dev` in your Component name, like this:

```yaml
# serverless.yml

org: acme
app: fullstack
component: express@dev # Add "dev" as the version
name: rest-api

inputs:
  src: ./src
```

Run your Component command to test your changes:

```shell
$ serverless deploy --debug
```

When writing a Component, we recomend to always use the `--debug` flag, so that the Component's `console.log()` statements are sent to the CLI. These are handy to use in Serverless Components, since they describe what the Component is doing. We recommend you add `console.log()` statements to your Component wherever you think they are necessary.

```javascript
class MyComponent extends Component {
  async deploy(inputs) {
    console.log(`Starting MyComponent.`)
    console.log(`Creating resources.`)
    console.log(`Waiting for resources to be provisioned.`)
    console.log(`Finished MyComponent.`)
    return {}
  }
}
```

When you're ready to publish a new version for others to use, update the version in `serverless.component.yml`, then run publish without the `--dev` flag.

```yaml
# serverless.component.yml

name: express@0.0.1
```

```bash
$ serverless publish

Serverless: Successfully publish express@0.0.1
```

### Development Tips

Here are some development tips when it comes to writing Serverless Components:

#### Start With The Outcome

We recommend starting with a focus on your desired outcome, rather than try to break things down into multiple smaller Components from the start.  Trying to break things down into multiple Components most often ends up as a distraction.  Create a higher level Component that solves your problem first.  Use it.  Learn from it.  Then consider breaking things down into smaller Components if necessary.  At the same time, high-level solutions are what Serverless Components are meant for.  They are outcomes—with the lowest operational overhead.

#### Knowing The Outcome Is An Advantage

Provisioning infrastructure safely and reliably can be quite complicated. However, Serverless Components have a powerful advantage over general infrastructure provisioning tools that seek to enable every possible option and combination (e.g. AWS Cloudformation, Terraform) — Serverless Components know the specific use-case they are trying to deliver.

One of the most important lessons we've learned about software development tools is that once you know the use-case or specific goal, you can create a much better tool.

Components know their use-case. You can use that knowledge to: 1) provision infrastructure more reliably, because you have a clear provisioning path and you can program around the pitfalls. 2) provision infrastructure more quickly 3) add use-case specific automation to your Component in the form of custom methods.

#### Keep Most State On The Cloud Provider

Serverless Components save remarkably little state. In fact, many powerful Components have less than 10 properties in their state objects.

Components rely on the state saved within the cloud services they use as the source of truth. This prevents drift issues that break infrastructure provisioning tools. It also opens up the possibility of working with existing resources, that were not originally managed by Serverless Components.

#### Store State Immediately After A Successful Operation

If you do need to store state, try to store it immediately after a successful operation.

```javascript
// Do something
this.state.id = 'updated or new id'
// Do something else
this.state.url = 'updated or new url'
```

This way, if anything after that operation fails, your Serverless Component can pick up where it left off, when the end user tries to deploy it again.

#### Optimize For Accessibility

We believe serverless infrastructure and architectures will empower more people to develop software than ever before.

Because of this, we're designing all of our projects to be as approachable as possible. Please try to use simple, vanilla Javascript. Additionally, to reduce security risks and general bloat, please try to use the least amount of NPM dependencies as possible.


#### No Surprise Removals

Never surprise the user by deleting or fundamentally changing infrastructure within your Serverless Component, based on a configuration change in `serverless.yml`.

For example, if a user is changing their region, **NEVER** remove their infrastructure in one region and automatically recreate it in the new region upon their next `$ serverless deploy`.

Instead, throw an error with a warning about this:

```text
$ serverless deploy
Error: Changing the region from us-east-1 to us-east-2 will remove your infrastructure. Please remove it manually, change the region, then re-deploy.
$
```

We have measured this user experience and so far 100% of the time the user will remove their existing Component Instance and deploy another one.  This works extremely well.

# CLI Commands

#### `serverless registry`

See available Components

#### `serverless registry publish`

Publish a Component to the Serverless Registry.

`--dev` - Publishes to the `@dev` version of your Component, for testing purposes.

#### `serverless deploy`

Deploys an Instance of a Component.

`--debug` - Lists `console.log()` statements left in your Component upon `deploy` or any action.

#### `serverless remove`

Removes an Instance of a Component.

`--debug` - Lists `console.log()` statements left in your Component upon `remove` or any action.

#### `serverless info`

Fetches information of an Instance of a Component.

`--debug` - Lists `state`.

#### `serverless dev`

Starts DEV MODE, which watches the Component for changes, auto-deploys on changes, and (if supported by the Component) streams logs, errors and transactions to the terminal.
