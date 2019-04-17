[![Serverless Components](https://s3.amazonaws.com/assets.github.serverless/components/serverless-components-readme.gif)](http://serverless.com)

<h4 align="center">Updates ⚡️ <a href="https://github.com/serverless/components/releases/tag/0.1.18">v0.1.18 is released with 14 components & 8 high level templates.</a></h4>


Serverless Components is a framework for provisioning and composing cloud services into higher-level abstractions, like features and applications.  It depends on external [Components](https://www.github.com/serverless-components), which are javascript libraries that can provision something, like infrastructure or a whole software feature built on multiple piecs of infrastructure.  

You can use Components programmatically with a `serverless.js` file:

```javascript

MyComponent extends Component {
  async default() {
    const website = this.load('@serverless/website') // Load a component
    const outputs = website({ code: './code' }) // Deploy it
    this.state.url = outputs.url
    await this.save()
  }
}

```

You can also use Components declaratively with a `serverless.yml` file:

```yaml
name: my-app

website:
  component: "@serverless/website"
  inputs:
    code: ./code
```

```shell
$ components # Run this CLI command to deploy
```

&nbsp;

- [Get Started](#get-started)
- [Available Components](#available-components)
- [Programatic Usage](#programatic-usage)
- [Declarative Usage](#declarative-usage)

&nbsp;

## Get Started

Install components.

```console
$ npm i -g @serverless/components

```

create a directory for your new component.

```console
$ mkdir my-component && cd my-component
```

Run `components` and choose what you'd like to create. Choose `My Own Component` for a quick tour that helps you create your own component, which could programmatically use existing components from npm.

```console
$ components
? What would you like to create in this directory? › - Use arrow-keys. Return to submit.
❯  My Own Component
   Function
   API
   Website
   Realtime Application
   Chat Application
   Websocket Backend
```

Now every time you run `components`, you'll be running your new component. **Check out the generated files for more information**.

#### Setting Credentials

When you're using or building components, you'll likely need provider credentials (e.g. AWS api keys), you can set credentials for each stage by creating `.env` files in the root of the directory that contains `serverless.js` or `serverless.yml`.

```
$ touch .env      # your development credentials
$ touch .env.prod # your production credentials
```

the `.env` files are not required if you have the aws keys set globally and you want to use a single stage, but they should look like this in the case of AWS.

```
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
```

## Available Components

Instead of creating your own component, you could also choose to generate a `serverless.yml` template that uses one or more of the available components (e.g. `Chat Application`), which would copy one of the available [templates](./templates) into the current working directory.

After choosing what you'd like to create from the prompt, run `components` to run your template.

```console
$ chat-app: components

  chat-app › outputs:
  url:  'http://chatapp-5m53dym.s3-website-us-east-1.amazonaws.com'

  53s › dev › my-chat-app › done
```

And there you have it! A complete chat application deployed to your own infrastructure in seconds.

These are the available components you could instantly deploy declarateively with a `serverless.yml` file, or programmatically with a `serverless.js` file. Check out each component repo for complete docs on how to use them.

&nbsp;

- [RealtimeApp](https://github.com/serverless-components/RealtimeApp)
- [Socket](https://github.com/serverless-components/Socket)
- [Website](https://github.com/serverless-components/Website)
- [ChatApp](https://github.com/serverless-components/ChatApp)
- [Schedule](https://github.com/serverless-components/schedule)
- [Mono](https://github.com/serverless-components/mono)
- [AwsDynamoDb](https://github.com/serverless-components/AwsDynamoDb)
- [AwsApiGateway](https://github.com/serverless-components/AwsApiGateway)
- [AwsIamRole](https://github.com/serverless-components/AwsIamRole)
- [AwsLambda](https://github.com/serverless-components/AwsLambda)
- [AwsLambdaLayer](https://github.com/serverless-components/AwsLambdaLayer)
- [AwsS3](https://github.com/serverless-components/AwsS3)
- [AwsWebSockets](https://github.com/serverless-components/AwsWebSockets)

&nbsp;

## Programatic Usage

You can use any of the above components programatically, while at the same time creating your own higher level component. All you need to do is:

Install `@serverless/components` as a local dependency.

```
npm i --save @serverless/components
```

Create a `serverless.js` file, extend the Component class and add a `default` method.

```javascript
// serverless.js
const { Component } = require('@serverless/components')

class MyComponent extends Component {
  async default(inputs = {}) {} // The default functionality to run/provision/update your Component
}
```

`default` is always required. Other methods are optional. They all take an `inputs` object.

```javascript
// serverless.js

class MyComponent extends Component {
  /*
   * Default (Required)
   * - The default functionality to run/provision/update your Component
   * - You can run this function by running the "components" command
   */

  async default(inputs = {}) {}

  /*
   * Remove (Optional)
   * - If your Component removes infrastructure, this is recommended.
   * - You can run this function by running the "components remove"
   */

  async remove(inputs = {}) {}

  /*
   * Anything (Optional)
   * - If you want to ship your Component w/ extra functionality, put it in a method.
   * - You can run this function by running the "components anything" command
   */

  async anything(inputs = {}) {}
}
```

`this` comes loaded with lots of utilities which you can use.

```javascript
class MyComponent extends Component {
  async default(inputs = {}) {
    // this.context features useful information
    console.log(this.context)

    // Get the targeted stage
    console.log(this.context.stage)

    // Common provider credentials are identified in the environment or .env file and added to this.context.credentials
    // when you run "components", then the credentials in .env will be used
    // when you run "components --stage prod", then the credentials in .env.prod will be used...etc
    // if you don't have any .env files, then global aws credentials will be used
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
    
    // You can also load a local component that is not yet published to npm
    // just reference the root dir that contains the serverless.js file
    let localComponent = await this.load('../my-local-component')

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

Just run `components` in the directory that contains the `serverless.js` file to run your new component. You'll will see all the logs and outputs of your new components. Logs and outputs of any child component you use will not be shown, unless you run in verbose mode: `components --verbose`.

For complete real-world examples on writing components, [check out our official components](https://github.com/serverless-components)

## Declarative Usage

If you want to compose some components together, without creating your own component, you can also do it in declaratively, in YAML.

Create a `serverless.yml` file that looks like this.


```yml
name: my-stack      # a unique name to be reused
stage: dev          # a global stage to be reused
region: us-east-2   # a global region to be reused
anything: something # you can put any property here that could be reused.

# this property is identified as a component because it contains a component key
myLambda:
  component: "@serverless/aws-lambda" # the npm package name of the component that core would download and cache.
  
  # inputs to be passed to the component.
  # each component expects a different set of inputs.
  # check the respective docs of each component.
  inputs: 
    name: ${name}-{stage}-lambda      # you can reference any property above
    region: ${region}                 # referencing the global region
    env:
      TABLE_NAME: {comp:myTable.name} # you can also reference the outputs of another component in this file
      
myTable:
  component: "@serverless/aws-dynamodb@0.1.0" # you could pint to a specific npm version
  inputs:
    name: {name}-table
    region: ${region}

# you could also use point to a local component directory with a serverless.js file
# very useful when developing & testing components
localComponent:
  component: "../my-component" # path to local component
  inputs:
    name: {anything}-something
```

when you run `components` or `components remove` in the directory that contains the `serverless.yml` file, the core will set up a dependency graph based on your references and run the `default` function of each component in order. Only `default` and `remove` functions could be run when using `serverless.yml`. If you'd like to call a custom function of a component, use it programatically as explained above.

&nbsp;

**Created By**

- Eslam Hefnawy - [@eahefnawy](https://github.com/eahefnawy)
- Philipp Muens - [@pmuens](https://github.com/pmuens)
- Austen Collins - [@ac360](https://github.com/ac360)
