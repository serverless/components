'use strict';

const fs = require('fs');
const utils = require('../utils');
const { isJson } = require('../../utils');
const { ServerlessSDK, utils: chinaUtils } = require('@serverless/platform-client-china');
const invokeLocal = require('./invoke-local');
const { generatePayload, storeLocally } = require('../telemtry');
const chalk = require('chalk');
const { inspect } = require('util');
const { v4: uuidv4 } = require('uuid');

/**
 * --stage / -s Set stage
 * --region / -r Set region
 * --data / -d Data sent to SCF
 * --path / -p Data path sent to SCF
 * --function / -f function alias
 */
module.exports = async (config, cli, command) => {
  const instanceDir = process.cwd();
  await utils.checkBasicConfigValidation(instanceDir);

  const subCommand = config.params[0];

  if (subCommand === 'local') {
    return invokeLocal(config, cli, command);
  }

  const { stage, s, region, r, data, d, path, p, function: originalFunctionAlias, f } = config;
  const stageValue = stage || s;
  const regionValue = region || r;
  let dataValue = data || d;
  const pathValue = path || p;
  const functionAlias = originalFunctionAlias || f;

  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
  const telemtryData = await generatePayload({ command, rootConfig: instanceYaml });

  if (dataValue && pathValue) {
    cli.log(`Serverless: ${chalk.yellow('不能同时指定 data 与 path, 请检查后重试')}`);

    await storeLocally({
      ...telemtryData,
      outcome: 'failure',
      failure_reason: '不能同时指定 data 与 path, 请检查后重试',
    });
    process.exit();
  }

  if (path || p) {
    try {
      dataValue = fs.readFileSync(pathValue, 'utf8');
    } catch (e) {
      cli.log(`Serverless: ${chalk.yellow('找不到指定的路径文件, 请检查后重试')}`);

      await storeLocally({
        ...telemtryData,
        outcome: 'failure',
        failure_reason: '找不到指定的路径文件, 请检查后重试',
      });
      process.exit();
    }
  }

  if (dataValue && !isJson(dataValue)) {
    cli.log(`Serverless: ${chalk.yellow('传入的 data 不是序列化 JSON, 请检查后重试')}`);

    await storeLocally({
      ...telemtryData,
      outcome: 'failure',
      failure_reason: '传入的 data 不是序列化 JSON, 请检查后重试',
    });
    process.exit();
  }

  await utils.login(config);
  const componentType = instanceYaml && instanceYaml.component;

  const orgUid = await chinaUtils.getOrgId();
  telemtryData.user_uid = orgUid;

  if (!componentType.startsWith('scf') && !componentType.startsWith('multi-scf')) {
    cli.log(`Serverless: ${chalk.yellow('Inovke 命令仅能在 scf 或者 multi-scf 组件目录中调用')}`);

    await storeLocally({
      ...telemtryData,
      outcome: 'failure',
      failure_reason: 'Inovke 命令仅能在 scf 或者 multi-scf 组件目录中调用',
    });
    process.exit();
  }

  const sdk = new ServerlessSDK({
    context: {
      orgName: instanceYaml.org,
      traceId: uuidv4(),
      orgUid,
    },
  });

  try {
    const options = {
      functionAlias,
      stage: stageValue,
      region: regionValue,
      event: JSON.parse(dataValue || '{}'),
    };
    const res = await sdk.invoke(
      instanceYaml.org,
      instanceYaml.app,
      instanceYaml.stage,
      instanceYaml.name,
      options
    );

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
    await storeLocally({
      ...telemtryData,
      outcome: 'failure',
      failure_reason: error.message,
    });
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

  await storeLocally({
    ...telemtryData,
    outcome: 'success',
  });
  return 0;
};
