// import the Component class and some useful utilities
const { Component, sleep } = require('@serverless/components')

class MyComponent extends Component {
  /*
   * Default (Required)
   * - The default functionality to run/provision/update your Component
   */

  async default(inputs = {}) {
    // Show status...
    this.cli.status('Showing you around')

    await sleep(2000)

    // Show a nicely formatted log statement...
    this.cli.log('this is a log statement')

    await sleep(2000)

    // Show a nicely formatted warning...
    this.cli.warn('this is a warning statement')

    await sleep(2000)

    // Get the targeted stage
    this.cli.log(`you are running in the "${this.context.stage}" stage`)

    await sleep(2000)

    this.cli.log('the context object features some useful information:')

    // this.context features useful information
    console.log(this.context)

    await sleep(2000)

    this.cli.log('checkout the "serverless.js" file for more information.')

    await sleep(2000)

    // Common provider credentials are identified in the environment or .env file and added to this.context.credentials
    // this assumes you have the aws-sdk package installed locally
    // const dynamodb = new AWS.DynamoDB({ credentials: this.context.credentials.aws })

    // Load a child Component.
    // This assumes you have the "@serverless/website" package/component installed locally
    // const website = await this.load('@serverless/website')

    // If you are deploying multiple instances of the same Component, include an instance id. This also pre-fills them with any existing state.
    // const website1 = await this.load('@serverless/website', 'website1')
    // const website2 = await this.load('@serverless/website', 'website2')

    // Call the default method on a Component
    // const websiteOutputs = await website({ region: 'us-east-1' })

    // Or call any other method on a Component
    // const websiteRemoveOutputs = await website.remove()

    // Save state
    this.state.name = 'myComponent'
    await this.save()

    // Show nicely formatted outputs at the end of everything
    this.cli.outputs({ url: 'https://serverless.com' })

    // Return your outputs
    return { url: 'https://serverless.com' }
  }

  /*
   * Remove (Optional)
   * - If your Component removes infrastructure, this is recommended.
   */

  async remove(inputs = {}) {
    // Don't forget to remove any child components you previously provisioned
    // const websiteRemoveOutputs = await website.remove()
  }

  /*
   * Anything (Optional)
   * - If you want to ship your Component w/ extra functionality, put it in a method.
   */

  async anything(inputs = {}) {}
}

module.exports = MyComponent
