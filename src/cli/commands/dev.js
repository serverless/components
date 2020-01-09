const chokidar = require('chokidar')
const { Instance, Component } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey, getCredentials } = require('../utils')

const devComponent = async (context) => {
  let serverlessComponentFile = getConfig('serverless.component')

  if (!serverlessComponentFile) {
    context.error(
      '"serverless.component.yml" file not found in the current working directory.',
      true
    )
  }

  serverlessComponentFile = resolveConfig(serverlessComponentFile)

  // dev mode works only with the dev version
  delete serverlessComponentFile.version

  const component = new Component(serverlessComponentFile, context)

  const accessKey = await getOrCreateAccessKey(serverlessComponentFile.org)

  context.update({ accessKey })

  // you must be logged in
  if (!context.accessKey) {
    context.error(`Run 'serverless login' first to publish your serverless component.`, true)
  }

  // connect the context to get connectionId
  await context.connect()

  await component.dev()
}

const devInstance = async (context) => {
  const deploy = async (instance) => {
    let serverlessYmlFile = getConfig('serverless')

    if (!serverlessYmlFile) {
      instance.context.error(
        '"serverless.yml" file not found in the current working directory.',
        true
      )
    }

    serverlessYmlFile = resolveConfig(serverlessYmlFile)

    instance.set(serverlessYmlFile)

    await instance.build()
    await instance.upload()
    await instance.run()
  }

  const watch = (instance) => {
    let isProcessing = false
    let queuedOperation = false

    const watcher = chokidar.watch(process.cwd(), { ignored: /\.serverless/ })

    watcher.on('ready', async () => {
      instance.context.status('Watching', instance.name)
    })

    watcher.on('change', async () => {
      try {
        if (isProcessing && !queuedOperation) {
          queuedOperation = true
        } else if (!isProcessing) {
          isProcessing = true

          await deploy(instance)
          if (queuedOperation) {
            queuedOperation = false
            await deploy(instance)
          }

          isProcessing = false
          instance.context.status('Watching', instance.name)
        }
      } catch (e) {
        isProcessing = false
        queuedOperation = false
        instance.context.error(e)
        instance.context.status('Watching', instance.name)
      }
    })
  }

  let serverlessYmlFile = getConfig('serverless')

  if (!serverlessYmlFile) {
    context.error('"serverless.yml" file not found in the current working directory.', true)
  }

  serverlessYmlFile = resolveConfig(serverlessYmlFile)

  const instance = new Instance(serverlessYmlFile, context)

  const credentials = getCredentials()

  const accessKey = await getOrCreateAccessKey(instance.org)

  context.update({ accessKey, credentials })

  if (!context.accessKey) {
    context.error(
      `Run 'serverless login' first to rapidly deploy your serverless application.`,
      true
    )
  }

  // connect the context to get connectionId
  await context.connect()

  // connect the instance using the generated connectionId
  await instance.connect()

  await watch(instance)
}

module.exports = async (context) => {
  const componentDir = getConfig('serverless.component')
  const instanceDir = getConfig('serverless')

  if (componentDir) {
    return devComponent(context)
  } else if (instanceDir) {
    return devInstance(context)
  }
  context.error(
    'no "serverless.yml" nor "serverless.component.yml" file found in the current working directory.',
    true
  )
}
