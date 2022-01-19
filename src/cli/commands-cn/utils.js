'use strict';

/*
 * Serverless Components: Utilities
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const chalk = require('chalk');
const { v1: uuidv1 } = require('uuid');
const args = require('minimist')(process.argv.slice(2));
const { utils: platformUtils } = require('@serverless/platform-client-china');
const {
  writeJsonToCredentials,
  loadCredentialsToJson,
  loadInstanceConfig,
  resolveVariables,
  parseCliInputs,
  fileExists,
} = require('../utils');
const { mergeDeepRight } = require('ramda');
const YAML = require('js-yaml');
const fse = require('fs-extra');
const inquirer = require('@serverless/utils/inquirer');

const updateEnvFile = (envs) => {
  // write env file
  const envFilePath = path.join(process.cwd(), '.env');

  let envFileContent = '';
  if (fs.existsSync(envFilePath)) {
    envFileContent = fs.readFileSync(envFilePath, 'utf8');
  }

  // update process.env and existing key in .env file
  for (const [key, value] of Object.entries(envs)) {
    process.env[key] = value;
    const regex = new RegExp(`${key}=[^\n]+(\n|$)`);
    envFileContent = envFileContent.replace(regex, '');
  }

  fs.writeFileSync(
    envFilePath,
    `${envFileContent}\n${Object.entries(envs).reduce(
      (a, [key, value]) => (a += `${key}=${value}\n`),
      ''
    )}`
  );
};

const getDefaultOrgName = async () => {
  return await platformUtils.getOrgId();
};

/**
 * check basic config validation
 */

const checkBasicConfigValidation = async (dicPath) => {
  try {
    const instanceFile = loadInstanceConfig(dicPath);

    if (!fse.existsSync(dicPath)) {
      console.log(`Serverless:${chalk.yellow(`指定的路径 ${dicPath} 不存在，请检查后重试`)}`);
      process.exit(1);
    }

    if (!instanceFile) {
      throw new Error('没有找到serverless配置文件，请检查。');
    }

    if (!instanceFile.name) {
      throw new Error('在serverless配置文件中没有发现实例名称("name"字段)，请检查。');
    }

    if (!instanceFile.component) {
      throw new Error('在serverless配置文件中没有发现组件类型("component"字段)，请检查。');
    }
    return instanceFile;
  } catch (e) {
    e.extraErrorInfo = {
      step: '无效的Serverless应用',
      source: 'Serverless::CLI',
    };
    throw e;
  }
};

/**
 * Reads a serverless instance config file in a given directory path
 * @param {*} directoryPath
 */
const loadTencentInstanceConfig = async (directoryPath, command) => {
  await checkBasicConfigValidation(directoryPath);
  let instanceFile = loadInstanceConfig(directoryPath);

  // if stage flag provided, overwrite
  if (args.stage) {
    instanceFile.stage = args.stage;
  }

  // if org flag provided, overwrite
  if (args.org) {
    instanceFile.org = args.org;
  }

  if (!instanceFile.org) {
    instanceFile.org = await getDefaultOrgName();
  }

  if (!instanceFile.org) {
    throw new Error('Missing "org" property in serverless.yml');
  }

  // if app flag provided, overwrite
  if (args.app) {
    instanceFile.app = args.app;
  }

  if (!instanceFile.app) {
    instanceFile.app = instanceFile.name;
  }

  // If user sets customized command inputs in yaml, need to insert them in yaml config
  if (instanceFile.commandInputs && instanceFile.commandInputs[command]) {
    instanceFile.inputs = mergeDeepRight(
      instanceFile.inputs || {},
      instanceFile.commandInputs[command]
    );
  }
  const cliInputs = parseCliInputs();

  instanceFile.inputs = mergeDeepRight(instanceFile.inputs || {}, cliInputs);

  if (instanceFile.inputs) {
    // load credentials to process .env files before resolving env variables
    await loadInstanceCredentials(instanceFile.stage);
    instanceFile = resolveVariables(instanceFile);
    if (instanceFile.inputs.src) {
      if (typeof instanceFile.inputs.src === 'string') {
        instanceFile.inputs.originSrc = instanceFile.inputs.src;
        instanceFile.inputs.src = path.resolve(directoryPath, instanceFile.inputs.src);
      } else if (typeof instanceFile.inputs.src === 'object') {
        if (instanceFile.inputs.src.src) {
          instanceFile.inputs.originSrc = instanceFile.inputs.src.src;
          instanceFile.inputs.src.src = path.resolve(directoryPath, instanceFile.inputs.src.src);
        }
        if (instanceFile.inputs.src.dist) {
          instanceFile.inputs.originDist = instanceFile.inputs.src.dist;
          instanceFile.inputs.src.dist = path.resolve(directoryPath, instanceFile.inputs.src.dist);
        }
      }
    }
  }

  return instanceFile;
};

