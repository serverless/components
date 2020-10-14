'use strict';

/*
 * CLI: Command: Registry
 * - Handles multiple commands related to the Registry.
 */

const { ServerlessSDK } = require('@serverless/platform-client');
const path = require('path');
const {
  promises: { readFile },
} = require('fs');
const {
  getAccessKey,
  getDefaultOrgName,
  getTemplate,
  isLoggedInOrHasAccessKey,
} = require('./utils');
const {
  fileExists,
  loadComponentConfig,
  loadTemplateConfig,
  validateNodeModules,
} = require('../utils');
const { loadServerlessFile } = require('../serverlessFile');
const { remove } = require('fs-extra');

/**
 * Publish a package to the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const publish = async (config, cli) => {
  // Ensure the user is logged in or access key is available, or advertise
  if (!isLoggedInOrHasAccessKey()) {
    cli.logAdvertisement();
    cli.sessionStop('error', 'Please log in by running "serverless login"');
    return null;
  }

  // Disable timer
  config.timer = false;

  // Start CLI persistance status
  cli.sessionStart('Initializing');

  // Get access key
  const accessKey = await getAccessKey();

  const serverlessTemplateFile = await loadTemplateConfig(process.cwd());
  const serverlessComponentFile = await loadComponentConfig(process.cwd());
  const serverlessFile = await loadServerlessFile(process.cwd());

  if (!serverlessTemplateFile && !serverlessComponentFile && !serverlessFile) {
    throw new Error(
      'Publish failed. The current working directory does not contain a "serverless.template.yml" or "serverless.component.yml"'
    );
  }

  let finalServerlessFile;

  if (serverlessComponentFile) {
    // Publishing a component
    finalServerlessFile = serverlessComponentFile;
    finalServerlessFile.src = serverlessComponentFile.src || serverlessComponentFile.main;
    finalServerlessFile.type = 'component';
  } else {
    // Publishing a template
    finalServerlessFile = serverlessTemplateFile || serverlessFile;
    finalServerlessFile.type = 'template';
  }

  // fall back to service name for framework v1
  finalServerlessFile.name = finalServerlessFile.name || finalServerlessFile.service;

  // default version is dev
  if (!finalServerlessFile.version || config.dev) {
    finalServerlessFile.version = 'dev';
  }

  finalServerlessFile.org = finalServerlessFile.org || (await getDefaultOrgName());

  if (!finalServerlessFile.org) {
    throw new Error('"org" property is required in serverless.yml');
  }

  // cwd is the default src
  if (!finalServerlessFile.src) {
    finalServerlessFile.src = process.cwd();
  }

  // validate serverless.js & node_modules if component
  if (finalServerlessFile.type === 'component') {
    const serverlessJsFilePath = path.resolve(
      process.cwd(),
      finalServerlessFile.src,
      'serverless.js'
    );

    if (!(await fileExists(serverlessJsFilePath))) {
      throw new Error(
        'no "serverless.js" file was found in the current working directory, or the "src" directory you specified.'
      );
    }

    // make sure user ran "npm install" if applicable
    await validateNodeModules(finalServerlessFile.src);
  } else {
    // validate the template
    await getTemplate(process.cwd());
  }

  // log message in case of component
  let initialStatus = `Publishing "${finalServerlessFile.name}@${finalServerlessFile.version}" to the Serverless Framework Registry`;

  // log message in case of template
  if (finalServerlessFile.type === 'template') {
    initialStatus = `Publishing "${finalServerlessFile.name}" to the Serverless Framework Registry`;
  }

  // Presentation
  cli.logRegistryLogo();

  const sdk = new ServerlessSDK({ accessKey });

  const readmeFilePath = path.join(process.cwd(), 'README.md');
  if (await fileExists(readmeFilePath)) {
    finalServerlessFile.readme = await readFile(readmeFilePath, 'utf-8');
  }

  // silently remove @serverless/core to avoid conflict with components v1
  // if it already does not exist, it just moves on
  const coreDependencyPath = path.join(
    finalServerlessFile.src,
    'node_modules',
    '@serverless',
    'core'
  );
  await remove(coreDependencyPath);

  // Publish
  cli.sessionStatus(initialStatus);

  try {
    await sdk.publishToRegistry(finalServerlessFile);
    // log message in case of component
    let successLogMsg = `Successfully published "${finalServerlessFile.name}@${finalServerlessFile.version}" to the Serverless Framework Registry.`;

    // log message in case of template
    if (finalServerlessFile.type === 'template') {
      successLogMsg = `Successfully published "${finalServerlessFile.name}" to the Serverless Framework Registry`;
    }

    cli.sessionStop('success', successLogMsg);
  } catch (error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '');
      throw new Error(error.message);
    } else {
      throw error;
    }
  }

  return null;
};

/**
 * Unpublishes a package from the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const unpublish = async (config, cli) => {
  // Ensure the user is logged in or access key is available, or advertise
  if (!isLoggedInOrHasAccessKey()) {
    cli.logAdvertisement();
    cli.sessionStop('error', 'Please log in by running "serverless login"');
    return null;
  }

  // Disable timer
  config.timer = false;

  // Start CLI persistance status
  cli.sessionStart('Initializing');

  const res = await Promise.all([getAccessKey(), loadServerlessFile(process.cwd())]);

  const accessKey = res[0];

  let serverlessFile = res[1];

  if (!serverlessFile) {
    const serverlessComponentFile = await loadComponentConfig(process.cwd());

    // If no serverless.yml and no serverless.component.yml, there is nothing to unpublish in this cwd
    if (!serverlessFile && !serverlessComponentFile) {
      throw new Error(
        'Unpublish failed. The current working directory does not contain a "serverless.yml" or "serverless.component.yml"'
      );
    }

    serverlessFile = serverlessComponentFile;
  } else if (serverlessFile.version || serverlessFile.type === 'component') {
    throw new Error(
      'Unpublish failed. Components could only be defined with a "serverless.component.yml" file.'
    );
  }

  // fall back to service name for framework v1
  serverlessFile.name = serverlessFile.name || serverlessFile.service;

  // default version is dev
  if (!serverlessFile.version || config.dev) {
    serverlessFile.version = 'dev';
  }

  serverlessFile.org = serverlessFile.org || (await getDefaultOrgName());

  if (!serverlessFile.org) {
    throw new Error('"org" property is required in your config file');
  }

  // log message in case of component
  let initialStatus = `Unpublishing "${serverlessFile.name}@${serverlessFile.version}" from the Serverless Framework Registry`;

  // log message in case of template
  if (serverlessFile.type === 'template') {
    initialStatus = `Unpublishing "${serverlessFile.name}" from the Serverless Framework Registry`;
  }

  // Presentation
  cli.logRegistryLogo();

  const sdk = new ServerlessSDK({ accessKey });

  // Unpublish
  cli.sessionStatus(initialStatus);

  try {
    await sdk.unpublishFromRegistry(serverlessFile);
    // log message in case of component
    let successLogMsg = `Successfully unpublished "${serverlessFile.name}@${serverlessFile.version}" from the Serverless Framework Registry.`;

    // log message in case of template
    if (serverlessFile.type === 'template') {
      successLogMsg = `Successfully unpublished "${serverlessFile.name}" from the Serverless Framework Registry`;
    }

    cli.sessionStop('success', successLogMsg);
  } catch (error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '');
      throw new Error(error.message);
    } else {
      throw error;
    }
  }

  return null;
};

/**
 * Get a Component from the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const get = async (config, cli) => {
  const packageName = config.params[0];

  // Start CLI persistance status
  cli.sessionStart(`Fetching "${packageName}" from the Serverless Framework Registry`);

  const sdk = new ServerlessSDK();

  let data;

  try {
    data = await sdk.getFromRegistry(packageName);
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      throw new Error(`"${packageName}" is not published in the Serverless Framework Registry`);
    }
    throw error;
  }

  // for backward compatability
  if (data.componentDefinition) {
    data = { ...data, ...data.componentDefinition };
    data.type = 'component';
  }

  if (data.type === 'component') {
    const devVersion = data.versions.indexOf('0.0.0-dev');
    if (devVersion !== -1) {
      data.versions.splice(devVersion, 1);
    }
  }

  cli.logRegistryLogo();
  cli.log();
  cli.log(`Name: ${packageName}`);
  cli.log(`Type: ${data.type}`);

  if (data.description) {
    cli.log(`Description: ${data.description}`);
  }

  if (data.keywords) {
    cli.log(`Keywords: ${data.keywords}`);
  }

  if (data.license) {
    cli.log(`License: ${data.license}`);
  }

  if (data.repo) {
    cli.log(`Repo: ${data.repo}`);
  }

  if (data.type === 'component') {
    cli.log(`Latest Version: ${data.version}`);

    if (data.versions.length > 0) {
      cli.log();
      cli.log('Available Versions:');
      cli.log(`${data.versions.join(', ')}`);
    }
  }

  cli.sessionStop('success', `"${packageName}" fetched from the Serverless Framework Registry`);

  return null;
};

/**
 * List Featured
 * @param {*} config
 * @param {*} cli
 */
