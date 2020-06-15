'use strict';

const { ServerlessSDK } = require('@serverless/platform-client');
const { get, set } = require('@serverless/utils/config');
const { copyDirContentsSync, parseGitHubURL, downloadTemplate } = require('./utils');
const v1Resolver = require('./v1Resolver');
const componentsResolver = require('./componentResolver');

const spawn = require('child-process-ext/spawn');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const path = require('path');

module.exports = {
  async run(cli, initToken) {
    cli.start('Fetching project configuration')
    const sdk = new ServerlessSDK({
      platformStage: process.env.SERVERLESS_PLATFORM_STAGE || 'prod',
    });
    const { auth0Id, tenantName, secretAccessKey, userName, template } = await sdk.getInitToken(
      initToken
    );
    sdk.accessKey = secretAccessKey;

    cli.status('Logging you in')
    set('userId', auth0Id);
    if (secretAccessKey) {
      if (!get(`configFile.users.${auth0Id}`)) {
        set(`configFile.users.${auth0Id}`, {
          username: userName,
          userId: auth0Id,
          dashboard: {
            username: userName,
            accessKeys: {},
          },
        })
      }
      set(`configFile.users.${auth0Id}.dashboard.accessKeys.${tenantName}`, secretAccessKey);
    }

    if (template.url && template.directory) {
      cli.status('Unpacking your new project')
      const newServiceName = template.serviceName;
      const { url, branch, repo } = parseGitHubURL(template.url);
      // Create template directory
      fs.mkdirSync(template.directory);
      const servicePath = path.resolve(process.cwd(), template.directory);

      // Fetch template zip
      const zipFile = await downloadTemplate(url, servicePath);
      // Unzip
      const zip = new AdmZip(zipFile);
      zip.extractAllTo(servicePath);
      const tempPath = path.resolve(servicePath, `${repo}-${branch}`);
      // Move unzipped template to destination
      copyDirContentsSync(tempPath, servicePath);
      // Remove zip file
      fs.removeSync(zipFile);
      // Remove temp dir
      fs.removeSync(tempPath);
      // CD
      process.chdir(servicePath);

      for (const { command, options } of template.commands) {
        await spawn(command, options);
      }
      cli.status(`${newServiceName} successfully created in '${template.directory}' folder.`)
      if (template.projectType === 'components') {
        await componentsResolver(cli, tenantName, newServiceName, servicePath);
      } else {
       // await v1Resolver(serverless, tenantName, newServiceName, servicePath, secretAccessKey);
      }
    }
    return Promise.resolve();
  },
};
