# Serverless Framework V.2

&nbsp;

> _"The future of cloud is outcomes, not infrastructure."_

&nbsp;

* [AWS Lambda Function](./examples/aws-lambda)
* [Website](./examples/website)
* [Websockets Backend](./examples/socket)
* [Realtime Fullstack App](./examples/realtime-app)
* [Chat App](./examples/chat-app)

&nbsp;

## Get Started

Clone the repo.

```bash
$ git clone https://github.com/serverless/v2.git
```

Install dependencies.

```
cd v2 && npm i -g
```

Pick an [example](./example). Each example requires credentials for Amazon Web Services set as environment variables.

Serverless Framework V.2 supports `.env` files in the same folder as `serverless.yml` or `serverless.js`.  Create one that looks like this:

```text
AWS_ACCESS_KEY_ID=123456789
AWS_SECRET_ACCESS_KEY=987654321
```

Then run `$ v2`

```bash
$ website: v2
  
  ✔  my-site

     URL  http://serverless-6vql3jp9.s3-website-us-east-1.amazonaws.com

  3s › dev › my-site › Done
```

You can leverage different environment variables for different stages by using this naming convention:

```
.env // Default
.env.dev
.env.prod
```

### How To Use A Serverless Component Programmatically

Create a new javascript file, and load/use Components like this:

```javascript

// To load a Component, instantiate it's class...
const realtimeApp = new RealtimeApp('instanceId', { /* inputs */ })

// To run/deploy/update a Component, call it's default function...
await realtimeApp()

// To run extra functionality, use custom methods that come w/ the Component...
await realtimeApp.loadTest()
```

### How To Use A Serverless Component Declaratively

Use a `serverless.yaml` file, like this:

```yaml

name: realtimeApp
stage: dev

providers:
  AwsProvider::aws:
    accessKeyId: ${secrets:aws_access_key_id}
    secretAccessKey: ${secrets:secret_access_key}

components:
  RealtimeApp::realtimeApp:
    name: ${name}-${stage}
    code: ./src/backend
```

Then use your CLI, like this:

```bash
# To run/deploy/update all Components, call 'serverless'...
$ serverless

# To run extra functionality that comes with the a component, call this...
$ serverless loadTest myRealtimeApp

# To remove Components in YAML, call this...
$ serverless remove
```

### How To Write A Serverless Component

Use a `serverless.js` file, like this:

```javascript

class MyComponent extends Component {

  /*
  * Default (Required)
  * - The default functionality to run/provision/update your Component
  */

  async default() { }

  /*
  * Remove (Optional)
  * - If your Component removes infrastructure, this is recommended.
  */

  async remove() { }
}

```

**Created By**

* Eslam Hefnawy - @eahefnawy
* Philipp Muens - @pmmuens
