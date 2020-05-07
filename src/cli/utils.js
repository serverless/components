'use strict';

/*
 * Serverless Components: Utilities
 */

const {
  contains,
  isNil,
  last,
  split,
  merge,
  endsWith,
  memoizeWith,
  identity,
  isEmpty,
} = require('ramda');
const path = require('path');
const axios = require('axios');
const globby = require('globby');
const AdmZip = require('adm-zip');
const fse = require('fs-extra');
const YAML = require('js-yaml');
const traverse = require('traverse');
const { Graph, alg } = require('graphlib');

/**
 * Wait for a number of miliseconds
 * @param {*} wait
 */
const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait));

/**
 * Make HTTP API requests, easily
 * @param {*} options.endpoint
 * @param {*} options.data
 * @param {*} options.accessKey
 * @param {*} options.method
 */
const request = async (options) => {
  const requestOptions = {
    url: options.endpoint,
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: options.data,
  };

  if (options.accessKey) {
    requestOptions.headers.authorization = `Bearer ${options.accessKey}`;
  }

  let res;
  try {
    res = await axios(requestOptions);
  } catch (error) {
    if (error.response && error.response.status && error.response.data.message) {
      throw new Error(`${error.response.status} - ${error.response.data.message}`);
    }
    throw error;
  }
  return res.data;
};

/**
 * Checks if a file exists
 * @param {*} filePath
 */
const fileExistsSync = (filePath) => {
  try {
    const stats = fse.lstatSync(filePath);
    return stats.isFile();
  } catch (e) {
    return false;
  }
};

/**
 * Checks if a file exists
 * @param {*} filePath
 */
const fileExists = async (filePath) => {
  try {
    const stats = await fse.lstat(filePath);
    return stats.isFile();
  } catch (error) {
    return false;
  }
};

/**
 * Determines if a given file path is a YAML file
 * @param {*} filePath
 */
const isYamlPath = (filePath) => endsWith('.yml', filePath) || endsWith('.yaml', filePath);

/**
 * Determines if a given file path is a JSON file
 * @param {*} filePath
 */
const isJsonPath = (filePath) => endsWith('.json', filePath);

/**
 * Reads a file on the file system
 * @param {*} filePath
 * @param {*} options
 */
const readFileSync = (filePath, options = {}) => {
  if (!fileExistsSync(filePath)) {
    throw new Error(`File does not exist at this path ${filePath}`);
  }

  const contents = fse.readFileSync(filePath, 'utf8');
  if (isJsonPath(filePath)) {
    return JSON.parse(contents);
  } else if (isYamlPath(filePath)) {
    return YAML.load(contents.toString(), merge(options, { filename: filePath }));
  } else if (filePath.endsWith('.slsignore')) {
    return contents.toString().split('\n');
  }
  return contents.toString().trim();
};

/**
 * Resolves any variables that require resolving before the engine.
 * This currently supports only ${env}.  All others should be resolved within the deployment engine.
 * @param {*} inputs
 */
const resolveVariables = (inputs) => {
  const regex = /\${(\w*:?[\w\d.-]+)}/g;
  let variableResolved = false;
  const resolvedInputs = traverse(inputs).forEach(function (value) {
    const matches = typeof value === 'string' ? value.match(regex) : null;
    if (matches) {
      let newValue = value;
      for (const match of matches) {
        // Search for ${env:}
        if (/\${env:(\w*[\w.-_]+)}/g.test(match)) {
          const referencedPropertyPath = match.substring(2, match.length - 1).split(':');
          newValue = process.env[referencedPropertyPath[1]];
          variableResolved = true;
          if (match === value) {
            newValue = process.env[referencedPropertyPath[1]];
          } else {
            newValue = value.replace(match, process.env[referencedPropertyPath[1]]);
          }
        }
      }
      this.update(newValue);
    }
  });
  if (variableResolved) {
    return resolveVariables(resolvedInputs);
  }
  return resolvedInputs;
};

/**
 * Reads a serverless component config file in a given directory path
 * @param {*} directoryPath
 */
