/*
 * Serverless Components
 */

const { pick } = require('ramda')
const run = require('./core')
const Component = require('./core/programatic/serverless')
const allUtils = require('./utils')

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
  run,
  utils: pick(utilsToExport, allUtils),
  ...pick(utilsToExport, allUtils) // todo remove later when no components are using it. #430
}
