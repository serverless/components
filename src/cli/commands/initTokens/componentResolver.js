'use strict';
const writeAttrs = require('./writeAttrs');

module.exports = async (cli, tenantName, newServiceName, servicePath) => {
  await writeAttrs(cli, servicePath, tenantName, newServiceName);
  cli.close('success', `cd to '${servicePath}' and run 'serverless dev' to get started developing!`)
};
