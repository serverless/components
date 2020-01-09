const args = require('minimist')(process.argv.slice(2))
const { Instance } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey, getCredentials } = require('../utils')

module.exports = async (context) => {
  let serverlessYmlFile = getConfig('serverless')

  if (!serverlessYmlFile) {
    throw new Error('"serverless.yml" file not found in the current working directory.')
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

  const promises = []

  // only upload if deploying
  if (method === 'deploy') {
    promises.push(instance.upload())
  } else {
    // remove inputs if not deploying
    instance.inputs = {}
  }

  // only connect if using debug mode
  if (context.debugMode) {
    promises.push(context.connect())
  }

  await Promise.all(promises)

  context.status('Running', instance.name)

  const outputs = await instance.run(method)

  context.outputs(outputs)

  context.close('done', 'Done')
}
