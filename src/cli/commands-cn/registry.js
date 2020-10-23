'use strict';

/*
 * CLI: Command: Registry
 */

const { ServerlessSDK } = require('@serverless/platform-client-china');
const { v4: uuidv4 } = require('uuid');
const utils = require('./utils');
const { loadComponentConfig, loadTemplateConfig } = require('../utils');
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

  // We want to check the existence of serverless.template.yml and serverless.component.yml first
  // If both of them did not show up, we will check serverless.yml for backward compatibility
  // Why not check the existence of serverless.yml first? serverless.template.yml and serverless.yml may be in the same folder
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
    finalServerlessFile.src = serverlessComponentFile.main;
    finalServerlessFile.type = 'component';
  } else {
    // Publishing a template
    finalServerlessFile = serverlessTemplateFile || serverlessFile;
    finalServerlessFile.type = 'template';
    finalServerlessFile.version = '0.0.0';
  }

  // fall back to service name for framework v1
  finalServerlessFile.name = finalServerlessFile.name || finalServerlessFile.service;

  // If "--dev" flag is used, set the version the API expects
  // default version is dev
  if (!finalServerlessFile.version || config.dev) {
    finalServerlessFile.version = 'dev';
  }

  finalServerlessFile.org = finalServerlessFile.org || (await utils.getDefaultOrgName());

  // Presentation
  cli.logRegistryLogo();
  cli.log(
    `Publishing "${finalServerlessFile.name}@${
      config.dev ? 'dev' : finalServerlessFile.version
    }"...`,
    'grey'
  );

  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });

  // Publish
  cli.sessionStatus('Publishing');

  let registryPackage;
  try {
    registryPackage = await sdk.publishPackage(finalServerlessFile);
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

  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });
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
  cli.logRegistryLogo();

  const sdk = new ServerlessSDK({ context: { traceId: uuidv4() } });
  const { templates: featuredTemplates } = await sdk.listPackages(null, { isFeatured: true });

  if (featuredTemplates.length > 0) {
    cli.log();
    cli.log('Run "serverless init <package>" to install a template...');
    cli.log();
    for (const featuredTemplate of featuredTemplates) {
      let name = featuredTemplate.name;

      if (featuredTemplate['description-i18n'] && featuredTemplate['description-i18n']['zh-cn']) {
        name = `${name} - ${featuredTemplate['description-i18n']['zh-cn']}`;
      } else if (featuredTemplate.description) {
        name = `${name} - ${featuredTemplate.description}`;
      }

      cli.log(`• ${name}`, 'grey');
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
