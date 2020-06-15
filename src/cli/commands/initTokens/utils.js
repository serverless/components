'use strict';
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

const isNotSymbolicLink = (src) => !fs.lstatSync(src).isSymbolicLink();

const copyDirContentsSync = (srcDir, destDir, { noLinks = false } = {}) => {
  const copySyncOptions = {
    dereference: true,
    filter: noLinks ? isNotSymbolicLink : null,
  };
  fs.copySync(srcDir, destDir, copySyncOptions);
};

const parseGitHubURL = (url) => {
  const split = url.split('/');
  const branch = split.pop().split('.')[0];
  const owner = split[3];
  const repo = split[4];

  return {
    url,
    branch,
    owner,
    repo,
  };
};

const downloadTemplate = async (url, dir) => {
  const zipDestination = path.resolve(dir, 'template.zip');
  const writer = fs.createWriteStream(zipDestination);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      resolve(zipDestination);
    });
    writer.on('error', (error) => {
      reject(error);
    });
  });
};

module.exports = {
  copyDirContentsSync,
  parseGitHubURL,
  downloadTemplate,
};
