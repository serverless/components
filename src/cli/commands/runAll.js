/* eslint no-restricted-syntax: 0 */

'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const {
  getOutputs,
  getAllComponents,
  setDependencies,
  createGraph,
  executeGraph,
  checkLocalCredentials,
} = require('../utils');
const { getAccessKey, getTemplate, isLoggedInOrHasAccessKey } = require('./utils');
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

  cli.sessionStart('Initializing', { timer: true });

  // get any access key stored in env
  let accessKey = await getAccessKey();

  if (!config.debug) {
    cli.logLogo();
  } else if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
    cli.log('Running in Platform Dev stage');
  }

  const templateYaml = await getTemplate(process.cwd());

  // if no access key in env, get access key from rc file by passing org
  if (!accessKey) {
    accessKey = await getAccessKey(templateYaml.org);
  }

  const meta = `Action: "${command}" - Stage: "${templateYaml.stage}" - Org: "${templateYaml.org}" - App: "${templateYaml.app}" - Name: "${templateYaml.name}"`;
  cli.log(meta, 'grey');

  if (!templateYaml) {
    throw new Error('No apps found in sub directories.');
  }

  cli.sessionStatus('Initializing');

  // initialize SDK
  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: templateYaml.org,
    },
  });

  await checkLocalCredentials(sdk, config, templateYaml.org);

  try {
    // Prepare Options
    const options = {};
    options.debug = config.debug;
    options.dev = config.dev;

    // Connect to Serverless Platform Events, if in debug mode
    if (options.debug) {
      try {
        await sdk.connect({
          filter: {
            stageName: templateYaml.stage,
            appName: templateYaml.app,
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
      } catch (error) {
        if (error.message.includes('401')) {
          cli.sessionStop(
            'error',
            `Your credentials do not have access to the Organization with the name of: ${templateYaml.org}.  Try logging into a different account.`
          );
          return null;
        }
      }
    }

    const deferredNotificationsData =
      command === 'deploy'
        ? requestNotification(
            Object.assign(generateNotificationsPayload(templateYaml), { command: 'deploy' })
          )
        : null;

    if (command === 'remove') {
      cli.sessionStatus('Removing');
    } else {
      cli.sessionStatus('Deploying');
    }

    const allComponents = await getAllComponents(templateYaml);

    const allComponentsWithDependencies = setDependencies(allComponents);

    const graph = createGraph(allComponentsWithDependencies, command);

    const allComponentsWithOutputs = await executeGraph(
      allComponentsWithDependencies,
      command,
      graph,
      cli,
      sdk,
      options
    );

    // Check for errors
    const succeeded = [];
    const failed = [];
    for (const component in allComponentsWithOutputs) {
      if (Object.prototype.hasOwnProperty.call(allComponentsWithOutputs, component)) {
        const c = allComponentsWithOutputs[component];
        if (c.error) {
          failed.push(c.name);
        }
        if (c.outputs) {
          succeeded.push(c.name);
        }
      }
    }

    if (failed.length) {
      cli.sessionStop(
        'error',
        `Errors: "${command}" ran for ${succeeded.length} apps successfully. But, ${failed.length} failed.`
      );
      return null;
    }

    // don't show outputs if removing
    if (command !== 'remove') {
      const outputs = getOutputs(allComponentsWithOutputs);

      // log all outputs at once at the end only on debug mode
      // when not in debug, the graph handles logging outputs
      // of each deployed instance in realtime
      if (options.debug) {
        cli.log();
        cli.logOutputs(outputs);
      }
    }

    cli.sessionStop('success', `"${command}" ran for ${succeeded.length} apps successfully.`);

    if (deferredNotificationsData) printNotification(cli, await deferredNotificationsData);
  } finally {
    sdk.disconnect();
  }

  return null;
};
