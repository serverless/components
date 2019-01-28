# Serverless Framework V.2

### Set-Up

```bash
git clone https://github.com/serverless/v2.git
cd v2
```

### Demo

Run the Parent component from components directory to see everything happening in action.

```bash
Parent (master)$ cd components/Parent
Parent (master)$ node ../../bin/v2

   Status:  Parent Deployment Succeeded

   Arn: parent:arn

Parent (master)$
```

**Note:** Checkout the Parent & Child Components code to understand how everything fits together. Lot's of helpful comments there. Also checkout the Component class to see how the magic happens!

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