const loadComponentConfig = (directoryPath) => {
  directoryPath = path.resolve(directoryPath);
  const ymlFilePath = path.join(directoryPath, 'serverless.component.yml');
  const yamlFilePath = path.join(directoryPath, 'serverless.component.yaml');
  const jsonFilePath = path.join(directoryPath, 'serverless.component.json');
  let filePath;
  let isYaml = false;
  let componentFile;

  // Check to see if exists and is yaml or json file
  if (fileExistsSync(ymlFilePath)) {
    filePath = ymlFilePath;
    isYaml = true;
  }
  if (fileExistsSync(yamlFilePath)) {
    filePath = yamlFilePath;
    isYaml = true;
  }
  if (fileExistsSync(jsonFilePath)) {
    filePath = jsonFilePath;
  }
  if (!filePath) {
    throw new Error(
      'The serverless.component file could not be found in the current working directory.'
    );
  }

  // Read file
  if (isYaml) {
    try {
      componentFile = readFileSync(filePath);
    } catch (e) {
      // todo currently our YAML parser does not support
      // CF schema (!Ref for example). So we silent that error
      // because the framework can deal with that
      if (e.name !== 'YAMLException') {
        throw e;
      }
    }
  } else {
    componentFile = readFileSync(filePath);
  }

  return componentFile;
};

const getDirSize = async (p) => {
  return fse.stat(p).then((stat) => {
    if (stat.isFile()) {
      return stat.size;
    } else if (stat.isDirectory()) {
      return fse
        .readdir(p)
        .then((entries) => Promise.all(entries.map((e) => getDirSize(path.join(p, e)))))
        .then((e) => e.reduce((a, c) => a + c, 0));
    }
    return 0; // can't take size of a stream/symlink/socket/etc
  });
};

/**
 * Package files into a zip
 * @param {*} inputDirPath
 * @param {*} outputFilePath
 * @param {*} include
 * @param {*} exclude
 */
const pack = async (inputDirPath, outputFilePath, include = [], exclude = []) => {
  const format = last(split('.', outputFilePath));

  if (!contains(format, ['zip', 'tar'])) {
    throw new Error('Please provide a valid format. Either a "zip" or a "tar"');
  }

  const patterns = ['**/*'];

  if (!isNil(exclude)) {
    exclude.forEach((excludedItem) => patterns.push(`!${excludedItem}`));
  }

  const zip = new AdmZip();

  const files = (await globby(patterns, { cwd: inputDirPath })).sort();

  if (files.length === 0) {
    throw new Error('The provided directory is empty and cannot be packaged');
  }

  files.forEach((file) => {
    if (file === path.basename(file)) {
      zip.addLocalFile(path.join(inputDirPath, file));
    } else {
      zip.addLocalFile(path.join(inputDirPath, file), path.dirname(file));
    }
  });

  if (include && include.length) {
    include.forEach((filePath) => zip.addLocalFile(path.resolve(filePath)));
  }

  zip.writeZip(outputFilePath);

  return outputFilePath;
};

const getInstanceDashboardUrl = (instanceYaml) => {
  let dashboardRoot = 'https://dashboard.serverless.com';
  if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
    dashboardRoot = 'https://dashboard.serverless-dev.com';
  }

  const dashboardUrl = `${dashboardRoot}/tenants/${instanceYaml.org}/applications/${instanceYaml.app}/component/${instanceYaml.name}/stage/${instanceYaml.stage}/overview`;

  return dashboardUrl;
};

/**
 * Reads a serverless instance config file in a given directory path
 * @param {*} directoryPath
 */
const loadInstanceConfig = memoizeWith(identity, (directoryPath) => {
  directoryPath = path.resolve(directoryPath);
  const ymlFilePath = path.join(directoryPath, 'serverless.yml');
  const yamlFilePath = path.join(directoryPath, 'serverless.yaml');
  const jsonFilePath = path.join(directoryPath, 'serverless.json');
  let filePath;
  let isYaml = false;
  let instanceFile;

  // Check to see if exists and is yaml or json file
  if (fileExistsSync(ymlFilePath)) {
    filePath = ymlFilePath;
    isYaml = true;
  }
  if (fileExistsSync(yamlFilePath)) {
    filePath = yamlFilePath;
    isYaml = true;
  }
  if (fileExistsSync(jsonFilePath)) {
    filePath = jsonFilePath;
  }

  if (!filePath) {
    return null;
  }

  // Read file
  if (isYaml) {
    try {
      instanceFile = readFileSync(filePath);
    } catch (e) {
      // todo currently our YAML parser does not support
      // CF schema (!Ref for example). So we silent that error
      // because the framework can deal with that
      if (e.name !== 'YAMLException') {
        throw e;
      } else {
        throw new Error(`The serverless.yml file has icorrect format. Details: ${e.message}`);
      }
    }
  } else {
    instanceFile = readFileSync(filePath);
  }

  // Set default stage
  if (!instanceFile.stage) {
    instanceFile.stage = 'dev';
  }

  if (!instanceFile.app) {
    instanceFile.app = instanceFile.name;
  }

  return instanceFile;
});

