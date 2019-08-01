/*
 * Welcome to Serverless Components!
 *
 * This is a quick boilerplate that will help you create your own component.
 * For some real world examples, checkout the Serverless Components Github Organization.
 *
 * https://github.com/serverless-components
 */

// import the Component class and some useful utilities
const { Component, utils } = require('@serverless/core')

class MyComponent extends Component {
  /*
   * Default (Required)
   * The default functionality to run/provision/update your Component
   * You can run this function by running the "components" command
   */

  async default(inputs = {}) {
    // use the inputs param to get component configuration from users of your component

    // Show status...
    this.context.status('Showing you around')

    await utils.sleep(2000)

    // Show a nicely formatted log statement...
    this.context.log('This is a log statement')
    this.context.log('------------')

    await utils.sleep(2000)

    // Show a nicely formatted debug statement...
    this.context.log('Printing a "debug" statement (use "--debug" to see it)...')
    this.context.log('')
    this.context.debug('This is a debug statement visible when someone uses the "serverless --debug" option')
    this.context.log('------------')

    await utils.sleep(4000)

    this.context.log('You can specify credentials in a ".env" file')
    this.context.log('Serverless Components recognizes various ENV keys from popular cloud vendors and will add them to the "this.context.credentials" object.')
    this.context.log('------------')

    await utils.sleep(6000)

    this.context.log('The "this.context" object features some useful info and methods.')
    this.context.log('Use "this.context.resourceId()" to generate a string to use for cloud resource names, to ensure no name collisions occur:')
    this.context.log('Here is the result of running "this.context.resourceId()":  "' + this.context.resourceId() + '"')
    this.context.log('------------')

    await utils.sleep(3000)

    // Save state
    // This component's state and any child component states are saved in the .serverless directory
    this.state.name = 'myComponent'
    await this.save()

    // Common provider credentials are identified in the environment or .env file and added to this.context.credentials
    // The following line assumes you have the aws-sdk package installed locally
    // const dynamodb = new AWS.DynamoDB({ credentials: this.context.credentials.aws })

    // Load a child Component.
    // The following line assumes you have the "@serverless/website" package/component installed locally
    // const website = await this.load('@serverless/website')

    // If you are deploying multiple instances of the same Component, include an instance id.
    // This also pre-fills them with any existing state for that child component.
    // const website1 = await this.load('@serverless/website', 'website1')
    // const website2 = await this.load('@serverless/website', 'website2')

    // You can also load a local component that is not yet published to npm
    // just reference the root dir that contains the serverless.js file
    // const localComponent = await this.load('../my-local-component')

    // Call the default method on a Component
    // const websiteOutputs = await website({ region: 'us-east-1' })

    // Or call any other method on a Component
    // const websiteRemoveOutputs = await website.remove()

    // Return your outputs
    return { url: 'https://serverless.com' }
  }

  /*
   * Remove (Optional)
   * If your Component removes infrastructure, this is recommended.
   * You can run this function by running the "components remove"
   */

  async remove(inputs = {}) {
    this.context.status('Removing')
    // Don't forget to remove any child components you previously provisioned
    // const websiteRemoveOutputs = await website.remove()
  }

  /*
   * Anything (Optional)
   * If you want to ship your Component w/ extra functionality, put it in a method.
   * You can run this function by running the "components anything" command
   */

  async anything(inputs = {}) {
    this.context.status('Running Anything')
    await utils.sleep(6000)
  }
}

// export your component
module.exports = MyComponent

/*
 * To publish your component for the world to use, just publish it to npm like you normally would
 * Just don't forget to point the "main" property of "package.json" to this "serverless.js" file
 */
