'use strict';
const path = require('path');
const { ServerlessSDK, utils: tencentUtils } = require('@serverless/platform-client-china');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const utils = require('./utils');
const { version } = require('../../../package.json');

const resolveParams = (value) => {
  if (!value.length) {
    throw new Error('At least one parameter is required for param setting');
  }
  const result = {};
  const resolveParamSet = (item) => {
    const [paramName, paramValue] = item.split('=');
    if (!paramName || !paramValue) {
      throw new Error(
        `The format of param setting must be ${chalk.yellow(
          '--name paramName=paramValue'
        )}, e.g: ${chalk.yellow('sls param set --name id=1234')} `
      );
    }
    return [paramName, paramValue];
  };

  value.forEach((item) => {
    const [paramName, paramValue] = resolveParamSet(item);
    result[paramName] = paramValue;
  });
  return result;
};

const runParamSet = async (config, instanceYaml, cli, sdk) => {
  const params = resolveParams(config.name);

  cli.sessionStart('Start to set parameter');
  const stage = config.stage || instanceYaml.stage;
  const app = config.app || instanceYaml.app;

  const payload = { ...instanceYaml, stage, app, params, appName: app, stageName: stage };
  const result = await sdk.paramSet(payload);

  cli.log(`Parameters app and stage config: app:${chalk.green(app)}, stage: ${chalk.green(stage)}`);
  cli.log(chalk.yellow(result.message));
  cli.sessionStop('Param set stop');
};

const runParamList = async (config, instanceYaml, cli, sdk) => {
  const params = config.name;

  cli.sessionStart('Start to list parameter');
  const stage = config.stage || instanceYaml.stage;
  const app = config.app || instanceYaml.app;
  const payload = { ...instanceYaml, stage, app, params, appName: app, stageName: stage };
  const result = await sdk.paramList(payload);

  cli.log(`Parameters app and stage config: app:${chalk.green(app)}, stage: ${chalk.green(stage)}`);
  Object.keys(result.data).forEach((key) => {
    cli.log(`- ${key}: ${result.data[key]}`);
  });
  cli.log(`message: ${chalk.yellow(result.message)}`);
  cli.sessionStop('Param list stop');
};

/**
 * Route param command
 */
module.exports = async (config, cli, command) => {
  // Load YAML
  let instanceDir = process.cwd();
  if (config.target) {
    instanceDir = path.join(instanceDir, config.target);
  }
  // Check if the user input a valid sub command
  const subCommand = config.params[0];
  if (!subCommand || !['set', 'list'].includes(subCommand)) {
    throw new Error('You must input one of these two sub commands: set or list');
  }

  await utils.login(config);

  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
  // initialize SDK
  const orgUid = await tencentUtils.getOrgId();
  const sdk = new ServerlessSDK({
    accessKey: tencentUtils.buildTempAccessKeyForTencent({
      SecretId: process.env.TENCENT_SECRET_ID,
      SecretKey: process.env.TENCENT_SECRET_KEY,
      Token: process.env.TENCENT_TOKEN,
    }),
    context: {
      orgUid,
      orgName: instanceYaml.org,
      traceId: uuidv4(),
    },
    agent: `ComponentsCLI_${version}`,
  });

  if (subCommand === 'set') {
    const name = config.params.slice(1);
    config.name = name;
    return await runParamSet(config, instanceYaml, cli, sdk);
  }
  // Param list can only list all parameters, so set the name as an empty list
  config.name = [];
  return await runParamList(config, instanceYaml, cli, sdk);
};