/**
 * Gets the logged in user's token id, or access key if its in env
 */
const login = async (config = {}) => {
  if (config.useTencentCredential) {
    process.stdout.write(
      `使用授权信息 ${config.useTencentCredential} 授权中，如果需要使用临时密钥，请使用 --login 重新登陆\n`
    );
  }

  try {
    const [reLoggedIn, credentials] = await platformUtils.loginWithTencent(config);
    if (reLoggedIn) {
      const { secret_id: secretId, secret_key: secretKey, appid, token } = credentials;
      updateEnvFile({
        TENCENT_APP_ID: appid,
        TENCENT_SECRET_ID: secretId,
        TENCENT_SECRET_KEY: secretKey,
        TENCENT_TOKEN: token,
      });
    }
  } catch (e) {
    e.extraErrorInfo = {
      source: 'Tencent::Auth',
      step: '授权登陆',
    };
    throw e;
  }
};

/**
 * Load credentials from a ".env" or ".env.[stage]" file
 * @param {*} stage
 */
const loadInstanceCredentials = () => {
  // Load env vars TODO
  const envVars = {};

  // Known Provider Environment Variables and their SDK configuration properties
  const providers = {};

  // Tencent
  providers.tencent = {};
  providers.tencent.TENCENT_APP_ID = 'AppId';
  providers.tencent.TENCENT_SECRET_ID = 'SecretId';
  providers.tencent.TENCENT_SECRET_KEY = 'SecretKey';
  providers.tencent.TENCENT_TOKEN = 'Token';

  const credentials = {};

  for (const [providerName, provider] of Object.entries(providers)) {
    const providerEnvVars = provider;
    for (const [envVarName, envVarValue] of Object.entries(providerEnvVars)) {
      if (!credentials[providerName]) {
        credentials[providerName] = {};
      }
      // Proper environment variables override what's in the .env file
      if (process.env[envVarName] != null) {
        credentials[providerName][envVarValue] = process.env[envVarName];
      } else if (envVars[envVarName] != null) {
        credentials[providerName][envVarValue] = envVars[envVarName];
      }
      continue;
    }
  }

  return credentials;
};

const getDirForInvokeCommand = async (root, functionAlias) => {
  let instanceDir = root;
  const instances = [];

  const directories = fs
    .readdirSync(root)
    .filter((f) => fs.statSync(path.join(root, f)).isDirectory());

  for (const directory of directories) {
    const directoryPath = path.join(root, directory);

    const instanceYml = loadInstanceConfig(directoryPath);

    if (instanceYml) {
      const instanceYaml = await loadTencentInstanceConfig(directoryPath);
      const instanceInfo = {
        component: instanceYaml.component,
        directoryPath,
        functions: [],
      };
      if (
        instanceYaml.component === 'multi-scf' &&
        instanceYaml.inputs &&
        instanceYaml.inputs.functions &&
        typeof instanceYaml.inputs.functions === 'object'
      ) {
        instanceInfo.functions = Object.keys(instanceYaml.inputs.functions);
      }
      instances.push(instanceInfo);
    }
  }

  const multiScfInstances = instances.filter((instance) => instance.component === 'multi-scf');
  const scfInstances = instances.filter((instance) => instance.component === 'scf');
  if (scfInstances.length + multiScfInstances.length === 0) {
    throw new Error('没有找到可执行的函数目录，请使用 --target 指定或检查后再试');
  } else if (scfInstances.length === 1 && multiScfInstances.length === 0) {
    instanceDir = scfInstances[0].directoryPath;
  } else if (scfInstances.length === 0 && multiScfInstances.length === 1) {
    instanceDir = multiScfInstances[0].directoryPath;
  } else if (scfInstances.length === 0 && multiScfInstances.length > 1) {
    if (!functionAlias) {
      throw new Error('请使用 --function / -f 指定要调用的函数');
    }
    const instanceDirs = multiScfInstances.filter((instance) =>
      instance.functions.includes(functionAlias)
    );
    if (instanceDirs.length === 1) {
      instanceDir = instanceDirs[0].directoryPath;
    } else if (instanceDirs.length === 0) {
      throw new Error('未找到指定函数，请检查后重试');
    } else {
      throw new Error('发现同名函数，请通过 --target 指定要调用函数的目录');
    }
  } else {
    throw new Error('目录中存在多个 SCF 组件，请使用 --target 指定目录或检查后再试');
  }
  return instanceDir;
};

