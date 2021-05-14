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
  const instanceDir = process.cwd();
  await utils.checkBasicConfigValidation(instanceDir);

  const subCommand = config.params[0];

  if (subCommand === 'local') {
    return invokeLocal(config, cli, command);
  }

  const { stage, s, region, r, data, d, path, p } = config;
  const stageValue = stage || s;
  const regionValue = region || r;
  let dataValue = data || d || '{}';
  const pathValue = path || p;

  if (dataValue && pathValue) {
    throw new Error('不能同时指定 data 与 path, 请检查后重试');
  }

  if (path || p) {
    try {
      dataValue = fs.readFileSync(pathValue, 'utf8');
    } catch (e) {
      throw new Error('找不到指定的路径文件, 请检查后重试');
    }
  }

  if (dataValue && !isJson(dataValue)) {
    throw new Error('传入的 data 不是序列化 JSON, 请检查后重试');
  }

  await utils.login(config);
  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
  const regionInYml = instanceYaml && instanceYaml.inputs && instanceYaml.inputs.region;
  const componentType = instanceYaml && instanceYaml.component;

  if (componentType !== 'scf') {
    throw new Error('Inovke 仅能在函数组件目录中调用, 请检查目录后重试');
  }

  let functionName;
  if (instanceYaml && instanceYaml.inputs && instanceYaml.inputs.name) {
    functionName = instanceYaml.inputs.name.trim();
    functionName = functionName.replace('${name}', instanceYaml.name);
    functionName = functionName.replace('${app}', instanceYaml.app);
    if (!functionName.match('${stage}') && stageValue) {
      throw new Error('当前应用自定义SCF实例名称无法指定 stage 信息, 请检查后重试');
    }
    functionName = functionName.replace('${stage}', stageValue || instanceYaml.stage);
    if (functionName.match(/\${(\w*:?[\w\d.-]+)}/g)) {
      throw new Error('目前 inputs.name 只支持 stage, name, app 三种变量');
    }
  } else {
    functionName = `${instanceYaml.name}-${stageValue || instanceYaml.stage}-${
      instanceYaml.app
    }`;
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

  cli.logOutputs(res);
};
