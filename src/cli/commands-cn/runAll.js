'use strict';

const { ServerlessSDK } = require('@serverless/platform-client-china');
const {
  getOutputs,
  getAllComponents,
  setDependencies,
  createGraph,
  executeGraph,
} = require('../utils');
const { login, loadInstanceCredentials, getTemplate } = require('./utils');
const generateNotificationsPayload = require('../notifications/generate-payload');
const requestNotification = require('../notifications/request');
const printNotification = require('../notifications/print-notification');

module.exports = async (config, cli, command) => {
  cli.sessionStart('Initializing', { timer: true });

  await login();

  if (!config.debug) {
    cli.logLogo();
  } else if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
    cli.log('Running in Platform Dev stage');
  }

  const templateYaml = await getTemplate(process.cwd());

  if (!templateYaml) {
    throw new Error('No components found in sub directories.');
  }

  // Load Instance Credentials
  const credentials = await loadInstanceCredentials(templateYaml.stage);

  cli.sessionStatus('Initializing', templateYaml.name);

  // initialize SDK
  const sdk = new ServerlessSDK({
    context: {
      orgName: templateYaml.org,
    },
  });

  // Prepare Options
  const options = {};
  options.dev = config.dev;

  // TODO not support for tencent yet
  // Connect to Serverless Platform Events, if in debug mode
  options.debug = config.debug;

  const deferredNotificationsData =
    command === 'deploy'
      ? requestNotification(
          Object.assign(generateNotificationsPayload(templateYaml), { command: 'deploy' })
        )
      : null;

  if (command === 'remove') {
    cli.sessionStatus('Removing', null, 'white');
  } else {
    cli.sessionStatus('Deploying', null, 'white');
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
    credentials,
    options
  );

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

  cli.sessionStop('success', 'Success');

  if (deferredNotificationsData) printNotification(cli, await deferredNotificationsData);
};
