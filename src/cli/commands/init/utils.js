'use strict';
const fs = require('fs-extra');
const got = require('got');
const { promisify } = require('util')
const path = require('path');
const pipelineShim = require('stream.pipeline-shim');

const pipeline = promisify(pipelineShim);

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

module.exports = {
  downloadTemplate,
};
