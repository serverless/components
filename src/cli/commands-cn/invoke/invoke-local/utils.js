'use strict';

const path = require('path');
const { inspect } = require('util');
const semver = require('semver');
const { fileExistsSync } = require('../../../utils');
const chalk = require('chalk');
const { execSync } = require('child_process');

const checkRuntime = (requiredRuntime, cli) => {
  if (!requiredRuntime) {
    throw new Error('必须指定所需要的运行时');
  }

  if (requiredRuntime.includes('Nodejs')) {
    const { node } = process.versions;
    if (!node) {
      throw new Error('当前环境没有Nodejs运行时，请先安装');
    }
    const requiredMajorVer = requiredRuntime.split('.')[0].slice(6) - 0;
    const requiredMinorVer = requiredRuntime.split('.')[1] - 0;
    const currentMajorVer = semver.parse(node).major;
    const currentMinorVer = semver.parse(node).minor;

    if (currentMajorVer !== requiredMajorVer || currentMinorVer !== requiredMinorVer) {
      cli.log(
        `当前系统Node版本为 ${node}, 项目指定的版本为 ${requiredRuntime}, 建议使用相同版本进行测试。\n`
      );
    }
  } else if (requiredRuntime.includes('Python')) {
    let pythonInfo;
    try {
      pythonInfo = execSync(
        `${
          process.env.INVOKE_LOCAL_PYTHON || 'python'
        } -c "import platform; print(platform.python_version())"`
      );
      pythonInfo = Buffer.from(pythonInfo).toString();
    } catch (e) {
      throw new Error(`检查当前环境的Python 运行时出错，错误信息: ${e.message}`);
    }
    const requiredMajorVer = requiredRuntime.split('Python')[1].split('.')[0];
    const requiredMinorVer = requiredRuntime.split('Python')[1].split('.')[1];
    const currentMajorVer = pythonInfo.split(' ')[0].split('.')[0];
    const currentMinorVer = pythonInfo.split(' ')[0].split('.')[1];

    if (currentMajorVer !== requiredMajorVer || currentMinorVer !== requiredMinorVer) {
      cli.log(
        `当前系统Python版本为 ${pythonInfo
          .split(' ')[0]
          .replace('\n', '')}, 项目指定的版本为 ${requiredRuntime}, 建议使用相同版本进行测试。\n`
      );
    }
  } else {
    colorLog('当前命令只支持 Node.js 和 Python 运行时，其他运行时暂不支持。', 'yellow', cli);
  }
};

const summaryOptions = (config, instanceYml, cli) => {
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
    py,
  } = config;
  const { inputs = {}, component } = instanceYml;

  let eventData = {};
  let contextData = {};

  // parse event data from cli
  if ((data || d) && (eventDataPath || p)) {
    colorLog('不能同时指定 data 与 path，请检查后重试。', 'yellow', cli);
  }
  if (data || d) {
    try {
      eventData = JSON.parse(data || d);
    } catch (e) {
      colorLog('事件参数(event)数据格式错误，请检查后重试。', 'yellow', cli);
    }
  } else if (eventDataPath || p) {
    const pPath = path.join(process.cwd(), eventDataPath || p);
    if (!fileExistsSync(pPath)) {
      colorLog(`找不到指定的路径文件 ${pPath}，请检查后重试`, 'yellow', cli);
    }

    eventData = require(pPath);
  }

  // parse context data from cli
  if (context && (contextPath || x)) {
    colorLog('不能同时指定 context 与 contextPath，请检查后重试。', 'yellow', cli);
  }
  if (context) {
    try {
      contextData = JSON.parse(context);
    } catch (e) {
      colorLog('环境参数(context)参数数据格式错误，请检查后重试。', 'yellow', cli);
    }
  } else if (contextPath || x) {
    const pPath = path.join(process.cwd(), eventDataPath || p);
    if (!fileExistsSync(pPath)) {
      colorLog(`找不到指定的路径文件 ${pPath}，请检查后重试`, 'yellow', cli);
    }
    contextData = require(pPath);
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

  // For python runtime, users can set python execution by --py: sls invoke local --python python3
  if (py) {
    process.env.INVOKE_LOCAL_PYTHON = py;
  }

  // Deal with scf component(single instance situation)
  if (component.includes('scf')) {
    const inputsHandler = inputs.handler || '';
    if (!inputsHandler) {
      colorLog('调用函数未指定，请检查 serverless.yml 中的 hanlder 配置后重试。', 'yellow', cli);
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
  } else if (fileExistsSync(path.join(__dirname, `sls-${component}.js`))) {
    app = require(path.join(__dirname, `sls-${component}.js`));
  } else {
    try {
      app = require(path.join(process.cwd(), 'sls.js'));
    } catch (e) {
      throw new Error('找不到框架入口文件');
    }
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

const colorLog = (msg, color = 'green', cli = console) => {
  const logMsg = `Serverless: ${chalk[color](`${msg}`)}\n`;

  if (cli && cli.log) {
    cli.log(logMsg);
  }

  // when display a warning message, need to stop the process
  if (color === 'yellow') {
    process.exit();
  }
};

const handleError = (err) => {
  let errorResult;
  if (err instanceof Error) {
    errorResult = {
      errorMessage: err.message,
      errorType: err.constructor.name,
      stackTrace: err.stack && err.stack.split('\n'),
    };
  } else {
    errorResult = {
      errorMessage: err,
    };
  }
  console.log(chalk.red(JSON.stringify(errorResult, null, 4)));
};

const printOutput = (cli, res = {}, err = null) => {
  cli.log('---------------------------------------------');
  if (err) {
    colorLog('调用错误', 'red', cli);
    handleError(err);
  } else {
    colorLog('调用成功', 'green', cli);
    cli.log(inspect(res, { depth: Infinity, colors: true, compact: 0 }));
  }
  cli.log();
};

module.exports = {
  checkRuntime,
  summaryOptions,
  runNodeFrameworkProject,
  colorLog,
  handleError,
  printOutput,
};
