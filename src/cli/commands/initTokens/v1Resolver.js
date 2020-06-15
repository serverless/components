// 'use strict';
// const writeAttrs = require('../writeAttrs');
// const createAppWithDeploymentProfile = require('../createAppWithDeploymentProfile');

// module.exports = async (serverless, tenantName, newServiceName, servicePath, secretAccessKey) => {
//   const { inquirer } = serverless.interactiveCli;

//   serverless.config.servicePath = servicePath;
//   serverless.service.org = tenantName;
//   serverless.service.app = newServiceName;
//   await writeAttrs(serverless, tenantName, newServiceName, newServiceName);
//   await serverless.reInitialize();
//   await createAppWithDeploymentProfile(inquirer, tenantName, secretAccessKey, newServiceName);
// };
