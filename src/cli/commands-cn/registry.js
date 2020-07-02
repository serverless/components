'use strict';

/*
 * CLI: Command: Registry
 */

const { ServerlessSDK } = require('@serverless/platform-client-china');
const utils = require('./utils');
const { loadComponentConfig } = require('../utils');
const { loadServerlessFile } = require('../serverlessFile');

/**
 * Publish a Package(Component or Template) to the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const publish = async (config, cli) => {
  // Disable timer
  config.timer = false;

  // Start CLI persistance status
  cli.sessionStart('Initializing');

  await utils.login();

  // Load YAML and normalize
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
    serverlessFile.version = '0.0.0';
  } else {
    serverlessFile.type = 'component';
  }
  // fall back to service name for framework v1
  serverlessFile.name = serverlessFile.name || serverlessFile.service;
  // If "--dev" flag is used, set the version the API expects
  if (config.dev && serverlessFile.type === 'template') {
    serverlessFile.version = '0.0.0-dev';
  }
  serverlessFile.org = serverlessFile.org || (await utils.getDefaultOrgName());

  // Presentation
  cli.logRegistryLogo();
  cli.log(
    `Publishing "${serverlessFile.name}@${config.dev ? 'dev' : serverlessFile.version}"...`,
    'grey'
  );

  const sdk = new ServerlessSDK();

  // Publish
  cli.sessionStatus('Publishing');

  let registryPackage;
  try {
    registryPackage = await sdk.publishPackage(serverlessFile);
  } catch (error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '');
      cli.error(error.message, true);
    } else {
      throw error;
    }
  }

  if (registryPackage && registryPackage.version === '0.0.0-dev') {
    registryPackage.version = 'dev';
  }

  cli.sessionStop(
    'success',
    `Successfully published ${registryPackage.name}${
      registryPackage.type === 'template' ? '' : `@${registryPackage.version}`
    }`
  );
  return null;
};

/**
 * Get a registry package from the Serverless Registry
 * @param {*} config
 * @param {*} cli
 */
const getPackage = async (config, cli) => {
  const packageName = config.params[0];

  // Start CLI persistance status
  cli.sessionStart(`Fetching versions for: ${packageName}`);

  const sdk = new ServerlessSDK();
  const data = await sdk.getPackage(packageName);
  delete data.component;

  if (Object.keys(data).length === 0) {
    throw new Error(
      `Registry package "${packageName}" not found in the Serverless Framework Registry.`
    );
  }

  const devVersion = data.versions.indexOf('0.0.0-dev');
  if (devVersion !== -1) {
    data.versions.splice(devVersion, 1);
  }

  cli.logRegistryLogo();
  cli.log();
  cli.log(`${data.type === 'template' ? 'Template' : 'Component'}: ${packageName}`);
  cli.log(`Description: ${data.description}`);
  if (data.type !== 'template') {
    cli.log(`Latest Version: ${data.version}`);
  }
  if (data.author) {
    cli.log(`Author: ${data.author}`);
  }
  if (data.repo) {
    cli.log(`Repo: ${data.repo}`);
  }
  cli.log();
  if (data.type !== 'template') {
    cli.log('Available Versions:');
    cli.log(`${data.versions.join(', ')}`);
  } else {
    cli.log(`Download Link: ${data.downloadUrl}`);
  }

  cli.sessionStop('success', `Registry Package information listed for "${packageName}"`);
  return null;
};

/**
 * List Featured
 * @param {*} config
 * @param {*} cli
 */
const listFeatured = async (config, cli) => {
  cli.sessionStart('Loading');
  cli.logRegistryLogo();

  const sdk = new ServerlessSDK();
  const {
    components: featuredComponents,
    templates: featuredTemplates,
  } = await sdk.listPackages(null, { isFeatured: true });

  cli.log();

  if (featuredComponents.length > 0) {
    cli.log('Featured Components:');
    cli.log();
    for (const featuredComponent of featuredComponents) {
      cli.log(`  ${featuredComponent.componentName} - ${featuredComponent.repo}`);
    }
  }

  if (featuredTemplates.length > 0) {
    cli.log();
    cli.log();
    cli.log('Featured Templates:');
    cli.log();
    for (const featuredTemplate of featuredTemplates) {
      cli.log(`  ${featuredTemplate.name} - ${featuredTemplate.description}`);
    }
  }

  cli.sessionStop('close', 'Find more here: https://registry.serverless.com');
  return null;
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
  return await getPackage(config, cli);
};
