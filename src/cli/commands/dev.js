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

/*
 * runs dev mode on the component instance (dir contains serverless.yml)
 */
const devInstance = async (context) => {
  /*
   * triggers a deploy of the component instance
   */
  const deploy = async (instance) => {
    let serverlessYmlFile = getConfig('serverless')

    if (!serverlessYmlFile) {
      instance.context.error(
        '"serverless.yml" file not found in the current working directory.',
        true
      )
    }

    serverlessYmlFile = resolveConfig(serverlessYmlFile)

    // update the instance with any changes to the serverless.yml file
    instance.set(serverlessYmlFile)

    await instance.build()
    await instance.upload()
    await instance.run()
  }

  /*
   * watch the instance directory
   */
  const watch = (instance) => {
    let isProcessing = false // whether there's already a deployment in progress
    let queuedOperation = false // whether there's another deployment queued

    const watcher = chokidar.watch(process.cwd(), { ignored: /\.serverless/ })

    watcher.on('ready', async () => {
      instance.context.status('Watching', instance.name)
    })

    watcher.on('change', async () => {
      try {
        if (isProcessing && !queuedOperation) {
          // if already deploying and user made more changes
          // queue another deploy operation to be run after the first one
          queuedOperation = true
        } else if (!isProcessing) {
          isProcessing = true

          // once outputs are received (deployment is done)
          // go back to watching
          instance.context.outputs = () => {
            if (queuedOperation) {
              // if there's another deployment queued, deploy again and reset the queue
              queuedOperation = false
              deploy(instance)
            }

            // once all deployments are done, reset everything and continue watchingn
            isProcessing = false
            instance.context.status('Watching', instance.name)
          }

          // run the first deployment
          await deploy(instance)
        }
      } catch (e) {
        // if there has been an error, reset everything, log error and continue watching
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

  // initialize a new component instance
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

  // connect to the component instance channel using the generated connectionId
  await instance.connect()

  // now that we are connected, start watching
  await watch(instance)
}

module.exports = async (context) => {
  // check whether we are running dev mode for component or component instance
  const componentDir = getConfig('serverless.component')
  const instanceDir = getConfig('serverless')

  if (componentDir) {
    // running component dev mode (dir with serverless.component.yml)
    return devComponent(context)
  } else if (instanceDir) {
    // running component instance dev mode (dir with serverless.yml)
    return devInstance(context)
  }
  context.error(
    'no "serverless.yml" nor "serverless.component.yml" file found in the current working directory.',
    true
  )
}
