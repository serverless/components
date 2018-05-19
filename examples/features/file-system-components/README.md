# File System Components

This example shows how local components which are not (yet) published to the registry can be used.

## How it works

If you open the example applications [`serverless.yml`](./serverless.yml) file you can see that the `myCustomComponent` components `type` property references a local directory rather than a name of a component available at the registry.

The `myCustomComponent` component is located at [`my-component`](./my-component) and includes the `serverless.yml` and `index.js` files which provide the components logic.

## Use Cases

Components located on the local file system come in handy if custom components should be packaged up and used in the applications code base without the need to publish them to the registry beforehand.
