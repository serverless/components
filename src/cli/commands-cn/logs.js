'use strict';

const { FaaS } = require('@tencent-sdk/faas');
const utils = require('./utils');
const moment = require('moment');

/**
 * --stage / -s Set stage
 * --region / -r Set region
 * --startTime Set log start time
 * --tail / -t Stream new logs
 * --interval / -i poll interval
 */
module.exports = async (config, cli, command) => {
  // Parse commands
  const { stage, s, region, r, startTime, tail, t, interval, i } = config;
  const stageValue = stage || s;
  const regionValue = region || r;
  const intervalValue = interval || i;
  let startTimeValue;

  if (startTime) {
    const since = ['m', 'h', 'd'].indexOf(startTime[startTime.length - 1]) !== -1;
    if (since) {
      startTimeValue = moment()
        .subtract(startTime.replace(/\D/g, ''), startTime.replace(/\d/g, ''))
        .format('YYYY-MM-DD HH:mm:ss');
    } else {
      startTimeValue = moment.utc(startTime).format('YYYY-MM-DD HH:mm:ss');
    }
  } else {
    startTimeValue = moment().subtract(10, 'm').format('YYYY-MM-DD HH:mm:ss');
    if (tail) {
      startTimeValue = moment().subtract(1, 'm').format('YYYY-MM-DD HH:mm:ss');
    }
  }

  // Parse YML
  const instanceDir = process.cwd();
  await utils.checkBasicConfigValidation(instanceDir);
  await utils.login(config);
  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
  const regionInYml = instanceYaml && instanceYaml.inputs && instanceYaml.inputs.region;

  cli.logLogo();
  const meta = `Action: "logs" - Stage: "${instanceYaml.stage}" - App: "${instanceYaml.app}" - Name: "${instanceYaml.name}"`;
  cli.log(meta, 'grey');
  cli.log();

  // Get function name
  let finalFunctionName;
  if (instanceYaml && instanceYaml.inputs && instanceYaml.inputs.name) {
    finalFunctionName = instanceYaml.inputs.name.trim();
    finalFunctionName = finalFunctionName.replace('${name}', instanceYaml.name);
    finalFunctionName = finalFunctionName.replace('${app}', instanceYaml.app);
    if (!finalFunctionName.match('${stage}') && stageValue) {
      throw new Error('当前应用自定义SCF实例名称无法指定 stage 信息，请检查后重试');
    }
    finalFunctionName = finalFunctionName.replace('${stage}', stageValue || instanceYaml.stage);
    if (finalFunctionName.match(/\${(\w*:?[\w\d.-]+)}/g)) {
      throw new Error('目前 inputs.name 只支持 stage, name, app 三种变量');
    }
  } else {
    finalFunctionName = `${instanceYaml.name}-${stageValue || instanceYaml.stage}-${
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

  if (!tail && !t) {
    cli.sessionStart('正在获取日志');
    const res =
      (await client.getLogList({
        name: finalFunctionName,
        namespace: 'default',
        qualifier: '$LATEST',
        startTime: startTimeValue,
      })) || [];

    if (res.length > 0) cli.logOutputs(res.reverse());
    cli.sessionStop('success', '获取日志成功');
  } else {
    let lastLogList =
      (await client.getLogList({
        name: finalFunctionName,
        namespace: 'default',
        qualifier: '$LATEST',
        startTime: startTimeValue,
      })) || [];
    lastLogList.reverse();

    if (lastLogList.length > 0) {
      cli.logOutputs(lastLogList);
    }

    cli.sessionStart('监听中');
    setInterval(async () => {
      const newLogList =
        (await client.getLogList({
          name: finalFunctionName,
          namespace: 'default',
          qualifier: '$LATEST',
        })) || [];

      newLogList.reverse();

      if (newLogList.length > 0 && lastLogList.length <= 0) {
        cli.logOutputs(newLogList);
        lastLogList = newLogList;
      }

      if (newLogList.length > 0 && lastLogList.length > 0) {
        const lastLogReqId = lastLogList[lastLogList.length - 1].requestId;
        const newLogReqId = newLogList[newLogList.length - 1].requestId;

        const newestLogIndexInOldLogs = lastLogList.findIndex(
          (item) => item.requestId === newLogReqId
        );
        const lastLogIndexInNewLogs = newLogList.findIndex(
          (item) => item.requestId === lastLogReqId
        );

        // When newestLogIndexInOldLogs !== -1, it means newest log already exists in the old log list
        // Note: tencent log API has a cache mechanism, sometimes newly fetched log may not conataining newst log
        if (newestLogIndexInOldLogs === -1) {
          if (lastLogIndexInNewLogs === -1) {
            cli.logOutputs(newLogList);
          } else if (lastLogIndexInNewLogs < newLogList.length - 1) {
            cli.logOutputs(newLogList.slice(lastLogIndexInNewLogs + 1));
          }
          lastLogList = newLogList;
        }
      }
    }, Number(intervalValue) || 3000);
  }
};
