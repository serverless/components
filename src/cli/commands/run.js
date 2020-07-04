'use strict';

/*
 * CLI: Command: RUN
 */

const { ServerlessSDK } = require('@serverless/platform-client');
const { runningTemplate } = require('../utils');
const {
  getDashboardUrl,
  getAccessKey,
  isLoggedInOrHasAccessKey,
  loadInstanceConfig,
  loadInstanceCredentials,
} = require('./utils');
const runAll = require('./runAll');
const generateNotificationsPayload = require('../notifications/generate-payload');
const requestNotification = require('../notifications/request');
const printNotification = require('../notifications/print-notification');

module.exports = async (config, cli, command) => {
  // Ensure the user is logged in or access key is available, or advertise
  if (!isLoggedInOrHasAccessKey()) {
    cli.logAdvertisement();
    cli.sessionStop('error', 'Please log in by running "serverless login"');
    return null;
  }

  // Check to see if the cwd is a template containing multiple templates
  if (['deploy', 'remove'].includes(command) && runningTemplate(process.cwd())) {
    return runAll(config, cli, command);
  }

  // Start CLI persistance status
  cli.sessionStart('Initializing', { timer: true });

  // Load YAML
  const instanceYaml = await loadInstanceConfig(process.cwd());

  // Get access key
  const accessKey = await getAccessKey(instanceYaml.org);

  const meta = `Action: "${command}" - Stage: "${instanceYaml.stage}" - Org: "${instanceYaml.org}" - App: "${instanceYaml.app}" - Name: "${instanceYaml.name}"`;

  // Presentation
  if (!config.debug) {
    cli.logLogo();
    cli.log(meta, 'grey');
  } else {
    cli.log(meta);
  }

  if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
    cli.log('Running in Platform Dev stage');
  }

  // Load Instance Credentials
  const instanceCredentials = await loadInstanceCredentials(instanceYaml.stage);

  // initialize SDK
  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: instanceYaml.org,
    },
  });

  try {
    // Prepare Options
    const options = {};
    options.debug = config.debug;
    options.dev = config.dev;

    // Connect to Serverless Platform Events, if in debug mode
    if (options.debug) {
      await sdk.connect({
        filter: {
          stageName: instanceYaml.stage,
          appName: instanceYaml.app,
          instanceName: instanceYaml.name,
        },
        onEvent: (evt) => {
          if (evt.event !== 'instance.run.logs') {
            return;
          }
          if (evt.data.logs && Array.isArray(evt.data.logs)) {
            evt.data.logs.forEach((log) => {
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
              cli.log(log.data);
            });
          }
        },
      });
    }

    /**
     * Prepare notification promise
     */
    let deferredNotificationsData;
    if (command === 'deploy') {
      deferredNotificationsData = requestNotification(
        Object.assign(generateNotificationsPayload(instanceYaml), { command: 'deploy' })
      );

      // Warn about dev agent
      if (options.dev) {
        cli.log();
        cli.log(
          '"--dev" option detected.  Dev Agent will be added to your code.  Do not deploy this in your production stage.',
          'grey'
        );
      }

      // run deploy
      cli.sessionStatus('Deploying');
      const instance = await sdk.deploy(instanceYaml, instanceCredentials, options);
      cli.log();
      cli.logOutputs(instance.outputs);

      cli.log();
      cli.log(
        `Full details: ${getDashboardUrl(
          `/${instanceYaml.org}/apps/${instanceYaml.app || instanceYaml.name}/${
            instanceYaml.name
          }/${instanceYaml.stage}`
        )}`
      );
    } else if (command === 'remove') {
      cli.sessionStatus('Removing', null, 'white');

      // The "inputs" in serverless.yml are only for deploy.  Remove them for all other commands
      instanceYaml.inputs = {};

      await sdk.remove(instanceYaml, instanceCredentials, options);
    } else {
      // run a custom method synchronously to receive outputs directly
      options.sync = true;

      // The "inputs" in serverless.yml are only for deploy.  Remove them for all other commands
      instanceYaml.inputs = {};

      cli.sessionStatus('Running', null, 'white');

      const instance = await sdk.run(command, instanceYaml, instanceCredentials, options);

      if (instance && instance.outputs) {
        cli.log();
        cli.logOutputs(instance.outputs);
      } else {
        cli.log();
        cli.log('No outputs available', 'grey');
      }
    }

    cli.sessionStop('success', 'Success');
    if (deferredNotificationsData) printNotification(cli, await deferredNotificationsData);
  } finally {
    sdk.disconnect();
  }
  return null;
};
