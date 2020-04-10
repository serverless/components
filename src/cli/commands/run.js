/*
 * CLI: Command: RUN
 */

const { ServerlessSDK } = require('@serverless/platform-client')
const chalk = require('chalk')
const { getAccessKey, isLoggedIn, loadInstanceConfig, loadInstanceCredentials } = require('./utils')
const { getInstanceDashboardUrl } = require('../utils')

module.exports = async (config, cli, command) => {
  // Start CLI persistance status
  cli.start('Initializing', { timer: true })

  // Get access key
  const accessKey = await getAccessKey()

  // Ensure the user is logged in or access key is available, or advertise
  if (!accessKey && !isLoggedIn()) {
    cli.advertise()
  }

  // Load YAML
  const instanceYaml = await loadInstanceConfig(process.cwd())

  // Presentation
  const meta = `Action: "${command}" - Stage: "${instanceYaml.stage}" - Org: "${instanceYaml.org}" - App: "${instanceYaml.app}" - Instance: "${instanceYaml.name}"`
  if (!config.debug) {
    cli.logLogo()
    // cli.log(meta, 'grey')
  } else {
    if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
      cli.log(`Running in Platform Dev stage`)
    }
    cli.log(meta)
  }

  cli.status('Initializing', instanceYaml.name)

  // Load Instance Credentials
  const instanceCredentials = await loadInstanceCredentials(instanceYaml.stage)

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
  options.dev = config.dev

  // Connect to Serverless Platform Events, if in debug mode
  if (options.debug) {
    await sdk.connect({
      filter: {
        stageName: instanceYaml.stage,
        appName: instanceYaml.app,
        instanceName: instanceYaml.name
      },
      onEvent: (evt) => {
        if (evt.event !== 'instance.run.logs') {
          return
        }
        if (evt.data.logs && Array.isArray(evt.data.logs)) {
          evt.data.logs.forEach((log) => {
            // Remove strange formatting that comes from stderr
            if (typeof log.data === 'string' && log.data.startsWith(`'`)) {
              log.data = log.data.substr(1)
            }
            if (typeof log.data === 'string' && log.data.endsWith(`'`)) {
              log.data = log.data.substring(0, log.data.length - 1)
            }
            if (typeof log.data === 'string' && log.data.endsWith(`\\n`)) {
              log.data = log.data.substring(0, log.data.length - 2)
            }
            cli.log(log.data)
          })
        }
      }
    })
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

    const dashboardUrl = getInstanceDashboardUrl(instanceYaml)

    // run deploy
    cli.status('Deploying', null, 'white')
    const instance = await sdk.deploy(instanceYaml, instanceCredentials, options)
    cli.log()
    cli.logOutputs(instance.outputs)

    // commenting out dashboard URL for now until the dashboard is usable
    // cli.log()
    // cli.log(`${chalk.grey(`Full details: ${dashboardUrl}`)}`)
  } else if (command === 'remove') {
    // run remove
    cli.status('Removing', null, 'white')
    await sdk.remove(instanceYaml, instanceCredentials, options)
  } else {
    // run a custom method synchronously to receive outputs directly
    options.sync = true

    cli.status('Running', null, 'white')
    const instance = await sdk.run(command, instanceYaml, instanceCredentials, options)

    cli.log()
    cli.logOutputs(instance.outputs)
  }
  cli.close('success', 'Success')
}
