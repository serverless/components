/*
 * CLI: Command: Dev
 */

const path = require('path')
const chokidar = require('chokidar')
const ServerlessComponents = require('../../core')

module.exports = async (context, cli) => {

  const serverless = new ServerlessComponents

  console.log()

  // Start CLI persistance status
  cli.start()

  // Load serverless component instance.  Submit a directory where its config files should be.
  const instance = serverless.instance(process.cwd())

  // Get or create access key for his org
  const accessKey = await serverless.getOrCreateAccessKey(instance.org)

  // Update the SDK with the access key
  serverless.config({ 
    accessKey,
    orgName: instance.org 
  })

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to publish your serverless component.`, true)
  }

  cli.status('Connecting', instance.name)

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
    await serverless.connect({
      org: instance.org,
      filter: {
        stageName: instance.stage,
        appName: instance.app,
        instanceName: instance.name,
        events: []
      },
      onEvent
    })
  } catch(error) {
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
    await instance.run('deploy', {}, { debug: true })
  })

  watcher.on('change', async () => {
    if (isProcessing && !queuedOperation) {
      // if already deploying and user made more changes
      // queue another deploy operation to be run after the first one
      queuedOperation = true
    } else if (!isProcessing) {
      const instance = serverless.instance(process.cwd())
      cli.status('Deploying')
      await instance.run('deploy', {}, { debug: true })
    }
  })
}