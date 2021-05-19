'use strict';

/*
 * CLI: Command: INFO
 */

const path = require('path');
const { ServerlessSDK } = require('@serverless/platform-client-china');
const { v4: uuidv4 } = require('uuid');
const utils = require('./utils');
const { runningTemplate, checkTemplateAppAndStage } = require('../utils');
const infoAll = require('./infoAll');
const chalk = require('chalk');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');

dayjs.extend(relativeTime);

module.exports = async (config, cli, command) => {
  // Start CLI persistance status
  cli.sessionStart('Initializing', { timer: false });

  let instanceDir = process.cwd();
  if (runningTemplate(instanceDir) && checkTemplateAppAndStage(instanceDir)) {
    return infoAll(config, cli);
  }

  if (config.target) {
    instanceDir = path.join(instanceDir, config.target);
  }
  await utils.checkBasicConfigValidation(instanceDir);
  await utils.login(config);
  // Load YAML

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
  const lastActionAgo = dayjs(instance.lastActionAt).fromNow();

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
  cli.log(`${chalk.grey('最后操作:')}  ${instance.lastAction} (${lastActionAgo})`);
  cli.log(`${chalk.grey('部署次数:')}  ${instance.instanceMetrics.deployments}`);
  cli.log(`${chalk.grey('应用状态:')}  ${statusLog}`);

  // show error stack if available
  if (instance.deploymentErrorStack) {
    cli.log();
    cli.log(chalk.red(instance.deploymentErrorStack));
  }

  // show state only in debug mode
  if (config.debug) {
    cli.log();
    cli.log(`${chalk.grey('State:')}`);
    cli.log();
    cli.logOutputs(instance.state);
    cli.log();
    cli.log(`${chalk.grey('输出:')}`);
  }

  if (instance.outputs) {
    delete instance.outputs.vendorMessage;
    delete instance.outputs.sourceCodeDownloadUrl;
    cli.log();
    cli.logOutputs(instance.outputs);
  }

  cli.log();
  cli.log(`${chalk.grey('应用控制台:')} ${utils.getInstanceDashboardUrl(instanceYaml)}`);

  cli.sessionStop('success', '信息成功加载');
  return null;
};
