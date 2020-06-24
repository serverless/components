'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const { downloadTemplate } = require('./utils');
const initTokenHandler = require('./initTokenHandler');
const Unpacker = require('./unpacker');

const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const path = require('path');

const sdk = new ServerlessSDK({
  platformStage: process.env.SERVERLESS_PLATFORM_STAGE || 'prod',
});

/**
 * Ingests an initToken code or a package name, fetches it,
 * unpacks it, and installs its dependencies
 * @param {*} cli
 * @param {*} cliParams
 */
const run = async(cli, cliParam) => {
  cli.start('Fetching app configuration');
  let templateUrl;
  let directory;
  let serviceName;
  let tenantName;

  // packages and tokens are both strings. First see if the arg is a token
  // Then see if it's a package name in the registry
  try {
    cli.status('Logging you in');
    ({ templateUrl, directory, serviceName, tenantName } = await initTokenHandler(sdk, cliParam));
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Otherwise, just fetch the template by name from the registry.
      cli.status('Fetching template from registry');
      let data;
      try {
        data = await sdk.getFromRegistry(cliParam);
      } catch (sdkError) {
        cli.error(
          `Can't find template: ${cliParam}, run 'sls registry' to see available templates.`
        );
        return false;
      }
      directory = cliParam;
      serviceName = cliParam;
      templateUrl = data.downloadUrl;
    }
  }

  if (templateUrl) {
    cli.status('Unpacking your new app');
    // Create template directory
    await fs.mkdir(directory);
    const servicePath = path.resolve(process.cwd(), directory);

    // Fetch template zip
    const zipFile = await downloadTemplate(templateUrl, servicePath);
    // Unzip
    const zip = new AdmZip(zipFile);
    zip.extractAllTo(servicePath);

    // Remove zip file
    await fs.remove(zipFile);
    const unpacker = new Unpacker(cli, tenantName, serviceName);
    cli.status('Setting up your new app');
    // Recursively unpack each directory in a template
    // Set org attr in sls.yml for each
    await unpacker.unpack(servicePath);
  }
  return directory;
}

const init = async (config, cli) => {
  const maybeToken = config.params[0];
  if (!maybeToken) {
    cli.error('init command requires either a token or template URL');
  }
  cli.logLogo();
  cli.log();
  const serviceDir = await run(cli, config.params[0]);
  if (serviceDir) {
    cli.close('close', `run 'cd ${serviceDir} && serverless deploy' to get started!`);
  }
  return;
};

module.exports = init
