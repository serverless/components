'use strict';
const path = require('path');
const { ServerlessSDK, utils: tencentUtils } = require('@serverless/platform-client-china');
const chalk = require('chalk');
const utils = require('./utils');
const { version } = require('../../../package.json');

const resolveParams = (value) => {
  if (!value) {
    throw new Error('A name is required for param setting');
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

  if (Array.isArray(value)) {
    value.forEach((item) => {
      const [paramName, paramValue] = resolveParamSet(item);
      result[paramName] = paramValue;
    });
  } else {
    const [paramName, paramValue] = resolveParamSet(value);
    result[paramName] = paramValue;
  }
  return result;
};

const runParamSet = async (config, instanceYaml, cli, sdk) => {
  const params = resolveParams(config.name);

  cli.sessionStart('Start to set parameter');
  const stage = config.stage || instanceYaml.stage;
  const app = config.app || instanceYaml.app;

  const payload = { ...instanceYaml, stage, app, params };
  const result = await sdk.paramSet(payload);

  cli.sessionStop('Param set successfully', result);
};

const runParamList = async (config, instanceYaml, cli, sdk) => {
  let params = [];
  if (config.name) {
    if (Array.isArray(config.name)) {
      params = [...config.name];
    } else {
      params.push(config.name);
    }
  }

  cli.sessionStart('Start to list parameter');
  const stage = config.stage || instanceYaml.stage;
  const app = config.app || instanceYaml.app;
  const payload = { ...instanceYaml, stage, app, params };
  const result = sdk.paramList(payload);

  cli.sessionStop('Param set successfully', result);
};

/**
 * Route param command
 */
module.exports = async (config, cli) => {
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

  await utils.login();

  const instanceYaml = await utils.loadInstanceConfig(instanceDir);
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
    },
    agent: `ComponentsCLI_${version}`,
  });

  if (subCommand === 'set') {
    return await runParamSet(config, instanceYaml, cli, sdk);
  }
  return await runParamList(config, instanceYaml, cli, sdk);
};
