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
const initTokenFormat = /[a-zA-Z0-9]{8}/;

module.exports = {
  async run(cli, cliParam) {
    cli.start('Fetching project configuration')
    let templateUrl; let directory; let serviceName; let tenantName;
    
    // If the user has a token, log them in, and fetch the template details
    if (cliParam.match(initTokenFormat)) {
      cli.status('Logging you in')
      ;({ templateUrl, directory, serviceName, tenantName } = await initTokenHandler(sdk, cliParam));
    } else {
      // Otherwise, just fetch the template by name from the registry.
      cli.status('Fetching template from registry')
      const data = await sdk.getFromRegistry(cliParam);
      directory = cliParam
      serviceName = cliParam
      templateUrl = data.downloadUrl
    }

    if (templateUrl) {
      cli.status('Unpacking your new project')
      const newServiceName = serviceName;
      // Create template directory
      fs.mkdirSync(directory);
      const servicePath = path.resolve(process.cwd(), directory);

      // Fetch template zip
      const zipFile = await downloadTemplate(templateUrl, servicePath);
      // Unzip
      const zip = new AdmZip(zipFile);
      zip.extractAllTo(servicePath);

      // Remove zip file
      fs.removeSync(zipFile);
      const unpacker = new Unpacker(cli, tenantName, serviceName)
      cli.status('Setting up your new project')
      // Recursively unpack each directory in a template
      // Set org attr in sls.yml for each
      await unpacker.unpack(servicePath)
      cli.status(`${newServiceName} successfully created in '${directory}' folder.`)
    }
    return Promise.resolve(directory);
  },
};
