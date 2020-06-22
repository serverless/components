'use strict';
const { writeMainAttrs } = require('../../serverlessFile');
const getServerlessFilePath = require('../../getServerlessFilePath');

const path = require('path');

const yamlExtensions = new Set(['.yml', '.yaml']);

module.exports = async (cli, tenantName, newServiceName, servicePath) => {
  const serverlessFileName = await getServerlessFilePath(servicePath);
  if (yamlExtensions.has(path.extname(serverlessFileName))) {
    await writeMainAttrs(cli, servicePath, tenantName, newServiceName);
  }

};
