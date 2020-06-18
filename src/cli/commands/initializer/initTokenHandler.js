'use strict'
const { get, set } = require('@serverless/utils/config');
const path = require('path');
const { parseGitHubURL }= require('./utils');

module.exports = async (sdk, initToken) => {
  const { auth0Id, tenantName, secretAccessKey, userName, template } = await sdk.getInitToken(
    initToken
  );
  sdk.accessKey = secretAccessKey;

  const { projectType, directory, serviceName, commands, type } = template;
  let templateUrl; let tempDir;

  if (type === 'registry') {
    // Registry data doesn't have a link, we need to fetch the signed URL
    const registryData = await sdk.getFromRegistry(template.packageName)
    templateUrl = registryData.downloadUrl;
  } else if (type === 'github') {
    const { url, repo, branch } = parseGitHubURL(template.url);
    templateUrl = url;
    tempDir = path.resolve(process.cwd(), directory, `${repo}-${branch}`);
  }

  set('userId', auth0Id);
  if (secretAccessKey) {
    if (!get(`users.${auth0Id}`)) {
      set(`users.${auth0Id}`, {
        username: userName,
        userId: auth0Id,
        dashboard: {
          username: userName,
          accessKeys: {},
        },
      })
    }
    set(`users.${auth0Id}.dashboard.accessKeys.${tenantName}`, secretAccessKey);
  }
  return { templateUrl, projectType, directory, serviceName, commands, tenantName, tempDir }
}
