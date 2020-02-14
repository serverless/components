/*
 * CLI: Command: Registry
 */

const args = require('minimist')(process.argv.slice(2))
const { ServerlessSDK } = require('@serverless/platform-client')
const utils = require('../utils')

/**
 * Publish a Component to the Serverless Registry
 * @param {*} config 
 * @param {*} cli 
 */
const publish = async (config, cli) => {

  // Start CLI persistance status
  cli.start('Initializing')

  // Ensure the user is logged in, or advertise
  if (!utils.isLoggedIn()) { cli.advertise() }

  // Load YAML
  const componentYaml = await utils.loadComponentConfig(process.cwd())

  // Presentation
  cli.logRegistryLogo()
  cli.log(`Publishing "${componentYaml.name}@${componentYaml.version}"...`, 'grey')

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

  let component
  try {
    component = await sdk.publishComponent(componentYaml)
  } catch(error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '')
      cli.error(error.message, true)
    } else {
      throw error
    }
  }

  if (component.component && component.component.version === '0.0.0-dev') {
    component.component.version = 'dev'
  }

  cli.close(
    'success',
    `Successfully published ${component.component.componentName}@${component.component.version}`
  )
}


/**
 * Get a Component from the Serverless Registry
 * @param {*} config 
 * @param {*} cli 
 */
const getComponent = async (config, cli) => {

  const componentName = config.params[0]

  // Start CLI persistance status
  cli.start(`Fetching versions for: ${componentName}`)

  // Ensure the user is logged in, or advertise
  if (!utils.isLoggedIn()) { cli.advertise() }

  // Get access key
  const accessKey = await utils.getTokenId()

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to publish your serverless component.`, true)
  }

  const sdk = new ServerlessSDK({
    accessKey
  })

  const data = await sdk.getComponent(componentName)

  if (!data.component) {
    cli.error(`Component "${componentName}" not found in the Serverless Registry.`, true)
  }

  const devVersion = data.versions.indexOf('0.0.0-dev')
  if (devVersion !== -1) data.versions.splice(devVersion, 1)

  cli.logRegistryLogo()
  cli.log()
  cli.log(`Component: ${componentName}`)
  cli.log(`Description: ${data.component.description}`)
  cli.log(`Latest Version: ${data.component.version}`)
  cli.log(`Author: ${data.component.author}`)
  cli.log(`Repo: ${data.component.repo}`)
  cli.log()
  cli.log(`Available Versions:`)
  cli.log(`${data.versions.join(', ')}`)

  cli.close('success', `Component information listed for "${componentName}"`)
}

/**
 * Route Registry Command
 */
module.exports = async (config, cli) => {
  if (config.params[0] === 'publish') return await publish(config, cli)
  else return await getComponent(config, cli)
}
