'use strict';

const path = require('path');
const yaml = require('js-yaml');

const { readFile, writeFile } = require('fs-extra');
const getServerlessFilePath = require('./getServerlessFilePath');

const yamlExtensions = new Set(['.yml', '.yaml']);

const loadServerlessFile = async (cli, servicePath) => {
  const serverlessFileName = await getServerlessFilePath(servicePath);

  const ymlObject = await (async () => {
    // Non YAML config
    if (!yamlExtensions.has(path.extname(serverlessFileName))){
      cli.error(`Unable to find serverless.yml file in ${servicePath}`)
      return false
    }
    try {
      return await yaml.safeLoad(await readFile(serverlessFileName));
    } catch (error) {
      cli.error(`Cannot read serverless.yml file in ${servicePath}`);
      throw error;
    }
  })();

  return ymlObject;
}

const writeServerlessFile = async (cli, servicePath, ymlObject) => {
  const serverlessFileName = await getServerlessFilePath(servicePath);
  try {
    await writeFile(serverlessFileName, yaml.safeDump(ymlObject))
  } catch (error) {
    cli.error(`Cannot write serverless.yml file in ${servicePath}`);
    throw error;
  }
}

const removeTemplateAttrs = async (cli, servicePath) => {
  const ymlObject = await loadServerlessFile(cli, servicePath)
  delete(ymlObject.author)
  delete(ymlObject.description)
  delete(ymlObject.keywords)
  delete(ymlObject.repo)
  delete(ymlObject.license)
  await writeServerlessFile(cli, servicePath, ymlObject);
}

const writeMainAttrs = async (cli, servicePath, orgName, appName, serviceName = null) => {
  const ymlObject = await loadServerlessFile(cli, servicePath)
  if (orgName) ymlObject.org = orgName;
  if (appName) ymlObject.app = appName;
  if (serviceName) ymlObject.service = serviceName;
  
  await writeServerlessFile(cli, servicePath, ymlObject);
}

module.exports = {
  writeMainAttrs,
  removeTemplateAttrs,
  loadServerlessFile,
  writeServerlessFile
}
