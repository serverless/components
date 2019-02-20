[![Serverless Framework V.2](https://s3.amazonaws.com/assets.github.serverless/readme-serverless-framework-v2-1.png)](http://serverless.com)

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

Go into an [example](./examples).

```
cd examples/realtime-app
```

Add provider credentials (all examples currently require [AWS](https://aws.amazon.com/) credentials).  Serverless Framework V.2 supports `.env` files in the same folder as `serverless.yml` or `serverless.js`.  Create one that looks like this:

```text
AWS_ACCESS_KEY_ID=123456789
AWS_SECRET_ACCESS_KEY=987654321
```

Run `$ v2`.

```bash
$ realtime-app: v2

  realtime-app › outputs:
  url:  'http://serverless-p35yxi.s3-website-us-east-1.amazonaws.com'

  2s › dev › realtime-app › done
```

Leverage stage-specific environment variables by creating `.env` files per stage:

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
