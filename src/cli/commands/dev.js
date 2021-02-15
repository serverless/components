'use strict';

/*
 * CLI: Command: Dev
 */

const { ServerlessSDK } = require('@serverless/platform-client');
const { getAccessKey, loadInstanceConfig, isLoggedInOrHasAccessKey } = require('./utils');
const path = require('path');
const { getInstanceConfigPath, checkLocalCredentials } = require('../utils');

/**
 * Deploy helper function
 */
const deploy = async (sdk, cli, instanceYaml, options = {}) => {
  let result;
  try {
    result = await sdk.deploy(instanceYaml, options);
  } catch (error) {
    if (error.name === 'Invalid Component Types') {
      error.message = `Deployment failed due to invalid input: ${error.message}`;
    }
    if (error.details && error.details.repo) {
      error.documentation = error.details.repo;
    }
    cli.logError(error);
    return null;
  }

  const d = new Date();
  const header = `${d.toLocaleTimeString()} - ${instanceYaml.name} - deployment`;

  cli.log();
  cli.log(header, 'grey');

  if (result.outputs) {
    cli.logOutputs(result.outputs);
  }

  cli.sessionStatus('Watching');

  return result;
};

module.exports = async (config, cli) => {
  let instanceYaml;

  // Define a close handler, that removes any "dev" mode agents
  const closeHandler = async () => {
    // Set new close listener
    process.on('SIGINT', () => {
      cli.sessionStop(
        'error',
        'Dev Mode canceled.  Run "serverless deploy" to remove dev mode agent.'
      );
      process.exit();
    });

    sdk.disconnect();
    cli.sessionStatus('Disabling Dev Mode & closing', null, 'green');

    // Remove agent from application
    const result = await deploy(sdk, cli, instanceYaml); // Don't include dev flag

    await cli.watcher.close();

    if (!result) {
      cli.sessionStop(
        'success',
        "Dev Mode closed, however the last deployment failed due to the above error.  Fix it and run 'serverless deploy' to ensure your service does not have issues."
      );
    } else {
      cli.sessionStop('success', 'Dev Mode closed');
    }

    return null;
  };

  // Ensure the user is logged in or access key is available, or advertise
  if (!isLoggedInOrHasAccessKey()) {
    cli.logAdvertisement();
    cli.sessionStop('error', 'Please log in by running "serverless login"');
    return null;
  }

  // Start CLI persistance status
  cli.sessionStart('Initializing', { closeHandler });

  // Load serverless component instance.  Submit a directory where its config files should be.
  instanceYaml = await loadInstanceConfig(process.cwd(), { disableCache: true });

  // Get access key
  const accessKey = await getAccessKey(instanceYaml.org);

  // Presentation
  cli.logLogo();

  cli.log(
    'Dev Mode - Watching your App for changes and enabling streaming logs, if supported...',
    'grey'
  );

  cli.log();
  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: instanceYaml.org,
    },
  });

  await checkLocalCredentials(sdk, config, instanceYaml.org);

  cli.sessionStatus('Initializing');

  /**
   * Event Handler tells this client what to do with Serverless Platform Events received via websockets
   */

  const onEvent = (event) => {
    const d = new Date();

    // Logs
    if (event.event === 'instance.logs') {
      if (event.data.logs && Array.isArray(event.data.logs)) {
        event.data.logs.forEach((log) => {
          const date = new Date(log.createdAt);

          // Remove strange formatting that comes from stderr
          if (typeof log.data === 'string' && log.data.startsWith("'")) {
            log.data = log.data.substr(1);
          }
          if (typeof log.data === 'string' && log.data.endsWith("'")) {
            log.data = log.data.substring(0, log.data.length - 1);
          }
          if (typeof log.data === 'string' && log.data.endsWith('\\n')) {
            log.data = log.data.substring(0, log.data.length - 2);
          }

          let type;
          if (log.type === 'log' || log.type === 'stdout') {
            type = 'log';
          }
          if (log.type === 'debug' || log.type === 'stderr') {
            type = 'log - debug';
          }
          if (log.type === 'info') {
            type = 'log - info';
          }
          if (log.type === 'warn') {
            type = 'log - warn';
          }
          if (log.type === 'error') {
            type = 'log - error';
          }
          if (log.type === 'stdout') {
            type = 'log - stdout';
          }
          if (log.type === 'stderr') {
            type = 'log - stderr';
          }
          const header = `${date.toLocaleTimeString()} - ${event.instance_name} - ${type}`;
          cli.log(header, 'grey');
          if (log.type === 'log' || log.type === 'stdout') {
            cli.log(log.data);
          }
          if (log.type === 'debug' || log.type === 'info' || log.type === 'stderr') {
            cli.log(log.data);
          }
          if (log.type === 'warn') {
            cli.log(log.data, 'grey');
          }
          if (log.type === 'error') {
            cli.log(log.data, 'red');
          }
        });
      }
    }

    // Error
    if (event.event === 'instance.error') {
      const header = `${d.toLocaleTimeString()} - ${event.instance_name} - error`;
      cli.log(header, 'grey');
      cli.log(event.data.stack, 'red');
      cli.log();
    }

    // Transaction
    if (event.event === 'instance.transaction') {
      let transactionType;
      // HTTP Request
      if (event.data.path && event.data.httpMethod) {
        transactionType = `transaction - ${event.data.httpMethod.toUpperCase()} - ${
          event.data.path
        }`;
      }
      // Default
      else {
        transactionType = 'transaction';
      }

      const header = `${d.toLocaleTimeString()} - ${event.instance_name} - ${transactionType}`;
      cli.log(header, 'grey');
    }
  };

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

  // Establish connection with Serverless Platform
  try {
    await sdk.connect({
      org: instanceYaml.org,
      filter,
      onEvent,
    });
  } catch (error) {
    if (error.message.includes('401')) {
      cli.sessionStop(
        'error',
        `Your credentials do not have access to the Organization with the name of: ${instanceYaml.org}.  Try logging into a different account.`
      );
      return null;
    }
    throw new Error(error);
  }

  /**
   * Watch logic
   */

  let isProcessing = false; // whether there's already a deployment in progress
  let queuedOperation = false; // whether there's another deployment queued

  const ignored = [];

  // get the src path to watch.
  // could be in child dir, parent dir, cwd, any dir.
  // by default it's the cwd.
  let srcPath = process.cwd();
  if (instanceYaml.inputs && instanceYaml.inputs.src) {
    if (typeof instanceYaml.inputs.src === 'string') {
      srcPath = path.resolve(instanceYaml.inputs.src);
    } else if (typeof instanceYaml.inputs.src === 'object') {
      if (instanceYaml.inputs.src.src) {
        srcPath = path.resolve(instanceYaml.inputs.src.src);
      }

      if (instanceYaml.inputs.src.dist) {
        // dont trigger a redeploy on dist changes
        // the src changes is enough to trigger the
        // build which updates dist
        ignored.push(instanceYaml.inputs.src.dist);
      }
    }
  }

  // Set watcher
  cli.watch(srcPath, { ignored });

  // also watch the yaml file for changes
  // in case it is not in the src directory
  cli.watcher.add(getInstanceConfigPath(process.cwd()));

  cli.watcher.on('ready', async () => {
    cli.sessionStatus('Initializing Dev Mode', null, 'green');
    await deploy(sdk, cli, instanceYaml, { dev: true });
    cli.sessionStatus('Watching');
  });

  // watch "raw" events to capture all FS events (creating files, deleting files..etc)
  cli.watcher.on('raw', async () => {
    // Skip if processing already and there is a queued operation
    if (isProcessing && queuedOperation) {
      return;
    }

    // If already deploying and user made more changes, queue another deploy operation to be run after the first one
    if (isProcessing && !queuedOperation) {
      queuedOperation = true;
      return;
    }

    // If it's not processing and there is no queued operation
    if (!isProcessing) {
      isProcessing = true;
      cli.sessionStatus('Deploying', null, 'green');
      // reload serverless component instance
      instanceYaml = await loadInstanceConfig(process.cwd(), { disableCache: true });

      await deploy(sdk, cli, instanceYaml, { dev: true });
      cli.sessionStatus('Watching');

      if (queuedOperation) {
        cli.sessionStatus('Deploying', null, 'green');
        // reload serverless component instance
        instanceYaml = await loadInstanceConfig(process.cwd(), { disableCache: true });
        await deploy(sdk, cli, instanceYaml, { dev: true });
        cli.sessionStatus('Watching');
      }

      isProcessing = false;
      queuedOperation = false;
    }
  });

  return null;
};
