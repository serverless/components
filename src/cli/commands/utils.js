'use strict';

/*
 * Serverless Components: Utilities
 */

const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const { ServerlessSDK } = require('@serverless/platform-client');
const configUtils = require('@serverless/utils/config');
const accountUtils = require('@serverless/utils/account');

const { readdirSync, statSync } = require('fs');
const { join, basename } = require('path');

const {
  loadInstanceConfig,
  loadInstanceConfigUncached,
  resolveVariables,
  parseCliInputs,
} = require('../utils');

const { mergeDeepRight } = require('ramda');

/**
 * Get the URL of the Serverless Framework Dashboard
 * @param {string} urlPath a url path to add to the hostname
 */
const getDashboardUrl = (urlPath) => {
  if (urlPath && urlPath.charAt(0) !== '/') {
    urlPath = `/${urlPath}`;
  }

  if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
    return `https://app.serverless-dev.com${urlPath || ''}`;
  }
  return `https://app.serverless.com${urlPath || ''}`;
};

/**
 * Get default org name by fetching all Orgs and picking the first one which the user is the owner of
 */
const getDefaultOrgName = async () => {
  const res = configUtils.getConfig();

  if (!res.userId || !res.users || !res.users[res.userId] || !res.users[res.userId].dashboard) {
    return null;
  }

  let { defaultOrgName } = res.users[res.userId].dashboard;

  // if defaultOrgName is not in RC file, fetch it from the platform
  if (!defaultOrgName) {
    const sdk = new ServerlessSDK();
    await accountUtils.refreshToken(sdk);

    const { username, idToken, userId } = configUtils.getLoggedInUser();
    sdk.config({ accessKey: idToken });
    const orgsList = await sdk.listOrgs(username);

    // filter by owner
    const filteredOrgsList = orgsList.filter((org) => org.role === 'owner');

    defaultOrgName = filteredOrgsList[0].orgName;

    configUtils.set(`users.${userId}.dashboard.defaultOrgName`, defaultOrgName);
  }

  return defaultOrgName;
};

/**
 * Reads a serverless instance config file in a given directory path
 * @param {*} directoryPath
 */
const loadVendorInstanceConfig = async (directoryPath, options = { disableCache: false }) => {
  let instanceFile = options.disableCache
    ? loadInstanceConfigUncached(directoryPath)
    : loadInstanceConfig(directoryPath);

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

  const cliInputs = parseCliInputs();

  instanceFile.inputs = mergeDeepRight(instanceFile.inputs || {}, cliInputs);

  if (instanceFile.inputs) {
    instanceFile = resolveVariables(instanceFile);

    if (instanceFile.inputs.src) {
      if (typeof instanceFile.inputs.src === 'object') {
        if (instanceFile.inputs.src.src) {
          instanceFile.inputs.src.src = path.resolve(directoryPath, instanceFile.inputs.src.src);
        }
        if (instanceFile.inputs.src.dist) {
          instanceFile.inputs.src.dist = path.resolve(directoryPath, instanceFile.inputs.src.dist);
        }
      } else {
        instanceFile.inputs.src = path.resolve(directoryPath, instanceFile.inputs.src);
      }
    }
  }

  // give early feedback to people who are trying to use plugins with components
  if (instanceFile.plugins) {
    throw new Error(
      'Serverless Framework plugins are not supported by Serverless Components. Please remove the "plugins" property and try again'
    );
  }

  return instanceFile;
};

/**
 * Check whether the user is logged in or has an Access Key as an environment variable.  Returns true or false.
 */
const isLoggedInOrHasAccessKey = () => {
  let result = isLoggedIn();
  if (!result) {
    if (process.env.SERVERLESS_ACCESS_KEY) {
      result = true;
    }
  }
  return result;
};

/**
 * Check whether the user is logged in
 */
const isLoggedIn = () => {
  return Boolean(configUtils.getLoggedInUser());
};

/**
 * Gets the logged in user's token id, or access key if its in env
 */
const getAccessKey = async (org = null) => {
  // if access key in env, use that for CI/CD
  if (process.env.SERVERLESS_ACCESS_KEY) {
    return process.env.SERVERLESS_ACCESS_KEY;
  }

  if (!isLoggedIn()) {
    return null;
  }

  // refresh token if it's expired.
  // this accountUtils method returns immediately if the idToken did not expire
  // if it did expire, it'll refresh it and update the config file
  await accountUtils.refreshToken(new ServerlessSDK());

  const loggedInUser = configUtils.getLoggedInUser();

  if (!loggedInUser) {
    return null;
  }

  if (loggedInUser.accessKeys && loggedInUser.accessKeys[org]) {
    return loggedInUser.accessKeys[org];
  }
  return loggedInUser.idToken;
};

const getTemplate = async (root) => {
  const directories = readdirSync(root).filter((f) => statSync(join(root, f)).isDirectory());

  const template = {
    name: basename(process.cwd()),
    org: null,
    app: null, // all components must explicitly set app property
    stage: null,
  };

  let componentDirectoryFound = false;
  for (const directory of directories) {
    const directoryPath = join(root, directory);

    const instanceYml = loadInstanceConfig(directoryPath);

    if (instanceYml) {
      componentDirectoryFound = true;
      const instanceYaml = await loadVendorInstanceConfig(directoryPath);

      const errorMessage = 'Template instances must use the same org & stage properties';

      if (template.org !== null && template.org !== instanceYaml.org) {
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

module.exports = {
  getDashboardUrl,
  loadInstanceConfig: loadVendorInstanceConfig,
  getTemplate,
  getAccessKey,
  isLoggedIn,
  isLoggedInOrHasAccessKey,
  getDefaultOrgName,
};
