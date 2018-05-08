# File System Components

This example shows how a component can declare a version range of the components core that it is compatible with.

## How it works

If you open the example applications [`serverless.yml`](./serverless.yml) file you can see that the component has a `core` property which is set to `0.1.x`.

If a this component is deployed with a version of components core that does not match then an error will be thrown and hte user will not be able to deploy the component.

## Use Cases

This feature is good for ensuring that the correct version of components is used with your components.
