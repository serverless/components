/*
 * CLI: Command: Publish
 */

const args = require('minimist')(process.argv.slice(2))
const ServerlessComponents = require('../../core')

module.exports = async (config, cli) => {
  const serverless = new ServerlessComponents()

  // Start CLI persistance status
  cli.start()

  // Load serverless component instance.  Submit a directory where its config files should be.
  const component = serverless.component(process.cwd())

  // Get or create access key for his org
  const accessKey = await serverless.getOrCreateAccessKey(component.org)

  // Check they are logged in
  if (!accessKey) {
    cli.error(`Run 'serverless login' first to publish your serverless component.`, true)
  }

  // Update the SDK with the access key
  serverless.config({ 
    orgName: component.org,
    accessKey 
  })
  
  // if using --dev flag, publish to the "dev" version
  if (args.dev) { component.set({ version: '0.0.0-dev' }) }

  const connectAndWait = () => {
    return new Promise(async (resolve, reject) => {
      // Establish connection with Serverless Platform
      cli.status('Connecting')
      const onEvent = (event) => {
        if (event.event === 'component.publish.succeeded') {
          return resolve(event)
        }
      }
      const onDisconnect = (event) => {
        console.log(event)
      }

      try {
        await serverless.connect({ onEvent, onDisconnect })
        cli.status('Publishing')
        await component.publish()
      } catch(error) {
        reject(error)
      }
    })
  }

  let response
  try {
    response = await connectAndWait()
  } catch(error) {
    serverless.disconnect()
    cli.error(error, true)
  }

  if (response.data.componentVersion === '0.0.0-dev') response.data.componentVersion = 'dev'

  cli.close('done', `Successfully published ${response.data.componentName}@${response.data.componentVersion}`)
}
