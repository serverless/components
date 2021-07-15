'use strict';

const path = require('path');
const { runningTemplate } = require('../../../utils');
const utils = require('../../utils');
const { readAndParseSync, fileExistsSync } = require('../../../utils');
const { colorLog, printOutput, summaryOptions, checkRuntime } = require('./utils');
const runPython = require('./runPython');
const { generatePayload, storeLocally } = require('../../telemtry');
const chalk = require('chalk');

module.exports = async (config, cli, command) => {
  const { config: ymlFilePath, c } = config;
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
  let instanceYml = await utils.loadInstanceConfig(instanceDir, command);
  const telemtryData = await generatePayload({ command: 'invoke_local', rootConfig: instanceYml });

  if (ymlFilePath || c) {
    const customizedConfigFile = ymlFilePath || c;

    if (!fileExistsSync(path.join(instanceDir, customizedConfigFile))) {
      await storeLocally({
        ...telemtryData,
        outcome: 'failure',
        failure_reason: '指定的yml文件不存在',
      });
      throw new Error('指定的yml文件不存在');
    }
    instanceYml = readAndParseSync(customizedConfigFile);
  }

  const { inputs = {}, component } = instanceYml;

  // Currently we only support local invoke for scf component
  if (!component.includes('scf')) {
    await storeLocally({
      ...telemtryData,
      outcome: 'failure',
      failure_reason: '当前命令只支持 SCF 组件，请在 SCF 组件目录内使用',
    });
    colorLog('当前命令只支持 SCF 组件，请在 SCF 组件目录内使用', 'yellow', cli);
  }

  try {
    const [eventData, contextData, handlerFile, handlerFunc] = summaryOptions(
      config,
      instanceYml,
      cli
    );

    const runtime = inputs.runtime;
    checkRuntime(runtime, cli);

    if (runtime.includes('Nodejs')) {
      const invokeFromFile = path.join(instanceDir, handlerFile);
      const exportedVars = require(invokeFromFile);
      const finalInvokedFunc = exportedVars[handlerFunc];
      if (!finalInvokedFunc) {
        colorLog(`调用的函数 ${handlerFunc} 不存在， 请检查后重试。`, 'yellow', cli);
      }
      try {
        const result = await finalInvokedFunc(eventData, contextData);
        printOutput(cli, result);
      } catch (e) {
        printOutput(cli, null, e);
      }
    }

    if (runtime.includes('Python')) {
      await runPython(eventData, contextData, handlerFile, handlerFunc, cli);
    }
  } catch (e) {
    await storeLocally({
      ...telemtryData,
      outcome: 'failure',
      failure_reason: e.message,
    });
    throw e;
  }

  await storeLocally({ ...telemtryData, outcome: 'success' });
};
