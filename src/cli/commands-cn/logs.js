'use strict';

const { FaaS } = require('@tencent-sdk/faas');
const utils = require('./utils');
const moment = require('moment');

/**
 * --function /-f Set function name
 * --stage / -s Set stage
 * --region / -r Set region
 * --startTime Set log start time
 * --tail Stream new logs
 * --interval poll interval
 */
module.exports = async (config, cli, command) => {
  // Parse commands
  const {
    function: functionName,
    f,
    stage,
    s,
    region,
    r,
    startTime,
    tail,
    t,
    interval,
    i,
  } = config;
  const stageValue = stage || s;
  const regionValue = region || r;
  const intervalValue = interval || i;
  const functionNameValue = functionName || f;
  let startTimeValue;
  if (startTime) {
    const since = ['m', 'h', 'd'].indexOf(startTime[startTime.length - 1]) !== -1;
    if (since) {
      startTimeValue = moment()
        .subtract(startTime.replace(/\D/g, ''), startTime.replace(/\d/g, ''))
        .format('YYYY-MM-DD HH:MM:SS');
    } else {
      startTimeValue = moment.utc(startTime).format('YYYY-MM-DD HH:MM:SS');
    }
  } else {
    startTimeValue = moment().subtract(10, 'm').format('YYYY-MM-DD HH:MM:SS');
    if (tail) {
      startTimeValue = moment().subtract(10, 's').format('YYYY-MM-DD HH:MM:SS');
    }
  }

  // Parse YML
  const instanceDir = process.cwd();
  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
  const regionInYml = instanceYaml && instanceYaml.inputs && instanceYaml.inputs.region;

  cli.logLogo();
  const meta = `Action: "logs" - Stage: "${instanceYaml.stage}" - App: "${instanceYaml.app}" - Name: "${instanceYaml.name}"`;
  cli.log(meta, 'grey');
  cli.log();

  // Get function name
  let finalFunctionName;
  if (functionNameValue) {
    finalFunctionName = functionNameValue;
  } else if (instanceYaml && instanceYaml.inputs && instanceYaml.inputs.name) {
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
    const currentLogList =
      (await client.getLogList({
        name: finalFunctionName,
        namespace: 'default',
        qualifier: '$LATEST',
      })) || [];
    currentLogList.reverse();

    let latestLogReqId;
    if (currentLogList && currentLogList.length > 0) {
      cli.logOutputs(currentLogList);
      latestLogReqId = currentLogList.pop().requestId;
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

      if (newLogList && newLogList.length > 0 && !latestLogReqId) {
        cli.logOutputs(newLogList);
        latestLogReqId = newLogList.pop().requestId;
      }

      if (newLogList && newLogList.length > 0 && latestLogReqId) {
        const newLogPosition = newLogList.findIndex((item) => item.requestId === latestLogReqId);
        if (newLogPosition === -1) {
          cli.logOutputs(newLogList);
        } else if (newLogPosition < newLogList.length - 1) {
          cli.logOutputs(newLogList.slice(newLogPosition + 1));
        }
        latestLogReqId = newLogList.pop().requestId;
      }
    }, Number(intervalValue) || 3000);
  }
};
