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

  const res = await Promise.all([connect({}, context), upload(serverlessYmlFile, context)])

  context.socket = res[0]

  serverlessYmlFile = res[1]

  context.status('Running', serverlessYmlFile.name)

  const outputs = await run(serverlessYmlFile, context)

  context.outputs(outputs)
  context.close('done', 'Done')
}