/**
 * THIS IS USED BY SFV1.  DO NOT MODIFY OR DELETE
 */
const legacyLoadInstanceConfig = (directoryPath) => {
  directoryPath = path.resolve(directoryPath);
  const ymlFilePath = path.join(directoryPath, 'serverless.yml');
  const yamlFilePath = path.join(directoryPath, 'serverless.yaml');
  const jsonFilePath = path.join(directoryPath, 'serverless.json');
  let filePath;
  let isYaml = false;
  let instanceFile;

  // Check to see if exists and is yaml or json file
  if (fileExistsSync(ymlFilePath)) {
    filePath = ymlFilePath;
    isYaml = true;
  }
  if (fileExistsSync(yamlFilePath)) {
    filePath = yamlFilePath;
    isYaml = true;
  }
  if (fileExistsSync(jsonFilePath)) {
    filePath = jsonFilePath;
  }

  if (!filePath) {
    throw new Error(`The following file could not be found: ${filePath}`);
  }

  // Read file
  if (isYaml) {
    try {
      instanceFile = readFileSync(filePath);
    } catch (e) {
      // todo currently our YAML parser does not support
      // CF schema (!Ref for example). So we silent that error
      // because the framework can deal with that
      if (e.name !== 'YAMLException') {
        throw e;
      }
    }
  } else {
    instanceFile = readFileSync(filePath);
  }

  return instanceFile;
};

/**
 * THIS IS USED BY SFV1.  DO NOT MODIFY OR DELETE
 */
const legacyLoadComponentConfig = (directoryPath) => {
  directoryPath = path.resolve(directoryPath);
  const ymlFilePath = path.join(directoryPath, 'serverless.component.yml');
  const yamlFilePath = path.join(directoryPath, 'serverless.component.yaml');
  const jsonFilePath = path.join(directoryPath, 'serverless.component.json');
  let filePath;
  let isYaml = false;
  let componentFile;

  // Check to see if exists and is yaml or json file
  if (fileExistsSync(ymlFilePath)) {
    filePath = ymlFilePath;
    isYaml = true;
  }
  if (fileExistsSync(yamlFilePath)) {
    filePath = yamlFilePath;
    isYaml = true;
  }
  if (fileExistsSync(jsonFilePath)) {
    filePath = jsonFilePath;
  }
  if (!filePath) {
    throw new Error(
      'The serverless.component file could not be found in the current working directory.'
    );
  }

  // Read file
  if (isYaml) {
    try {
      componentFile = readFileSync(filePath);
    } catch (e) {
      // todo currently our YAML parser does not support
      // CF schema (!Ref for example). So we silent that error
      // because the framework can deal with that
      if (e.name !== 'YAMLException') {
        throw e;
      }
    }
  } else {
    componentFile = readFileSync(filePath);
  }

  return componentFile;
};

const possibleConfigurationFiles = [
  'serverless.yml',
  'serverless.yaml',
  'serverless.json',
  'serverless.js',
  'serverless.component.yml',
  'serverless.component.yaml',
  'serverless.component.json',
];

const isProjectPath = async (inputPath) => {
  for (const configurationFile of possibleConfigurationFiles) {
    if (await fse.pathExists(path.join(inputPath, configurationFile))) {
      return true;
    }
  }
  return false;
};

const runningTemplate = (root) => {
  const directories = fse
    .readdirSync(root)
    .filter((f) => fse.statSync(path.join(root, f)).isDirectory());

  let isTemplateDirectory = true;

  for (const directory of directories) {
    const directoryPath = path.join(root, directory);

    const instanceYml = loadInstanceConfig(directoryPath);

    // if no yaml file found, or not a component yaml file
    // then it's not a template directory
    if (!instanceYml || !instanceYml.component) {
      isTemplateDirectory = false;
    }
  }

  // if cwd does not have subdirectories, then it's not a temlate directory
  if (directories.length === 0) {
    isTemplateDirectory = false;
  }

  return isTemplateDirectory;
};

