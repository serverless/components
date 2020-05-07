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

module.exports = async (config, cli, command) => {
  cli.start('Initializing', { timer: true });

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

  cli.status('Initializing', templateYaml.name);

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

  if (command === 'remove') {
    cli.status('Removing', null, 'white');
  } else {
    cli.status('Deploying', null, 'white');
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

  if (command === 'remove') {
    cli.close('success', 'Success');
  } else {
    const outputs = getOutputs(allComponentsWithOutputs);

    if (config.debug) {
      cli.log();
      cli.logOutputs(outputs);
    }
  }

  cli.close('success', 'Success');
};
