/*
 * Serverless Framework v2.0
 */

const { pick } = require('ramda')
const Component = require('./lib/component/serverless')
const utils = require('./utils')

// choose useful utils to export for component author
const utilsToExport = [
  'dirExists',
  'fileExists',
  'hashFile',
  'isArchivePath',
  'isJsonPath',
  'isYamlPath',
  'packDir',
  'parseFile',
  'readFile',
  'readFileIfExists',
  'writeFile',
  'sleep',
  'titelize'
]

module.exports = {
  Component,
  ...pick(utilsToExport, utils)
}
