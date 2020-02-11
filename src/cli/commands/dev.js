/*
 * CLI: Command: Dev
 */

const chokidar = require('chokidar')
const { ServerlessSDK } = require('@serverless/platform-client')
const utils = require('../utils')

module.exports = async (config, cli) => {
  // Start CLI persistance status
  cli.start()

  // Load serverless component instance.  Submit a directory where its config files should be.
  let instanceYaml = await utils.loadInstanceConfig(process.cwd())

  // Get or create access key for his org
  const accessKey = await utils.getOrCreateAccessKey(instanceYaml.org)

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to publish your serverless component.`, true)
  }

  // Load Instance Credentials
  const instanceCredentials = await utils.loadInstanceCredentials(instanceYaml.stage)

  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: instanceYaml.org
    }
  })

  cli.status('Connecting', instanceYaml.name)

  /**
   * Event Handler tells this client what to do with Serverless Platform Events received via websockets
   */

  const onEvent = (event) => {
    // cli.log(event)
    const d = new Date()

    // Status
    const headerStatus = `${d.toLocaleTimeString()} - ${event.instanceName} - update`
    if (event.event === 'instance.run.started' && event.data.method === 'deploy') {
      cli.log('deployment in progress', headerStatus)
    }
    if (event.event === 'instance.run.succeeded' && event.data.method === 'deploy') {
      cli.log('deployment successful', headerStatus)
      cli.outputs(event.data.outputs)
      cli.status('Watching')
    }
    if (event.event === 'instance.run.failed' && event.data.method === 'deploy') {
      cli.log('deployment failed', headerStatus)
    }

    // Logs
    const headerLogs = `${d.toLocaleTimeString()} - ${event.instanceName} - log`
    if (event.event === 'instance.log') {
      cli.log(event.data.log, headerLogs)
    }

    // Error
    const headerError = `${d.toLocaleTimeString()} - ${event.instanceName} - error`
    if (event.event === 'instance.failed') {
      cli.log(event.data.message, headerError)
      cli.log(event.data.stack)
    }

    // Success - TODO: NOt sure what to do with this
    // const headerSuccess = `${d.toLocaleTimeString()} - ${event.instanceName} - transaction`
    // if (event.event === 'instance.succeeded') {
    //   cli.log('successful transaction', headerSuccess)
    // }
  }

  // Establish connection with Serverless Platform
  try {
    await sdk.connect({
      org: instanceYaml.org,
      filter: {
        stageName: instanceYaml.stage,
        appName: instanceYaml.app,
        instanceName: instanceYaml.name,
        events: []
      },
      onEvent
    })
  } catch (error) {
    throw new Error(error)
  }

  /**
   * Watch logic
   */

  let isProcessing = false // whether there's already a deployment in progress
  let queuedOperation = false // whether there's another deployment queued

  // Set watcher
  const watcher = chokidar.watch(process.cwd(), { ignored: /\.serverless/ })

  watcher.on('ready', async () => {
    cli.status('Deploying')
    await sdk.run('deploy', instanceYaml, instanceCredentials, { debug: true })
  })

  watcher.on('change', async () => {
    if (isProcessing && !queuedOperation) {
      // if already deploying and user made more changes
      // queue another deploy operation to be run after the first one
      queuedOperation = true
    } else if (!isProcessing) {
      // reload serverless component instance
      instanceYaml = await utils.loadInstanceConfig(process.cwd())
      cli.status('Deploying')
      await sdk.run('deploy', instanceYaml, instanceCredentials, { debug: true })

      if (queuedOperation) {
        // reload serverless component instance
        instanceYaml = await utils.loadInstanceConfig(process.cwd())
        cli.status('Deploying')
        await sdk.run('deploy', instanceYaml, instanceCredentials, { debug: true })
      }

      isProcessing = false
      queuedOperation = false
    }
  })
}
