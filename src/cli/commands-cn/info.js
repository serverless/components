'use strict';

/*
 * CLI: Command: INFO
 */

const path = require('path');
const { ServerlessSDK } = require('@serverless/platform-client-china');
const { v4: uuidv4 } = require('uuid');
const utils = require('./utils');
const { runningTemplate } = require('../utils');
const infoAll = require('./infoAll');
const chalk = require('chalk');
const moment = require('moment');

module.exports = async (config, cli, command) => {
  // Start CLI persistance status
  cli.sessionStart('Initializing', { timer: false });

  await utils.login();

  if (runningTemplate(process.cwd())) {
    return infoAll(config, cli);
  }

  // Load YAML
  let instanceDir = process.cwd();
  if (config.target) {
    instanceDir = path.join(instanceDir, config.target);
  }
  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);

  // Presentation
  cli.logLogo();
  cli.log();

  cli.sessionStatus('Initializing', instanceYaml.name);

  // initialize SDK
  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });

  // don't show the status in debug mode due to formatting issues
  if (!config.debug) {
    cli.sessionStatus('Loading Info', null, 'white');
  }

  // Fetch info
  let instance = await sdk.getInstance(
    instanceYaml.org,
    instanceYaml.stage,
    instanceYaml.app,
    instanceYaml.name,
    { fetchSourceCodeUrl: true }
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
  cli.log(`${chalk.grey('Last Action:')}  ${instance.lastAction} (${lastActionAgo})`);
  cli.log(`${chalk.grey('Deployments:')}  ${instance.instanceMetrics.deployments}`);
  cli.log(`${chalk.grey('Status:')}       ${statusLog}`);

  // show error stack if available
  if (instance.deploymentErrorStack) {
    cli.log();
    cli.log(chalk.red(instance.deploymentErrorStack));
  }
  cli.log(`${chalk.grey('More Info:')}    ${utils.getInstanceDashboardUrl(instanceYaml)}`);

  // show state only in debug mode
  if (config.debug) {
    cli.log();
    cli.log(`${chalk.grey('State:')}`);
    cli.log();
    cli.logOutputs(instance.state);
    cli.log();
    cli.log(`${chalk.grey('Outputs:')}`);
  }

  if (instance.outputs) {
    delete instance.outputs.vendorMessage;
    cli.log();
    cli.logOutputs(instance.outputs);
  }

  cli.sessionStop('success', 'Info successfully loaded');
  return null;
};
