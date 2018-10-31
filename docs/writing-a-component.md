# Writing a component guide

This guide is meant to help you kick-start your component development. It also outlines some best practices associated with writing a component.

**Note:** Make sure to re-visit the [core concepts](./concepts.md), before you jump right into the component implementation.


## Basic setup

In this guide we'll build a simple `greeter` component which will greet us with a custom message when we run the `deploy`, `greet` or `remove` commands.

First, we need to create a dedicated directory for our component. This directory will include all the necessary files for our component, like its `serverless.yml` file, the `index.js` file (which includes the component's logic), and files such as `package.json` to define it's dependencies.

Go ahead and create a `greeter` directory in the "Serverless Registry" directory located at [`registry`](./registry).

### `serverless.yml`

Let's start by describing our components interface. We define the interface in the `serverless.yml` file. Create this file in the components directory and paste in the following content:

```yaml
type: greeter

inputTypes:
  firstName:
    type: string
    required: true
  lastName:
    type: string
    required: true
```

Let's take a closer look at the code we've just pasted. At first, we define the `type` (think of it as an identifier or name) of the component. In our case the component is called `greeter`.

Next up, we need to declare the `inputTypes` our component has. `inputTypes` define the shape of our inputs and are accessible from within the component's logic. In our case we expect a `firstName` and a `lastName`.

That's it for the component definition. Let's move on to its implementation logic.

### `index.js`

The component's logic is implemented with the help of an `index.js` file which is located in the root of the components directory. Go ahead and create an empty `index.js` file in the component's root directory.

Then we'll implement the logic for the `deploy`, `greet` and `remove` commands. We do this by adding the respective functions into the file and exporting them so that the framework CLI can pick them up (_Remember:_ only the exported functions are accessible via CLI commands).

Just paste the following code in the `index.js` file:

```js
// "private" functions
function greetWithFullName(inputs, context) {
  context.log(`Hello ${inputs.firstName} ${inputs.lastName}!`)
}

// "public" functions
function deploy(inputs, context) {
  greetWithFullName(inputs, context)

  if (context.state.deployedAt) {
    context.log(`Last deployment: ${context.state.deployedAt}...`)
  }

  const deployedAt = new Date().toISOString()

  const updatedState = {
    ...context.state,
    ...inputs,
    deployedAt
  }
  context.saveState(updatedState)

  return updatedState
}

function greet(inputs, context) {
  context.log(`Hola ${inputs.firstName} ${inputs.lastName}!`)
}

function remove(inputs, context) {
  greetWithFullName(inputs, context)
  context.log('Removing...')
  context.saveState()
}

module.exports = {
  deploy,
  greet,
  remove
}
```

Let's take a closer look at the implementation.

Right at the top we've defined a "helper" function we use to reduce code duplication (this function is not exported at the bottom and can therefore only be used internally). This `greetWithFullName` function gets `inputs` and `context`, and then logs a message which greets the user with his full name. Note that we're using the `log` function which is available at the `context` object instead of the native `console.log` function. The `context` object has other, very helpful functions and data attached to it.

Next up, we've defined the `deploy` function. This function is executed every time the user runs a `deploy` command since we've exported it at the bottom of the file. At first, we re-use our `greetWithFullName` function to greet our user. Then we check the state to see if we've already deployed it. If this is the case we log out the timestamp of the last deployment. After that we get the current time and store it in an object which includes the `state`, the `inputs` and the new `deployedAt` timestamp. We store this object that reflects our current state. After that we return the object as `outputs`.

The `greet` function is a custom `command` we use to extend the CLI's capabilities. Since we've exported it at the bottom of the file it'll be executed every time someone runs the `greet` command. The functionality is pretty straightforward. We just log out a different greeting using the `context.log` method and the `inputs`.

The last function we've defined in our component's implementation is the `remove` function. The `remove` command is also accessible from the CLI because we export it at the bottom of the file. The function's code is also pretty easy to understand. At first we greet our user using the `greetWithFullName` helper function. Then we log a message that the removal was triggered and store an empty state (meaning that there's no more state information available).

### Testing

Let's test our component!

First of all let's create a new example application which uses our `greeter` component. `cd` into the `examples` directory by running:

```sh
cd examples
```

Create a new directory named `test` which has one `serverless.yml` file with the following content:

```yml
type: my-application

components:
  myGreeter:
    type: greeter
    inputs:
      firstName: John
      lastName: ${env.LAST_NAME}
```

If we take a closer look at the `serverless.yml` file we can see that our `lastName` config value depends on an environment variable called `LAST_NAME` which is fetched from the local environment. This means that we need to export this variable so that the framework can pick it up and pass it down to our `inputs`:

```sh
export LAST_NAME=Doe
```

That's it. Let's take it for a spin. Run the following commands to test the components logic:

```
components deploy

components deploy

components greet

components remove
```

Congratulations! You've successfully created your first Serverless component!



## Best Practices


### Composing components


### Create a component for each low level resource

A lower level component is a component that is responsible for constructing a resource on a SaaS service or cloud service. When writing these types of components it is important to remember that the core of the Serverless framework works with your component to orchestrate the deployment of it along side all of the other components in the application. The framework is responsible not only for managing the state of your component but also responsible for ordering its deployment based on which components depend upon it and which components it depends directly upon.
