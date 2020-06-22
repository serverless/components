'use strict'
const { get, set } = require('@serverless/utils/config');

module.exports = async (sdk, initToken) => {
  const { auth0Id, tenantName, secretAccessKey, userName, template } = await sdk.getInitToken(
    initToken
  );
  sdk.accessKey = secretAccessKey;

  const { projectType, directory, serviceName } = template;

  // Registry data doesn't have a link, we need to fetch the signed URL
  const registryData = await sdk.getFromRegistry(template.packageName)
  const templateUrl = registryData.downloadUrl;
  

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
  return { templateUrl, projectType, directory, serviceName, tenantName }
}
