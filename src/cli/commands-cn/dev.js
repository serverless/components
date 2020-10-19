'use strict';

/*
 * CLI: Command: Dev
 */

const path = require('path');
const { Writable } = require('stream');
const ansiEscapes = require('ansi-escapes');
const chokidar = require('chokidar');
const { ServerlessSDK, utils: chinaUtils } = require('@serverless/platform-client-china');
const { v4: uuidv4 } = require('uuid');
const utils = require('./utils');

class LogForwardingOutput extends Writable {
  _write(chunk, encoding, callback) {
    process.stdout.write(ansiEscapes.eraseDown);
    process.stdout._write(chunk, encoding, callback);
    process.stdout.write(ansiEscapes.cursorLeft);
  }

  _writev(chunks, callback) {
    process.stdout.write(ansiEscapes.eraseDown);
    process.stdout._writev(chunks, callback);
    process.stdout.write(ansiEscapes.cursorLeft);
  }
}

const logForwardingOutput = new LogForwardingOutput();

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
    );
    return instanceInfo;
  };

  let instanceInfo = {};

  try {
    await sdk.deploy(instance, credentials);
    const instanceStatusPollingStartTime = new Date().getTime();
    instanceInfo = await getInstanceInfo();
    while (instanceInfo.instanceStatus === 'deploying') {
      instanceInfo = await getInstanceInfo();
      if (Date.now() - instanceStatusPollingStartTime > 24000) {
        throw new Error('Deployment timeout, please retry in a few seconds');
      }
    }
  } catch (e) {
    instanceInfo.instanceStatus = 'error';
    instanceInfo.deploymentError = e;
  }

  return instanceInfo;
}

async function updateDeploymentStatus(cli, instanceInfo, startDebug) {
  const { instanceStatus, instanceName, deploymentError, deploymentErrorStack } = instanceInfo;
  const d = new Date();
  const header = `${d.toLocaleTimeString()} - ${instanceName} - deployment`;

  const cliEventCallback = (msg, option) => {
    cli.log(msg, option && option.type === 'error' ? 'red' : 'grey');
  };
  cliEventCallback.stdout = logForwardingOutput;

  switch (instanceStatus) {
    case 'active': {
      const {
        state: { lambdaArn, region },
        outputs: { scf, runtime, namespace },
      } = instanceInfo;
      let runtimeInfo = runtime;
      let namespaceInfo = namespace;
      if (!runtimeInfo && scf) {
        runtimeInfo = scf.runtime;
      }
      if (!namespaceInfo && scf) {
        namespaceInfo = scf.namespace;
      }
      if (lambdaArn && runtimeInfo && region) {
        const functionInfo = {
          functionName: lambdaArn,
          namespace: namespaceInfo,
          runtime: runtimeInfo,
        };
        await chinaUtils.stopTencentRemoteLogAndDebug(functionInfo, region, cliEventCallback);
        if (startDebug) {
          await chinaUtils.startTencentRemoteLogAndDebug(functionInfo, region, cliEventCallback);
        }
      }
      cli.log(header, 'grey');
      delete instanceInfo.outputs.vendorMessage;
      cli.logOutputs(instanceInfo.outputs);
      cli.sessionStatus('Watching');
      return true;
    }
    case 'error':
      cli.log(`${header} error`, 'grey');
      cli.log(deploymentErrorStack || deploymentError, 'red');
      cli.sessionStatus('Watching');
      break;
    default:
      cli.log(`Deployment failed due to unknown deployment status: ${instanceStatus}`, 'red');
  }
  return false;
}

module.exports = async (config, cli, command) => {
  let watcher;

  // Define a close handler, that removes any "dev" mode agents
  const closeHandler = async () => {
    // Set new close listener
    process.on('SIGINT', () => {
      cli.sessionStop('error', 'Dev Mode Canceled.');
      process.exit();
    });

    if (watcher) {
      await watcher.close();
    }
    cli.sessionStatus('Disabling Dev Mode & Closing', null, 'green');
    const deployedInstance = await deploy(sdk, instanceYaml, instanceCredentials);
    if (await updateDeploymentStatus(cli, deployedInstance, false)) {
      cli.sessionStop('success', 'Dev Mode Closed');
      return null;
    }
    cli.sessionStop('error', 'Deployment failed. Run "serverless deploy" to deploy again.');
    return null;
  };

  // Start CLI persistance status
  cli.sessionStart('Initializing', { closeHandler });

  await utils.login();

  // Presentation
  cli.logLogo();
  cli.log(
    'Dev Mode - Watching your Component for changes and enabling streaming logs, if supported...',
    'grey'
  );
  cli.log();

  // Load serverless component instance.  Submit a directory where its config files should be.
  let instanceDir = process.cwd();
  if (config.target) {
    instanceDir = path.join(instanceDir, config.target);
  }
  let instanceYaml = await utils.loadInstanceConfig(instanceDir, command);

  // Load Instance Credentials
  const instanceCredentials = await utils.loadInstanceCredentials(instanceYaml.stage);

  const sdk = new ServerlessSDK({
    context: {
      orgName: instanceYaml.org,
      traceId: uuidv4(),
    },
  });

  cli.sessionStatus('Initializing', instanceYaml.name);

  // Filter configuration
  const filter = {
    stageName: instanceYaml.stage,
    appName: instanceYaml.app,
    instanceName: instanceYaml.name,
    events: [],
  };

  // User wants to receive all messages at the app level
  if (config.filter && config.filter === 'app' && filter.instanceName) {
    delete filter.instanceName;
    cli.log('Enabling filtering at the activity at the application level', 'grey');
    cli.log();
  }

  /**
   * Watch logic
   */

  let isProcessing = false; // whether there's already a deployment in progress
  let queuedOperation = false; // whether there's another deployment queued

  // Set watcher
  watcher = chokidar.watch(process.cwd(), { ignored: /\.serverless/ });

  watcher.on('ready', async () => {
    cli.sessionStatus('Enabling Dev Mode', null, 'green');
    const deployedInstance = await deploy(sdk, instanceYaml, instanceCredentials);
    await updateDeploymentStatus(cli, deployedInstance, true);
  });

  watcher.on('change', async () => {
    // Skip if processing already and there is a queued operation
    if (isProcessing && queuedOperation) {
      return;
    }

    // If already deploying and user made more changes, queue another deploy operation to be run after the first one
    if (isProcessing && !queuedOperation) {
      queuedOperation = true;
      return;
    }

    // If it's not processin and there is no queued operation
    if (!isProcessing) {
      let deployedInstance;
      isProcessing = true;
      cli.sessionStatus('Deploying', null, 'green');
      // reload serverless component instance
      instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
      deployedInstance = await deploy(sdk, instanceYaml, instanceCredentials);
      if (queuedOperation) {
        cli.sessionStatus('Deploying', null, 'green');
        // reload serverless component instance
        instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
        deployedInstance = await deploy(sdk, instanceYaml, instanceCredentials);
      }

      await updateDeploymentStatus(cli, deployedInstance, true);
      isProcessing = false;
      queuedOperation = false;
    }
  });
};
