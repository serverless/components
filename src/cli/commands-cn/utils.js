'use strict';

/*
 * Serverless Components: Utilities
 */

const path = require('path');
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const { utils: platformUtils } = require('@serverless/platform-client-china');
const { loadInstanceConfig, resolveVariables, parseCliInputs, fileExists } = require('../utils');
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
 * Reads a serverless instance config file in a given directory path
 * @param {*} directoryPath
 */
const loadTencentInstanceConfig = async (directoryPath, command) => {
  let instanceFile = loadInstanceConfig(directoryPath);

  if (!instanceFile) {
    throw new Error('serverless config file was not found');
  }

  if (!instanceFile.name) {
    throw new Error('Missing "name" property in serverless.yml');
  }

  if (!instanceFile.component) {
    throw new Error('Missing "component" property in serverless.yml');
  }

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
const login = async () => {
  const [reLoggedIn, credentials] = await platformUtils.loginWithTencent();
  if (reLoggedIn) {
    const { secret_id: secretId, secret_key: secretKey, appid, token } = credentials;
    updateEnvFile({
      TENCENT_APP_ID: appid,
      TENCENT_SECRET_ID: secretId,
      TENCENT_SECRET_KEY: secretKey,
      TENCENT_TOKEN: token,
    });
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
  return `前往控制台查看应用详细信息: ${dashboardUrl}`;
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
  const getExpressYML = (entryFile) => `component: express
name: expressDemo
app: appDemo

inputs:${entryFile ? `\n  entryFile: ${entryFile}` : ''}
  src: ./
  region: ap-guangzhou
  runtime: Nodejs10.15
  apigatewayConf:
    protocols:
      - http
      - https
    environment: release
`;

  const getKoaYML = (entryFile) => `component: koa
name: koaDemo
app: appDemo

inputs:${entryFile ? `\n  entryFile: ${entryFile}` : ''}
  src: ./
  region: ap-guangzhou
  runtime: Nodejs10.15
  apigatewayConf:
    protocols:
      - http
      - https
    environment: release
`;

  const getNextYML = () => `component: nextjs
name: nextjsDemo
app: appDemo

inputs:
  src:
    dist: ./
    hook: npm run build
  region: ap-guangzhou
  runtime: Nodejs10.15
  apigatewayConf:
    protocols:
      - http
      - https
    environment: release
`;

  const getNuxtYML = () => `component: nuxtjs
name: nuxtjsDemo
app: appDemo

inputs:
  src:
    hook: npm run build
    dist: ./
  region: ap-guangzhou
  runtime: Nodejs10.15
  apigatewayConf:
    protocols:
      - http
      - https
    environment: release
`;

  const getEggYML = () => `component: egg
name: eggjsDemo
app: appDemo

inputs:
  src: ./
  region: ap-guangzhou
  runtime: Nodejs10.15
  apigatewayConf:
    protocols:
      - http
      - https
    environment: release
`;

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
    let entryFilePath = path.join(process.cwd(), 'sls.js');
    const hasSlsJs = await fileExists(entryFilePath);
    if (!hasSlsJs) {
      const res = await inquirer.prompt({
        message: '未发现 sls.js，请输入入口文件名称',
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
    cli.log(
      `提示: 为保证应用可以成功部署，需要您在入口文件中使用 module.exports 导出 ${ymlType} app，示例: module.exports = app;`,
      'green'
    );
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

  if (ymlType === 'egg') {
    return getEggYML();
  }

  throw new Error('当前目录未检测到 Serverless 配置文件');
};

module.exports = {
  loadInstanceConfig: loadTencentInstanceConfig,
  loadInstanceCredentials,
  login,
  getDefaultOrgName,
  getTemplate,
  getInstanceDashboardUrl,
  getTemplateDashboardUrl,
  handleDebugLogMessage,
  parseYaml,
  saveYaml,
  generateYMLForNodejsProject,
};
