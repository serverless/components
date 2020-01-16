const args = require('minimist')(process.argv.slice(2))
const { Instance } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey, getCredentials } = require('../utils')

module.exports = async (context) => {
  // get serverless.yml file from the cwd
  let serverlessYmlFile = getConfig('serverless')

  if (!serverlessYmlFile) {
    throw new Error('"serverless.yml" file not found in the current working directory.')
  }

  // If stage has been added via CLI option or environment variable, override serverless.yml
  if (context.stage) {
    serverlessYmlFile.stage = context.stage
  }
  // If no stage has been provided via CLI flag, env variable, or serverless,yml, default to "dev" stage
  if (!serverlessYmlFile.stage) {
    serverlessYmlFile.stage = 'dev'
  }

  // resolve any local variables (ie env references) found in the serverless.yml file
  serverlessYmlFile = resolveConfig(serverlessYmlFile)

  // get the credentials from the .env file in the cwd
  const credentials = getCredentials()

  // create a new component instannce to be run based on the serverless.yml file
  const instance = new Instance(serverlessYmlFile, context)

  // make sure the user is logged or has an access key for the org specified in the serverless.yml file
  const accessKey = await getOrCreateAccessKey(instance.org)

  // update the context with the access key and credentials to be used by the component instance
  context.update({ accessKey, credentials })

  // throw error if not logged in or not set access key env var
  if (!context.accessKey) {
    context.error(
      `Run 'serverless login' first to rapidly deploy your serverless application.`,
      true
    )
  }

  const method = args._[0] || 'deploy'

  // only build if deploying
  if (method === 'deploy') {
    await instance.build()
  }

  // always connect to get a connection id and recieve outputs, errors and logs
  const promises = [context.connect()]

  // only upload if deploying
  if (method === 'deploy') {
    promises.push(instance.upload())
  } else {
    // remove inputs if not deploying
    instance.inputs = {}
  }

  // connect and upload in parallel
  await Promise.all(promises)

  context.status('Running', instance.name)

  // run the component instance with the method/command provided and await socket streams
  return instance.run(method)
}
