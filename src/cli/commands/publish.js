/*
 * CLI: Command: Publish
 */

const args = require('minimist')(process.argv.slice(2))
const { ServerlessSDK } = require('@serverless/platform-client')
const utils = require('../utils')

module.exports = async (config, cli) => {

  // Start CLI persistance status
  cli.start('Initializing')

  // Ensure the user is logged in, or advertise
  if (!utils.isLoggedIn()) { cli.advertise() }

  // Load YAML
  const componentYaml = await utils.loadComponentConfig(process.cwd())

  // Presentation
  cli.log()
  cli.logLogo()
  cli.log(`Publishing "${componentYaml.name}@${componentYaml.version}" to the Registry...`, 'grey')

  // Get access key
  const accessKey = await utils.getTokenId()

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to publish your serverless component.`, true)
  }

  const sdk = new ServerlessSDK({
    accessKey
  })

  // if using --dev flag, publish to the "dev" version
  if (args.dev) {
    componentYaml.version = '0.0.0-dev'
  }

  // Publish
  cli.status('Publishing')
  const component = await sdk.publishComponent(componentYaml)

  if (component.component && component.component.version === '0.0.0-dev') {
    component.component.version = 'dev'
  }

  cli.close(
    'success',
    `Successfully published ${component.component.componentName}@${component.component.version}`
  )
}
