'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const { downloadTemplate, copyDirContentsSync } = require('./utils');
const componentsResolver = require('./componentResolver');
const initTokenHandler = require('./initTokenHandler');

const spawn = require('child-process-ext/spawn');
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
    let templateUrl; let directory; let projectType; let serviceName; let commands; let tenantName; let tempDir;
    
    // If the user has a token, log them in, and fetch the template details
    if (cliParam.match(initTokenFormat)) {
      cli.status('Logging you in')
      ;({ templateUrl, directory, projectType, serviceName, commands, tenantName, tempDir } = await initTokenHandler(sdk, cliParam));
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

      // Github zips have a top-level directory and a subdirectory
      // with the actual code, prefixed by the branch name.
      // This cleans that up
      if (tempDir){
        // Move unzipped template to destination
        copyDirContentsSync(tempDir, servicePath);
        fs.removeSync(tempDir)
      }

      // Remove zip file
      fs.removeSync(zipFile);
      // CD
      process.chdir(servicePath);
      if (fs.existsSync('package.json')) {
        await spawn('npm', ['install'])
      }
      if (fs.existsSync('yarn.lock')) {
        await spawn('yarn', ['install'])
      }
      cli.status(`${newServiceName} successfully created in '${directory}' folder.`)
      if (projectType === 'components') {
        await componentsResolver(cli, tenantName, newServiceName, servicePath);
      }
    }
    return Promise.resolve(directory);
  },
};
