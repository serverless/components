/*
 * CLI: Command: Dev
 */

// const path = require('path')
// const chokidar = require('chokidar')
const { Serverless } = require('../../core')

module.exports = async (context, cli) => {
  const serverless = new Serverless()

  // Start CLI persistance status
  cli.start()

  // Load serverless component instance.  Submit a directory where its config files should be.
  const instance = serverless.instance(process.cwd())

  // Get or create access key for his org
  const accessKey = await serverless.getOrCreateAccessKey(instance.org)

  // Update the SDK with the access key
  serverless.config({ accessKey })

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to publish your serverless component.`, true)
  }

  cli.status('Connecting', instance.name)

  // Event Handler tells this client what to do with Serverless Platform Events received via websockets
  const onEvent = (event) => {
    cli.log(event)
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

  cli.status('Watching')

  // Run "deploy" method
  await instance.run('deploy')
}
