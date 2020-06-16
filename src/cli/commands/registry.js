'use strict';

/*
 * CLI: Command: Registry
 */

const { ServerlessSDK } = require('@serverless/platform-client');
const path = require('path');
const { getAccessKey, isLoggedIn } = require('./utils');
const { loadServerlessFile, fileExists } = require('../utils');
const { getAgent } = require('@serverless/platform-client/src/utils');

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

  // Load serverless file
  const serverlessFile = await loadServerlessFile(process.cwd());

  if (serverlessFile.type === 'template' || (!serverlessFile.type && !serverlessFile.version)) {
    // if the user did not specify a type nor a version, it's a temlate
    serverlessFile.type = 'template';
  } else {
    serverlessFile.type = 'component';
  }

  // default version is dev
  if (!serverlessFile.version || config.dev) {
    serverlessFile.version = 'dev';
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
  }

  // log message in case of component
  let progressLogMsg = `Publishing component "${serverlessFile.name}@${serverlessFile.version}"...`;

  // log message in case of template
  if (serverlessFile.type === 'template') {
    progressLogMsg = `Publishing template "${serverlessFile.name}"...`;
  }

  // Presentation
  cli.logRegistryLogo();
  cli.log(progressLogMsg, 'grey');

  const sdk = new ServerlessSDK({ accessKey });

  // Publish
  cli.status('Publishing');

  try {
    await sdk.publishToRegistry(serverlessFile);
  } catch (error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '');
      cli.error(error.message, true);
    } else {
      throw error;
    }
  }

  // log message in case of component
  let successLogMsg = `Successfully published component "${serverlessFile.name}@${serverlessFile.version}".`;

  // log message in case of template
  if (serverlessFile.type === 'template') {
    successLogMsg = `Successfully published template "${serverlessFile.name}"...`;
  }

  cli.close('success', successLogMsg);
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
  const {
    type,
    description,
    author,
    repo,
    license,
    keywords,
    latestVersion,
    downloadUrl,
    versions,
  } = await sdk.getFromRegistry(packageName);

  if (type === 'component') {
    const devVersion = versions.indexOf('0.0.0-dev');
    if (devVersion !== -1) {
      versions.splice(devVersion, 1);
    }
  }

  cli.logRegistryLogo();
  cli.log();
  cli.log(`Name: ${packageName}`);
  cli.log(`Type: ${type}`);

  if (description) {
    cli.log(`Description: ${description}`);
  }

  if (keywords) {
    cli.log(`Keywords: ${keywords}`);
  }

  if (author) {
    cli.log(`Author: ${author}`);
  }

  if (license) {
    cli.log(`License: ${license}`);
  }

  if (repo) {
    cli.log(`Repo: ${repo}`);
  }

  if (type === 'component') {
    cli.log(`Latest Version: ${latestVersion}`);

    if (versions.length > 0) {
      cli.log();
      cli.log('Available Versions:');
      cli.log(`${versions.join(', ')}`);
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
