const path = require('path')
const YAML = require('js-yaml')
const fse = require('fs-extra')
const isJsonPath = require('./isJsonPath')
const isYamlPath = require('./isYamlPath')

const formatContents = (filePath, contents, options) => {
  if (isJsonPath(filePath) && typeof contents !== 'string') {
    return JSON.stringify(contents, null, 2)
  }
  if (isYamlPath(filePath) && typeof contents !== 'string') {
    return YAML.dump(contents, options)
  }
  return contents
}

const writeFileSync = (filePath, contents = '', options = {}) => {
  fse.ensureDirSync(path.dirname(filePath))
  fse.writeFileSync(filePath, formatContents(filePath, contents, options))
}

module.exports = writeFileSync
