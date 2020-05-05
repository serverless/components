'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const {
  getOutputs,
  getAllComponents,
  setDependencies,
  createGraph,
  executeGraph,
} = require('../utils');
const { getAccessKey, isLoggedIn, loadInstanceCredentials, getTemplate } = require('./utils');

module.exports = async (config, cli, command) => {
  cli.start('Initializing', { timer: true });
  // Get access key
  const accessKey = await getAccessKey();

  // Ensure the user is logged in or access key is available, or advertise
  if (!accessKey && !isLoggedIn()) {
    cli.advertise();
  }

  if (!config.debug) {
    cli.logLogo();
  } else if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
    cli.log('Running in Platform Dev stage');
  }

  const templateYaml = await getTemplate(process.cwd());

  if (config.debug) {
    const meta = `Action: "${command} --all" - Stage: "${templateYaml.stage}" - Org: "${templateYaml.org}" - App: "${templateYaml.app}" - Name: "${templateYaml.name}"`;
    cli.log(meta);
  }

  if (!templateYaml) {
    throw new Error('No components found in sub directories.');
  }

  // Load Instance Credentials
  const credentials = await loadInstanceCredentials(templateYaml.stage);

  cli.status('Initializing', templateYaml.name);

  // initialize SDK
  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: templateYaml.org,
    },
  });

  // Prepare Options
  const options = {};
  options.debug = config.debug;
  options.dev = config.dev;

  // Connect to Serverless Platform Events, if in debug mode
  if (options.debug) {
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
  }

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

    if (options.debug) {
      cli.log();
      cli.logOutputs(outputs);
    }
  }

  cli.close('success', 'Success');
};
