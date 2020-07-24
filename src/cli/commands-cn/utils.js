'use strict';

/*
 * Serverless Components: Utilities
 */

const path = require('path');
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const { utils: platformUtils } = require('@serverless/platform-client-china');
const { loadInstanceConfig, resolveVariables } = require('../utils');
const { mergeDeepRight } = require('ramda');

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
const loadTencentInstanceConfig = async (directoryPath) => {
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

  if (instanceFile.inputs) {
    // load credentials to process .env files before resolving env variables
    await loadInstanceCredentials(instanceFile.stage);
    instanceFile = resolveVariables(instanceFile);
    if (instanceFile.inputs.src) {
      if (typeof instanceFile.inputs.src === 'string') {
        instanceFile.inputs.src = path.resolve(directoryPath, instanceFile.inputs.src);
      } else if (typeof instanceFile.inputs.src === 'object') {
        if (instanceFile.inputs.src.src) {
          instanceFile.inputs.src.src = path.resolve(directoryPath, instanceFile.inputs.src.src);
        }
        if (instanceFile.inputs.src.dist) {
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

      if (template.org !== null && template.org !== instanceYaml.org) {
        throw new Error('Attempting to deploy multiple instances to multiple orgs');
      }

      if (template.app !== null && template.app !== instanceYaml.app) {
        throw new Error('Attempting to deploy multiple instances to multiple apps');
      }

      if (template.stage !== null && template.stage !== instanceYaml.stage) {
        throw new Error('Attempting to deploy multiple instances to multiple stages');
      }

      template.org = instanceYaml.org;
      template.app = instanceYaml.app;
      template.stage = instanceYaml.stage;

      template[instanceYml.name] = instanceYaml;
    }
  }

  return componentDirectoryFound ? template : null;
};

const getInstanceDashboardUrl = (instanceYaml) => {
  return `Full details: https://serverless.cloud.tencent.com/instances/${encodeURIComponent(
    `${instanceYaml.app}:${instanceYaml.stage}:${instanceYaml.name}`
  )}`;
};

const setInputsForCommand = (instanceYaml, command, config) => {
  if (instanceYaml.commandInputs) {
    const defaultInputs = command === 'deploy' ? instanceYaml.inputs : {};
    instanceYaml.inputs = instanceYaml.commandInputs[command] || defaultInputs;
  } else if (command !== 'deploy') {
    instanceYaml.inputs = {};
  }
  // merging inputs from command args, e.g. slcc deploy --inputs.src="./new-src"
  // will be merged into inputs.src
  if (config.inputs) {
    instanceYaml.inputs = mergeDeepRight(instanceYaml.inputs, config.inputs);
  }
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

module.exports = {
  loadInstanceConfig: loadTencentInstanceConfig,
  loadInstanceCredentials,
  login,
  getDefaultOrgName,
  getTemplate,
  getInstanceDashboardUrl,
  setInputsForCommand,
  handleDebugLogMessage,
};
