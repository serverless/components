const { Instance } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey, getCredentials } = require('../utils')

const chokidar = require('chokidar')

const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait))

const wait = async () => {
  await sleep(1000)
  return wait()
}

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
    instance.context.status('Watching')
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
        instance.context.status('Watching')
      }
    } catch (e) {
      isProcessing = false
      queuedOperation = false
      instance.context.error(e)
      instance.context.status('Watching')
    }
  })
}

module.exports = async (context) => {
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

  await instance.connect()

  await instance.dev()

  await watch(instance)
}