const getOutputs = (allComponentsWithOutputs) => {
  const outputs = {};

  for (const [instanceName, component] of Object.entries(allComponentsWithOutputs)) {
    outputs[instanceName] = component.outputs;
  }

  return outputs;
};

const validateGraph = (graph) => {
  const isAcyclic = alg.isAcyclic(graph);
  if (!isAcyclic) {
    const cycles = alg.findCycles(graph);
    let msg = ['Your template has circular dependencies:'];
    cycles.forEach((cycle, index) => {
      let fromAToB = cycle.join(' --> ');
      fromAToB = `${(index += 1)}. ${fromAToB}`;
      const fromBToA = cycle.reverse().join(' <-- ');
      const padLength = fromAToB.length + 4;
      msg.push(fromAToB.padStart(padLength));
      msg.push(fromBToA.padStart(padLength));
    }, cycles);
    msg = msg.join('\n');
    throw new Error(msg);
  }
};

const getAllComponents = (template = {}) => {
  const { org, app, stage } = template;
  // todo specify org, app, stage...etc
  const allComponents = {};

  for (const [key, value] of Object.entries(template)) {
    if (value && value.component) {
      allComponents[key] = {
        name: key,
        component: value.component,
        org,
        app,
        stage,
        inputs: value.inputs || {},
      };
    }
  }

  return allComponents;
};

const setDependencies = (allComponents) => {
  const regex = /\${output:(\w*[-_${}:\w.]+)}/g;

  for (const component of Object.values(allComponents)) {
    const dependencies = traverse(component.inputs).reduce((accum, value) => {
      const matches = typeof value === 'string' ? value.match(regex) : null;
      if (matches) {
        for (const match of matches) {
          const splittedVariableString = match.substring(2, match.length - 1).split(':');
          const referencedInstanceString =
            splittedVariableString[splittedVariableString.length - 1];

          const referencedInstanceName = referencedInstanceString.split('.')[0];

          if (allComponents[referencedInstanceName] && !accum.includes(referencedInstanceName)) {
            accum.push(referencedInstanceName);
          }
        }
      }
      return accum;
    }, []);

    component.dependencies = dependencies;
  }

  return allComponents;
};

const createGraph = (allComponents, command) => {
  const graph = new Graph();

  for (const [instanceName, component] of Object.entries(allComponents)) {
    graph.setNode(instanceName, component);
  }

  for (const [instanceName, component] of Object.entries(allComponents)) {
    const { dependencies } = component;
    if (!isEmpty(dependencies)) {
      for (const dependency of dependencies) {
        if (command === 'remove') {
          graph.setEdge(dependency, instanceName);
        } else {
          graph.setEdge(instanceName, dependency);
        }
      }
    }
  }

  validateGraph(graph);

  return graph;
};

const executeGraph = async (allComponents, command, graph, cli, sdk, credentials, options) => {
  const leaves = graph.sinks();

  if (isEmpty(leaves)) {
    return allComponents;
  }

  const promises = [];

  for (const instanceName of leaves) {
    const fn = async () => {
      const instanceYaml = allComponents[instanceName];

      if (command === 'remove') {
        const instance = await sdk.remove(instanceYaml, credentials, options);
        allComponents[instanceName].outputs = instance.outputs || {};
      } else {
        const instance = await sdk.deploy(instanceYaml, credentials, options);

        const outputs = {};
        outputs[instanceName] = instance.outputs;

        if (!options.debug) {
          cli.log();
          cli.logOutputs(outputs);
        }

        allComponents[instanceName].outputs = instance.outputs || {};
      }
    };

    promises.push(fn());
  }

  await Promise.all(promises);

  for (const instanceName of leaves) {
    graph.removeNode(instanceName);
  }

  return executeGraph(allComponents, command, graph, cli, sdk, credentials, options);
};

module.exports = {
  sleep,
  request,
  fileExists,
  fileExistsSync,
  readFileSync,
  isYamlPath,
  isJsonPath,
  loadComponentConfig,
  resolveVariables,
  getDirSize,
  pack,
  getInstanceDashboardUrl,
  loadInstanceConfig,
  legacyLoadComponentConfig,
  legacyLoadInstanceConfig,
  isProjectPath,
  runningTemplate,
  getOutputs,
  getAllComponents,
  setDependencies,
  validateGraph,
  createGraph,
  executeGraph,
};
