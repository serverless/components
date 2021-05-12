'use strict';

const path = require('path');
const jsome = require('jsome');

const utils = require('../../utils');
const { readAndParseSync, fileExistsSync } = require('../../../utils');
const {
  colorLog,
  handleError,
  summaryOptions,
  runNodeFrameworkProject,
  checkRuntime,
} = require('./utils');

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

  const runtime = inputs.runtime;
  checkRuntime(runtime, cli);

  const [eventData, contextData, handlerFile, handlerFunc] = summaryOptions(
    config,
    instanceYml,
    cli
  );

  if (runtime.includes('Nodejs')) {
    if (component.includes('scf')) {
      const invokeFromFile = path.join(process.cwd(), handlerFile);
      const exportedVars = require(invokeFromFile);
      const finalInvokedFunc = exportedVars[handlerFunc];
      if (!finalInvokedFunc) {
        colorLog(`调用的函数 ${handlerFunc} 不存在， 请检查后重试。`, 'yellow', cli);
      }
      try {
        const result = await finalInvokedFunc(eventData, contextData);
        cli.log('---------------------------------------------');
        colorLog('调用成功', 'green', cli);
        jsome(result);
        cli.log();
      } catch (e) {
        cli.log('---------------------------------------------');
        colorLog('调用错误\n', 'red', cli);
        handleError(e);
        cli.log();
      }
    } else {
      const result = await runNodeFrameworkProject(eventData, contextData, component);
      cli.log('\n------------------');
      cli.log(`本地调用Nodejs框架 ${component} 结果:\n`);
      jsome(result);
    }
  }
};
