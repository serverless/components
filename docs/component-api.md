# Component API

This document outlines the component methods that are available and gives a detailed explanation of the purpose of each method along with how to think about using and implementing the API for each component.

<br /><br />
## construct(inputs, context)

Similar to a class constructor, this method can be used to assign properties to your component instance. You can also define any data for you instance as well like default values or instantiation of more complex data types.  (see note)

*NOTE:* This method is optional. If you do implement this method, it is sync and **must** call the `super.construct` method.
<br />
<br />

**Params**
<p><code>inputs</code>: <code>Object</code> - The inputs object given to this component.</p>
<p><code>context</code>: <code>Context</code> - The application's context</p>

*NOTE:* inputs can be variables. Variables must be resolved before their value can be accessed. However, often you likely want the value of a variable after the variable's referenced value has been updated during deployment. If you assign a variable to your component's property, it will be resolved for you before the `deploy` method is called.<br />
<br />

**Returns**
<p>None</p>
<br />

**Example**
<p>The <code>construct()</code> method from AwsIamRole</p>

```js
const AwsIamRole = async (SuperClass, superContext) => {
  ...
  return class extends SuperClass {
    construct(inputs, context) {
      super.construct(inputs, context)
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


<br /><br />
## define(context)

This method can be used to programmatically define your component's children. Using this method you will construct any child components that this component would like to create as part of this component and return them to core. Once the components are returned to core, it will take over the responsibility of creating, updating and removing the each of the component children.

To define a component, simply construct any number of components and return them in either an object or an array.

*NOTE:* This method is optional to define. If you don't define this method, it will default to defining all components declared in `serverless.yml` as your component's children. If you DO define this method, you will also need to return any components declared in the components property in order for core to know about them.

This method optionally can be `async`.

<br />
<br />

**Params**
<p><code>context</code>: <code>Context</code> - The application's context.</p>
<br />

**Returns**
<p>An array or Object of component instances.</p>
<br />

**Example**
<p>The <code>define()</code> method from <code>AwsLambdaFunction</code></p>

```js
import { resolve } from '@serverless/utils'

const AwsLambdaFunction = async (SuperClass, superContext) => {
  const AwsIamRole = await superContext.import('AwsIamRole')

  return class extends SuperClass {
    ...
    async define(context) {
      let role = resolve(this.role)
      if (!role) {
        role = context.construct(
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

<br /><br />
## hydrate(previousInstance, context)

This method is used to setup any values in your instance using a previous instance. Used for preserving values across multiple calls to deploy when values don't change. Can also be used to rebuild complex data types that don't get persisted in state.  

This method is *sync only*

**Params**<br />
<p><code>prevInstance</code>: <code>Component</code> - The previous component instance, or <code>null</code> if there is no previous instance of this component.</p>
<p><code>context</code>: <code>Context</code> - The application's context.</p>
<br />


**Returns**
<p>None</p>
<br />

**Example**
<p>The <code>hydrate()</code> method from <code>AwsLambdaFunction</code></p>

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

<br /><br />
## shouldDeploy(prevInstance, context)

This method is used to perform comparisons against the previous instance from state and indicate to the core whether your component should be deployed at all.

This method optionally can be `async`.

<br />
<br />

**Params**
<p><code>prevInstance</code>: <code>Component</code> - The previous component instance, or <code>null</code> if there is no previous instance of this component.</p>
<p><code>context</code>: <code>Context</code> - The application's context.</p>
<br />


**Returns**
<ul>
  <li>If no operation should be taken by core, then this method should return `undefined`.</li>
  <li>If the component should be updated or created, this method should return the string `'deploy'`</li>
  <li>If the component should be replaced (removed then deployed again), this method should return the string `'replace'`</li>
</ul>

<p>
*Note:* replacements are performed in the order of first creating all new infrastructure for all components that are being both deployed and replaced and then finally removing all the old infrastructure.
</p>

<br />

**Example**
<p>The <code>shouldDeploy()</code> method for <code>AwsS3Bucket</code></p>

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

<br /><br />
## deploy(prevInstance, context)

If your component is responsible for a specific resource, make the sdk calls to deploy the resource now.

*Tip* You should try to focus each component on deploying only one resource. If your component is built from multiple resources, use the `define` method to construct them and return them to core. This way core will handle the heavy lifting of preserving their state, ordering their deployment amongst the other components, resolving their values and ensuring that deployments are properly resumed in the event that a deployment is disrupted. THIS LAST PART IS HARDER THAN IT SOUNDS.


**Params**
<p><code>prevInstance</code>: <code>Component</code> - The previous component instance, or <code>null</code> if there is no previous instance of this component.</p>
<p><code>context</code>: <code>Context</code> - The application's context.</p>
<br />

**Returns**
<p>None</p>
<br />

**Example:**
<p>The <code>deploy()</code> method for <code>AwsS3Bucket</code></p>

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

<br /><br />
## remove(context)
If your component is responsible for a specific resource, make the sdk calls to remove the resource now.

**Params**
<p><code>context</code>: <code>Context</code> - The application's context.</p>
<br />

**Returns**
<p>None</p>
<br />

**Example:**
<p>The <code>remove()</code> method for <code>AwsS3Bucket</code></p>

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

<br /><br />
## info()

This method is used to return data for pretty printing to the CLI. Users use the info command to get info about what was deployed on specific deployments.

This method optionally can be `async`.

**Params**
<p>None</p><br />

**Returns**
<p>An object in the following shape</p>

```js
{
  title: string,
  type: string,
  data: Object,
  children: Object
}
```

<br />

**Example:**
<p>The <code>info()</code> method from <code>AwsS3Bucket</code></p>

```js
const AwsS3Bucket = (SuperClass) =>
  class extends SuperClass {
    ...

    info() {
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
