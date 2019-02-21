[![Serverless Framework V.2](https://s3.amazonaws.com/assets.github.serverless/readme-serverless-framework-v2-1.png)](http://serverless.com)

* [Chat App](./examples/chat-app)
* [Realtime App](./examples/realtime-app)
* [Websockets Backend](./examples/socket)
* [Website](./examples/website)
* [AWS Lambda Function](./examples/aws-lambda)

&nbsp;

## Example

Deploy serverless infrastructure, or an **entire serverless outcome** (e.g. a fullstack realtime app) in seconds...

```yaml
# serverless.yml

name: my-realtime-app

components:
  RealtimeApp::realtime-app:
    frontend:
      assets: ./frontend
    backend:
      assets: ./backend
```

```console
$ realtime-app: v2

  realtime-app › outputs:
  frontend: 
    url:  'http://realtimeapp-xqu5n6.s3-website-us-east-1.amazonaws.com'
  backend: 
    url:  'wss://2ozttnximh.execute-api.us-east-1.amazonaws.com/dev/'
    

  12s › dev › my-realtime-app › done
```

## Get Started

Clone repo.

```console
$ git clone https://github.com/serverless/v2.git
```

Install dependencies.

```console
$ cd v2 && npm link
```

Go into an [example](./examples).

```console
$ cd examples/chat-app
```

Add provider credentials (all examples currently require [AWS](https://aws.amazon.com/) credentials).  Serverless Framework V.2 supports `.env` files in the same folder as `serverless.yml` or `serverless.js`.  Create a `.env` that looks like this:

```text
AWS_ACCESS_KEY_ID=123456789
AWS_SECRET_ACCESS_KEY=987654321
```

Run `$ v2`.

```console
$ chat-app: v2

  chat-app › outputs:
  url:  'http://chatapp-5m53dym.s3-website-us-east-1.amazonaws.com'

  12s › dev › my-chat-app › done
```

Leverage stage-specific environment variables by creating `.env` files per stage:

```text
.env # Default
.env.dev
.env.prod
```

## How To Write A Serverless Component

Use a `serverless.js` file, extend the Component class and add a `default` method.

```javascript
// serverless.js

class MyComponent extends Component {

  async default() { } // The default functionality to run/provision/update your Component
  
}
```

`default` is always required.  Other methods are optional.

```javascript
// serverless.js

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

`this` comes loaded with lots of utilites which you can use.


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
    
    // Load a child Component
    let website = this.load('Website')
    
    // If you are deploying multiple instances of the same Component, include an instance id. This also pre-fills them with any existing state.
    let website1 = this.load('Website', 'website1')
    let website2 = this.load('Website', 'website2')
    
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

Good luck.


**Created By**

* Eslam Hefnawy - @eahefnawy
* Philipp Muens - @pmmuens
* Austen Collins - @austencollins
