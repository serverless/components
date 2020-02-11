/*
 * CLI: Command: Publish
 */

const args = require('minimist')(process.argv.slice(2))
const { ServerlessSDK } = require('@serverless/platform-client')
const utils = require('../utils')

module.exports = async (config, cli) => {
  // Start CLI persistance status
  cli.start()

  // Load YAML
  const componentYaml = await utils.loadComponentConfig(process.cwd())

  // Get access key
  const accessKey = await utils.getOrCreateAccessKey(componentYaml.org)

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
    'done',
    `Successfully published ${component.component.componentName}@${component.component.version}`
  )
}
