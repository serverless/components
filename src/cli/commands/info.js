'use strict';

/*
 * CLI: Command: INFO
 */

const { ServerlessSDK } = require('@serverless/platform-client');
const {
  getAccessKey,
  loadInstanceConfig,
  isLoggedInOrHasAccessKey,
  getDashboardUrl,
} = require('./utils');
const { runningTemplate, checkLocalCredentials } = require('../utils');
const infoAll = require('./infoAll');
const chalk = require('chalk');
const moment = require('moment');

module.exports = async (config, cli) => {
  // Ensure the user is logged in or access key is available, or advertise
  if (!isLoggedInOrHasAccessKey()) {
    cli.logAdvertisement();
    cli.sessionStop('error', 'Please log in by running "serverless login"');
    return null;
  }

  if (runningTemplate(process.cwd())) {
    return infoAll(config, cli);
  }

  // Start CLI persistance status
  cli.sessionStart('Fetching App Info', { timer: false });

  // Load YAML
  const instanceYaml = await loadInstanceConfig(process.cwd());
  // Get access key
  const accessKey = await getAccessKey(instanceYaml.org);

  // Presentation
  cli.logLogo();

  const meta = `Action: "info" - Stage: "${instanceYaml.stage}" - Org: "${instanceYaml.org}" - App: "${instanceYaml.app}" - Name: "${instanceYaml.name}"`;
  cli.log(meta, 'grey');

  // initialize SDK
  const sdk = new ServerlessSDK({
    accessKey,
  });

  await checkLocalCredentials(sdk, config, instanceYaml.org);

  // Fetch info
  let instance = await sdk.getInstance(
    instanceYaml.org,
    instanceYaml.stage,
    instanceYaml.app,
    instanceYaml.name
  );

  instance = instance.instance;

  // Throw a helpful error if the instance was not deployed
  if (!instance) {
    throw new Error(
      `Instance "${instanceYaml.name}" is not active. Please deploy the instance first, then run "serverless info" again.`
    );
  }

  // format last action for better UX
  const lastActionAgo = moment(instance.lastActionAt).fromNow();

  // color status based on...status
  let statusLog;
  if (instance.instanceStatus === 'error') {
    statusLog = chalk.red(instance.instanceStatus);
  } else if (instance.instanceStatus === 'active') {
    statusLog = chalk.green(instance.instanceStatus);
  } else if (instance.instanceStatus === 'inactive') {
    statusLog = chalk.yellow(instance.instanceStatus);
  } else {
    statusLog = instance.instanceStatus;
  }

  cli.log();
  cli.log(`${'Last Action:'}  ${instance.lastAction} (${lastActionAgo})`);
  cli.log(`${'Deployments:'}  ${instance.instanceMetrics.deployments}`);
  cli.log(`${'Status:'}       ${statusLog}`);
  cli.log(`${'Component:'}    ${instance.componentName}@${instance.componentVersion}`);

  // show error stack if available
  if (instance.deploymentErrorStack) {
    cli.log();
    cli.log(instance.deploymentErrorStack, 'red');
  }

  // show state only in debug mode
  if (config.debug) {
    cli.log();
    cli.log(`${'State:'}`);
    cli.log();
    cli.logOutputs(instance.state);
  }

  // Outputs
  cli.log();
  cli.log(`${'Outputs:'}`);
  cli.log();
  cli.logOutputs(instance.outputs);

  cli.log();
  cli.log(
    `Full details: ${getDashboardUrl(
      `/${instance.orgName}/apps/${instance.appName || instance.instanceName}/${
        instance.instanceName
      }/${instance.stageName}`
    )}`
  );

  cli.sessionStop('success', 'App info fetched');

  return null;
};
