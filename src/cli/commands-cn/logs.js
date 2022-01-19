'use strict';

const path = require('path');
const utils = require('./utils');
const { ServerlessSDK, utils: chinaUtils } = require('@serverless/platform-client-china');
const chalk = require('chalk');
const { generatePayload, storeLocally } = require('./telemtry');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { v4: uuidv4 } = require('uuid');
const { runningTemplate } = require('../utils');

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
 * --namespace / -n SCF namespace
 * --qualifier / -q SCF qualifier
 * --target target path
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
    namespace,
    n,
    qualifier,
    q,
  } = config;
  const stageValue = stage || s;
  const regionValue = region || r;
  const intervalValue = interval || i;
  const functionAlias = originalFunctionAlias || f;
  const namespaceValue = namespace || n;
  const qualifierValue = qualifier || q;
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
  let instanceDir = process.cwd();
  if (config.target) {
    instanceDir = path.join(instanceDir, config.target);
  }
  if (runningTemplate(instanceDir)) {
    cli.log(
      `Serverless: ${chalk.yellow('该命令暂不支持对多组件进行调用，请使用 --target 指定组件实例')}`
    );
    process.exit();
  }
  await utils.checkBasicConfigValidation(instanceDir);
  await utils.login(config);
  const instanceYaml = await utils.loadInstanceConfig(instanceDir, command);

  const orgUid = await chinaUtils.getOrgId();
  const telemtryData = await generatePayload({ command, rootConfig: instanceYaml, userId: orgUid });
  cli.logLogo();
  const meta = `Action: "logs" - Stage: "${instanceYaml.stage}" - App: "${instanceYaml.app}" - Name: "${instanceYaml.name}"`;
  cli.log(meta, 'grey');
  cli.log();

  const sdk = new ServerlessSDK({
    context: {
      orgName: instanceYaml.org,
      traceId: uuidv4(),
      orgUid,
    },
  });

  async function getLogList() {
    try {
      const options = {
        functionAlias,
        startTime: startTimeValue,
        stage: stageValue,
        region: regionValue,
        namespace: namespaceValue,
        qualifier: qualifierValue,
      };
      const logs = await sdk.getLogs(
        instanceYaml.org,
        instanceYaml.app,
        instanceYaml.stage,
        instanceYaml.name,
        options
      );
      await storeLocally(telemtryData);
      return logs;
    } catch (error) {
      if (!error.extraErrorInfo) {
        error.extraErrorInfo = {
          step: '日志获取',
        };
      } else {
        error.extraErrorInfo.step = '日志获取';
      }
      throw error;
    }
  }

  try {
    if (!tail && !t) {
      cli.sessionStart('正在获取日志');
      const res = await getLogList();
      if (res.length > 0) {
        printLogMessages(res, cli);
      } else {
        cli.log(chalk.gray('当前时间范围内没有可用的日志信息'));
      }
      cli.sessionStop('success', '获取日志成功');
    } else {
      cli.sessionStart('监听中');

      await new Promise((resolve, reject) => {
        // Stop polling when two errors happen in a row
        let lastLogList = [];
        let errorCount = 0;
        const logInterval = setInterval(async () => {
          let newLogList = [];
          try {
            newLogList = (await getLogList()) || [];
            errorCount = 0;
          } catch (error) {
            errorCount += 1;
            if (errorCount >= 2) {
              clearInterval(logInterval);
              reject(error);
            }
          }

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
          return 0;
        }, Number(intervalValue) || 2000);
      });
    }
  } catch (e) {
    telemtryData.outcome = 'failure';
    telemtryData.failure_reason = e.message;
    await storeLocally(telemtryData, e);
    throw e;
  }
};
