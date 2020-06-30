'use strict';

/*
 * CLI: Command: Registry
 */

const { ServerlessSDK } = require('@serverless/platform-client');
const path = require('path');
const {
  promises: { readFile },
} = require('fs');
const { getAccessKey, isLoggedIn, getDefaultOrgName, getTemplate } = require('./utils');
const { loadServerlessFile, fileExists, loadComponentConfig } = require('../utils');

/**
 * Publish a Component to the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const publish = async (config, cli) => {
  // Disable timer
  config.timer = false;

  // Start CLI persistance status
  cli.start('Initializing');

  // Get access key
  const accessKey = await getAccessKey();

  // Ensure the user is logged in or access key is available, or advertise
  if (!accessKey && !isLoggedIn()) {
    cli.advertise();
  }

  let serverlessFile = await loadServerlessFile(process.cwd());

  if (!serverlessFile) {
    // keeping serverless.component.yml for backward compatability
    const serverlessComponentFile = await loadComponentConfig(process.cwd());
    serverlessFile = serverlessComponentFile;
    serverlessFile.src = serverlessComponentFile.main;
  }

  if (serverlessFile.type === 'template' || (!serverlessFile.type && !serverlessFile.version)) {
    // if the user did not specify a type nor a version, it's a template
    serverlessFile.type = 'template';
  } else {
    serverlessFile.type = 'component';
  }

  // fall back to service name for framework v1
  serverlessFile.name = serverlessFile.name || serverlessFile.service;

  // default version is dev
  if (!serverlessFile.version || config.dev) {
    serverlessFile.version = 'dev';
  }

  serverlessFile.org = serverlessFile.org || (await getDefaultOrgName());

  if (!serverlessFile.org) {
    throw new Error('The "org" property is required');
  }

  // cwd is the default src
  if (!serverlessFile.src) {
    serverlessFile.src = process.cwd();
  }

  // validate serverless.js if component
  if (serverlessFile.type === 'component') {
    const serverlessJsFilePath = path.resolve(process.cwd(), serverlessFile.src, 'serverless.js');

    if (!(await fileExists(serverlessJsFilePath))) {
      throw new Error('no serverless.js file was found in the "src" directory you specified.');
    }
  } else {
    // validate the template
    await getTemplate(process.cwd());
  }

  // log message in case of component
  let progressLogMsg = `Publishing "${serverlessFile.name}@${serverlessFile.version}"...`;

  // log message in case of template
  if (serverlessFile.type === 'template') {
    progressLogMsg = `Publishing "${serverlessFile.name}"...`;
  }

  // Presentation
  cli.logRegistryLogo();
  cli.log(progressLogMsg, 'grey');

  const sdk = new ServerlessSDK({ accessKey });

  const readmeFilePath = path.join(process.cwd(), 'README.md');
  if (await fileExists(readmeFilePath)) {
    serverlessFile.readme = await readFile(readmeFilePath, 'utf-8');
  }

  // Publish
  cli.status('Publishing');

  try {
    await sdk.publishToRegistry(serverlessFile);
    // log message in case of component
    let successLogMsg = `Successfully published "${serverlessFile.name}@${serverlessFile.version}".`;

    // log message in case of template
    if (serverlessFile.type === 'template') {
      successLogMsg = `Successfully published "${serverlessFile.name}"...`;
    }

    cli.close('success', successLogMsg);
  } catch (error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '');
      cli.error(error.message, true);
    } else {
      throw error;
    }
  }
};

/**
 * Get a Component from the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const get = async (config, cli) => {
  const packageName = config.params[0];

  // Start CLI persistance status
  cli.start(`Fetching data for: ${packageName}`);

  const sdk = new ServerlessSDK();
  let data = await sdk.getFromRegistry(packageName);

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

  cli.close('success', `Package data listed for "${packageName}"`);
};

/**
 * List Featured
 * @param {*} config
 * @param {*} cli
 */
const listFeatured = async (config, cli) => {
  cli.logRegistryLogo();
  cli.log();

  cli.log('Featured Components:');
  cli.log();
  cli.log('  express - https://github.com/serverless-components/express');
  cli.log('  website - https://github.com/serverless-components/website');
  cli.log('  aws-lambda - https://github.com/serverless-components/aws-lambda');
  cli.log('  aws-dynamodb - https://github.com/serverless-components/aws-dynamodb');
  cli.log('  aws-iam-role - https://github.com/serverless-components/aws-iam-role');
  cli.log('  aws-lambda-layer - https://github.com/serverless-components/aws-lambda-layer');
  cli.log();
  cli.log('Find more here: https://github.com/serverless-components');
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
  return await get(config, cli);
};
