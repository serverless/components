const { readFile } = require('@serverless/utils')

async function parseJson(filePath) {
  // TODO: replace with plain logic when @serverless/utils is removed
  return readFile(filePath, 'utf8')
}

module.exports = parseJson