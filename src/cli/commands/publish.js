const { validate, publish } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey } = require('../utils')

module.exports = async (context) => {
  let serverlessComponentFile = getConfig('serverless.component')

  if (!serverlessComponentFile) {
    context.error(`serverless.component.yml file not found in the current working directory`, true)
  }

  serverlessComponentFile = resolveConfig(serverlessComponentFile)

  serverlessComponentFile = await validate({ component: serverlessComponentFile }, context)

  context.accessKey = await getOrCreateAccessKey(serverlessComponentFile.org)

  // you must be logged in
  if (!context.accessKey) {
    context.error(
      `Run 'serverless login' first to rapidly deploy your serverless application.`,
      true
    )
  }

  await publish(serverlessComponentFile, context)

  context.close('done', 'Published')
}
