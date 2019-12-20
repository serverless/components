const { validate, connect, build, upload, run } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey, getCredentials } = require('../utils')

module.exports = async (context) => {
  context.status('Initializing')

  let serverlessYmlFile = getConfig('serverless')

  if (!serverlessYmlFile) {
    context.error('"serverless.yml" file not found in the current working directory.', true)
  }

  serverlessYmlFile = resolveConfig(serverlessYmlFile)

  serverlessYmlFile = await validate({ instance: serverlessYmlFile }, context)

  context.accessKey = await getOrCreateAccessKey(serverlessYmlFile.org)

  // you must be logged in
  if (!context.accessKey) {
    context.error(
      `Run 'serverless login' first to rapidly deploy your serverless application.`,
      true
    )
  }

  context.credentials = getCredentials()

  serverlessYmlFile = await build(serverlessYmlFile, context)

  const promises = [upload(serverlessYmlFile, context)]

  if (context.debugMode) {
    promises.push(connect({}, context))
  }

  const res = await Promise.all(promises)

  serverlessYmlFile = res[0]

  context.status('Running', serverlessYmlFile.name)

  const outputs = await run(serverlessYmlFile, context)

  context.outputs(outputs)
  context.close('done', 'Done')
}
