'use strict';

const { FaaS } = require('@tencent-sdk/faas');
const utils = require('./utils');
const chalk = require('chalk');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone); // dependent on utc plugin
dayjs.extend(relativeTime);

function printLogMessages(logList, cli) {
  cli.log(logList.map((item) => item.message).join('\n'));
}

/**
 * --stage / -s Set stage
 * --region / -r Set region
 * --startTime Set log start time
 * --tail / -t Stream new logs
 * --interval / -i poll interval
 * --function / -f function alias
 */
module.exports = async (config, cli, command) => {
  // Parse commands
  const {
    stage,
    s,
    region,
    r,
    startTime,
    tail,
    t,
    interval,
    i,
    function: originalFunctionAlias,
    f,
  } = config;
  const stageValue = stage || s;
  const regionValue = region || r;
  const intervalValue = interval || i;
  const functionAlias = originalFunctionAlias || f;
  let startTimeValue;

  if (startTime) {
    const since = ['m', 'h', 'd'].indexOf(startTime[startTime.length - 1]) !== -1;
    if (since) {
      startTimeValue = dayjs()
        .subtract(startTime.replace(/\D/g, ''), startTime.replace(/\d/g, ''))
        .tz('Asia/Shanghai')
        .format('YYYY-MM-DD HH:mm:ss');
    } else if (!dayjs(startTime).isValid()) {
      cli.log(`Serverless: ${chalk.yellow('指定时间格式不正确，请检查后重试')}`);
      process.exit();
    } else {
      startTimeValue = dayjs(startTime).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
    }
  } else {
    startTimeValue = dayjs().subtract(10, 'm').tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
    if (tail) {
      startTimeValue = dayjs().subtract(1, 'm').tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
    }
  }

  // Parse YML
  const instanceDir = process.cwd();
  await utils.checkBasicConfigValidation(instanceDir);
  await utils.login(config);
  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);
  const regionInYml = instanceYaml && instanceYaml.inputs && instanceYaml.inputs.region;
  const componentType = instanceYaml && instanceYaml.component;

  cli.logLogo();
  const meta = `Action: "logs" - Stage: "${instanceYaml.stage}" - App: "${instanceYaml.app}" - Name: "${instanceYaml.name}"`;
  cli.log(meta, 'grey');
  cli.log();

  // Get function name
  let finalFunctionName;
  try {
    if (componentType.startsWith('multi-scf')) {
      finalFunctionName = utils.getFunctionNameOfMultiScf(instanceYaml, stageValue, functionAlias);
    } else {
      finalFunctionName = utils.getFunctionName(instanceYaml, stageValue);
    }
  } catch (error) {
    cli.log(`Serverless: ${chalk.yellow(error.message)}`);
    process.exit();
  }

  const client = new FaaS({
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
    token: process.env.TENCENT_TOKEN,
    region: regionValue || regionInYml || 'ap-guangzhou',
    debug: false,
  });

  async function getLogList(name, theStartTime) {
    try {
      const res =
        (await client.getLogList({
          name,
          startTime: theStartTime,
          namespace: 'default',
          qualifier: '$LATEST',
        })) || [];
      return res.reverse();
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
  }

  if (!tail && !t) {
    cli.sessionStart('正在获取日志');
    const res = await getLogList(finalFunctionName, startTimeValue);
    if (res.length > 0) {
      printLogMessages(res, cli);
    } else {
      cli.log(chalk.gray('当前时间范围内没有可用的日志信息'));
    }
    cli.sessionStop('success', '获取日志成功');
  } else {
    let lastLogList = await getLogList(finalFunctionName, startTimeValue);

    if (lastLogList.length > 0) {
      printLogMessages(lastLogList, cli);
    }

    cli.sessionStart('监听中');
    setInterval(async () => {
      const newLogList = await getLogList(finalFunctionName, null);

      if (newLogList.length > 0 && lastLogList.length <= 0) {
        printLogMessages(newLogList, cli);
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
            printLogMessages(newLogList, cli);
          } else if (lastLogIndexInNewLogs < newLogList.length - 1) {
            printLogMessages(newLogList.slice(lastLogIndexInNewLogs + 1), cli);
          }
          lastLogList = newLogList;
        }
      }
    }, Number(intervalValue) || 2000);
  }
};
