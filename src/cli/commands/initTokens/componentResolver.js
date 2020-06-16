'use strict';
const { writeMainAttrs, removeTemplateAttrs } = require('../../serverlessFile');

module.exports = async (cli, tenantName, newServiceName, servicePath) => {
  await writeMainAttrs(cli, servicePath, tenantName, newServiceName);
  await removeTemplateAttrs(cli, servicePath)
};
