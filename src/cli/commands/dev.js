const { validate, connect, dev, build, upload, run } = require('../../core')
const { getConfig, resolveConfig, getOrCreateAccessKey, getCredentials } = require('../utils')

const chokidar = require('chokidar')

const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait))

const wait = async () => {
  await sleep(1000)
  return wait()
}

const deploy = async (context) => {
  context.method = 'deploy'

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

  await run(serverlessYmlFile, context)
}

const watch = (context) => {
  let isProcessing = false
  let queuedOperation = false

  const watcher = chokidar.watch(process.cwd(), { ignored: /\.serverless/ })

  watcher.on('ready', async () => {
    context.status('Watching')
  })

  watcher.on('change', async () => {
    try {
      if (isProcessing && !queuedOperation) {
        queuedOperation = true
      } else if (!isProcessing) {
        isProcessing = true

        await deploy(context)
        if (queuedOperation) {
          queuedOperation = false
          await deploy(context)
        }

        isProcessing = false
        context.status('Watching')
      }
    } catch (e) {
      isProcessing = false
      queuedOperation = false
      context.error(e)
      context.status('Watching')
    }
  })
}

module.exports = async (context) => {
  context.status('Initializing')

  let serverlessYmlFile = getConfig('serverless')

  if (!serverlessYmlFile) {
    context.error('"serverless.yml" file not found in the current working directory.', true)
  }

  serverlessYmlFile = resolveConfig(serverlessYmlFile)

  serverlessYmlFile = await validate({ instance: serverlessYmlFile }, context)

  context.accessKey = await getOrCreateAccessKey(serverlessYmlFile.org)

  if (!context.accessKey) {
    context.error(
      `Run 'serverless login' first to rapidly deploy your serverless application.`,
      true
    )
  }

  context.status('Connecting')

  context.socket = await connect({}, context)

  await dev(serverlessYmlFile, context)

  await watch(context)
}
