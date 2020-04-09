/*
 * CLI: Command: Dev
 */

const path = require('path')
const { Writable } = require('stream')
const ansiEscapes = require('ansi-escapes')
const chokidar = require('chokidar')
const { ServerlessSDK, utils: chinaUtils } = require('@serverless/platform-client-china')
const utils = require('./utils')

class LogForwardingOutput extends Writable {
  constructor(options) {
    super(options)
  }

  _write(chunk, encoding, callback) {
    process.stdout.write(ansiEscapes.eraseDown)
    process.stdout._write(chunk, encoding, callback)
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  _writev(chunks, callback) {
    process.stdout.write(ansiEscapes.eraseDown)
    process.stdout._writev(chunks, callback)
    process.stdout.write(ansiEscapes.cursorLeft)
  }
}

const logForwardingOutput = new LogForwardingOutput()

/*
 * Deploy changes and hookup event callback which will be called when
 * deploying status has been changed.
 * @param sdk - instance of ServerlessSDK
 * @param instance - instance object
 * @param credentials - credentials used for deploy
 * @param enventCallback - event callback, when set to false, it will remove all event listener
 */
async function deploy(sdk, instance, credentials) {
  const getInstanceInfo = async () => {
    const { instance: instanceInfo } = await sdk.getInstance(
      instance.org,
      instance.stage,
      instance.app,
      instance.name
    )
    return instanceInfo
  }

  let instanceInfo = {}

  try {
    await sdk.deploy(instance, credentials)
    const instanceStatusPollingStartTime = new Date().getTime()
    instanceInfo = await getInstanceInfo()
    while (instanceInfo.instanceStatus === 'deploying') {
      instanceInfo = await getInstanceInfo()
      if (Date.now() - instanceStatusPollingStartTime > 24000) {
        throw new Error('Deployment timeout, please retry in a few seconds')
      }
    }
  } catch (e) {
    instanceInfo.instanceStatus = 'error'
    instanceInfo.deploymentError = e
  }

  return instanceInfo
}

async function updateDeploymentStatus(cli, instanceInfo, startDebug) {
  const { instanceStatus, instanceName, deploymentError, deploymentErrorStack } = instanceInfo
  const d = new Date()
  const header = `${d.toLocaleTimeString()} - ${instanceName} - deployment`

  const cliEventCallback = (msg, option) => {
    cli.log(msg, option && option.type === 'error' ? 'red' : 'grey')
  }
  cliEventCallback.stdout = logForwardingOutput

  switch (instanceStatus) {
    case 'active':
      const {
        state: { lambdaArn, region }
      } = instanceInfo
      if (lambdaArn && region) {
        await chinaUtils.stopTencentRemoteLogAndDebug(lambdaArn, region, cliEventCallback)
        if (startDebug) {
          await chinaUtils.startTencentRemoteLogAndDebug(lambdaArn, region, cliEventCallback)
        }
      }
      cli.log(header, 'grey')
      cli.logOutputs(instanceInfo.outputs)
      cli.status('Watching')
      return true
    case 'error':
      cli.log(`${header} error`, 'grey')
      cli.log(deploymentErrorStack || deploymentError, 'red')
      cli.status('Watching')
      break
    default:
      cli.log(`Deployment failed due to unknown deployment status: ${instanceStatus}`, 'red')
  }
  return false
}

module.exports = async (config, cli) => {
  // Define a close handler, that removes any "dev" mode agents
  const closeHandler = async () => {
    // Set new close listener
    process.on('SIGINT', () => {
      cli.close('error', 'Dev Mode Canceled.  Run "serverless deploy" To Remove Dev Mode Agent.')
    })

    cli.status('Disabling Dev Mode & Closing', null, 'green')
    const deployedInstance = await deploy(sdk, instanceYaml, instanceCredentials)
    if (await updateDeploymentStatus(cli, deployedInstance, false)) {
      cli.close('success', 'Dev Mode Closed')
    }
  }

  // Start CLI persistance status
  cli.start('Initializing', { closeHandler })

  await utils.login()

  // Presentation
  cli.logLogo()
  cli.log(
    'Dev Mode - Watching your Component for changes and enabling streaming logs, if supported...',
    'grey'
  )
  cli.log()

  // Load serverless component instance.  Submit a directory where its config files should be.
  let instanceDir = process.cwd()
  if (config.target) {
    instanceDir = path.join(instanceDir, config.target)
  }
  let instanceYaml = await utils.loadInstanceConfig(instanceDir)

  // Load Instance Credentials
  const instanceCredentials = await utils.loadInstanceCredentials(instanceYaml.stage)

  const sdk = new ServerlessSDK({
    context: {
      orgName: instanceYaml.org
    }
  })

  cli.status('Initializing', instanceYaml.name)

  // Filter configuration
  const filter = {
    stageName: instanceYaml.stage,
    appName: instanceYaml.app,
    instanceName: instanceYaml.name,
    events: []
  }

  // User wants to receive all messages at the app level
  if (config.filter && config.filter === 'app' && filter.instanceName) {
    delete filter.instanceName
    cli.log('Enabling filtering at the activity at the application level', 'grey')
    cli.log()
  }

  /**
   * Watch logic
   */

  let isProcessing = false // whether there's already a deployment in progress
  let queuedOperation = false // whether there's another deployment queued

  // Set watcher
  const watcher = chokidar.watch(process.cwd(), { ignored: /\.serverless/ })

  watcher.on('ready', async () => {
    cli.status('Enabling Dev Mode', null, 'green')
    const deployedInstance = await deploy(sdk, instanceYaml, instanceCredentials)
    await updateDeploymentStatus(cli, deployedInstance, true)
  })

  watcher.on('change', async () => {
    // Skip if processing already and there is a queued operation
    if (isProcessing && queuedOperation) {
      return
    }

    // If already deploying and user made more changes, queue another deploy operation to be run after the first one
    if (isProcessing && !queuedOperation) {
      queuedOperation = true
      return
    }

    // If it's not processin and there is no queued operation
    if (!isProcessing) {
      let deployedInstance
      isProcessing = true
      cli.status('Deploying', null, 'green')
      // reload serverless component instance
      instanceYaml = await utils.loadInstanceConfig(instanceDir)
      deployedInstance = await deploy(sdk, instanceYaml, instanceCredentials)
      if (queuedOperation) {
        cli.status('Deploying', null, 'green')
        // reload serverless component instance
        instanceYaml = await utils.loadInstanceConfig(instanceDir)
        deployedInstance = await deploy(sdk, instanceYaml, instanceCredentials)
      }

      await updateDeploymentStatus(cli, deployedInstance, true)
      isProcessing = false
      queuedOperation = false
    }
  })
}
