const { readFile } = require('../../../src/utils')

async function parseYaml(filePath) {
  // TODO: replace with plain logic when @serverless/utils is removed
  return readFile(filePath, 'utf8')
}

module.exports = parseYaml
