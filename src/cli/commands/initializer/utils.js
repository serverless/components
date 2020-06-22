'use strict';
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

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
  downloadTemplate,
};
