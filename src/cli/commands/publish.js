const args = require('minimist')(process.argv.slice(2))
const { Component } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey } = require('../utils')

module.exports = async (context) => {
  context.status('Publishing')

  let serverlessComponentFile = getConfig('serverless.component')

  if (!serverlessComponentFile) {
    throw new Error('serverless.component.yml file not found in the current working directory')
  }

  serverlessComponentFile = resolveConfig(serverlessComponentFile)

  const accessKey = await getOrCreateAccessKey(serverlessComponentFile.org)

  // update context with access key
  context.update({ accessKey })

  // you must be logged in
  if (!context.accessKey) {
    context.error(
      `Run 'serverless login' first to rapidly deploy your serverless application.`,
      true
    )
  }

  // if using --dev flag, publish to the "dev" version
  if (args.dev) {
    delete serverlessComponentFile.version
  }

  const component = new Component(serverlessComponentFile, context)

  await component.publish(serverlessComponentFile, context)

  context.close('done', 'Published')
}
