'use strict';

const path = require('path');

const utils = require('../../utils');
const { readAndParseSync, fileExistsSync } = require('../../../utils');
const { colorLog, printOutput, summaryOptions, checkRuntime } = require('./utils');
const runPython = require('./runPython');

module.exports = async (config, cli, command) => {
  const { config: ymlFilePath, c } = config;
  let instanceYml = await utils.loadInstanceConfig(process.cwd(), command);

  if (ymlFilePath || c) {
    const customizedConfigFile = ymlFilePath || c;

    if (!fileExistsSync(path.join(process.cwd(), customizedConfigFile))) {
      throw new Error('指定的yml文件不存在');
    }
    instanceYml = readAndParseSync(customizedConfigFile);
  }

  const { inputs = {}, component } = instanceYml;

  // Currently we only support local invoke for scf component
  if (!component.includes('scf')) {
    colorLog('当前命令只支持 SCF 组件，请在 SCF 组件目录内使用', 'yellow', cli);
  }

  const [eventData, contextData, handlerFile, handlerFunc] = summaryOptions(
    config,
    instanceYml,
    cli
  );

  const runtime = inputs.runtime;
  checkRuntime(runtime, cli);

  if (runtime.includes('Nodejs')) {
    const invokeFromFile = path.join(process.cwd(), handlerFile);
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
};
