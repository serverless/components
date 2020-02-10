/*
 * CLI: Command: RUN
 */

const args = require('minimist')(process.argv.slice(2))
const { ServerlessSDK } = require('@serverless/platform-client')
const utils = require('../utils')

module.exports = async (config, cli, command) => {

  // Start CLI persistance status
  cli.start()

  // Load YAML
  const instanceYaml = await utils.loadInstanceConfig(process.cwd())

  // Set default stage
  instanceYaml.stage = instanceYaml.stage || 'dev'

  // Get access key
  const accessKey = await utils.getOrCreateAccessKey(instanceYaml.org)

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to run your serverless component.`, true)
  }

  // Load Instance Credentials
  const instanceCredentials = await utils.loadInstanceCredentials(instanceYaml.stage)

  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: instanceYaml.org,
    }
  })

  // Prepare Options
  const options = {}
  options.debug = config.debug
  
  if (options.debug) {
    await sdk.connect({
      onEvent: (evt) => {
        console.log(evt)
      }
    })
  }

  // Deploy
  cli.status('Deploying')
  const instance = await sdk.deploy(instanceYaml, instanceCredentials, options)

  cli.outputs(instance.outputs)
  
  cli.close('done', 'success')
}