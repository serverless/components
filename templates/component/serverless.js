/*
 * Welcome to Serverless Components!
 *
 * This is a quick boilerplate that will help you create your own component.
 * For some real world examples, checkout the Serverless Components Github Organization.
 *
 * https://github.com/serverless-components
 */

// import the Component class and some useful utilities
const { Component, sleep } = require('@serverless/components')

class MyComponent extends Component {
  /*
   * Default (Required)
   * The default functionality to run/provision/update your Component
   * You can run this function by running the "components" command
   */

  async default(inputs = {}) {
    // use the inputs param to get component configuration from users of your component

    // Show status...
    this.cli.status('Showing you around')

    await sleep(2000)

    // Show a nicely formatted log statement...
    this.cli.log('this is a log statement')

    await sleep(2000)

    // Show a nicely formatted warning...
    this.cli.warn('this is a warning statement')

    await sleep(2000)

    // Get the targeted stage.
    // for example, if you run "components --stage prod" you'll be running in the "prod" stage
    // and will be using the .env.prod credentials
    this.cli.log(`you are running in the "${this.context.stage}" stage`)

    await sleep(2000)

    // check out the context object
    this.cli.log('the context object features some useful information:')
    console.log(this.context)

    await sleep(2000)

    this.cli.log('check out the generated files for more information.')

    await sleep(2000)

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

    // Show nicely formatted outputs at the end of everything
    this.cli.outputs({ url: 'https://serverless.com' })

    // Return your outputs
    return { url: 'https://serverless.com' }
  }

  /*
   * Remove (Optional)
   * If your Component removes infrastructure, this is recommended.
   * You can run this function by running the "components remove"
   */

  async remove(inputs = {}) {
    this.cli.status('Removing')
    // Don't forget to remove any child components you previously provisioned
    // const websiteRemoveOutputs = await website.remove()
  }

  /*
   * Anything (Optional)
   * If you want to ship your Component w/ extra functionality, put it in a method.
   * You can run this function by running the "components anything" command
   */

  async anything(inputs = {}) {
    this.cli.status('Running Anything')
  }
}

// export your component
module.exports = MyComponent

/*
 * To publish your component for the world to use, just publish it to npm like you normally would
 * Just don't forget to point the "main" property of "package.json" to this "serverless.js" file
 */
