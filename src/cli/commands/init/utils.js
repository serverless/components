'use strict';
const fs = require('fs-extra');
const got = require('got');
const { promisify } = require('util');
const path = require('path');
const stream = require('stream');

const pipeline = promisify(stream.pipeline);

/**
 * Downloads a zip file into `template.zip`
 *
 * @param {*} url
 * @param {*} dir
 */
const downloadTemplate = async (url, dir) => {
  const zipDestination = path.resolve(dir, 'template.zip');
  const writer = fs.createWriteStream(zipDestination);

  await pipeline(got.stream(url), writer);
  return path.resolve(process.cwd(), zipDestination);
};

/**
 * Writes an empty .env file in the root directory of the app
 *
 * @param {*} dir
 */
const writeEnvFile = async (dir) => {
  const envDestination = path.resolve(dir, '.env');
  const envConfig =
    '# Learn more about about the credentials needed\n' +
    '# to deploy your app https://github.com/serverless/components#credentials\n\n' +
    '# AWS:\n' +
    '# AWS_ACCESS_KEY_ID=<your access key>\n' +
    '# AWS_SECRET_ACCESS_KEY=<your secret access key>\n';
  await fs.writeFile(envDestination, envConfig);
};

const createSlsFile = async (dir, componentName) => {
  const envDestination = path.resolve(dir, 'serverless.yml');
  const envConfig = `component: ${componentName}\ninputs:\n`;
  await fs.writeFile(envDestination, envConfig);
};
module.exports = {
  downloadTemplate,
  writeEnvFile,
  createSlsFile,
};
