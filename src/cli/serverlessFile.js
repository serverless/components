'use strict';

const path = require('path');

const { writeFile, readFile } = require('fs-extra');
const { fileExistsSync, readAndParseSync } = require('./utils');
/**
 *
 * Checks if a filename ends with yaml or yml
 * @param {*} filename
 */
const isYaml = (filename) => {
  return (filename && filename.endsWith('yaml')) || (filename && filename.endsWith('yml'));
};

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
  return filePath;
};

/**
 * Reads and parses a serverless config file (serverless.yml) in any format (yml, yaml, json), in a given directory path
 * @param {*} directoryPath
 */
const loadServerlessFile = (directoryPath) => {
  let configFile;
  const filePath = getServerlessFilePath(directoryPath);

  // If no filePath, the serverless config file does not exist
  if (!filePath) {
    return null;
  }

  // Read file, if it's yaml/yml
  if (isYaml(filePath)) {
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

/**
 * Writes an object to a sls file
 * @param {*} cli
 * @param {*} servicePath
 * @param {*} ymlObject
 */
const writeServerlessFile = async (cli, servicePath, slsConfig) => {
  const serverlessFileName = await getServerlessFilePath(servicePath);
  if (isYaml(serverlessFileName)) {
    try {
      await writeFile(serverlessFileName, slsConfig);
    } catch (error) {
      cli.error(`Cannot write serverless.yml file in ${servicePath}`);
      throw error;
    }
  }
};

/**
 * Util function to simply write service, app, and org. Service name optional for components.
 * @param {*} cli
 * @param {*} servicePath
 * @param {*} orgName
 * @param {*} appName
 * @param {*} serviceName
 */
const writeMainAttrs = async (cli, servicePath, orgName, appName, serviceName = null) => {
  const slsConfigPath = await getServerlessFilePath(servicePath);
  if (isYaml(slsConfigPath)) {
    let slsConfig = await readFile(slsConfigPath, 'utf8');

    if (slsConfig) {
      // we want the org at the top, so maintaining this order is important
      if (serviceName) {
        slsConfig = `service: ${serviceName}\n${slsConfig}`;
      }
      if (appName) {
        slsConfig = `app: ${appName}\n${slsConfig}`;
      }
      if (orgName) {
        slsConfig = `org: ${orgName}\n${slsConfig}`;
      }

      // replace extra new lines if they exist
      slsConfig = slsConfig.replace(/(\r\n|\r|\n){2,}/g, '$1\n');

      await writeServerlessFile(cli, servicePath, slsConfig);
    }
  }
};

const rootServerlessFileExists = (dir) => {
  const rootServerlessFilePath = path.resolve(dir, '..', 'serverless.yml');

  if (fileExistsSync(rootServerlessFilePath)) {
    return true;
  }

  return false;
};

const createRootServerlessFile = async (rootDir, serviceName, appName, orgName) => {
  const rootServerlessYmlPath = path.join(rootDir, 'serverless.yml');

  let rootServerlessYml = `app: ${appName}`;

  // if org name is specified, set it
  if (orgName) {
    rootServerlessYml = `${rootServerlessYml}\norg: ${orgName}`;
  }

  await writeFile(rootServerlessYmlPath, rootServerlessYml);
};

module.exports = {
  writeMainAttrs,
  loadServerlessFile,
  writeServerlessFile,
  getServerlessFilePath,
  rootServerlessFileExists,
  createRootServerlessFile,
};
