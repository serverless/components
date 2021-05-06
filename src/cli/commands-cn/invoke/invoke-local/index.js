'use strict';
const path = require('path');
const semver = require('semver');
const utils = require('../../utils');
const { readAndParseSync, fileExistsSync } = require('../../../utils');

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

const summaryOptions = (config, instanceYml) => {
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
  const { inputs = {}, component } = instanceYml;

  let eventData = {};
  let contextData = {};

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

  // Deal with scf component(single instance situation)
  if (component === 'scf') {
    const inputsHandler = inputs.handler || '';
    if (!inputsHandler) {
      throw new Error('请确保配置文件inputs中有handler字段配置');
    }

    const [handlerFile] = inputsHandler.split('.');
    let [, handlerFunc] = inputsHandler.split('.');

    if (f || invokedFunc) {
      handlerFunc = f || invokedFunc;
    }

    return [eventData, contextData, handlerFile, handlerFunc];
  }
  // TODO: deal with multi-instance component
  return [eventData, contextData];
};

const runNodeFrameworkProject = async (event, context, component) => {
  const { createServer, proxy } = require('tencent-serverless-http');

  let app;
  let server;
  const userSls =
    process.env.SLS_ENTRY_FILE && path.join(process.cwd(), process.env.SLS_ENTRY_FILE);
  if (fileExistsSync(userSls)) {
    console.log(`Using user custom entry file ${process.env.SLS_ENTRY_FILE}`);
    app = require(userSls);
  } else if (component === 'egg') {
    app = require(path.join(__dirname, 'sls-egg.js'));
  } else {
    app = require(path.join(process.cwd(), 'sls.js'));
  }

  // attach event and context to request
  try {
    app.request.__SLS_EVENT__ = event;
    app.request.__SLS_CONTEXT__ = context;
  } catch (e) {
    // no op
  }
  // provide sls intialize hooks
  if (app.slsInitialize && typeof app.slsInitialize === 'function') {
    await app.slsInitialize();
  }
  // cache server, not create repeatly
  if (!server) {
    if (component === 'express') {
      server = createServer(app, null, app.binaryTypes || []);
    } else {
      server = createServer(app.callback(), null, app.binaryTypes || []);
    }
  }

  context.callbackWaitsForEmptyEventLoop = app.callbackWaitsForEmptyEventLoop === true;

  const result = await proxy(server, event, context, 'PROMISE');
  return result.promise;
};

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

  const runtime = inputs.runtime;
  checkRuntime(runtime);

  const [eventData, contextData, handlerFile, handlerFunc] = summaryOptions(config, instanceYml);

  switch (runtime) {
    case 'Nodejs10.15':
    case 'Nodejs12.15': {
      if (component === 'scf') {
        const invokeFromFile = path.join(process.cwd(), handlerFile);
        const exportedVars = require(invokeFromFile);
        const finalInvokedFunc = exportedVars[handlerFunc];
        if (!finalInvokedFunc) {
          throw new Error(`调用的函数: ${handlerFunc} 不存在，请检查`);
        }
        try {
          const result = await finalInvokedFunc(eventData, contextData);
          cli.log(`本地调用结果: ${result}`);
        } catch (e) {
          throw new Error(`执行函数: ${finalInvokedFunc}出错: ${e.message}`);
        }
      } else {
        const res = await runNodeFrameworkProject(eventData, contextData, component);
        cli.log(`本地调用Nodejs框架: ${JSON.stringify(res)}`);
        process.exit();
      }

      break;
    }
    default:
      break;
  }
};
