# Component API

This document outlines the component methods that are available and gives a detailed explanation of the purpose of each method along with how to think about using and implementing the API for each component.


## construct(inputs, context)

Similar to a class constructor, this method can be used to assign properties to your component instance. You can also define any data for you instance as well like default values or instantiation of more complex data types.  (see note)

NOTE: This method is async and **must** be declared as async and **must** call and await the `super.construct` method. This will likely be changed in the near future to be sync to prevent confusion associated with writing this method.


**Params**
`inputs`: `Object` - The inputs object given to this component.
`context`: `Context` - The application's context

*NOTE:* inputs can be variables. Variables must be resolved before their value can be accessed. However, often you likely want the value of a variable after the variable's referenced value has been updated during deployment. If you assign a variable to your component's property, it will be resolved for you before the `deploy` method is called.

**Returns**
None

**Example:** construct() method from AwsIamRole

```js
const AwsIamRole = async (SuperClass, superContext) => {
  ...
  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      const defaultPolicy = {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
      this.provider = inputs.provider
      this.service = inputs.service
      this.policy = inputs.policy || defaultPolicy
      this.roleName = inputs.roleName || `role-${this.instanceId}`
    }
  }
  ...
}
```

## define(context)

This method can be used to programmatically define your component's children. Using this method you will construct any child components that this component would like to create as part of this component and return them to core. Once the components are returned to core, it will take over the responsibility of creating, updating and removing the each of the component children.

To define a component, simply construct any number of components and return them in either an object or an array.

NOTE: This method is optional to define. If you don't define this method, it will default to defining all components declared in `serverless.yml` as your component's children. If you DO define this method, you will also need to return any components declared in the components property in order for core to know about them.

**Params**
`context`: `Context` - The application's context

**Returns**
An array or Object of component instances.

**Example:** define() method from `AwsLambdaFunction`

```js
import { resolve } from '@serverless/utils'

const AwsLambdaFunction = async (SuperClass, superContext) => {
  const AwsIamRole = await superContext.loadType('AwsIamRole')

  return class extends SuperClass {
    ...
    async define(context) {
      let role = resolve(this.role)
      if (!role) {
        role = await context.construct(
          AwsIamRole,
          {
            roleName: `${resolve(this.functionName)}-execution-role`,
            service: 'lambda.amazonaws.com',
            provider: this.provider
          },
          context
        )
        this.role = role
      }
      return { role }
    }
    ...
  }
}
```


## hydrate(previousInstance, context)

This method is used to setup any values in your instance using a previous instance. Used for preserving values across multiple calls to deploy when values don't change. Can also be used to rebuild complex data types that don't get persisted in state.  

**Params**
`prevInstance`: `Component` - The previous component instance, or `null` if there is no previous instance of this component.
`context`: `Context` - The application's context

**Returns**
None

**Example:** hydrate() method from `AwsLambdaFunction`
```js
const AwsLambdaFunction = async (SuperClass, superContext) => {
  ...
  return class extends SuperClass {
    ...
    hydrate(prevInstance) {
      this.arn = get('arn', prevInstance)
    }
    ...
  }
}
```

## shouldDeploy(prevInstance, context)
This method is used to perform comparisons against the previous instance from state and indicate to the core whether your component should be deployed at all.


**Params**
`prevInstance`: `Component` - The previous component instance, or `null` if there is no previous instance of this component.
`context`: `Context` - The application's context

**Returns**
- If no operation should be taken by core, then this method should return `undefined`.
- If the component should be updated or created, this method should return the string `'deploy'`.
- If the component should be replaced (removed then deployed again), this method should return the string `'replace'`.


*Note:* replacements are performed in the order of first creating all new infrastructure for all components that are being both deployed and replaced and then finally removing all the old infrastructure.

**Example:** shouldDeploy() method for `AwsS3Bucket`
```js
import { resolve } from '@serverless/utils'

const AwsS3Bucket = (SuperClass) =>
  class extends SuperClass {
    ...

    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return 'deploy'
      }

      if (prevInstance.bucketName !== resolve(this.bucketName)) {
        return 'replace'
      }
    }
    ...
  }
}
```

## deploy(prevInstance, context)

If your component is responsible for a specific resource, make the sdk calls to deploy the resource now.

*Tip* You should try to focus each component on deploying only one resource. If your component is built from multiple resources, use the `define` method to construct them and return them to core. This way core will handle the heavy lifting of preserving their state, ordering their deployment amongst the other components, resolving their values and ensuring that deployments are properly resumed in the event that a deployment is disrupted. THIS LAST PART IS HARDER THAN IT SOUNDS.


**Params**
`prevInstance`: `Component` - The previous component instance, or `null` if there is no previous instance of this component.
`context`: `Context` - The application's context

**Returns**
None

**Example:** deploy() method for `AwsS3Bucket`
```js
const AwsS3Bucket = (SuperClass) =>
  class extends SuperClass {
    ...
    async deploy(prevInstance, context) {
      context.log(`Creating Bucket: '${get('bucketName', this)}'`)
      await createBucket(this)
      context.log(`Bucket created: '${get('bucketName', this)}'`)
    }
    ...
  }
}
```


## remove(context)
If your component is responsible for a specific resource, make the sdk calls to remove the resource now.

**Params**
`context`: `Context` - The application's context

**Returns**
None

**Example:** remove() method for `AwsS3Bucket`
```js
const AwsS3Bucket = (SuperClass) =>
  class extends SuperClass {
    ...
    async remove(context) {
      context.log(`Removing Bucket: '${this.bucketName}'`)
      await deleteBucket(this)
    }
    ...
  }
}
```


## info()

This method is used to return data for pretty printing to the CLI. Users use the info command to get info about what was deployed on specific deployments.


**Params**
None

**Returns**
An object in the following shape
```js
{
  title: string,
  type: string,
  data: Object,
  children: Object
}
```

**Example:** info() method from `AwsS3Bucket`
```js
const AwsS3Bucket = (SuperClass) =>
  class extends SuperClass {
    ...

    async info() {
      return {
        title: this.name,
        type: this.extends,
        data: pick(['name', 'license', 'version', 'bucketName'], this)
      }
    }
    ...
  }
}
```
