'use strict';

const { FaaS } = require('@tencent-sdk/faas');
const fs = require('fs');
const utils = require('../utils');
const { isJson } = require('../../utils');
const invokeLocal = require('./invoke-local');

/**
 * --stage / -s Set stage
 * --region / -r Set region
 * --data / -d Data sent to SCF
 * --path / -p Data path sent to SCF
 */
module.exports = async (config, cli, command) => {
  const subCommand = config.params[0];

  if (subCommand === 'local') {
    invokeLocal(config, cli, command);
    return;
  }

  const { stage, s, region, r, data, d, path, p } = config;
  const stageValue = stage || s;
  const regionValue = region || r;
  let dataValue = data || d || '{}';
  const pathValue = path || p;
  if (path || p) {
    try {
      dataValue = fs.readFileSync(pathValue, 'utf8');
    } catch (e) {
      throw new Error('找不到指定 JSON 文件');
    }
  }

  if (dataValue && !isJson(dataValue)) {
    throw new Error('传入的 data 不是序列化 JSON');
  }

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

  const res = await client.invoke({
    name: functionName,
    namespace: 'default',
    qualifier: '$LATEST',
    event: JSON.parse(dataValue),
  });

  cli.log(res);
};
