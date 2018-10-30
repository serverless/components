# Component Lifecycle

Components are constructed in different ways depending upon the command that is executed.

## Concepts

Project

A serverless project is the code base that lives on a user's computer. A project represents the root level where the entry point to the users application can be found (often represented by a single serverless.yml file). A single git project is a good mental model for a serverless project.


A component application


# Component API

This document outlines the component methods that are available and gives a detailed explanation of the purpose of each method along with how to think about using and implementing the API for each component.

## construct(inputs, context)

Similar to a class constructor, this method can be used to assign properties to your component instance. You can also define any data for you instance as well like default values or instantiation of more complex data types.  (see note)

NOTE: This method is async and **must** be declared as async and **must** call and await the `super.construct` method. This will likely be changed in the near future to be sync to prevent confusion associated with writing this method.
```js
const MyComponent = {
  async construct(inputs, context) {
    await super.construct(inputs, context)
    this.myProp = inputs.myProp
  }
}
```

## define(context)
  - programmatically define your component's children

## hydrate(previousInstance, context)
- setup any values in your instance using the state of a previous instance. Used for preserving values across multiple calls to deploy when values don't change. Can also be used to rebuild complex data types that don't get persisted in state.  


## shouldDeploy(previousInstance, context)
- perform comparisons against the previous instance from state and indicate to the core whether your component should be deployed at all

## deploy(previousInstance, context)
- if your component is responsible for a specific resource, make the sdk calls to deploy the resource now

## remove(context)
  - if your component is responsible for a specific resource, make the sdk calls to remove the resource now
