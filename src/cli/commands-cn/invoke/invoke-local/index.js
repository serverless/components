'use strict';

const path = require('path');
const utils = require('../../utils');
const { readAndParseSync, fileExistsSync } = require('../../../utils');
const { colorLog, printOutput, summaryOptions, checkRuntime } = require('./utils');
const runPython = require('./runPython');
const runPhp = require('./runPhp');
const { generatePayload, storeLocally } = require('../../telemtry');

module.exports = async (config, cli, command, instanceDir) => {
  const { config: ymlFilePath, c } = config;

  let instanceYml = await utils.loadInstanceConfig(instanceDir, command);
  const telemtryData = await generatePayload({ command: 'invoke_local', rootConfig: instanceYml });

  try {
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

      if (runtime.includes('Php')) {
        await runPhp(eventData, contextData, handlerFile, handlerFunc, cli);
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
  } catch (e) {
    await storeLocally({ ...telemtryData, outcome: 'failure', failure_reason: e.message });
    throw e;
  }
};
