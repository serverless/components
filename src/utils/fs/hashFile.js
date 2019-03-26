const crypto = require('crypto')
const { readFile } = require('fs-extra')

const hashFile = async (filePath) =>
  crypto
    .createHash('sha256')
    .update(await readFile(filePath))
    .digest('base64')

module.exports = hashFile
