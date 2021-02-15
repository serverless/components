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

const createSlsFile = async (dir, componentName) => {
  const envDestination = path.resolve(dir, 'serverless.yml');
  const envConfig = `component: ${componentName}\ninputs:\n`;
  await fs.writeFile(envDestination, envConfig);
};
module.exports = {
  downloadTemplate,
  createSlsFile,
};
