```js
class Compute {
  addMiddleware({ pathToFunction }) {
    this.middleware.push(pathToFunction)
  }
}

class AWSLambdaCompute extends Compute {
  buildFunction({ code, handler }) {
    // build a handler that wraps the given handler and accepts this.middleware as functions to extend context
    return 'path/to/built/function'
  }
}

class Function {
  pack(instance, context) {
    const compute = instance.compute || context.get('compute.aws')
    // instance.compute is an instance of AWSLambdaCompute
    const handler = instance.compute.buildFunction({
      code: instance.code,
      handler: instance.handler
    })
  }
}

class IOPipeLogger extends Component {
  deploy(instance, context) {
    const allComputeInstances = context.query((qInstance) => is(AWSLambdaCompute, qInstance))
    forEach(
      (computeInstance) => computeInstance.addMiddleware(ioPipeMiddleware),
      allComputeInstances
    )
  }
}
```


```yaml
type: Service
name: MyService

compute:
  aws:
    type: AWSLambdaCompute


functions:
  myFunction1:
    handler: ...
    # compute: ${components.lambda}
  myFunction2:
    handler: ...
    # compute: ${components.lambda}

components:
  ioPipe:
    type: IOPipeLogger
  fileUploader:
    type: FileUploader
```

```yaml
type: Component
name: Compute

inputTypes:
  provider:
    type: Provider

provider: ${inputs.provider}
```

```js
// index.js
const Compute = {
  // constructor(instance, context) {
  //   super(instance, context)
  //   // do custom logic here
  // }

  addMiddleware(instance, { pathToFunction }) {
    instance.middleware.push(pathToFunction)
  }
}
```

```yaml
type: Object
name: Provider

credentials: !Object
```

```js
// index.js
const Provider = {
  getCredentials(instance) {
    return instance.credentials
  },

  getSDK() {
  	throw new Error('Implementing class is expected to implement the getSDK method')
	}
}
```

```yaml
type: Provider
name: AWSProvider

inputTypes:
  accessKeyId:
    type: String
  secretAccessKey:
 		type: String
  region:
    type: String

credentials:
  accessKeyId: ${inputs.accessKeyId}
  secretAccessKey: ${inputs.secretAccessKey}

region: ${inputs.region || 'us-east-1'}
```

```js
// index.js
const AWSProvider = {
  getSDK(instance) {
    return new AWS(instance.credentials, instance.region)
  }
}


class AWSLambdaCompute extends Compute {
  buildFunction(instance, { code, handler }, context) {
    // build a handler that wraps the given handler and accepts this.middleware as functions to extend context
    return 'path/to/built/function'
  }

  packFunction(instance, { code, handler }) {
    // TODO apply shim and set the handler value in the shim using an ENV
    code: './myFolder'
    code: [
      './myFolder',
      './awsShim'
    ]
    return codeStream // with zip pipe, etc applied
  }

  deployFunction(instance, {
  	codeStream,
    handler,
    memory,
    timeout,
    environment,
    // runtime,
    tags
  }, context) {
    // programmatically deploy AWSLambdaFunction
    const AWSLambdaFunction = context.loadType('AWSLambdaFunction')
    const awsLambdaFunction = context.construct(AWSLambdaFunction, {
      name: uniquelyGeneratedNameBasedOnFunctionInstanceId,
      code: codeStream,
      handler: hardCodedHandlerForShim,
      runtime: intance.runtime,
      memory: convertToLambdaMemory(memory) || instance.memory,
      timeout: convertToLambdaTimeout(timeout) || instance.timeout,
      environment: convertToLambdaEnvironment(environment) || instance.environment,
      tags: convertToLambdaTags(tags) || instance.tags,
      provider: instance.provider || context.get('providers.aws')
    }, context)

    awsLambdaFunction.deploy(context)
  }
}

class Function extends Component {
  pack(instance, context) {
    const compute = instance.compute || context.get('compute')
    // instance.compute is an instance of AWSLambdaCompute
    const handler = instance.compute.buildFunction({
      code: instance.code,
      handler: instance.handler
    })
  }

  deploy(instance, context) {
    const compute = instance.compute || context.get('compute')

    const codeStream = compute.packFunction({
      code: instance.code,
      handler: instance.handler
    }, context)

    compute.deployFunction({
      codeStream,
      memory: instance.memory,
      timeout: instance.timeout,
      environment: instance.environment,
      tags: instance.tags
    }, context)
  }
}



class AWSLambdaFunction extends Component {
  deploy(instance, context) {
    ...
  }
}

class GoogleCloudFunction extends Component {
  deploy(instance, context) {
    ...
  }
}


class IOPipeLogger extends Component {
  deploy(instance, context) {
    const allComputeInstances = context.query((qInstance) => is(AWSLambdaCompute, qInstance))
    forEach(
      (computeInstance) => computeInstance.addMiddleware(ioPipeMiddleware),
      allComputeInstances
    )
  }
}
```


```yaml
name: MyReusableComponent

inputTypes:
  compute:
    type: Compute (any compute instance)

components:
   myFunction:
      type: Function
      inputs:
        compute: ${inputs.compute}
```



```yaml
type: Service
name: MyService

providers:
  aws:
    type: AWSProvider
    inputs:
      region: us-east-1 // this is the default
      accessKeyId: ...
      secretAccessKey: ...
  azure:
    type: AzureProvider
    inputs:
      subscriberId: ...
      appId: ...
      appSecret: ..
      directoryId: ..

computes:
  lambda:
    type: AWSLambdaCompute
    inputs:
      region: us-east-2 // override to the provider default
      runtime: node@8.11
      provider: ${providers.aws}
      memory: 1024
      timeout: 10
      role: arn:
      environment:
        env1: ...
      tags:
        tag1: ...
  azure:
    type: AzureFunctionCompute
    inputs:
      runtime: java@8
      provider: ${providers.azure}

inputs.memory || instance.memory || instance.compute.memory


functions:
  myFunction1:
    handler: ./handler.js
    code: ./function
    # runtime: java@8
    memory: 2048 // override compute default
    compute: ${computes.lambda}
    environment: // merge with the compute environment property
      env2: ...
    tags: // merge with the compute environment property (function wins out over compute properties if there's a conflict)
      tag1: ...
  myFunction2:
    handler: ...
    compute: ${computes.azure}

components:
  ioPipe:
    type: IOPipeLogger
  fileUploader:
    type: FileUploader
```
