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

```javascript

// To load a Component, instantiate it's class...
const realtimeApp = new RealtimeApp('instanceId', { /* inputs */ })

// To run/deploy/update a Component, call it's default function...
await realtimeApp()

// To run extra functionality, use custom methods that come w/ the Component...
await realtimeApp.loadTest()
```

### How To Use A Serverless Component Declaratively

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

```bash
# To run/deploy/update all Components, call 'serverless'...
$ serverless

# To run extra functionality that comes with the a component, call this...
$ serverless loadTest myRealtimeApp
```

### How To Write A Serverless Component

```javascript

class MyComponent extends Component {

  // Default: Required – The Default command to run the Component
  async default() { }

  // Remove: Optional - Removes infrastructure
  async remove() { }
}
```
