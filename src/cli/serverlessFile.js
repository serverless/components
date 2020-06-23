'use strict';

const path = require('path');
const yaml = require('js-yaml');

const { writeFile } = require('fs-extra');
const { fileExistsSync, readAndParseSync } = require('./utils');

const getServerlessFilePath = (directoryPath) => {
  directoryPath = path.resolve(directoryPath);
  const ymlFilePath = path.join(directoryPath, 'serverless.yml');
  const yamlFilePath = path.join(directoryPath, 'serverless.yaml');
  const jsonFilePath = path.join(directoryPath, 'serverless.json');
  const jsFilePath = path.join(directoryPath, 'serverless.js');
  let filePath;

  // Check to see if exists and is yaml or json file
  if (fileExistsSync(ymlFilePath)) {
    filePath = ymlFilePath;
  }
  if (fileExistsSync(yamlFilePath)) {
    filePath = yamlFilePath;
  }
  if (fileExistsSync(jsonFilePath)) {
    filePath = jsonFilePath;
  }
  if (fileExistsSync(jsFilePath)) {
    filePath = jsFilePath;
  }
  if (!filePath) {
    return null;
  }
  return filePath
}

/**
 * Reads a serverless config file in a given directory path
 * @param {*} directoryPath
 */
const loadServerlessFile = (directoryPath) => {

  let configFile
  const filePath = getServerlessFilePath(directoryPath)
  // Read file, if it's yaml/yml
  if (filePath && filePath.endsWith('yaml') || filePath && filePath.endsWith('yml')) {
    try {
      configFile = readAndParseSync(filePath);
    } catch (e) {
      // todo currently our YAML parser does not support
      // CF schema (!Ref for example). So we silent that error
      // because the framework can deal with that
      if (e.name !== 'YAMLException') {
        throw e;
      }
    }
  } else {
    configFile = readAndParseSync(filePath);
  }

  return configFile;
};

const writeServerlessFile = async (cli, servicePath, ymlObject) => {
  const serverlessFileName = await getServerlessFilePath(servicePath);
  if (serverlessFileName) {
    try {
      await writeFile(serverlessFileName, yaml.safeDump(ymlObject))
    } catch (error) {
      cli.error(`Cannot write serverless.yml file in ${servicePath}`);
      throw error;
    }
  }
}

const writeMainAttrs = async (cli, servicePath, orgName, appName, serviceName = null) => {
  const ymlObject = await loadServerlessFile(servicePath)
  if (ymlObject) {
    if (orgName) ymlObject.org = orgName;
    if (appName) ymlObject.app = appName;
    if (serviceName) ymlObject.service = serviceName;
    
    await writeServerlessFile(cli, servicePath, ymlObject);
  }
}

module.exports = {
  writeMainAttrs,
  loadServerlessFile,
  writeServerlessFile,
  getServerlessFilePath,
}
