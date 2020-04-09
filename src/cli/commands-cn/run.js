/*
 * CLI: Command: RUN
 */

const path = require('path')
const { ServerlessSDK } = require('@serverless/platform-client-china')
const utils = require('./utils')

module.exports = async (config, cli, command) => {
  // Start CLI persistance status
  cli.start('Initializing', { timer: true })

  await utils.login()

  // Load YAML
  let instanceDir = process.cwd()
  if (config.target) {
    instanceDir = path.join(instanceDir, config.target)
  }
  const instanceYaml = await utils.loadInstanceConfig(instanceDir)

  // Presentation
  const meta = `Action: "${command}" - Stage: "${instanceYaml.stage}" - App: "${instanceYaml.app}" - Instance: "${instanceYaml.name}"`
  if (!config.debug) {
    cli.logLogo()
    cli.log(meta, 'grey')
  } else {
    cli.log(meta)
  }

  cli.status('Initializing', instanceYaml.name)

  // Load Instance Credentials
  const instanceCredentials = await utils.loadInstanceCredentials(instanceYaml.stage)

  // initialize SDK
  const sdk = new ServerlessSDK({
    context: {
      orgName: instanceYaml.org
    }
  })

  // Prepare Options
  const options = {}
  options.debug = config.debug
  options.dev = config.dev

  // Connect to Serverless Platform Events, if in debug mode
  if (options.debug) {
    // TODO: to be implement for tencent
    delete options.debug
  }

  if (command === 'deploy') {
    // Warn about dev agent
    if (options.dev) {
      cli.log()
      cli.log(
        '"--dev" option detected.  Dev Agent will be added to your code.  Do not deploy this in your production stage.',
        'grey'
      )
    }

    // run deploy
    cli.status('Deploying', null, 'white')
    const instance = await sdk.deploy(instanceYaml, instanceCredentials, options)
    cli.log()
    cli.logOutputs(instance.outputs)
    cli.log()
    // const dashboardUrl = utils.getInstanceDashboardUrl(instanceYaml)
    // cli.log(`${chalk.grey(`Full details: ${dashboardUrl}`)}`)
  } else if (command === 'remove') {
    // run remove
    cli.status('Removing', null, 'white')
    await sdk.remove(instanceYaml, instanceCredentials, options)
  } else {
    // run a custom method
    cli.status('Running', null, 'white')
    await sdk.run(command, instanceYaml, instanceCredentials, options)
  }
  cli.close('success', 'Success')
}
