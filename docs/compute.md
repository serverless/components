# Compute

The compute abstraction offers a mechanism for specifying which compute functions will run on separately from the declaration of the function itself.

From this, we gain a method for abstracting compute from the function enabling functions to be written in such a way where the function deployment target can be configured later.

**Example: A service the deploys functions to multiple providers**
```yaml
name: MultiProviderService
extends: Service

providers:
  aws:
    type: AwsProvider
    inputs:
      accessKeyId: 1234567890
      secretAccessKey: 1234567890
      region: us-east-1
  azure:
    type: AzureProvider
    inputs:
      subscriptionId: 1234567890
      directoryId: 1234567890
      appId: 1234567890
      subscriptionId: 1234567890
      location: us-east-1

compute:
  awsLambda:
    type: AwsLambdaCompute
    inputs:
      provider: ${self.providers.aws}
      runtime: nodejs@8.11
      memory: 512  # default memory
      timeout: 10  # default timeout

  fargate:
    type: FargateCompute
    inputs:
      provider: ${self.providers.aws}
      memory: 1024
      ...
  azureFunctions:
    type: AzureFunctionsCompute
    inputs:
      provider: ${self.providers.azure}
      runtime: nodejs@8.11
      memory: 512
      timeout: 10

functions:
  # deploy function to lambda
  helloLambda:
    compute: ${self.compute.fargate}
    handler: index.helloLambda
    code: ./code
    memory: 1024
    environment:
      foo: bar
    tags:
      bar: baz

  # deploy function to azure
  helloAzure:
    compute: ${self.compute.azureFunctions}
    handler: index.helloAzure
    code: ./code
    memory: 1024

  # deploy function to lambda AND azure    
  helloWorld:
    compute:
      aws: ${input.compute.awsLambda}
      azure: ${inputs.compute.azureFunctions}
    handler: index.helloWorld
    code: ./code
```


```yaml
name: AwsService
extends: Service

providers:
  aws:
    type: AwsProvider
    default: true #OR this...
    inputs:
      accessKey: 1234567890
      secretKey: 1234567890
      region: us-east-1

compute:
  type: AwsLambdaCompute
  inputs:
    # provider: ${self.providers.aws} // This value is set by context
    runtime: nodejs
    memory: 512  # default memory
    timeout: 10  # default timeout

functions:
  # deploy function to lambda
  helloLambda:
    compute:   
      type: AwsLambdaCompute
      inputs:
        # provider: ${self.providers.aws}
        runtime: nodejs
        memory: 512  # default memory
        timeout: 10  # default timeout
    handler: index.helloLambda
    code: ./code
    memory: 1024

components:
  database:
    type: DynamoDB
    inputs:
      # provider: ${self.providers.aws}
      ...
  fargate:
    type: Fargate # this has 15 AWS components under the hood!
    inputs: ...
```

**Example: A compute agnostic component that accepts the compute as an input so it can be configured by the end user of this component**
```yaml
name: FindFaces
extends: Component

inputTypes:
  compute:
    type: Compute

components:
  findFacesInImage:
    type: Function
    inputs:
      compute: ${inputs.compute}
      handler: index.findFacesInImage
      code: ./code
      memory: 2048
```


# Concepts

## Function

A cloud agnostic function definition in a component that allows for compute to be configured through an input.



The general function instance hands off to the compute instance to perform the deployment

```js
const Function = {
  deploy: async (instance, context) => {
    // const { name, handler, code, runtime, memory, timeout } = instance

    if (is(Compute, instance.compute)) {
      instance.compute.deployFunction(instance, context)
    } else {
      forEachObjIndexed((c) => c.deployFunction(instance, context), instance.compute)
    }
  }
  ...
}
```


## Compute

A general interface for provider specific compute abstractions

```js
const AwsLambdaCompute = {
  async defineFunction(instance, functionInstance, context) {
    const provider = instance.provider

    const inputs = {
      ...convertFunctionPropsToAWS(functionInstance),
      provider
    }
    // create the AwsLambdaFunction and deploy
    const AwsLambdaFunction = await context.import('AwsLambdaFunction')
    const awsLambdaFunction = context.construct(AwsLambdaFunction, inputs)
    awsLambdaFunction.deploy(context)
  }
}
```


## Provider

A provider holds a set of credentials for a specific cloud or service (aws, google, twilio, etc)

*Example: Declaring a Provider in a Service*
```yaml
name: SimpleService
extends: Service

providers:
  aws:
    type: AwsProvider
    inputs:
      accessKeyId: ...
      secretAccessKey: ...
      region: ...optional
```

*Example: Declaring a Provider as a component*
```yaml
name: MyComponent
extends: Component

components:
  myProvider:
    type: AwsProvider
    inputs:
      accessKeyId: ...
      secretAccessKey: ...
      region: ...optional
```

A Provider offers a set of methods for retrieving the credentials as well as the SDK for that provider with the credentials configured.

```js
const AwsProvider = {
  getCredentials(instance) {
    return instance.credentials
  },

  getSdk(instance, { region }) {
    const config =  new AWS.Config({
      accessKeyId: instance.credentials.accessKeyId,
      secretAccessKey: instance.credentials.secretAccessKey,
      region: region || instance.region
    })
    // build sdk
    return sdk
  }
}
````
