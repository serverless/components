/*
 * CLI: Command: Dev
 */

const chokidar = require('chokidar')
const { ServerlessSDK } = require('@serverless/platform-client')
const utils = require('../utils')
const ansiEscapes = require('ansi-escapes')

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
    
    // cli.log(event.event)
    const d = new Date()

    // Status
    if (event.event === 'instance.deployment.succeeded') {
      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - deployment`
      cli.logHeader(header)
      cli.outputs(event.data.outputs)
      cli.status('Watching')
    }
    if (event.event === 'instance.deployment.failed') {
      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - deployment`
      cli.logHeader(header)
      cli.log('deployment failed')
      cli.log(event.data.message)
      cli.log(event.data.stack)
      cli.status('Watching')
    }

    // Logs
    if (event.event === 'instance.log') {
      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - log`
      cli.logHeader(header)
      if (event.data.log && Array.isArray(event.data.log)) {
        event.data.log.forEach((log) => { cli.log(log) })
      } else {
        cli.log(event.data.log)
      }
    }

    // Error
    if (event.event === 'instance.error') {
      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - error`
      cli.logHeader(header)
      cli.logError(event.data.message)
      cli.log(event.data.stack)
      cli.log()
    }

    // Transaction
    if (event.event === 'instance.transaction') {
      let transactionType
      // HTTP Request
      if (event.data.path && event.data.httpMethod) transactionType = `${event.data.httpMethod.toUpperCase()} - ${event.data.path}`
      // Default
      else transactionType = 'transaction'
      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - ${transactionType}`
      cli.logHeader(header)
    }
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
    cli.status('Deploying', null, 'green')
    await sdk.deploy(instanceYaml, instanceCredentials, { debug: true })
  })

  watcher.on('change', async () => {
    if (isProcessing && !queuedOperation) {
      // if already deploying and user made more changes
      // queue another deploy operation to be run after the first one
      queuedOperation = true
    } else if (!isProcessing) {
      // reload serverless component instance
      instanceYaml = await utils.loadInstanceConfig(process.cwd())
      cli.status('Deploying', null, 'green')
      await sdk.deploy(instanceYaml, instanceCredentials, { debug: true })

      if (queuedOperation) {
        // reload serverless component instance
        instanceYaml = await utils.loadInstanceConfig(process.cwd())
        cli.status('Deploying', null, 'green')
        await sdk.deploy(instanceYaml, instanceCredentials, { debug: true })
      }

      isProcessing = false
      queuedOperation = false
    }
  })
}
