'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const { downloadTemplate, createSlsFile } = require('./utils');
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
const run = async (cli, cliParam, customDir) => {
  cli.sessionStart('Fetching app configuration');
  let templateUrl;
  let directory;
  let serviceName;
  let tenantName;
  let type;

  // Tokens are prefixed with 'sf_'
  // If the string doesn't start with that,
  // look in the registry for a package
  if (cliParam.startsWith('sf_')) {
    cli.sessionStatus('Logging you in');
    try {
      ({ templateUrl, directory, serviceName, tenantName, type } = await initTokenHandler(
        sdk,
        cliParam
      ));
    } catch (error) {
      // Code doesn't exist
      if (error.response && error.response.status === 404) {
        throw new Error(`App token "${cliParam}" doesn't exist
        \nGo to https://app.serverless.com to generate a new app token`);
      }
      throw error;
    }
  } else {
    cli.sessionStatus('Fetching template from registry');
    let data;
    try {
      data = await sdk.getFromRegistry(cliParam);
    } catch (sdkError) {
      throw new Error(`Can't find package: "${cliParam}" in the Serverless Registry 
      \nRun "sls registry" to see featured packages...`);
    }
    directory = cliParam;
    serviceName = cliParam;
    templateUrl = data.downloadUrl;
    type = data.type;
  }

  if (customDir) {
    directory = customDir;
  }

  cli.sessionStatus('Unpacking your new app');
  // Create template directory
  try {
    await fs.mkdir(directory);
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(
        `Directory "${directory}" already exists. Please re-run init in a different directory`
      );
    }
    throw error;
  }
  const servicePath = path.resolve(process.cwd(), directory);
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
    cli.sessionStatus('Setting up your new app');
    // Recursively unpack each directory in a template
    // Set org attr in sls.yml for each
    await unpacker.unpack(servicePath, true);
  }
  return directory;
};

const init = async (config, cli) => {
  const maybeToken = config.params[0];
  const customDir = config.dir || config.d;
  if (!maybeToken) {
    throw new Error('"init" command requires either a token or package name from the Registry');
  }
  cli.logLogo();
  const serviceDir = await run(cli, config.params[0], customDir);
  if (serviceDir) {
    cli.sessionStop(
      'success',
      `Template successfully installed. Run "cd ${serviceDir} && serverless deploy" to get started...`
    );
  }
  return;
};

module.exports = init;
