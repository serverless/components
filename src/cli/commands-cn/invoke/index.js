'use strict';

const { FaaS } = require('@tencent-sdk/faas');
const fs = require('fs');
const utils = require('../utils');
const { isJson } = require('../../utils');
const invokeLocal = require('./invoke-local');
const chalk = require('chalk');
const { inspect } = require('util');

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
  let dataValue = data || d;
  const pathValue = path || p;

  if (dataValue && pathValue) {
    cli.log(`Serverless: ${chalk.yellow('不能同时指定 data 与 path, 请检查后重试')}`);
    process.exit();
  }

  if (path || p) {
    try {
      dataValue = fs.readFileSync(pathValue, 'utf8');
    } catch (e) {
      cli.log(`Serverless: ${chalk.yellow('找不到指定的路径文件, 请检查后重试')}`);
      process.exit();
    }
  }

  if (dataValue && !isJson(dataValue)) {
    cli.log(`Serverless: ${chalk.yellow('传入的 data 不是序列化 JSON, 请检查后重试')}`);
    process.exit();
  }

  await utils.login(config);
  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
  const regionInYml = instanceYaml && instanceYaml.inputs && instanceYaml.inputs.region;
  const componentType = instanceYaml && instanceYaml.component;

  if (componentType !== 'scf') {
    cli.log(`Serverless: ${chalk.yellow('Inovke 命令仅能在 SCF 组件目录中调用')}`);
    process.exit();
  }

  let functionName;
  if (instanceYaml && instanceYaml.inputs && instanceYaml.inputs.name) {
    functionName = instanceYaml.inputs.name.trim();
    functionName = functionName.replace('${name}', instanceYaml.name);
    functionName = functionName.replace('${app}', instanceYaml.app);
    if (typeof functionName === 'string' && !functionName.includes('${stage}') && stageValue) {
      cli.log(
        `Serverless: ${chalk.yellow(
          '当前应用自定义 SCF 实例名称无法指定 stage 信息, 请检查后重试'
        )}`
      );
      process.exit();
    }
    functionName = functionName.replace('${stage}', stageValue || instanceYaml.stage);
    if (functionName.match(/\${(\w*:?[\w\d.-]+)}/g)) {
      cli.log(`Serverless: ${chalk.yellow('目前 inputs.name 只支持 stage, name, app 三种变量')}`);
      process.exit();
    }
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

  try {
    const res = await client.invoke({
      name: functionName,
      namespace: 'default',
      qualifier: '$LATEST',
      event: JSON.parse(dataValue || '{}'),
    });

    if (res.retMsg) {
      const retMsg = res.retMsg;
      delete res.retMsg;
      cli.logOutputs(res);
      cli.log('---------------------------------------------');
      cli.log(`Serverless: ${chalk.green('调用成功')}`);
      cli.log();
      try {
        const retJson = JSON.parse(retMsg);
        cli.log(inspect(retJson, { depth: Infinity, colors: true, compact: 0 }));
      } catch (error) {
        cli.log(retMsg);
      }
    } else {
      cli.logOutputs(res);
    }
  } catch (error) {
    if (error.code === '1001') {
      cli.log(
        `Serverless: ${chalk.yellow(
          '无法找到指定 SCF 实例，请检查 SCF 实例名称和 Stage / Region 信息或重新部署后调用'
        )}`
      );
      process.exit();
    } else {
      throw error;
    }
  }

  return 0;
};
