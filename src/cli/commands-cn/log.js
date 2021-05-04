'use strict'

const { FaaS } = require('@tencent-sdk/faas');
const utils = require('./utils');

/**
 * --stage / -s Set stage
 * --region / -r Set region
 * --startTime Set log start time
 * --endTime Set log start time
 * --tail Stream new logs
 */
module.exports = async (config, cli, command) => {

  cli.logLogo();
  cli.log();

  const { stage, s, region, r, startTime, endTime, tail } = config;
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

  if (!tail) {
    const res =
      (await client.getLogList({
        name: functionName,
        namespace: 'default',
        qualifier: '$LATEST',
        startTime,
        endTime,
      })) || [];

    cli.logOutputs(res.reverse());
  } else {
    const currentLogList =
      (await client.getLogList({
        name: functionName,
        namespace: 'default',
        qualifier: '$LATEST',
      })) || [];
    currentLogList.reverse();

    let latestLogReqId;
    if (currentLogList && currentLogList.length > 0) {
      cli.logOutputs(currentLogList);
      latestLogReqId = currentLogList.pop().requestId;
    }

    setInterval(async () => {
      const newLogList =
        (await client.getLogList({
          name: functionName,
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
    }, 3000);
  }
};
