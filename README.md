**IMPORTANT –**  This branch features a large update to Serverless Components, which include *cloud deployments*, *remote state storage*, *stages* and the *Serverless Registry*.  The README has been updated with instructions.  Only a few Serverless Components have been updated to support these changes and they can be found in this repository's [templates](./templates).  You can read more about these changes here, or follow the README to get started!

<br/>

[![Serverless Components](https://s3.amazonaws.com/assets.github.serverless/readme-serverless-components-3.gif)](http://serverless.com)

Serverless Components are simple abstractions that enable developers to deploy serverless applications and use-cases easily, via the [Serverless Framework](https://github.com/serverless/serverless).

* - [x] **Simplicity** - Easily deploy low-level infra, or higher-order serverless applications via Components.
* - [x] **Instant Deployments** - Components deploy in 2-4 seconds.
* - [x] **Build Your Own** - Components are easy to build.
* - [x] **Registry** - Share your Components with you, your team, and the world, via the Serverless Registry.

Here's how easy it is to use Components with the Serverless Framework:

```yaml
# serverless.yml

component: express # The name of the Component in the Registry
org: acme # Your Serverless Framework Org
app: fullstack # Your Serverless Framework App
name: rest-api # The name of your instance of this Component

inputs: # The configuration the Component accepts according to its docs
  src: ./src
```

<br/>

- [Quick-Start](#quick-start)
- [Features](#features)
- [Overview](#overview)
- [Using Components](#using-components)
  - [Serverless.yml Basics](#serverlessyml-basics)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
  - [Credentials](#credentials)
  - [Environment Variables](#environment-variables)
- [Building Components](#building-components)
  - [Serverless.js Basics](#serverlessjs-basics)
  - [Development Tips](#development-tips)
- [Available Components](https://github.com/serverless-components)
- [Templates](./templates)
- [Artwork](https://github.com/serverless/artwork)
- [Join Us on Slack](https://serverless.com/slack)
- [Roadmap](https://github.com/serverless/components/projects/1)

<br/>

# Quick-Start

To test the latest updates with Serverless Components, you can use Components with the [Serverless Framework](https://www.github.com/serverless/serverless) via a special package on NPM:

```console
$ npm i -g serverless@components
```

Next, use the `create --template-url` command to install a [Serverless Components Template](./templates), which contains Components as well as boilerplate code, to get you started quickly.

Currently, only the Components in the [templates](./templates) within this repository branch support the latest Serverless Component updates.

#### [Deploy A Serverless Express.js Application](https://github.com/serverless/components/tree/cloud/templates/express)

```shell
serverless create --template-url https://github.com/serverless/components/tree/cloud/templates/express
```

#### [Deploy A Website](https://github.com/serverless/components/tree/cloud/templates/website)

```shell
serverless create --template-url https://github.com/serverless/components/tree/cloud/templates/website
```

<br/>

# Features

### Simplicity

Serverless Components are built around higher-order use-cases (e.g. a website, blog, payment system). Irrelevant low-level infrastructure details are abstracted away, and simpler configuration is offered instead.

For example, here's what it looks like to provision a **serverless website** hosted on AWS S3, delivered globally and quickly w/ AWS Cloudfront, via a custom domain on AWS Route 53, secured by a free AWS ACM SSL Certificate:

```yaml
# serverless.yml

component: website # A Component in the Registry
org: acme # Your Org
app: ecommerce # Your App
name: website # The name of your Component Instance

inputs: # The configuration the Component accepts
  src:
    src: ./src
    hook: npm run build
    dist: ./dist
  domain: mystore.com
```

Check out these [templates](./templates) for more use-cases.

### Build Your Own

Serverless Components are easily written in Javascript (`serverless.js`), with simple syntax inspired by component-based frameworks, like React.

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyBlog extends Component {
  async deploy(inputs) {
    await this.status('Deploying a serverless blog')
    const website = await this.load('website') // Load a component
    const outputs = await website({ code: { src: inputs.src } }) // Deploy it
    this.state.url = outputs.url
    await this.save()
    return outputs
  }
}

module.exports = MyBlog
```

### Registry

Anyone can build a Serverless Component and share it in our Registry.

```bash

serverless publish

express: components publish

express@0.0.4 › Published

```

### Instant Deployments

Most Serverless Components deploy within 2-4 seconds, 30x faster than traditional cloud provisioning tools. Our intention is to design Serverless Components' that deploy almost instantly, removing the need to emulate cloud services locally for fast feedback during the development process.

### Vendor-Agnostic

Serverless Components favor cloud infrastructure with serverless qualities (shocker!). We also believe in order to deliver the best product, you must be free to use the best services.

Serverless Components are being designed entirely vendor agnostic, enabling you to easily use services from different vendors, together. Like, AWS Lambda, AWS S3, Azure Functions, Google Big Query, Twilio, Stripe, Algolia, Cloudflare Workers and more.

<br/>

# Overview

Serverless Components are merely Javascript libraries that provision something.

They are focused primarily on use-cases built upon cloud infrastructure with serverless qualities, enabling you to deliver software with radically less overhead and cost. Serverless Components are to serverless back-end use-cases, what React Components are to front-end use-cases.

A Component can be designed to provision low-level infrastructure (e.g. an AWS S3 bucket). However, they can also provision higher-order outcomes — which is when they are at their best. Examples of a higher-order outcome are:

1. A group of infrastructure with a purpose, like a type of data processing pipeline.
2. A software feature, like user registration, comments, or a payment system.
3. An entire application, like a blog, video streaming service, or landing page.

The syntax for writing a Serverless Component makes it trivial to load child Components and deploy them, enabling you to lean on low-level Components to handle difficult infrastructure provisioning tasks, while you rapidly create a higher-order abstraction.

Serverless Components are used **declaratively** (via the Serverless Framework's `serverless.yml` file).

Using Components declaratively is great if you want to build a serverless application as easily as possible, but not re-use it.

<br/>

# Using Components

### Creating a Serverless.yml

Serverless Components live in the cloud, where they await to be run.  They are discoverable and usable via the Serverless Registry.  Please note, the Registry API exists today, but currently does not have a front-end until January 4th, 2020.  Instead, reference the (templates)[./templates] directory for available Components.

To use a Serverless Component, declare the name of one that exists in the Serverless Registry in your `serverless.yml`.  The syntax looks like this:

```yaml
# serverless.yml

component: express # The name of the Component in the Registry
org: acme # Your Serverless Framework Org
app: fullstack # Your Serverless Framework App
name: rest-api # The name of your instance of this Component

inputs: # The configuration the Component accepts according to its docs
  src: ./src
```

There is nothing to install when using Serverless Components.  Instead, when you run deploy, the configuration you specify in `serverless.yml` will be sent to the Serverless Components Engine, along with any files or folders you specifiy in `inputs` that may be part of the outcome you are seeking to deploy.

Please note that you can only have 1 Serverless Component in `serverless.yml`.  We encourage this because we believe you should separate the resources in your Serverless Applications as much as possible, rather than put all of them in 1 infrastructure stack.

**Note:** You cannot use Serverless Components within an existing Serverless Framework project file (i.e. a project file that contains `functions`, `events`, `resources` and `plugins`).

### Inputs

Every Serverless Component accepts parameters via an `inputs` property.  You can see which `inputs` a Component accepts in its documentation.

Some `inputs` have special types, starting with `src`.  This input specifies a folder containing code or general files you wish to upload upon deployment, which the Component may need to provision a specific outcome.  Before running the Component in the cloud, the Serverless Framework will first upload any files specified in `src`.  Generally, you want to keep the package size of your serverless applications small (<5MB) in order to have the best performance in serverless compute services.  Larger package sizes will also make deployments slower since the upload process is dependent on your internet connection bandwidth.  Consider a tool to build and minify your code first.  You can specify a build hook to run and a `dist` folder to upload, via the `src` property, like this:

```yaml

src:
  src: ./src # Source files
  hook: npm run build # Build hook to run on every "serverless deploy"
  dist: ./dist # Location of the distribution folder to upload

```

### Deploying Serverless Components

You can deploy Components easily via the Serverless Framework with the `$ serverless deploy` command.

```console
$ serverless deploy
```

### Component Versioning

When you add a version, only that Component version is used. When you don't add a version, upon every deployment, the Serverless Framework will always deploy the latest (somtimes in-development) version, and use that, if it exists.  We recommend to **always** pin your Component to a version.

### Outputs

When a Component is finished running, it returns an `outputs` object.

Outputs are the most important information you need to know from a deployed Component Instance, like the URL of the API or website, or all of the API endpoints.

### Credentials

Upon deployment, the Serverless Framework looks for a `.env` file in the current working directory.  If a `.env` file exists, the Serverless Framework will send those credentials to the Component and the Component can access them within the `this.credentials` object.  However, you must use the following Environment Variable keys:

#### AWS Credentials

```bash
AWS_ACCESS_KEY_ID=123456789
AWS_SECRET_ACCESS_KEY=123456789
AWS_REGION=us-east-1
```

Components could access these AWS credentials using `this.credentials.aws`. This object would look like this:

```js
{
  accessKeyId: '123456789',
  secretAccessKey: '123456789',
  region: 'us-east-1'
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

### Environment Variables

You can reference environment variables (e.g. those that you defined in the `.env` file) directly in `serverless.yml` by referencing the `${env}` object. For example, if you want to reference the `TABLE` environment variable, you could do that with `${env.TABLE}`.

```yml
component: express
org: acme
app: fullstack
name: rest-api

inputs:
  src: ./src
  env:
    foo: ${env.BAR}
```

<br/>

# Building Components

If you want to build reusable Serverless Components, there are 2 essential files you need to be aware of:

* `serverless.component.yml` - This contains the definition of your Serverless Component.
* `serverelss.js` - This contains your Serverless Component's code.

One of the most important things to note is that Serverless Components **only** run in the cloud and **do not** run locally.  You must publish your Component first, to run it.  Fortunately, we've made this process easy, as described below.

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

It's still early days for Serverless Components, but we are starting to work on Components that ship with their own `test()` function, or their own `logs()` and `metrics()` functions, or `seed()` for establishing initial values in a database Component. Overall, there is a lot of opportunity here to deliver outcomes that are loaded with useful automation.

All methods other than the `deploy()` method are optional. All methods take a single `inputs` object, not individual arguments, and return a single `outputs` object.

Here is what it looks like to add a `remove` method, as well as a custom method.

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyComponent extends Component {
  /*
   * Deploy (Required)
   * - The default functionality to run/provision/update your Component
   * - You can run this function by running the "$ serverless" command
   */

  async deploy(inputs = {}) {
    return {}
  }

  /*
   * Remove (Optional)
   * - If your Component removes infrastructure, this is recommended.
   * - You can run this function by running "$ serverless remove"
   */

  async remove(inputs = {}) {
    return {}
  }

  /*
   * Anything (Optional)
   * - If you want to ship your Component w/ extra functionality, put it in a method.
   * - You can run this function by running "$ serverless anything"
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
    // when you run "components", then the credentials in .env will be used
    // when you run "components --stage prod", then the credentials in .env.prod will be used...etc
    // if you don't have any .env files, then global aws credentials will be used
    const dynamodb = new AWS.DynamoDB({ credentials: this.credentials.aws })

    // You can easily create a random ID to name cloud infrastructure resources with using this utility.
    const s3BucketName = `my-bucket-${this.resourceId()}`
    // This prevents name collisions.

    // Components have built-in state storage.
    // Here is how to save state to your Component:
    this.state.name = 'myComponent'
    await this.save()

    // Here is how to load a child Component.
    // This assumes you have the "@serverless/website" component in your "package.json" file and you've run "npm install"
    let website = await this.load('@serverless/website')

    // You can run the default method of a child Component two ways:
    let websiteOutputs = website({ code: { src: './src' } })
    let websiteOutputs = website.default({ code: { src: './src' } })

    // If you are deploying multiple instances of the same Component, include an instance id.
    let website1 = await this.load('@serverless/website', 'website1')
    let website2 = await this.load('@serverless/website', 'website2')

    // Child Components save their state automatically.

    // You can also load a local component that is not yet published to npm
    // just reference the root dir that contains the serverless.js file
    // You can also use similar syntax in serverless.yml to run local Components
    let localComponent = await this.load('../my-local-component')

    // Here is how you can easily remove a Component.
    let websiteRemoveOutputs = await website.remove()

    // Here is how you can call any custom method on a Component.
    let websiteRemoveOutputs = await website.test({})

    // If you want to show a status update to the CLI in an elegant way, use this.
    await this.status('Uploading')

    // If you want to show a log statement in the CLI in an elegant way, use this.
    await this.log('this is a log statement')

    // Return your results
    return { url: websiteOutputs.url }
  }
}

module.exports = MyComponent
```

### Testing Serverless Components

Serverless Components only run in the cloud and cannot be run locally.  This presents some tremendous advantages to Component consumers, but the workflow can be a bit tedious to Component authors.  Fortunately, we've added some workflow tricks to make the authoring workflow easier.  Here they are...

When you have added or updated the code of your Serverless Component and you want to test the change, you will need to publish it first.  Since you don't want to publish your changes to a proper version of your Component just for testing (because people may be using it), we allow for you to publish a "dev" version of your Component.  

Simply run the following command to publish your Serverless Component to the "dev" version:

```console
$ serverless publish --dev
```

You can consume the "dev" version of your Component in `serverless.yml`, via the following syntax:

```yaml
# serverless.yml

component: express # DO NOT ADD A @version HERE.  By keeping blank, it will use the "dev" version.
org: acme 
app: fullstack
name: rest-api

inputs:
  src: ./src
```





Just run `serverless deploy` in the directory that contains the `serverless.js` file to run your new component. You will see all the logs and outputs of your new component. Logs and outputs of any child component you use will not be shown, unless you run in debug mode: `serverless --debug`. You can also run any custom method/command you've defined with `serverless <methodName>`.

For complete real-world examples on writing components, [check out our official components](https://github.com/serverless-components)

### Development Tips

Here are some development tips when it comes to writing Serverless Components:

#### Activate Watch Mode with the `--watch` Flag

During development, it's super helpful to keep the terminal running with `serverless --watch` (or with any method other than the default) while you develop your component. This way you get instant feedback and reduce friction.

#### Use Debug Statements and the `--debug` Flag

The Serverless Components CLI experience is intentionally minimal. But if you ever want to see what Components are doing behnd the scenes, use the `--debug` flag when you run a Component. You'll see output like this:

![Serverless Components Debugging](https://s3.amazonaws.com/assets.github.serverless/components/serverless_components_debugging.png)

Many Serverless Components include debug statements to report what work they are doing. We recommend you add debug statements into your Component as well. Just use this:

```javascript
class MyComponent extends Component {
  async default() {
    this.context.debug(`Starting MyComponent.`)
    this.context.debug(`Creating resources.`)
    this.context.debug(`Waiting for resources to be provisioned.`)
    this.context.debug(`Finished MyComponent.`)
  }
}
```

#### Use Local References

When writing a Serverless Component, you can reference it locally via a `serverless.yml`, or another `serverless.js`. Keep in mind, a directory can only contain 1 `serverless.yml` or `serverless.js`. A directory cannot contain a both a `serverless.yml` and a `serverless.js`.

Here's how to reference a local Component via `serverless.yml`:

```yaml
name: my-project

myComponent:
  component: ../src
  inputs:
    foo: bar
```

Here's how to reference a local Component via `serverless.js`:

```javascript
class myFirstComponent extends Component {
  default() {
    const mySecondComponent = this.load('../components/my-second-component')
  }
}
```

#### Start With The Outcome

When making a Serverless Component, it can be tempting to break it down into several levels of child Components, to maintain separation of concerns and increase the ways your work could be re-used.

However, provisioning back-end logic can be more complicated than designing a front-end React Component. We've learned over-optimizing for granular separation of concerns is a fast way to burn yourself out!

We recommend starting with a focus on your desired outcome. Create one Serverless Component that solves that problem first. After you've achieved your initial goal, then start breaking it down into child Components.

#### The Outcome Is Your Advantage

Provisioning infrastructure can be quite complicated. However, Serverless Components have one powerful advantage over general infrastructure provision tools that seek to enable every possible option and combination (e.g. AWS Cloudformation) — Serverless Components know the specific use-case they are trying to deliver.

One of the most important lessons we've learned about software development tools is that once you know the use-case, you can create a much better tool.

Components know their use-case. You can use that knowledge to: 1) provision infrastructure more reliably, because you have a clear provisioning path and you can program around the pitfalls. 2) provision infrastructure more quickly 3) add use-case specific automation to your Component in the form of custom methods.

#### Keep Most State On The Cloud Provider

Serverless Components save remarkably little state. In fact, many powerful Components have less than 10 properties in their state objects.

Components rely on the state saved within the cloud services they use as the source of truth. This prevents drift issues that break infrastructure provisioning tools. It also opens up the possibility of working with existing resources, that were not originally managed by Serverless Components.

#### Store State Immediately After A Successful Operation

If you do need to store state, try to store it immediately after a successful operation. This way, if anything after that operation fails, your Serverless Component can pick up where it left off, when the end user tries to deploy it again.

#### Optimize For Accessibility

We believe serverless infrastructure and architectures will empower more people to develop software than ever before.

Because of this, we're designing all of our projects to be as approachable as possible. Please try to use simple, vanilla Javascript. Additionally, to reduce security risks and general bloat, please try to use the least amount of NPM dependencies as possible.
