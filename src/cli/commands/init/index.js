'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const { downloadTemplate, writeEnvFile, createSlsFile } = require('./utils');
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
const run = async (cli, cliParam) => {
  cli.start('Fetching app configuration');
  let templateUrl;
  let directory;
  let serviceName;
  let tenantName;
  let type;

  // Tokens are prefixed with 'sf_'
  // If the string doesn't start with that,
  // look in the registry for a package
  if (cliParam.startsWith('sf_')) {
    cli.status('Logging you in');
    try {
      ({ templateUrl, directory, serviceName, tenantName, type } = await initTokenHandler(
        sdk,
        cliParam
      ));
    } catch (error) {
      // Code doesn't exist
      if (error.response && error.response.status === 404) {
        cli.close(
          'error',
          `App token '${cliParam}' doesn't exist
          \nGo to https://app.serverless.com to generate a new app token`
        );
        return null;
      }
      throw error;
    }
  } else {
    cli.status('Fetching template from registry');
    let data;
    try {
      data = await sdk.getFromRegistry(cliParam);
    } catch (sdkError) {
      cli.close(
        'error',
        `Can't find template: ${cliParam}, run 'sls registry' to see available templates.`
      );
      return null;
    }
    directory = cliParam;
    serviceName = cliParam;
    templateUrl = data.downloadUrl;
    type = data.type;
  }
  cli.status('Unpacking your new app');
  // Create template directory
  try {
    await fs.mkdir(directory);
  } catch (error) {
    if (error.code === 'EEXIST') {
      cli.close(
        'error',
        `Directory ${directory} already exists. Please re-run init in a different directory`
      );
      return null;
    }
    throw error;
  }
  const servicePath = path.resolve(process.cwd(), directory);
  await writeEnvFile(directory);
  /**
   * If the package is a component, don't pull the source code
   * Instead, create an empty sls.yml (with component filled out)
   * Otherwise, fetch and extract the package
   */
  if (type === 'component') {
    await createSlsFile(directory, cliParam);
  } else {
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
};

const init = async (config, cli) => {
  const maybeToken = config.params[0];
  if (!maybeToken) {
    cli.close('error', 'init command requires either a token or template URL');
    return;
  }
  cli.logLogo();
  const serviceDir = await run(cli, config.params[0]);
  if (serviceDir) {
    cli.close(
      'close',
      `Template successfully installed. Run 'cd ${serviceDir} && serverless deploy' to get started`
    );
  }
  return;
};

module.exports = init;
