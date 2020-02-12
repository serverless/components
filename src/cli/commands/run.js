/*
 * CLI: Command: RUN
 */

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
  const accessKey = await utils.getTokenId()

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to run your serverless component.`, true)
  }

  // Load Instance Credentials
  const instanceCredentials = await utils.loadInstanceCredentials(instanceYaml.stage)

  // initialize SDK
  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: instanceYaml.org
    }
  })

  // Prepare Options
  const options = {}
  options.debug = config.debug

  // connect if in debug mode
  if (options.debug) {
    await sdk.connect({
      filter: {
        stageName: instanceYaml.stage,
        appName: instanceYaml.app,
        instanceName: instanceYaml.name
      },     
      onEvent: (evt) => {
        if (evt.event !== 'instance.run.log') return
        if (evt.data.log && evt.data.log.length) {
          evt.data.log.forEach((log) => {
            console.log(log + '...')
          })
        }
      }
    })
  }

  if (command === 'deploy') {
    // run deploy
    cli.status('Deploying')
    const instance = await sdk.deploy(instanceYaml, instanceCredentials, options)
    cli.outputs(instance.outputs)
  } else if (command === 'remove') {
    // run remove
    cli.status('Removing')
    await sdk.remove(instanceYaml, instanceCredentials, options)
  } else {
    // run a custom method
    cli.status('Running')
    await sdk.run(command, instanceYaml, instanceCredentials, options)
  }
  cli.close('done', 'Success')
}
