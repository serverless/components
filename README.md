[![Serverless Components](https://s3.amazonaws.com/assets.github.serverless/components/serverless-components-readme.gif)](http://serverless.com)

&nbsp;

**Serverless Components** is framework for easily provisioning and sharing application components on ~~cloud~~ serverless services.

It does not seek to be another general infrastructure provisioning tool (e.g. Cloudformation, Terraform), but a solution that enables developers to build their own reusable abstractions on top of infrastructure, that resemble the use-case they are seeking to build (e.g. a Blog, Payment Processor, Realtime Application)

These Components are use-case focused, and you can deploy them alongside infrastructure, in the same configuration file.

```yaml
# serverless.yml

name: my-blog

# higher-level abstraction
Comments@2.1.0:comments:
  region: us-east-1

# infrastructure
AwsLambda@1.2.1:listPosts:
  memorySize: 1024
```

&nbsp;

Here are some easy examples which you can deploy instantly to get started:

- [Chat App](./templates/chat-app)
- [Realtime App](./templates/realtime-app)
- [Websockets Backend](./templates/websockets-backend)
- [Website](./templates/website)
- [API](./templates/api)
- [AWS Lambda Function](./templates/aws-lambda)

&nbsp;

## Example

Deploy serverless infrastructure, or an **entire serverless use-case** (e.g. a full-stack realtime app) in seconds...

```yaml
# serverless.yml

name: my-realtime-app

RealtimeApp@0.1.1::realtime-app:
  frontend:
    assets: ./frontend
  backend:
    assets: ./backend
```

```console
$ realtime-app: components

  realtime-app › outputs:
  frontend:
    url:  'http://realtimeapp-xqu5n6.s3-website-us-east-1.amazonaws.com'
  backend:
    url:  'wss://2ozttnximh.execute-api.us-east-1.amazonaws.com/dev/'


  12s › dev › my-realtime-app › done
```

## Get Started

Install components.

```console
$ npm i -g @serverless/components
```

Go into a [template](./templates).

```console
$ cd templates/chat-app
```

Add provider credentials (all examples currently require [AWS](https://aws.amazon.com/) credentials). Serverless Components supports `.env` files in the same folder as `serverless.yml` or `serverless.js`. Create a `.env` that looks like this:

```text
AWS_ACCESS_KEY_ID=123456789
AWS_SECRET_ACCESS_KEY=987654321
```

Run `$ components`.

```console
$ chat-app: components

  chat-app › outputs:
  url:  'http://chatapp-5m53dym.s3-website-us-east-1.amazonaws.com'

  60s › dev › my-chat-app › done
```

Leverage stage-specific environment variables by creating `.env` files per stage:

```text
.env # Default
.env.dev
.env.prod
```

## How To Write A Serverless Component

Install `@serverless/components` as a local dependency.

```
npm i --save @serverless/components
```

Use a `serverless.js` file, extend the Component class and add a `default` method.

```javascript
// serverless.js
const { Component } = require('@serverless/components')

class MyComponent extends Component {
  async default() {} // The default functionality to run/provision/update your Component
}
```

`default` is always required. Other methods are optional.

```javascript
// serverless.js

class MyComponent extends Component {
  /*
   * Default (Required)
   * - The default functionality to run/provision/update your Component
   */

  async default() {}

  /*
   * Remove (Optional)
   * - If your Component removes infrastructure, this is recommended.
   */

  async remove() {}

  /*
   * Anything (Optional)
   * - If you want to ship your Component w/ extra functionality, put it in a method.
   */

  async anything() {}
}
```

`this` comes loaded with lots of utilities which you can use.

```javascript
class MyComponent extends Component {
  async default() {
    // this.context features useful information
    console.log(this.context)

    // Get the targeted stage
    console.log(this.context.stage)

    // Common provider credentials are identified in the environment or .env file and added to this.context.credentials
    const dynamodb = new AWS.DynamoDB({ credentials: this.context.credentials.aws })

    // Save state
    this.state.name = 'myComponent'
    await this.save()

    // Load a child Component. This assumes you have the "@serverless/website" component
    // in your "package.json" file and ran "npm install"
    let website = await this.load('@serverless/website')

    // If you are deploying multiple instances of the same Component, include an instance id. This also pre-fills them with any existing state.
    let website1 = await this.load('@serverless/website', 'website1')
    let website2 = await this.load('@serverless/website', 'website2')

    // Call the default method on a Component
    let websiteOutputs = await website({ region: 'us-east-1' })

    // Or call any other method on a Component
    let websiteRemoveOutputs = await website.remove()

    // Show status...
    this.cli.status('Uploading')

    // Show a nicely formatted log statement...
    this.cli.log('this is a log statement')

    // Show a nicely formatted warning...
    this.cli.warn('this is a log statement')

    // Show nicely formatted outputs at the end of everything
    this.cli.outputs({ url: websiteOutputs.url })

    // Return your results
    return { url: websiteOutputs.url }
  }
}
```

To see a list of the available components you could use as children, checkout the [`registry.json`](./registry.json) file and checkout the referenced repos.

### How to Publish a Serverless Component

Just publish your component to npm as you normally would with any package. The only caveat is that you'll need to point your `main` property to the `serverless.js` file. Now anyone could use your new component programmatically.

If you'd like users to be able to use your component declaratively in `serverless.yml` as well, tag and push your released version [(e.g. `0.1.4`)](https://github.com/serverless-components/AwsLambda/releases/tag/0.1.4) to Github, then add your component to [the `registry.json` file](./registry.json). Users could then use your component like this:

```yml

yourComponent@0.1.4::yourComponentInstance
  firstInput: first-input
  secondInput: second-input

```

### Reserved Inputs

These can not be used as inputs for your Component and are reserved by the CLI. They can be accessed in your Component within `this.context`.

- `stage` `--stage`
- `root` `--root`
- `rootFile` `--rootFile`
- `credentials` `--credentials`
- `verbose` `--verbose`
- `debug` `--debug`
- `watch` `--watch`

Good luck.

**Created By**

- Eslam Hefnawy - [@eahefnawy](https://github.com/eahefnawy)
- Philipp Muens - [@pmmuens](https://github.com/pmuens)
- Austen Collins - [@austencollins](https://github.com/austencollins)