const getTemplate = async (root) => {
  const directories = fs
    .readdirSync(root)
    .filter((f) => fs.statSync(path.join(root, f)).isDirectory());

  const template = {
    name: path.basename(process.cwd()),
    org: null,
    app: null, // all components must explicitly set app property
    stage: null,
  };

  let componentDirectoryFound = false;
  for (const directory of directories) {
    const directoryPath = path.join(root, directory);

    const instanceYml = loadInstanceConfig(directoryPath);

    if (instanceYml) {
      componentDirectoryFound = true;
      const instanceYaml = await loadTencentInstanceConfig(directoryPath);

      const errorMessage = 'Template instances must use the same org, app & stage properties';

      if (template.org !== null && template.org !== instanceYaml.org) {
        throw new Error(errorMessage);
      }

      if (template.app !== null && template.app !== instanceYaml.app) {
        throw new Error(errorMessage);
      }

      if (template.stage !== null && template.stage !== instanceYaml.stage) {
        throw new Error(errorMessage);
      }

      template.org = instanceYaml.org;
      template.app = instanceYaml.app;
      template.stage = instanceYaml.stage;

      template[instanceYml.name] = instanceYaml;
    }
  }

  return componentDirectoryFound ? template : null;
};

const SSRComponents = ['nextjs', 'nuxtjs', 'express', 'flask', 'laravel', 'koa', 'egg'];
const getInstanceDashboardUrl = (instanceYaml) => {
  let dashboardUrl = `https://serverless.cloud.tencent.com/apps/${instanceYaml.app}/${instanceYaml.name}/${instanceYaml.stage}`;
  if (SSRComponents.includes(instanceYaml.component)) {
    dashboardUrl = `https://console.cloud.tencent.com/ssr/detail?stageName=${instanceYaml.stage}&appName=${instanceYaml.app}&instanceName=${instanceYaml.name}&stageList=${instanceYaml.stage}`;
  }
  return dashboardUrl;
};

const getTemplateDashboardUrl = (templateYaml) => {
  return `前往控制台查看应用详细信息: https://serverless.cloud.tencent.com/?q=${templateYaml.app}`;
};

const handleDebugLogMessage = (cli) => {
  return (evt) => {
    if (evt.event !== 'instance.run.logs') {
      return;
    }
    if (Array.isArray(evt.data.logs)) {
      evt.data.logs.forEach((log) => {
        // Remove strange formatting that comes from stderr
        if (log.data.startsWith("'")) {
          log.data = log.data.slice(1);
        }
        if (log.data.endsWith("'")) {
          log.data = log.data.slice(0, -1);
        }
        if (log.data.endsWith('\\n')) {
          log.data = log.data.slice(0, -2);
        }
        cli.log(log.data);
      });
    }
  };
};

const parseYaml = async (yamlPath) => {
  let yamlObj = YAML.safeLoad(await fse.readFile(yamlPath));
  if (!yamlObj) {
    yamlObj = {};
  }
  return yamlObj;
};

const saveYaml = async (yamlPath, yamlObj) => {
  if (!yamlObj || Object.keys(yamlObj) === 0) {
    await fse.remove(yamlPath);
    return;
  }
  const yamlContent = YAML.safeDump(yamlObj);
  await fse.writeFile(yamlPath, yamlContent);
};

