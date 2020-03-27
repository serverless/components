/*
 * CLI: Command: Dev
 */

const chokidar = require('chokidar')
const { ServerlessSDK } = require('@serverless/platform-client')
const { getAccessKey, isLoggedIn, loadInstanceConfig, loadInstanceCredentials } = require('./utils')

module.exports = async (config, cli) => {
  // Define a close handler, that removes any "dev" mode agents
  const closeHandler = async () => {
    // Set new close listener
    process.on('SIGINT', () => {
      cli.close('error', 'Dev Mode Canceled.  Run "serverless deploy" To Remove Dev Mode Agent.')
    })

    sdk.disconnect()
    cli.status('Disabling Dev Mode & Closing', null, 'green')
    await sdk.deploy(instanceYaml, instanceCredentials)
    cli.close('success', 'Dev Mode Closed')
  }

  // Start CLI persistance status
  cli.start('Initializing', { closeHandler })

  // Get access key
  const accessKey = await getAccessKey()

  // Ensure the user is logged in or access key is available, or advertise
  if (!accessKey && !isLoggedIn()) {
    cli.advertise()
  }

  // Presentation
  cli.logLogo()
  cli.log(
    'Dev Mode - Watching your Component for changes and enabling streaming logs, if supported...',
    'grey'
  )
  cli.log()

  // Load serverless component instance.  Submit a directory where its config files should be.
  let instanceYaml = await loadInstanceConfig(process.cwd())

  // Load Instance Credentials
  const instanceCredentials = await loadInstanceCredentials(instanceYaml.stage)

  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: instanceYaml.org
    }
  })

  cli.status('Initializing', instanceYaml.name)

  /**
   * Event Handler tells this client what to do with Serverless Platform Events received via websockets
   */

  const onEvent = (event) => {
    const d = new Date()

    // Deployment
    if (event.event === 'instance.deployment.succeeded') {
      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - deployment`
      cli.log(header, 'grey')
      cli.logOutputs(event.data.outputs)
      cli.status('Watching')
    }
    if (event.event === 'instance.deployment.failed') {
      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - deployment error`
      cli.log(header, 'grey')
      cli.log(event.data.stack, 'red')
      cli.status('Watching')
    }

    // Logs
    if (event.event === 'instance.logs') {
      if (event.data.logs && Array.isArray(event.data.logs)) {
        event.data.logs.forEach((log) => {
          const date = new Date(log.createdAt)

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

          let type
          if (log.type === 'log' || log.type === 'stdout') {
            type = 'log'
          }
          if (log.type === 'debug' || log.type === 'stderr') {
            type = 'log - debug'
          }
          if (log.type === 'warn') {
            type = 'log - warn'
          }
          if (log.type === 'error') {
            type = 'log - error'
          }
          if (log.type === 'stdout') {
            type = 'log - stdout'
          }
          if (log.type === 'stderr') {
            type = 'log - stderr'
          }
          const header = `${date.toLocaleTimeString()} - ${event.instanceName} - ${type}`
          cli.log(header, 'grey')
          if (log.type === 'log' || log.type === 'stdout') {
            cli.log(log.data)
          }
          if (log.type === 'debug' || log.type === 'stderr') {
            cli.log(log.data)
          }
          if (log.type === 'warn') {
            cli.log(log.data, 'grey')
          }
          if (log.type === 'error') {
            cli.log(log.data, 'red')
          }
        })
      }
    }

    // Error
    if (event.event === 'instance.error') {
      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - error`
      cli.log(header, 'grey')
      cli.log(event.data.stack, 'red')
      cli.log()
    }

    // Transaction
    if (event.event === 'instance.transaction') {
      let transactionType
      // HTTP Request
      if (event.data.path && event.data.httpMethod) {
        transactionType = `transaction - ${event.data.httpMethod.toUpperCase()} - ${
          event.data.path
        }`
      }
      // Default
      else {
        transactionType = 'transaction'
      }

      const header = `${d.toLocaleTimeString()} - ${event.instanceName} - ${transactionType}`
      cli.log(header, 'grey')
    }
  }

  // Filter configuration
  const filter = {
    stageName: instanceYaml.stage,
    appName: instanceYaml.app,
    instanceName: instanceYaml.name,
    events: []
  }

  // User wants to receive all messages at the app level
  if (config.filter && config.filter === 'app' && filter.instanceName) {
    delete filter.instanceName
    cli.log('Enabling filtering at the activity at the application level', 'grey')
    cli.log()
  }

  // Establish connection with Serverless Platform
  try {
    await sdk.connect({
      org: instanceYaml.org,
      filter: filter,
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
    cli.status('Enabling Dev Mode', null, 'green')
    await sdk.deploy(instanceYaml, instanceCredentials, { dev: true })
  })

  watcher.on('change', async () => {
    // Skip if processing already and there is a queued operation
    if (isProcessing && queuedOperation) {
      return
    }

    // If already deploying and user made more changes, queue another deploy operation to be run after the first one
    if (isProcessing && !queuedOperation) {
      queuedOperation = true
      return
    }

    // If it's not processin and there is no queued operation
    if (!isProcessing) {
      isProcessing = true
      cli.status('Deploying', null, 'green')
      // reload serverless component instance
      instanceYaml = await loadInstanceConfig(process.cwd())
      await sdk.deploy(instanceYaml, instanceCredentials, { dev: true })
      if (queuedOperation) {
        cli.status('Deploying', null, 'green')
        // reload serverless component instance
        instanceYaml = await loadInstanceConfig(process.cwd())
        await sdk.deploy(instanceYaml, instanceCredentials, { dev: true })
      }

      isProcessing = false
      queuedOperation = false
    }
  })
}
