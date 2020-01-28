/*
 * CLI: Command: RUN
 */

const ServerlessComponents = require('../../core')
const { sleep } = require('../../utils')

module.exports = async (config, cli, command) => {

  const serverless = new ServerlessComponents()

  // Start CLI status
  cli.start()

  // Load serverless component instance.  Submit a directory where its config files should be.
  const instance = serverless.instance(process.cwd())

  // Get or create access key for his org
  const accessKey = await serverless.getOrCreateAccessKey(instance.org)

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to publish your serverless component.`, true)
  }

  // Update the SDK with the access key
  serverless.config({
    accessKey,
    orgName: instance.org,
  })

  // Prepare Inputs
  const inputs = {}
  // TODO: Inputs are currently only allowed for "deploy" method

  // Prepare Options
  const options = {}
  options.debug = config.debug

  const run = () => {
    return new Promise(async (resolve, reject) => {

      let requestId
  
      // Event Handler tells this client what to do with Serverless Platform Events received via websockets
      const onEvent = (event) => {
        if (!event.data.requestId || event.data.requestId !== requestId) return
        if (event.event === 'instance.run.log') {
          cli.log(event.data.log)
        }
        if (event.event === 'instance.run.failed') {
          return reject(event.data)
        }
        if (event.event === 'instance.run.succeeded') {
          return resolve(event.data)
        }
      }
  
      // Establish connection with Serverless Platform
      cli.status('Connecting', instance.name)
      try {
        await serverless.connect({ onEvent })
        cli.status('Uploading')
        const result = await instance.preRun(command, inputs, options)
        cli.status('Running')
        requestId = await instance.run(result.method, result.inputs, result.options, result.size, true)
        requestId = requestId.requestId
      } catch(error) {
        reject(error)
      }
    })
  }

  let response
  let hasError
  try {
    response = await run()
  } catch(error) {
    serverless.disconnect()
    hasError = error
  }

  if (hasError) {
    cli.error(hasError, true)
  }

  cli.outputs(response.outputs)
  // Give websockets a bit of time to receive any slow messages
  await sleep(100)
  serverless.disconnect()
  cli.close('done', 'Success')
}