const generateYMLForNodejsProject = async (cli) => {
  const getExpressYML = () => `
component: http
name: http-express
app: my-express-app-${uuidv1().split('-')[0]}

inputs:
  src:
    src: ./
    exclude:
      - .env
  faas:
    runtme: Nodejs12.16
    name: $\{name}
    framework: express
  apigw:
    protocols:
      - http
      - https
`;

  const getKoaYML = () => `
component: http
name: http-koa
app: my-koa-app-${uuidv1().split('-')[0]}

inputs:
  src:
    src: ./
    exclude:
      - .env
  faas:
    runtme: Nodejs12.16
    name: $\{name}
    framework: koa
  apigw:
    ignoreUpdate: true
    protocols:
      - http
      - https`;

  const getNextYML = () => `
component: http
name: http-nextjs
app: my-nextjs-app-${uuidv1().split('-')[0]}

inputs:
  src:
    dist: ./
    hook: npm run build
    exclude:
      - .env
  faas:
    runtime: Nodejs12.16
    framework: nextjs
    name: $\{name}
  apigw:
    protocols:
      - http
      - https
`;

  const getNuxtYML = () => `
component: http
name: http-nuxtjs
app: my-nuxtjs-app-${uuidv1().split('-')[0]}


inputs:
  src:
    dist: ./
    hook: npm run build
    exclude:
      - .env
  faas:
    runtime: Nodejs12.16
    framework: nuxtjs
    name: $\{name}
  apigw:
    protocols:
      - http
      - https`;

  const getEggYML = () => `
component: http
name: http-eggjs
app: my-eggjs-app-${uuidv1().split('-')[0]}

inputs:
  src:
    dist: ./
    exclude:
      - .env
  faas:
    runtime: Nodejs12.16
    framework: egg
    name: $\{name}
  apigw:
    protocols:
      - http
      - https`;

  const supportedComponents = ['express', 'koa', 'next', 'nuxt', 'egg'];
  const packageJsonFile = await fs.promises.readFile(
    path.join(process.cwd(), 'package.json'),
    'utf-8'
  );
  const packageObj = JSON.parse(packageJsonFile);

  if (!packageObj.dependencies) {
    throw new Error('当前目录未检测到 Serverless 配置文件');
  }

  const dependencies = Object.keys(packageObj.dependencies);
  const knownPackages = supportedComponents.filter((value) => dependencies.includes(value));

  if (knownPackages.length === 0) {
    throw new Error('当前目录未检测到 Serverless 配置文件');
  }

  // get yml type
  let ymlType;
  if (knownPackages.length === 1) {
    ymlType = knownPackages[0];
  } else if (knownPackages.length > 1) {
    const result = await inquirer.prompt({
      message: '在 package.json 里发现以下依赖，选择您希望创建的 serverless 的应用类型',
      type: 'list',
      name: 'ymlType',
      choices: knownPackages,
    });
    ymlType = result.ymlType;
  }

  if (ymlType === 'express' || ymlType === 'koa') {
    let entryFilePath = path.join(process.cwd(), 'app.js');
    const hasSlsJs = await fileExists(entryFilePath);
    if (!hasSlsJs) {
      const res = await inquirer.prompt({
        message: '未发现 app.js，请输入入口文件名称',
        type: 'input',
        name: 'entryFile',
      });
      entryFilePath = path.join(process.cwd(), res.entryFile);
    }

    const hasEntryFile = await fileExists(entryFilePath);

    if (!hasEntryFile) {
      throw new Error('未找到入口文件，请重试');
    }

    const entryFileRelativePath = path.relative(process.cwd(), entryFilePath);
    cli.log('');

    if (ymlType === 'express') return getExpressYML(entryFileRelativePath);
    return getKoaYML(entryFileRelativePath);
  }

  if (ymlType === 'next') {
    return getNextYML();
  }

  if (ymlType === 'nuxt') {
    return getNuxtYML();
  }

  // finally return egg's yml
  return getEggYML();
};

const clientUidDefaultPath = path.join(os.homedir(), '.serverless/tencent/client_uid-credentials');
// If current machine does not have an uuid, create and save it, or load  and finally return the value.
const writeClientUid = async (p = clientUidDefaultPath, options = {}) => {
  let res = {};
  try {
    if (!fse.existsSync(p)) {
      fse.ensureFileSync(p);
      res = {
        value: uuidv1(), // the value of client_uid
        downloadAt: Date.now(), // the created time of client_uid
        ...options,
      };
      writeJsonToCredentials(p, {
        client_uid: res,
      });
      const { sendToMetrics } = require('./telemtry/index');

      await sendToMetrics(res, {}, { initClientUid: true });
    } else {
      res = loadCredentialsToJson(p).client_uid;
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return res;
};

class ServerlessCLIError extends Error {
  constructor(message, extraErrorInfo = {}) {
    super(message);
    this.message = message;
    this.extraErrorInfo = { source: 'Serverless::CLI', ...extraErrorInfo };
  }
}

module.exports = {
  loadInstanceConfig: loadTencentInstanceConfig,
  loadInstanceCredentials,
  login,
  getDefaultOrgName,
  getDirForInvokeCommand,
  getTemplate,
  getInstanceDashboardUrl,
  getTemplateDashboardUrl,
  handleDebugLogMessage,
  parseYaml,
  saveYaml,
  generateYMLForNodejsProject,
  checkBasicConfigValidation,
  writeClientUid,
  clientUidDefaultPath,
  ServerlessCLIError,
};
