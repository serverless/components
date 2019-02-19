# Serverless Framework V.2

&nbsp;

> _"The future of cloud is outcomes, not infrastructure."_

&nbsp;

* [Chat App](./examples/chat-app)
* [Realtime App](./examples/realtime-app)
* [Websockets Backend](./examples/socket)
* [Website](./examples/website)
* [AWS Lambda Function](./examples/aws-lambda)

&nbsp;

## Get Started

Clone repo.

```bash
$ git clone https://github.com/serverless/v2.git
```

Install dependencies.

```
cd v2 && npm link
```

Pick an [example](./examples). Each example requires credentials for Amazon Web Services set as environment variables.

Serverless Framework V.2 supports `.env` files in the same folder as `serverless.yml` or `serverless.js`.  Create one that looks like this:

```text
AWS_ACCESS_KEY_ID=123456789
AWS_SECRET_ACCESS_KEY=987654321
```

Run `$ v2`.

```bash
$ website: v2

  website › outputs:
  url:  'http://serverless-p35yxi.s3-website-us-east-1.amazonaws.com'
  env:  []


  2s › dev › my-site › done
```

You can leverage different environment variables for different stages by using this naming convention:

```
.env # Default
.env.dev
.env.prod
```

### How To Use A Serverless Component Programmatically

Create a new javascript file, and load/use Components like this:

```javascript

// To load a Component, instantiate it's class...
const realtimeApp = this.load('RealtimeApp')

// To run/deploy/update a Component, call it's default function...
await realtimeApp()

// To run extra functionality, use custom methods that come w/ the Component...
await realtimeApp.loadTest()
```

### How To Use A Serverless Component Declaratively

Use a `serverless.yml` file, like this:

```yaml
name: my-realtime-app
stage: dev

components:
  RealtimeApp::realtime-app:
    frontend:
      assets: ./frontend/build
    backend:
      assets: ./backend
```

Then use your CLI, like this:

```bash
# To run/deploy/update all Components, call 'serverless'...
$ v2

# To run extra functionality that comes in a component, call it's method like this...
$ v2 remove
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

  /*
  * Anything (Optional)
  * - If you want to ship your Component w/ extra functionality, put it in a method.
  */

  async anything() { }
}

```

**Created By**

* Eslam Hefnawy - @eahefnawy
* Philipp Muens - @pmmuens
* Austen Collins - @austencollins
