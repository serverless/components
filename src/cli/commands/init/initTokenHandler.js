'use strict';
const { get, set } = require('@serverless/utils/config');

/**
 * Fetches initToken from the backend
 * sets user information and accessKey
 * in ~/.serverlessrc
 * @param {*} sdk
 * @param {*} initToken
 */
module.exports = async (sdk, initToken) => {
  const { auth0Id, tenantName, idToken, userName, template } = await sdk.getInitToken(initToken);
  sdk.accessKey = idToken;

  const { projectType, directory, serviceName } = template;

  // Registry data doesn't have a link, we need to fetch the signed URL
  const registryData = await sdk.getFromRegistry(template.packageName);
  const templateUrl = registryData.downloadUrl;
  const type = registryData.type;

  set('userId', auth0Id);
  if (idToken) {
    if (!get(`users.${auth0Id}`)) {
      set(`users.${auth0Id}`, {
        username: userName,
        userId: auth0Id,
        dashboard: {
          username: userName,
          idToken,
        },
      });
    }
  }
  return { templateUrl, projectType, directory, serviceName, tenantName, type };
};