const listFeatured = async (config, cli) => {
  cli.logRegistryLogo();
  cli.log();

  cli.log('Run "serverless init <package>" to install a template...');
  cli.log();

  cli.log('• fullstack-app - https://github.com/serverless-components/fullstack-app', 'grey');
  cli.log(
    '• express-starter - https://github.com/serverless-components/express/tree/master/templates/express-starter',
    'grey'
  );
  cli.log(
    '• react-starter - https://github.com/serverless-components/website/tree/master/templates/react-starter',
    'grey'
  );
  cli.log(
    '• graphql-starter - https://github.com/serverless-components/graphql/tree/master/templates/graphql-starter',
    'grey'
  );
  cli.log(
    '• aws-lambda-starter - https://github.com/serverless-components/aws-lambda/tree/master/templates/aws-lambda-starter',
    'grey'
  );
  cli.log(
    '• aws-dynamodb-starter - https://github.com/serverless-components/aws-dynamodb/tree/master/templates/aws-dynamodb-starter',
    'grey'
  );
  cli.log(
    '• aws-iam-role-starter - https://github.com/serverless-components/aws-iam-role/tree/master/templates/aws-iam-role-starter',
    'grey'
  );
  cli.log(
    '• aws-lambda-layer-starter - https://github.com/serverless-components/aws-lambda-layer/tree/master/templates/aws-lambda-layer-starter',
    'grey'
  );
  cli.log();
  cli.log('Find more here: https://github.com/serverless-components', 'grey');
  cli.log();
};

/**
 * Route Registry Command
 */
module.exports = async (config, cli) => {
  if (!config.params[0]) {
    return await listFeatured(config, cli);
  }
  if (config.params[0] === 'publish') {
    return await publish(config, cli);
  }
  if (config.params[0] === 'unpublish') {
    return await unpublish(config, cli);
  }
  return await get(config, cli);
};
