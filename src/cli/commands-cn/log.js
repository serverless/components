const { FaaS } = require('@tencent-sdk/faas');
const fs = require('fs');
const utils = require('./utils');
const { isJson } = require('../utils');

/**
 * --stage / -s Set stage
 * --region / -r Set region
 * --startTime Set log start time
 * --tail Stream new logs
 */
module.exports = async (config, cli, command) => {
  const { stage, s, region, r, startTime, tail } = config;
  const stageValue = stage || s;
  const regionValue = region || r;

  const instanceDir = process.cwd();
  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
  const regionInYml = instanceYaml && instanceYaml.inputs && instanceYaml.inputs.region;

  let functionName;
  if (instanceYaml && instanceYaml.inputs && instanceYaml.inputs.name) {
    functionName = instanceYaml.inputs.name;
  } else {
    functionName = `${instanceYaml.name}-${stageValue || instanceYaml.stage}-${instanceYaml.app}`;
  }
  const client = new FaaS({
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
    token: process.env.TENCENT_TOKEN,
    region: regionValue || regionInYml || 'ap-guangzhou',
    debug: false,
  });

  const res = await client.getLogList({
    name: functionName,
    namespace: 'default',
    qualifier: '$LATEST',
  });

  cli.logOutputs(res);
};
