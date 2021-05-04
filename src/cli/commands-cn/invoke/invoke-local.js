'use strict';
const path = require('path');
const semver = require('semver');
const utils = require('../utils');
const { readAndParseSync, fileExistsSync } = require('../../utils');

const checkRuntime = (requiredRuntime) => {
  if (!requiredRuntime) {
    throw new Error('必须指定所需要的运行时');
  }

  if (requiredRuntime.includes('Nodejs')) {
    const { node } = process.versions;
    if (!node) {
      throw new Error('当前环境没有Nodejs运行时，请先安装');
    }
    const requiredMajorVer = requiredRuntime.split('.')[0].slice(6) - 0;
    const currentMajorVer = semver.parse(node).major;

    if (currentMajorVer < requiredMajorVer) {
      throw new Error(
        `当前Nodejs版本为: ${node}, 所需的版本为: ${requiredRuntime}, 请安装使用至少major版本号一致的Node运行时`
      );
    }
  } else {
    throw new Error('当前仅支持本地调试Nodejs运行时项目');
  }
};

module.exports = async (config, cli, command) => {
  const subCommand = config.params[0];
  const { config: ymlFilePath, c } = config;
  let instanceYml = await utils.loadInstanceConfig(process.cwd(), command);

  if (ymlFilePath || c) {
    const customizedConfigFile = ymlFilePath || c;

    if (!fileExistsSync(path.join(process.cwd(), customizedConfigFile))) {
      throw new Error('指定的yml文件不存在');
    }
    instanceYml = readAndParseSync(customizedConfigFile);
  }

  if (subCommand === 'local') {
    const {
      f,
      function: invokedFunc,
      data,
      d,
      path: eventDataPath,
      p,
      context,
      contextPath,
      x,
    } = config;
    let eventData = {};
    let contextData = {};

    const { inputs = {}, component } = instanceYml;

    if (component !== 'scf') {
      throw new Error('当前只支持scf component的本地调试');
    }

    const runtime = inputs.runtime;
    checkRuntime(runtime);

    const inputsHandler = inputs.handler || '';
    if (!inputsHandler) {
      throw new Error('请确保配置文件inputs中有handler字段配置');
    }

    const [handlerFile] = inputsHandler.split('.');
    let [, handlerFunc] = inputsHandler.split('.');

    if (f || invokedFunc) {
      handlerFunc = f || invokedFunc;
    }

    // parse event data from cli
    if (data || d) {
      try {
        eventData = JSON.parse(data || d);
      } catch (e) {
        throw new Error(`输入的: ${data || d} 无法正确的反序列化成JSON对象，请检查`);
      }
    } else if (eventDataPath || p) {
      eventData = require(path.join(process.cwd(), eventDataPath || p));
    }

    // parse context data from cli
    if (context) {
      try {
        contextData = JSON.parse(context);
      } catch (e) {
        throw new Error(`输入的: ${context} 无法正确的反序列化成JSON对象，请检查`);
      }
    } else if (contextPath || x) {
      contextData = require(path.join(process.cwd(), contextPath || x));
    }

    // Set user's customized env variables to process.env: --env or -e
    if (config.env || config.e) {
      const userEnv = config.env || config.e;
      const envs = Array.isArray(userEnv) ? userEnv : [userEnv];
      envs.forEach((item) => {
        const [k, v] = item.split('=');
        process.env[k] = v;
      });
    }

    // Set env vars from instance config file
    if (inputs.environment && inputs.environment.variables) {
      for (const [k, v] of Object.entries(inputs.environment.variables)) {
        process.env[k] = v;
      }
    }

    switch (runtime) {
      case 'Nodejs10.15':
      case 'Nodejs12.15': {
        const invokeFromFile = path.join(process.cwd(), handlerFile);
        const exportedVars = require(invokeFromFile);
        const finalInvokedFunc = exportedVars[handlerFunc];
        if (!finalInvokedFunc) {
          throw new Error(`调用的函数: ${handlerFunc} 不存在，请检查`);
        }
        try {
          const result = await finalInvokedFunc(eventData, contextData);
          cli.log(result);
        } catch (e) {
          throw new Error(`执行函数: ${finalInvokedFunc}出错: ${e.message}`);
        }

        break;
      }
      default:
        break;
    }
  }
};