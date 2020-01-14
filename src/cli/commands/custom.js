const args = require('minimist')(process.argv.slice(2))
const { Instance } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey, getCredentials } = require('../utils')

module.exports = async (context) => {
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

  serverlessYmlFile = resolveConfig(serverlessYmlFile)

  const credentials = getCredentials()

  const instance = new Instance(serverlessYmlFile, context)

  const accessKey = await getOrCreateAccessKey(instance.org)

  context.update({ accessKey, credentials })

  // you must be logged in
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

  const promises = [context.connect()]

  // only upload if deploying
  if (method === 'deploy') {
    promises.push(instance.upload())
  } else {
    // remove inputs if not deploying
    instance.inputs = {}
  }

  await Promise.all(promises)

  context.status('Running', instance.name)

  return instance.run(method)
}
