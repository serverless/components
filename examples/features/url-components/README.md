# Url Components

This example shows how components which are located at a url can be used.

## How it works

If you open the example applications [`serverless.yml`](./serverless.yml) file you can see that the `myCustomComponent` components `type` property references a url rather than a name of a component available at the registry.

The `myCustomComponent` component is located at [`https://github.com/eahefnawy/component-url-test/archive/master.zip`](https://github.com/eahefnawy/component-url-test/archive/master.zip) and includes the `serverless.yml` and `index.js` files which provide the components logic.

## Use Cases

Components located at urls are useful for sharing components between teams or making them publicly available for general consumption.
